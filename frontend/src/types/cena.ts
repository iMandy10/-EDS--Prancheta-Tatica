import type { Modalidade } from '../lib/api'

export type TipoPeca = 'jogador_time_a' | 'jogador_time_b' | 'bola'

export interface Peca {
  id: string
  tipo: TipoPeca
  x: number
  y: number
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

export interface Cena {
  quadra: Modalidade
  pecas: Peca[]
  acoes: Acao[]
}
