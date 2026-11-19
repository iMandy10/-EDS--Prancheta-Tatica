import { describe, expect, it } from 'vitest'
import { clearChaveTreinador, getChaveTreinador, setChaveTreinador } from '../../../src/lib/storage'

describe('storage da chave do treinador', () => {
  it('devolve null quando nenhuma chave foi salva', () => {
    expect(getChaveTreinador()).toBeNull()
  })

  it('devolve a chave que foi salva', () => {
    setChaveTreinador('chave-abc')

    expect(getChaveTreinador()).toBe('chave-abc')
  })

  it('substitui a chave antiga ao salvar uma nova', () => {
    setChaveTreinador('chave-antiga')
    setChaveTreinador('chave-nova')

    expect(getChaveTreinador()).toBe('chave-nova')
  })

  it('apaga a chave ao sair', () => {
    setChaveTreinador('chave-abc')

    clearChaveTreinador()

    expect(getChaveTreinador()).toBeNull()
  })

  it('apaga só a chave do treinador e mantém os outros dados do navegador', () => {
    localStorage.setItem('outro-dado', 'continua aqui')
    setChaveTreinador('chave-abc')

    clearChaveTreinador()

    expect(localStorage.getItem('outro-dado')).toBe('continua aqui')
  })
})
