import { useMemo } from 'react';
import { useApp } from '../state/store';
import { agg, cop, delta, detalle, entre, fecha, hhmm, pager, rango } from '../lib/format';
import { Pager } from '../components/ui';

const PERIODOS = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']];
const NOM_DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const POR_PAGINA = 10;

function diasSerie(dias, list) {
  const out = [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy); d.setDate(d.getDate() - i);
    const dv = list.filter((v) => !v.devuelta && new Date(v.fecha).toDateString() === d.toDateString());
    out.push({ d, diaNom: NOM_DIA[d.getDay()], total: dv.reduce((a, v) => a + v.total, 0) });
  }
  return out;
}

function descargarCSV(ventas) {
  const cabecera = ['Factura', 'Fecha', 'Hora', 'Vendedor', 'Detalle', 'Pago', 'Pares', 'Total'];
  const filas = ventas.map((v) => [
    v.id, fecha(v.fecha), hhmm(v.fecha), v.vendedor, detalle(v).replaceAll(',', ';'), v.metodo,
    v.items.reduce((a, i) => a + i.pares, 0), v.total,
  ]);
  const csv = [cabecera, ...filas].map((r) => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ventas-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const { state, setState, toast } = useApp();
  const s = state;
  const isAdmin = s.role === 'admin';

  const data = useMemo(() => {
    const r = rango(s.periodo);
    const visibles = isAdmin ? s.ventas : s.ventas.filter((v) => v.vendedor === s.user);
    const enPeriodo = visibles.filter((v) => entre(v, r.desde, r.hasta));
    const prev = visibles.filter((v) => entre(v, r.desdePrev, r.hastaPrev));
    const A = agg(enPeriodo), B = agg(prev);
    const dTot = delta(A.total, B.total), dPar = delta(A.pares, B.pares), dN = delta(A.n, B.n);
    const metrics = [
      { label: 'Vendido', valor: cop(A.total), delta: dTot.txt, deltaColor: dTot.color },
      { label: 'Pares vendidos', valor: String(A.pares), delta: dPar.txt, deltaColor: dPar.color },
      { label: 'Facturas', valor: String(A.n), delta: dN.txt, deltaColor: dN.color },
    ];
    if (isAdmin) metrics.push({ label: 'Utilidad bruta', valor: cop(A.util), delta: 'Precio menos costo', deltaColor: 'var(--gris-350)' });
    else metrics.push({ label: 'Ticket promedio', valor: cop(A.n ? A.total / A.n : 0), delta: 'Por factura del periodo', deltaColor: 'var(--gris-350)' });

    const serieP = diasSerie(r.dias, visibles);
    const mejor = serieP.slice().sort((a, b) => b.total - a.total)[0];
    const dif = A.total - B.total;
    const stats = [
      { label: 'Ticket promedio por factura', valor: cop(A.n ? A.total / A.n : 0) },
      { label: 'Precio promedio por par', valor: cop(A.pares ? A.total / A.pares : 0) },
      { label: 'Mejor día', valor: mejor && mejor.total ? fecha(mejor.d.toISOString()) + ' · ' + cop(mejor.total) : '—' },
      { label: 'Diferencia vs. periodo anterior', valor: (dif >= 0 ? '+ ' : '− ') + cop(Math.abs(dif)) },
    ];
    if (isAdmin) stats.push({ label: 'Utilidad bruta · margen', valor: cop(A.util) + ' · ' + (A.total ? Math.round((A.util / A.total) * 100) : 0) + '%' });

    const pagosMap = {};
    enPeriodo.forEach((v) => { pagosMap[v.metodo] = pagosMap[v.metodo] || { total: 0, n: 0 }; pagosMap[v.metodo].total += v.total; pagosMap[v.metodo].n++; });
    const pagos = ['Efectivo', 'Transferencia', 'Tarjeta'].map((k) => ({
      metodo: k, n: (pagosMap[k] ? pagosMap[k].n : 0) + ' facturas',
      pct: (A.total && pagosMap[k] ? Math.round((pagosMap[k].total / A.total) * 100) : 0) + '%',
      totalFmt: cop(pagosMap[k] ? pagosMap[k].total : 0),
    }));

    const porModelo = {};
    enPeriodo.forEach((v) => v.items.forEach((i) => {
      porModelo[i.nombre] = porModelo[i.nombre] || { pares: 0, total: 0 };
      porModelo[i.nombre].pares += i.pares; porModelo[i.nombre].total += i.pares * i.precio;
    }));
    const topModelos = Object.keys(porModelo).map((k) => ({ nombre: k, pares: porModelo[k].pares, total: porModelo[k].total }))
      .sort((a, b) => b.total - a.total).slice(0, 6)
      .map((t, i) => ({ pos: i + 1, nombre: t.nombre, pares: t.pares, totalFmt: cop(t.total), pct: (A.total ? Math.round((t.total / A.total) * 100) : 0) + '%' }));

    const repOrden = enPeriodo.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const info = pager(repOrden.length, POR_PAGINA, s.repPag);
    const repVentas = repOrden.slice((info.pagina - 1) * POR_PAGINA, info.pagina * POR_PAGINA);

    return { r, metrics, stats, pagos, topModelos, repOrden, info, repVentas };
  }, [s.periodo, s.ventas, s.user, isAdmin, s.repPag]);

  return (
    <div>
      <div className="screen-head">
        <div>
          <h1>{isAdmin ? 'Historial de ventas' : 'Mis ventas'}</h1>
          <div className="screen-sub">Del {fecha(data.r.desde.toISOString())} al {fecha(data.r.hasta.toISOString())}{!isAdmin && ' · solo tus facturas'}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'var(--sura-blanco)', border: '1px solid var(--sura-azul-divider)', borderRadius: 999, padding: 4 }}>
          {PERIODOS.map(([key, label]) => (
            <button key={key} onClick={() => setState({ periodo: key, repPag: 1 })} style={{ border: 'none', borderRadius: 999, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: s.periodo === key ? 'var(--sura-azul-cielo)' : 'transparent', color: s.periodo === key ? 'var(--sura-blanco)' : 'var(--gris-500)' }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-metrics" style={{ marginBottom: 16 }}>
        {data.metrics.map((m, i) => (
          <div className="card metric-card" key={i}>
            <div className="label">{m.label}</div>
            <div className="value small">{m.valor}</div>
            <div className="delta" style={{ color: m.deltaColor }}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2-wide" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Estadísticas del periodo</div>
          <div className="kv-list">
            {data.stats.map((st, i) => (
              <div className="kv-row" key={i}><span className="k">{st.label}</span><span className="dots" /><span className="v">{st.valor}</span></div>
            ))}
          </div>
          <div className="card-title" style={{ margin: '20px 0 10px' }}>Cómo pagaron</div>
          <div className="kv-list">
            {data.pagos.map((p, i) => (
              <div className="kv-row" key={i}>
                <span className="k">{p.metodo}</span>
                <span style={{ color: 'var(--gris-350)', fontSize: 13 }}>{p.n}</span>
                <span className="dots" />
                <span style={{ color: 'var(--gris-350)', fontSize: 13 }} className="tabular">{p.pct}</span>
                <span className="v" style={{ minWidth: 96, textAlign: 'right' }}>{p.totalFmt}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Modelos más vendidos</div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Producto</th><th className="right">Pares</th><th className="right">Vendido</th><th className="right">% del total</th></tr></thead>
              <tbody>
                {data.topModelos.map((t) => (
                  <tr key={t.pos}>
                    <td className="tabular" style={{ color: 'var(--gris-350)' }}>{t.pos}</td>
                    <td style={{ fontWeight: 700 }}>{t.nombre}</td>
                    <td className="right tabular">{t.pares}</td>
                    <td className="right tabular" style={{ fontWeight: 700 }}>{t.totalFmt}</td>
                    <td className="right tabular" style={{ color: 'var(--gris-500)' }}>{t.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.topModelos.length === 0 && <div className="empty-row">Sin ventas en el periodo, aún no hay ranking.</div>}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Detalle de ventas · {data.repOrden.length} {data.repOrden.length === 1 ? 'factura' : 'facturas'}</div>
          <button className="btn btn-outline btn-sm" onClick={() => { descargarCSV(data.repOrden); toast('CSV generado con ' + data.repOrden.length + ' facturas'); }}>Exportar CSV</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Factura</th><th>Fecha</th><th>Vendedor</th><th>Detalle</th><th>Pago</th><th className="right">Pares</th><th className="right">Total</th><th></th></tr></thead>
            <tbody>
              {data.repVentas.map((v) => (
                <tr key={v.id}>
                  <td className="mono">{v.id}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{fecha(v.fecha)} {hhmm(v.fecha)}</td>
                  <td>{v.vendedor}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{detalle(v)}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{v.metodo}</td>
                  <td className="right tabular" style={{ fontWeight: 700 }}>{v.items.reduce((a, i) => a + i.pares, 0)}</td>
                  <td className="right tabular" style={{ fontWeight: 700 }}>{cop(v.total)}</td>
                  <td className="right" style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-outline-cielo btn-sm" style={{ marginRight: 6 }} onClick={() => setState({ factura: v, modal: 'factura' })}>Factura</button>
                    {isAdmin && (
                      <button
                        className={v.devuelta ? 'btn btn-outline btn-sm' : 'btn btn-danger-outline btn-sm'}
                        onClick={() => !v.devuelta && setState({ confirm: { tipo: 'dev', id: v.id } })}
                      >
                        {v.devuelta ? 'Devuelta' : 'Devolver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.repOrden.length === 0 && <div className="empty-row">No hay ventas en este periodo.</div>}
        <Pager info={data.info} onGo={(n) => setState({ repPag: n })} />
      </div>
    </div>
  );
}
