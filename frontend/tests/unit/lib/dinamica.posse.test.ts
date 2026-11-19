import { describe, expect, it } from 'vitest'
import { acompanharPosse, atribuirPosse, jogadorNaArea, recortarSeta } from '../../../src/lib/dinamica'
import type { Peca } from '../../../src/types/cena'

const jogador = (id: string, x: number, y: number): Peca => ({ id, tipo: 'jogador_time_a', x, y })
const bola = (x: number, y: number, posse: string | null = null): Peca => ({ id: 'bola', tipo: 'bola', x, y, posse })

describe('recortarSeta', () => {
  it('encurta a seta no começo e no fim, na direção dela', () => {
    expect(recortarSeta(0, 0, 100, 0, 10, 20)).toEqual({ x1: 10, y1: 0, x2: 80, y2: 0 })
    expect(recortarSeta(0, 0, 30, 40, 5, 5)).toEqual({ x1: 3, y1: 4, x2: 27, y2: 36 })
  })

  it('deixa como está a seta curta demais para ser recortada', () => {
    // Recortes de 10 + 20, mais a folga de 10: até 40 de comprimento a seta não muda.
    expect(recortarSeta(0, 0, 40, 0, 10, 20)).toEqual({ x1: 0, y1: 0, x2: 40, y2: 0 })
  })
})

describe('jogadorNaArea', () => {
  const pecas = [jogador('A1', 100, 100), jogador('A2', 140, 100), bola(120, 100)]

  it('acha o jogador mais próximo da ponta da seta, dentro da área dele', () => {
    expect(jogadorNaArea({ x: 125, y: 100 }, pecas, 'X')?.id).toBe('A2')
    expect(jogadorNaArea({ x: 115, y: 100 }, pecas, 'X')?.id).toBe('A1')
  })

  it('a área vai até 32 de distância, e nada além disso', () => {
    expect(jogadorNaArea({ x: 100, y: 132 }, pecas, 'X')?.id).toBe('A1')
    expect(jogadorNaArea({ x: 100, y: 133 }, pecas, 'X')).toBeUndefined()
  })

  it('ignora a bola e o próprio jogador de origem da seta', () => {
    expect(jogadorNaArea({ x: 120, y: 100 }, [bola(120, 100)], 'X')).toBeUndefined()
    expect(jogadorNaArea({ x: 110, y: 100 }, pecas, 'A1')?.id).toBe('A2')
  })
})

describe('acompanharPosse', () => {
  it('leva a bola para o lado de quem está com ela', () => {
    const resultado = acompanharPosse([jogador('A1', 200, 150), bola(0, 0, 'A1')])

    expect(resultado[1]).toMatchObject({ x: 213, y: 163, posse: 'A1' })
  })

  it('se quem tinha a bola saiu da quadra, a bola fica solta onde estava', () => {
    expect(acompanharPosse([bola(50, 60, 'A9')])).toEqual([bola(50, 60, null)])
  })

  it('não mexe na bola solta nem nos jogadores', () => {
    const pecas = [jogador('A1', 200, 150), bola(10, 20)]

    expect(acompanharPosse(pecas)).toEqual(pecas)
  })
})

describe('atribuirPosse', () => {
  it('a bola solta perto de um jogador passa a ser dele e encosta nele', () => {
    const resultado = atribuirPosse([jogador('A1', 200, 150), bola(210, 160)])

    expect(resultado[1]).toMatchObject({ posse: 'A1', x: 213, y: 163 })
  })

  it('a bola solta longe de todos fica sem dono, no mesmo lugar', () => {
    const resultado = atribuirPosse([jogador('A1', 200, 150), bola(400, 300, 'A1')])

    expect(resultado[1]).toEqual(bola(400, 300, null))
  })

  it('sem bola na quadra, nada muda', () => {
    const pecas = [jogador('A1', 200, 150)]

    expect(atribuirPosse(pecas)).toBe(pecas)
  })
})
