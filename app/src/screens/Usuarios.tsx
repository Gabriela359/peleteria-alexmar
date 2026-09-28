import { useUI } from '../state/ui'
import { useActualizarUsuario, useUsuarios } from '../hooks/useUsuarios'
import { Card } from '../components/ui'

export default function Usuarios() {
  const { showToast } = useUI()
  const { data: usuarios = [] } = useUsuarios()
  const actualizar = useActualizarUsuario()

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Usuarios y roles</h1>
          <div className="text-sm text-gris-500">El vendedor solo registra ventas y consulta inventario. El administrador ve y edita todo.</div>
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Nombre</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Correo</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Rol</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Permisos</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Estado</th>
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
                  <td className="p-3 text-gris-500 text-[13px]">{u.rol === 'admin' ? 'Inventario, ventas, reportes, usuarios y correo' : 'Registrar ventas y consultar inventario'}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usuarios.length === 0 && (
          <div className="text-[13px] text-gris-350 py-4">
            Aún no hay usuarios. Crea el primero desde el dashboard de Supabase (Authentication → Add user); el perfil se genera solo.
          </div>
        )}
      </Card>
    </div>
  )
}
