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
  dragging,
  selected,
  onPointerDown,
}: {
  peca: Peca
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
      <circle r={RAIOS[peca.tipo]} fill={CORES[peca.tipo]} stroke="white" strokeWidth={2} />
      {peca.tipo !== 'bola' && (
        <text textAnchor="middle" dominantBaseline="central" fontSize={12} fill="white" fontWeight="bold">
          {peca.id}
        </text>
      )}
    </g>
  )
}
