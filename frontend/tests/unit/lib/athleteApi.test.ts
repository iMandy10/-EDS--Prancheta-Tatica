import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ChaveInvalidaError,
  getPublishedPlay,
  getPublishedPlays,
  getTeamByChaveAtleta,
} from '../../../src/lib/athleteApi'

// Só a rede é substituída: o fetch devolve uma Response de verdade com o corpo e o status pedidos.
function responder(status: number, corpo: unknown = {}) {
  const fetchFalso = vi.fn(async () => new Response(JSON.stringify(corpo), { status }))
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

// Caminho e headers da única chamada feita (o host vem do VITE_API_URL e não importa aqui).
function chamada(fetchFalso: ReturnType<typeof responder>) {
  expect(fetchFalso).toHaveBeenCalledTimes(1)
  const [url, opcoes] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit | undefined]
  return { caminho: new URL(url).pathname, headers: new Headers(opcoes?.headers) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getTeamByChaveAtleta', () => {
  it('busca o time pela chave do atleta e devolve os dados dele', async () => {
    const time = { id: 7, nome: 'Furacão FC', modalidade: 'basquete' }
    const fetchFalso = responder(200, time)

    await expect(getTeamByChaveAtleta('abc123')).resolves.toEqual(time)
    expect(chamada(fetchFalso).caminho).toBe('/teams/access/abc123')
  })

  it('codifica a chave na URL para ela não mudar o caminho', async () => {
    const fetchFalso = responder(200)

    await getTeamByChaveAtleta('a/b c')

    expect(chamada(fetchFalso).caminho).toBe('/teams/access/a%2Fb%20c')
  })

  it('lança ChaveInvalidaError quando o backend responde 404', async () => {
    responder(404)

    await expect(getTeamByChaveAtleta('errada')).rejects.toBeInstanceOf(ChaveInvalidaError)
  })

  it('lança um erro genérico, e não de chave inválida, quando o servidor falha', async () => {
    responder(500)

    const erro = await getTeamByChaveAtleta('abc123').catch((e: unknown) => e)

    expect(erro).not.toBeInstanceOf(ChaveInvalidaError)
    expect(erro).toEqual(new Error('Não foi possível validar a chave.'))
  })
})

describe('getPublishedPlays', () => {
  it('lista as jogadas publicadas do time enviando a chave do atleta no header', async () => {
    const jogadas = [{ id: 3, titulo: 'Pick and roll' }]
    const fetchFalso = responder(200, jogadas)

    await expect(getPublishedPlays(7, 'abc123')).resolves.toEqual(jogadas)
    const { caminho, headers } = chamada(fetchFalso)
    expect(caminho).toBe('/teams/7/plays/published')
    expect(headers.get('X-Chave-Atleta')).toBe('abc123')
  })

  it('lança erro quando a lista não pode ser carregada', async () => {
    responder(404)

    await expect(getPublishedPlays(7, 'errada')).rejects.toThrow('Não foi possível carregar as jogadas.')
  })
})

describe('getPublishedPlay', () => {
  it('busca uma jogada publicada enviando a chave do atleta no header', async () => {
    const jogada = { id: 3, titulo: 'Pick and roll', cena_json: { quadra: 'basquete', pecas: [], acoes: [] } }
    const fetchFalso = responder(200, jogada)

    await expect(getPublishedPlay(7, 3, 'abc123')).resolves.toEqual(jogada)
    const { caminho, headers } = chamada(fetchFalso)
    expect(caminho).toBe('/teams/7/plays/published/3')
    expect(headers.get('X-Chave-Atleta')).toBe('abc123')
  })

  it('lança erro quando a jogada não está disponível, como um rascunho', async () => {
    responder(404)

    await expect(getPublishedPlay(7, 3, 'abc123')).rejects.toThrow('Não foi possível carregar a jogada.')
  })
})
