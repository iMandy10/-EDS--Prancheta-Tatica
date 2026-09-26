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
