import { useEffect, useState } from 'react'
import { getTeamByChaveTreinador, type Team } from '../lib/api'
import { clearChaveTreinador, getChaveTreinador } from '../lib/storage'

export function useTeamSession() {
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

  return { chave, team, notFound }
}
