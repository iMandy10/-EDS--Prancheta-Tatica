import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { getChaveTreinador } from '../../../src/lib/storage'

// Integração: rotas, páginas, api.ts e storage reais; só a rede é falsa.
// O backend falso responde por "MÉTODO caminho" e falha alto se a página chamar algo inesperado.
type Resposta = { status: number; corpo?: unknown } | Promise<Response>

function backendFalso(rotas: Record<string, Resposta>) {
  const fetchFalso = vi.fn(async (url: string, init?: RequestInit) => {
    const rota = `${init?.method ?? 'GET'} ${new URL(url).pathname}`
    const resposta = rotas[rota]
    if (!resposta) throw new Error(`rota inesperada no teste: ${rota}`)
    if (resposta instanceof Promise) return resposta
    return new Response(JSON.stringify(resposta.corpo ?? {}), { status: resposta.status })
  })
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

const TIME = { id: 7, nome: 'Furacão FC', modalidade: 'futebol', created_at: '2026-11-19T10:00:00',
  chave_treinador: 'chave-do-treinador', chave_atleta: 'chave-do-atleta' }

function abrirSite(caminho = '/') {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <App />
    </MemoryRouter>,
  )
}

async function preencherTime(nome: string, modalidade?: string) {
  if (nome) await userEvent.type(screen.getByLabelText('Nome do time'), nome)
  if (modalidade) await userEvent.selectOptions(screen.getByLabelText('Modalidade'), modalidade)
  await userEvent.click(screen.getByRole('button', { name: 'Criar time' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CreateTeamPage: criar time', () => {
  it('cria o time com o nome sem espaços, mostra as chaves e inicia a sessão', async () => {
    const fetchFalso = backendFalso({ 'POST /teams': { status: 201, corpo: TIME } })
    abrirSite()

    await preencherTime('  Furacão FC  ', 'futebol')

    expect(await screen.findByText('Time criado com sucesso')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Furacão FC' })).toBeInTheDocument()
    expect(screen.getByText('chave-do-treinador')).toBeInTheDocument()
    expect(screen.getByText('chave-do-atleta')).toBeInTheDocument()
    expect(JSON.parse(fetchFalso.mock.calls[0][1]!.body as string)).toEqual({ nome: 'Furacão FC', modalidade: 'futebol' })
    expect(getChaveTreinador()).toBe('chave-do-treinador')
  })

  it('enquanto o servidor não responde, mostra "Criando..." e não deixa clicar de novo', async () => {
    backendFalso({ 'POST /teams': new Promise<Response>(() => {}) })
    abrirSite()

    await preencherTime('Furacão FC', 'futebol')

    expect(screen.getByRole('button', { name: 'Criando...' })).toBeDisabled()
  })

  it('não chama o servidor se o nome tiver só espaços', async () => {
    const fetchFalso = backendFalso({})
    abrirSite()

    await preencherTime('   ', 'futebol')

    expect(screen.getByText('Informe o nome do time.')).toBeInTheDocument()
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('não chama o servidor se a modalidade não foi escolhida', async () => {
    const fetchFalso = backendFalso({})
    abrirSite()

    await preencherTime('Furacão FC')

    expect(screen.getByText('Selecione a modalidade.')).toBeInTheDocument()
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('se o servidor falhar, mostra o erro, continua na página e não inicia sessão', async () => {
    backendFalso({ 'POST /teams': { status: 500 } })
    abrirSite()

    await preencherTime('Furacão FC', 'futebol')

    expect(await screen.findByText(/Não foi possível criar o time/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Criar novo time' })).toBeInTheDocument()
    expect(getChaveTreinador()).toBeNull()
  })
})
