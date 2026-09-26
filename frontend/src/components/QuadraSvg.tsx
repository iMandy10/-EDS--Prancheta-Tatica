import type { PointerEvent, ReactNode } from 'react'
import type { Modalidade } from '../lib/api'
import type { Visualizacao } from '../types/cena'

const WIDTH = 800
const HEIGHT = 500
// Meia quadra corta na linha de meio (x=400); a margem extra é só espaço de respiro, como na quadra inteira.
const MEIA_QUADRA_MAXX = 400
const MEIA_QUADRA_LARGURA = MEIA_QUADRA_MAXX + 20

export const QUADRA_LIMITES = { minX: 20, minY: 20, maxX: 780, maxY: 480 }

export function limitesQuadra(visualizacao: Visualizacao = 'completa') {
  return visualizacao === 'meia_quadra' ? { ...QUADRA_LIMITES, maxX: MEIA_QUADRA_MAXX } : QUADRA_LIMITES
}

function CornerArcs() {
  return (
    <>
      <path d="M 20 40 A 20 20 0 0 1 40 20" fill="none" stroke="white" strokeWidth={2} />
      <path d="M 760 20 A 20 20 0 0 1 780 40" fill="none" stroke="white" strokeWidth={2} />
      <path d="M 780 460 A 20 20 0 0 1 760 480" fill="none" stroke="white" strokeWidth={2} />
      <path d="M 40 480 A 20 20 0 0 1 20 460" fill="none" stroke="white" strokeWidth={2} />
    </>
  )
}

function Gol({ x, mirror }: { x: number; mirror?: boolean }) {
  return (
    <rect
      x={mirror ? x - 10 : x}
      y={225}
      width={10}
      height={50}
      fill="none"
      stroke="white"
      strokeWidth={1.5}
      opacity={0.85}
    />
  )
}

// As marcações sempre desenham a quadra inteira; na meia quadra, o viewBox menor corta a metade
// distante — a linha de meio já funciona como a borda de fechamento do lado aberto.
function FutebolMarkings() {
  return (
    <>
      {/* campo */}
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#1c8a3d" />
      <rect x={20} y={20} width={760} height={460} fill="none" stroke="white" strokeWidth={2} />
      <CornerArcs />

      {/* linha e círculo central */}
      <line x1={400} y1={20} x2={400} y2={480} stroke="white" strokeWidth={2} />
      <circle cx={400} cy={250} r={60} fill="none" stroke="white" strokeWidth={2} />
      <circle cx={400} cy={250} r={3} fill="white" />

      {/* grande área e pequena área, esquerda */}
      <rect x={20} y={150} width={100} height={200} fill="none" stroke="white" strokeWidth={2} />
      <rect x={20} y={200} width={40} height={100} fill="none" stroke="white" strokeWidth={2} />
      <path d="M 120 220 A 60 60 0 0 1 120 280" fill="none" stroke="white" strokeWidth={2} />
      <circle cx={95} cy={250} r={2.5} fill="white" />

      {/* grande área e pequena área, direita */}
      <rect x={680} y={150} width={100} height={200} fill="none" stroke="white" strokeWidth={2} />
      <rect x={740} y={200} width={40} height={100} fill="none" stroke="white" strokeWidth={2} />
      <path d="M 680 220 A 60 60 0 0 0 680 280" fill="none" stroke="white" strokeWidth={2} />
      <circle cx={705} cy={250} r={2.5} fill="white" />

      {/* traves, ligeiramente para fora da linha de fundo */}
      <Gol x={20} />
      <Gol x={780} mirror />
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
      <circle cx={170} cy={250} r={25} fill="none" stroke="white" strokeWidth={2} />
      <circle cx={630} cy={250} r={25} fill="none" stroke="white" strokeWidth={2} />
      <path d="M 20 90 A 260 260 0 0 1 20 410" fill="none" stroke="white" strokeWidth={2} />
      <path d="M 780 90 A 260 260 0 0 0 780 410" fill="none" stroke="white" strokeWidth={2} />
      {/* tabelas */}
      <line x1={30} y1={210} x2={30} y2={290} stroke="white" strokeWidth={4} />
      <line x1={770} y1={210} x2={770} y2={290} stroke="white" strokeWidth={4} />
    </>
  )
}

function MolduraPrancheta({ largura }: { largura: number }) {
  const centro = largura / 2
  return (
    <>
      <defs>
        <linearGradient id="madeira-moldura" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c98a4f" />
          <stop offset="50%" stopColor="#a86b37" />
          <stop offset="100%" stopColor="#8f5a2c" />
        </linearGradient>
        <linearGradient id="metal-presilha" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* base de madeira da prancheta, por trás da quadra */}
      <rect x={-20} y={-58} width={largura + 40} height={578} rx={18} fill="url(#madeira-moldura)" />
      <rect x={-20} y={-58} width={largura + 40} height={578} rx={18} fill="none" stroke="#6b4423" strokeWidth={1.5} />

      {/* furos de encadernação, no topo */}
      <circle cx={40} cy={-38} r={5} fill="#5c3a1e" />
      <circle cx={largura - 40} cy={-38} r={5} fill="#5c3a1e" />

      {/* presilha metálica central */}
      <rect x={centro - 70} y={-56} width={140} height={40} rx={8} fill="url(#metal-presilha)" stroke="#475569" strokeWidth={1} />
      <rect x={centro - 50} y={-46} width={100} height={12} rx={4} fill="#334155" />
      <circle cx={centro} cy={-36} r={6} fill="#cbd5e1" stroke="#475569" strokeWidth={1} />
    </>
  )
}

export default function QuadraSvg({
  quadra,
  visualizacao = 'completa',
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  quadra: Modalidade
  visualizacao?: Visualizacao
  children?: ReactNode
  onPointerDown?: (event: PointerEvent<SVGSVGElement>) => void
  onPointerMove?: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp?: (event: PointerEvent<SVGSVGElement>) => void
}) {
  const largura = visualizacao === 'meia_quadra' ? MEIA_QUADRA_LARGURA : WIDTH
  const viewBox = quadra === 'basquete' ? `-20 -58 ${largura + 40} 578` : `0 0 ${largura} ${HEIGHT}`

  return (
    <svg
      viewBox={viewBox}
      className={quadra === 'basquete' ? 'w-full max-w-3xl' : 'w-full max-w-3xl rounded-xl shadow-card ring-1 ring-black/10'}
      role="img"
      aria-label={`Quadra de ${quadra}${visualizacao === 'meia_quadra' ? ' (meia quadra)' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <defs>
        <linearGradient id="madeira-quadra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d3985f" />
          <stop offset="100%" stopColor="#b97e46" />
        </linearGradient>
      </defs>
      {quadra === 'basquete' && <MolduraPrancheta largura={largura} />}
      {quadra === 'futebol' ? (
        <FutebolMarkings />
      ) : (
        <>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={4} fill="url(#madeira-quadra)" />
          <BasqueteMarkings />
        </>
      )}
      {children}
    </svg>
  )
}
