import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../../src/App'
import { setChaveTreinador } from '../../../src/lib/storage'

// Integração: editor, estojo, quadra, peças e lib reais; só a rede é falsa.
// O jsdom não converte coordenadas de SVG: aqui a tela e a quadra usam o mesmo sistema (identidade).
const svg = SVGSVGElement.prototype as unknown as Record<string, unknown>
const originais = { createSVGPoint: svg.createSVGPoint, getScreenCTM: svg.getScreenCTM }

beforeEach(() => {
  svg.createSVGPoint = () => {
    const ponto = { x: 0, y: 0, matrixTransform: () => ({ x: ponto.x, y: ponto.y }) }
    return ponto
  }
  svg.getScreenCTM = () => ({ inverse: () => ({}) })
})

afterEach(() => {
  Object.assign(svg, originais)
  vi.unstubAllGlobals()
})

async function abrirEditor(modalidade: 'futebol' | 'basquete' = 'futebol') {
  setChaveTreinador('chave-do-treinador')
  const time = { id: 7, nome: 'Furacão FC', modalidade, chave_treinador: 'chave-do-treinador', chave_atleta: 'x' }
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(time), { status: 200 })))
  render(
    <MemoryRouter initialEntries={['/times/quadra']}>
      <App />
    </MemoryRouter>,
  )
  return screen.findByRole('img', { name: `Quadra de ${modalidade}` })
}

// Peças desenhadas na quadra, como "rótulo@x,y" (a bola não tem rótulo).
const pecasNaQuadra = (quadra: Element) =>
  [...quadra.querySelectorAll('g[transform^="translate"]')].map((g) => {
    const [, x, y] = g.getAttribute('transform')!.match(/translate\(([-\d.]+), ([-\d.]+)\)/)!
    return `${g.querySelector('text')?.textContent ?? 'bola'}@${x},${y}`
  })

const estojo = (grupo: string) => within(screen.getByText(grupo, { selector: 'span' }).parentElement!).getAllByRole('button')

describe('EditorPage: colocar peças pelo estojo', () => {
  it('abre a quadra da modalidade do time, vazia', async () => {
    const quadra = await abrirEditor('basquete')

    expect(pecasNaQuadra(quadra)).toEqual([])
    expect(estojo('Time A')).toHaveLength(5)
  })

  it('clicar no A1 e no B1 coloca os goleiros nos dois lados do campo', async () => {
    const quadra = await abrirEditor()

    await userEvent.click(estojo('Time A')[0])
    await userEvent.click(estojo('Time B')[0])

    expect(pecasNaQuadra(quadra)).toEqual(['GOL@45,250', 'GOL@755,250'])
  })

  it('a peça entra na posição da formação escolhida', async () => {
    const quadra = await abrirEditor()

    await userEvent.selectOptions(screen.getByLabelText('Formação'), '4-3-3')
    await userEvent.click(estojo('Time A')[8])

    expect(pecasNaQuadra(quadra)).toEqual(['PE@500,70'])
  })

  it('clicar de novo numa peça em quadra devolve ela ao estojo', async () => {
    const quadra = await abrirEditor()
    await userEvent.click(estojo('Time A')[0])

    await userEvent.click(estojo('Time A')[0])

    expect(pecasNaQuadra(quadra)).toEqual([])
  })

  it('"Remover" só fica ativo com uma peça selecionada, e tira essa peça', async () => {
    const quadra = await abrirEditor()
    await userEvent.click(estojo('Time A')[0])
    await userEvent.click(estojo('Time A')[1])
    const remover = screen.getByRole('button', { name: 'Remover' })
    expect(remover).toBeDisabled()

    fireEvent.pointerDown(quadra.querySelector('g[transform="translate(45, 250)"]')!)
    fireEvent.pointerUp(quadra)
    await userEvent.click(remover)

    expect(pecasNaQuadra(quadra)).toEqual(['LE@150,70'])
  })
})
