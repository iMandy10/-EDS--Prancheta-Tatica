import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { Team } from '../lib/api'
import Button from '../components/Button'
import CopyableKey from '../components/CopyableKey'

export default function ConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const team = (location.state as { team?: Team } | null)?.team

  if (!team) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card ring-1 ring-slate-900/5">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Time criado com sucesso
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{team.nome}</h1>
          <p className="mt-1 text-sm text-slate-500">{team.modalidade === 'futebol' ? 'Futebol' : 'Basquete'}</p>
        </div>

        <div className="my-6 flex flex-col gap-5">
          <CopyableKey
            label="Sua chave de treinador (guarde com você)"
            value={team.chave_treinador}
            mailtoSubject={`Minha chave de treinador - ${team.nome}`}
            mailtoBody={`Minha chave de treinador no Prancheta Tática é: ${team.chave_treinador}`}
          />
          <CopyableKey
            label="Chave do atleta (compartilhe com o time)"
            value={team.chave_atleta}
            mailtoSubject={`Chave de acesso do time ${team.nome} - Prancheta Tática`}
            mailtoBody={`Use esta chave para acessar as jogadas do time ${team.nome} no Prancheta Tática: ${team.chave_atleta}`}
          />
        </div>

        <Button onClick={() => navigate('/times/quadra')} variant="primary" className="w-full py-2.5">
          Continuar para o editor
        </Button>
      </div>
    </div>
  )
}
