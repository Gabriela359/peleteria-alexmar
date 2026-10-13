import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import type { Screen } from '../state/ui'

const NAV_ADMIN: [Screen, string][] = [
  ['panel', 'Panel'], ['venta', 'Nueva venta'], ['inventario', 'Inventario'],
  ['movs', 'Movimientos'], ['reportes', 'Reportes'], ['usuarios', 'Usuarios'], ['correo', 'Correo diario'],
]
const NAV_VENDEDOR: [Screen, string][] = [
  ['venta', 'Nueva venta'], ['inventario', 'Inventario'],
]

export default function Header() {
  const { profile, session, signOut } = useAuth()
  const { screen, setScreen } = useUI()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const isAdmin = profile?.rol === 'admin'
  const nav = isAdmin ? NAV_ADMIN : NAV_VENDEDOR
  const email = profile?.correo || session?.user.email

  useEffect(() => {
    if (!profileOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  return (
    <header className="bg-sura-azul-oscuro text-sura-blanco px-2.5 sm:px-6 py-2.5 grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-center gap-x-3 sm:gap-x-5 gap-y-2 min-h-[72px] sticky top-0 z-40 shadow-md">
      <div className="flex min-w-0 items-center gap-2 font-bold text-[12px] sm:text-[15px] whitespace-nowrap">
        <img
          src="/alexmar-logo.png"
          alt="Logo de Peletería Alexmar"
          className="h-9 w-9 sm:h-14 sm:w-14 shrink-0 rounded-xl border border-sura-azul-chip bg-sura-blanco object-contain"
        />
        <span className="max-w-[112px] sm:max-w-none truncate">Peletería ALEXMAR</span>
      </div>
      <nav className="app-nav order-last col-span-2 flex w-full min-w-0 items-center gap-1 overflow-x-auto flex-nowrap pb-0.5 sm:order-none sm:col-span-1 sm:w-auto sm:flex-1">
        {nav.map(([key, label]) => (
          <button
            key={key} onClick={() => setScreen(key)}
            className={`shrink-0 border-none rounded-full px-3 sm:px-4 py-2.5 text-[13px] sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors text-sura-blanco ${screen === key ? 'bg-white/22' : 'bg-transparent'}`}
          >{label}</button>
        ))}
      </nav>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div ref={profileMenuRef} className="relative ml-auto sm:contents">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Ver datos del colaborador"
            aria-expanded={profileOpen}
            aria-controls="mobile-profile-menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-transparent text-sura-blanco hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white sm:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
            </svg>
          </button>
          {profileOpen && (
            <div
              id="mobile-profile-menu"
              aria-label="Datos del colaborador"
              className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-sura-azul-divider bg-sura-blanco p-4 text-gris-900 shadow-xl sm:hidden"
            >
              <div className="truncate font-bold">{profile?.nombre || 'Colaborador'}</div>
              {email && <div className="mt-1 break-all text-sm text-gris-500">{email}</div>}
              <div className="mt-1 text-xs uppercase tracking-wide text-gris-500">
                {isAdmin ? 'Administrador' : 'Vendedor'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  void signOut()
                }}
                className="mt-4 w-full rounded-lg bg-sura-azul-oscuro px-4 py-2.5 text-sm font-bold text-sura-blanco hover:bg-sura-azul-oscuro-hover focus-visible:outline-2 focus-visible:outline-sura-azul-cielo"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
        <div className="hidden min-w-0 max-w-[76px] text-right leading-tight sm:ml-auto sm:block sm:max-w-none">
          <div className="truncate text-[12px] sm:text-[13px] font-bold">{profile?.nombre}</div>
          <div className="text-[11px] opacity-85 uppercase tracking-wide">{isAdmin ? 'Administrador' : 'Vendedor'}</div>
        </div>
        <button onClick={() => void signOut()} className="hidden shrink-0 border border-white/50 bg-transparent text-sura-blanco rounded-full px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] font-bold cursor-pointer hover:bg-white/15 sm:block">
          Salir
        </button>
      </div>
    </header>
  )
}
