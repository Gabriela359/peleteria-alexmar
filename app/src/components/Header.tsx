import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import type { Screen } from '../state/ui'

const NAV_ADMIN: [Screen, string][] = [
  ['panel', 'Panel'], ['venta', 'Nueva venta'], ['inventario', 'Inventario'],
  ['movs', 'Movimientos'], ['reportes', 'Reportes'], ['usuarios', 'Usuarios'],
]
const NAV_VENDEDOR: [Screen, string][] = [
  ['venta', 'Nueva venta'], ['inventario', 'Inventario'],
]

function NavIcon({ screen }: { screen: Screen }) {
  const paths: Record<Screen, React.ReactNode> = {
    panel: <><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></>,
    venta: <><path d="M4 5h16l-1.5 9h-13L4 5Z" /><path d="M4 5 3 3H1.5M7 18.5h.01M17 18.5h.01M5.5 14l-1 2.5a1 1 0 0 0 1 1.5h12" /></>,
    inventario: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    movs: <><path d="M4 7h15M15 3l4 4-4 4M20 17H5m4-4-4 4 4 4" /></>,
    reportes: <><path d="M4 20V10m5 10V4m5 16v-7m5 7V7" /><path d="M2.5 20.5h19" /></>,
    usuarios: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 5.5a3.5 3.5 0 0 1 0 6.8M18 14a6 6 0 0 1 3.5 5.5" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px] shrink-0">
      {paths[screen]}
    </svg>
  )
}

export default function Header() {
  const { profile, session, signOut } = useAuth()
  const { screen, setScreen } = useUI()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navPanelRef = useRef<HTMLElement>(null)
  const isAdmin = profile?.rol === 'admin'
  const nav = isAdmin ? NAV_ADMIN : NAV_VENDEDOR
  const email = profile?.correo || session?.user.email

  useEffect(() => {
    if (!mobileOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !navPanelRef.current?.contains(event.target)) {
        setMobileOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  function navigateTo(target: Screen) {
    setScreen(target)
    setMobileOpen(false)
  }

  function signOutAndClose() {
    setMobileOpen(false)
    void signOut()
  }

  const links = (compact = false) => nav.map(([key, label]) => {
    const active = screen === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => navigateTo(key)}
        aria-current={active ? 'page' : undefined}
        className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors ${
          active
            ? 'bg-sura-amarillo text-sura-azul-oscuro shadow-sm'
            : 'text-white/75 hover:bg-white/10 hover:text-white'
        } ${compact ? 'justify-center px-2' : ''}`}
      >
        <NavIcon screen={key} />
        {!compact && <span>{label}</span>}
      </button>
    )
  })

  const profileBlock = (mobile = false) => (
    <div className={`flex min-w-0 items-center gap-3 border-t border-white/15 ${mobile ? 'px-4 py-4' : 'px-5 py-5'}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-sura-amarillo">
        {(profile?.nombre || 'U').trim().slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">{profile?.nombre || 'Colaborador'}</div>
        <div className="truncate text-xs text-white/55">{isAdmin ? 'Administrador' : 'Vendedor'}</div>
      </div>
      <button
        type="button"
        onClick={signOutAndClose}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sura-amarillo"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </svg>
      </button>
      {mobile && email && <span className="sr-only">{email}</span>}
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col bg-sura-azul-oscuro text-white shadow-xl md:flex">
        <div className="flex h-[88px] items-center gap-3 border-b border-white/10 px-5">
          <img
            src="/alexmar-logo.png"
            alt="Logo de Peletería Alexmar"
            className="h-12 w-12 shrink-0 rounded-xl border border-white/15 bg-sura-blanco object-contain p-0.5"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-wide">PELETERÍA</div>
            <div className="truncate text-lg font-bold leading-tight text-sura-amarillo">ALEXMAR</div>
          </div>
        </div>
        <div className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          Menú principal
        </div>
        <nav aria-label="Navegación principal" className="grid gap-1 px-3">
          {links()}
        </nav>
        <div className="mt-auto">{profileBlock()}</div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-sura-azul-divider bg-sura-blanco px-4 shadow-sm md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/alexmar-logo.png" alt="Logo de Peletería Alexmar" className="h-10 w-10 rounded-lg border border-sura-azul-chip bg-sura-blanco object-contain" />
          <div className="leading-tight">
            <div className="text-[10px] font-bold tracking-wider text-gris-500">PELETERÍA</div>
            <div className="text-sm font-bold text-sura-azul-prof">ALEXMAR</div>
          </div>
        </div>
        <button
          type="button"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-sura-azul-divider text-sura-azul-prof hover:bg-sura-azul-tint focus-visible:outline-2 focus-visible:outline-sura-azul-cielo"
        >
          {mobileOpen
            ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
            : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside id="mobile-navigation" ref={navPanelRef} className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col bg-sura-azul-oscuro text-white shadow-2xl">
            <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-4">
              <img src="/alexmar-logo.png" alt="" className="h-11 w-11 rounded-xl border border-white/15 bg-sura-blanco object-contain p-0.5" />
              <div>
                <div className="text-xs font-bold tracking-wide">PELETERÍA</div>
                <div className="text-base font-bold text-sura-amarillo">ALEXMAR</div>
              </div>
            </div>
            <div className="px-5 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Menú principal</div>
            <nav aria-label="Navegación principal" className="grid gap-1 px-3">{links()}</nav>
            <div className="mt-auto">{profileBlock(true)}</div>
          </aside>
        </div>
      )}
    </>
  )
}
