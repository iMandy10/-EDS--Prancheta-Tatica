import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getTeamByChaveTreinador, type Team } from '../lib/api'
import { clearChaveTreinador, getChaveTreinador } from '../lib/storage'

// Placeholder: o destino real (editor da quadra) ainda não existe.
export default function WelcomeBackPage() {
  const chave = getChaveTreinador()
  const [team, setTeam] = useState<Team | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!chave) return

    getTeamByChaveTreinador(chave)
      .then(setTeam)
      .catch(() => {
        clearChaveTreinador()
        setNotFound(true)
      })
  }, [chave])

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Bem-vindo de volta, {team.nome}!</h1>
      <p className="text-gray-600">{team.modalidade === 'futebol' ? 'Futebol' : 'Basquete'}</p>
      <p className="mt-4 text-sm text-gray-500">O editor da quadra tática ainda está sendo construído.</p>
    </div>
  )
}
