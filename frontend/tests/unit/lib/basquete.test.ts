import { describe, expect, it } from 'vitest'
import { POSICAO_PADRAO_BASQUETE, POSICOES_BASQUETE } from '../../../src/lib/basquete'
import { RAIO_IDENTIFICACAO } from '../../../src/lib/dinamica'

const LARGURA_QUADRA = 800
const ALTURA_QUADRA = 500
const jogadores = (time: 'A' | 'B') => POSICOES_BASQUETE.map((_, i) => `${time}${i + 1}`)

describe('posições padrão do basquete', () => {
  it('tem uma posição para cada jogador dos dois times e para a bola', () => {
    expect(Object.keys(POSICAO_PADRAO_BASQUETE).sort()).toEqual([...jogadores('A'), ...jogadores('B'), 'bola'].sort())
  })

  it('coloca todas as peças dentro da quadra', () => {
    for (const { x, y } of Object.values(POSICAO_PADRAO_BASQUETE)) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(LARGURA_QUADRA)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(ALTURA_QUADRA)
    }
  })

  it('põe o time A na metade esquerda e o B espelhado na direita', () => {
    jogadores('A').forEach((idA, i) => {
      const a = POSICAO_PADRAO_BASQUETE[idA]
      const b = POSICAO_PADRAO_BASQUETE[`B${i + 1}`]

      expect(a.x).toBeLessThan(LARGURA_QUADRA / 2)
      expect(b).toEqual({ x: LARGURA_QUADRA - a.x, y: a.y })
    })
  })

  it('não põe nenhuma peça na área de identificação de outra, para a bola não mudar de posse sozinha', () => {
    const posicoes = Object.entries(POSICAO_PADRAO_BASQUETE)

    posicoes.forEach(([id, p], i) => {
      posicoes.slice(i + 1).forEach(([outro, q]) => {
        expect(Math.hypot(p.x - q.x, p.y - q.y), `${id} × ${outro}`).toBeGreaterThan(RAIO_IDENTIFICACAO)
      })
    })
  })
})
