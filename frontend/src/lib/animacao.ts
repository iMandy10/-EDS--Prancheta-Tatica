import type { Acao, Cena, Peca } from '../types/cena'
import { agruparPorInstante } from './instantes'
import { aoLadoDoJogador, jogadorNaArea } from './basquete'

export const DURACAO_ACAO_MS = 1000

interface Ponto {
  x: number
  y: number
}

export interface Passo {
  acao: Acao
  pecaId: string
  de: Ponto
  para: Ponto
  instante: number
}

// Ações com a mesma ordem rodam juntas, num mesmo instante; os instantes rodam em ordem crescente.
// Cada instante parte das posições deixadas pelo anterior.
// No passe quem viaja é a bola, saindo da peça de origem (sem bola em quadra, o passe é ignorado);
// na movimentação e no bloqueio, a própria peça de origem; no drible, a peça de origem leva a bola junto.
// O passe mira onde o receptor termina o instante, então os deslocamentos do instante são resolvidos antes;
// com destino livre, o receptor é o jogador em cuja área de identificação a ponta cai.
// No basquete a bola tem posse: ela acompanha quem está com ela em qualquer deslocamento, só quem tem a
// posse passa ou dribla (as demais ações desse tipo são ignoradas) e o passe entrega a posse ao receptor.
export interface Simulacao {
  passos: Passo[]
  // Quem está com a bola e onde cada peça está depois de todas as ações.
  portador: string | null
  posicoes: Map<string, Ponto>
  // Onde a peça de origem de cada ação está quando a ação começa.
  inicios: Map<string, Ponto>
  // No basquete, o jogador identificado como destino de cada ação com destino livre.
  alvos: Map<string, string>
}

export function simular(cena: Cena): Simulacao {
  const posicoes = new Map(cena.pecas.map((peca) => [peca.id, { x: peca.x, y: peca.y }]))
  const bola = cena.pecas.find((peca) => peca.tipo === 'bola')
  const comPosse = cena.quadra === 'basquete'
  let portador = (comPosse && bola?.posse) || null
  const passos: Passo[] = []
  const inicios = new Map<string, Ponto>()
  const identificados = new Map<string, string>()

  // Jogador que recebe o passe: o destino, se for um jogador, ou quem tem a ponta na área de identificação.
  const receptor = (acao: Acao) => {
    if (cena.quadra !== 'basquete' || acao.tipo !== 'passe') return undefined
    const pecasAgora = cena.pecas.map((peca) => ({ ...peca, ...posicoes.get(peca.id) }))
    if (typeof acao.destino !== 'string') return jogadorNaArea(acao.destino, pecasAgora, acao.origem)
    return pecasAgora.find((peca) => peca.id === acao.destino && peca.tipo !== 'bola')
  }

  agruparPorInstante(cena.acoes).forEach((grupo, instante) => {
    const inicio = new Map(posicoes)
    const deslocamentos = grupo.filter((acao) => acao.tipo !== 'passe')
    const passes = grupo.filter((acao) => acao.tipo === 'passe')

    for (const acao of [...deslocamentos, ...passes]) {
      const de = inicio.get(acao.origem)
      const alvos = acao.tipo === 'passe' ? posicoes : inicio
      const recebedor = receptor(acao)
      const destino = typeof acao.destino === 'string' ? alvos.get(acao.destino) : acao.destino
      const para = recebedor ? posicoes.get(recebedor.id) : destino
      if (de) inicios.set(acao.id, { ...de })
      // O passe identifica quem está na área no fim do instante; as demais ações, quem está lá no início.
      const pontoLivre = typeof acao.destino === 'string' ? null : acao.destino
      if (comPosse && pontoLivre) {
        const pecasNoInicio = cena.pecas.map((peca) => ({ ...peca, ...inicio.get(peca.id) }))
        const alvo = acao.tipo === 'passe' ? recebedor : jogadorNaArea(pontoLivre, pecasNoInicio, acao.origem)
        if (alvo) identificados.set(acao.id, alvo.id)
      }
      if (!de || !para || (acao.tipo === 'passe' && !bola)) continue

      if (comPosse && bola) {
        const deBola = inicio.get(bola.id)
        if ((acao.tipo === 'passe' || acao.tipo === 'drible') && acao.origem !== portador) continue
        if (acao.tipo === 'passe') {
          const paraBola = recebedor ? aoLadoDoJogador(para) : para
          if (deBola) passos.push({ acao, pecaId: bola.id, de: { ...deBola }, para: paraBola, instante })
          posicoes.set(bola.id, paraBola)
          portador = recebedor?.id ?? null
          continue
        }
        passos.push({ acao, pecaId: acao.origem, de: { ...de }, para: { ...para }, instante })
        posicoes.set(acao.origem, { ...para })
        if (acao.origem === portador && deBola) {
          passos.push({ acao, pecaId: bola.id, de: { ...deBola }, para: aoLadoDoJogador(para), instante })
          posicoes.set(bola.id, aoLadoDoJogador(para))
        }
        continue
      }

      const pecaId = acao.tipo === 'passe' && bola ? bola.id : acao.origem
      passos.push({ acao, pecaId, de: { ...de }, para: { ...para }, instante })
      posicoes.set(pecaId, { ...para })
      if (acao.tipo === 'drible' && bola && pecaId !== bola.id) {
        passos.push({ acao, pecaId: bola.id, de: { ...de }, para: { ...para }, instante })
        posicoes.set(bola.id, { ...para })
      }
    }
  })

  return { passos, portador, posicoes, inicios, alvos: identificados }
}

export function montarPassos(cena: Cena): Passo[] {
  return simular(cena).passos
}

// Quem está com a bola depois de todas as ações da cena (null = bola solta ou sem posse).
export function portadorAoFinal(cena: Cena): string | null {
  return simular(cena).portador
}

// As peças como ficam depois de todas as ações; no basquete, a bola com quem a tem por último.
export function estadoFinal(cena: Cena, simulacao = simular(cena)): Peca[] {
  return cena.pecas.map((peca) => ({
    ...peca,
    ...simulacao.posicoes.get(peca.id),
    ...(peca.tipo === 'bola' && cena.quadra === 'basquete' ? { posse: simulacao.portador } : {}),
  }))
}

export function contarInstantes(passos: Passo[]): number {
  return passos.length === 0 ? 0 : passos[passos.length - 1].instante + 1
}

function suavizar(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export function posicoesNoTempo(pecas: Peca[], passos: Passo[], tempoMs: number): Peca[] {
  const posicoes = new Map(pecas.map((peca) => [peca.id, { x: peca.x, y: peca.y }]))

  passos.forEach((passo) => {
    const t = Math.min(Math.max((tempoMs - passo.instante * DURACAO_ACAO_MS) / DURACAO_ACAO_MS, 0), 1)
    if (t === 0) return
    const s = suavizar(t)
    posicoes.set(passo.pecaId, {
      x: passo.de.x + (passo.para.x - passo.de.x) * s,
      y: passo.de.y + (passo.para.y - passo.de.y) * s,
    })
  })

  return pecas.map((peca) => ({ ...peca, ...posicoes.get(peca.id) }))
}

// A cena só com as ações dos k primeiros instantes: simulá-la dá o estado "antes do instante k".
export function ateOInstante(cena: Cena, k: number): Cena {
  const ordens = [...new Set(cena.acoes.map((acao) => acao.ordem))].sort((a, b) => a - b)
  if (k >= ordens.length) return cena
  return { ...cena, acoes: cena.acoes.filter((acao) => acao.ordem < ordens[k]) }
}
