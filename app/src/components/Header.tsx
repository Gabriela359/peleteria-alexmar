import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import type { Screen } from '../state/ui'
import { LogoIcon } from './Icons'

const NAV_ADMIN: [Screen, string][] = [
  ['panel', 'Panel'], ['venta', 'Nueva venta'], ['inventario', 'Inventario'],
  ['movs', 'Movimientos'], ['reportes', 'Reportes'], ['usuarios', 'Usuarios'], ['correo', 'Correo diario'],
]
const NAV_VENDEDOR: [Screen, string][] = [
  ['venta', 'Nueva venta'], ['inventario', 'Inventario'], ['reportes', 'Mis ventas'],
]

export default function Header() {
  const { profile, signOut } = useAuth()
  const { screen, setScreen } = useUI()
  const isAdmin = profile?.rol === 'admin'
  const nav = isAdmin ? NAV_ADMIN : NAV_VENDEDOR

  return (
    <header className="bg-sura-azul-cielo text-sura-blanco px-3 sm:px-6 py-2.5 flex items-center gap-x-5 gap-y-3 min-h-[60px] flex-wrap sticky top-0 z-40">
      <div className="flex items-center gap-2.5 font-bold text-[15px] whitespace-nowrap">
        <LogoIcon size={22} /> Peletería El Progreso
      </div>
      <nav className="flex items-center gap-1 flex-1 flex-wrap">
        {nav.map(([key, label]) => (
          <button
            key={key} onClick={() => setScreen(key)}
            className={`border-none rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap cursor-pointer transition-colors text-sura-blanco ${screen === key ? 'bg-white/22' : 'bg-transparent'}`}
          >{label}</button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight ml-auto">
          <div className="text-[13px] font-bold">{profile?.nombre}</div>
          <div className="text-[11px] opacity-85 uppercase tracking-wide">{isAdmin ? 'Administrador' : 'Vendedor'}</div>
        </div>
        <button onClick={() => void signOut()} className="border border-white/50 bg-transparent text-sura-blanco rounded-full px-4 py-1.5 text-[13px] font-bold cursor-pointer hover:bg-white/15">
          Salir
        </button>
      </div>
    </header>
  )
}
