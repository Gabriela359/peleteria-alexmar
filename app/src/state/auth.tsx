import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import type { Profile } from '../types/database'

interface AuthValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    logger.info('AUTH', 'Cargando perfil del usuario', { userId })
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      logger.error('AUTH', 'No se pudo cargar el perfil', { userId, error: error.message })
      setProfile(null)
      return
    }
    logger.success('AUTH', 'Perfil cargado', { userId, nombre: data?.nombre ?? 'sin nombre' })
    setProfile(data)
  }

  useEffect(() => {
    let activo = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!activo) return
      logger.info('AUTH', 'Sesión inicial consultada', { hasSession: !!data.session })
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.info('AUTH', 'Cambio de auth detectado', { event, hasSession: !!newSession })
      setSession(newSession)
      if (newSession) await loadProfile(newSession.user.id)
      else { logger.warn('AUTH', 'Se cerró la sesión actual'); setProfile(null) }
    })

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthValue>(() => ({
    session,
    profile,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? error.message : null }
    },
    async signOut() {
      await supabase.auth.signOut()
    },
    async refreshProfile() {
      if (session) await loadProfile(session.user.id)
    },
  }), [session, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
