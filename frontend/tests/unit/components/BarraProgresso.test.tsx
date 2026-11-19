import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BarraProgresso from '../../../src/components/BarraProgresso'

const barra = () => screen.getByRole('progressbar', { name: 'Progresso da jogada' })

describe('BarraProgresso', () => {
  it('é uma barra acessível de 0 a 100 com o progresso arredondado em porcentagem', () => {
    render(<BarraProgresso progresso={0.248} />)

    expect(barra()).toHaveAttribute('aria-valuemin', '0')
    expect(barra()).toHaveAttribute('aria-valuemax', '100')
    expect(barra()).toHaveAttribute('aria-valuenow', '25')
  })

  it.each([
    [0, '0'],
    [1, '100'],
  ])('com progresso %s, marca %s%%', (progresso, valor) => {
    render(<BarraProgresso progresso={progresso} />)

    expect(barra()).toHaveAttribute('aria-valuenow', valor)
  })
})
