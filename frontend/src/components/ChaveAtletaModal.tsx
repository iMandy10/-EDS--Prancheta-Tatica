import Button from './Button'
import CopyableKey from './CopyableKey'

export default function ChaveAtletaModal({
  aberto,
  nomeTime,
  chaveAtleta,
  onFechar,
}: {
  aberto: boolean
  nomeTime: string
  chaveAtleta: string
  onFechar: () => void
}) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Chave do atleta</h2>
        <p className="mb-5 text-sm text-slate-500">
          Compartilhe com o time a qualquer momento para que ele acesse as jogadas publicadas.
        </p>
        <CopyableKey
          label="Chave do time"
          value={chaveAtleta}
          mailtoSubject={`Chave de acesso do time ${nomeTime} - Prancheta Tática`}
          mailtoBody={`Use esta chave para acessar as jogadas do time ${nomeTime} no Prancheta Tática: ${chaveAtleta}`}
        />
        <Button onClick={onFechar} variant="outline" className="mt-5 w-full">
          Fechar
        </Button>
      </div>
    </div>
  )
}
