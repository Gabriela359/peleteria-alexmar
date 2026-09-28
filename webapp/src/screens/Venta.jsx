import { useMemo } from 'react';
import { useApp } from '../state/store';
import { cop, paresDe, porTalla, unidadTxt } from '../lib/format';
import { SearchIcon } from '../components/Icons';
import { Pill } from '../components/ui';

const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta'];

export default function Venta() {
  const { state, setState, activos, addCarrito, cobrar } = useApp();
  const s = state;

  const data = useMemo(() => {
    const q = s.q.toLowerCase();
    const match = (m) => (m.ref + ' ' + m.nombre + ' ' + m.tipo + ' ' + m.color).toLowerCase().includes(q);
    const activosArr = activos();
    const disponibles = activosArr.filter(match).filter((m) => {
      if (s.filtroVenta === 'todos') return true;
      if (s.filtroVenta === 'disponibles') return paresDe(m) > 0;
      return m.tipo === s.filtroVenta;
    });
    const tiposCat = [];
    activosArr.forEach((m) => { if (!tiposCat.includes(m.tipo)) tiposCat.push(m.tipo); });
    const filtros = [['todos', 'Todos'], ['disponibles', 'Con stock']].concat(tiposCat.map((x) => [x, x]));

    const sel = s.modelos.find((m) => m.ref === s.selRef) || null;
    const enCarrito = (ref, talla) => { const c = s.carrito.find((x) => x.ref === ref && x.talla === talla); return c ? c.pares : 0; };
    const tallas = sel && porTalla(sel)
      ? Object.keys(sel.tallas).sort().map((t) => ({ talla: t, stock: Number(sel.tallas[t]), enCarrito: enCarrito(sel.ref, t) }))
      : [];

    const carritoPares = s.carrito.reduce((a, c) => a + c.pares, 0);
    const carritoTotal = s.carrito.reduce((a, c) => a + c.pares * c.precio, 0);

    return { disponibles, filtros, sel, tallas, enCarrito, carritoPares, carritoTotal, activosCount: activosArr.length };
  }, [s.q, s.filtroVenta, s.modelos, s.selRef, s.carrito, activos]);

  const sel = data.sel;

  return (
    <div>
      <h1>Nueva venta</h1>
      <div className="screen-sub" style={{ marginBottom: 20 }}>Paso 1: elige el modelo. Paso 2: toca la talla para sumar pares. Paso 3: cobra.</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '4 1 440px', minWidth: 0, display: 'grid', gap: 16 }}>

          {sel && porTalla(sel) && (
            <div className="card" style={{ border: '2px solid var(--sura-azul-cielo)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div className="step-label" style={{ marginBottom: 0 }}>Paso 2 · toca la talla para agregar un par</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{sel.ref} · {sel.nombre} · {sel.color}</div>
                  <div style={{ fontSize: 13, color: 'var(--gris-500)', marginTop: 2 }}>{cop(sel.precio)} por par · toca la talla o usa + y − para ajustar los pares</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setState({ selRef: null })}>Cambiar modelo</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {data.tallas.map((t) => (
                  <div
                    key={t.talla}
                    onClick={() => addCarrito(sel.ref, t.talla, 1)}
                    style={{
                      width: 108, borderRadius: 12, padding: 12, cursor: 'pointer', userSelect: 'none',
                      border: '1px solid ' + (t.enCarrito ? 'var(--sura-azul-cielo)' : 'var(--sura-azul-divider)'),
                      background: t.enCarrito ? 'var(--sura-azul-tint)' : 'var(--sura-azul-tint-light)',
                      opacity: t.stock === 0 ? 0.55 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{t.talla}</span>
                      <span className="tabular" style={{ fontSize: 12, fontWeight: 700, color: t.stock === 0 ? 'var(--danger-1)' : t.stock < 6 ? 'var(--warning-1)' : 'var(--gris-350)' }}>{t.stock}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gris-350)', margin: '2px 0 10px' }}>pares en bodega</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button className="btn-round sub" title="Quitar un par" onClick={(e) => { e.stopPropagation(); addCarrito(sel.ref, t.talla, -1); }}>−</button>
                      <div className="tabular" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{t.enCarrito}</div>
                      <button className="btn-round add" title="Agregar un par" onClick={(e) => { e.stopPropagation(); addCarrito(sel.ref, t.talla, 1); }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sel && !porTalla(sel) && (
            <div className="card" style={{ border: '2px solid var(--sura-azul-cielo)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0 }}>
                <div className="step-label" style={{ marginBottom: 0 }}>Paso 2 · cuántas unidades</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{sel.ref} · {sel.nombre} · {sel.color}</div>
                <div style={{ fontSize: 13, color: 'var(--gris-500)', marginTop: 2 }}>{cop(sel.precio)} por unidad · {paresDe(sel)} {unidadTxt(sel)} en bodega</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 14px' }}>
                <button className="btn-round xl sub" onClick={() => addCarrito(sel.ref, null, -1)}>−</button>
                <div className="tabular" style={{ minWidth: 56, textAlign: 'center', fontSize: 26, fontWeight: 700 }}>{data.enCarrito(sel.ref, null)}</div>
                <button className="btn-round xl add" onClick={() => addCarrito(sel.ref, null, 1)}>+</button>
                <button className="btn btn-outline btn-sm" onClick={() => setState({ selRef: null })}>Cambiar producto</button>
              </div>
            </div>
          )}

          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 12px', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: '1 1 240px', minWidth: 0, position: 'relative' }}>
                <input
                  className="input" value={s.q} onChange={(e) => setState({ q: e.target.value })}
                  placeholder="Paso 1 · escribe la referencia o el nombre del producto"
                  style={{ paddingLeft: 40 }}
                />
                <span style={{ position: 'absolute', left: 14, top: 13 }}><SearchIcon /></span>
              </div>
              {s.q.length > 0 && (
                <button className="btn btn-outline btn-sm" onClick={() => setState({ q: '', filtroVenta: 'todos' })}>Limpiar</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              {data.filtros.map(([key, label]) => (
                <Pill key={key} prof active={s.filtroVenta === key} onClick={() => setState({ filtroVenta: key })}>{label}</Pill>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 13, color: 'var(--gris-350)', whiteSpace: 'nowrap' }}>{data.disponibles.length} de {data.activosCount} modelos</div>
            </div>

            <div style={{ maxHeight: 384, overflowY: 'auto', border: '1px solid var(--sura-azul-divider)', borderRadius: 12 }}>
              {data.disponibles.map((m, idx) => {
                const pares = paresDe(m);
                const activo = s.selRef === m.ref;
                return (
                  <div
                    key={m.ref}
                    onClick={() => setState({ selRef: m.ref })}
                    style={{
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', padding: '11px 14px',
                      cursor: 'pointer', userSelect: 'none',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--sura-azul-divider)',
                      background: activo ? 'var(--sura-azul-tint)' : 'var(--sura-blanco)',
                      opacity: pares === 0 ? 0.55 : 1,
                    }}
                  >
                    <span style={{ flex: '1 1 190px', minWidth: 0, display: 'grid', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>{m.nombre}</span>
                      <span style={{ fontSize: 12, color: 'var(--gris-500)' }}><span className="mono" style={{ color: 'var(--sura-azul-prof)' }}>{m.ref}</span> · {m.tipo} · {m.color}</span>
                    </span>
                    <span className="tabular" style={{ flex: '0 0 auto', textAlign: 'right', fontSize: 13, color: pares === 0 ? 'var(--danger-1)' : pares <= m.min ? 'var(--warning-1)' : 'var(--gris-500)', whiteSpace: 'nowrap' }}>
                      {pares === 0 ? 'agotado' : pares + ' ' + unidadTxt(m)}
                    </span>
                    <span className="tabular" style={{ flex: '0 0 auto', textAlign: 'right', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>{cop(m.precio)}</span>
                    <span style={{ flex: '0 0 auto', minWidth: 76, textAlign: 'center', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, border: '1px solid ' + (activo ? 'var(--sura-azul-cielo)' : 'var(--gris-300)'), background: activo ? 'var(--sura-azul-cielo)' : 'var(--sura-blanco)', color: activo ? 'var(--sura-blanco)' : 'var(--gris-500)' }}>
                      {activo ? 'Elegido' : 'Elegir'}
                    </span>
                  </div>
                );
              })}
              {data.disponibles.length === 0 && (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 14, color: 'var(--gris-350)' }}>
                  No encontramos modelos con esa búsqueda. Revisa la referencia o limpia los filtros.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 320px', minWidth: 0, maxWidth: 420, position: 'sticky', top: 84 }}>
          <div className="card-title">Carrito</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {s.carrito.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 10px', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--sura-azul-divider)' }}>
                <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-500)' }}>{(c.talla ? 'Talla ' + c.talla : 'Por unidad') + ' · ' + cop(c.precio) + ' / ' + (c.unidad === 'unidad' ? 'unidad' : 'par')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn-round sub" style={{ width: 24, height: 24 }} onClick={() => addCarrito(c.ref, c.talla, -1)}>−</button>
                  <div className="tabular" style={{ minWidth: 22, textAlign: 'center', fontWeight: 700 }}>{c.pares}</div>
                  <button className="btn-round add" style={{ width: 24, height: 24 }} onClick={() => addCarrito(c.ref, c.talla, 1)}>+</button>
                </div>
                <div className="tabular" style={{ flex: '0 0 auto', marginLeft: 'auto', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{cop(c.pares * c.precio)}</div>
                <button className="btn-ghost-x" title="Quitar" style={{ color: 'var(--danger-1)', fontSize: 16 }} onClick={() => setState({ carrito: s.carrito.filter((x) => !(x.ref === c.ref && x.talla === c.talla)) })}>×</button>
              </div>
            ))}
          </div>
          {s.carrito.length === 0 && <div className="empty-row" style={{ padding: '12px 0 20px' }}>Agrega productos desde el catálogo.</div>}

          <div style={{ display: 'grid', gap: 8, padding: '14px 0', borderTop: '1px dashed var(--gris-300)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--gris-500)' }}>{s.carrito.some((c) => c.unidad === 'unidad') ? 'Pares / unidades' : 'Pares totales'}</span>
              <span className="tabular" style={{ fontWeight: 700 }}>{data.carritoPares}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--gris-500)' }}>Subtotal</span>
              <span className="tabular" style={{ fontWeight: 700 }}>{cop(data.carritoTotal)}</span>
            </div>
          </div>

          <div className="step-label" style={{ margin: '6px 0 8px' }}>Forma de pago</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {METODOS.map((m) => (
              <Pill key={m} active={s.metodo === m} onClick={() => setState({ metodo: m })} style={{ width: '100%', textAlign: 'left', padding: '10px 16px' }}>{m}</Pill>
            ))}
          </div>
          <input className="input" style={{ marginBottom: 14 }} value={s.cliente} onChange={(e) => setState({ cliente: e.target.value })} placeholder="Cliente (opcional)" />
          <button className="btn btn-cta" style={{ width: '100%', padding: 14, fontSize: 15 }} disabled={s.carrito.length === 0} onClick={cobrar}>
            Cobrar y facturar · {cop(data.carritoTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
