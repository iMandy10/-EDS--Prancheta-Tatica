import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { setChaveTreinador } from '../../../src/lib/storage'

// Integração: rotas, páginas e componentes reais; só a rede é falsa.
const TIME = { id: 7, nome: 'Furacão FC', modalidade: 'futebol', created_at: '2026-11-19T10:00:00',
  chave_treinador: 'chave-do-treinador', chave_atleta: 'chave-do-atleta' }

function abrirConfirmacao(team?: object) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/times/confirmacao', state: team ? { team } : null }]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ConfirmationPage', () => {
  it('mostra o time criado com as duas chaves, cada uma com o seu rótulo', () => {
    abrirConfirmacao(TIME)

    expect(screen.getByText('Time criado com sucesso')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Furacão FC' })).toBeInTheDocument()
    expect(screen.getByText('Futebol')).toBeInTheDocument()
    const rotuloTreinador = screen.getByText('Sua chave de treinador (guarde com você)')
    const rotuloAtleta = screen.getByText('Chave do atleta (compartilhe com o time)')
    expect(rotuloTreinador.parentElement).toHaveTextContent('chave-do-treinador')
    expect(rotuloAtleta.parentElement).toHaveTextContent('chave-do-atleta')
  })

  it('mostra "Basquete" para um time de basquete', () => {
    abrirConfirmacao({ ...TIME, modalidade: 'basquete' })

    expect(screen.getByText('Basquete')).toBeInTheDocument()
  })

  it('aberta sem um time recém-criado, volta para a tela inicial', () => {
    abrirConfirmacao()

    expect(screen.getByRole('heading', { name: 'Criar novo time' })).toBeInTheDocument()
  })

  it('"Continuar para o editor" abre o editor do time', async () => {
    setChaveTreinador('chave-do-treinador')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(TIME), { status: 200 })))
    abrirConfirmacao(TIME)

    await userEvent.click(screen.getByRole('button', { name: 'Continuar para o editor' }))

    expect(await screen.findByText('Editor de jogadas')).toBeInTheDocument()
  })
})
