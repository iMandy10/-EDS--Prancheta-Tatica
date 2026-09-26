import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPublishedPlay, type TeamAccess } from '../lib/athleteApi'
import type { Play } from '../lib/api'
import type { Cena } from '../types/cena'
import { useAnimacao } from '../hooks/useAnimacao'
import QuadraSvg from '../components/QuadraSvg'
import PecaSvg from '../components/PecaSvg'
import AcaoSvg, { SetaMarkerDefs } from '../components/AcaoSvg'

function AnimacaoJogada({ cena }: { cena: Cena }) {
  const { pecas, passos } = useAnimacao(cena)

  return (
    <QuadraSvg quadra={cena.quadra}>
      <SetaMarkerDefs />
      <g opacity={0.35}>
        {passos.map((passo) => (
          <AcaoSvg
            key={passo.acao.id}
            x1={passo.de.x}
            y1={passo.de.y}
            x2={passo.para.x}
            y2={passo.para.y}
            tipo={passo.acao.tipo}
          />
        ))}
      </g>
      {pecas.map((peca) => (
        <PecaSvg key={peca.id} peca={peca} />
      ))}
    </QuadraSvg>
  )
}

export default function AthletePlayViewerPage() {
  const navigate = useNavigate()
  const { playId } = useParams()
  const sessao = useLocation().state as { team: TeamAccess; chave: string } | null
  const [jogada, setJogada] = useState<Play | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const teamId = sessao?.team.id
  const chave = sessao?.chave

  useEffect(() => {
    if (!teamId || !chave) return
    getPublishedPlay(teamId, Number(playId), chave)
      .then(setJogada)
      .catch(() => setErro('Não foi possível carregar a jogada.'))
  }, [teamId, chave, playId])

  if (!sessao) {
    return <Navigate to="/atleta" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{sessao.team.nome}</p>
            <h1 className="text-xl font-bold text-slate-900">{jogada?.titulo ?? 'Jogada'}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/atleta/jogadas', { state: sessao })}
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            Voltar
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-6">
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {jogada ? <AnimacaoJogada cena={jogada.cena_json} /> : !erro && <p className="text-slate-500">Carregando...</p>}
        {jogada?.descricao && <p className="self-start text-sm text-slate-600">{jogada.descricao}</p>}
      </div>
    </div>
  )
}
