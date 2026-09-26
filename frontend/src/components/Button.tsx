import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'movimento' | 'passe'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-card',
  secondary: 'bg-slate-800 text-white hover:bg-slate-900 shadow-card',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  movimento: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-card',
  passe: 'bg-violet-600 text-white hover:bg-violet-700 shadow-card',
}

export default function Button({
  variant = 'outline',
  active = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; active?: boolean }) {
  return (
    <button
      type={props.type ?? 'button'}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? 'ring-2 ring-offset-1 ring-slate-400' : ''
      } ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
