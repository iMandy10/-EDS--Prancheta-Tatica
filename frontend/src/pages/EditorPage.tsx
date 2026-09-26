import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg, { QUADRA_LIMITES } from '../components/QuadraSvg'
import PecaSvg, { RAIOS } from '../components/PecaSvg'
import type { Cena, Peca, TipoPeca } from '../types/cena'
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
  const proximoIdRef = useRef({ jogador_time_a: 3, jogador_time_b: 3 })

  useEffect(() => {
    if (team && !cena) {
      setCena({ quadra: team.modalidade, pecas: PECAS_INICIAIS })
    }
  }, [team, cena])

  function handlePecaPointerDown(id: string) {
    return (event: PointerEvent<SVGGElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setDraggingId(id)
      setSelectedId(id)
    }
  }

  function handleSvgPointerDown() {
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
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-4 p-6">
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
      </div>

      <QuadraSvg
        quadra={cena.quadra}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
      >
        {cena.pecas.map((peca) => (
          <PecaSvg
            key={peca.id}
            peca={peca}
            dragging={peca.id === draggingId}
            selected={peca.id === selectedId}
            onPointerDown={handlePecaPointerDown(peca.id)}
          />
        ))}
      </QuadraSvg>
    </div>
  )
}
