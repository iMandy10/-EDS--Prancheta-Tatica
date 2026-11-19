import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ChaveAtletaModal from '../../../src/components/ChaveAtletaModal'

// Unidade: o modal com a chave do atleta; o CopyableKey de dentro é real (já testado à parte).
function abrir(aberto = true) {
  const onFechar = vi.fn()
  const tela = render(
    <ChaveAtletaModal aberto={aberto} nomeTime="Furacão FC" chaveAtleta="chave-do-atleta" onFechar={onFechar} />,
  )
  return { onFechar, ...tela }
}

describe('ChaveAtletaModal', () => {
  it('fechado, não mostra nada', () => {
    const { container } = abrir(false)

    expect(container).toBeEmptyDOMElement()
  })

  it('aberto, mostra a chave do atleta para compartilhar', () => {
    abrir()

    expect(screen.getByRole('heading', { name: 'Chave do atleta' })).toBeInTheDocument()
    expect(screen.getByText('Chave do time').parentElement).toHaveTextContent('chave-do-atleta')
  })

  it('o e-mail de compartilhamento leva o nome do time e a chave', () => {
    abrir()

    const email = decodeURIComponent(screen.getByRole('link').getAttribute('href')!)
    expect(email).toContain('Chave de acesso do time Furacão FC')
    expect(email).toContain('as jogadas do time Furacão FC no Prancheta Tática: chave-do-atleta')
  })

  it('"Fechar" avisa que o modal deve fechar', async () => {
    const { onFechar } = abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onFechar).toHaveBeenCalledOnce()
  })
})
