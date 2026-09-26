import type { TipoAcao } from '../types/cena'

export const CORES_ACAO: Record<TipoAcao, string> = {
  movimentacao: '#059669',
  passe: '#7c3aed',
}

const TRACEJADO_ACAO: Partial<Record<TipoAcao, string>> = {
  passe: '8 5',
}

export function SetaMarkerDefs() {
  return (
    <defs>
      {(Object.keys(CORES_ACAO) as TipoAcao[]).map((tipo) => (
        <marker
          key={tipo}
          id={`seta-ponta-${tipo}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={CORES_ACAO[tipo]} />
        </marker>
      ))}
    </defs>
  )
}

export default function AcaoSvg({
  x1,
  y1,
  x2,
  y2,
  tipo,
  destacada,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  tipo: TipoAcao
  destacada?: boolean
}) {
  return (
    <>
      {destacada && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#facc15" strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={CORES_ACAO[tipo]}
        strokeWidth={3}
        strokeDasharray={TRACEJADO_ACAO[tipo]}
        markerEnd={`url(#seta-ponta-${tipo})`}
      />
    </>
  )
}
