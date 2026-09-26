export function SetaMarkerDefs() {
  return (
    <defs>
      <marker id="seta-ponta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth={6} markerHeight={6} orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#111827" />
      </marker>
    </defs>
  )
}

export default function AcaoSvg({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth={3} markerEnd="url(#seta-ponta)" />
}
