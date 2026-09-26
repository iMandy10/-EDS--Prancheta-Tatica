const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Modalidade = 'futebol' | 'basquete'

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
