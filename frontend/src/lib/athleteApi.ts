import type { Modalidade, Play, PlaySummary } from './api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface TeamAccess {
  id: number
  nome: string
  modalidade: Modalidade
}

export class ChaveInvalidaError extends Error {}

export async function getTeamByChaveAtleta(chaveAtleta: string): Promise<TeamAccess> {
  const response = await fetch(`${API_URL}/teams/access/${encodeURIComponent(chaveAtleta)}`)

  if (response.status === 404) {
    throw new ChaveInvalidaError('Chave de atleta inválida.')
  }
  if (!response.ok) {
    throw new Error('Não foi possível validar a chave.')
  }

  return response.json()
}

export async function getPublishedPlays(teamId: number, chaveAtleta: string): Promise<PlaySummary[]> {
  const response = await fetch(`${API_URL}/teams/${teamId}/plays/published`, {
    headers: { 'X-Chave-Atleta': chaveAtleta },
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar as jogadas.')
  }

  return response.json()
}

export async function getPublishedPlay(teamId: number, playId: number, chaveAtleta: string): Promise<Play> {
  const response = await fetch(`${API_URL}/teams/${teamId}/plays/published/${playId}`, {
    headers: { 'X-Chave-Atleta': chaveAtleta },
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar a jogada.')
  }

  return response.json()
}
