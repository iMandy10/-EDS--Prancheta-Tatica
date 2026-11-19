import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'

// Integração: rotas, páginas, hook de animação, motor e componentes reais; só a rede é falsa.
type Resposta = { status: number; corpo?: unknown }

function backendFalso(rotas: Record<string, Resposta>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const caminho = new URL(url).pathname
      const resposta = rotas[caminho]
      if (!resposta) throw new Error(`rota inesperada no teste: ${caminho}`)
      return new Response(JSON.stringify(resposta.corpo ?? {}), { status: resposta.status })
    }),
  )
}

const SESSAO = { team: { id: 7, nome: 'Furacão Basquete', modalidade: 'basquete' }, chave: 'abc123' }
const CENA = {
  quadra: 'basquete',
  pecas: [
    { id: 'A1', tipo: 'jogador_time_a', x: 330, y: 250 },
    { id: 'bola', tipo: 'bola', x: 343, y: 263, posse: 'A1' },
  ],
  acoes: [{ id: 'd', tipo: 'drible', origem: 'A1', destino: { x: 500, y: 250 }, ordem: 1 }],
}
const JOGADA = {
  id: 3,
  team_id: 7,
  titulo: 'Pick and roll',
  descricao: 'Bloqueio do pivô para o armador',
  status: 'publicada',
  cena_json: CENA,
  created_at: '2026-11-18T10:00:00',
  updated_at: '2026-11-18T10:00:00',
}

function abrirJogada(state: unknown = SESSAO) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/atleta/jogadas/3', state }]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AthletePlayViewerPage', () => {
  it('sem sessão, manda o atleta para a tela de entrada', async () => {
    abrirJogada(null)

    expect(await screen.findByRole('heading', { name: 'Entrar como atleta' })).toBeInTheDocument()
  })

  it('mostra a jogada no início, com título, descrição e controles prontos', async () => {
    backendFalso({ '/teams/7/plays/published/3': { status: 200, corpo: JOGADA } })

    abrirJogada()

    expect(await screen.findByRole('heading', { name: 'Pick and roll' })).toBeInTheDocument()
    expect(screen.getByText('Bloqueio do pivô para o armador')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progresso da jogada' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeEnabled()
  })

  it('alterna entre Play e Pausar ao tocar e pausar', async () => {
    backendFalso({ '/teams/7/plays/published/3': { status: 200, corpo: JOGADA } })
    abrirJogada()

    await userEvent.click(await screen.findByRole('button', { name: 'Play' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('com uma jogada sem ações, não deixa tocar nem reiniciar', async () => {
    backendFalso({ '/teams/7/plays/published/3': { status: 200, corpo: { ...JOGADA, cena_json: { ...CENA, acoes: [] } } } })

    abrirJogada()

    expect(await screen.findByRole('button', { name: 'Play' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reiniciar' })).toBeDisabled()
  })

  it('mostra erro quando a jogada não está mais disponível, como ao voltar a rascunho', async () => {
    backendFalso({ '/teams/7/plays/published/3': { status: 404 } })

    abrirJogada()

    expect(await screen.findByText('Não foi possível carregar a jogada.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Jogada' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
  })
})
