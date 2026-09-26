import type { Acao } from '../types/cena'

const ROTULO_TIPO: Record<Acao['tipo'], string> = {
  movimentacao: 'Movimentação',
  passe: 'Passe',
}

function descreverDestino(destino: Acao['destino']) {
  return typeof destino === 'string' ? destino : 'ponto livre'
}

export default function AcoesPainel({
  acoes,
  editandoId,
  onMover,
  onEditar,
  onRemover,
}: {
  acoes: Acao[]
  editandoId: string | null
  onMover: (id: string, direcao: -1 | 1) => void
  onEditar: (id: string) => void
  onRemover: (id: string) => void
}) {
  const ordenadas = [...acoes].sort((a, b) => a.ordem - b.ordem)

  return (
    <aside className="w-full max-w-xs">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Ações da jogada</h2>
      {ordenadas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma ação criada ainda.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {ordenadas.map((acao, index) => (
            <li
              key={acao.id}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{acao.ordem}.</span> {ROTULO_TIPO[acao.tipo]} de {acao.origem} para{' '}
                {descreverDestino(acao.destino)}
                {editandoId === acao.id && <span className="ml-1 text-xs text-amber-600">(editando)</span>}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onMover(acao.id, -1)}
                  disabled={index === 0}
                  aria-label="Mover ação para cima"
                  className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMover(acao.id, 1)}
                  disabled={index === ordenadas.length - 1}
                  aria-label="Mover ação para baixo"
                  className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onEditar(acao.id)}
                  aria-label="Editar seta"
                  className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => onRemover(acao.id)}
                  aria-label="Remover seta"
                  className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
