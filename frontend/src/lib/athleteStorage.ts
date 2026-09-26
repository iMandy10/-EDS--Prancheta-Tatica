const CHAVE_ATLETA_KEY = 'prancheta_tatica:chave_atleta'

export function getChaveAtleta(): string | null {
  return localStorage.getItem(CHAVE_ATLETA_KEY)
}

export function setChaveAtleta(chave: string): void {
  localStorage.setItem(CHAVE_ATLETA_KEY, chave)
}

export function clearChaveAtleta(): void {
  localStorage.removeItem(CHAVE_ATLETA_KEY)
}
