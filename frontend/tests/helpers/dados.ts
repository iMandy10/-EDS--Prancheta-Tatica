import type { Play, PlaySummary, Team } from '../../src/lib/api'
import type { Cena } from '../../src/types/cena'

// Dados de exemplo compartilhados. Use spread para variar: { ...TIME, modalidade: 'basquete' }.
export const CHAVE = 'chave-do-treinador'

export const TIME: Team = {
  id: 7, nome: 'Furacão FC', modalidade: 'futebol', created_at: '2026-11-19T10:00:00',
  chave_treinador: CHAVE, chave_atleta: 'chave-do-atleta',
}

// A1 passa a bola para A2 (que está com ela) e depois corre até (400, 250).
export const CENA: Cena = {
  quadra: 'futebol',
  pecas: [
    { id: 'A1', tipo: 'jogador_time_a', x: 100, y: 250 },
    { id: 'A2', tipo: 'jogador_time_a', x: 300, y: 150 },
    { id: 'bola', tipo: 'bola', x: 100, y: 250, posse: 'A1' },
  ],
  acoes: [
    { id: 'acao-1', tipo: 'passe', origem: 'A1', destino: 'A2', ordem: 1 },
    { id: 'acao-2', tipo: 'movimentacao', origem: 'A1', destino: { x: 400, y: 250 }, ordem: 2 },
  ],
}

export const RESUMO: PlaySummary = {
  id: 3, team_id: 7, titulo: 'Saída de bola', descricao: 'Pelo lado esquerdo', status: 'rascunho',
  created_at: '2026-11-19T10:00:00', updated_at: '2026-11-19T11:00:00',
}

export const JOGADA: Play = { ...RESUMO, cena_json: CENA }
