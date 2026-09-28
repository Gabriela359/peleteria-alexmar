import { useApp } from '../state/store';
import { LogoIcon } from './Icons';

const NAV_ADMIN = [
  ['panel', 'Panel'], ['venta', 'Nueva venta'], ['inventario', 'Inventario'],
  ['movs', 'Movimientos'], ['reportes', 'Reportes'], ['usuarios', 'Usuarios'], ['correo', 'Correo diario'],
];
const NAV_VENDEDOR = [
  ['venta', 'Nueva venta'], ['inventario', 'Inventario'], ['reportes', 'Mis ventas'],
];

export default function Header() {
  const { state, setScreen, logout } = useApp();
  const isAdmin = state.role === 'admin';
  const nav = isAdmin ? NAV_ADMIN : NAV_VENDEDOR;

  return (
    <header className="topbar">
      <div className="brand"><LogoIcon size={22} /> Peletería El Progreso</div>
      <nav className="topnav">
        {nav.map(([key, label]) => (
          <button key={key} data-active={state.screen === key ? 'true' : 'false'} onClick={() => setScreen(key)}>{label}</button>
        ))}
      </nav>
      <div className="user-box">
        <div className="who">
          <div className="name">{state.user}</div>
          <div className="role">{isAdmin ? 'Administrador' : 'Vendedor'}</div>
        </div>
        <button className="btn-logout" onClick={logout}>Salir</button>
      </div>
    </header>
  );
}
