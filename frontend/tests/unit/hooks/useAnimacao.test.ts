import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnimacao } from '../../../src/hooks/useAnimacao'
import type { Cena } from '../../../src/types/cena'

// Dois instantes de 1000 ms: a1 anda no 1º (x 100 → 300) e a2 no 2º (x 100 → 300).
const cenaDoisInstantes: Cena = {
  quadra: 'basquete',
  pecas: [
    { id: 'a1', tipo: 'jogador_time_a', x: 100, y: 100 },
    { id: 'a2', tipo: 'jogador_time_a', x: 100, y: 300 },
  ],
  acoes: [
    { id: 'm1', tipo: 'movimentacao', origem: 'a1', destino: { x: 300, y: 100 }, ordem: 1 },
    { id: 'm2', tipo: 'movimentacao', origem: 'a2', destino: { x: 300, y: 300 }, ordem: 2 },
  ],
}
const cenaUmInstante: Cena = { ...cenaDoisInstantes, acoes: cenaDoisInstantes.acoes.slice(0, 1) }
const cenaSemAcoes: Cena = { ...cenaDoisInstantes, acoes: [] }

function montar(cena = cenaDoisInstantes) {
  const aoTerminar = vi.fn()
  const hook = renderHook(({ cena }) => useAnimacao(cena, aoTerminar), { initialProps: { cena } })
  return { ...hook, aoTerminar }
}

// O requestAnimationFrame falso dispara a cada ~16 ms do relógio falso.
const avancar = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const xDe = (pecas: { id: string; x: number }[], id: string) => pecas.find((peca) => peca.id === id)!.x

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useAnimacao', () => {
  it('começa parado no tempo zero, com as peças no lugar e a duração de todos os instantes', () => {
    const { result } = montar()

    expect(result.current).toMatchObject({ tempo: 0, duracao: 2000, tocando: false, instanteAtual: null })
    expect(result.current.pecas).toEqual(cenaDoisInstantes.pecas)
  })

  it('ao tocar, avança com o relógio e move a peça do instante atual', () => {
    const { result } = montar()

    act(() => result.current.tocar())
    avancar(500)

    expect(result.current.tocando).toBe(true)
    expect(result.current.tempo).toBeGreaterThan(480)
    expect(result.current.tempo).toBeLessThanOrEqual(500)
    expect(result.current.instanteAtual).toBe(0)
    expect(xDe(result.current.pecas, 'a1')).toBeCloseTo(200, -1)

    avancar(1000)
    expect(result.current.instanteAtual).toBe(1)
  })

  it('ao pausar, congela o tempo e, ao tocar de novo, continua de onde parou', () => {
    const { result } = montar()
    act(() => result.current.tocar())
    avancar(500)

    act(() => result.current.pausar())
    const tempoPausado = result.current.tempo
    avancar(1000)

    expect(result.current.tocando).toBe(false)
    expect(result.current.tempo).toBe(tempoPausado)

    act(() => result.current.tocar())
    avancar(100)
    expect(result.current.tempo).toBeGreaterThan(tempoPausado)
    expect(result.current.tempo).toBeLessThan(tempoPausado + 150)
  })

  it('para no fim exato, deixa as peças no estado final e avisa uma vez que terminou', () => {
    const { result, aoTerminar } = montar()
    // Desalinha o relógio dos quadros de 16 ms: sem isso, 125 quadros somam 2000 ms exatos
    // e o teste passaria mesmo se o hook não limitasse o tempo à duração.
    avancar(5)

    act(() => result.current.tocar())
    avancar(5000)

    expect(result.current).toMatchObject({ tempo: 2000, tocando: false, instanteAtual: null })
    expect([xDe(result.current.pecas, 'a1'), xDe(result.current.pecas, 'a2')]).toEqual([300, 300])
    expect(aoTerminar).toHaveBeenCalledTimes(1)
  })

  it('não avisa que terminou quando a animação é só pausada', () => {
    const { result, aoTerminar } = montar()

    act(() => result.current.tocar())
    avancar(500)
    act(() => result.current.pausar())
    avancar(5000)

    expect(aoTerminar).not.toHaveBeenCalled()
  })

  it('ao tocar depois do fim, recomeça do zero', () => {
    const { result } = montar()
    act(() => result.current.tocar())
    avancar(5000)

    act(() => result.current.tocar())
    avancar(100)

    expect(result.current.tocando).toBe(true)
    expect(result.current.tempo).toBeLessThan(150)
  })

  it('ao reiniciar no meio, volta ao zero e continua tocando', () => {
    const { result } = montar()
    act(() => result.current.tocar())
    avancar(1500)

    act(() => result.current.reiniciar())

    expect(result.current.tempo).toBe(0)
    expect(result.current.tocando).toBe(true)
    avancar(100)
    expect(result.current.tempo).toBeGreaterThan(0)
  })

  it('irPara limita o tempo entre zero e a duração e posiciona as peças sem tocar', () => {
    const { result } = montar()

    act(() => result.current.irPara(-500))
    expect(result.current.tempo).toBe(0)

    act(() => result.current.irPara(99999))
    expect(result.current.tempo).toBe(2000)

    act(() => result.current.irPara(500))
    expect(result.current.tocando).toBe(false)
    expect(xDe(result.current.pecas, 'a1')).toBe(200)
  })

  it('com uma cena sem ações, tem duração zero e termina assim que toca', () => {
    const { result, aoTerminar } = montar(cenaSemAcoes)

    act(() => result.current.tocar())
    avancar(100)

    expect(result.current.duracao).toBe(0)
    expect(result.current.tocando).toBe(false)
    expect(aoTerminar).toHaveBeenCalledTimes(1)
  })

  it('recalcula a duração quando a cena muda', () => {
    const { result, rerender } = montar()

    rerender({ cena: cenaUmInstante })

    expect(result.current.duracao).toBe(1000)
  })
})
