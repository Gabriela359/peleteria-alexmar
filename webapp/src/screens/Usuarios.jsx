import { useApp } from '../state/store';
import { Badge } from '../components/ui';

export default function Usuarios() {
  const { state, setState, toast } = useApp();
  const s = state;

  const toggle = (i) => setState({ usuarios: s.usuarios.map((x, j) => (j === i ? { ...x, activo: !x.activo } : x)) });

  return (
    <div>
      <div className="screen-head">
        <div>
          <h1>Usuarios y roles</h1>
          <div className="screen-sub">El vendedor solo registra ventas y consulta inventario. El administrador ve y edita todo.</div>
        </div>
        <button className="btn btn-cta" onClick={() => toast('Alta de usuarios: pendiente de definir en el siguiente sprint')}>Nuevo usuario</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Permisos</th><th className="right">Estado</th></tr></thead>
            <tbody>
              {s.usuarios.map((u, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{u.nombre}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{u.correo}</td>
                  <td><Badge tone={u.rol === 'Administrador' ? 'info' : 'neutral'}>{u.rol}</Badge></td>
                  <td style={{ color: 'var(--gris-500)', fontSize: 13 }}>{u.rol === 'Administrador' ? 'Inventario, ventas, reportes, usuarios y correo' : 'Registrar ventas y consultar inventario'}</td>
                  <td className="right">
                    <button
                      className="pill sm"
                      onClick={() => toggle(i)}
                      style={{
                        border: '1px solid ' + (u.activo ? 'var(--success-1)' : 'var(--gris-300)'),
                        background: u.activo ? 'var(--success-1)' : 'var(--sura-blanco)',
                        color: u.activo ? 'var(--sura-blanco)' : 'var(--gris-500)',
                      }}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
