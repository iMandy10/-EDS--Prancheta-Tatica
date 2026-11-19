import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import AcaoSvg, { CORES_ACAO, SetaMarkerDefs } from '../../../src/components/AcaoSvg'

// Unidade: a seta é só desenho, então o que ela "devolve" são os atributos do SVG.
function desenhar(seta: ReactElement) {
  const { container } = render(<svg>{seta}</svg>)
  return [...container.querySelectorAll('path')]
}

// Última linha desenhada (a seta; quando há destaque, ele vem antes, por baixo).
const seta = (paths: SVGPathElement[]) => paths[paths.length - 1]

describe('AcaoSvg', () => {
  it('movimentação é uma linha reta e contínua, na cor dela, com ponta de seta', () => {
    const linha = seta(desenhar(<AcaoSvg x1={10} y1={20} x2={110} y2={20} tipo="movimentacao" />))

    expect(linha).toHaveAttribute('d', 'M 10 20 L 110 20')
    expect(linha).toHaveAttribute('stroke', CORES_ACAO.movimentacao)
    expect(linha).not.toHaveAttribute('stroke-dasharray')
    expect(linha).toHaveAttribute('marker-end', 'url(#seta-ponta-movimentacao)')
  })

  it('passe é tracejado', () => {
    const linha = seta(desenhar(<AcaoSvg x1={0} y1={0} x2={100} y2={0} tipo="passe" />))

    expect(linha).toHaveAttribute('stroke-dasharray', '8 5')
    expect(linha).toHaveAttribute('marker-end', 'url(#seta-ponta-passe)')
  })

  it('bloqueio termina na própria ponta (a barra)', () => {
    const linha = seta(desenhar(<AcaoSvg x1={0} y1={0} x2={100} y2={0} tipo="bloqueio" />))

    expect(linha).toHaveAttribute('marker-end', 'url(#seta-ponta-bloqueio)')
  })

  it('drible é ondulado: sai da origem, sobe e desce, e termina no destino', () => {
    const linha = seta(desenhar(<AcaoSvg x1={0} y1={0} x2={200} y2={0} tipo="drible" />))
    const d = linha.getAttribute('d')!
    const alturas = [...d.matchAll(/[-\d.e]+ ([-\d.e]+)/g)].map(([, y]) => Number(y))

    expect(d.startsWith('M 0 0')).toBe(true)
    expect(d.endsWith('L 200 0')).toBe(true)
    expect(Math.max(...alturas)).toBeGreaterThan(4)
    expect(Math.min(...alturas)).toBeLessThan(-4)
  })

  it('drible curto demais para ondular vira uma linha reta', () => {
    const linha = seta(desenhar(<AcaoSvg x1={0} y1={0} x2={20} y2={0} tipo="drible" />))

    expect(linha).toHaveAttribute('d', 'M 0 0 L 20 0')
  })

  it('no modo preto (basquete), a cor e a ponta são as pretas', () => {
    const linha = seta(desenhar(<AcaoSvg x1={0} y1={0} x2={100} y2={0} tipo="passe" preta />))

    expect(linha).toHaveAttribute('stroke', '#111827')
    expect(linha).toHaveAttribute('marker-end', 'url(#seta-ponta-passe-preta)')
  })

  it('destacada ganha um contorno por baixo, no mesmo caminho', () => {
    const normal = desenhar(<AcaoSvg x1={0} y1={0} x2={100} y2={0} tipo="passe" />)
    const destacada = desenhar(<AcaoSvg x1={0} y1={0} x2={100} y2={0} tipo="passe" destacada />)

    expect(normal).toHaveLength(1)
    expect(destacada).toHaveLength(2)
    expect(destacada[0].getAttribute('d')).toBe(destacada[1].getAttribute('d'))
  })
})

describe('SetaMarkerDefs', () => {
  it('define a ponta de cada tipo de ação, colorida e preta', () => {
    const { container } = render(<svg><SetaMarkerDefs /></svg>)
    const ids = [...container.querySelectorAll('marker')].map((m) => m.id)

    expect(ids.sort()).toEqual([
      'seta-ponta-bloqueio', 'seta-ponta-bloqueio-preta', 'seta-ponta-drible', 'seta-ponta-drible-preta',
      'seta-ponta-movimentacao', 'seta-ponta-movimentacao-preta', 'seta-ponta-passe', 'seta-ponta-passe-preta',
    ])
  })

  it('a ponta do bloqueio é uma barra; as outras são triângulos preenchidos', () => {
    const { container } = render(<svg><SetaMarkerDefs /></svg>)
    const ponta = (id: string) => container.querySelector(`#${id} path`)!

    expect(ponta('seta-ponta-bloqueio')).toHaveAttribute('d', 'M 5 0 L 5 10')
    expect(ponta('seta-ponta-bloqueio')).not.toHaveAttribute('fill')
    expect(ponta('seta-ponta-passe')).toHaveAttribute('d', 'M 0 0 L 10 5 L 0 10 z')
    expect(ponta('seta-ponta-passe-preta')).toHaveAttribute('fill', '#111827')
  })
})
