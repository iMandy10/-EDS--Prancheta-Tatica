import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useJogadas } from '../../../src/hooks/useJogadas'
import { deletePlay, getPlays, updatePlay } from '../../../src/lib/api'
import { CHAVE, RESUMO } from '../../helpers/dados'

// Unidade: o hook sozinho; o cliente da API é falso. A parte de carregar e publicar fica em useJogadas.test.ts.
vi.mock('../../../src/lib/api', () => ({ getPlays: vi.fn(), updatePlay: vi.fn(), deletePlay: vi.fn() }))
const buscar = vi.mocked(getPlays)
const atualizar = vi.mocked(updatePlay)
const apagar = vi.mocked(deletePlay)

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue([RESUMO])
})

async function hookCarregado() {
  const hook = renderHook(() => useJogadas(7, CHAVE))
  await waitFor(() => expect(hook.result.current.jogadas).toEqual([RESUMO]))
  return hook
}

describe('useJogadas: excluir', () => {
  it('só apaga depois de o treinador confirmar, e então recarrega a lista', async () => {
    const { result } = await hookCarregado()
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    buscar.mockResolvedValue([])

    await act(() => result.current.excluir(RESUMO))
    expect(apagar).not.toHaveBeenCalled()

    await act(() => result.current.excluir(RESUMO))
    expect(apagar).toHaveBeenCalledWith(3, CHAVE)
    expect(confirmar).toHaveBeenLastCalledWith(expect.stringContaining('"Saída de bola"'))
    await waitFor(() => expect(result.current.jogadas).toEqual([]))
  })

  it('se a exclusão falhar, avisa com uma mensagem de erro', async () => {
    const { result } = await hookCarregado()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apagar.mockRejectedValue(new Error('rede'))

    await act(() => result.current.excluir(RESUMO))

    expect(result.current.erro).toBe('Não foi possível excluir a jogada.')
  })

  it('sem chave, não publica nem apaga', async () => {
    const { result } = renderHook(() => useJogadas(7, null))
    const confirmar = vi.spyOn(window, 'confirm')

    await act(() => result.current.alternarStatus(RESUMO))
    await act(() => result.current.excluir(RESUMO))

    expect(atualizar).not.toHaveBeenCalled()
    expect(confirmar).not.toHaveBeenCalled()
  })
})
