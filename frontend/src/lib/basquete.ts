import type { Modalidade } from './api'
import type { Peca } from '../types/cena'

// No basquete cada jogador tem posição fixa: A1/B1 é o PG, A2/B2 o SG e assim por diante.
export const POSICOES_BASQUETE = ['PG', 'SG', 'SF', 'PF', 'C'] as const

// Formato do dado arrastado do estojo para a quadra.
export const TIPO_ARRASTE_PECA = 'application/x-prancheta-peca'

// Onde cada peça entra quando o treinador só clica nela no estojo, sem arrastar.
export const POSICAO_PADRAO_BASQUETE: Record<string, { x: number; y: number }> = {
  A1: { x: 330, y: 250 }, A2: { x: 270, y: 110 }, A3: { x: 270, y: 390 }, A4: { x: 170, y: 170 }, A5: { x: 170, y: 330 },
  B1: { x: 470, y: 250 }, B2: { x: 530, y: 110 }, B3: { x: 530, y: 390 }, B4: { x: 630, y: 170 }, B5: { x: 630, y: 330 },
  bola: { x: 400, y: 250 },
}

export function rotuloPeca(peca: Peca, quadra: Modalidade): string {
  return quadra === 'basquete' && peca.tipo !== 'bola' ? peca.id.slice(1) : peca.id
}

export function descreverPeca(id: string, quadra: Modalidade): string {
  const posicao = POSICOES_BASQUETE[Number(id.slice(1)) - 1]
  return quadra === 'basquete' && /^[AB][1-5]$/.test(id) ? `${id} · ${posicao}` : id
}

// Folga entre a seta e a borda da peça; no fim, desconta também a ponta da seta, que passa do fim da linha.
export const FOLGA_INICIO_SETA = 3
export const FOLGA_FIM_SETA = 7

// Encurta a seta nas pontas para ela sair da borda da peça de origem e parar antes da borda
// do destino, sem entrar nas peças. Setas curtas demais para o recorte ficam como estão.
export function recortarSeta(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  recuoInicio: number,
  recuoFim: number,
) {
  const comprimento = Math.hypot(x2 - x1, y2 - y1)
  if (comprimento <= recuoInicio + recuoFim + 10) return { x1, y1, x2, y2 }
  const [ux, uy] = [(x2 - x1) / comprimento, (y2 - y1) / comprimento]
  return { x1: x1 + ux * recuoInicio, y1: y1 + uy * recuoInicio, x2: x2 - ux * recuoFim, y2: y2 - uy * recuoFim }
}

// A seta é livre, mas se a ponta cair na área de identificação de um jogador (o dobro do raio dele),
// o sistema entende que ele é o destino. A bola e a própria origem não contam; vale o mais próximo.
export const RAIO_IDENTIFICACAO = 32

export function jogadorNaArea(ponto: { x: number; y: number }, pecas: Peca[], origemId: string): Peca | undefined {
  const distancia = (peca: Peca) => Math.hypot(peca.x - ponto.x, peca.y - ponto.y)
  return pecas
    .filter((peca) => peca.tipo !== 'bola' && peca.id !== origemId && distancia(peca) <= RAIO_IDENTIFICACAO)
    .sort((a, b) => distancia(a) - distancia(b))[0]
}

// Posse de bola: a bola fica encostada ao lado de quem está com ela, sem cobrir o número.
const DESLOCAMENTO_BOLA = 13

export function aoLadoDoJogador(ponto: { x: number; y: number }) {
  return { x: ponto.x + DESLOCAMENTO_BOLA, y: ponto.y + DESLOCAMENTO_BOLA }
}

// Recoloca a bola ao lado de quem tem a posse (depois de mover ou remover jogadores).
export function acompanharPosse(pecas: Peca[]): Peca[] {
  return pecas.map((peca) => {
    if (peca.tipo !== 'bola' || !peca.posse) return peca
    const portador = pecas.find((outra) => outra.id === peca.posse)
    return portador ? { ...peca, ...aoLadoDoJogador(portador) } : { ...peca, posse: null }
  })
}

// Depois de a bola ser solta: fica com o jogador em cuja área ela caiu, ou solta onde está.
export function atribuirPosse(pecas: Peca[]): Peca[] {
  const bola = pecas.find((peca) => peca.tipo === 'bola')
  if (!bola) return pecas
  const jogador = jogadorNaArea(bola, pecas, bola.id)
  return acompanharPosse(pecas.map((peca) => (peca === bola ? { ...peca, posse: jogador?.id ?? null } : peca)))
}
