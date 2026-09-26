import Button from './Button'

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M7 4.5v15l12-7.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </svg>
  )
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

export default function ControlesAnimacao({
  tocando,
  desabilitado,
  onTocar,
  onPausar,
  onReiniciar,
}: {
  tocando: boolean
  desabilitado: boolean
  onTocar: () => void
  onPausar: () => void
  onReiniciar: () => void
}) {
  return (
    <div className="flex gap-2">
      <Button onClick={tocando ? onPausar : onTocar} variant="primary" disabled={desabilitado} className="w-28">
        {tocando ? <PauseIcon /> : <PlayIcon />}
        {tocando ? 'Pausar' : 'Play'}
      </Button>
      <Button onClick={onReiniciar} variant="outline" disabled={desabilitado}>
        <RestartIcon />
        Reiniciar
      </Button>
    </div>
  )
}
