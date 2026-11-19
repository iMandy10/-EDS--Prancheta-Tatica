import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import EstojoPecas from '../../../src/components/EstojoPecas'

function renderEstojo(props: Partial<ComponentProps<typeof EstojoPecas>> = {}) {
  const onFerramenta = vi.fn()
  render(
    <EstojoPecas
      quadra="futebol"
      formacao="4-4-2"
      onFormacao={vi.fn()}
      pecas={[]}
      onAlternar={vi.fn()}
      ferramenta={null}
      onFerramenta={onFerramenta}
      ferramentasBloqueadas={false}
      pecasBloqueadas={false}
      {...props}
    />,
  )
  return { onFerramenta }
}

const ferramentas = () =>
  within(screen.getByText('Ações', { selector: 'span' }).parentElement!)
    .getAllByRole('button')
    .map((botao) => botao.textContent)

describe('EstojoPecas: ferramentas de seta', () => {
  it('no futebol, oferece só movimentação e passe', () => {
    renderEstojo()

    expect(ferramentas()).toEqual(['Movimentação', 'Passe'])
  })

  it('no basquete, oferece também bloqueio e drible', () => {
    renderEstojo({ quadra: 'basquete', formacao: undefined, onFormacao: undefined })

    expect(ferramentas()).toEqual(['Movimentação', 'Passe', 'Bloqueio', 'Drible'])
  })

  it('marca como pressionada só a ferramenta ativa', () => {
    renderEstojo({ ferramenta: 'passe' })

    expect(screen.getByRole('button', { name: 'Passe', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Movimentação', pressed: false })).toBeInTheDocument()
  })

  it('avisa qual ferramenta foi escolhida', async () => {
    const { onFerramenta } = renderEstojo()

    await userEvent.click(screen.getByRole('button', { name: 'Passe' }))

    expect(onFerramenta).toHaveBeenCalledWith('passe')
  })

  it('com as ferramentas bloqueadas, desativa os botões e não avisa o clique', async () => {
    const { onFerramenta } = renderEstojo({ ferramentasBloqueadas: true })

    expect(screen.getByRole('button', { name: 'Movimentação' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Passe' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Passe' }))
    expect(onFerramenta).not.toHaveBeenCalled()
  })
})
