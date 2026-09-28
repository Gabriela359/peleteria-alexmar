import { useAuth } from './state/auth'
import { UIProvider, useUI } from './state/ui'
import { logger } from './lib/logger'
import Login from './screens/Login'
import Header from './components/Header'
import Panel from './screens/Panel'
import Venta from './screens/Venta'
import Inventario from './screens/Inventario'
import Movimientos from './screens/Movimientos'
import Reportes from './screens/Reportes'
import Usuarios from './screens/Usuarios'
import CorreoDiario from './screens/CorreoDiario'
import ModalRoot from './components/ModalRoot'
import Toast from './components/Toast'
import type { Screen } from './state/ui'
import type { ComponentType, ReactNode } from 'react'

const SCREENS_ADMIN: Record<Screen, ComponentType> = {
  panel: Panel, venta: Venta, inventario: Inventario, movs: Movimientos,
  reportes: Reportes, usuarios: Usuarios, correo: CorreoDiario,
}
const SCREENS_VENDEDOR: Partial<Record<Screen, ComponentType>> = {
  venta: Venta, inventario: Inventario, reportes: Reportes,
}

function CentroPantalla({ children }: { children: ReactNode }) {
  return <div className="min-h-screen grid place-items-center bg-gris-150 p-6 text-center text-gris-500">{children}</div>
}

function AppShell() {
  const { profile, signOut } = useAuth()
  const { screen } = useUI()
  if (!profile) return <CentroPantalla>Cargando tu perfil…</CentroPantalla>
  if (!profile.activo) {
    return (
      <CentroPantalla>
        <div>
          <div className="text-lg font-bold text-gris-900 mb-2">Tu cuenta está inactiva</div>
          <div className="mb-4">Pídele a un administrador que la reactive desde Usuarios y roles.</div>
          <button onClick={() => void signOut()} className="rounded-full border border-gris-300 bg-sura-blanco px-5 py-2 font-bold cursor-pointer">Salir</button>
        </div>
      </CentroPantalla>
    )
  }

  const isAdmin = profile.rol === 'admin'
  const screens = isAdmin ? SCREENS_ADMIN : SCREENS_VENDEDOR
  const ScreenComp = screens[screen] ?? (isAdmin ? Panel : Venta)

  return (
    <div className="min-h-screen bg-gris-150">
      <Header />
      <main className="px-3 sm:px-8 py-3.5 sm:py-6 pb-14">
        <ScreenComp />
      </main>
      <ModalRoot />
      <Toast />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  logger.info('APP', 'App renderizada', { session: !!session, loading })

  if (loading) return <CentroPantalla>Cargando…</CentroPantalla>
  if (!session) return <Login />

  return (
    <UIProvider>
      <AppShell />
    </UIProvider>
  )
}
