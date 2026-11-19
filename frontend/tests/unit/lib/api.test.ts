import { describe, expect, it } from 'vitest'
import {
  createPlay, createTeam, deletePlay, getPlay, getPlays, getTeamByChaveTreinador, updatePlay,
} from '../../../src/lib/api'
import { CENA, CHAVE, JOGADA, RESUMO, TIME } from '../../helpers/dados'
import { chamada, mockFetch } from '../../helpers/mockFetch'

// Unidade: o cliente HTTP sozinho, com o fetch falso no lugar da rede.
const caminho = (url: string) => new URL(url).pathname

describe('api: times', () => {
  it('createTeam manda nome e modalidade em JSON e devolve o time criado', async () => {
    const fetchFalso = mockFetch({ 'POST /teams': { status: 201, corpo: TIME } })

    expect(await createTeam('Furacão FC', 'futebol')).toEqual(TIME)
    const { headers, corpo } = chamada(fetchFalso)
    expect(headers['Content-Type']).toBe('application/json')
    expect(corpo).toEqual({ nome: 'Furacão FC', modalidade: 'futebol' })
  })

  it('getTeamByChaveTreinador busca o time pela chave na URL', async () => {
    const fetchFalso = mockFetch({ [`GET /teams/${CHAVE}`]: { status: 200, corpo: TIME } })

    expect(await getTeamByChaveTreinador(CHAVE)).toEqual(TIME)
    expect(fetchFalso).toHaveBeenCalledOnce()
  })
})

describe('api: jogadas', () => {
  it('createPlay manda a chave no header e a jogada com a cena no corpo', async () => {
    const fetchFalso = mockFetch({ 'POST /teams/7/plays': { status: 201, corpo: JOGADA } })
    const payload = { titulo: 'Saída de bola', descricao: null, status: 'rascunho' as const, cena: CENA }

    expect(await createPlay(7, CHAVE, payload)).toEqual(JOGADA)
    const { headers, corpo } = chamada(fetchFalso)
    expect(headers).toEqual({ 'Content-Type': 'application/json', 'X-Chave-Treinador': CHAVE })
    expect(corpo).toEqual(payload)
  })

  it('getPlays e getPlay leem as jogadas mandando a chave no header', async () => {
    const fetchFalso = mockFetch({
      'GET /teams/7/plays': { status: 200, corpo: [RESUMO] },
      'GET /plays/3': { status: 200, corpo: JOGADA },
    })

    expect(await getPlays(7, CHAVE)).toEqual([RESUMO])
    expect(await getPlay(3, CHAVE)).toEqual(JOGADA)
    expect(chamada(fetchFalso, 0).headers['X-Chave-Treinador']).toBe(CHAVE)
    expect(chamada(fetchFalso, 1).headers['X-Chave-Treinador']).toBe(CHAVE)
  })

  it('updatePlay usa PATCH e manda só os campos alterados', async () => {
    const fetchFalso = mockFetch({ 'PATCH /plays/3': { status: 200, corpo: { ...RESUMO, status: 'publicada' } } })

    expect((await updatePlay(3, CHAVE, { status: 'publicada' })).status).toBe('publicada')
    const { headers, corpo } = chamada(fetchFalso)
    expect(headers['X-Chave-Treinador']).toBe(CHAVE)
    expect(corpo).toEqual({ status: 'publicada' })
  })

  it('deletePlay usa DELETE na jogada certa, com a chave', async () => {
    const fetchFalso = mockFetch({ 'DELETE /plays/3': { status: 204 } })

    await expect(deletePlay(3, CHAVE)).resolves.toBeUndefined()
    const { url, headers } = chamada(fetchFalso)
    expect(caminho(url)).toBe('/plays/3')
    expect(headers['X-Chave-Treinador']).toBe(CHAVE)
  })
})

describe('api: erros', () => {
  // Cada função, quando o servidor responde com erro, lança a mensagem que a tela mostra.
  it.each([
    ['createTeam', 'POST /teams', () => createTeam('X', 'futebol'), 'Não foi possível criar o time.'],
    ['getTeamByChaveTreinador', 'GET /teams/errada', () => getTeamByChaveTreinador('errada'), 'Time não encontrado.'],
    ['createPlay', 'POST /teams/7/plays', () => createPlay(7, CHAVE, { titulo: 'X', descricao: null, status: 'rascunho', cena: CENA }), 'Não foi possível salvar a jogada.'],
    ['getPlays', 'GET /teams/7/plays', () => getPlays(7, CHAVE), 'Não foi possível carregar as jogadas.'],
    ['getPlay', 'GET /plays/3', () => getPlay(3, CHAVE), 'Não foi possível carregar a jogada.'],
    ['updatePlay', 'PATCH /plays/3', () => updatePlay(3, CHAVE, { titulo: 'Y' }), 'Não foi possível atualizar a jogada.'],
    ['deletePlay', 'DELETE /plays/3', () => deletePlay(3, CHAVE), 'Não foi possível excluir a jogada.'],
  ])('%s lança erro quando o servidor recusa', async (_nome, rota, chamar, mensagem) => {
    mockFetch({ [rota]: { status: 404 } })

    await expect(chamar()).rejects.toThrow(mensagem)
  })
})
