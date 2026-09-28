import { useMemo } from 'react';
import { useApp } from '../../state/store';
import { cop, esHoy, fecha, paresDe, unidadTxt } from '../../lib/format';
import { FileIcon } from '../Icons';

export default function CorreoPreviewModal() {
  const { state, setState, close, activos, stockTotal } = useApp();
  const s = state;

  const data = useMemo(() => {
    const hoyVentas = s.ventas.filter((v) => esHoy(v.fecha) && !v.devuelta);
    const hoyAgg = {
      total: hoyVentas.reduce((a, v) => a + v.total, 0),
      pares: hoyVentas.reduce((a, v) => a + v.items.reduce((x, i) => x + i.pares, 0), 0),
    };
    const mailInv = activos().map((m) => {
      const vend = hoyVentas.reduce((a, v) => a + v.items.filter((i) => i.ref === m.ref).reduce((x, i) => x + i.pares, 0), 0);
      return { nombre: m.ref + ' · ' + m.nombre, vendidos: vend, quedan: paresDe(m) + ' ' + unidadTxt(m) };
    });
    return { hoyAgg, mailInv };
  }, [s.ventas, activos]);

  const hoyIso = new Date().toISOString();
  const mailAsunto = 'Reporte del día · Peletería El Progreso · ' + fecha(hoyIso);
  const mailPdf = 'cierre-' + hoyIso.slice(0, 10) + '.pdf';

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box md" onClick={(e) => e.stopPropagation()}>
        <div style={{ background: 'var(--sura-azul-oscuro)', color: 'var(--sura-blanco)', padding: 'clamp(16px, 4vw, 20px) clamp(16px, 4vw, 28px)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.75 }}>Vista previa del correo automático</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{mailAsunto}</div>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--gris-500)', paddingBottom: 16, borderBottom: '1px solid var(--sura-azul-divider)', marginBottom: 18 }}>
            <div><strong style={{ color: 'var(--gris-900)' }}>Para:</strong> {s.correos.join(', ')}</div>
            <div><strong style={{ color: 'var(--gris-900)' }}>Envío:</strong> automático a las {s.hora}</div>
          </div>
          <div style={{ border: '1px solid var(--sura-azul-divider)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: 'var(--sura-azul-oscuro)', color: 'var(--sura-blanco)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileIcon />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{mailPdf}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>PDF adjunto · cierre del {fecha(hoyIso)}</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div className="grid grid-fields" style={{ marginBottom: 16 }}>
                <div style={{ background: 'var(--sura-azul-tint-light)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--sura-azul-prof)', fontWeight: 700 }}>Vendido</div>
                  <div className="tabular" style={{ fontSize: 20, fontWeight: 700 }}>{cop(data.hoyAgg.total)}</div>
                </div>
                <div style={{ background: 'var(--sura-azul-tint-light)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--sura-azul-prof)', fontWeight: 700 }}>Pares</div>
                  <div className="tabular" style={{ fontSize: 20, fontWeight: 700 }}>{data.hoyAgg.pares}</div>
                </div>
                <div style={{ background: 'var(--sura-azul-tint-light)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--sura-azul-prof)', fontWeight: 700 }}>En inventario</div>
                  <div className="tabular" style={{ fontSize: 20, fontWeight: 700 }}>{stockTotal().toLocaleString('es-CO')}</div>
                </div>
              </div>
              <div className="step-label">Inventario al cierre</div>
              <div className="kv-list">
                {data.mailInv.map((m, i) => (
                  <div className="kv-row" key={i}>
                    <span style={{ flex: '1 1 150px', minWidth: 0 }}>{m.nombre}</span>
                    <span className="dots" />
                    <span style={{ color: 'var(--gris-500)' }}>vendidos {m.vendidos}</span>
                    <span className="v" style={{ minWidth: 96, textAlign: 'right' }}>{m.quedan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-outline" onClick={close}>Cerrar</button>
            <button className="btn btn-cta" onClick={() => { close(); setState({ toast: 'Reporte enviado a ' + s.correos.length + ' destinatarios' }); }}>Enviar ahora</button>
          </div>
        </div>
      </div>
    </div>
  );
}
