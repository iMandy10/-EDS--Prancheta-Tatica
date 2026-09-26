import { useEffect, useMemo, useRef, useState } from 'react'
import { DURACAO_ACAO_MS, montarPassos, posicoesNoTempo } from '../lib/animacao'
import type { Cena } from '../types/cena'

export function useAnimacao(cena: Cena) {
  const passos = useMemo(() => montarPassos(cena), [cena])
  const duracao = passos.length * DURACAO_ACAO_MS
  const [tempo, setTempo] = useState(0)
  const [tocando, setTocando] = useState(true)
  const tempoRef = useRef(0)

  useEffect(() => {
    if (!tocando) return

    let frame = 0
    let anterior = performance.now()
    const avancar = (agora: number) => {
      tempoRef.current = Math.min(tempoRef.current + agora - anterior, duracao)
      anterior = agora
      setTempo(tempoRef.current)
      if (tempoRef.current >= duracao) {
        setTocando(false)
      } else {
        frame = requestAnimationFrame(avancar)
      }
    }
    frame = requestAnimationFrame(avancar)
    return () => cancelAnimationFrame(frame)
  }, [tocando, duracao])

  const pecas = useMemo(() => posicoesNoTempo(cena.pecas, passos, tempo), [cena.pecas, passos, tempo])

  return { pecas, passos, tempo, duracao, tocando }
}
