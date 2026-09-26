import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import { useJogadas } from '../hooks/useJogadas'
import EditarJogadaModal from '../components/EditarJogadaModal'
import JogadaCard from '../components/JogadaCard'
import Button from '../components/Button'
import { getPlay, updatePlay, type PlaySummary } from '../lib/api'

export default function MinhasJogadasPage() {
  const { chave, team, notFound } = useTeamSession()
  const navigate = useNavigate()
  const { jogadas, erro: erroLista, recarregar, alternarStatus, excluir } = useJogadas(team?.id, chave)
  const [editando, setEditando] = useState<PlaySummary | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [erroReabrir, setErroReabrir] = useState<string | null>(null)

  if (!chave || notFound) {
    return <Navigate to="/" replace />
  }

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>
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

  async function handleReabrir(jogada: PlaySummary) {
    if (!chave) return
    setErroReabrir(null)
    try {
      const play = await getPlay(jogada.id, chave)
      navigate('/times/quadra', { state: { cenaInicial: play.cena_json } })
    } catch {
      setErroReabrir('Não foi possível reabrir a jogada. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{team.nome}</p>
            <h1 className="text-xl font-bold text-slate-900">Minhas jogadas</h1>
          </div>
          <Button onClick={() => navigate('/times/quadra')} variant="primary">
            Voltar ao editor
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 pt-6">
        {erroLista && <p className="text-sm text-red-600">{erroLista}</p>}
        {erroReabrir && <p className="text-sm text-red-600">{erroReabrir}</p>}

        {jogadas === null ? (
          <p className="text-slate-500">Carregando...</p>
        ) : jogadas.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <p className="text-slate-500">Nenhuma jogada salva ainda.</p>
            <p className="mt-1 text-sm text-slate-400">Monte uma jogada no editor e clique em "Salvar jogada".</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {jogadas.map((jogada) => (
              <JogadaCard
                key={jogada.id}
                jogada={jogada}
                onEditar={setEditando}
                onAlternarStatus={alternarStatus}
                onExcluir={excluir}
                onReabrir={handleReabrir}
              />
            ))}
          </ul>
        )}
      </div>

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
