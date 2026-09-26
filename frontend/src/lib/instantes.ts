import type { Acao, Peca } from '../types/cena'

// Ações com a mesma ordem acontecem no mesmo instante.
export function agruparPorInstante(acoes: Acao[]): Acao[][] {
  const grupos = new Map<number, Acao[]>()
  for (const acao of [...acoes].sort((a, b) => a.ordem - b.ordem)) {
    grupos.set(acao.ordem, [...(grupos.get(acao.ordem) ?? []), acao])
  }
  return [...grupos.values()]
}

function moveBola(acao: Acao, pecas: Peca[]): boolean {
  return acao.tipo === 'passe' || pecas.some((peca) => peca.id === acao.origem && peca.tipo === 'bola')
}

// Uma peça faz no máximo uma ação por instante, e só uma ação por instante move a bola.
export function cabeNoInstante(acao: Acao, grupo: Acao[], pecas: Peca[]): boolean {
  return grupo.every(
    (outra) =>
      outra.id === acao.id ||
      (outra.origem !== acao.origem && !(moveBola(outra, pecas) && moveBola(acao, pecas))),
  )
}

// Renumera os instantes como 1, 2, 3..., preservando quais ações estão juntas.
export function compactarOrdens(acoes: Acao[]): Acao[] {
  const ordens = [...new Set(acoes.map((acao) => acao.ordem))].sort((a, b) => a - b)
  return acoes.map((acao) => ({ ...acao, ordem: ordens.indexOf(acao.ordem) + 1 }))
}
