import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// O jsdom não converte coordenadas de SVG. Nos testes, a tela e a quadra usam o mesmo
// sistema (transformação identidade): clicar em (300, 200) é o ponto (300, 200) da quadra.
const svg = SVGSVGElement.prototype as unknown as Record<string, unknown>
svg.createSVGPoint ??= () => {
  const ponto = { x: 0, y: 0, matrixTransform: () => ({ x: ponto.x, y: ponto.y }) }
  return ponto
}
svg.getScreenCTM ??= () => ({ inverse: () => ({}) })

// Cada teste começa do zero: DOM, localStorage, mocks, globais trocados e relógio.
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
