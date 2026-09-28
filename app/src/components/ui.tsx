import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import type { PagerInfo } from '../lib/format'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('bg-sura-blanco border border-sura-azul-divider rounded-2xl p-[clamp(14px,2.6vw,20px)]', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-sm font-bold uppercase tracking-wide text-sura-azul-prof mb-3.5', className)}>{children}</div>
}

const BTN_BASE = 'inline-flex items-center justify-center gap-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
const BTN_VARIANTS = {
  cta: 'bg-sura-amarillo text-sura-azul-oscuro hover:bg-sura-amarillo-hover disabled:hover:bg-sura-amarillo',
  primary: 'bg-sura-azul-cielo text-sura-blanco hover:bg-sura-azul-cielo-hover',
  outline: 'bg-sura-blanco text-gris-500 border border-gris-300 hover:border-sura-azul-cielo hover:text-sura-azul-cielo',
  outlineProf: 'bg-sura-blanco text-sura-azul-prof border border-sura-azul-prof hover:bg-sura-azul-tint',
  outlineCielo: 'bg-sura-blanco text-sura-azul-cielo border border-sura-azul-cielo hover:bg-sura-azul-tint',
  danger: 'bg-danger-1 text-sura-blanco',
  dangerOutline: 'bg-sura-blanco text-danger-1 border border-danger-border hover:bg-danger-2',
  dark: 'bg-transparent text-sura-blanco border border-sura-blanco',
} as const
const BTN_SIZES = { md: 'text-sm px-[22px] py-[11px]', sm: 'text-[13px] px-3.5 py-1.5' } as const

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BTN_VARIANTS
  size?: keyof typeof BTN_SIZES
}

export function Btn({ variant = 'outline', size = 'md', className, ...props }: BtnProps) {
  return <button type="button" className={cx(BTN_BASE, BTN_VARIANTS[variant], BTN_SIZES[size], className)} {...props} />
}

export function Pill({ active, tone = 'cielo', small, className, ...props }: {
  active?: boolean
  tone?: 'cielo' | 'prof' | 'success'
  small?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const activeTone = {
    cielo: 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco',
    prof: 'border-sura-azul-prof bg-sura-azul-prof text-sura-blanco',
    success: 'border-success-1 bg-success-1 text-sura-blanco',
  }[tone]
  return (
    <button
      type="button"
      className={cx(
        'rounded-full font-bold whitespace-nowrap transition-colors border cursor-pointer',
        small ? 'text-xs px-3 py-1.5' : 'text-[13px] px-4 py-2',
        active ? activeTone : 'border-gris-300 bg-sura-blanco text-gris-500',
        className
      )}
      {...props}
    />
  )
}

const BADGE_TONE = {
  success: 'text-success-1 bg-success-2 border-success-border',
  warning: 'text-warning-1 bg-warning-2 border-warning-border',
  danger: 'text-danger-1 bg-danger-2 border-danger-border',
  neutral: 'text-gris-500 bg-gris-100 border-gris-200',
  info: 'text-sura-azul-prof bg-sura-azul-soft border-sura-azul-chip',
} as const

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE_TONE; children: ReactNode }) {
  return <span className={cx('inline-block px-3 py-1 rounded-full text-xs font-bold border', BADGE_TONE[tone])}>{children}</span>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        'border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none w-full bg-sura-blanco focus:border-b-sura-azul-cielo',
        props.className
      )}
    />
  )
}

export function RoundBtn({ variant = 'sub', size = 'md', className, ...props }: {
  variant?: 'sub' | 'add'
  size?: 'sm' | 'md' | 'lg' | 'xl'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { sm: 'w-6 h-6 text-sm', md: 'w-7 h-7 text-base', lg: 'w-9 h-9 text-lg', xl: 'w-10 h-10 text-xl' } as const
  const variants = {
    sub: 'border border-gris-300 bg-sura-blanco',
    add: 'border-none bg-sura-azul-cielo text-sura-blanco',
  } as const
  return (
    <button
      type="button"
      className={cx('rounded-full font-bold leading-none cursor-pointer inline-flex items-center justify-center', sizes[size], variants[variant], className)}
      {...props}
    />
  )
}

export function KvRow({ k, dots = true, children }: { k: ReactNode; dots?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 py-2 border-b border-gris-100 text-sm">
      <span className="text-gris-500">{k}</span>
      {dots && <span className="flex-1 border-b border-dotted border-gris-300 -translate-y-0.5" />}
      <span className="font-bold tabular-nums">{children}</span>
    </div>
  )
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="text-[13px] text-gris-350 py-4">{children}</div>
}

export function Pager({ info, onGo }: { info: PagerInfo; onGo: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5 items-center justify-between pt-3.5 mt-1 border-t border-sura-azul-divider">
      <div className="text-[13px] text-gris-500">{info.texto}</div>
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          type="button" disabled={!info.hayPrev} onClick={() => onGo(Math.max(1, info.pagina - 1))}
          className="min-w-[34px] rounded-full px-3 py-1.5 text-[13px] font-bold border border-gris-300 bg-sura-blanco text-gris-500 disabled:text-gris-300 disabled:cursor-not-allowed cursor-pointer"
        >Anterior</button>
        {info.paginas.map((n, idx) => (
          <button
            key={idx} type="button" disabled={n === '…'}
            onClick={() => n !== '…' && onGo(n)}
            className={cx(
              'min-w-[34px] rounded-full px-3 py-1.5 text-[13px] font-bold border cursor-pointer',
              n === '…' ? 'border-transparent cursor-default' : n === info.pagina ? 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'
            )}
          >{n}</button>
        ))}
        <button
          type="button" disabled={!info.hayNext} onClick={() => onGo(info.pagina + 1)}
          className="min-w-[34px] rounded-full px-3 py-1.5 text-[13px] font-bold border border-gris-300 bg-sura-blanco text-gris-500 disabled:text-gris-300 disabled:cursor-not-allowed cursor-pointer"
        >Siguiente</button>
      </div>
    </div>
  )
}
