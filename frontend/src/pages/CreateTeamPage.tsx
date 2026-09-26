import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTeam, getTeamByChaveTreinador, type Modalidade } from '../lib/api'
import { setChaveTreinador } from '../lib/storage'

export default function CreateTeamPage() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [modalidade, setModalidade] = useState<Modalidade | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [chaveInput, setChaveInput] = useState('')
  const [chaveError, setChaveError] = useState<string | null>(null)
  const [chaveLoading, setChaveLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const nomeTrimmed = nome.trim()
    if (!nomeTrimmed) {
      setError('Informe o nome do time.')
      return
    }
    if (!modalidade) {
      setError('Selecione a modalidade.')
      return
    }

    setLoading(true)
    try {
      const team = await createTeam(nomeTrimmed, modalidade)
      setChaveTreinador(team.chave_treinador)
      navigate('/times/confirmacao', { state: { team } })
    } catch {
      setError('Não foi possível criar o time. Verifique se o servidor está rodando e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEntrarComChave(event: FormEvent) {
    event.preventDefault()
    setChaveError(null)

    const chave = chaveInput.trim()
    if (!chave) {
      setChaveError('Cole sua chave de treinador.')
      return
    }

    setChaveLoading(true)
    try {
      await getTeamByChaveTreinador(chave)
      setChaveTreinador(chave)
      navigate('/times/bem-vindo')
    } catch {
      setChaveError('Chave inválida. Confira e tente novamente.')
    } finally {
      setChaveLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Criar novo time</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="text-sm font-medium text-gray-700">
            Nome do time
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Ex: Furacão FC"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="modalidade" className="text-sm font-medium text-gray-700">
            Modalidade
          </label>
          <select
            id="modalidade"
            value={modalidade}
            onChange={(event) => setModalidade(event.target.value as Modalidade)}
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Selecione a modalidade
            </option>
            <option value="futebol">Futebol</option>
            <option value="basquete">Basquete</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Criando...' : 'Criar time'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        ou
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleEntrarComChave} className="flex flex-col gap-2">
        <label htmlFor="chave-treinador" className="text-sm font-medium text-gray-700">
          Já tenho um time — colar minha chave de treinador
        </label>
        <div className="flex gap-2">
          <input
            id="chave-treinador"
            type="text"
            value={chaveInput}
            onChange={(event) => setChaveInput(event.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Cole sua chave aqui"
          />
          <button
            type="submit"
            disabled={chaveLoading}
            className="shrink-0 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {chaveLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
        {chaveError && <p className="text-sm text-red-600">{chaveError}</p>}
      </form>
    </div>
  )
}
