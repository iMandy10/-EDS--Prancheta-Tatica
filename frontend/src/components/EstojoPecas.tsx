import type { Peca, TipoAcao, TipoPeca } from '../types/cena'
import type { Modalidade } from '../lib/api'
import AcaoSvg, { SetaMarkerDefs } from './AcaoSvg'
import { POSICOES_BASQUETE } from '../lib/basquete'
import { FORMACOES, POSICOES_FUTEBOL, type Formacao } from '../lib/futebol'
import { TIPO_ARRASTE_PECA } from '../lib/dinamica'

const CORES: Record<TipoPeca, string> = {
  jogador_time_a: 'bg-blue-600',
  jogador_time_b: 'bg-red-600',
  bola: 'bg-amber-500',
}

const IDS_BASQUETE = ['1', '2', '3', '4', '5']
const IDS_FUTEBOL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

const FERRAMENTAS_BASQUETE: { tipo: TipoAcao; rotulo: string }[] = [
  { tipo: 'movimentacao', rotulo: 'Movimentação' },
  { tipo: 'passe', rotulo: 'Passe' },
  { tipo: 'bloqueio', rotulo: 'Bloqueio' },
  { tipo: 'drible', rotulo: 'Drible' },
]

const FERRAMENTAS_FUTEBOL: { tipo: TipoAcao; rotulo: string }[] = [
  { tipo: 'movimentacao', rotulo: 'Movimentação' },
  { tipo: 'passe', rotulo: 'Passe' },
]

// Estojo de peças: cada peça tem identidade própria e o treinador escolhe quais levar para a quadra.
// Arrastar uma peça fora de quadra e soltar na quadra a posiciona; clicar alterna entre estojo e quadra.
// As setas também ficam no estojo: com uma ferramenta ativa, o treinador arrasta de uma peça até o destino.
export default function EstojoPecas({
  quadra,
  formacao,
  onFormacao,
  pecas,
  onAlternar,
  ferramenta,
  onFerramenta,
  ferramentasBloqueadas,
  pecasBloqueadas,
}: {
  quadra: Modalidade
  formacao?: Formacao
  onFormacao?: (formacao: Formacao) => void
  pecas: Peca[]
  onAlternar: (id: string, tipo: TipoPeca) => void
  ferramenta: TipoAcao | null
  onFerramenta: (tipo: TipoAcao) => void
  ferramentasBloqueadas: boolean
  pecasBloqueadas: boolean
}) {
  const numeros = quadra === 'basquete' ? IDS_BASQUETE : IDS_FUTEBOL
  const rotulos = quadra === 'basquete' ? POSICOES_BASQUETE : formacao ? POSICOES_FUTEBOL[formacao] : []
  const ferramentas = quadra === 'basquete' ? FERRAMENTAS_BASQUETE : FERRAMENTAS_FUTEBOL
  const grupos: { titulo: string; tipo: TipoPeca; ids: string[] }[] = [
    { titulo: 'Time A', tipo: 'jogador_time_a', ids: numeros.map((n) => `A${n}`) },
    { titulo: 'Time B', tipo: 'jogador_time_b', ids: numeros.map((n) => `B${n}`) },
    { titulo: 'Bola', tipo: 'bola', ids: ['bola'] },
  ]

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
      {quadra === 'futebol' && onFormacao && (
        <div className="flex items-center gap-2">
          <label htmlFor="formacao" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Formação
          </label>
          <select
            id="formacao"
            value={formacao}
            onChange={(event) => onFormacao(event.target.value as Formacao)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
          >
            {FORMACOES.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {grupos.map((grupo) => (
          <div key={grupo.titulo} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{grupo.titulo}</span>
            <div className="flex flex-wrap gap-2">
              {grupo.ids.map((id, index) => {
                const emQuadra = pecas.some((peca) => peca.id === id)
                const rotulo = grupo.tipo === 'bola' ? '' : String(index + 1)
                return (
                  <button
                    key={id}
                    type="button"
                    draggable={!emQuadra && !pecasBloqueadas}
                    disabled={pecasBloqueadas}
                    onDragStart={(event) => event.dataTransfer.setData(TIPO_ARRASTE_PECA, JSON.stringify({ id, tipo: grupo.tipo }))}
                    onClick={() => onAlternar(id, grupo.tipo)}
                    title={emQuadra ? 'Em quadra: clique para devolver ao estojo' : 'Arraste para a quadra ou clique para colocar'}
                    className="flex flex-col items-center gap-0.5 disabled:opacity-40"
                  >
                    <span
                      className={`flex items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white shadow-card ${CORES[grupo.tipo]} ${
                        emQuadra ? 'opacity-30' : 'cursor-grab'
                      } ${grupo.tipo === 'bola' ? 'h-6 w-6' : 'h-8 w-8'}`}
                    >
                      {rotulo}
                    </span>
                    {grupo.tipo !== 'bola' && rotulos[index] && (
                      <span className="text-[10px] font-medium text-slate-500">{rotulos[index]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ações</span>
          <div className="flex gap-1.5">
            {ferramentas.map(({ tipo, rotulo }) => (
              <button
                key={tipo}
                type="button"
                onClick={() => onFerramenta(tipo)}
                disabled={ferramentasBloqueadas}
                aria-pressed={ferramenta === tipo}
                title={ferramenta === tipo ? `${rotulo}: clique (ou Esc) para parar de desenhar` : `Desenhar ${rotulo.toLowerCase()}`}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 disabled:opacity-40 ${
                  ferramenta === tipo ? 'bg-brand-50 ring-2 ring-brand-500' : 'hover:bg-slate-100'
                }`}
              >
                <svg viewBox="0 0 60 20" className="h-5 w-14">
                  <SetaMarkerDefs />
                  <AcaoSvg x1={4} y1={10} x2={54} y2={10} tipo={tipo} preta />
                </svg>
                <span className="text-[10px] font-medium text-slate-500">{rotulo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
