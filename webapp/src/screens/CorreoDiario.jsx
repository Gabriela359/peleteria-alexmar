import { useApp } from '../state/store';
import { cop, fecha } from '../lib/format';
import { Pill } from '../components/ui';

const HORAS = ['18:00', '19:00', '20:00'];

export default function CorreoDiario() {
  const { state, setState, toast } = useApp();
  const s = state;

  const addCorreo = () => {
    const v = s.nuevoCorreo.trim();
    if (!v.includes('@')) { toast('Escribe un correo válido'); return; }
    setState({ correos: s.correos.concat([v]), nuevoCorreo: '' });
    toast('Destinatario agregado');
  };

  const envios = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const t = s.ventas.filter((v) => !v.devuelta && new Date(v.fecha).toDateString() === d.toDateString()).reduce((a, v) => a + v.total, 0);
    envios.push({ fecha: fecha(d.toISOString()), total: cop(t) });
  }

  return (
    <div>
      <h1>Correo diario</h1>
      <div className="screen-sub" style={{ marginBottom: 20 }}>Cada noche sale un correo con el PDF del cierre: lo vendido, cuánto se facturó en pesos y cómo quedó el inventario.</div>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Destinatarios</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {s.correos.map((c) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sura-azul-tint)', border: '1px solid var(--sura-azul-chip)', borderRadius: 999, padding: '7px 12px 7px 14px', fontSize: 13 }}>
                {c}
                <button className="btn-ghost-x" style={{ color: 'var(--sura-azul-prof)', fontSize: 15 }} onClick={() => setState({ correos: s.correos.filter((x) => x !== c) })}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <input className="input" style={{ flex: '1 1 200px', minWidth: 0 }} value={s.nuevoCorreo} onChange={(e) => setState({ nuevoCorreo: e.target.value })} placeholder="correo@ejemplo.com" />
            <button className="btn btn-outline-prof" onClick={addCorreo}>Agregar</button>
          </div>
          <div className="card-title">Hora de envío</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {HORAS.map((h) => (
              <Pill key={h} active={s.hora === h} onClick={() => setState({ hora: h })}>{h}</Pill>
            ))}
          </div>
          <button className="btn btn-cta" onClick={() => setState({ modal: 'correo' })}>Ver y enviar prueba</button>
        </div>
        <div className="card">
          <div className="card-title">Últimos envíos</div>
          <div className="kv-list">
            {envios.map((e, i) => (
              <div className="kv-row" key={i} style={{ borderBottom: '1px solid var(--sura-azul-divider)' }}>
                <span className="k">{e.fecha}</span>
                <span className="dots" />
                <span className="v">{e.total}</span>
                <span style={{ color: 'var(--success-1)', fontSize: 12, fontWeight: 700 }}>Enviado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
