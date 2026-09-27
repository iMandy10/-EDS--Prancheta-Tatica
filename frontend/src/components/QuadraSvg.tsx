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

// Tábuas de madeira clara, como um piso de quadra de basquete de verdade.
function MadeiraClara() {
  const faixas = Array.from({ length: 10 }, (_, index) => index)
  return (
    <>
      {faixas.map((index) => (
        <rect
          key={index}
          x={index * 80}
          y={0}
          width={80}
          height={HEIGHT}
          fill={index % 2 === 0 ? '#e4bb7d' : '#dcae6a'}
        />
      ))}
    </>
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

// Uma ponta da quadra: garrafão, marcações laterais, círculo de lance livre,
// tabela, aro e a área restritiva (semicírculo pequeno perto da cesta).
// Garrafão da FIBA: mais comprido (profundidade, no eixo x) do que largo (eixo y).
const GARRAFAO_PROFUNDIDADE = 170
const GARRAFAO_LARGURA = 120
// Raio do arco externo: profundidade + raio do lance livre, pra ele tangenciar
// exatamente o semicírculo do garrafão (mesmo centro y, sem cruzar nem deixar vão).
const RAIO_ARCO_EXTERNO = GARRAFAO_PROFUNDIDADE + GARRAFAO_LARGURA / 2

function Cesta({ x, mirror }: { x: number; mirror?: boolean }) {
  const dir = mirror ? -1 : 1
  const pontaGarrafao = x + dir * GARRAFAO_PROFUNDIDADE
  const raioLanceLivre = GARRAFAO_LARGURA / 2
  const topo = 250 - raioLanceLivre
  const base = 250 + raioLanceLivre
  const restritivaX = x + dir * 18
  const varredura = mirror ? 0 : 1

  return (
    <>
      <rect
        x={mirror ? pontaGarrafao : x}
        y={topo}
        width={GARRAFAO_PROFUNDIDADE}
        height={GARRAFAO_LARGURA}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />
      {[100, 130, 160].map((distancia) => {
        const tx = x + dir * distancia
        return (
          <g key={tx}>
            <line x1={tx} y1={topo} x2={tx} y2={topo - 8} stroke="white" strokeWidth={2} />
            <line x1={tx} y1={base} x2={tx} y2={base + 8} stroke="white" strokeWidth={2} />
          </g>
        )
      })}
      {/* círculo de lance livre: só o semicírculo pra fora do garrafão, tracejado */}
      <path
        d={`M ${pontaGarrafao} ${topo} A ${raioLanceLivre} ${raioLanceLivre} 0 0 ${varredura} ${pontaGarrafao} ${base}`}
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeDasharray="6 6"
      />
      <line x1={x + dir * 8} y1={235} x2={x + dir * 8} y2={265} stroke="white" strokeWidth={2} />
      <circle cx={x + dir * 18} cy={250} r={5} fill="none" stroke="white" strokeWidth={2} />
      <path d={`M ${restritivaX} 215 A 35 35 0 0 ${varredura} ${restritivaX} 285`} fill="none" stroke="white" strokeWidth={2} />
    </>
  )
}

function BasqueteMarkings() {
  return (
    <>
      <rect x={20} y={20} width={760} height={460} fill="none" stroke="white" strokeWidth={2} />
      <line x1={400} y1={20} x2={400} y2={480} stroke="white" strokeWidth={2} />
      <circle cx={400} cy={250} r={50} fill="none" stroke="white" strokeWidth={2} />

      <Cesta x={20} />
      <Cesta x={780} mirror />

      <path
        d={`M 20 20 A ${RAIO_ARCO_EXTERNO} ${RAIO_ARCO_EXTERNO} 0 0 1 20 480`}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />
      <path
        d={`M 780 20 A ${RAIO_ARCO_EXTERNO} ${RAIO_ARCO_EXTERNO} 0 0 0 780 480`}
        fill="none"
        stroke="white"
        strokeWidth={2}
      />
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

  return (
    <svg
      viewBox={`0 0 ${largura} ${HEIGHT}`}
      className={`w-full rounded-xl shadow-card ring-1 ring-black/10 ${
        visualizacao === 'meia_quadra' ? 'max-w-[404px]' : 'max-w-3xl'
      }`}
      role="img"
      aria-label={`Quadra de ${quadra}${visualizacao === 'meia_quadra' ? ' (meia quadra)' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {quadra === 'futebol' ? (
        <FutebolMarkings />
      ) : (
        <>
          <MadeiraClara />
          <BasqueteMarkings />
        </>
      )}
      {children}
    </svg>
  )
}
