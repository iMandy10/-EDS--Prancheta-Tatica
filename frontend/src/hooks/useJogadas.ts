import { useCallback, useEffect, useState } from 'react'
import { deletePlay, getPlays, updatePlay, type PlaySummary } from '../lib/api'

export function useJogadas(teamId: number | undefined, chave: string | null) {
  const [jogadas, setJogadas] = useState<PlaySummary[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    if (!teamId || !chave) return
    getPlays(teamId, chave)
      .then(setJogadas)
      .catch(() => setErro('Não foi possível carregar as jogadas.'))
  }, [teamId, chave])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  async function alternarStatus(jogada: PlaySummary) {
    if (!chave) return
    const novoStatus = jogada.status === 'publicada' ? 'rascunho' : 'publicada'
    try {
      await updatePlay(jogada.id, chave, { status: novoStatus })
      recarregar()
    } catch {
      setErro('Não foi possível atualizar o status da jogada.')
    }
  }

  async function excluir(jogada: PlaySummary) {
    if (!chave) return
    if (!window.confirm(`Excluir a jogada "${jogada.titulo}"? Essa ação não pode ser desfeita.`)) return
    try {
      await deletePlay(jogada.id, chave)
      recarregar()
    } catch {
      setErro('Não foi possível excluir a jogada.')
    }
  }

  return { jogadas, erro, recarregar, alternarStatus, excluir }
}
