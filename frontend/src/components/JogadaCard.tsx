import type { PlaySummary } from '../lib/api'

const ROTULO_STATUS: Record<PlaySummary['status'], string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
}

const COR_STATUS: Record<PlaySummary['status'], string> = {
  rascunho: 'bg-gray-200 text-gray-700',
  publicada: 'bg-green-100 text-green-700',
}

export default function JogadaCard({
  jogada,
  onEditar,
  onAlternarStatus,
  onExcluir,
}: {
  jogada: PlaySummary
  onEditar: (jogada: PlaySummary) => void
  onAlternarStatus: (jogada: PlaySummary) => void
  onExcluir: (jogada: PlaySummary) => void
}) {
  return (
    <li className="flex flex-col gap-2 rounded-md border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <h2 className="font-medium text-gray-900">{jogada.titulo}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[jogada.status]}`}>
          {ROTULO_STATUS[jogada.status]}
        </span>
      </div>
      {jogada.descricao && <p className="text-sm text-gray-600">{jogada.descricao}</p>}

      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditar(jogada)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onAlternarStatus(jogada)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          {jogada.status === 'publicada' ? 'Despublicar' : 'Publicar'}
        </button>
        <button
          type="button"
          onClick={() => onExcluir(jogada)}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>
    </li>
  )
}
