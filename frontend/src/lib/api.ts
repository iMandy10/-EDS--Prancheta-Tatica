import type { Cena } from '../types/cena'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Modalidade = 'futebol' | 'basquete'

export type StatusJogada = 'rascunho' | 'publicada'

export interface Play {
  id: number
  team_id: number
  titulo: string
  descricao: string | null
  cena_json: Cena
  status: StatusJogada
  created_at: string
  updated_at: string
}

export interface PlaySummary {
  id: number
  team_id: number
  titulo: string
  descricao: string | null
  status: StatusJogada
  created_at: string
  updated_at: string
}

export interface Team {
  id: number
  nome: string
  modalidade: Modalidade
  chave_treinador: string
  chave_atleta: string
  created_at: string
}

export async function createTeam(nome: string, modalidade: Modalidade): Promise<Team> {
  const response = await fetch(`${API_URL}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, modalidade }),
  })

  if (!response.ok) {
    throw new Error('Não foi possível criar o time.')
  }

  return response.json()
}

export async function getTeamByChaveTreinador(chaveTreinador: string): Promise<Team> {
  const response = await fetch(`${API_URL}/teams/${chaveTreinador}`)

  if (!response.ok) {
    throw new Error('Time não encontrado.')
  }

  return response.json()
}

export async function createPlay(
  teamId: number,
  chaveTreinador: string,
  payload: { titulo: string; descricao: string | null; status: StatusJogada; cena: Cena },
): Promise<Play> {
  const response = await fetch(`${API_URL}/teams/${teamId}/plays`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Chave-Treinador': chaveTreinador,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível salvar a jogada.')
  }

  return response.json()
}

export async function getPlays(teamId: number, chaveTreinador: string): Promise<PlaySummary[]> {
  const response = await fetch(`${API_URL}/teams/${teamId}/plays`, {
    headers: { 'X-Chave-Treinador': chaveTreinador },
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar as jogadas.')
  }

  return response.json()
}

export async function getPlay(playId: number, chaveTreinador: string): Promise<Play> {
  const response = await fetch(`${API_URL}/plays/${playId}`, {
    headers: { 'X-Chave-Treinador': chaveTreinador },
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar a jogada.')
  }

  return response.json()
}

export async function updatePlay(
  playId: number,
  chaveTreinador: string,
  payload: Partial<{ titulo: string; descricao: string | null; status: StatusJogada }>,
): Promise<PlaySummary> {
  const response = await fetch(`${API_URL}/plays/${playId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Chave-Treinador': chaveTreinador,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível atualizar a jogada.')
  }

  return response.json()
}

export async function deletePlay(playId: number, chaveTreinador: string): Promise<void> {
  const response = await fetch(`${API_URL}/plays/${playId}`, {
    method: 'DELETE',
    headers: { 'X-Chave-Treinador': chaveTreinador },
  })

  if (!response.ok) {
    throw new Error('Não foi possível excluir a jogada.')
  }
}
