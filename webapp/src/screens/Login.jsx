import { useApp } from '../state/store';
import { LogoIcon } from '../components/Icons';

const PERFILES = [
  { nombre: 'Ana Márquez', desc: 'Administradora · ve y edita todo', iniciales: 'AM', role: 'admin', screen: 'panel', avatarBg: 'var(--sura-azul-prof)' },
  { nombre: 'Carlos Rueda', desc: 'Vendedor · registra ventas y consulta stock', iniciales: 'CR', role: 'vendedor', screen: 'venta', avatarBg: 'var(--sura-azul-cielo)' },
];

export default function Login() {
  const { login } = useApp();
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, var(--sura-azul-oscuro) 0%, var(--sura-azul-prof) 100%)', padding: 40 }}>
      <div style={{ width: 460, maxWidth: '100%', background: 'var(--sura-blanco)', borderRadius: 16, padding: 'clamp(20px, 5vw, 36px)', boxShadow: '0 24px 60px rgba(0,0,51,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--sura-azul-cielo)', display: 'grid', placeItems: 'center' }}>
            <LogoIcon />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>Peletería El Progreso</div>
            <div style={{ fontSize: 13, color: 'var(--gris-350)' }}>Inventario y ventas de suelas · Bucaramanga</div>
          </div>
        </div>
        <div className="step-label" style={{ marginBottom: 12 }}>Entra con tu perfil</div>
        <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
          {PERFILES.map((p) => (
            <button
              key={p.nombre}
              onClick={() => login(p.role, p.nombre, p.screen)}
              style={{ width: '100%', border: '1px solid var(--sura-azul-divider)', background: 'var(--sura-azul-tint-light)', borderRadius: 16, padding: 16, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 999, background: p.avatarBg, color: 'var(--sura-blanco)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15 }}>{p.iniciales}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>{p.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gris-350)', lineHeight: 1.5 }}>
          Los datos de inventario y ventas se guardan en este navegador.
        </div>
      </div>
    </div>
  );
}
