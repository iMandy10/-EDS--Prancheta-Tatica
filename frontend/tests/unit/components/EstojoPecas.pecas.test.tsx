import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import EstojoPecas from '../../../src/components/EstojoPecas'
import { TIPO_ARRASTE_PECA } from '../../../src/lib/dinamica'

function renderEstojo(props: Partial<ComponentProps<typeof EstojoPecas>> = {}) {
  const callbacks = { onFormacao: vi.fn(), onAlternar: vi.fn(), onFerramenta: vi.fn() }
  render(
    <EstojoPecas
      quadra="futebol"
      formacao="4-4-2"
      pecas={[]}
      ferramenta={null}
      ferramentasBloqueadas={false}
      pecasBloqueadas={false}
      {...callbacks}
      {...props}
    />,
  )
  return callbacks
}

// Botões de um grupo do estojo ("Time A", "Time B" ou "Bola"), na ordem em que aparecem.
const botoesDo = (grupo: string) =>
  within(screen.getByText(grupo, { selector: 'span' }).parentElement!).getAllByRole('button')
const textos = (botoes: HTMLElement[]) => botoes.map((botao) => botao.textContent)

describe('EstojoPecas: peças', () => {
  it('no futebol, mostra 11 jogadores por time com as siglas da formação, e a bola', () => {
    renderEstojo()

    const siglas442 = ['1GOL', '2LE', '3ZAG', '4ZAG', '5LD', '6ME', '7VOL', '8VOL', '9MD', '10ATA', '11ATA']
    expect(textos(botoesDo('Time A'))).toEqual(siglas442)
    expect(textos(botoesDo('Time B'))).toEqual(siglas442)
    expect(botoesDo('Bola')).toHaveLength(1)
  })

  it('no basquete, mostra 5 jogadores por time com as siglas do basquete e sem seletor de formação', () => {
    renderEstojo({ quadra: 'basquete', formacao: undefined, onFormacao: undefined })

    expect(textos(botoesDo('Time A'))).toEqual(['1PG', '2SG', '3SF', '4PF', '5C'])
    expect(botoesDo('Time B')).toHaveLength(5)
    expect(screen.queryByLabelText('Formação')).not.toBeInTheDocument()
  })

  it('avisa a formação escolhida no seletor', async () => {
    const { onFormacao } = renderEstojo()

    await userEvent.selectOptions(screen.getByLabelText('Formação'), '4-3-3')

    expect(onFormacao).toHaveBeenCalledWith('4-3-3')
  })

  it('avisa qual peça foi clicada e de que tipo ela é', async () => {
    const { onAlternar } = renderEstojo()

    await userEvent.click(botoesDo('Time A')[2])
    await userEvent.click(botoesDo('Time B')[0])
    await userEvent.click(botoesDo('Bola')[0])

    expect(onAlternar.mock.calls).toEqual([
      ['A3', 'jogador_time_a'],
      ['B1', 'jogador_time_b'],
      ['bola', 'bola'],
    ])
  })

  it('peça que já está em quadra oferece voltar ao estojo e não pode ser arrastada', () => {
    renderEstojo({ pecas: [{ id: 'A1', tipo: 'jogador_time_a', x: 45, y: 250 }] })
    const [emQuadra, noEstojo] = botoesDo('Time A')

    expect(emQuadra).toHaveAccessibleDescription('Em quadra: clique para devolver ao estojo')
    expect(emQuadra).toHaveAttribute('draggable', 'false')
    expect(noEstojo).toHaveAccessibleDescription('Arraste para a quadra ou clique para colocar')
    expect(noEstojo).toHaveAttribute('draggable', 'true')
  })

  it('ao começar a arrastar, leva o id e o tipo da peça para a quadra ler', () => {
    renderEstojo()
    const dados = new Map<string, string>()

    fireEvent.dragStart(botoesDo('Time B')[1], { dataTransfer: { setData: (t: string, v: string) => dados.set(t, v) } })

    expect(JSON.parse(dados.get(TIPO_ARRASTE_PECA)!)).toEqual({ id: 'B2', tipo: 'jogador_time_b' })
  })

  it('com as peças bloqueadas, desativa todas as peças mas não as ferramentas', () => {
    renderEstojo({ pecasBloqueadas: true })

    for (const botao of [...botoesDo('Time A'), ...botoesDo('Time B'), ...botoesDo('Bola')]) {
      expect(botao).toBeDisabled()
    }
    expect(screen.getByRole('button', { name: 'Movimentação' })).toBeEnabled()
  })
})
