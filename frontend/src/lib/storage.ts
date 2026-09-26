const CHAVE_TREINADOR_KEY = 'prancheta_tatica:chave_treinador'

export function getChaveTreinador(): string | null {
  return localStorage.getItem(CHAVE_TREINADOR_KEY)
}

export function setChaveTreinador(chave: string): void {
  localStorage.setItem(CHAVE_TREINADOR_KEY, chave)
}

export function clearChaveTreinador(): void {
  localStorage.removeItem(CHAVE_TREINADOR_KEY)
}
