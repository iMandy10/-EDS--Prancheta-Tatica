import type { PlaySummary } from '../lib/api'

export default function AthletePlayCard({ jogada, onAbrir }: { jogada: PlaySummary; onAbrir: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        className="w-full rounded-2xl bg-white p-5 text-left shadow-card ring-1 ring-slate-900/5 transition hover:ring-brand-500"
      >
        <h2 className="font-semibold text-slate-900">{jogada.titulo}</h2>
        {jogada.descricao && <p className="mt-0.5 text-sm text-slate-500">{jogada.descricao}</p>}
      </button>
    </li>
  )
}
