import type { PointerEvent, ReactNode } from 'react'
import type { Modalidade } from '../lib/api'

const WIDTH = 800
const HEIGHT = 500

export const QUADRA_LIMITES = { minX: 20, minY: 20, maxX: 780, maxY: 480 }

function FutebolMarkings() {
  return (
    <>
      <rect x={20} y={20} width={760} height={460} fill="none" stroke="white" strokeWidth={2} />
      <line x1={400} y1={20} x2={400} y2={480} stroke="white" strokeWidth={2} />
      <circle cx={400} cy={250} r={60} fill="none" stroke="white" strokeWidth={2} />
      <circle cx={400} cy={250} r={3} fill="white" />
      <rect x={20} y={150} width={100} height={200} fill="none" stroke="white" strokeWidth={2} />
      <rect x={680} y={150} width={100} height={200} fill="none" stroke="white" strokeWidth={2} />
      <rect x={20} y={200} width={40} height={100} fill="none" stroke="white" strokeWidth={2} />
      <rect x={740} y={200} width={40} height={100} fill="none" stroke="white" strokeWidth={2} />
    </>
  )
}

function BasqueteMarkings() {
  return (
    <>
      <rect x={20} y={20} width={760} height={460} fill="none" stroke="white" strokeWidth={2} />
      <line x1={400} y1={20} x2={400} y2={480} stroke="white" strokeWidth={2} />
      <circle cx={400} cy={250} r={50} fill="none" stroke="white" strokeWidth={2} />
      <rect x={20} y={175} width={150} height={150} fill="none" stroke="white" strokeWidth={2} />
      <rect x={630} y={175} width={150} height={150} fill="none" stroke="white" strokeWidth={2} />
      <path d="M 20 90 A 260 260 0 0 1 20 410" fill="none" stroke="white" strokeWidth={2} />
      <path d="M 780 90 A 260 260 0 0 0 780 410" fill="none" stroke="white" strokeWidth={2} />
    </>
  )
}

export default function QuadraSvg({
  quadra,
  children,
  onPointerMove,
  onPointerUp,
}: {
  quadra: Modalidade
  children?: ReactNode
  onPointerMove?: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp?: (event: PointerEvent<SVGSVGElement>) => void
}) {
  const backgroundColor = quadra === 'futebol' ? '#2e7d32' : '#c98a4b'

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full max-w-3xl rounded-md"
      role="img"
      aria-label={`Quadra de ${quadra}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill={backgroundColor} />
      {quadra === 'futebol' ? <FutebolMarkings /> : <BasqueteMarkings />}
      {children}
    </svg>
  )
}
