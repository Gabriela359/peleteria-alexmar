import { useApp } from '../../state/store';
import { porTalla, unidadTxt } from '../../lib/format';

const MOTIVOS = ['Conteo físico', 'Rotura', 'Muestra', 'Pérdida'];

export default function AjusteModal() {
  const { state, setState, close, activos, guardarAjuste } = useApp();
  const s = state;
  const a = s.ajuste;
  if (!a) return null;

  const ajModelo = s.modelos.find((m) => m.ref === a.ref);
  const ajPorTalla = ajModelo ? porTalla(ajModelo) : true;
  const ajusteTallas = ajModelo && ajPorTalla ? Object.keys(ajModelo.tallas).sort() : [];
  const ajActual = ajModelo ? (ajPorTalla ? (a.talla ? Number(ajModelo.tallas[a.talla]) : 0) : Number(ajModelo.stock || 0)) : 0;
  const ajDif = a.valor === '' ? null : Number(a.valor) - ajActual;
  const ajUn = ajModelo ? unidadTxt(ajModelo) : 'pares';
  const ajDonde = ajPorTalla ? 'en talla ' + a.talla : 'en existencia';
  const ajusteResumen = !ajModelo
    ? 'Elige el producto que vas a ajustar.'
    : ajDif === null
      ? 'Sistema: ' + ajActual + ' ' + ajUn + ' ' + ajDonde + '. Escribe cuántas contaste.'
      : 'Sistema ' + ajActual + ' → contado ' + a.valor + ' · diferencia ' + (ajDif > 0 ? '+' : '') + ajDif + ' ' + ajUn + ' por ' + a.motivo.toLowerCase() + '.';

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box xs" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, color: 'var(--sura-azul-prof)', margin: '0 0 4px' }}>Ajuste de inventario</h2>
        <div style={{ fontSize: 13, color: 'var(--gris-500)', marginBottom: 20 }}>Corrige el stock dejando el motivo por escrito.</div>

        <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
          <span className="field-label">Modelo</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {activos().map((m) => (
              <button
                key={m.ref} className="pill sm" data-active={a.ref === m.ref ? 'true' : 'false'}
                onClick={() => setState({ ajuste: { ...a, ref: m.ref, talla: porTalla(m) ? Object.keys(m.tallas)[0] : null, valor: '' } })}
              >{m.ref}</button>
            ))}
          </div>
        </div>

        {ajPorTalla && (
          <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
            <span className="field-label">Talla</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ajusteTallas.map((t) => (
                <button key={t} className="pill sm" data-active={a.talla === t ? 'true' : 'false'} onClick={() => setState({ ajuste: { ...a, talla: t } })}>
                  {t} ({ajModelo.tallas[t]})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-fields-lg" style={{ marginBottom: 14 }}>
          <label className="field">
            <span className="field-label">{(ajPorTalla ? 'Pares' : 'Unidades') + ' reales contadas'}</span>
            <input className="input right" value={a.valor} onChange={(e) => setState({ ajuste: { ...a, valor: e.target.value.replace(/[^0-9]/g, '') } })} />
          </label>
          <label className="field">
            <span className="field-label">Motivo</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MOTIVOS.map((m) => (
                <button key={m} className="pill prof sm" data-active={a.motivo === m ? 'true' : 'false'} onClick={() => setState({ ajuste: { ...a, motivo: m } })}>{m}</button>
              ))}
            </div>
          </label>
        </div>

        <div style={{ background: 'var(--sura-azul-tint)', border: '1px solid var(--sura-azul-chip)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--sura-azul-prof)', marginBottom: 18 }}>{ajusteResumen}</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 18, borderTop: '1px solid var(--sura-azul-divider)' }}>
          <button className="btn btn-outline" onClick={close}>Cancelar</button>
          <button className="btn btn-cta" onClick={guardarAjuste}>Guardar ajuste</button>
        </div>
      </div>
    </div>
  );
}
