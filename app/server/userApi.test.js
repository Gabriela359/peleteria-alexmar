import test from 'node:test'
import assert from 'node:assert/strict'
import { createManagedUser, deleteManagedUser, UserApiError, validateNewUser } from './userApi.js'

const payload = {
  nombre: '  María Pérez  ',
  correo: '  MARIA@EJEMPLO.COM ',
  password: 'clave-segura',
  rol: 'admin',
}

function fakeClients({ profile = { rol: 'admin', activo: true }, profileUpdateError = null } = {}) {
  const calls = { created: null, updated: null, deleted: false, clients: 0 }
  const createClientFn = () => {
    calls.clients++
    if (calls.clients === 1) {
      return {
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }),
          }),
        }),
      }
    }
    return {
      auth: {
        admin: {
          createUser: async (user) => {
            calls.created = user
            return { data: { user: { id: 'nuevo-id', created_at: '2026-01-01T00:00:00Z' } }, error: null }
          },
          deleteUser: async () => {
            calls.deleted = true
            return { error: null }
          },
        },
      },
      from: () => ({
        update: (patch) => {
          calls.updated = patch
          return {
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: profileUpdateError ? null : { id: 'nuevo-id' },
                  error: profileUpdateError,
                }),
              }),
            }),
          }
        },
      }),
    }
  }
  return { calls, createClientFn }
}

test('validateNewUser normaliza correo y nombre', () => {
  assert.deepEqual(validateNewUser(payload), {
    nombre: 'María Pérez',
    correo: 'maria@ejemplo.com',
    password: 'clave-segura',
    rol: 'admin',
  })
})

test('validateNewUser rechaza datos incompletos y roles no permitidos', () => {
  assert.throws(() => validateNewUser({ ...payload, password: '123' }), UserApiError)
  assert.throws(() => validateNewUser({ ...payload, rol: 'owner' }), UserApiError)
  assert.throws(() => validateNewUser({ ...payload, correo: 'correo-invalido' }), UserApiError)
})

test('createManagedUser crea cuenta de autenticación y guarda el perfil con el rol elegido', async () => {
  const { calls, createClientFn } = fakeClients()
  const created = await createManagedUser({
    payload,
    user: { id: 'admin-id' },
    token: 'valid-token',
    env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SECRET_KEY: 'secret' },
    createClientFn,
  })

  assert.equal(created.id, 'nuevo-id')
  assert.equal(created.nombre, 'María Pérez')
  assert.equal(created.correo, 'maria@ejemplo.com')
  assert.equal(created.rol, 'admin')
  assert.equal(calls.created.email_confirm, true)
  assert.deepEqual(calls.created.user_metadata, { nombre: 'María Pérez' })
  assert.deepEqual(calls.updated, { nombre: 'María Pérez', correo: 'maria@ejemplo.com', rol: 'admin', activo: true })
  assert.equal(calls.deleted, false)
})

test('createManagedUser impide crear cuentas para usuarios que no sean administradores activos', async () => {
  const { calls, createClientFn } = fakeClients({ profile: { rol: 'vendedor', activo: true } })
  await assert.rejects(
    createManagedUser({
      payload,
      user: { id: 'vendedor-id' },
      token: 'valid-token',
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' },
      createClientFn,
    }),
    { status: 403 },
  )
  assert.equal(calls.clients, 1)
})

test('createManagedUser impide crear cuentas para un administrador inactivo', async () => {
  const { calls, createClientFn } = fakeClients({ profile: { rol: 'admin', activo: false } })
  await assert.rejects(
    createManagedUser({
      payload,
      user: { id: 'admin-id' },
      token: 'valid-token',
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' },
      createClientFn,
    }),
    { status: 403 },
  )
  assert.equal(calls.clients, 1)
})

test('createManagedUser elimina la cuenta si no se puede guardar su perfil', async () => {
  const { calls, createClientFn } = fakeClients({ profileUpdateError: new Error('database unavailable') })
  await assert.rejects(
    createManagedUser({
      payload,
      user: { id: 'admin-id' },
      token: 'valid-token',
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' },
      createClientFn,
    }),
    { status: 500 },
  )
  assert.equal(calls.deleted, true)
})

test('createManagedUser exige configurar la llave privada en el backend', async () => {
  await assert.rejects(
    createManagedUser({
      payload,
      user: { id: 'admin-id' },
      token: 'valid-token',
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' },
      createClientFn: () => assert.fail('No debe inicializar Supabase sin su configuración'),
    }),
    { status: 503 },
  )
})

function fakeDeleteClients({
  profileAdmin = { rol: 'admin', activo: true },
  targetProfile = { id: 'objetivo-id', rol: 'vendedor', activo: true },
  activeAdmins = [{ id: 'admin-id' }],
} = {}) {
  const calls = { deleted: null, clients: 0 }
  const createClientFn = () => {
    calls.clients++
    if (calls.clients === 1) {
      return {
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: profileAdmin, error: null }) }),
          }),
        }),
      }
    }
    return {
      auth: {
        admin: {
          deleteUser: async (id) => {
            calls.deleted = id
            return { error: null }
          },
        },
      },
      from: () => ({
        select: () => {
          const filters = {}
          const query = {
            eq: (field, value) => {
              filters[field] = value
              return query
            },
            maybeSingle: async () => ({ data: targetProfile, error: null }),
            then: (resolve, reject) => Promise.resolve({
              data: filters.rol === 'admin' ? activeAdmins : targetProfile,
              error: null,
            }).then(resolve, reject),
          }
          return query
        },
      }),
    }
  }
  return { calls, createClientFn }
}

const deleteOptions = {
  targetUserId: '12345678-1234-1234-1234-123456789abc',
  user: { id: 'admin-id' },
  token: 'valid-token',
  env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SECRET_KEY: 'secret' },
}

test('deleteManagedUser elimina la cuenta Auth solicitada como administrador activo', async () => {
  const { calls, createClientFn } = fakeDeleteClients()
  const result = await deleteManagedUser({ ...deleteOptions, createClientFn })

  assert.deepEqual(result, { id: deleteOptions.targetUserId })
  assert.equal(calls.deleted, deleteOptions.targetUserId)
})

test('deleteManagedUser impide eliminar la propia cuenta', async () => {
  const { calls, createClientFn } = fakeDeleteClients()
  await assert.rejects(
    deleteManagedUser({
      ...deleteOptions,
      targetUserId: deleteOptions.user.id,
      createClientFn,
    }),
    { status: 400 },
  )
  assert.equal(calls.clients, 0)
})

test('deleteManagedUser impide eliminar al último administrador activo', async () => {
  const { calls, createClientFn } = fakeDeleteClients({
    targetProfile: { id: deleteOptions.targetUserId, rol: 'admin', activo: true },
    activeAdmins: [{ id: deleteOptions.targetUserId }],
  })
  await assert.rejects(
    deleteManagedUser({ ...deleteOptions, createClientFn }),
    /último administrador activo/,
  )
  assert.equal(calls.deleted, null)
})

test('deleteManagedUser rechaza usuarios que no sean administradores activos', async () => {
  const { calls, createClientFn } = fakeDeleteClients({
    profileAdmin: { rol: 'vendedor', activo: true },
  })
  await assert.rejects(
    deleteManagedUser({ ...deleteOptions, createClientFn }),
    { status: 403 },
  )
  assert.equal(calls.deleted, null)
})
