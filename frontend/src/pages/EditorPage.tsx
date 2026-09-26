import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg, { QUADRA_LIMITES } from '../components/QuadraSvg'
import PecaSvg, { RAIOS } from '../components/PecaSvg'
import AcaoSvg, { SetaMarkerDefs } from '../components/AcaoSvg'
import AcoesPainel from '../components/AcoesPainel'
import SalvarJogadaModal from '../components/SalvarJogadaModal'
import Button from '../components/Button'
import { FolderOpenIcon, PlusIcon, TrashIcon } from '../components/icons'
import type { Acao, Cena, Peca, TipoAcao, TipoPeca } from '../types/cena'
import { createPlay, type Modalidade, type StatusJogada } from '../lib/api'
import { cabeNoInstante, compactarOrdens } from '../lib/instantes'

const PECAS_INICIAIS: Peca[] = [
  { id: 'A1', tipo: 'jogador_time_a', x: 250, y: 150 },
  { id: 'A2', tipo: 'jogador_time_a', x: 250, y: 350 },
  { id: 'B1', tipo: 'jogador_time_b', x: 550, y: 150 },
  { id: 'B2', tipo: 'jogador_time_b', x: 550, y: 350 },
  { id: 'bola', tipo: 'bola', x: 400, y: 250 },
]

const MAX_JOGADORES: Record<Modalidade, number> = {
  futebol: 11,
  basquete: 5,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Tira a ação do instante em que está e a coloca num instante próprio logo em seguida.
function separarAcao(acoes: Acao[], id: string): Acao[] {
  const alvo = acoes.find((acao) => acao.id === id)
  if (!alvo) return acoes
  return compactarOrdens(
    acoes.map((acao) => {
      if (acao.id === id) return { ...acao, ordem: alvo.ordem + 1 }
      if (acao.ordem > alvo.ordem) return { ...acao, ordem: acao.ordem + 1 }
      return acao
    }),
  )
}

function paraCoordenadasSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ponto = svg.createSVGPoint()
  ponto.x = clientX
  ponto.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: clientX, y: clientY }
  const transformado = ponto.matrixTransform(ctm.inverse())
  return { x: transformado.x, y: transformado.y }
}

export default function EditorPage() {
  const { chave, team, notFound } = useTeamSession()
  const navigate = useNavigate()
  const location = useLocation()
  const cenaInicial = (location.state as { cenaInicial?: Cena } | null)?.cenaInicial
  const [cena, setCena] = useState<Cena | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoDesenho, setModoDesenho] = useState<TipoAcao | null>(null)
  const [origemSelecionada, setOrigemSelecionada] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [acaoSelecionadaId, setAcaoSelecionadaId] = useState<string | null>(null)
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const proximoIdRef = useRef({ jogador_time_a: 3, jogador_time_b: 3 })

  useEffect(() => {
    if (team && !cena) {
      setCena(cenaInicial ?? { quadra: team.modalidade, pecas: PECAS_INICIAIS, acoes: [] })
    }
  }, [team, cena, cenaInicial])

  function alternarModoDesenho(tipo: TipoAcao) {
    return () => {
      setModoDesenho((atual) => (atual === tipo ? null : tipo))
      setOrigemSelecionada(null)
      setEditandoId(null)
    }
  }

  function iniciarEdicaoAcao(id: string) {
    const acao = cena?.acoes.find((a) => a.id === id)
    if (!acao) return
    setEditandoId(id)
    setModoDesenho(acao.tipo)
    setOrigemSelecionada(null)
  }

  function criarAcao(destino: Acao['destino']) {
    if (!modoDesenho || !origemSelecionada) return
    const estavaEditando = editandoId !== null

    setCena((prev) => {
      if (!prev) return prev

      if (editandoId) {
        const acoes = prev.acoes.map((acao) =>
          acao.id === editandoId ? { ...acao, origem: origemSelecionada, destino } : acao,
        )
        const editada = acoes.find((acao) => acao.id === editandoId)
        const grupo = acoes.filter((acao) => acao.ordem === editada?.ordem)
        const cabe = editada && cabeNoInstante(editada, grupo, prev.pecas)
        return { ...prev, acoes: cabe ? acoes : separarAcao(acoes, editandoId) }
      }

      const ordem = Math.max(0, ...prev.acoes.map((acao) => acao.ordem)) + 1
      const numero = Math.max(0, ...prev.acoes.map((acao) => Number(acao.id.slice(1)) || 0)) + 1
      const novaAcao: Acao = {
        id: `a${numero}`,
        tipo: modoDesenho,
        origem: origemSelecionada,
        destino,
        ordem,
      }
      return { ...prev, acoes: [...prev.acoes, novaAcao] }
    })

    setOrigemSelecionada(null)
    if (estavaEditando) {
      setEditandoId(null)
      setModoDesenho(null)
    }
  }

  function removerAcao(id: string) {
    setCena((prev) => {
      if (!prev) return prev
      return { ...prev, acoes: compactarOrdens(prev.acoes.filter((acao) => acao.id !== id)) }
    })
    if (editandoId === id) {
      setEditandoId(null)
      setModoDesenho(null)
      setOrigemSelecionada(null)
    }
    if (acaoSelecionadaId === id) {
      setAcaoSelecionadaId(null)
    }
  }

  function alternarSelecaoAcao(id: string) {
    setAcaoSelecionadaId((atual) => (atual === id ? null : id))
  }

  function moverAcao(id: string, direcao: -1 | 1) {
    setCena((prev) => {
      if (!prev) return prev
      const ordenadas = [...prev.acoes].sort((a, b) => a.ordem - b.ordem)
      const index = ordenadas.findIndex((acao) => acao.id === id)
      const vizinho = index + direcao
      if (index === -1 || vizinho < 0 || vizinho >= ordenadas.length) return prev

      const ordemAtual = ordenadas[index].ordem
      const ordemVizinho = ordenadas[vizinho].ordem
      return {
        ...prev,
        acoes: prev.acoes.map((acao) => {
          if (acao.id === ordenadas[index].id) return { ...acao, ordem: ordemVizinho }
          if (acao.id === ordenadas[vizinho].id) return { ...acao, ordem: ordemAtual }
          return acao
        }),
      }
    })
  }

  function handlePecaPointerDown(id: string) {
    return (event: PointerEvent<SVGGElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (modoDesenho) {
        if (!origemSelecionada) {
          setOrigemSelecionada(id)
        } else if (origemSelecionada === id) {
          setOrigemSelecionada(null)
        } else {
          criarAcao(id)
        }
        return
      }

      setDraggingId(id)
      setSelectedId(id)
    }
  }

  function handleSvgPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (modoDesenho && origemSelecionada) {
      const { x, y } = paraCoordenadasSvg(event.currentTarget, event.clientX, event.clientY)
      criarAcao({
        x: clamp(x, QUADRA_LIMITES.minX, QUADRA_LIMITES.maxX),
        y: clamp(y, QUADRA_LIMITES.minY, QUADRA_LIMITES.maxY),
      })
      return
    }

    setSelectedId(null)
  }

  function handleSvgPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!draggingId) return
    const { x, y } = paraCoordenadasSvg(event.currentTarget, event.clientX, event.clientY)

    setCena((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pecas: prev.pecas.map((peca) => {
          if (peca.id !== draggingId) return peca
          const raio = RAIOS[peca.tipo]
          return {
            ...peca,
            x: clamp(x, QUADRA_LIMITES.minX + raio, QUADRA_LIMITES.maxX - raio),
            y: clamp(y, QUADRA_LIMITES.minY + raio, QUADRA_LIMITES.maxY - raio),
          }
        }),
      }
    })
  }

  function handleSvgPointerUp() {
    setDraggingId(null)
  }

  function handleAdicionarJogador(tipo: 'jogador_time_a' | 'jogador_time_b') {
    return () => {
      if (!cena) return
      const max = MAX_JOGADORES[cena.quadra]
      const atuais = cena.pecas.filter((peca) => peca.tipo === tipo)
      if (atuais.length >= max) return

      const prefixo = tipo === 'jogador_time_a' ? 'A' : 'B'
      const numero = proximoIdRef.current[tipo]++
      const novaPeca: Peca = {
        id: `${prefixo}${numero}`,
        tipo,
        x: tipo === 'jogador_time_a' ? 250 : 550,
        y: 100 + (atuais.length % 5) * 70,
      }
      setCena({ ...cena, pecas: [...cena.pecas, novaPeca] })
    }
  }

  async function handleSalvarJogada(dados: { titulo: string; descricao: string; status: StatusJogada }) {
    if (!team || !cena || !chave) return

    setSalvando(true)
    setErroSalvar(null)
    try {
      await createPlay(team.id, chave, {
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        status: dados.status,
        cena,
      })
      setModalSalvarAberto(false)
    } catch {
      setErroSalvar('Não foi possível salvar a jogada. Verifique se o servidor está rodando e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function handleRemoverSelecionado() {
    if (!selectedId) return
    setCena((prev) => (prev ? { ...prev, pecas: prev.pecas.filter((peca) => peca.id !== selectedId) } : prev))
    setSelectedId(null)
  }

  if (!chave || notFound) {
    return <Navigate to="/" replace />
  }

  if (!team || !cena) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-gray-500">
        Carregando...
      </div>
    )
  }

  const contagem: Record<TipoPeca, number> = {
    jogador_time_a: cena.pecas.filter((peca) => peca.tipo === 'jogador_time_a').length,
    jogador_time_b: cena.pecas.filter((peca) => peca.tipo === 'jogador_time_b').length,
    bola: cena.pecas.filter((peca) => peca.tipo === 'bola').length,
  }
  const max = MAX_JOGADORES[cena.quadra]
  const selecionada = cena.pecas.find((peca) => peca.id === selectedId)
  const podeRemover = selecionada && selecionada.tipo !== 'bola'

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Editor de jogadas</p>
            <h1 className="text-xl font-bold text-slate-900">{team.nome}</h1>
          </div>
          <Button onClick={() => navigate('/times/jogadas')} variant="outline">
            <FolderOpenIcon className="h-4 w-4" />
            Minhas jogadas
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pt-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleAdicionarJogador('jogador_time_a')} disabled={contagem.jogador_time_a >= max} variant="outline">
              <PlusIcon className="h-4 w-4 text-blue-600" />
              Time A ({contagem.jogador_time_a}/{max})
            </Button>
            <Button onClick={handleAdicionarJogador('jogador_time_b')} disabled={contagem.jogador_time_b >= max} variant="outline">
              <PlusIcon className="h-4 w-4 text-red-600" />
              Time B ({contagem.jogador_time_b}/{max})
            </Button>
            <Button onClick={handleRemoverSelecionado} disabled={!podeRemover} variant="danger">
              <TrashIcon className="h-4 w-4" />
              Remover
            </Button>
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
            <Button
              onClick={alternarModoDesenho('movimentacao')}
              disabled={editandoId !== null}
              variant="movimento"
              active={modoDesenho === 'movimentacao'}
            >
              {modoDesenho === 'movimentacao' ? 'Desenhando... (clique p/ sair)' : 'Desenhar movimentação'}
            </Button>
            <Button
              onClick={alternarModoDesenho('passe')}
              disabled={editandoId !== null}
              variant="passe"
              active={modoDesenho === 'passe'}
            >
              {modoDesenho === 'passe' ? 'Desenhando... (clique p/ sair)' : 'Desenhar passe'}
            </Button>
          </div>

          <Button onClick={() => setModalSalvarAberto(true)} variant="primary">
            Salvar jogada
          </Button>
        </div>

        {modoDesenho && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
            {editandoId ? <strong>Editando seta — </strong> : null}
            {origemSelecionada
              ? 'Selecione a peça de destino, ou clique num ponto vazio da quadra.'
              : editandoId
                ? 'Selecione a nova peça de origem da seta.'
                : 'Selecione a peça de origem da seta.'}
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:justify-center">
        <QuadraSvg
          quadra={cena.quadra}
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          <SetaMarkerDefs />
          {cena.pecas.map((peca) => (
            <PecaSvg
              key={peca.id}
              peca={peca}
              dragging={peca.id === draggingId}
              selected={peca.id === selectedId || peca.id === origemSelecionada}
              onPointerDown={handlePecaPointerDown(peca.id)}
            />
          ))}
          {cena.acoes.map((acao) => {
            const origemPeca = cena.pecas.find((peca) => peca.id === acao.origem)
            const destino = typeof acao.destino === 'string'
              ? cena.pecas.find((peca) => peca.id === acao.destino)
              : acao.destino
            if (!origemPeca || !destino) return null
            return (
              <AcaoSvg
                key={acao.id}
                x1={origemPeca.x}
                y1={origemPeca.y}
                x2={destino.x}
                y2={destino.y}
                tipo={acao.tipo}
                destacada={acao.id === acaoSelecionadaId || acao.id === editandoId}
              />
            )
          })}
        </QuadraSvg>

        <AcoesPainel
          acoes={cena.acoes}
          editandoId={editandoId}
          selecionadaId={acaoSelecionadaId}
          onMover={moverAcao}
          onEditar={iniciarEdicaoAcao}
          onRemover={removerAcao}
          onSelecionar={alternarSelecaoAcao}
        />
        </div>
      </div>

      <SalvarJogadaModal
        aberto={modalSalvarAberto}
        salvando={salvando}
        erro={erroSalvar}
        onFechar={() => setModalSalvarAberto(false)}
        onSalvar={handleSalvarJogada}
      />
    </div>
  )
}
