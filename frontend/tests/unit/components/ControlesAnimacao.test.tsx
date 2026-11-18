import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ControlesAnimacao from '../../../src/components/ControlesAnimacao'

function renderizar(props: { tocando?: boolean; desabilitado?: boolean } = {}) {
  const callbacks = { onTocar: vi.fn(), onPausar: vi.fn(), onReiniciar: vi.fn() }
  render(<ControlesAnimacao tocando={false} desabilitado={false} {...callbacks} {...props} />)
  return callbacks
}

describe('ControlesAnimacao', () => {
  it('parado, mostra Play e Reiniciar, e o Play pede para tocar', async () => {
    const { onTocar, onPausar } = renderizar()

    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(onTocar).toHaveBeenCalledTimes(1)
    expect(onPausar).not.toHaveBeenCalled()
  })

  it('tocando, troca o botão por Pausar, que pede para pausar', async () => {
    const { onTocar, onPausar } = renderizar({ tocando: true })

    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))

    expect(onPausar).toHaveBeenCalledTimes(1)
    expect(onTocar).not.toHaveBeenCalled()
  })

  it('o Reiniciar pede para reiniciar', async () => {
    const { onReiniciar } = renderizar({ tocando: true })

    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar' }))

    expect(onReiniciar).toHaveBeenCalledTimes(1)
  })

  it('desabilitado, não deixa tocar nem reiniciar', async () => {
    const callbacks = renderizar({ desabilitado: true })

    const play = screen.getByRole('button', { name: 'Play' })
    const reiniciar = screen.getByRole('button', { name: 'Reiniciar' })
    expect(play).toBeDisabled()
    expect(reiniciar).toBeDisabled()

    await userEvent.click(play)
    await userEvent.click(reiniciar)
    Object.values(callbacks).forEach((callback) => expect(callback).not.toHaveBeenCalled())
  })
})
