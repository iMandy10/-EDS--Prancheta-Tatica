import { useEffect, useState, type FormEvent } from 'react'
import type { PlaySummary } from '../lib/api'
import Button from './Button'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Editar jogada</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="editar-titulo" className="text-sm font-medium text-slate-700">
              Título
            </label>
            <input
              id="editar-titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="editar-descricao" className="text-sm font-medium text-slate-700">
              Descrição (opcional)
            </label>
            <textarea
              id="editar-descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              rows={3}
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" onClick={onFechar} disabled={salvando} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando || !titulo.trim()} variant="primary">
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
