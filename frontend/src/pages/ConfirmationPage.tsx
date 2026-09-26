import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { Team } from '../lib/api'

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
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <a
          href={mailtoHref}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Time criado!</h1>
        <p className="mt-1 text-gray-600">
          {team.nome} · {team.modalidade === 'futebol' ? 'Futebol' : 'Basquete'}
        </p>
      </div>

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

      <button
        type="button"
        onClick={() => navigate('/times/quadra')}
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Continuar para o editor
      </button>
    </div>
  )
}
