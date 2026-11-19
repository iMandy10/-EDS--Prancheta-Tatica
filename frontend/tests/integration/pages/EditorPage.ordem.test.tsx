import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { abrirEditor, acoes, desenhar, jogador, painel } from '../../helpers/editor'

// Integração: editor, painel de ações, regras de instantes e SVG reais; só a rede é falsa.
// Duas setas em instantes separados: 1) A2 corre até (300, 100); 2) B1 bloqueia em (700, 400).
const CORRIDA = 'Movimentação de A2 · SG para ponto livre'
const BLOQUEIO = 'Bloqueio de B1 · PG para ponto livre'

async function editorComDuasSetas() {
  const { quadra } = await abrirEditor()
  await desenhar(quadra, 'Movimentação', jogador('2'), 300, 100)
  await desenhar(quadra, 'Bloqueio', jogador('1', 'B'), 700, 400)
  return quadra
}

// Área de clique de cada seta na quadra (uma linha invisível por cima dela), na ordem das ações.
const setasNaQuadra = (quadra: Element) => quadra.querySelectorAll('line[stroke="transparent"]')
const instantes = () => painel().queryAllByText(/^Instante \d$/).length

describe('EditorPage: ordem das setas', () => {
  it('cada seta nova entra num instante novo, depois dos que já existem', async () => {
    await editorComDuasSetas()

    expect(instantes()).toBe(2)
    expect(acoes()).toEqual([CORRIDA, BLOQUEIO])
  })

  it('"Mover instante para baixo" troca a ordem dos instantes', async () => {
    await editorComDuasSetas()

    await userEvent.click(painel().getAllByRole('button', { name: 'Mover instante para baixo' })[0])

    expect(acoes()).toEqual([BLOQUEIO, CORRIDA])
  })

  it('juntar ao instante anterior faz as duas acontecerem juntas; separar desfaz', async () => {
    await editorComDuasSetas()

    // O instante 1 também tem o botão, mas desabilitado (não há instante antes dele).
    await userEvent.click(painel().getAllByRole('button', { name: 'Juntar ao instante anterior' })[1])
    expect(instantes()).toBe(1)

    await userEvent.click(painel().getAllByRole('button', { name: 'Separar em instante próprio' })[1])
    expect(instantes()).toBe(2)
    expect(acoes()).toEqual([CORRIDA, BLOQUEIO])
  })

  it('duas setas da mesma peça não podem ficar no mesmo instante', async () => {
    const { quadra } = await abrirEditor()
    await desenhar(quadra, 'Movimentação', jogador('2'), 300, 100)
    await desenhar(quadra, 'Movimentação', jogador('2'), 400, 400)

    const juntar = painel().getByRole('button', { name: /Não dá para juntar/ })

    expect(juntar).toBeDisabled()
    expect(instantes()).toBe(2)
  })
})

describe('EditorPage: apagar setas', () => {
  it('"Remover seta" no painel apaga a seta e renumera os instantes', async () => {
    await editorComDuasSetas()

    await userEvent.click(painel().getAllByRole('button', { name: 'Remover seta' })[0])

    expect(acoes()).toEqual([BLOQUEIO])
    expect(painel().getByText('Instante 1')).toBeInTheDocument()
  })

  it('com uma seta selecionada na quadra, Delete apaga só ela', async () => {
    const quadra = await editorComDuasSetas()

    fireEvent.pointerDown(setasNaQuadra(quadra)[1])
    await userEvent.keyboard('{Delete}')

    expect(acoes()).toEqual([CORRIDA])
  })

  it('com uma seta selecionada, o botão "Remover" do topo apaga ela', async () => {
    const quadra = await editorComDuasSetas()
    const remover = screen.getByRole('button', { name: 'Remover' })
    expect(remover).toBeDisabled()

    fireEvent.pointerDown(setasNaQuadra(quadra)[0])
    await userEvent.click(remover)

    expect(acoes()).toEqual([BLOQUEIO])
  })
})
