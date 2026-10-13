import { createClient } from '@supabase/supabase-js'

export class UserApiError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'UserApiError'
    this.status = status
  }
}

export function validateNewUser(payload) {
  const nombre = typeof payload?.nombre === 'string' ? payload.nombre.trim() : ''
  const correo = typeof payload?.correo === 'string' ? payload.correo.trim().toLowerCase() : ''
  const password = typeof payload?.password === 'string' ? payload.password : ''
  const rol = payload?.rol

  if (!nombre || nombre.length > 120) throw new UserApiError('Escribe un nombre de hasta 120 caracteres')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254) {
    throw new UserApiError('Escribe un correo válido')
  }
  if (password.length < 8 || password.length > 72) {
    throw new UserApiError('La contraseña debe tener entre 8 y 72 caracteres')
  }
  if (rol !== 'admin' && rol !== 'vendedor') throw new UserApiError('Elige un rol válido')

  return { nombre, correo, password, rol }
}

export async function createManagedUser({
  payload,
  user,
  token,
  env = process.env,
  createClientFn = createClient,
}) {
  const nuevo = validateNewUser(payload)
  if (!user?.id || !token) throw new UserApiError('La sesión no es válida', 401)
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceRoleKey) {
    throw new UserApiError('Falta configurar SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY en proyectos antiguos) en el servidor', 503)
  }

  const userClient = createClientFn(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: perfilAdmin, error: errorPerfil } = await userClient
    .from('profiles')
    .select('rol, activo')
    .eq('id', user.id)
    .maybeSingle()
  if (errorPerfil) throw new UserApiError('No se pudo verificar el permiso de administrador', 500)
  if (!perfilAdmin || perfilAdmin.rol !== 'admin' || !perfilAdmin.activo) {
    throw new UserApiError('Solo un administrador activo puede registrar usuarios', 403)
  }

  const adminClient = createClientFn(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await adminClient.auth.admin.createUser({
    email: nuevo.correo,
    password: nuevo.password,
    email_confirm: true,
    user_metadata: { nombre: nuevo.nombre },
  })
  if (error) {
    const duplicate = /already|registered|exists/i.test(error.message)
    throw new UserApiError(duplicate ? 'Ya existe una cuenta con ese correo' : error.message, duplicate ? 409 : 400)
  }
  if (!data.user) throw new UserApiError('Supabase no devolvió el usuario creado', 502)

  const { data: perfil, error: errorGuardarPerfil } = await adminClient
    .from('profiles')
    .update({ nombre: nuevo.nombre, correo: nuevo.correo, rol: nuevo.rol, activo: true })
    .eq('id', data.user.id)
    .select('id')
    .maybeSingle()
  if (errorGuardarPerfil || !perfil) {
    const { error: errorEliminarUsuario } = await adminClient.auth.admin.deleteUser(data.user.id)
    if (errorEliminarUsuario) {
      console.error('No se pudo limpiar la cuenta luego de fallar el guardado del perfil:', errorEliminarUsuario.message)
      throw new UserApiError('No se pudo guardar el perfil ni eliminar la cuenta incompleta. Contacta soporte antes de volver a intentarlo.', 500)
    }
    throw new UserApiError('No se pudo guardar el perfil del usuario. La cuenta incompleta se eliminó; intenta de nuevo.', 500)
  }

  return {
    id: data.user.id,
    nombre: nuevo.nombre,
    correo: nuevo.correo,
    rol: nuevo.rol,
    activo: true,
    created_at: data.user.created_at,
  }
}

export async function deleteManagedUser({
  targetUserId,
  user,
  token,
  env = process.env,
  createClientFn = createClient,
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId || '')) {
    throw new UserApiError('El identificador del usuario no es válido')
  }
  if (!user?.id || !token) throw new UserApiError('La sesión no es válida', 401)
  if (user.id === targetUserId) throw new UserApiError('No puedes eliminar tu propio usuario')

  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceRoleKey) {
    throw new UserApiError('Falta configurar la conexión administrativa de Supabase en el servidor', 503)
  }

  const userClient = createClientFn(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: perfilAdmin, error: errorPerfilAdmin } = await userClient
    .from('profiles')
    .select('rol, activo')
    .eq('id', user.id)
    .maybeSingle()
  if (errorPerfilAdmin) throw new UserApiError('No se pudo verificar el permiso de administrador', 500)
  if (!perfilAdmin || perfilAdmin.rol !== 'admin' || !perfilAdmin.activo) {
    throw new UserApiError('Solo un administrador activo puede eliminar usuarios', 403)
  }

  const adminClient = createClientFn(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: perfilObjetivo, error: errorPerfilObjetivo } = await adminClient
    .from('profiles')
    .select('id, rol, activo')
    .eq('id', targetUserId)
    .maybeSingle()
  if (errorPerfilObjetivo) throw new UserApiError('No se pudo consultar el usuario que quieres eliminar', 500)
  if (!perfilObjetivo) throw new UserApiError('El usuario ya no existe', 404)

  if (perfilObjetivo.rol === 'admin' && perfilObjetivo.activo) {
    const { data: administradores, error: errorAdministradores } = await adminClient
      .from('profiles')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true)
    if (errorAdministradores) throw new UserApiError('No se pudo verificar que quede otro administrador activo', 500)
    if (!Array.isArray(administradores)) throw new UserApiError('No se pudo verificar que quede otro administrador activo', 500)
    if (administradores.length <= 1) {
      throw new UserApiError('No se puede eliminar al último administrador activo')
    }
  }

  const { error } = await adminClient.auth.admin.deleteUser(targetUserId)
  if (error) throw new UserApiError(error.message, 500)
  return { id: targetUserId }
}
