import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import QuadraSvg, { limitesQuadra } from '../../../src/components/QuadraSvg'

describe('QuadraSvg', () => {
  it.each([
    ['futebol', 'completa', 'Quadra de futebol'],
    ['basquete', 'completa', 'Quadra de basquete'],
    ['basquete', 'meia_quadra', 'Quadra de basquete (meia quadra)'],
  ] as const)('identifica a quadra de %s (%s) para leitores de tela', (quadra, visualizacao, nome) => {
    render(<QuadraSvg quadra={quadra} visualizacao={visualizacao} />)

    expect(screen.getByRole('img', { name: nome })).toBeInTheDocument()
  })

  it('na quadra inteira mostra o campo todo e na meia quadra só até depois da linha do meio', () => {
    const { rerender } = render(<QuadraSvg quadra="basquete" />)
    expect(screen.getByRole('img')).toHaveAttribute('viewBox', '0 0 800 500')

    rerender(<QuadraSvg quadra="basquete" visualizacao="meia_quadra" />)
    expect(screen.getByRole('img')).toHaveAttribute('viewBox', '0 0 420 500')
  })

  it('desenha dentro da quadra as peças que recebe', () => {
    render(
      <QuadraSvg quadra="futebol">
        <text>A1</text>
      </QuadraSvg>,
    )

    expect(screen.getByRole('img')).toContainElement(screen.getByText('A1'))
  })

  it('repassa pressionar, mover e soltar, e trata sair da quadra como soltar', () => {
    const eventos = { onPointerDown: vi.fn(), onPointerMove: vi.fn(), onPointerUp: vi.fn() }
    render(<QuadraSvg quadra="futebol" {...eventos} />)
    const quadra = screen.getByRole('img')

    fireEvent.pointerDown(quadra)
    fireEvent.pointerMove(quadra)
    expect(eventos.onPointerDown).toHaveBeenCalledTimes(1)
    expect(eventos.onPointerMove).toHaveBeenCalledTimes(1)
    expect(eventos.onPointerUp).not.toHaveBeenCalled()

    fireEvent.pointerUp(quadra)
    expect(eventos.onPointerUp).toHaveBeenCalledTimes(1)

    fireEvent.pointerLeave(quadra)
    expect(eventos.onPointerUp).toHaveBeenCalledTimes(2)
  })
})

describe('limitesQuadra', () => {
  it('na quadra inteira, a peça pode ir de 20 a 780 na largura e de 20 a 480 na altura', () => {
    expect(limitesQuadra('completa')).toEqual({ minX: 20, minY: 20, maxX: 780, maxY: 480 })
  })

  it('na meia quadra, o limite da direita é a linha do meio', () => {
    expect(limitesQuadra('meia_quadra')).toEqual({ minX: 20, minY: 20, maxX: 400, maxY: 480 })
  })

  it('sem visualização informada, usa a quadra inteira', () => {
    expect(limitesQuadra()).toEqual(limitesQuadra('completa'))
  })
})
