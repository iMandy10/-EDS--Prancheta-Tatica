import { describe, expect, it } from 'vitest'
import { FORMACOES, POSICOES_FUTEBOL, posicaoPadraoFutebol } from '../../../src/lib/futebol'

const LARGURA = 800
const ALTURA = 500
const IDS = Array.from({ length: 11 }, (_, i) => i + 1)

describe('POSICOES_FUTEBOL', () => {
  it.each(FORMACOES)('a formação %s tem 11 posições e começa pelo goleiro', (formacao) => {
    const posicoes = POSICOES_FUTEBOL[formacao]

    expect(posicoes).toHaveLength(11)
    expect(posicoes[0]).toBe('GOL')
    expect(posicoes.filter((sigla) => sigla === 'GOL')).toHaveLength(1)
  })
})

describe('posicaoPadraoFutebol', () => {
  it('coloca o A1 no gol, na esquerda e no meio da altura', () => {
    expect(posicaoPadraoFutebol('4-4-2', 'A1')).toEqual({ x: 45, y: ALTURA / 2 })
  })

  it.each(FORMACOES)('na formação %s, o Time B é o espelho horizontal do Time A', (formacao) => {
    for (const n of IDS) {
      const a = posicaoPadraoFutebol(formacao, `A${n}`)
      const b = posicaoPadraoFutebol(formacao, `B${n}`)

      expect(b).toEqual({ x: LARGURA - a.x, y: a.y })
    }
  })

  it('muda a posição do jogador quando a formação muda', () => {
    expect(posicaoPadraoFutebol('4-4-2', 'A10')).not.toEqual(posicaoPadraoFutebol('4-3-3', 'A10'))
  })

  it.each(FORMACOES)('na formação %s, os 11 jogadores ficam em pontos diferentes e dentro do campo', (formacao) => {
    const posicoes = IDS.map((n) => posicaoPadraoFutebol(formacao, `A${n}`))

    expect(new Set(posicoes.map(({ x, y }) => `${x},${y}`)).size).toBe(11)
    for (const { x, y } of posicoes) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(LARGURA)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(ALTURA)
    }
  })

  it('coloca no centro do campo um jogador que não existe na formação', () => {
    expect(posicaoPadraoFutebol('4-4-2', 'A12')).toEqual({ x: LARGURA / 2, y: ALTURA / 2 })
    expect(posicaoPadraoFutebol('4-4-2', 'B12')).toEqual({ x: LARGURA / 2, y: ALTURA / 2 })
  })
})
