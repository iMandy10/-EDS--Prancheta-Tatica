import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { getChaveTreinador, setChaveTreinador } from '../../../src/lib/storage'

// Integração: rotas, páginas, hook de sessão, api.ts e storage reais; só a rede é falsa.
const TIME = { id: 7, nome: 'Furacão Basquete', modalidade: 'basquete', created_at: '2026-11-19T10:00:00',
  chave_treinador: 'chave-do-treinador', chave_atleta: 'chave-do-atleta' }

// O servidor só conhece a chave do TIME; qualquer outra chave dá 404.
function backendFalso(resposta: Promise<Response> | null = null) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (resposta) return resposta
    const ok = new URL(url).pathname === '/teams/chave-do-treinador'
    return new Response(JSON.stringify(ok ? TIME : { detail: 'Time não encontrado' }), { status: ok ? 200 : 404 })
  }))
}

function abrirBemVindo(chave: string | null = 'chave-do-treinador') {
  if (chave) setChaveTreinador(chave)
  render(
    <MemoryRouter initialEntries={['/times/bem-vindo']}>
      <App />
    </MemoryRouter>,
  )
}

const bemVindo = () => screen.findByRole('heading', { name: 'Bem-vindo de volta!' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WelcomeBackPage', () => {
  it('mostra "Carregando..." enquanto busca o time da chave salva', () => {
    backendFalso(new Promise<Response>(() => {}))
    abrirBemVindo()

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('com chave válida, mostra o nome e a modalidade do time', async () => {
    backendFalso()
    abrirBemVindo()

    expect(await bemVindo()).toBeInTheDocument()
    expect(screen.getByText(/Time:/)).toHaveTextContent('Time: Furacão Basquete · Basquete')
  })

  it('sem chave salva, volta para a tela inicial', () => {
    backendFalso()
    abrirBemVindo(null)

    expect(screen.getByRole('heading', { name: 'Criar novo time' })).toBeInTheDocument()
  })

  it('com chave que não existe mais, apaga a sessão e volta para a tela inicial', async () => {
    backendFalso()
    abrirBemVindo('chave-apagada')

    expect(await screen.findByRole('heading', { name: 'Criar novo time' })).toBeInTheDocument()
    expect(getChaveTreinador()).toBeNull()
  })

  it('"Ver chave do atleta" abre a chave para compartilhar, e "Fechar" esconde', async () => {
    backendFalso()
    abrirBemVindo()
    await bemVindo()

    await userEvent.click(screen.getByRole('button', { name: 'Ver chave do atleta' }))
    expect(screen.getByText('Chave do time').parentElement).toHaveTextContent('chave-do-atleta')

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByText('chave-do-atleta')).not.toBeInTheDocument()
  })

  it('"Sair" encerra a sessão e volta para a tela inicial', async () => {
    backendFalso()
    abrirBemVindo()
    await bemVindo()

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(screen.getByRole('heading', { name: 'Criar novo time' })).toBeInTheDocument()
    expect(getChaveTreinador()).toBeNull()
  })

  it('"Ir para o editor" abre o editor do time', async () => {
    backendFalso()
    abrirBemVindo()
    await bemVindo()

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o editor' }))

    expect(await screen.findByText('Editor de jogadas')).toBeInTheDocument()
  })
})
