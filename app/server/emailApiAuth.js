import { createClient } from '@supabase/supabase-js'

export async function validateEmailApiRequest({ headers = {} }) {
  const authHeader = String(headers.authorization || headers.Authorization || '')
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return { ok: false, status: 401, error: 'Authorization Bearer requerido' }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 500, error: 'Supabase no configurado en el backend' }
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await client.auth.getUser(token)

    if (error || !data.user) {
      return { ok: false, status: 401, error: 'Token de sesión inválido o expirado' }
    }

    return { ok: true, status: 200, user: data.user }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error validando sesión'
    return { ok: false, status: 401, error: message }
  }
}
