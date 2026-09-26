import { useEffect, useMemo, useRef, useState } from 'react'
import { DURACAO_ACAO_MS, contarInstantes, montarPassos, posicoesNoTempo } from '../lib/animacao'
import type { Cena } from '../types/cena'

export function useAnimacao(cena: Cena) {
  const passos = useMemo(() => montarPassos(cena), [cena])
  const duracao = contarInstantes(passos) * DURACAO_ACAO_MS
  const [tempo, setTempo] = useState(0)
  const [tocando, setTocando] = useState(false)
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

  function voltarAoInicio() {
    tempoRef.current = 0
    setTempo(0)
  }

  function tocar() {
    if (tempoRef.current >= duracao) voltarAoInicio()
    setTocando(true)
  }

  function reiniciar() {
    voltarAoInicio()
    setTocando(true)
  }

  const pecas = useMemo(() => posicoesNoTempo(cena.pecas, passos, tempo), [cena.pecas, passos, tempo])
  const instanteAtual = tempo > 0 && tempo < duracao ? Math.floor(tempo / DURACAO_ACAO_MS) : null

  return { pecas, passos, instanteAtual, tempo, duracao, tocando, tocar, pausar: () => setTocando(false), reiniciar }
}
