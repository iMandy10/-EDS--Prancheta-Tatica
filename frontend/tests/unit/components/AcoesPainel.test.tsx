import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AcoesPainel from '../../../src/components/AcoesPainel'
import type { Acao, Peca } from '../../../src/types/cena'

const pecas: Peca[] = [
  { id: 'A1', tipo: 'jogador_time_a', x: 330, y: 250 },
  { id: 'A2', tipo: 'jogador_time_a', x: 270, y: 110 },
  { id: 'B1', tipo: 'jogador_time_b', x: 470, y: 250 },
  { id: 'bola', tipo: 'bola', x: 343, y: 263, posse: 'A1' },
]

function acao(id: string, tipo: Acao['tipo'], origem: string, destino: Acao['destino'], ordem: number): Acao {
  return { id, tipo, origem, destino, ordem }
}

// Duas ordens com buraco (3 e 8): o painel numera pela posição, não pela ordem.
const passe = acao('p', 'passe', 'A1', 'A2', 3)
const corte = acao('c', 'movimentacao', 'A2', { x: 600, y: 100 }, 8)

type Props = Parameters<typeof AcoesPainel>[0]

function renderizar(props: Partial<Props> = {}) {
  const callbacks = {
    onMoverInstante: vi.fn(),
    onJuntar: vi.fn(),
    onSeparar: vi.fn(),
    onEditar: vi.fn(),
    onRemover: vi.fn(),
    onSelecionar: vi.fn(),
  }
  render(
    <AcoesPainel
      acoes={[passe, corte]}
      pecas={pecas}
      quadra="basquete"
      alvos={new Map()}
      editandoId={null}
      selecionadaId={null}
      {...callbacks}
      {...props}
    />,
  )
  return callbacks
}

describe('AcoesPainel: o que mostra', () => {
  it('avisa que não há ações e não mostra o fim da jogada', () => {
    renderizar({ acoes: [], onPonto: vi.fn() })

    expect(screen.getByText('Nenhuma ação criada ainda.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fim da jogada' })).not.toBeInTheDocument()
  })

  it('numera os instantes pela posição e descreve cada ação com as posições dos jogadores', () => {
    renderizar()

    expect(screen.getByText('Instante 1')).toBeInTheDocument()
    expect(screen.getByText('Instante 2')).toBeInTheDocument()
    expect(screen.queryByText('Instante 3')).not.toBeInTheDocument()
    expect(screen.getByText('Passe de A1 · PG para A2 · SG')).toBeInTheDocument()
  })

  it('descreve o destino livre pelo jogador identificado ou como ponto livre', () => {
    const passeLivre = acao('pl', 'passe', 'A1', { x: 470, y: 250 }, 1)
    const corteLivre = acao('cl', 'movimentacao', 'A2', { x: 600, y: 100 }, 1)

    renderizar({ acoes: [passeLivre, corteLivre], alvos: new Map([['pl', 'B1']]) })

    expect(screen.getByText('Passe de A1 · PG para B1 · PG')).toBeInTheDocument()
    expect(screen.getByText('Movimentação de A2 · SG para ponto livre')).toBeInTheDocument()
  })

  it('no futebol, descreve as peças pelas posições da formação recebida', () => {
    renderizar({ quadra: 'futebol', formacao: '4-3-3', acoes: [acao('f', 'passe', 'A9', 'A10', 1)] })

    // Na 4-4-2 o A9 seria MD; na 4-3-3 é o ponta esquerda.
    expect(screen.getByText('Passe de A9 · PE para A10 · ATA')).toBeInTheDocument()
  })

  it('marca só a ação que está sendo editada', () => {
    renderizar({ editandoId: 'c' })

    expect(screen.getAllByText('(editando)')).toHaveLength(1)
    expect(screen.getByText('Movimentação de A2 · SG para ponto livre', { exact: false })).toHaveTextContent('(editando)')
  })
})

// Bloco de um instante (pelo rótulo "Instante N") e linha de uma ação (pela descrição).
const instante = (rotulo: string) => within(screen.getByText(rotulo).closest('li')!)
const linhaDaAcao = (descricao: string) => within(screen.getByText(descricao).closest('li')!)
const DESC_PASSE = 'Passe de A1 · PG para A2 · SG'
const DESC_CORTE = 'Movimentação de A2 · SG para ponto livre'

describe('AcoesPainel: botões', () => {
  it('move instantes para cima e para baixo usando a ordem real, sem passar das pontas', async () => {
    const { onMoverInstante } = renderizar()

    expect(instante('Instante 1').getByRole('button', { name: 'Mover instante para cima' })).toBeDisabled()
    expect(instante('Instante 2').getByRole('button', { name: 'Mover instante para baixo' })).toBeDisabled()

    await userEvent.click(instante('Instante 1').getByRole('button', { name: 'Mover instante para baixo' }))
    await userEvent.click(instante('Instante 2').getByRole('button', { name: 'Mover instante para cima' }))

    expect(onMoverInstante.mock.calls).toEqual([
      [3, 1],
      [8, -1],
    ])
  })

  it('junta ao instante anterior quando a ação cabe nele, mas não no primeiro instante', async () => {
    const { onJuntar } = renderizar()

    expect(linhaDaAcao(DESC_PASSE).getByRole('button', { name: 'Juntar ao instante anterior' })).toBeDisabled()
    await userEvent.click(linhaDaAcao(DESC_CORTE).getByRole('button', { name: 'Juntar ao instante anterior' }))

    expect(onJuntar).toHaveBeenCalledWith('c')
  })

  it('não deixa juntar quando a peça já age no instante anterior e explica o motivo', () => {
    renderizar({ acoes: [passe, acao('c2', 'movimentacao', 'A1', { x: 600, y: 100 }, 8)] })

    const botao = linhaDaAcao('Movimentação de A1 · PG para ponto livre').getByRole('button', {
      name: 'Não dá para juntar: a peça ou a bola já age no instante anterior',
    })
    expect(botao).toBeDisabled()
  })

  it('num instante com duas ações, oferece separar em vez de juntar', async () => {
    const { onSeparar } = renderizar({ acoes: [passe, { ...corte, ordem: 3 }] })

    expect(screen.queryByRole('button', { name: /Juntar/ })).not.toBeInTheDocument()
    await userEvent.click(linhaDaAcao(DESC_PASSE).getByRole('button', { name: 'Separar em instante próprio' }))

    expect(onSeparar).toHaveBeenCalledWith('p')
  })

  it('edita e remove a ação sem também selecioná-la nem mudar o ponto da jogada', async () => {
    const onPonto = vi.fn()
    const { onEditar, onRemover, onSelecionar } = renderizar({ onPonto })

    await userEvent.click(linhaDaAcao(DESC_PASSE).getByRole('button', { name: 'Editar seta' }))
    await userEvent.click(linhaDaAcao(DESC_CORTE).getByRole('button', { name: 'Remover seta' }))

    expect(onEditar).toHaveBeenCalledWith('p')
    expect(onRemover).toHaveBeenCalledWith('c')
    expect(onSelecionar).not.toHaveBeenCalled()
    expect(onPonto).not.toHaveBeenCalled()
  })

  it('seleciona a ação ao clicar nela', async () => {
    const { onSelecionar } = renderizar()

    await userEvent.click(screen.getByText(DESC_CORTE))

    expect(onSelecionar).toHaveBeenCalledWith('c')
  })

  it('com pontos da jogada, escolhe o instante clicado ou o fim da jogada', async () => {
    const onPonto = vi.fn()
    renderizar({ onPonto })

    await userEvent.click(screen.getByText('Instante 2'))
    await userEvent.click(screen.getByRole('button', { name: 'Fim da jogada' }))

    expect(onPonto.mock.calls).toEqual([[1], [2]])
  })

  it('sem pontos da jogada, não mostra o fim da jogada', () => {
    renderizar()

    expect(screen.queryByRole('button', { name: 'Fim da jogada' })).not.toBeInTheDocument()
  })
})
