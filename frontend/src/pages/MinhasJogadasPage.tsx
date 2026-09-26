import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import { useJogadas } from '../hooks/useJogadas'
import EditarJogadaModal from '../components/EditarJogadaModal'
import JogadaCard from '../components/JogadaCard'
import { updatePlay, type PlaySummary } from '../lib/api'

export default function MinhasJogadasPage() {
  const { chave, team, notFound } = useTeamSession()
  const navigate = useNavigate()
  const { jogadas, erro: erroLista, recarregar, alternarStatus, excluir } = useJogadas(team?.id, chave)
  const [editando, setEditando] = useState<PlaySummary | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

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

  async function handleSalvarEdicao(dados: { titulo: string; descricao: string }) {
    if (!chave || !editando) return
    setSalvandoEdicao(true)
    setErroEdicao(null)
    try {
      await updatePlay(editando.id, chave, { titulo: dados.titulo, descricao: dados.descricao || null })
      setEditando(null)
      recarregar()
    } catch {
      setErroEdicao('Não foi possível salvar as alterações. Tente novamente.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Minhas jogadas</h1>
        <button
          type="button"
          onClick={() => navigate('/times/quadra')}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Voltar ao editor
        </button>
      </div>

      {erroLista && <p className="text-sm text-red-600">{erroLista}</p>}

      {jogadas === null ? (
        <p className="text-gray-500">Carregando...</p>
      ) : jogadas.length === 0 ? (
        <p className="text-gray-500">Nenhuma jogada salva ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {jogadas.map((jogada) => (
            <JogadaCard
              key={jogada.id}
              jogada={jogada}
              onEditar={setEditando}
              onAlternarStatus={alternarStatus}
              onExcluir={excluir}
            />
          ))}
        </ul>
      )}

      <EditarJogadaModal
        jogada={editando}
        salvando={salvandoEdicao}
        erro={erroEdicao}
        onFechar={() => setEditando(null)}
        onSalvar={handleSalvarEdicao}
      />
    </div>
  )
}
