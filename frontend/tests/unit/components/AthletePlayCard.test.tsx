import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AthletePlayCard from '../../../src/components/AthletePlayCard'
import type { PlaySummary } from '../../../src/lib/api'

const jogada: PlaySummary = {
  id: 3,
  team_id: 7,
  titulo: 'Pick and roll',
  descricao: 'Bloqueio do pivô para o armador',
  status: 'publicada',
  created_at: '2026-11-18T10:00:00',
  updated_at: '2026-11-18T10:00:00',
}

describe('AthletePlayCard', () => {
  it('mostra título e descrição e abre a jogada ao clicar', async () => {
    const onAbrir = vi.fn()
    render(<AthletePlayCard jogada={jogada} onAbrir={onAbrir} />)

    expect(screen.getByRole('heading', { name: 'Pick and roll' })).toBeInTheDocument()
    expect(screen.getByText('Bloqueio do pivô para o armador')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Pick and roll/ }))
    expect(onAbrir).toHaveBeenCalledTimes(1)
  })

  it('sem descrição, mostra só o título', () => {
    render(<AthletePlayCard jogada={{ ...jogada, descricao: null }} onAbrir={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveTextContent(/^Pick and roll$/)
  })
})
