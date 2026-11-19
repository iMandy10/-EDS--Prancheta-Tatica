import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setChaveTreinador } from '../../src/lib/storage'
import type { Cena } from '../../src/types/cena'
import { CHAVE, TIME } from './dados'
import { mockFetch, type RespostaFalsa } from './mockFetch'
import { renderApp } from './renderWithRouter'

// Editor de basquete pronto para desenhar setas, usado pelos testes EditorPage.setas/ordem/salvar.
// A1 (armador, com a bola) e A2 (ala) do Time A, e B1 do Time B; nenhuma seta ainda.
export const CENA: Cena = {
  quadra: 'basquete',
  pecas: [
    { id: 'A1', tipo: 'jogador_time_a', x: 200, y: 250 },
    { id: 'A2', tipo: 'jogador_time_a', x: 500, y: 250 },
    { id: 'B1', tipo: 'jogador_time_b', x: 600, y: 100 },
    { id: 'bola', tipo: 'bola', x: 213, y: 263, posse: 'A1' },
  ],
  acoes: [],
}

export async function abrirEditor(extras: Record<string, RespostaFalsa> = {}) {
  setChaveTreinador(CHAVE)
  const time = { ...TIME, modalidade: 'basquete' }
  const fetchFalso = mockFetch({ [`GET /teams/${CHAVE}`]: { status: 200, corpo: time }, ...extras })
  renderApp('/times/quadra', { cenaInicial: CENA })
  const quadra = await screen.findByRole('img', { name: 'Quadra de basquete' })
  return { quadra, fetchFalso }
}

// Desenha uma seta como o treinador: escolhe a ferramenta (se ainda não estiver ativa; clicar de novo
// desligaria), aperta na peça e solta em (x, y).
export async function desenhar(quadra: Element, ferramenta: string, peca: Element, x: number, y: number) {
  const botao = screen.getByRole('button', { name: ferramenta })
  if (botao.getAttribute('aria-pressed') !== 'true') await userEvent.click(botao)
  fireEvent.pointerDown(peca)
  fireEvent.pointerUp(quadra, { clientX: x, clientY: y })
}

export const jogador = (numero: string, time: 'A' | 'B' = 'A') =>
  screen.getAllByText(numero, { selector: 'text' }).map((t) => t.closest('g')!)[time === 'A' ? 0 : 1]
export const painel = () => within(screen.getByRole('heading', { name: 'Ações da jogada' }).closest('aside')!)
export const acoes = () => painel().queryAllByText(/ de .* para /).map((item) => item.textContent!.trim())
