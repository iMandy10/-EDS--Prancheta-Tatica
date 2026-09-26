import type { Peca, TipoPeca } from '../types/cena'
import { POSICOES_BASQUETE, TIPO_ARRASTE_PECA } from '../lib/basquete'

const CORES: Record<TipoPeca, string> = {
  jogador_time_a: 'bg-blue-600',
  jogador_time_b: 'bg-red-600',
  bola: 'bg-amber-500',
}

const GRUPOS: { titulo: string; tipo: TipoPeca; ids: string[] }[] = [
  { titulo: 'Time A', tipo: 'jogador_time_a', ids: ['A1', 'A2', 'A3', 'A4', 'A5'] },
  { titulo: 'Time B', tipo: 'jogador_time_b', ids: ['B1', 'B2', 'B3', 'B4', 'B5'] },
  { titulo: 'Bola', tipo: 'bola', ids: ['bola'] },
]

// Estojo do basquete: cada peça tem identidade própria e o treinador escolhe quais levar para a quadra.
// Arrastar uma peça fora de quadra e soltar na quadra a posiciona; clicar alterna entre estojo e quadra.
export default function EstojoPecas({
  pecas,
  onAlternar,
}: {
  pecas: Peca[]
  onAlternar: (id: string, tipo: TipoPeca) => void
}) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{grupo.titulo}</span>
          <div className="flex gap-2">
            {grupo.ids.map((id, index) => {
              const emQuadra = pecas.some((peca) => peca.id === id)
              const rotulo = grupo.tipo === 'bola' ? '' : String(index + 1)
              return (
                <button
                  key={id}
                  type="button"
                  draggable={!emQuadra}
                  onDragStart={(event) => event.dataTransfer.setData(TIPO_ARRASTE_PECA, JSON.stringify({ id, tipo: grupo.tipo }))}
                  onClick={() => onAlternar(id, grupo.tipo)}
                  title={emQuadra ? 'Em quadra: clique para devolver ao estojo' : 'Arraste para a quadra ou clique para colocar'}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span
                    className={`flex items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white shadow-card ${CORES[grupo.tipo]} ${
                      emQuadra ? 'opacity-30' : 'cursor-grab'
                    } ${grupo.tipo === 'bola' ? 'h-6 w-6' : 'h-8 w-8'}`}
                  >
                    {rotulo}
                  </span>
                  {grupo.tipo !== 'bola' && (
                    <span className="text-[10px] font-medium text-slate-500">{POSICOES_BASQUETE[index]}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
