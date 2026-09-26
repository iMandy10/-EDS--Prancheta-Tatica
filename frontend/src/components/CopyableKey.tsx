import { useEffect, useState } from 'react'
import Button from './Button'
import { CopyIcon } from './icons'

export default function CopyableKey({
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
