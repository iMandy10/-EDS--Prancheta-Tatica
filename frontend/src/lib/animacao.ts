import type { Acao, Cena, Peca } from '../types/cena'
import { agruparPorInstante } from './instantes'
import { jogadorNaArea } from './basquete'

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
export function montarPassos(cena: Cena): Passo[] {
  const posicoes = new Map(cena.pecas.map((peca) => [peca.id, { x: peca.x, y: peca.y }]))
  const bola = cena.pecas.find((peca) => peca.tipo === 'bola')
  const passos: Passo[] = []

  // No basquete, um passe para ponto livre na área de um jogador (nas posições do fim do instante) vai até ele.
  const receptor = (acao: Acao) => {
    if (cena.quadra !== 'basquete' || acao.tipo !== 'passe' || typeof acao.destino === 'string') return undefined
    const pecasAgora = cena.pecas.map((peca) => ({ ...peca, ...posicoes.get(peca.id) }))
    const jogador = jogadorNaArea(acao.destino, pecasAgora, acao.origem)
    return jogador && posicoes.get(jogador.id)
  }

  agruparPorInstante(cena.acoes).forEach((grupo, instante) => {
    const inicio = new Map(posicoes)
    const deslocamentos = grupo.filter((acao) => acao.tipo !== 'passe')
    const passes = grupo.filter((acao) => acao.tipo === 'passe')

    for (const acao of [...deslocamentos, ...passes]) {
      const de = inicio.get(acao.origem)
      const alvos = acao.tipo === 'passe' ? posicoes : inicio
      const para = typeof acao.destino === 'string' ? alvos.get(acao.destino) : (receptor(acao) ?? acao.destino)
      if (!de || !para || (acao.tipo === 'passe' && !bola)) continue

      const pecaId = acao.tipo === 'passe' && bola ? bola.id : acao.origem
      passos.push({ acao, pecaId, de: { ...de }, para: { ...para }, instante })
      posicoes.set(pecaId, { ...para })
      if (acao.tipo === 'drible' && bola && pecaId !== bola.id) {
        passos.push({ acao, pecaId: bola.id, de: { ...de }, para: { ...para }, instante })
        posicoes.set(bola.id, { ...para })
      }
    }
  })

  return passos
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
