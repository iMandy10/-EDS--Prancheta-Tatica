import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTeam, type Modalidade } from '../lib/api'

export default function CreateTeamPage() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [modalidade, setModalidade] = useState<Modalidade | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      navigate('/times/confirmacao', { state: { team } })
    } catch {
      setError('Não foi possível criar o time. Verifique se o servidor está rodando e tente novamente.')
    } finally {
      setLoading(false)
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
    </div>
  )
}
