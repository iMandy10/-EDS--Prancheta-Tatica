import { useEffect, useState, type FormEvent } from 'react'
import type { PlaySummary } from '../lib/api'

export default function EditarJogadaModal({
  jogada,
  salvando,
  erro,
  onFechar,
  onSalvar,
}: {
  jogada: PlaySummary | null
  salvando: boolean
  erro: string | null
  onFechar: () => void
  onSalvar: (dados: { titulo: string; descricao: string }) => void
}) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    if (jogada) {
      setTitulo(jogada.titulo)
      setDescricao(jogada.descricao ?? '')
    }
  }, [jogada])

  if (!jogada) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const tituloTrimmed = titulo.trim()
    if (!tituloTrimmed) return
    onSalvar({ titulo: tituloTrimmed, descricao: descricao.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Editar jogada</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="editar-titulo" className="text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="editar-titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="editar-descricao" className="text-sm font-medium text-gray-700">
              Descrição (opcional)
            </label>
            <textarea
              id="editar-descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

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
