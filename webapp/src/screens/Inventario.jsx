import { useMemo } from 'react';
import { useApp } from '../state/store';
import { cop, pager, porTalla, unidadTxt, paresDe } from '../lib/format';
import { Badge, Pager, Pill } from '../components/ui';

const FILTROS = [['activos', 'Activos'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados'], ['archivados', 'Archivados']];
const POR_PAGINA = 8;

export default function Inventario() {
  const { state, setState, activos, stockTotal, archivar, abrirModelo } = useApp();
  const s = state;
  const isAdmin = s.role === 'admin';

  const data = useMemo(() => {
    const qi = s.qInv.toLowerCase();
    const match = (m) => (m.ref + ' ' + m.nombre + ' ' + m.tipo + ' ' + m.color).toLowerCase().includes(qi);
    const filtrados = s.modelos.filter(match).filter((m) => {
      if (s.filtroInv === 'archivados') return m.archivado;
      if (m.archivado) return false;
      if (s.filtroInv === 'bajo') return paresDe(m) <= m.min;
      if (s.filtroInv === 'agotado') return porTalla(m) ? Object.keys(m.tallas).some((k) => Number(m.tallas[k]) === 0) : paresDe(m) === 0;
      return true;
    });
    const info = pager(filtrados.length, POR_PAGINA, s.invPag);
    const rows = filtrados.slice((info.pagina - 1) * POR_PAGINA, info.pagina * POR_PAGINA);
    const activosArr = activos();
    const alertasCount = activosArr.filter((m) => paresDe(m) <= m.min).length;
    const archivadosCount = s.modelos.length - activosArr.length;
    const resumen = stockTotal().toLocaleString('es-CO') + ' unidades/pares en ' + activosArr.length + ' productos activos · ' +
      alertasCount + ' en alerta de stock · ' + archivadosCount + (archivadosCount === 1 ? ' archivado' : ' archivados');
    return { rows, info, resumen };
  }, [s.qInv, s.filtroInv, s.modelos, s.invPag, activos, stockTotal]);

  const row = (m) => {
    const pares = paresDe(m);
    const bajo = pares <= m.min;
    const porT = porTalla(m);
    const keys = porT ? Object.keys(m.tallas).sort() : [];
    const agotadas = porT ? keys.filter((k) => Number(m.tallas[k]) === 0).length : 0;
    const estado = m.archivado ? 'Archivado' : bajo ? 'Stock bajo' : agotadas ? agotadas + ' talla(s) en cero' : 'Disponible';
    const tone = m.archivado ? 'neutral' : bajo ? 'danger' : agotadas ? 'warning' : 'success';
    return (
      <tr key={m.ref}>
        <td className="mono" style={{ color: 'var(--sura-azul-prof)' }}>{m.ref}</td>
        <td style={{ fontWeight: 700 }}>{m.nombre}</td>
        <td style={{ color: 'var(--gris-500)' }}>{m.tipo} · {m.color}</td>
        <td style={{ color: 'var(--gris-500)', fontSize: 13 }}>{porT ? 'Tallas ' + keys[0] + '–' + keys[keys.length - 1] + ' (' + keys.length + ')' : 'Por unidad'}</td>
        <td className="right tabular" style={{ fontWeight: 700 }}>{pares.toLocaleString('es-CO')} {unidadTxt(m)}</td>
        <td className="right tabular" style={{ whiteSpace: 'nowrap' }}>{cop(m.precio)} <span style={{ fontSize: 12, color: 'var(--gris-350)' }}>{porT ? '/ par' : '/ und'}</span></td>
        {isAdmin && <td className="right tabular" style={{ color: 'var(--success-1)' }}>{cop(m.precio - m.costo)}</td>}
        <td><Badge tone={tone}>{estado}</Badge></td>
        {isAdmin && (
          <td className="right" style={{ whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => abrirModelo(m.ref)}>Actualizar</button>
              <button className="btn btn-outline btn-sm" onClick={() => setState({ modal: 'ajuste', ajuste: { ref: m.ref, talla: porT ? keys[0] : null, valor: '', motivo: 'Conteo físico' } })}>Ajustar</button>
              <button className={m.archivado ? 'btn btn-sm' : 'btn btn-outline btn-sm'} style={m.archivado ? { border: '1px solid var(--success-border)', color: 'var(--success-1)', background: 'var(--sura-blanco)' } : undefined} onClick={() => archivar(m.ref)}>{m.archivado ? 'Reactivar' : 'Archivar'}</button>
              <button className="btn btn-danger-outline btn-sm" onClick={() => setState({ confirm: { tipo: 'del', ref: m.ref, nombre: m.nombre } })}>Eliminar</button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div>
      <div className="screen-head">
        <div>
          <h1>Inventario</h1>
          <div className="screen-sub">{data.resumen}</div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline-prof" onClick={() => setState({ modal: 'entrada', entrada: { ref: activos()[0].ref, proveedor: '', tallas: {} } })}>Entrada de mercancía</button>
            <button className="btn btn-cta" onClick={() => abrirModelo(null)}>Nuevo producto</button>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 12px', alignItems: 'center', marginBottom: 16 }}>
          <input className="input" style={{ flex: '1 1 220px', minWidth: 0 }} value={s.qInv} onChange={(e) => setState({ qInv: e.target.value, invPag: 1 })} placeholder="Buscar referencia, producto, tipo o color" />
          {FILTROS.map(([key, label]) => (
            <Pill key={key} prof active={s.filtroInv === key} onClick={() => setState({ filtroInv: key, invPag: 1 })}>{label}</Pill>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ref.</th><th>Producto</th><th>Tipo · color</th><th>Presentación</th>
                <th className="right">Stock</th><th className="right">Precio</th>
                {isAdmin && <th className="right">Utilidad</th>}
                <th>Estado</th>
                {isAdmin && <th className="right">Acciones</th>}
              </tr>
            </thead>
            <tbody>{data.rows.map(row)}</tbody>
          </table>
        </div>
        <Pager info={data.info} onGo={(n) => setState({ invPag: n })} />
      </div>
    </div>
  );
}
