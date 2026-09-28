import { useApp } from '../state/store';
import { fecha, porTalla } from '../lib/format';
import { Badge } from '../components/ui';

function tono(tipo) {
  if (tipo === 'Entrada') return 'success';
  if (tipo === 'Devolución') return 'info';
  if (tipo === 'Archivado' || tipo === 'Reactivado') return 'neutral';
  return 'warning'; // Ajuste
}

export default function Movimientos() {
  const { state, setState, activos } = useApp();
  const s = state;

  return (
    <div>
      <div className="screen-head">
        <div>
          <h1>Movimientos de inventario</h1>
          <div className="screen-sub">Entradas de proveedor, ajustes con motivo y devoluciones.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline-prof" onClick={() => { const m0 = activos()[0]; setState({ modal: 'ajuste', ajuste: { ref: m0.ref, talla: porTalla(m0) ? Object.keys(m0.tallas)[0] : null, valor: '', motivo: 'Conteo físico' } }); }}>Registrar ajuste</button>
          <button className="btn btn-cta" onClick={() => setState({ modal: 'entrada', entrada: { ref: activos()[0].ref, proveedor: '', tallas: {} } })}>Entrada de mercancía</button>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Detalle</th><th>Responsable</th><th className="right">Pares</th></tr></thead>
            <tbody>
              {s.movs.map((m, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--gris-500)' }}>{fecha(m.fecha)}</td>
                  <td><Badge tone={tono(m.tipo)}>{m.tipo}</Badge></td>
                  <td style={{ fontWeight: 700 }}>{m.modelo}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{m.detalle}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{m.quien}</td>
                  <td className="right tabular" style={{ fontWeight: 700, color: m.pares === 0 ? 'var(--gris-350)' : m.pares > 0 ? 'var(--success-1)' : 'var(--danger-1)' }}>
                    {m.pares === 0 ? '—' : (m.pares > 0 ? '+' : '') + m.pares}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.movs.length === 0 && <div className="empty-row">Aún no hay movimientos registrados.</div>}
      </div>
    </div>
  );
}
