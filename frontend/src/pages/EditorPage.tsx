import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg, { QUADRA_LIMITES } from '../components/QuadraSvg'
import PecaSvg, { RAIOS } from '../components/PecaSvg'
import AcaoSvg, { SetaMarkerDefs } from '../components/AcaoSvg'
import AcoesPainel from '../components/AcoesPainel'
import type { Acao, Cena, Peca, TipoAcao, TipoPeca } from '../types/cena'
import type { Modalidade } from '../lib/api'

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
  const [cena, setCena] = useState<Cena | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoDesenho, setModoDesenho] = useState<TipoAcao | null>(null)
  const [origemSelecionada, setOrigemSelecionada] = useState<string | null>(null)
  const proximoIdRef = useRef({ jogador_time_a: 3, jogador_time_b: 3 })

  useEffect(() => {
    if (team && !cena) {
      setCena({ quadra: team.modalidade, pecas: PECAS_INICIAIS, acoes: [] })
    }
  }, [team, cena])

  function alternarModoDesenho(tipo: TipoAcao) {
    return () => {
      setModoDesenho((atual) => (atual === tipo ? null : tipo))
      setOrigemSelecionada(null)
    }
  }

  function criarAcao(destino: Acao['destino']) {
    if (!modoDesenho || !origemSelecionada) return
    setCena((prev) => {
      if (!prev) return prev
      const ordem = prev.acoes.length + 1
      const novaAcao: Acao = {
        id: `a${ordem}`,
        tipo: modoDesenho,
        origem: origemSelecionada,
        destino,
        ordem,
      }
      return { ...prev, acoes: [...prev.acoes, novaAcao] }
    })
    setOrigemSelecionada(null)
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
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-4 p-6">
      <h1 className="text-xl font-semibold text-gray-900">{team.nome}</h1>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleAdicionarJogador('jogador_time_a')}
          disabled={contagem.jogador_time_a >= max}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Jogador Time A ({contagem.jogador_time_a}/{max})
        </button>
        <button
          type="button"
          onClick={handleAdicionarJogador('jogador_time_b')}
          disabled={contagem.jogador_time_b >= max}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          + Jogador Time B ({contagem.jogador_time_b}/{max})
        </button>
        <button
          type="button"
          onClick={handleRemoverSelecionado}
          disabled={!podeRemover}
          className="rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Remover jogador selecionado
        </button>
        <button
          type="button"
          onClick={alternarModoDesenho('movimentacao')}
          className={`rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 ${
            modoDesenho === 'movimentacao' ? 'bg-emerald-800 ring-2 ring-emerald-300' : 'bg-emerald-600'
          }`}
        >
          {modoDesenho === 'movimentacao' ? 'Desenhando movimentação (clique pra sair)' : 'Desenhar movimentação'}
        </button>
        <button
          type="button"
          onClick={alternarModoDesenho('passe')}
          className={`rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 ${
            modoDesenho === 'passe' ? 'bg-purple-800 ring-2 ring-purple-300' : 'bg-purple-600'
          }`}
        >
          {modoDesenho === 'passe' ? 'Desenhando passe (clique pra sair)' : 'Desenhar passe'}
        </button>
      </div>

      {modoDesenho && (
        <p className="text-sm text-gray-600">
          {origemSelecionada
            ? 'Selecione a peça de destino, ou clique num ponto vazio da quadra.'
            : 'Selecione a peça de origem da seta.'}
        </p>
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
            return <AcaoSvg key={acao.id} x1={origemPeca.x} y1={origemPeca.y} x2={destino.x} y2={destino.y} />
          })}
        </QuadraSvg>

        <AcoesPainel acoes={cena.acoes} onMover={moverAcao} />
      </div>
    </div>
  )
}
