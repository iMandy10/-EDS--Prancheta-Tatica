import { useEffect, useState, type FormEvent } from 'react'
import type { StatusJogada } from '../lib/api'

export default function SalvarJogadaModal({
  aberto,
  salvando,
  erro,
  onFechar,
  onSalvar,
}: {
  aberto: boolean
  salvando: boolean
  erro: string | null
  onFechar: () => void
  onSalvar: (dados: { titulo: string; descricao: string; status: StatusJogada }) => void
}) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [publicar, setPublicar] = useState(false)

  useEffect(() => {
    if (aberto) {
      setTitulo('')
      setDescricao('')
      setPublicar(false)
    }
  }, [aberto])

  if (!aberto) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const tituloTrimmed = titulo.trim()
    if (!tituloTrimmed) return
    onSalvar({ titulo: tituloTrimmed, descricao: descricao.trim(), status: publicar ? 'publicada' : 'rascunho' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Salvar jogada</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="play-titulo" className="text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="play-titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Ex: Contra-ataque pela direita"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="play-descricao" className="text-sm font-medium text-gray-700">
              Descrição (opcional)
            </label>
            <textarea
              id="play-descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={publicar}
              onChange={(event) => setPublicar(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Publicar para o time (senão fica como rascunho)
          </label>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !titulo.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
