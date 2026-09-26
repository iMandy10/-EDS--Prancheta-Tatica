import { Navigate, useNavigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import { clearChaveTreinador } from '../lib/storage'

export default function WelcomeBackPage() {
  const { chave, team, notFound } = useTeamSession()
  const navigate = useNavigate()

  if (!chave || notFound) {
    return <Navigate to="/" replace />
  }

  if (!team) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-gray-500">
        Carregando...
      </div>
    )
  }

  function handleSair() {
    clearChaveTreinador()
    navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Bem-vindo de volta!</h1>
      <p className="text-gray-600">
        Time: <strong>{team.nome}</strong> · {team.modalidade === 'futebol' ? 'Futebol' : 'Basquete'}
      </p>
      <button
        type="button"
        onClick={() => navigate('/times/quadra')}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Ir para o editor
      </button>
      <button type="button" onClick={handleSair} className="mt-1 text-sm text-gray-500 hover:text-gray-700 hover:underline">
        Sair
      </button>
    </div>
  )
}
