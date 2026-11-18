import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { getChaveAtleta, setChaveAtleta } from '../../../src/lib/athleteStorage'

// Integração: rotas, páginas, hooks e lib reais; só a rede é falsa (responde por caminho).
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

const TIME = { id: 7, nome: 'Furacão Basquete', modalidade: 'basquete' }
const SESSAO = { team: TIME, chave: 'abc123' }
const RESUMO = { team_id: 7, status: 'publicada', created_at: '2026-11-18T10:00:00', updated_at: '2026-11-18T10:00:00' }
const JOGADAS = [
  { ...RESUMO, id: 3, titulo: 'Pick and roll', descricao: 'Bloqueio do pivô' },
  { ...RESUMO, id: 4, titulo: 'Contra-ataque', descricao: null },
]
const PICK_AND_ROLL = {
  ...JOGADAS[0],
  cena_json: {
    quadra: 'basquete',
    pecas: [{ id: 'A1', tipo: 'jogador_time_a', x: 330, y: 250 }],
    acoes: [{ id: 'm', tipo: 'movimentacao', origem: 'A1', destino: { x: 500, y: 250 }, ordem: 1 }],
  },
}

function abrir(rota: string, state: unknown = SESSAO) {
  render(
    <MemoryRouter initialEntries={[{ pathname: rota, state }]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AthletePlaysPage', () => {
  it('sem sessão, manda o atleta para a tela de entrada', async () => {
    abrir('/atleta/jogadas', null)

    expect(await screen.findByRole('heading', { name: 'Entrar como atleta' })).toBeInTheDocument()
  })

  it('lista as jogadas publicadas com título e descrição', async () => {
    backendFalso({ '/teams/7/plays/published': { status: 200, corpo: JOGADAS } })

    abrir('/atleta/jogadas')

    expect(screen.getByText('Furacão Basquete')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Pick and roll/ })).toHaveTextContent('Bloqueio do pivô')
    expect(screen.getByRole('button', { name: 'Contra-ataque' })).toBeInTheDocument()
  })

  it('avisa quando o treinador ainda não publicou nenhuma jogada', async () => {
    backendFalso({ '/teams/7/plays/published': { status: 200, corpo: [] } })

    abrir('/atleta/jogadas')

    expect(await screen.findByText('Nenhuma jogada publicada ainda.')).toBeInTheDocument()
  })

  it('mostra erro quando a lista não carrega', async () => {
    backendFalso({ '/teams/7/plays/published': { status: 500 } })

    abrir('/atleta/jogadas')

    expect(await screen.findByText('Não foi possível carregar as jogadas.')).toBeInTheDocument()
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
  })

  it('abre uma jogada e volta para a lista', async () => {
    backendFalso({
      '/teams/7/plays/published': { status: 200, corpo: JOGADAS },
      '/teams/7/plays/published/3': { status: 200, corpo: PICK_AND_ROLL },
    })
    abrir('/atleta/jogadas')

    await userEvent.click(await screen.findByRole('button', { name: /Pick and roll/ }))
    expect(await screen.findByRole('heading', { name: 'Pick and roll' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByRole('heading', { name: 'Jogadas do time' })).toBeInTheDocument()
  })

  it('ao sair, apaga a chave e volta para a entrada sem entrar de novo sozinho', async () => {
    setChaveAtleta('abc123')
    backendFalso({ '/teams/7/plays/published': { status: 200, corpo: JOGADAS } })
    abrir('/atleta/jogadas')

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByLabelText('Chave do time')).toHaveValue('')
    expect(getChaveAtleta()).toBeNull()
  })
})
