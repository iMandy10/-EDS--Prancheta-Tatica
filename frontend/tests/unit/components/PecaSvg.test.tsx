import { fireEvent, render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import PecaSvg from '../../../src/components/PecaSvg'
import type { Peca } from '../../../src/types/cena'

const JOGADOR_A: Peca = { id: 'A7', tipo: 'jogador_time_a', x: 120, y: 340 }
const JOGADOR_B: Peca = { id: 'B2', tipo: 'jogador_time_b', x: 600, y: 100 }
const BOLA: Peca = { id: 'bola', tipo: 'bola', x: 400, y: 250 }

// SVG não tem papéis acessíveis para as peças: a peça é o <g> e o corpo é o círculo preenchido.
function renderPeca(props: ComponentProps<typeof PecaSvg>) {
  const { container } = render(
    <svg>
      <PecaSvg {...props} />
    </svg>,
  )
  const circulos = [...container.querySelectorAll('circle')]
  return {
    peca: container.querySelector('g')!,
    corpo: circulos.find((c) => c.getAttribute('fill') !== 'none')!,
    aneis: circulos.filter((c) => c.getAttribute('fill') === 'none'),
    texto: container.querySelector('text'),
  }
}

describe('PecaSvg', () => {
  it('aparece na posição x, y da peça', () => {
    const { peca } = renderPeca({ peca: JOGADOR_A })

    expect(peca).toHaveAttribute('transform', 'translate(120, 340)')
  })

  it('mostra o id do jogador quando não recebe rótulo, e o rótulo quando recebe', () => {
    expect(renderPeca({ peca: JOGADOR_A }).texto).toHaveTextContent('A7')
    expect(renderPeca({ peca: JOGADOR_B, rotulo: '2' }).texto).toHaveTextContent(/^2$/)
  })

  it('não mostra número na bola', () => {
    expect(renderPeca({ peca: BOLA, rotulo: 'bola' }).texto).toBeNull()
  })

  it('pinta cada time de uma cor e desenha a bola menor que os jogadores', () => {
    const timeA = renderPeca({ peca: JOGADOR_A }).corpo
    const timeB = renderPeca({ peca: JOGADOR_B }).corpo
    const bola = renderPeca({ peca: BOLA }).corpo

    expect(new Set([timeA, timeB, bola].map((c) => c.getAttribute('fill'))).size).toBe(3)
    expect(Number(bola.getAttribute('r'))).toBeLessThan(Number(timeA.getAttribute('r')))
    expect(timeA.getAttribute('r')).toBe(timeB.getAttribute('r'))
  })

  it('mostra um anel de destaque só na peça selecionada', () => {
    expect(renderPeca({ peca: JOGADOR_A }).aneis).toHaveLength(0)

    const { corpo, aneis } = renderPeca({ peca: JOGADOR_A, selected: true })
    expect(aneis).toHaveLength(1)
    expect(Number(aneis[0].getAttribute('r'))).toBeGreaterThan(Number(corpo.getAttribute('r')))
  })

  it('avisa o editor quando a peça é pressionada, para começar o arraste', () => {
    const onPointerDown = vi.fn()
    const { peca } = renderPeca({ peca: JOGADOR_A, onPointerDown })

    fireEvent.pointerDown(peca)

    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })
})
