import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PlaySummary } from '../../../src/lib/api'
import { setChaveTreinador } from '../../../src/lib/storage'
import { backendComJogadas } from '../../helpers/backendJogadas'
import { CHAVE, RESUMO } from '../../helpers/dados'
import { renderApp } from '../../helpers/renderWithRouter'

// Integração: página, hooks, cartões, modal, api.ts e storage reais; só a rede é falsa.

const ESCANTEIO: PlaySummary = { ...RESUMO, id: 4, titulo: 'Escanteio', descricao: null, status: 'publicada' }

function abrirMinhasJogadas() {
  setChaveTreinador(CHAVE)
  renderApp('/times/jogadas')
}

const cartao = async (titulo: string) => (await screen.findByRole('heading', { name: titulo })).closest('li')!

describe('MinhasJogadasPage: lista', () => {
  it('mostra as jogadas do time, cada uma com o seu status', async () => {
    backendComJogadas([RESUMO, ESCANTEIO])
    abrirMinhasJogadas()

    expect(within(await cartao('Saída de bola')).getByText('Rascunho')).toBeInTheDocument()
    expect(within(await cartao('Escanteio')).getByText('Publicada')).toBeInTheDocument()
    expect(screen.getByText('Furacão FC')).toBeInTheDocument()
  })

  it('sem jogadas salvas, explica como criar a primeira', async () => {
    backendComJogadas([])
    abrirMinhasJogadas()

    expect(await screen.findByText('Nenhuma jogada salva ainda.')).toBeInTheDocument()
  })

  it('se a lista não carregar, mostra o erro', async () => {
    backendComJogadas([], { 'GET /teams/7/plays': { status: 500 } })
    abrirMinhasJogadas()

    expect(await screen.findByText('Não foi possível carregar as jogadas.')).toBeInTheDocument()
  })

  it('sem sessão de treinador, volta para a tela inicial', () => {
    backendComJogadas([])
    renderApp('/times/jogadas')

    expect(screen.getByRole('heading', { name: 'Criar novo time' })).toBeInTheDocument()
  })
})

describe('MinhasJogadasPage: publicar e excluir', () => {
  it('publicar um rascunho, e depois despublicar, atualiza o cartão', async () => {
    backendComJogadas([RESUMO])
    abrirMinhasJogadas()
    const saida = await cartao('Saída de bola')

    await userEvent.click(within(saida).getByRole('button', { name: 'Publicar' }))
    expect(await within(saida).findByText('Publicada')).toBeInTheDocument()

    await userEvent.click(within(saida).getByRole('button', { name: 'Despublicar' }))
    expect(await within(saida).findByText('Rascunho')).toBeInTheDocument()
  })

  it('excluir pede confirmação e, confirmado, tira só aquela jogada da lista', async () => {
    backendComJogadas([RESUMO, ESCANTEIO])
    abrirMinhasJogadas()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const excluir = within(await cartao('Escanteio')).getByRole('button', { name: 'Excluir' })

    await userEvent.click(excluir)
    expect(screen.getByRole('heading', { name: 'Escanteio' })).toBeInTheDocument()

    await userEvent.click(excluir)
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: 'Escanteio' })).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Saída de bola' })).toBeInTheDocument()
  })

  it('"Voltar ao editor" abre o editor', async () => {
    backendComJogadas([])
    abrirMinhasJogadas()

    await userEvent.click(await screen.findByRole('button', { name: 'Voltar ao editor' }))

    expect(await screen.findByText('Editor de jogadas')).toBeInTheDocument()
  })
})
