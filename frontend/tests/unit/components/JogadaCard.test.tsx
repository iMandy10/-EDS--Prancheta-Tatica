import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import JogadaCard from '../../../src/components/JogadaCard'
import type { PlaySummary } from '../../../src/lib/api'
import { RESUMO } from '../../helpers/dados'

// Unidade: o cartão sozinho; as ações que ele dispara viram callbacks falsos.
function mostrar(jogada: PlaySummary = RESUMO) {
  const callbacks = { onEditar: vi.fn(), onAlternarStatus: vi.fn(), onExcluir: vi.fn(), onReabrir: vi.fn() }
  render(<ul><JogadaCard jogada={jogada} {...callbacks} /></ul>)
  return callbacks
}

describe('JogadaCard', () => {
  it('mostra o título, a descrição e o status da jogada', () => {
    mostrar()

    expect(screen.getByRole('heading', { name: 'Saída de bola' })).toBeInTheDocument()
    expect(screen.getByText('Pelo lado esquerdo')).toBeInTheDocument()
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })

  it('jogada sem descrição mostra só o título', () => {
    mostrar({ ...RESUMO, descricao: null })

    expect(screen.getByRole('listitem').querySelectorAll('p')).toHaveLength(0)
  })

  it('rascunho oferece "Publicar"; publicada oferece "Despublicar"', () => {
    mostrar()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Despublicar' })).not.toBeInTheDocument()

    mostrar({ ...RESUMO, id: 4, status: 'publicada' })
    expect(screen.getByText('Publicada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Despublicar' })).toBeInTheDocument()
  })

  it.each([
    ['Reabrir no editor', 'onReabrir'],
    ['Editar', 'onEditar'],
    ['Publicar', 'onAlternarStatus'],
    ['Excluir', 'onExcluir'],
  ] as const)('"%s" avisa só a ação %s, com esta jogada', async (botao, acao) => {
    const callbacks = mostrar()

    await userEvent.click(screen.getByRole('button', { name: botao }))

    expect(callbacks[acao]).toHaveBeenCalledExactlyOnceWith(RESUMO)
    const outras = Object.entries(callbacks).filter(([nome]) => nome !== acao)
    for (const [, callback] of outras) expect(callback).not.toHaveBeenCalled()
  })
})
