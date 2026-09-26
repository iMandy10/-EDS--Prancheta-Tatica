import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getPublishedPlays, type TeamAccess } from '../lib/athleteApi'
import { clearChaveAtleta } from '../lib/athleteStorage'
import type { PlaySummary } from '../lib/api'
import AthletePlayCard from '../components/AthletePlayCard'
import { LogOutIcon } from '../components/icons'

export default function AthletePlaysPage() {
  const navigate = useNavigate()
  const sessao = useLocation().state as { team: TeamAccess; chave: string } | null
  const [jogadas, setJogadas] = useState<PlaySummary[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const teamId = sessao?.team.id
  const chave = sessao?.chave

  useEffect(() => {
    if (!teamId || !chave) return
    getPublishedPlays(teamId, chave)
      .then(setJogadas)
      .catch(() => setErro('Não foi possível carregar as jogadas.'))
  }, [teamId, chave])

  if (!sessao) {
    return <Navigate to="/atleta" replace />
  }

  function handleSair() {
    clearChaveAtleta()
    navigate('/atleta', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{sessao.team.nome}</p>
            <h1 className="text-xl font-bold text-slate-900">Jogadas do time</h1>
          </div>
          <button
            type="button"
            onClick={handleSair}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            <LogOutIcon className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 pt-6">
        {erro && <p className="text-sm text-red-600">{erro}</p>}

        {jogadas === null ? (
          !erro && <p className="text-slate-500">Carregando...</p>
        ) : jogadas.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <p className="text-slate-500">Nenhuma jogada publicada ainda.</p>
            <p className="mt-1 text-sm text-slate-400">Quando seu treinador publicar uma jogada, ela aparece aqui.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {jogadas.map((jogada) => (
              <AthletePlayCard key={jogada.id} jogada={jogada} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
