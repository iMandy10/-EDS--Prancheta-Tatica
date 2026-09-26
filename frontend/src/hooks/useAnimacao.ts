import { useEffect, useMemo, useRef, useState } from 'react'
import { DURACAO_ACAO_MS, contarInstantes, montarPassos, posicoesNoTempo } from '../lib/animacao'
import type { Cena } from '../types/cena'

// aoTerminar é chamado quando a animação chega ao fim tocando (não quando é pausada).
export function useAnimacao(cena: Cena, aoTerminar?: () => void) {
  const passos = useMemo(() => montarPassos(cena), [cena])
  const duracao = contarInstantes(passos) * DURACAO_ACAO_MS
  const [tempo, setTempo] = useState(0)
  const [tocando, setTocando] = useState(false)
  const tempoRef = useRef(0)
  const aoTerminarRef = useRef(aoTerminar)

  useEffect(() => {
    aoTerminarRef.current = aoTerminar
  })

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
        aoTerminarRef.current?.()
      } else {
        frame = requestAnimationFrame(avancar)
      }
    }
    frame = requestAnimationFrame(avancar)
    return () => cancelAnimationFrame(frame)
  }, [tocando, duracao])

  function irPara(ms: number) {
    tempoRef.current = Math.min(Math.max(ms, 0), duracao)
    setTempo(tempoRef.current)
  }

  function voltarAoInicio() {
    irPara(0)
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

  return { pecas, passos, instanteAtual, tempo, duracao, tocando, tocar, pausar: () => setTocando(false), reiniciar, irPara }
}
