import type { APIRequestContext, APIResponse } from '@playwright/test'
import type { Cena } from '../../src/types/cena'

// Backend que o playwright.config.ts sobe para o E2E (banco e2e.db, apagado a cada execução).
export const API_URL = 'http://localhost:8001'

export type Modalidade = 'futebol' | 'basquete'
export type StatusJogada = 'rascunho' | 'publicada'

export interface Time {
  id: number
  nome: string
  modalidade: Modalidade
  chave_treinador: string
  chave_atleta: string
}

export interface Jogada {
  id: number
  team_id: number
  titulo: string
  descricao: string | null
  status: StatusJogada
  cena_json: Cena
}

// Falha com o status e o corpo da resposta, para o erro no E2E dizer o que o backend recusou.
async function lerJson<T>(resposta: APIResponse, oQue: string): Promise<T> {
  if (!resposta.ok()) {
    throw new Error(`${oQue} falhou: ${resposta.status()} ${await resposta.text()}`)
  }
  return (await resposta.json()) as T
}

export async function criarTime(
  request: APIRequestContext,
  dados: { nome?: string; modalidade?: Modalidade } = {},
): Promise<Time> {
  const resposta = await request.post(`${API_URL}/teams`, {
    data: { nome: dados.nome ?? 'Time E2E', modalidade: dados.modalidade ?? 'basquete' },
  })
  return lerJson<Time>(resposta, 'criarTime')
}

export async function criarJogada(
  request: APIRequestContext,
  time: Time,
  dados: { titulo?: string; descricao?: string; status?: StatusJogada; cena?: Cena } = {},
): Promise<Jogada> {
  const resposta = await request.post(`${API_URL}/teams/${time.id}/plays`, {
    headers: { 'X-Chave-Treinador': time.chave_treinador },
    data: {
      titulo: dados.titulo ?? 'Jogada E2E',
      descricao: dados.descricao,
      status: dados.status ?? 'rascunho',
      cena: dados.cena ?? cenaComPasse(time.modalidade),
    },
  })
  return lerJson<Jogada>(resposta, 'criarJogada')
}

// Cena pequena e válida para a quadra de 800x500: dois jogadores do time A,
// a bola com o primeiro e duas ações em instantes diferentes (passe, depois movimentação).
export function cenaComPasse(quadra: Modalidade = 'basquete'): Cena {
  return {
    quadra,
    visualizacao: 'completa',
    pecas: [
      { id: 'a1', tipo: 'jogador_time_a', x: 300, y: 250 },
      { id: 'a2', tipo: 'jogador_time_a', x: 500, y: 150 },
      { id: 'bola', tipo: 'bola', x: 300, y: 250, posse: 'a1' },
    ],
    acoes: [
      { id: 'acao1', tipo: 'passe', origem: 'a1', destino: 'a2', ordem: 1 },
      { id: 'acao2', tipo: 'movimentacao', origem: 'a1', destino: { x: 400, y: 350 }, ordem: 2 },
    ],
  }
}
