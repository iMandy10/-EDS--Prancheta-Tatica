import type { TipoAcao } from '../types/cena'

export const CORES_ACAO: Record<TipoAcao, string> = {
  movimentacao: '#059669',
  passe: '#7c3aed',
  bloqueio: '#ea580c',
  drible: '#0284c7',
}

// No basquete as setas são todas pretas, como numa prancheta: o tipo se distingue só pelo traço.
const COR_PRETA = '#111827'

const TRACEJADO_ACAO: Partial<Record<TipoAcao, string>> = {
  passe: '8 5',
}

// Convenção de prancheta: movimentação contínua, passe tracejado, bloqueio termina numa barra
// perpendicular e drible é ondulado.
export function SetaMarkerDefs() {
  const variantes = (Object.keys(CORES_ACAO) as TipoAcao[]).flatMap((tipo) => [
    { tipo, id: `seta-ponta-${tipo}`, cor: CORES_ACAO[tipo] },
    { tipo, id: `seta-ponta-${tipo}-preta`, cor: COR_PRETA },
  ])
  return (
    <defs>
      {variantes.map(({ tipo, id, cor }) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX={tipo === 'bloqueio' ? 5 : 8}
          refY="5"
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          {tipo === 'bloqueio' ? (
            <path d="M 5 0 L 5 10" stroke={cor} strokeWidth={2.5} />
          ) : (
            <path d="M 0 0 L 10 5 L 0 10 z" fill={cor} />
          )}
        </marker>
      ))}
    </defs>
  )
}

// Linha ondulada de (x1, y1) até (x2, y2); o trecho final é reto para a ponta apontar certo.
function caminhoOndulado(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const comprimento = Math.hypot(dx, dy)
  if (comprimento < 30) return `M ${x1} ${y1} L ${x2} ${y2}`

  const ondas = Math.max(2, Math.round((comprimento - 14) / 22))
  const [nx, ny] = [-dy / comprimento, dx / comprimento]
  const pontos: string[] = []
  for (let i = 0; i <= ondas * 8; i++) {
    const t = (i / (ondas * 8)) * (1 - 14 / comprimento)
    const desvio = Math.sin(t * (comprimento / (comprimento - 14)) * ondas * 2 * Math.PI) * 5
    pontos.push(`${x1 + dx * t + nx * desvio} ${y1 + dy * t + ny * desvio}`)
  }
  return `M ${pontos.join(' L ')} L ${x2} ${y2}`
}

export default function AcaoSvg({
  x1,
  y1,
  x2,
  y2,
  tipo,
  destacada,
  preta,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  tipo: TipoAcao
  destacada?: boolean
  preta?: boolean
}) {
  const d = tipo === 'drible' ? caminhoOndulado(x1, y1, x2, y2) : `M ${x1} ${y1} L ${x2} ${y2}`

  return (
    <>
      {destacada && <path d={d} fill="none" stroke="#facc15" strokeWidth={9} strokeLinecap="round" opacity={0.6} />}
      <path
        d={d}
        fill="none"
        stroke={preta ? COR_PRETA : CORES_ACAO[tipo]}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeDasharray={TRACEJADO_ACAO[tipo]}
        markerEnd={`url(#seta-ponta-${tipo}${preta ? '-preta' : ''})`}
      />
    </>
  )
}
