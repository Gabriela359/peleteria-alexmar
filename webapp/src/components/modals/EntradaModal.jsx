import { useApp } from '../../state/store';
import { porTalla, unidadTxt, paresDe } from '../../lib/format';

export default function EntradaModal() {
  const { state, setState, close, activos, guardarEntrada } = useApp();
  const s = state;
  const e = s.entrada;
  if (!e) return null;

  const eModelo = s.modelos.find((m) => m.ref === e.ref);
  const ePorTalla = eModelo ? porTalla(eModelo) : true;
  const entradaTallas = eModelo && ePorTalla
    ? Object.keys(eModelo.tallas).sort().map((t) => ({ talla: t, actual: eModelo.tallas[t], valor: e.tallas[t] || '' }))
    : [];
  const entradaTotal = ePorTalla
    ? Object.keys(e.tallas).filter((k) => k !== '__u').reduce((a, k) => a + (Number(e.tallas[k]) || 0), 0)
    : Number(e.tallas.__u) || 0;
  const digits = (v) => v.replace(/[^0-9]/g, '');

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box sm" onClick={(ev) => ev.stopPropagation()}>
        <h2 style={{ fontSize: 20, color: 'var(--sura-azul-prof)', margin: '0 0 4px' }}>Entrada de mercancía</h2>
        <div style={{ fontSize: 13, color: 'var(--gris-500)', marginBottom: 20 }}>Registra lo que llegó del proveedor. Suma al stock del producto.</div>
        <div className="grid grid-fields-lg" style={{ marginBottom: 16 }}>
          <label className="field">
            <span className="field-label">Modelo</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activos().map((m) => (
                <button
                  key={m.ref} className="pill sm mono" data-active={e.ref === m.ref ? 'true' : 'false'}
                  onClick={() => setState({ entrada: { ref: m.ref, proveedor: e.proveedor, tallas: {} } })}
                >{m.ref}</button>
              ))}
            </div>
          </label>
          <label className="field"><span className="field-label">Proveedor</span>
            <input className="input" value={e.proveedor} onChange={(ev) => setState({ entrada: { ...e, proveedor: ev.target.value } })} placeholder="Suelas del Oriente S.A.S." />
          </label>
        </div>
        <div className="card-title">{ePorTalla ? 'Pares que entran por talla' : 'Unidades que entran'}</div>
        {!ePorTalla && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <input className="input right" style={{ width: 140, fontSize: 16 }} value={e.tallas.__u || ''} onChange={(ev) => setState({ entrada: { ...e, tallas: { __u: digits(ev.target.value) } } })} placeholder="0" />
            <span style={{ fontSize: 13, color: 'var(--gris-500)' }}>{eModelo ? 'hoy hay ' + paresDe(eModelo) + ' ' + unidadTxt(eModelo) : ''}</span>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          {entradaTallas.map((t) => (
            <div key={t.talla} style={{ width: 84, border: '1px solid var(--sura-azul-divider)', borderRadius: 12, padding: 10, background: 'var(--sura-azul-tint-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Talla {t.talla}</div>
              <div style={{ fontSize: 11, color: 'var(--gris-350)', marginBottom: 6 }}>hoy {t.actual}</div>
              <input
                className="input" style={{ padding: '7px 9px', fontSize: 14, textAlign: 'right' }} value={t.valor}
                onChange={(ev) => setState({ entrada: { ...e, tallas: { ...e.tallas, [t.talla]: digits(ev.target.value) } } })}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--sura-azul-divider)' }}>
          <div style={{ fontSize: 14, color: 'var(--gris-500)' }}>Total a ingresar: <strong style={{ fontSize: 18, color: 'var(--gris-900)' }}>{entradaTotal} {eModelo ? unidadTxt(eModelo) : 'pares'}</strong></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={close}>Cancelar</button>
            <button className="btn btn-cta" onClick={guardarEntrada}>Registrar entrada</button>
          </div>
        </div>
      </div>
    </div>
  );
}
