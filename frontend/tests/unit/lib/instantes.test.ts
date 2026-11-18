import { describe, expect, it } from 'vitest'
import { agruparPorInstante, cabeNoInstante, compactarOrdens } from '../../../src/lib/instantes'
import type { Acao, Peca } from '../../../src/types/cena'

const pecas: Peca[] = [
  { id: 'a1', tipo: 'jogador_time_a', x: 100, y: 100 },
  { id: 'a2', tipo: 'jogador_time_a', x: 300, y: 100 },
  { id: 'a3', tipo: 'jogador_time_a', x: 300, y: 300 },
  { id: 'bola', tipo: 'bola', x: 113, y: 113, posse: 'a1' },
]

function acao(id: string, tipo: Acao['tipo'], origem: string, ordem = 1): Acao {
  return { id, tipo, origem, destino: { x: 400, y: 250 }, ordem }
}

describe('agruparPorInstante', () => {
  it('junta as ações de mesma ordem em grupos crescentes, mantendo a sequência dentro do grupo', () => {
    const acoes = [acao('x', 'movimentacao', 'a1', 3), acao('y', 'bloqueio', 'a2', 1), acao('z', 'passe', 'a3', 3)]

    const ids = agruparPorInstante(acoes).map((grupo) => grupo.map((a) => a.id))

    expect(ids).toEqual([['y'], ['x', 'z']])
  })

  it('não altera a lista recebida', () => {
    const acoes = [acao('x', 'movimentacao', 'a1', 2), acao('y', 'bloqueio', 'a2', 1)]

    agruparPorInstante(acoes)

    expect(acoes.map((a) => a.id)).toEqual(['x', 'y'])
  })

  it('devolve lista vazia quando não há ações', () => {
    expect(agruparPorInstante([])).toEqual([])
  })
})

describe('cabeNoInstante', () => {
  it('aceita qualquer ação num instante vazio', () => {
    expect(cabeNoInstante(acao('n', 'passe', 'a1'), [], pecas)).toBe(true)
  })

  it('recusa uma segunda ação da mesma peça no instante', () => {
    const grupo = [acao('m', 'movimentacao', 'a2')]

    expect(cabeNoInstante(acao('n', 'bloqueio', 'a2'), grupo, pecas)).toBe(false)
  })

  it.each([
    ['passe', 'drible'],
    ['drible', 'passe'],
    ['passe', 'passe'],
  ] as const)('recusa %s num instante que já tem %s, porque a bola faz uma coisa por vez', (nova, existente) => {
    const grupo = [acao('e', existente, 'a1')]

    expect(cabeNoInstante(acao('n', nova, 'a2'), grupo, pecas)).toBe(false)
  })

  it('recusa a movimentação da própria bola num instante que já tem passe', () => {
    const grupo = [acao('p', 'passe', 'a1')]

    expect(cabeNoInstante(acao('n', 'movimentacao', 'bola'), grupo, pecas)).toBe(false)
  })

  it('aceita a ação de outra peça que não mexe na bola, mesmo com passe no instante', () => {
    const grupo = [acao('p', 'passe', 'a1')]

    expect(cabeNoInstante(acao('n', 'movimentacao', 'a3'), grupo, pecas)).toBe(true)
  })

  it('não conflita consigo mesma ao editar uma ação que já está no instante', () => {
    const passe = acao('p', 'passe', 'a1')

    expect(cabeNoInstante({ ...passe, tipo: 'drible' }, [passe, acao('m', 'movimentacao', 'a2')], pecas)).toBe(true)
  })
})

describe('compactarOrdens', () => {
  it('renumera os instantes como 1, 2, 3 mantendo juntas as ações que estavam juntas', () => {
    const acoes = [
      acao('w', 'movimentacao', 'a1', 9),
      acao('x', 'movimentacao', 'a2', 2),
      acao('y', 'bloqueio', 'a3', 5),
      acao('z', 'passe', 'a1', 5),
    ]

    expect(compactarOrdens(acoes).map((a) => [a.id, a.ordem])).toEqual([
      ['w', 3],
      ['x', 1],
      ['y', 2],
      ['z', 2],
    ])
  })
})
