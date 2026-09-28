import { useMemo } from 'react';
import { useApp } from '../../state/store';
import { cop } from '../../lib/format';
import { BoxIcon } from '../Icons';

const TIPOS_BASE = ['Suelas', 'Plantillas', 'Tacones', 'Pegantes', 'Hilos y adornos', 'Herrajes', 'Cordones', 'Insumos'];
const CON_TALLA = ['Suelas', 'Plantillas', 'Tacones'];

export default function ModeloModal() {
  const { state, setState, close, guardarModelo, toast } = useApp();
  const s = state;
  const f = s.form;

  const data = useMemo(() => {
    const tiposLista = TIPOS_BASE.slice();
    s.modelos.forEach((m) => { if (m.tipo && !tiposLista.includes(m.tipo)) tiposLista.push(m.tipo); });
    (s.tiposExtra || []).forEach((t) => { if (!tiposLista.includes(t)) tiposLista.push(t); });
    const ocultos = s.tiposOcultos || [];
    const tipos = tiposLista.filter((t) => !ocultos.includes(t));
    const enUso = {};
    s.modelos.forEach((m) => { if (m.tipo) enUso[m.tipo] = (enUso[m.tipo] || 0) + 1; });
    return { tipos, enUso };
  }, [s.modelos, s.tiposExtra, s.tiposOcultos]);

  if (!f) return null;
  const setForm = (patch) => setState({ form: { ...s.form, ...(typeof patch === 'function' ? patch(s.form) : patch) } });
  const setF = (k, v) => setForm({ [k]: v });
  const digits = (v) => v.replace(/[^0-9]/g, '');

  const fPorTalla = f.unidad !== 'unidad';
  const fStock = fPorTalla ? f.tallas.reduce((a, t) => a + (Number(t.pares) || 0), 0) : Number(f.stock) || 0;
  const fUtil = (Number(f.precio) || 0) - (Number(f.costo) || 0);
  const resumenLineas = [
    { label: fPorTalla ? 'Tallas cargadas' : 'Presentación', valor: fPorTalla ? String(f.tallas.length) : 'Por unidad', color: 'var(--gris-900)' },
    { label: fPorTalla ? 'Pares totales' : 'Unidades', valor: fStock.toLocaleString('es-CO'), color: 'var(--gris-900)' },
    { label: 'Precio', valor: cop(Number(f.precio) || 0), color: 'var(--gris-900)' },
    { label: 'Utilidad', valor: cop(fUtil), color: fUtil > 0 ? 'var(--success-1)' : fUtil < 0 ? 'var(--danger-1)' : 'var(--gris-350)' },
    { label: 'Valor en bodega', valor: cop(fStock * (Number(f.costo) || 0)), color: 'var(--gris-900)' },
  ];
  const formTitulo = f.original ? 'Actualizar ' + f.original : 'Nuevo producto';
  const formCta = f.original ? 'Guardar cambios' : 'Crear producto';

  const eliminarTipo = (t, ev) => {
    ev.stopPropagation();
    if (data.enUso[t]) { toast('No se puede eliminar: ' + data.enUso[t] + ' producto(s) usan "' + t + '"'); return; }
    setState({
      tiposExtra: (s.tiposExtra || []).filter((x) => x !== t),
      tiposOcultos: (s.tiposOcultos || []).concat(t),
      form: { ...s.form, tipo: s.form.tipo === t ? '' : s.form.tipo },
    });
    toast('Tipo "' + t + '" eliminado');
  };

  const addTalla = () => {
    const t = s.nuevaTalla.trim();
    if (!t || f.tallas.some((x) => x.talla === t)) { toast('Talla inválida o repetida'); return; }
    setForm({ tallas: f.tallas.concat([{ talla: t, pares: '0' }]).sort((a, b) => Number(a.talla) - Number(b.talla)) });
    setState({ nuevaTalla: '' });
  };

  const addTipo = () => {
    const t = (s.nuevoTipo || '').trim();
    if (!t) { toast('Escribe el nombre del tipo'); return; }
    const extra = (s.tiposExtra || []).slice();
    if (!data.tipos.includes(t)) extra.push(t);
    setState({ tiposExtra: extra, tiposOcultos: (s.tiposOcultos || []).filter((x) => x !== t), nuevoTipo: '', form: { ...s.form, tipo: t, unidad: 'unidad' } });
    toast('Tipo "' + t + '" agregado');
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head-dark">
          <div className="modal-icon"><BoxIcon /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{formTitulo}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Suelas, plantillas, pegantes, herrajes: todo lo que se vende en el local.</div>
          </div>
          <button className="modal-close" title="Cerrar" onClick={close}>×</button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 16, padding: 'clamp(12px, 3vw, 20px)', alignItems: 'flex-start' }}>
          <div style={{ flex: '3 1 380px', minWidth: 0, display: 'grid', gap: 16 }}>

            <div>
              <div className="step-label">1 · Tipo de producto</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {data.tipos.map((t) => (
                  <span
                    key={t}
                    onClick={() => setForm({ tipo: t, unidad: CON_TALLA.includes(t) ? 'par' : 'unidad' })}
                    className="pill prof" data-active={f.tipo === t ? 'true' : 'false'}
                    style={{ padding: '8px 6px 8px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {t}
                    <button
                      title="Eliminar tipo" onClick={(ev) => eliminarTipo(t, ev)}
                      className="btn-ghost-x" style={{ fontSize: 15, padding: '0 6px', color: f.tipo === t ? 'var(--sura-blanco)' : 'var(--gris-350)' }}
                    >×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <input className="input dashed" style={{ flex: '1 1 200px', minWidth: 0, fontSize: 13, padding: '9px 12px' }} value={s.nuevoTipo || ''} onChange={(e) => setState({ nuevoTipo: e.target.value })} placeholder="Crear otro tipo: cremalleras, tintes…" />
                <button className="btn btn-outline-prof btn-sm" onClick={addTipo}>Agregar tipo</button>
              </div>
            </div>

            <div>
              <div className="step-label">2 · Cómo se vende</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { key: 'par', label: 'Por pares con talla', desc: 'Suelas, plantillas, tacones' },
                  { key: 'unidad', label: 'Por unidad', desc: 'Cordones, pegantes, hilos, herrajes' },
                ].map((u) => (
                  <button
                    key={u.key} onClick={() => setF('unidad', u.key)}
                    style={{ flex: '1 1 190px', textAlign: 'left', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', border: '2px solid ' + (f.unidad === u.key ? 'var(--sura-azul-cielo)' : 'var(--sura-azul-divider)'), background: f.unidad === u.key ? 'var(--sura-azul-tint)' : 'var(--sura-blanco)' }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{u.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--gris-500)', marginTop: 2 }}>{u.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="step-label">3 · Datos del producto</div>
              <div className="grid grid-fields">
                <label className="field"><span className="field-label">Referencia</span><input className="input mono" value={f.ref} onChange={(e) => setF('ref', e.target.value)} placeholder="SU-101" /></label>
                <label className="field" style={{ gridColumn: '1 / -1' }}><span className="field-label">Nombre</span><input className="input" value={f.nombre} onChange={(e) => setF('nombre', e.target.value)} placeholder="Suela Clásica Ranger" /></label>
                <label className="field"><span className="field-label">Color</span><input className="input" value={f.color} onChange={(e) => setF('color', e.target.value)} placeholder="Negro" /></label>
                <label className="field"><span className="field-label">Costo {fPorTalla ? 'por par (COP)' : 'por unidad (COP)'}</span><input className="input right" value={f.costo} onChange={(e) => setF('costo', digits(e.target.value))} placeholder="0" /></label>
                <label className="field"><span className="field-label">Precio {fPorTalla ? 'por par (COP)' : 'por unidad (COP)'}</span><input className="input right" value={f.precio} onChange={(e) => setF('precio', digits(e.target.value))} placeholder="0" /></label>
              </div>
            </div>

            <div>
              <div className="step-label">4 · Existencias y stock mínimo</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'center', background: 'var(--sura-azul-tint-light)', border: '1px solid var(--sura-azul-divider)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ flex: '1 1 170px', minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Stock mínimo</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-500)' }}>Avisa cuando queden {Number(f.min) || 0} {fPorTalla ? 'pares' : 'unidades'} o menos</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn-round lg sub" onClick={() => setF('min', String(Math.max(0, (Number(f.min) || 0) - 1)))}>−</button>
                  <input className="input right" style={{ width: 72, padding: '8px 10px', fontSize: 15 }} value={f.min} onChange={(e) => setF('min', digits(e.target.value))} placeholder="10" />
                  <button className="btn-round lg add" onClick={() => setF('min', String((Number(f.min) || 0) + 1))}>+</button>
                </div>
              </div>

              {!fPorTalla && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input className="input right" style={{ width: 150, fontSize: 16, padding: '11px 12px' }} value={f.stock} onChange={(e) => setF('stock', digits(e.target.value))} placeholder="0" />
                  <span style={{ fontSize: 13, color: 'var(--gris-500)' }}>unidades en bodega</span>
                </div>
              )}

              {fPorTalla && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' }}>
                  {f.tallas.map((t, idx) => (
                    <div key={idx} style={{ width: 92, border: '1px solid var(--sura-azul-divider)', borderRadius: 14, padding: 10, background: 'var(--sura-azul-tint-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Talla {t.talla}</span>
                        <button title="Quitar talla" className="btn-ghost-x" style={{ color: 'var(--danger-1)', fontSize: 15 }} onClick={() => setForm({ tallas: f.tallas.filter((_, i) => i !== idx) })}>×</button>
                      </div>
                      <input
                        className="input right" style={{ padding: '7px 9px', fontSize: 14 }} value={t.pares}
                        onChange={(e) => { const arr = f.tallas.slice(); arr[idx] = { talla: t.talla, pares: digits(e.target.value) }; setForm({ tallas: arr }); }}
                      />
                    </div>
                  ))}
                  <div style={{ width: 92, display: 'grid', gap: 6 }}>
                    <input className="input dashed" style={{ fontSize: 13, padding: 9, textAlign: 'center' }} value={s.nuevaTalla} onChange={(e) => setState({ nuevaTalla: digits(e.target.value) })} placeholder="Talla" />
                    <button className="btn btn-outline-prof" style={{ padding: '7px 10px', fontSize: 12 }} onClick={addTalla}>Agregar talla</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: '1 1 220px', minWidth: 0, background: 'var(--sura-azul-tint-light)', border: '1px solid var(--sura-azul-divider)', borderRadius: 16, padding: 14 }}>
            <div className="step-label">Resumen</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{f.nombre.trim() || 'Producto sin nombre'}</div>
            <div style={{ fontSize: 12, color: 'var(--gris-500)', marginBottom: 16 }}>{(f.tipo || 'Sin tipo') + (f.color ? ' · ' + f.color : '') + (f.ref ? ' · ' + f.ref.toUpperCase() : '')}</div>
            <div className="kv-list">
              {resumenLineas.map((l, i) => (
                <div className="kv-row" key={i} style={{ borderBottom: '1px solid var(--sura-azul-divider)' }}>
                  <span className="k">{l.label}</span><span className="dots" /><span className="v" style={{ color: l.color }}>{l.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>{fPorTalla ? 'El stock se lleva talla por talla, siempre en pares.' : 'El stock se lleva como unidades sueltas.'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={close}>Cancelar</button>
            <button className="btn btn-cta" onClick={guardarModelo}>{formCta}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
