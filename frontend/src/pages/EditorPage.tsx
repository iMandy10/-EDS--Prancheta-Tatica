import { Navigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg from '../components/QuadraSvg'

export default function EditorPage() {
  const { chave, team, notFound } = useTeamSession()

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

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-4 p-6">
      <h1 className="text-xl font-semibold text-gray-900">{team.nome}</h1>
      <QuadraSvg quadra={team.modalidade} />
    </div>
  )
}
