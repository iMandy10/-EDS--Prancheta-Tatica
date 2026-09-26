import { Navigate, useLocation } from 'react-router-dom'
import type { Team } from '../lib/api'

// Placeholder: a UI final desta tela (com botão de copiar) é a próxima tarefa.
export default function ConfirmationPage() {
  const location = useLocation()
  const team = (location.state as { team?: Team } | null)?.team

  if (!team) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Time criado!</h1>
      <p>
        <strong>Chave do treinador:</strong> {team.chave_treinador}
      </p>
      <p>
        <strong>Chave do atleta:</strong> {team.chave_atleta}
      </p>
    </div>
  )
}
