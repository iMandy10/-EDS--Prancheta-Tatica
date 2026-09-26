import type { PointerEvent } from 'react'
import type { Peca, TipoPeca } from '../types/cena'

const CORES: Record<TipoPeca, string> = {
  jogador_time_a: '#2563eb',
  jogador_time_b: '#dc2626',
  bola: '#f59e0b',
}

export const RAIOS: Record<TipoPeca, number> = {
  jogador_time_a: 16,
  jogador_time_b: 16,
  bola: 10,
}

export default function PecaSvg({
  peca,
  rotulo = peca.id,
  dragging,
  selected,
  onPointerDown,
}: {
  peca: Peca
  rotulo?: string
  dragging?: boolean
  selected?: boolean
  onPointerDown?: (event: PointerEvent<SVGGElement>) => void
}) {
  return (
    <g
      className={dragging ? 'cursor-grabbing touch-none' : 'cursor-grab touch-none'}
      transform={`translate(${peca.x}, ${peca.y})`}
      onPointerDown={onPointerDown}
    >
      {selected && (
        <circle r={RAIOS[peca.tipo] + 5} fill="none" stroke="#facc15" strokeWidth={3} />
      )}
      <circle
        r={RAIOS[peca.tipo]}
        fill={CORES[peca.tipo]}
        stroke="white"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))' }}
      />
      {peca.tipo !== 'bola' && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fill="white"
          fontWeight="700"
        >
          {rotulo}
        </text>
      )}
    </g>
  )
}
