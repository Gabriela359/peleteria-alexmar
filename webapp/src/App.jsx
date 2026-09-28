import { AppProvider, useApp } from './state/store';
import Login from './screens/Login';
import Header from './components/Header';
import Panel from './screens/Panel';
import Venta from './screens/Venta';
import Inventario from './screens/Inventario';
import Movimientos from './screens/Movimientos';
import Reportes from './screens/Reportes';
import Usuarios from './screens/Usuarios';
import CorreoDiario from './screens/CorreoDiario';
import ModalRoot from './components/ModalRoot';
import Toast from './components/Toast';

const SCREENS_ADMIN = {
  panel: Panel, venta: Venta, inventario: Inventario, movs: Movimientos,
  reportes: Reportes, usuarios: Usuarios, correo: CorreoDiario,
};
const SCREENS_VENDEDOR = {
  venta: Venta, inventario: Inventario, reportes: Reportes,
};

function AppShell() {
  const { state } = useApp();
  if (!state.role) return <Login />;

  const isAdmin = state.role === 'admin';
  const screens = isAdmin ? SCREENS_ADMIN : SCREENS_VENDEDOR;
  const Screen = screens[state.screen] || (isAdmin ? Panel : Venta);

  return (
    <div className="app-shell">
      <Header />
      <main className="main">
        <Screen />
      </main>
      <ModalRoot />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
