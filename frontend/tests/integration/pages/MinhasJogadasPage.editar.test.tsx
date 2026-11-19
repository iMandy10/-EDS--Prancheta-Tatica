import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { setChaveTreinador } from '../../../src/lib/storage'
import { backendComJogadas } from '../../helpers/backendJogadas'
import { CHAVE, JOGADA, RESUMO } from '../../helpers/dados'
import { chamada } from '../../helpers/mockFetch'
import { renderApp } from '../../helpers/renderWithRouter'

// Integração: página, hooks, cartões, modal de edição, editor, api.ts e storage reais; só a rede é falsa.
async function abrirMinhasJogadas(extras = {}) {
  const fetchFalso = backendComJogadas([RESUMO], extras)
  setChaveTreinador(CHAVE)
  renderApp('/times/jogadas')
  const cartao = within((await screen.findByRole('heading', { name: 'Saída de bola' })).closest('li')!)
  return { fetchFalso, cartao }
}

const modal = () => within(screen.getByRole('heading', { name: 'Editar jogada' }).parentElement!)

describe('MinhasJogadasPage: editar', () => {
  it('editar abre o modal preenchido, salva e o cartão mostra o novo título', async () => {
    const { fetchFalso, cartao } = await abrirMinhasJogadas()

    await userEvent.click(cartao.getByRole('button', { name: 'Editar' }))
    expect(modal().getByLabelText('Título')).toHaveValue('Saída de bola')
    await userEvent.clear(modal().getByLabelText('Título'))
    await userEvent.type(modal().getByLabelText('Título'), 'Saída rápida')
    await userEvent.clear(modal().getByLabelText('Descrição (opcional)'))
    await userEvent.click(modal().getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('heading', { name: 'Saída rápida' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Editar jogada' })).not.toBeInTheDocument()
    // Descrição apagada vai para o servidor como "sem descrição" (null), não como texto vazio.
    const edicao = fetchFalso.mock.calls.findIndex(([, init]) => init?.method === 'PATCH')
    expect(chamada(fetchFalso, edicao).corpo).toEqual({ titulo: 'Saída rápida', descricao: null })
  })

  it('se salvar falhar, o modal continua aberto e mostra o erro', async () => {
    const { cartao } = await abrirMinhasJogadas({ 'PATCH /plays/3': { status: 500 } })

    await userEvent.click(cartao.getByRole('button', { name: 'Editar' }))
    await userEvent.click(modal().getByRole('button', { name: 'Salvar' }))

    expect(await modal().findByText('Não foi possível salvar as alterações. Tente novamente.')).toBeInTheDocument()
    expect(cartao.getByRole('heading', { name: 'Saída de bola' })).toBeInTheDocument()
  })

  it('"Cancelar" fecha o modal sem mandar nada ao servidor', async () => {
    const { fetchFalso, cartao } = await abrirMinhasJogadas()

    await userEvent.click(cartao.getByRole('button', { name: 'Editar' }))
    await userEvent.click(modal().getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('heading', { name: 'Editar jogada' })).not.toBeInTheDocument()
    expect(fetchFalso.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
  })
})

describe('MinhasJogadasPage: reabrir no editor', () => {
  it('busca a jogada completa e abre o editor com as ações dela', async () => {
    const { cartao } = await abrirMinhasJogadas({ 'GET /plays/3': { status: 200, corpo: JOGADA } })

    await userEvent.click(cartao.getByRole('button', { name: 'Reabrir no editor' }))

    const painel = within((await screen.findByRole('heading', { name: 'Ações da jogada' })).closest('aside')!)
    expect(painel.getByText(/Passe de A1/)).toBeInTheDocument()
    expect(painel.getByText(/Movimentação de A1/)).toBeInTheDocument()
  })

  it('se a jogada não carregar, fica na lista e mostra o erro', async () => {
    const { cartao } = await abrirMinhasJogadas({ 'GET /plays/3': { status: 404 } })

    await userEvent.click(cartao.getByRole('button', { name: 'Reabrir no editor' }))

    expect(await screen.findByText('Não foi possível reabrir a jogada. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Minhas jogadas' })).toBeInTheDocument()
  })
})
