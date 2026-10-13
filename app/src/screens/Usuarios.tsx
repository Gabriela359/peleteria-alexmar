import { useState } from 'react'
import type { FormEvent } from 'react'
import { useUI } from '../state/ui'
import { useActualizarUsuario, useCrearUsuario, useEliminarUsuario, useUserApiHealth, useUsuarios } from '../hooks/useUsuarios'
import { Btn, Card } from '../components/ui'
import { EyeIcon, EyeOffIcon } from '../components/Icons'

export default function Usuarios() {
  const { showToast } = useUI()
  const consulta = useUsuarios()
  const estadoApi = useUserApiHealth()
  const usuarios = consulta.data ?? []
  const actualizar = useActualizarUsuario()
  const crear = useCrearUsuario()
  const eliminar = useEliminarUsuario()
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [rol, setRol] = useState<'admin' | 'vendedor'>('vendedor')

  async function onCrear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const nuevo = await crear.mutateAsync({ nombre, correo, password, rol })
      showToast('Usuario ' + nuevo.nombre + ' registrado')
      setNombre('')
      setCorreo('')
      setPassword('')
      setMostrarPassword(false)
      setRol('vendedor')
      setMostrarAlta(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar el usuario')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Usuarios y roles</h1>
          <div className="text-sm text-gris-500">El vendedor accede a Nueva venta e Inventario. El administrador puede usar todos los módulos.</div>
        </div>
        <Btn variant="cta" onClick={() => setMostrarAlta((visible) => !visible)}>
          {mostrarAlta ? 'Cerrar formulario' : 'Registrar usuario'}
        </Btn>
      </div>
      {mostrarAlta && (
        <Card className="mb-4">
          <h2 className="text-base font-bold text-sura-azul-prof m-0 mb-1">Nuevo usuario</h2>
          <p className="text-sm text-gris-500 m-0 mb-4">
            Se guardará su cuenta y perfil en la base de datos. Comparte la contraseña inicial por un canal seguro.
          </p>
          <form onSubmit={(e) => void onCrear(e)} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-gris-500">Nombre completo</span>
              <input required maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-gris-500">Correo</span>
              <input required type="email" maxLength={254} autoComplete="off" value={correo} onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo" />
            </label>
            <div className="grid gap-1.5">
              <span className="text-xs font-bold text-gris-500">Contraseña inicial</span>
              <div className="relative">
                <input required type={mostrarPassword ? 'text' : 'password'} minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 pr-11 text-sm outline-none focus:border-b-sura-azul-cielo" />
                <button type="button" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={mostrarPassword}
                  onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gris-500 hover:text-sura-azul-prof focus-visible:outline-2 focus-visible:outline-sura-azul-cielo">
                  {mostrarPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-gris-500">Rol y permisos</span>
              <select value={rol} onChange={(e) => setRol(e.target.value as 'admin' | 'vendedor')}
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none bg-sura-blanco focus:border-b-sura-azul-cielo">
                <option value="vendedor">Vendedor · ventas e inventario</option>
                <option value="admin">Administrador · acceso completo</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex flex-wrap justify-end gap-2.5 pt-2">
              <Btn disabled={crear.isPending} onClick={() => setMostrarAlta(false)}>Cancelar</Btn>
              <Btn type="submit" variant="cta" disabled={crear.isPending}>{crear.isPending ? 'Registrando…' : 'Guardar usuario'}</Btn>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {estadoApi.error && (
          <div role="alert" className="text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5 mb-3">
            No está disponible el servidor para registrar usuarios: {estadoApi.error instanceof Error ? estadoApi.error.message : 'Error desconocido'} Revisa VITE_EMAIL_API_URL y ejecuta el servidor actualizado.
          </div>
        )}
        {estadoApi.data && !estadoApi.data.supabaseConfigured && (
          <div role="alert" className="text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5 mb-3">
            El servidor de usuarios no tiene configurada la conexión a Supabase.
          </div>
        )}
        {estadoApi.data?.supabaseConfigured && !estadoApi.data.userRegistrationConfigured && (
          <div role="alert" className="text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5 mb-3">
            Falta configurar SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY en proyectos antiguos) en el entorno privado del servidor para habilitar el registro.
          </div>
        )}
        {consulta.isLoading && <div className="text-sm text-gris-500 py-3">Cargando usuarios…</div>}
        {consulta.error && <div className="text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5 mb-3">No se pudo cargar la lista de usuarios: {consulta.error instanceof Error ? consulta.error.message : 'Error desconocido'}</div>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Nombre</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Correo</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Rol</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Permisos</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Estado</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-sura-azul-divider">
                  <td className="p-3 font-bold">{u.nombre}</td>
                  <td className="p-3 text-gris-500">{u.correo}</td>
                  <td className="p-3">
                    <select
                      value={u.rol}
                      onChange={(e) => actualizar.mutate(
                        { id: u.id, patch: { rol: e.target.value as typeof u.rol } },
                        { onError: (err) => showToast(err instanceof Error ? err.message : 'No se pudo cambiar el rol') }
                      )}
                      className="border border-gris-300 rounded-full px-3 py-1 text-[13px] font-bold bg-sura-blanco cursor-pointer"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="p-3 text-gris-500 text-[13px]">{u.rol === 'admin' ? 'Todos los módulos y funciones administrativas' : 'Nueva venta e inventario (solo consulta)'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => actualizar.mutate(
                        { id: u.id, patch: { activo: !u.activo } },
                        { onError: (err) => showToast(err instanceof Error ? err.message : 'No se pudo cambiar el estado') }
                      )}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold border cursor-pointer ${u.activo ? 'border-success-1 bg-success-1 text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={eliminar.isPending}
                      onClick={() => {
                        if (!window.confirm(`¿Eliminar permanentemente a ${u.nombre} (${u.correo})? Sus ventas históricas se conservarán.`)) return
                        eliminar.mutate(u.id, {
                          onSuccess: () => showToast('Usuario eliminado'),
                          onError: (err) => showToast(err instanceof Error ? err.message : 'No se pudo eliminar el usuario'),
                        })
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold border border-danger-border text-danger-1 hover:bg-danger-2 disabled:opacity-60 cursor-pointer"
                    >
                      {eliminar.isPending && eliminar.variables === u.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usuarios.length === 0 && (
          <div className="text-[13px] text-gris-350 py-4">
            Aún no hay usuarios registrados.
          </div>
        )}
      </Card>
    </div>
  )
}
