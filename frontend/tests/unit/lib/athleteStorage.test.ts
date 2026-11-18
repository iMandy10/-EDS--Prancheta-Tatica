import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearChaveAtleta, getChaveAtleta, setChaveAtleta } from '../../../src/lib/athleteStorage'
import { getChaveTreinador, setChaveTreinador } from '../../../src/lib/storage'

afterEach(() => {
  localStorage.clear()
})

describe('athleteStorage', () => {
  it('devolve null quando nenhuma chave foi salva', () => {
    expect(getChaveAtleta()).toBeNull()
  })

  it('guarda a chave de forma que ela sobrevive a um novo carregamento do módulo', async () => {
    setChaveAtleta('abc123')

    vi.resetModules()
    const recarregado = await import('../../../src/lib/athleteStorage')

    expect(recarregado.getChaveAtleta()).toBe('abc123')
  })

  it('apaga a chave salva', () => {
    setChaveAtleta('abc123')

    clearChaveAtleta()

    expect(getChaveAtleta()).toBeNull()
  })

  it('não sobrescreve a chave do treinador salva no mesmo navegador', () => {
    setChaveTreinador('chave-do-treinador')

    setChaveAtleta('chave-do-atleta')
    clearChaveAtleta()

    expect(getChaveTreinador()).toBe('chave-do-treinador')
  })
})
