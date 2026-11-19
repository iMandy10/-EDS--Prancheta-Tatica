import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EditarJogadaModal from '../../../src/components/EditarJogadaModal'
import { RESUMO } from '../../helpers/dados'

// Unidade: o modal sozinho; quem usa o modal (Minhas jogadas) vira callbacks falsos.
function abrir(props: Partial<Parameters<typeof EditarJogadaModal>[0]> = {}) {
  const onSalvar = vi.fn()
  const onFechar = vi.fn()
  const tela = render(
    <EditarJogadaModal jogada={RESUMO} salvando={false} erro={null} onFechar={onFechar} onSalvar={onSalvar} {...props} />,
  )
  return { onSalvar, onFechar, ...tela }
}

const campoTitulo = () => screen.getByLabelText('Título')
const campoDescricao = () => screen.getByLabelText('Descrição (opcional)')

describe('EditarJogadaModal', () => {
  it('sem jogada para editar, não mostra nada', () => {
    const { container } = abrir({ jogada: null })

    expect(container).toBeEmptyDOMElement()
  })

  it('abre já preenchido com o título e a descrição da jogada', () => {
    abrir()

    expect(campoTitulo()).toHaveValue('Saída de bola')
    expect(campoDescricao()).toHaveValue('Pelo lado esquerdo')
  })

  it('jogada sem descrição abre com a descrição vazia', () => {
    abrir({ jogada: { ...RESUMO, descricao: null } })

    expect(campoDescricao()).toHaveValue('')
  })

  it('salva o que foi editado, sem espaços nas pontas', async () => {
    const { onSalvar } = abrir()

    await userEvent.clear(campoTitulo())
    await userEvent.type(campoTitulo(), ' Saída curta ')
    await userEvent.clear(campoDescricao())
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSalvar).toHaveBeenCalledWith({ titulo: 'Saída curta', descricao: '' })
  })

  it('com o título apagado, não deixa salvar', async () => {
    const { onSalvar, container } = abrir()

    await userEvent.clear(campoTitulo())
    fireEvent.submit(container.querySelector('form')!)

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    expect(onSalvar).not.toHaveBeenCalled()
  })

  it('trocar a jogada recarrega os campos com os dados da nova', () => {
    const { rerender, onSalvar, onFechar } = abrir()

    const outra = { ...RESUMO, id: 4, titulo: 'Escanteio', descricao: 'Fechado' }
    rerender(<EditarJogadaModal jogada={outra} salvando={false} erro={null} onFechar={onFechar} onSalvar={onSalvar} />)

    expect(campoTitulo()).toHaveValue('Escanteio')
    expect(campoDescricao()).toHaveValue('Fechado')
  })

  it('enquanto salva, trava os botões; mostra o erro; "Cancelar" fecha', async () => {
    const { onFechar, rerender, onSalvar } = abrir({ erro: 'Não foi possível atualizar a jogada.' })
    expect(screen.getByText('Não foi possível atualizar a jogada.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onFechar).toHaveBeenCalledOnce()

    rerender(<EditarJogadaModal jogada={RESUMO} salvando erro={null} onFechar={onFechar} onSalvar={onSalvar} />)
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
