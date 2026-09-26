export type TipoPeca = 'jogador_time_a' | 'jogador_time_b' | 'bola'

export interface Peca {
  id: string
  tipo: TipoPeca
  x: number
  y: number
}
