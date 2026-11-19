import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SalvarJogadaModal from '../../../src/components/SalvarJogadaModal'

// Unidade: o modal sozinho; quem usa o modal (o editor) vira callbacks falsos.
function abrir(props: Partial<Parameters<typeof SalvarJogadaModal>[0]> = {}) {
  const onSalvar = vi.fn()
  const onFechar = vi.fn()
  const tela = render(
    <SalvarJogadaModal aberto salvando={false} erro={null} onFechar={onFechar} onSalvar={onSalvar} {...props} />,
  )
  return { onSalvar, onFechar, ...tela }
}

const botaoSalvar = () => screen.getByRole('button', { name: 'Salvar' })

describe('SalvarJogadaModal', () => {
  it('fechado, não mostra nada', () => {
    const { container } = abrir({ aberto: false })

    expect(container).toBeEmptyDOMElement()
  })

  it('salva como rascunho, com título e descrição sem espaços nas pontas', async () => {
    const { onSalvar } = abrir()

    await userEvent.type(screen.getByLabelText('Título'), '  Contra-ataque  ')
    await userEvent.type(screen.getByLabelText('Descrição (opcional)'), ' pela direita ')
    await userEvent.click(botaoSalvar())

    expect(onSalvar).toHaveBeenCalledWith({ titulo: 'Contra-ataque', descricao: 'pela direita', status: 'rascunho' })
  })

  it('com "Publicar para o time" marcado, salva já publicada', async () => {
    const { onSalvar } = abrir()

    await userEvent.type(screen.getByLabelText('Título'), 'Escanteio')
    await userEvent.click(screen.getByLabelText(/Publicar para o time/))
    await userEvent.click(botaoSalvar())

    expect(onSalvar).toHaveBeenCalledWith({ titulo: 'Escanteio', descricao: '', status: 'publicada' })
  })

  it('sem título (ou só com espaços), não deixa salvar', async () => {
    const { onSalvar, container } = abrir()
    expect(botaoSalvar()).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Título'), '   ')
    expect(botaoSalvar()).toBeDisabled()
    fireEvent.submit(container.querySelector('form')!)

    expect(onSalvar).not.toHaveBeenCalled()
  })

  it('enquanto salva, mostra "Salvando..." e trava os botões', () => {
    abrir({ salvando: true })

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('mostra o erro recebido e "Cancelar" fecha o modal', async () => {
    const { onFechar } = abrir({ erro: 'Não foi possível salvar a jogada.' })

    expect(screen.getByText('Não foi possível salvar a jogada.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onFechar).toHaveBeenCalledOnce()
  })

  it('ao abrir de novo, o formulário vem limpo', async () => {
    const { rerender, onSalvar, onFechar } = abrir()
    await userEvent.type(screen.getByLabelText('Título'), 'Antiga')
    await userEvent.click(screen.getByLabelText(/Publicar para o time/))

    const props = { salvando: false, erro: null, onSalvar, onFechar }
    rerender(<SalvarJogadaModal aberto={false} {...props} />)
    rerender(<SalvarJogadaModal aberto {...props} />)

    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText(/Publicar para o time/)).not.toBeChecked()
  })
})
