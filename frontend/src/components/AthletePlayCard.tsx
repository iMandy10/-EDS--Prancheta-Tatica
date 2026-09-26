import type { PlaySummary } from '../lib/api'

export default function AthletePlayCard({ jogada }: { jogada: PlaySummary }) {
  return (
    <li className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
      <h2 className="font-semibold text-slate-900">{jogada.titulo}</h2>
      {jogada.descricao && <p className="mt-0.5 text-sm text-slate-500">{jogada.descricao}</p>}
    </li>
  )
}
