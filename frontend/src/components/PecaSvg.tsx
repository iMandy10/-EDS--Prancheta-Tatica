import type { Peca, TipoPeca } from '../types/cena'

const CORES: Record<TipoPeca, string> = {
  jogador_time_a: '#2563eb',
  jogador_time_b: '#dc2626',
  bola: '#f59e0b',
}

const RAIOS: Record<TipoPeca, number> = {
  jogador_time_a: 16,
  jogador_time_b: 16,
  bola: 10,
}

export default function PecaSvg({ peca }: { peca: Peca }) {
  return (
    <g className="cursor-grab" transform={`translate(${peca.x}, ${peca.y})`}>
      <circle r={RAIOS[peca.tipo]} fill={CORES[peca.tipo]} stroke="white" strokeWidth={2} />
      {peca.tipo !== 'bola' && (
        <text textAnchor="middle" dominantBaseline="central" fontSize={12} fill="white" fontWeight="bold">
          {peca.id}
        </text>
      )}
    </g>
  )
}
