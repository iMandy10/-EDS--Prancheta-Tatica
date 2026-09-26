import type { ReactNode } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from './icons'
import type { Acao } from '../types/cena'

const ROTULO_TIPO: Record<Acao['tipo'], string> = {
  movimentacao: 'Movimentação',
  passe: 'Passe',
}

const COR_TIPO: Record<Acao['tipo'], string> = {
  movimentacao: 'bg-emerald-500',
  passe: 'bg-violet-500',
}

function descreverDestino(destino: Acao['destino']) {
  return typeof destino === 'string' ? destino : 'ponto livre'
}

function BotaoIcone({
  onClick,
  disabled,
  rotulo,
  className = 'text-slate-500 hover:bg-slate-200',
  children,
}: {
  onClick: () => void
  disabled?: boolean
  rotulo: string
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      aria-label={rotulo}
      title={rotulo}
      className={`rounded-md p-1.5 disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  )
}

export default function AcoesPainel({
  acoes,
  editandoId,
  selecionadaId,
  onMover,
  onEditar,
  onRemover,
  onSelecionar,
}: {
  acoes: Acao[]
  editandoId: string | null
  selecionadaId: string | null
  onMover: (id: string, direcao: -1 | 1) => void
  onEditar: (id: string) => void
  onRemover: (id: string) => void
  onSelecionar: (id: string) => void
}) {
  const ordenadas = [...acoes].sort((a, b) => a.ordem - b.ordem)

  return (
    <aside className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Ações da jogada</h2>
      {ordenadas.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma ação criada ainda.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {ordenadas.map((acao, index) => (
            <li
              key={acao.id}
              onClick={() => onSelecionar(acao.id)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                selecionadaId === acao.id ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${COR_TIPO[acao.tipo]}`} />
                <span className="text-slate-700">
                  <span className="font-semibold text-slate-900">{acao.ordem}.</span> {ROTULO_TIPO[acao.tipo]} de{' '}
                  {acao.origem} para {descreverDestino(acao.destino)}
                  {editandoId === acao.id && (
                    <span className="ml-1 text-xs font-medium text-amber-600">(editando)</span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 gap-0.5">
                <BotaoIcone onClick={() => onMover(acao.id, -1)} disabled={index === 0} rotulo="Mover ação para cima">
                  <ChevronUpIcon className="h-3.5 w-3.5" />
                </BotaoIcone>
                <BotaoIcone
                  onClick={() => onMover(acao.id, 1)}
                  disabled={index === ordenadas.length - 1}
                  rotulo="Mover ação para baixo"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </BotaoIcone>
                <BotaoIcone onClick={() => onEditar(acao.id)} rotulo="Editar seta" className="text-blue-600 hover:bg-blue-50">
                  <PencilIcon className="h-3.5 w-3.5" />
                </BotaoIcone>
                <BotaoIcone onClick={() => onRemover(acao.id)} rotulo="Remover seta" className="text-red-600 hover:bg-red-50">
                  <TrashIcon className="h-3.5 w-3.5" />
                </BotaoIcone>
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
