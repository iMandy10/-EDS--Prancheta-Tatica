export default function BarraProgresso({ progresso }: { progresso: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Progresso da jogada"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progresso * 100)}
      className="h-2 w-full max-w-3xl overflow-hidden rounded-full bg-slate-200"
    >
      <div className="h-full rounded-full bg-brand-600" style={{ width: `${progresso * 100}%` }} />
    </div>
  )
}
