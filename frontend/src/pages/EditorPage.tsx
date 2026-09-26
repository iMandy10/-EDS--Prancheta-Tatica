import { useState, type PointerEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg, { QUADRA_LIMITES } from '../components/QuadraSvg'
import PecaSvg, { RAIOS } from '../components/PecaSvg'
import type { Peca } from '../types/cena'

const PECAS_INICIAIS: Peca[] = [
  { id: 'A1', tipo: 'jogador_time_a', x: 250, y: 150 },
  { id: 'A2', tipo: 'jogador_time_a', x: 250, y: 350 },
  { id: 'B1', tipo: 'jogador_time_b', x: 550, y: 150 },
  { id: 'B2', tipo: 'jogador_time_b', x: 550, y: 350 },
  { id: 'bola', tipo: 'bola', x: 400, y: 250 },
]

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
  const [pecas, setPecas] = useState<Peca[]>(PECAS_INICIAIS)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function handlePecaPointerDown(id: string) {
    return (event: PointerEvent) => {
      event.preventDefault()
      setDraggingId(id)
    }
  }

  function handleSvgPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!draggingId) return
    const { x, y } = paraCoordenadasSvg(event.currentTarget, event.clientX, event.clientY)

    setPecas((prev) =>
      prev.map((peca) => {
        if (peca.id !== draggingId) return peca
        const raio = RAIOS[peca.tipo]
        return {
          ...peca,
          x: clamp(x, QUADRA_LIMITES.minX + raio, QUADRA_LIMITES.maxX - raio),
          y: clamp(y, QUADRA_LIMITES.minY + raio, QUADRA_LIMITES.maxY - raio),
        }
      }),
    )
  }

  function handleSvgPointerUp() {
    setDraggingId(null)
  }

  if (!chave || notFound) {
    return <Navigate to="/" replace />
  }

  if (!team) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-gray-500">
        Carregando...
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-4 p-6">
      <h1 className="text-xl font-semibold text-gray-900">{team.nome}</h1>
      <QuadraSvg quadra={team.modalidade} onPointerMove={handleSvgPointerMove} onPointerUp={handleSvgPointerUp}>
        {pecas.map((peca) => (
          <PecaSvg
            key={peca.id}
            peca={peca}
            dragging={peca.id === draggingId}
            onPointerDown={handlePecaPointerDown(peca.id)}
          />
        ))}
      </QuadraSvg>
    </div>
  )
}
