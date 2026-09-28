import { useApp } from '../../state/store';
import { cop, fecha, hhmm } from '../../lib/format';

export default function FacturaModal() {
  const { state, close } = useApp();
  const v = state.factura;
  if (!v) return null;
  const pares = v.items.reduce((a, i) => a + i.pares, 0);
  const soloUnidad = v.items.every((i) => i.unidad === 'unidad');

  return (
    <div className="modal-overlay" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
        <div id="tirilla" style={{ width: 302, background: 'var(--sura-blanco)', padding: '20px 18px', fontFamily: "'SF Mono', ui-monospace, monospace", fontSize: 12, color: 'var(--gris-900)', lineHeight: 1.45, boxShadow: '0 20px 50px rgba(0,0,63,0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Sura Sans', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>PELETERÍA EL PROGRESO</div>
            <div>NIT 901.442.118-3</div>
            <div>Cra 15 # 34-22, Bucaramanga</div>
            <div>Tel. 607 645 2210</div>
          </div>
          <div style={{ borderTop: '1px dashed var(--gris-900)', borderBottom: '1px dashed var(--gris-900)', padding: '8px 0', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Factura</span><span>{v.id}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fecha</span><span>{fecha(v.fecha)} {hhmm(v.fecha)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Vendedor</span><span>{v.vendedor}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cliente</span><span>{v.cliente || 'Consumidor final'}</span></div>
          </div>
          <div style={{ display: 'flex', fontWeight: 700, borderBottom: '1px dashed var(--gris-900)', paddingBottom: 4, marginBottom: 6 }}>
            <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
            <span style={{ width: 42, textAlign: 'right' }}>CANT.</span>
            <span style={{ width: 62, textAlign: 'right' }}>TOTAL</span>
          </div>
          {v.items.map((it, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex' }}>
                <span style={{ flex: 1 }}>{it.nombre}</span>
                <span style={{ width: 42, textAlign: 'right', fontWeight: 700 }}>{it.pares}</span>
                <span style={{ width: 62, textAlign: 'right' }}>{cop(it.pares * it.precio)}</span>
              </div>
              <div style={{ color: 'var(--gris-500)' }}>
                {it.ref + (it.talla ? ' · talla ' + it.talla : '') + ' · ' + it.pares + ' ' + (it.unidad === 'unidad' ? (it.pares === 1 ? 'unidad' : 'unidades') : (it.pares === 1 ? 'par' : 'pares')) + ' × ' + cop(it.precio)}
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--gris-900)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{soloUnidad ? 'TOTAL ARTÍCULOS' : 'TOTAL PARES'}</span><span>{pares}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 4 }}><span>TOTAL</span><span>{cop(v.total)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>Forma de pago</span><span>{v.metodo}</span></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--gris-900)' }}>
            <div>Precios en pesos colombianos.</div>
            <div>Cambios dentro de 8 días con esta tirilla.</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>¡Gracias por su compra!</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ border: '1px solid var(--sura-blanco)', color: 'var(--sura-blanco)', background: 'transparent' }} onClick={close}>Cerrar</button>
          <button className="btn btn-cta" onClick={() => window.print()}>Imprimir tirilla 80mm</button>
        </div>
      </div>
    </div>
  );
}
