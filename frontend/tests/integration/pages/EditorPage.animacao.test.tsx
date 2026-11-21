import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { setChaveTreinador } from '../../../src/lib/storage'
import type { Cena } from '../../../src/types/cena'

// Integração: editor, painel, hook de animação, motor e SVG reais; só a rede é falsa.
// Só o requestAnimationFrame e o performance são falsos: o setTimeout segue real para o findBy funcionar.

// A1 passa para A2 no instante 1; A2 sobe no instante 2 levando a bola. A bola fica em (+13, +13) de quem a tem.
const CENA: Cena = {
  quadra: 'basquete',
  visualizacao: 'completa',
  pecas: [
    { id: 'A1', tipo: 'jogador_time_a', x: 200, y: 250 },
    { id: 'A2', tipo: 'jogador_time_a', x: 500, y: 250 },
    { id: 'bola', tipo: 'bola', x: 213, y: 263, posse: 'A1' },
  ],
  acoes: [
    { id: 'p', tipo: 'passe', origem: 'A1', destino: 'A2', ordem: 1 },
    { id: 'm', tipo: 'movimentacao', origem: 'A2', destino: { x: 500, y: 100 }, ordem: 2 },
  ],
}

function abrirEditor(cena: Cena) {
  setChaveTreinador('chave-do-treinador')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const caminho = new URL(url).pathname
      if (caminho !== '/teams/chave-do-treinador') throw new Error(`rota inesperada no teste: ${caminho}`)
      const time = { id: 7, nome: 'Furacão Basquete', modalidade: 'basquete', chave_treinador: 'chave-do-treinador', chave_atleta: 'x' }
      return new Response(JSON.stringify(time), { status: 200 })
    }),
  )
  const { container } = render(
    <MemoryRouter initialEntries={[{ pathname: '/times/quadra', state: { cenaInicial: cena } }]}>
      <App />
    </MemoryRouter>,
  )
  return container
}

// As peças são SVG sem nome acessível: o jogador é achado pelo número dentro dele e a bola é a única peça sem número.
function posicao(grupo: Element | null) {
  const [, x, y] = grupo?.getAttribute('transform')?.match(/translate\(([-\d.]+), ([-\d.]+)\)/) ?? []
  return { x: Number(x), y: Number(y) }
}
const jogador = (numero: string) => posicao(screen.getByText(numero, { selector: 'text' }).closest('g'))
const bola = (container: Element) =>
  posicao([...container.querySelectorAll('g[transform^="translate"]')].find((g) => !g.querySelector('text')) ?? null)

const barra = () => screen.getByRole('progressbar', { name: 'Progresso da jogada' })
const painel = async () => within((await screen.findByRole('heading', { name: 'Ações da jogada' })).closest('aside')!)
const avancar = (ms: number) => act(() => vi.advanceTimersByTime(ms))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('EditorPage: pontos da jogada e posse da bola', () => {
  it('sem ações, não mostra a barra nem os controles da animação', async () => {
    abrirEditor({ ...CENA, acoes: [] })

    expect(await screen.findByRole('heading', { name: 'Furacão Basquete' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
  })

  it('abre no fim da jogada, com a bola entregue a quem a recebeu', async () => {
    const container = abrirEditor(CENA)
    await screen.findByRole('heading', { name: 'Furacão Basquete' })

    expect(barra()).toHaveAttribute('aria-valuenow', '100')
    expect(jogador('2')).toEqual({ x: 500, y: 100 })
    expect(bola(container)).toEqual({ x: 513, y: 113 })
  })

  it('no ponto antes do primeiro instante, mostra a formação inicial com a bola no A1', async () => {
    const container = abrirEditor(CENA)
    await userEvent.click((await painel()).getByText('Instante 1'))

    expect(barra()).toHaveAttribute('aria-valuenow', '0')
    expect(jogador('2')).toEqual({ x: 500, y: 250 })
    expect(bola(container)).toEqual({ x: 213, y: 263 })
  })

  it('no ponto antes do segundo instante, o passe já aconteceu mas o A2 ainda não subiu', async () => {
    const container = abrirEditor(CENA)
    await userEvent.click((await painel()).getByText('Instante 2'))

    expect(barra()).toHaveAttribute('aria-valuenow', '50')
    expect(jogador('2')).toEqual({ x: 500, y: 250 })
    expect(bola(container)).toEqual({ x: 513, y: 263 })
  })
})

describe('EditorPage: reprodução da jogada', () => {
  it('o play no fim da jogada recomeça do início', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    abrirEditor(CENA)

    await userEvent.click(await screen.findByRole('button', { name: 'Play' }))

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(barra()).toHaveAttribute('aria-valuenow', '0')
  })

  it('o play a partir de um ponto começa dali', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    abrirEditor(CENA)
    await userEvent.click((await painel()).getByText('Instante 2'))

    await userEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(barra()).toHaveAttribute('aria-valuenow', '50')
  })

  it('anima a bola no passe, leva a bola com o A2 e termina no fim da jogada', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const container = abrirEditor(CENA)
    await userEvent.click(await screen.findByRole('button', { name: 'Play' }))

    avancar(500)
    expect(bola(container).x).toBeGreaterThan(213)
    expect(bola(container).x).toBeLessThan(513)
    expect(jogador('1')).toEqual({ x: 200, y: 250 })

    avancar(1000)
    expect(jogador('2').y).toBeLessThan(250)
    expect(bola(container).x).toBe(513)

    avancar(1000)
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(barra()).toHaveAttribute('aria-valuenow', '100')
    expect(bola(container)).toEqual({ x: 513, y: 113 })
  })

  it('ao pausar no meio de um instante, volta ao ponto antes desse instante', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const container = abrirEditor(CENA)
    await userEvent.click(await screen.findByRole('button', { name: 'Play' }))
    avancar(1500)

    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(barra()).toHaveAttribute('aria-valuenow', '50')
    expect(jogador('2')).toEqual({ x: 500, y: 250 })
    expect(bola(container)).toEqual({ x: 513, y: 263 })
  })
})
