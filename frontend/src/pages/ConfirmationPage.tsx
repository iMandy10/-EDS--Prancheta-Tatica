import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { Team } from '../lib/api'
import Button from '../components/Button'
import { CopyIcon } from '../components/icons'

function CopyableKey({
  label,
  value,
  mailtoSubject,
  mailtoBody,
}: {
  label: string
  value: string
  mailtoSubject: string
  mailtoBody: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timeout)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // clipboard indisponível; o valor continua visível pra copiar manualmente
    }
  }

  const mailtoHref = `mailto:?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-800">
          {value}
        </code>
        <Button onClick={handleCopy} variant="primary" className="shrink-0">
          <CopyIcon className="h-4 w-4" />
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
        <a
          href={mailtoHref}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Enviar por e-mail
        </a>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const team = (location.state as { team?: Team } | null)?.team

  if (!team) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card ring-1 ring-slate-900/5">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Time criado com sucesso
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{team.nome}</h1>
          <p className="mt-1 text-sm text-slate-500">{team.modalidade === 'futebol' ? 'Futebol' : 'Basquete'}</p>
        </div>

        <div className="my-6 flex flex-col gap-5">
          <CopyableKey
            label="Sua chave de treinador (guarde com você)"
            value={team.chave_treinador}
            mailtoSubject={`Minha chave de treinador - ${team.nome}`}
            mailtoBody={`Minha chave de treinador no Prancheta Tática é: ${team.chave_treinador}`}
          />
          <CopyableKey
            label="Chave do atleta (compartilhe com o time)"
            value={team.chave_atleta}
            mailtoSubject={`Chave de acesso do time ${team.nome} - Prancheta Tática`}
            mailtoBody={`Use esta chave para acessar as jogadas do time ${team.nome} no Prancheta Tática: ${team.chave_atleta}`}
          />
        </div>

        <Button onClick={() => navigate('/times/quadra')} variant="primary" className="w-full py-2.5">
          Continuar para o editor
        </Button>
      </div>
    </div>
  )
}
