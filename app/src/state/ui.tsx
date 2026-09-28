import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { logger } from '../lib/logger'

export type Screen = 'panel' | 'venta' | 'inventario' | 'movs' | 'reportes' | 'usuarios' | 'correo'
export type ModalName = 'factura' | 'modelo' | 'entrada' | 'ajuste' | 'correo'
export type LogLevel = 'info' | 'success' | 'warn' | 'error'

export interface ConfirmState {
  tipo: 'del' | 'dev'
  ref?: string
  nombre?: string
  id?: string
}

interface UIValue {
  screen: Screen
  setScreen: (s: Screen) => void
  modal: ModalName | null
  modalPayload: unknown
  openModal: (name: ModalName, payload?: unknown) => void
  closeModal: () => void
  confirm: ConfirmState | null
  setConfirm: (c: ConfirmState | null) => void
  toast: string | null
  showToast: (msg: string) => void
  logDebug: (level: LogLevel, message: string, meta?: unknown) => void
}

const UIContext = createContext<UIValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [screen, setScreenState] = useState<Screen>('panel')
  const [modal, setModal] = useState<ModalName | null>(null)
  const [modalPayload, setModalPayload] = useState<unknown>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const logDebug = useCallback((level: LogLevel, message: string, meta?: unknown) => {
    logger(level === 'success' ? 'info' : level, message, meta)
  }, [])

  const setScreen = useCallback((s: Screen) => {
    setScreenState(s)
    setModal(null)
    logDebug('info', `Pantalla activa: ${s}`)
  }, [logDebug])

  const openModal = useCallback((name: ModalName, payload?: unknown) => {
    setModal(name)
    setModalPayload(payload ?? null)
    logDebug('info', `Modal abierto: ${name}`, payload ?? null)
  }, [logDebug])

  const closeModal = useCallback(() => {
    setModal(null)
    setConfirm(null)
    logDebug('info', 'Modal cerrado')
  }, [logDebug])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    logDebug('info', `Toast: ${msg}`)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [logDebug])

  const value = useMemo<UIValue>(() => ({
    screen, setScreen, modal, modalPayload, openModal, closeModal, confirm, setConfirm, toast, showToast, logDebug,
  }), [screen, setScreen, modal, modalPayload, openModal, closeModal, confirm, toast, showToast, logDebug])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>')
  return ctx
}
