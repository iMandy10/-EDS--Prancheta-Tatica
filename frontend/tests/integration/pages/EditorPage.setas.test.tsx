import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { abrirEditor, acoes, desenhar, jogador, painel } from '../../helpers/editor'

// Integração: editor, estojo, painel de ações, motor da jogada e SVG reais; só a rede é falsa.
// A cena (A1 com a bola, A2 e B1, sem setas) está em tests/helpers/editor.ts.
describe('EditorPage: desenhar setas', () => {
  it('movimentação até um ponto livre vira o instante 1 no painel', async () => {
    const { quadra } = await abrirEditor()

    await desenhar(quadra, 'Movimentação', jogador('1'), 300, 100)

    expect(painel().getByText('Instante 1')).toBeInTheDocument()
    expect(acoes()).toEqual(['Movimentação de A1 · PG para ponto livre'])
  })

  it('o passe de quem tem a bola, solto em cima de um colega, vai para ele', async () => {
    const { quadra } = await abrirEditor()

    await desenhar(quadra, 'Passe', jogador('1'), 500, 250)

    expect(acoes()).toEqual(['Passe de A1 · PG para A2 · SG'])
  })

  it('apertar na bola para passar faz a seta sair de quem está com ela', async () => {
    const { quadra } = await abrirEditor()
    const bola = [...quadra.querySelectorAll('g[transform^="translate"]')].find((g) => !g.querySelector('text'))!

    await desenhar(quadra, 'Passe', bola, 500, 250)

    expect(acoes()).toEqual(['Passe de A1 · PG para A2 · SG'])
  })

  it('quem não está com a bola não pode passar nem driblar', async () => {
    const { quadra } = await abrirEditor()

    await desenhar(quadra, 'Drible', jogador('2'), 300, 100)

    expect(screen.getByText('Só quem está com a bola pode passar ou driblar.')).toBeInTheDocument()
    expect(painel().getByText('Nenhuma ação criada ainda.')).toBeInTheDocument()
  })

  it('soltar a seta na própria peça ou fora da quadra não cria nada', async () => {
    const { quadra } = await abrirEditor()

    await desenhar(quadra, 'Bloqueio', jogador('1', 'B'), 602, 98)
    fireEvent.pointerDown(jogador('1', 'B'))
    fireEvent.pointerUp(quadra, { clientX: 900, clientY: 100 })

    expect(painel().getByText('Nenhuma ação criada ainda.')).toBeInTheDocument()
  })

  it('Esc sai do modo de desenho', async () => {
    await abrirEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Bloqueio' }))
    expect(screen.getByText(/Arraste de uma peça até outra peça/)).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByText(/Arraste de uma peça até outra peça/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bloqueio' })).toHaveAttribute('aria-pressed', 'false')
  })
})
