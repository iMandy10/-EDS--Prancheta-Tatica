import type { Modalidade } from '../lib/api'

export type TipoPeca = 'jogador_time_a' | 'jogador_time_b' | 'bola'

export interface Peca {
  id: string
  tipo: TipoPeca
  x: number
  y: number
  // Só na bola: id do jogador que está com ela (ausente ou null = bola solta em x, y).
  posse?: string | null
}

export type TipoAcao = 'movimentacao' | 'passe' | 'bloqueio' | 'drible'

export interface PontoDestino {
  x: number
  y: number
}

export interface Acao {
  id: string
  tipo: TipoAcao
  origem: string
  destino: string | PontoDestino
  ordem: number
}

export type Visualizacao = 'completa' | 'meia_quadra'

export interface Cena {
  quadra: Modalidade
  // Ausente em jogadas salvas antes desta funcionalidade = 'completa'.
  visualizacao?: Visualizacao
  pecas: Peca[]
  acoes: Acao[]
}
