import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useJogadas } from '../../../src/hooks/useJogadas'
import { deletePlay, getPlays, updatePlay } from '../../../src/lib/api'
import { CHAVE, RESUMO } from '../../helpers/dados'

// Unidade: o hook sozinho; o cliente da API é falso.
vi.mock('../../../src/lib/api', () => ({ getPlays: vi.fn(), updatePlay: vi.fn(), deletePlay: vi.fn() }))
const buscar = vi.mocked(getPlays)
const atualizar = vi.mocked(updatePlay)
const apagar = vi.mocked(deletePlay)

const PUBLICADA = { ...RESUMO, status: 'publicada' as const }

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue([RESUMO])
})

async function hookCarregado() {
  const hook = renderHook(() => useJogadas(7, CHAVE))
  await waitFor(() => expect(hook.result.current.jogadas).toEqual([RESUMO]))
  return hook
}

describe('useJogadas: carregar', () => {
  it('busca as jogadas do time com a chave do treinador', async () => {
    await hookCarregado()

    expect(buscar).toHaveBeenCalledWith(7, CHAVE)
  })

  it('sem time ou sem chave, não busca nada', () => {
    const semTime = renderHook(() => useJogadas(undefined, CHAVE))
    const semChave = renderHook(() => useJogadas(7, null))

    expect(buscar).not.toHaveBeenCalled()
    expect(semTime.result.current.jogadas).toBeNull()
    expect(semChave.result.current.jogadas).toBeNull()
  })

  it('se a busca falhar, avisa com uma mensagem de erro', async () => {
    buscar.mockRejectedValue(new Error('rede'))
    const { result } = renderHook(() => useJogadas(7, CHAVE))

    await waitFor(() => expect(result.current.erro).toBe('Não foi possível carregar as jogadas.'))
  })
})

describe('useJogadas: publicar e despublicar', () => {
  it('publica um rascunho e recarrega a lista', async () => {
    const { result } = await hookCarregado()
    atualizar.mockResolvedValue(PUBLICADA)
    buscar.mockResolvedValue([PUBLICADA])

    await act(() => result.current.alternarStatus(RESUMO))

    expect(atualizar).toHaveBeenCalledWith(3, CHAVE, { status: 'publicada' })
    await waitFor(() => expect(result.current.jogadas).toEqual([PUBLICADA]))
  })

  it('despublica uma jogada publicada, que volta a ser rascunho', async () => {
    const { result } = await hookCarregado()

    await act(() => result.current.alternarStatus(PUBLICADA))

    expect(atualizar).toHaveBeenCalledWith(3, CHAVE, { status: 'rascunho' })
  })

  it('se a troca de status falhar, avisa com uma mensagem de erro', async () => {
    const { result } = await hookCarregado()
    atualizar.mockRejectedValue(new Error('rede'))

    await act(() => result.current.alternarStatus(RESUMO))

    expect(result.current.erro).toBe('Não foi possível atualizar o status da jogada.')
  })
})
