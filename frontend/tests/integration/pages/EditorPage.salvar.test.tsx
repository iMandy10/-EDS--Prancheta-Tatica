import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CHAVE, JOGADA } from '../../helpers/dados'
import { CENA, abrirEditor, desenhar, jogador } from '../../helpers/editor'
import { chamada } from '../../helpers/mockFetch'

// Integração: editor, modal de salvar, api.ts e storage reais; só a rede é falsa.
async function salvarJogada(titulo: string, opcoes: { descricao?: string; publicar?: boolean } = {}) {
  await userEvent.click(screen.getByRole('button', { name: 'Salvar jogada' }))
  const modal = within(screen.getByRole('heading', { name: 'Salvar jogada' }).parentElement!)
  await userEvent.type(modal.getByLabelText('Título'), titulo)
  if (opcoes.descricao) await userEvent.type(modal.getByLabelText('Descrição (opcional)'), opcoes.descricao)
  if (opcoes.publicar) await userEvent.click(modal.getByLabelText(/Publicar para o time/))
  await userEvent.click(modal.getByRole('button', { name: 'Salvar' }))
  return modal
}

// Depois de salvar com sucesso, o modal fecha sozinho.
const modalFechou = () => expect.poll(() => screen.queryByRole('heading', { name: 'Salvar jogada' })).toBeNull()

const salvamento = (fetchFalso: Awaited<ReturnType<typeof abrirEditor>>['fetchFalso']) =>
  chamada(fetchFalso, fetchFalso.mock.calls.findIndex(([, init]) => init?.method === 'POST'))

describe('EditorPage: salvar jogada', () => {
  it('salva como rascunho a cena inteira, com as peças e a seta desenhada', async () => {
    const { quadra, fetchFalso } = await abrirEditor({ 'POST /teams/7/plays': { status: 201, corpo: JOGADA } })
    await desenhar(quadra, 'Passe', jogador('1'), 500, 250)

    await salvarJogada('Passe para a ala')

    await modalFechou()
    const { headers, corpo } = salvamento(fetchFalso)
    expect(headers['X-Chave-Treinador']).toBe(CHAVE)
    expect(corpo).toEqual({
      titulo: 'Passe para a ala',
      descricao: null,
      status: 'rascunho',
      cena: {
        ...CENA,
        acoes: [{ id: 'a1', tipo: 'passe', origem: 'A1', destino: { x: 500, y: 250 }, ordem: 1 }],
      },
    })
  })

  it('marcando "Publicar", salva já publicada e com a descrição', async () => {
    const { fetchFalso } = await abrirEditor({ 'POST /teams/7/plays': { status: 201, corpo: JOGADA } })

    await salvarJogada('Formação inicial', { descricao: 'Só o posicionamento', publicar: true })

    await modalFechou()
    expect(salvamento(fetchFalso).corpo).toMatchObject({ descricao: 'Só o posicionamento', status: 'publicada' })
  })

  it('se o servidor falhar, o modal continua aberto com o erro', async () => {
    await abrirEditor({ 'POST /teams/7/plays': { status: 500 } })

    const modal = await salvarJogada('Passe para a ala')

    expect(await modal.findByText(/Não foi possível salvar a jogada/)).toBeInTheDocument()
    expect(modal.getByLabelText('Título')).toHaveValue('Passe para a ala')
  })
})
