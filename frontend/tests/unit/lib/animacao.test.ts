import { describe, expect, it } from 'vitest'
import {
  ateOInstante,
  contarInstantes,
  estadoFinal,
  montarPassos,
  portadorAoFinal,
  posicoesNoTempo,
  simular,
} from '../../../src/lib/animacao'
import type { Acao, Cena, Peca } from '../../../src/types/cena'

// Peças em coordenadas redondas: a bola ao lado de quem está com ela fica em (+13, +13).
const a1: Peca = { id: 'a1', tipo: 'jogador_time_a', x: 100, y: 100 }
const a2: Peca = { id: 'a2', tipo: 'jogador_time_a', x: 300, y: 100 }
const bolaComA1: Peca = { id: 'bola', tipo: 'bola', x: 113, y: 113, posse: 'a1' }

function acao(id: string, tipo: Acao['tipo'], origem: string, destino: Acao['destino'], ordem: number): Acao {
  return { id, tipo, origem, destino, ordem }
}

function cena(pecas: Peca[], acoes: Acao[]): Cena {
  return { quadra: 'basquete', pecas, acoes }
}

describe('simular: deslocamentos e instantes', () => {
  it('leva a peça da origem até o ponto de destino no primeiro instante', () => {
    const passos = montarPassos(cena([a1], [acao('m', 'movimentacao', 'a1', { x: 300, y: 200 }, 1)]))

    expect(passos).toEqual([
      expect.objectContaining({ pecaId: 'a1', de: { x: 100, y: 100 }, para: { x: 300, y: 200 }, instante: 0 }),
    ])
  })

  it('mira onde a peça de destino está no início do instante, mesmo que ela se mova junto', () => {
    const passos = montarPassos(
      cena([a1, a2], [
        acao('m1', 'movimentacao', 'a1', 'a2', 1),
        acao('m2', 'movimentacao', 'a2', { x: 300, y: 400 }, 1),
      ]),
    )

    expect(passos.find((passo) => passo.pecaId === 'a1')?.para).toEqual({ x: 300, y: 100 })
  })

  it('faz cada instante partir de onde o anterior deixou, sem buraco entre as ordens', () => {
    const passos = montarPassos(
      cena([a1], [
        acao('m2', 'movimentacao', 'a1', { x: 200, y: 300 }, 5),
        acao('m1', 'movimentacao', 'a1', { x: 200, y: 100 }, 1),
      ]),
    )

    expect(passos.map((passo) => passo.instante)).toEqual([0, 1])
    expect(passos[1].de).toEqual({ x: 200, y: 100 })
  })

  it('roda no mesmo instante as ações com a mesma ordem', () => {
    const passos = montarPassos(
      cena([a1, a2], [
        acao('m1', 'movimentacao', 'a1', { x: 100, y: 300 }, 1),
        acao('m2', 'bloqueio', 'a2', { x: 300, y: 300 }, 1),
      ]),
    )

    expect(passos.map((passo) => [passo.pecaId, passo.instante])).toEqual([['a1', 0], ['a2', 0]])
  })
})

describe('simular: bola e posse', () => {
  it('no passe, faz a bola viajar até o lado do receptor e entrega a posse a ele', () => {
    const simulacao = simular(cena([a1, a2, bolaComA1], [acao('p', 'passe', 'a1', 'a2', 1)]))

    expect(simulacao.passos).toEqual([
      expect.objectContaining({ pecaId: 'bola', de: { x: 113, y: 113 }, para: { x: 313, y: 113 } }),
    ])
    expect(simulacao.portador).toBe('a2')
  })

  it('mira o passe onde o receptor termina o instante', () => {
    const passos = montarPassos(
      cena([a1, a2, bolaComA1], [
        acao('p', 'passe', 'a1', 'a2', 1),
        acao('m', 'movimentacao', 'a2', { x: 300, y: 300 }, 1),
      ]),
    )

    expect(passos.find((passo) => passo.pecaId === 'bola')?.para).toEqual({ x: 313, y: 313 })
  })

  it('entrega a bola ao jogador em cuja área cai a ponta de um passe com destino livre', () => {
    const simulacao = simular(cena([a1, a2, bolaComA1], [acao('p', 'passe', 'a1', { x: 310, y: 105 }, 1)]))

    expect(simulacao.alvos.get('p')).toBe('a2')
    expect(simulacao.portador).toBe('a2')
    expect(simulacao.posicoes.get('bola')).toEqual({ x: 313, y: 113 })
  })

  it('deixa a bola solta no ponto quando o passe livre não cai na área de ninguém', () => {
    const simulacao = simular(cena([a1, a2, bolaComA1], [acao('p', 'passe', 'a1', { x: 600, y: 400 }, 1)]))

    expect(simulacao.alvos.has('p')).toBe(false)
    expect(simulacao.portador).toBeNull()
    expect(simulacao.posicoes.get('bola')).toEqual({ x: 600, y: 400 })
  })

  it.each(['passe', 'drible'] as const)('ignora %s de quem não está com a bola', (tipo) => {
    const simulacao = simular(cena([a1, a2, bolaComA1], [acao('x', tipo, 'a2', { x: 500, y: 400 }, 1)]))

    expect(simulacao.passos).toEqual([])
    expect(simulacao.portador).toBe('a1')
  })

  it.each(['drible', 'movimentacao'] as const)('no(a) %s do portador, a bola vai junto, ao lado dele', (tipo) => {
    const passos = montarPassos(cena([a1, a2, bolaComA1], [acao('d', tipo, 'a1', { x: 100, y: 300 }, 1)]))

    expect(passos.map((passo) => [passo.pecaId, passo.para])).toEqual([
      ['a1', { x: 100, y: 300 }],
      ['bola', { x: 113, y: 313 }],
    ])
  })

  it('não leva a bola quando quem se move não está com ela', () => {
    const passos = montarPassos(cena([a1, a2, bolaComA1], [acao('m', 'movimentacao', 'a2', { x: 300, y: 300 }, 1)]))

    expect(passos.map((passo) => passo.pecaId)).toEqual(['a2'])
  })

  it('sem bola na cena, ignora o passe e trata o drible como deslocamento comum', () => {
    const passos = montarPassos(
      cena([a1, a2], [acao('p', 'passe', 'a1', 'a2', 1), acao('d', 'drible', 'a1', { x: 100, y: 300 }, 2)]),
    )

    expect(passos).toEqual([expect.objectContaining({ pecaId: 'a1', para: { x: 100, y: 300 }, instante: 1 })])
  })
})

describe('estadoFinal e portadorAoFinal', () => {
  it('devolve as peças nas posições finais com a bola de posse do último receptor', () => {
    const jogada = cena([a1, a2, bolaComA1], [acao('p', 'passe', 'a1', 'a2', 1)])

    expect(estadoFinal(jogada)).toEqual([a1, a2, { ...bolaComA1, x: 313, y: 113, posse: 'a2' }])
    expect(portadorAoFinal(jogada)).toBe('a2')
  })
})

describe('tempo da animação', () => {
  // a1 anda no 1º instante (0–1000 ms) e a2 no 2º (1000–2000 ms).
  const b2: Peca = { id: 'b2', tipo: 'jogador_time_b', x: 100, y: 300 }
  const pecas = [a1, b2]
  const passos = montarPassos(
    cena(pecas, [
      acao('m1', 'movimentacao', 'a1', { x: 300, y: 100 }, 1),
      acao('m2', 'movimentacao', 'b2', { x: 300, y: 300 }, 2),
    ]),
  )
  const xNoTempo = (id: string, tempoMs: number) =>
    posicoesNoTempo(pecas, passos, tempoMs).find((peca) => peca.id === id)?.x

  it('conta zero instantes sem passos e o último instante mais um com passos', () => {
    expect(contarInstantes([])).toBe(0)
    expect(contarInstantes(passos)).toBe(2)
  })

  it('mantém as peças nas posições iniciais no tempo zero', () => {
    expect(posicoesNoTempo(pecas, passos, 0)).toEqual(pecas)
  })

  it('coloca a peça no meio do caminho na metade do instante', () => {
    expect(xNoTempo('a1', 500)).toBe(200)
  })

  it('começa devagar: com 25% do tempo, a peça andou menos de 25% do caminho', () => {
    const x = xNoTempo('a1', 250)!

    expect(x).toBeGreaterThan(100)
    expect(x).toBeLessThan(150)
  })

  it('para a peça no destino ao fim do seu instante, sem mexer na do instante seguinte', () => {
    expect([xNoTempo('a1', 1000), xNoTempo('b2', 1000)]).toEqual([300, 100])
    expect([xNoTempo('a1', 1500), xNoTempo('b2', 1500)]).toEqual([300, 200])
    expect([xNoTempo('a1', 9000), xNoTempo('b2', 9000)]).toEqual([300, 300])
  })
})

describe('ateOInstante', () => {
  const jogada = cena([a1], [
    acao('m1', 'movimentacao', 'a1', { x: 200, y: 100 }, 2),
    acao('m2', 'movimentacao', 'a1', { x: 200, y: 300 }, 7),
  ])

  it('guarda só as ações dos k primeiros instantes', () => {
    expect(ateOInstante(jogada, 0).acoes).toEqual([])
    expect(ateOInstante(jogada, 1).acoes.map((a) => a.id)).toEqual(['m1'])
  })

  it('devolve a cena inteira quando k passa do último instante', () => {
    expect(ateOInstante(jogada, 2)).toBe(jogada)
  })
})
