import { describe, expect, it } from 'vitest'
import { descreverPeca, rotuloPeca } from '../../../src/lib/dinamica'
import type { Peca } from '../../../src/types/cena'

const jogador = (id: string): Peca => ({ id, tipo: 'jogador_time_a', x: 0, y: 0 })

describe('rotuloPeca', () => {
  it('a bola não tem rótulo', () => {
    expect(rotuloPeca({ id: 'bola', tipo: 'bola', x: 0, y: 0 }, 'futebol', '4-4-2')).toBe('')
  })

  it('no basquete, mostra só o número do jogador', () => {
    expect(rotuloPeca(jogador('A3'), 'basquete')).toBe('3')
    expect(rotuloPeca(jogador('B5'), 'basquete')).toBe('5')
  })

  it('no basquete, um id fora do padrão A1..B5 aparece inteiro', () => {
    expect(rotuloPeca(jogador('A6'), 'basquete')).toBe('A6')
  })

  it('no futebol, mostra a sigla da posição na formação escolhida', () => {
    expect(rotuloPeca(jogador('A1'), 'futebol', '4-4-2')).toBe('GOL')
    expect(rotuloPeca(jogador('A9'), 'futebol', '4-3-3')).toBe('PE')
    expect(rotuloPeca(jogador('B11'), 'futebol', '4-2-3-1')).toBe('ATA')
  })

  it('no futebol, sem formação ou com id fora do padrão, mostra o id', () => {
    expect(rotuloPeca(jogador('A9'), 'futebol')).toBe('A9')
    expect(rotuloPeca(jogador('A12'), 'futebol', '4-4-2')).toBe('A12')
  })
})

describe('descreverPeca', () => {
  it('no basquete, junta o id e a posição', () => {
    expect(descreverPeca('A1', 'basquete')).toBe('A1 · PG')
    expect(descreverPeca('B5', 'basquete')).toBe('B5 · C')
  })

  it('no futebol, junta o id e a posição da formação', () => {
    expect(descreverPeca('A2', 'futebol', '3-5-2')).toBe('A2 · ZAG')
    expect(descreverPeca('A2', 'futebol', '4-4-2')).toBe('A2 · LE')
  })

  it('sem posição conhecida, descreve só pelo id', () => {
    expect(descreverPeca('bola', 'basquete')).toBe('bola')
    expect(descreverPeca('A2', 'futebol')).toBe('A2')
    expect(descreverPeca('B12', 'futebol', '4-4-2')).toBe('B12')
  })
})
