import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { getChaveAtleta, setChaveAtleta } from '../../../src/lib/athleteStorage'

// Integração: rotas, páginas, hooks e lib reais; só a rede é falsa.
// O backend falso responde por caminho e falha alto se a página chamar algo inesperado.
type Resposta = { status: number; corpo?: unknown }

function backendFalso(rotas: Record<string, Resposta>) {
  const fetchFalso = vi.fn(async (url: string) => {
    const caminho = decodeURIComponent(new URL(url).pathname)
    const resposta = rotas[caminho]
    if (!resposta) throw new Error(`rota inesperada no teste: ${caminho}`)
    return new Response(JSON.stringify(resposta.corpo ?? {}), { status: resposta.status })
  })
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

const TIME = { id: 7, nome: 'Furacão Basquete', modalidade: 'basquete' }
const JOGADAS = [{ id: 3, team_id: 7, titulo: 'Pick and roll', descricao: null, status: 'publicada' }]

function backendComChave(chave: string, statusDaChave = 200) {
  return backendFalso({
    [`/teams/access/${chave}`]: { status: statusDaChave, corpo: statusDaChave === 200 ? TIME : {} },
    '/teams/7/plays/published': { status: 200, corpo: JOGADAS },
  })
}

function abrirEntrada() {
  render(
    <MemoryRouter initialEntries={['/atleta']}>
      <App />
    </MemoryRouter>,
  )
}

async function entrarCom(chave: string) {
  await userEvent.type(screen.getByLabelText('Chave do time'), chave)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AthleteEntryPage: entrar com a chave', () => {
  it('com a chave válida, salva a chave e abre a lista de jogadas do time', async () => {
    backendComChave('abc123')
    abrirEntrada()

    await entrarCom('abc123')

    expect(await screen.findByRole('heading', { name: 'Jogadas do time' })).toBeInTheDocument()
    expect(screen.getByText('Furacão Basquete')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Pick and roll' })).toBeInTheDocument()
    expect(getChaveAtleta()).toBe('abc123')
  })

  it('ignora espaços nas pontas da chave colada', async () => {
    backendComChave('abc123')
    abrirEntrada()

    await entrarCom('  abc123  ')

    expect(await screen.findByRole('heading', { name: 'Jogadas do time' })).toBeInTheDocument()
    expect(getChaveAtleta()).toBe('abc123')
  })

  it('com a chave inválida, mostra o erro, continua na entrada e não salva nada', async () => {
    backendComChave('errada', 404)
    abrirEntrada()

    await entrarCom('errada')

    expect(await screen.findByText('Chave inválida. Confira com seu treinador e tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Entrar como atleta' })).toBeInTheDocument()
    expect(getChaveAtleta()).toBeNull()
  })

  it('com o servidor fora do ar, diz que não conseguiu validar em vez de culpar a chave', async () => {
    backendComChave('abc123', 500)
    abrirEntrada()

    await entrarCom('abc123')

    expect(await screen.findByText(/Não foi possível validar a chave/)).toBeInTheDocument()
    expect(screen.queryByText(/Chave inválida/)).not.toBeInTheDocument()
  })

  it('sem chave, pede para colar a chave e nem chama o backend', async () => {
    const fetchFalso = backendComChave('abc123')
    abrirEntrada()

    await entrarCom('   ')

    expect(screen.getByText('Cole a chave do seu time.')).toBeInTheDocument()
    expect(fetchFalso).not.toHaveBeenCalled()
  })
})

describe('AthleteEntryPage: chave salva de uma visita anterior', () => {
  it('com a chave salva válida, vai direto para a lista sem pedir a chave', async () => {
    setChaveAtleta('abc123')
    backendComChave('abc123')

    abrirEntrada()

    expect(await screen.findByRole('heading', { name: 'Jogadas do time' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Chave do time')).not.toBeInTheDocument()
  })

  it('com a chave salva que deixou de valer, apaga a chave e mostra o formulário vazio', async () => {
    setChaveAtleta('antiga')
    backendComChave('antiga', 404)

    abrirEntrada()

    expect(await screen.findByLabelText('Chave do time')).toHaveValue('')
    expect(getChaveAtleta()).toBeNull()
  })

  it('com o servidor fora do ar, mantém a chave salva no formulário para tentar de novo', async () => {
    setChaveAtleta('abc123')
    backendComChave('abc123', 500)

    abrirEntrada()

    expect(await screen.findByLabelText('Chave do time')).toHaveValue('abc123')
    expect(screen.getByText(/Não foi possível validar a chave/)).toBeInTheDocument()
    expect(getChaveAtleta()).toBe('abc123')
  })
})
