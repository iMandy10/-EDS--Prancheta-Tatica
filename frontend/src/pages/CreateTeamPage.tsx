import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTeam, getTeamByChaveTreinador, type Modalidade } from '../lib/api'
import { setChaveTreinador } from '../lib/storage'
import Button from '../components/Button'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Prancheta Tática</h1>
        <p className="mt-1 text-sm text-slate-500">Monte, anime e compartilhe suas jogadas com o time</p>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Criar novo time</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-sm font-medium text-slate-700">
              Nome do time
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Ex: Furacão FC"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modalidade" className="text-sm font-medium text-slate-700">
              Modalidade
            </label>
            <select
              id="modalidade"
              value={modalidade}
              onChange={(event) => setModalidade(event.target.value as Modalidade)}
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="" disabled>
                Selecione a modalidade
              </option>
              <option value="futebol">Futebol</option>
              <option value="basquete">Basquete</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full py-2.5">
            {loading ? 'Criando...' : 'Criar time'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          ou
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleEntrarComChave} className="flex flex-col gap-2">
          <label htmlFor="chave-treinador" className="text-sm font-medium text-slate-700">
            Já tenho um time — colar minha chave de treinador
          </label>
          <div className="flex gap-2">
            <input
              id="chave-treinador"
              type="text"
              value={chaveInput}
              onChange={(event) => setChaveInput(event.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Cole sua chave aqui"
            />
            <Button type="submit" variant="outline" disabled={chaveLoading} className="shrink-0">
              {chaveLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
          {chaveError && <p className="text-sm text-red-600">{chaveError}</p>}
        </form>
      </div>
    </div>
  )
}
