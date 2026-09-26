import type { Acao, Cena, Peca } from '../types/cena'

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
}

// Ações rodam uma de cada vez, em ordem crescente (o backend proíbe ordens duplicadas).
// Cada ação parte da posição atual das peças, resultado das ações anteriores.
// No passe quem viaja é a bola, saindo da peça de origem; na movimentação, a própria peça de origem.
export function montarPassos(cena: Cena): Passo[] {
  const posicoes = new Map(cena.pecas.map((peca) => [peca.id, { x: peca.x, y: peca.y }]))
  const bola = cena.pecas.find((peca) => peca.tipo === 'bola')
  const passos: Passo[] = []

  for (const acao of [...cena.acoes].sort((a, b) => a.ordem - b.ordem)) {
    const de = posicoes.get(acao.origem)
    const para = typeof acao.destino === 'string' ? posicoes.get(acao.destino) : acao.destino
    if (!de || !para) continue

    const pecaId = acao.tipo === 'passe' && bola ? bola.id : acao.origem
    passos.push({ acao, pecaId, de: { ...de }, para: { ...para } })
    posicoes.set(pecaId, { ...para })
  }

  return passos
}

function suavizar(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export function posicoesNoTempo(pecas: Peca[], passos: Passo[], tempoMs: number): Peca[] {
  const posicoes = new Map(pecas.map((peca) => [peca.id, { x: peca.x, y: peca.y }]))

  passos.forEach((passo, index) => {
    const t = Math.min(Math.max((tempoMs - index * DURACAO_ACAO_MS) / DURACAO_ACAO_MS, 0), 1)
    if (t === 0) return
    const s = suavizar(t)
    posicoes.set(passo.pecaId, {
      x: passo.de.x + (passo.para.x - passo.de.x) * s,
      y: passo.de.y + (passo.para.y - passo.de.y) * s,
    })
  })

  return pecas.map((peca) => ({ ...peca, ...posicoes.get(peca.id) }))
}
