import { useMemo } from 'react';
import { useApp } from '../state/store';
import { cop, delta, detalle, esHoy, fecha, hhmm, hoyLargo, paresDe } from '../lib/format';
import { AlertTriangleIcon } from '../components/Icons';

const NOM_DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export default function Panel() {
  const { state, setState, activos, stockTotal } = useApp();
  const isAdmin = state.role === 'admin';

  const data = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const dias7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      const dv = state.ventas.filter((v) => !v.devuelta && new Date(v.fecha).toDateString() === d.toDateString());
      dias7.push({
        diaNom: NOM_DIA[d.getDay()], fecha: fecha(d.toISOString()).slice(0, 5),
        facturas: dv.length, pares: dv.reduce((a, v) => a + v.items.reduce((x, i) => x + i.pares, 0), 0),
        totalFmt: cop(dv.reduce((a, v) => a + v.total, 0)),
      });
    }
    const ultimos5 = dias7.slice().reverse().slice(0, 5);

    const hoyVentas = state.ventas.filter((v) => esHoy(v.fecha) && !v.devuelta);
    const hoyAgg = {
      total: hoyVentas.reduce((a, v) => a + v.total, 0),
      pares: hoyVentas.reduce((a, v) => a + v.items.reduce((x, i) => x + i.pares, 0), 0),
      util: hoyVentas.reduce((a, v) => a + (v.total - v.costo), 0),
      n: hoyVentas.length,
    };
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    const ayerVentas = state.ventas.filter((v) => !v.devuelta && new Date(v.fecha).toDateString() === ayer.toDateString());
    const ayerTotal = ayerVentas.reduce((a, v) => a + v.total, 0);
    const dh = delta(hoyAgg.total, ayerTotal);

    const activosArr = activos();
    const alertasArr = activosArr.filter((m) => paresDe(m) <= m.min);
    const heroMetrics = [
      { label: 'Vendido hoy', valor: cop(hoyAgg.total), delta: dh.txt, deltaColor: dh.color },
      { label: 'Pares vendidos hoy', valor: String(hoyAgg.pares), delta: hoyAgg.n + (hoyAgg.n === 1 ? ' factura' : ' facturas'), deltaColor: 'var(--gris-350)' },
    ];
    if (isAdmin) heroMetrics.push({ label: 'Utilidad hoy', valor: cop(hoyAgg.util), delta: 'Precio menos costo', deltaColor: 'var(--gris-350)' });
    heroMetrics.push({ label: 'Stock en bodega', valor: stockTotal().toLocaleString('es-CO'), delta: alertasArr.length + ' productos en alerta', deltaColor: alertasArr.length ? 'var(--warning-1)' : 'var(--success-1)' });

    const alertas = alertasArr.map((m) => ({ nombre: m.nombre, pares: paresDe(m), detalle: 'Mínimo ' + m.min + ' pares · ' + m.ref }));

    const ventasHoyAll = hoyVentas.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const ventasHoy = ventasHoyAll.slice(0, 6);
    const ventasHoyTitulo = ventasHoyAll.length > 6 ? 'Últimas ventas de hoy · ' + ventasHoyAll.length + ' facturas' : 'Ventas de hoy';

    return { ultimos5, heroMetrics, alertas, ventasHoy, ventasHoyTitulo };
  }, [state.ventas, isAdmin, activos, stockTotal]);

  return (
    <div>
      <div className="screen-head">
        <div>
          <h1>Panel del día</h1>
          <div className="screen-sub">{hoyLargo()} · corte automático a las {state.hora}</div>
        </div>
        <button className="btn btn-cta" onClick={() => setState({ modal: 'correo' })}>Ver reporte diario</button>
      </div>

      <div className="grid grid-metrics" style={{ marginBottom: 20 }}>
        {data.heroMetrics.map((m, i) => (
          <div className="card metric-card" key={i}>
            <div className="label">{m.label}</div>
            <div className="value">{m.valor}</div>
            <div className="delta" style={{ color: m.deltaColor }}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Últimos 5 días</div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Día</th><th className="right">Facturas</th><th className="right">Pares</th><th className="right">Vendido</th></tr></thead>
              <tbody>
                {data.ultimos5.map((d, i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 700 }}>{d.diaNom}</span> <span style={{ color: 'var(--gris-350)' }}>{d.fecha}</span></td>
                    <td className="right tabular" style={{ color: 'var(--gris-500)' }}>{d.facturas}</td>
                    <td className="right tabular">{d.pares}</td>
                    <td className="right tabular" style={{ fontWeight: 700 }}>{d.totalFmt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Alertas de stock</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {data.alertas.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: '#FFF5EC', border: '1px solid #FCD9B6' }}>
                <AlertTriangleIcon color="#ED8B00" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-500)' }}>{a.detalle}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ED8B00' }} className="tabular">{a.pares}</div>
              </div>
            ))}
            {data.alertas.length === 0 && <div className="empty-row">Todo el catálogo está por encima del mínimo.</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{data.ventasHoyTitulo}</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Factura</th><th>Hora</th><th>Vendedor</th><th>Detalle</th><th className="right">Pares</th><th className="right">Total</th><th></th></tr></thead>
            <tbody>
              {data.ventasHoy.map((v) => (
                <tr key={v.id}>
                  <td className="mono">{v.id}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{hhmm(v.fecha)}</td>
                  <td>{v.vendedor}</td>
                  <td style={{ color: 'var(--gris-500)' }}>{detalle(v)}</td>
                  <td className="right tabular" style={{ fontWeight: 700 }}>{v.items.reduce((a, i) => a + i.pares, 0)}</td>
                  <td className="right tabular" style={{ fontWeight: 700 }}>{cop(v.total)}</td>
                  <td className="right">
                    <button className="btn btn-outline-cielo btn-sm" onClick={() => setState({ factura: v, modal: 'factura' })}>Factura</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.ventasHoy.length === 0 && <div className="empty-row">Todavía no hay ventas registradas hoy.</div>}
      </div>
    </div>
  );
}
