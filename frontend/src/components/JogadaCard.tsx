import type { PlaySummary } from '../lib/api'
import Button from './Button'
import { EyeIcon, EyeOffIcon, FolderOpenIcon, PencilIcon, TrashIcon } from './icons'

const ROTULO_STATUS: Record<PlaySummary['status'], string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
}

const COR_STATUS: Record<PlaySummary['status'], string> = {
  rascunho: 'bg-slate-100 text-slate-600',
  publicada: 'bg-emerald-100 text-emerald-700',
}

export default function JogadaCard({
  jogada,
  onEditar,
  onAlternarStatus,
  onExcluir,
  onReabrir,
}: {
  jogada: PlaySummary
  onEditar: (jogada: PlaySummary) => void
  onAlternarStatus: (jogada: PlaySummary) => void
  onExcluir: (jogada: PlaySummary) => void
  onReabrir: (jogada: PlaySummary) => void
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">{jogada.titulo}</h2>
          {jogada.descricao && <p className="mt-0.5 text-sm text-slate-500">{jogada.descricao}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${COR_STATUS[jogada.status]}`}>
          {ROTULO_STATUS[jogada.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Button onClick={() => onReabrir(jogada)} variant="primary">
          <FolderOpenIcon className="h-4 w-4" />
          Reabrir no editor
        </Button>
        <Button onClick={() => onEditar(jogada)} variant="outline">
          <PencilIcon className="h-4 w-4" />
          Editar
        </Button>
        <Button onClick={() => onAlternarStatus(jogada)} variant="outline">
          {jogada.status === 'publicada' ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          {jogada.status === 'publicada' ? 'Despublicar' : 'Publicar'}
        </Button>
        <Button onClick={() => onExcluir(jogada)} variant="danger">
          <TrashIcon className="h-4 w-4" />
          Excluir
        </Button>
      </div>
    </li>
  )
}
