import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CopyableKey from '../../../src/components/CopyableKey'

// O user-event troca o navigator.clipboard por uma área de transferência falsa a cada setup().
function renderChave() {
  render(
    <CopyableKey
      label="Chave do atleta"
      value="chave-xyz-123"
      mailtoSubject="Chave do time Furacão & Cia"
      mailtoBody="Use a chave chave-xyz-123 para ver as jogadas"
    />,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('CopyableKey', () => {
  it('mostra o rótulo e o valor da chave', () => {
    renderChave()

    expect(screen.getByText('Chave do atleta')).toBeInTheDocument()
    expect(screen.getByText('chave-xyz-123')).toBeInTheDocument()
  })

  it('copia a chave para a área de transferência e confirma no botão', async () => {
    const usuario = userEvent.setup()
    renderChave()

    await usuario.click(screen.getByRole('button', { name: 'Copiar' }))

    expect(await navigator.clipboard.readText()).toBe('chave-xyz-123')
    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
  })

  it('volta a mostrar "Copiar" 1,5 segundo depois de copiar', async () => {
    userEvent.setup() // só para instalar a área de transferência falsa
    vi.useFakeTimers()
    renderChave()
    // fireEvent em vez de user-event: o clique é síncrono e não depende do relógio falso.
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    await act(async () => {}) // deixa a cópia (assíncrona) terminar

    act(() => vi.advanceTimersByTime(1400))
    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
  })

  it('se o navegador não deixar copiar, mantém "Copiar" e a chave visível', async () => {
    const usuario = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('sem permissão'))
    renderChave()

    await usuario.click(screen.getByRole('button', { name: 'Copiar' }))

    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copiado!' })).not.toBeInTheDocument()
    expect(screen.getByText('chave-xyz-123')).toBeInTheDocument()
  })

  it('o link de e-mail já vem com assunto e texto, mesmo com acentos e "&"', () => {
    renderChave()

    const link = screen.getByRole('link', { name: 'Enviar por e-mail' })
    const url = new URL(link.getAttribute('href')!)

    expect(url.protocol).toBe('mailto:')
    expect(url.searchParams.get('subject')).toBe('Chave do time Furacão & Cia')
    expect(url.searchParams.get('body')).toBe('Use a chave chave-xyz-123 para ver as jogadas')
  })
})
