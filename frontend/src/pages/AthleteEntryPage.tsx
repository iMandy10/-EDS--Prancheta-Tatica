import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChaveInvalidaError, getTeamByChaveAtleta } from '../lib/athleteApi'
import { clearChaveAtleta, getChaveAtleta, setChaveAtleta } from '../lib/athleteStorage'
import Button from '../components/Button'

const ERRO_SERVIDOR = 'Não foi possível validar a chave. Verifique se o servidor está rodando e tente novamente.'

export default function AthleteEntryPage() {
  const navigate = useNavigate()
  const [chaveInput, setChaveInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(() => getChaveAtleta() !== null)

  useEffect(() => {
    const chaveSalva = getChaveAtleta()
    if (!chaveSalva) return

    let active = true
    getTeamByChaveAtleta(chaveSalva)
      .then((team) => {
        if (active) navigate('/atleta/jogadas', { replace: true, state: { team, chave: chaveSalva } })
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ChaveInvalidaError) {
          clearChaveAtleta()
        } else {
          setChaveInput(chaveSalva)
          setError(ERRO_SERVIDOR)
        }
        setChecking(false)
      })
    return () => {
      active = false
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const chave = chaveInput.trim()
    if (!chave) {
      setError('Cole a chave do seu time.')
      return
    }

    setLoading(true)
    try {
      const team = await getTeamByChaveAtleta(chave)
      setChaveAtleta(chave)
      navigate('/atleta/jogadas', { state: { team, chave } })
    } catch (err) {
      setError(
        err instanceof ChaveInvalidaError
          ? 'Chave inválida. Confira com seu treinador e tente novamente.'
          : ERRO_SERVIDOR,
      )
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Prancheta Tática</h1>
        <p className="mt-1 text-sm text-slate-500">Veja as jogadas publicadas pelo seu treinador</p>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Entrar como atleta</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="chave-atleta" className="text-sm font-medium text-slate-700">
            Chave do time
          </label>
          <input
            id="chave-atleta"
            type="text"
            value={chaveInput}
            onChange={(event) => setChaveInput(event.target.value)}
            className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Cole aqui a chave enviada pelo treinador"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primary" disabled={loading} className="mt-4 w-full py-2.5">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
