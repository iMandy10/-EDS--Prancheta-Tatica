import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import { clearChaveTreinador } from '../lib/storage'
import Button from '../components/Button'
import ChaveAtletaModal from '../components/ChaveAtletaModal'
import { LogOutIcon } from '../components/icons'

export default function WelcomeBackPage() {
  const { chave, team, notFound } = useTeamSession()
  const navigate = useNavigate()
  const [modalChaveAberto, setModalChaveAberto] = useState(false)

  if (!chave || notFound) {
    return <Navigate to="/" replace />
  }

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>
    )
  }

  function handleSair() {
    clearChaveTreinador()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-100 to-slate-50 p-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card ring-1 ring-slate-900/5">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Sessão ativa
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Bem-vindo de volta!</h1>
        <p className="mt-1 text-slate-500">
          Time: <strong className="text-slate-700">{team.nome}</strong> ·{' '}
          {team.modalidade === 'futebol' ? 'Futebol' : 'Basquete'}
        </p>

        <Button onClick={() => navigate('/times/quadra')} variant="primary" className="mt-6 w-full py-2.5">
          Ir para o editor
        </Button>
        <Button onClick={() => setModalChaveAberto(true)} variant="outline" className="mt-2 w-full py-2.5">
          Ver chave do atleta
        </Button>
        <button
          type="button"
          onClick={handleSair}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          <LogOutIcon className="h-4 w-4" />
          Sair
        </button>
      </div>

      <ChaveAtletaModal
        aberto={modalChaveAberto}
        nomeTime={team.nome}
        chaveAtleta={team.chave_atleta}
        onFechar={() => setModalChaveAberto(false)}
      />
    </div>
  )
}
