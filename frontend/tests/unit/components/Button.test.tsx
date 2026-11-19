import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent, ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Button from '../../../src/components/Button'

// Unidade: o botão base usado em todo o app.
function formularioCom(botao: ReactElement) {
  const aoEnviar = vi.fn((evento: FormEvent) => evento.preventDefault())
  render(<form onSubmit={aoEnviar}>{botao}</form>)
  return aoEnviar
}

describe('Button', () => {
  it('por padrão não envia o formulário em que está', async () => {
    const aoEnviar = formularioCom(<Button>Remover</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))

    expect(aoEnviar).not.toHaveBeenCalled()
  })

  it('com type="submit", envia o formulário', async () => {
    const aoEnviar = formularioCom(<Button type="submit">Salvar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(aoEnviar).toHaveBeenCalledOnce()
  })

  it('repassa o clique e as outras props do botão', async () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar} aria-label="Fechar modal" variant="ghost" active>x</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Fechar modal' }))

    expect(aoClicar).toHaveBeenCalledOnce()
  })

  it('desabilitado, não reage ao clique', async () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar} disabled variant="danger">Excluir</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(aoClicar).not.toHaveBeenCalled()
  })
})
