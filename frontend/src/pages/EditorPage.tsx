import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg from '../components/QuadraSvg'
import PecaSvg from '../components/PecaSvg'
import type { Peca } from '../types/cena'

const PECAS_INICIAIS: Peca[] = [
  { id: 'A1', tipo: 'jogador_time_a', x: 250, y: 150 },
  { id: 'A2', tipo: 'jogador_time_a', x: 250, y: 350 },
  { id: 'B1', tipo: 'jogador_time_b', x: 550, y: 150 },
  { id: 'B2', tipo: 'jogador_time_b', x: 550, y: 350 },
  { id: 'bola', tipo: 'bola', x: 400, y: 250 },
]

export default function EditorPage() {
  const { chave, team, notFound } = useTeamSession()
  const [pecas] = useState<Peca[]>(PECAS_INICIAIS)

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
      <QuadraSvg quadra={team.modalidade}>
        {pecas.map((peca) => (
          <PecaSvg key={peca.id} peca={peca} />
        ))}
      </QuadraSvg>
    </div>
  )
}
