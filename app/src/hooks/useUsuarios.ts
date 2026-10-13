import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Profile, Rol } from '../types/database'

const KEY = ['usuarios'] as const
const USER_API_KEY = ['user-api-health'] as const
const USER_API_URL = (import.meta.env.VITE_EMAIL_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

interface UserApiHealth {
  ok: boolean
  supabaseConfigured: boolean
  userRegistrationConfigured: boolean
}

export function useUserApiHealth() {
  return useQuery({
    queryKey: USER_API_KEY,
    queryFn: async (): Promise<UserApiHealth> => {
      let response: Response
      try {
        response = await fetch(`${USER_API_URL}/health`)
      } catch (error) {
        if (error instanceof TypeError) throw new Error('No se pudo conectar con el servidor de usuarios.')
        throw error
      }
      if (!response.ok) throw new Error(`El servidor respondió con HTTP ${response.status}`)
      const health = await response.json() as UserApiHealth
      if (!health.ok) throw new Error('El servidor de usuarios no está disponible.')
      return health
    },
    retry: false,
    staleTime: 30_000,
  })
}

export function useUsuarios() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Profile, 'activo' | 'rol'>> }) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export interface NuevoUsuario {
  nombre: string
  correo: string
  password: string
  rol: Rol
}

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nuevo: NuevoUsuario): Promise<Profile> => {
      const { data: { session }, error: errorSesion } = await supabase.auth.getSession()
      if (errorSesion) throw errorSesion
      if (!session) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')

      const apiUrl = USER_API_URL
      let response: Response
      try {
        response = await fetch(`${apiUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(nuevo),
        })
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error('No se pudo conectar con el servidor de usuarios. Verifica que esté ejecutándose y que VITE_EMAIL_API_URL apunte a su dirección.')
        }
        throw error
      }
      let result: { error?: string; user?: Profile }
      try {
        result = await response.json() as { error?: string; user?: Profile }
      } catch {
        throw new Error(`El servidor de usuarios respondió con un formato no válido (HTTP ${response.status})`)
      }
      if (!response.ok) throw new Error(result.error || 'No se pudo registrar el usuario')
      if (!result.user) throw new Error('El servidor no devolvió el usuario registrado')
      return result.user
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useEliminarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { session }, error: errorSesion } = await supabase.auth.getSession()
      if (errorSesion) throw errorSesion
      if (!session) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')

      let response: Response
      try {
        response = await fetch(`${USER_API_URL}/users/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error('No se pudo conectar con el servidor de usuarios. Verifica que esté ejecutándose y que VITE_EMAIL_API_URL apunte a su dirección.')
        }
        throw error
      }

      let result: { error?: string }
      try {
        result = await response.json() as { error?: string }
      } catch {
        throw new Error(`El servidor de usuarios respondió con un formato no válido (HTTP ${response.status})`)
      }
      if (!response.ok) throw new Error(result.error || 'No se pudo eliminar el usuario')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export type { Rol }
