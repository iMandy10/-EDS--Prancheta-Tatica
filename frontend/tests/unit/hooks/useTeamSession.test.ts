import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTeamSession } from '../../../src/hooks/useTeamSession'
import { getTeamByChaveTreinador, type Team } from '../../../src/lib/api'
import { getChaveTreinador, setChaveTreinador } from '../../../src/lib/storage'

// Unidade: a API é falsa; o storage usa o localStorage do jsdom (limpo a cada teste).
vi.mock('../../../src/lib/api', () => ({ getTeamByChaveTreinador: vi.fn() }))
const buscarTime = vi.mocked(getTeamByChaveTreinador)

const TIME: Team = {
  id: 7,
  nome: 'Furacão FC',
  modalidade: 'futebol',
  chave_treinador: 'chave-valida',
  chave_atleta: 'chave-do-atleta',
  created_at: '2026-11-19T10:00:00',
}

beforeEach(() => {
  buscarTime.mockReset()
})

describe('useTeamSession', () => {
  it('sem chave salva, não consulta a API nem marca como não encontrado', () => {
    const { result } = renderHook(() => useTeamSession())

    expect(result.current).toEqual({ chave: null, team: null, notFound: false })
    expect(buscarTime).not.toHaveBeenCalled()
  })

  it('com chave válida, fica carregando e depois devolve o time da API', async () => {
    setChaveTreinador('chave-valida')
    let responder: (time: Team) => void = () => {}
    buscarTime.mockReturnValue(new Promise((resolve) => (responder = resolve)))

    const { result } = renderHook(() => useTeamSession())

    expect(result.current).toEqual({ chave: 'chave-valida', team: null, notFound: false })
    expect(buscarTime).toHaveBeenCalledWith('chave-valida')

    responder(TIME)
    await waitFor(() => expect(result.current.team).toEqual(TIME))
    expect(result.current.notFound).toBe(false)
  })

  it('com chave inválida, marca como não encontrado e apaga a chave salva', async () => {
    setChaveTreinador('chave-invalida')
    buscarTime.mockRejectedValue(new Error('Time não encontrado.'))

    const { result } = renderHook(() => useTeamSession())

    await waitFor(() => expect(result.current.notFound).toBe(true))
    expect(result.current.team).toBeNull()
    expect(getChaveTreinador()).toBeNull()
  })
})
