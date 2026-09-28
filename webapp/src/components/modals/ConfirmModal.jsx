import { useApp } from '../../state/store';

export default function ConfirmModal() {
  const { state, setState, close, devolver } = useApp();
  const c = state.confirm;
  if (!c) return null;
  const esDel = c.tipo === 'del';
  const titulo = esDel ? 'Eliminar modelo' : 'Registrar devolución';
  const texto = esDel
    ? 'Vas a eliminar "' + (c.nombre || '') + '" del catálogo junto con todo su stock. Esta acción no se puede deshacer.'
    : 'Los pares de la factura ' + c.id + ' vuelven al inventario y la venta deja de sumar en los reportes.';
  const cta = esDel ? 'Eliminar' : 'Confirmar devolución';

  const onConfirmar = () => {
    if (esDel) {
      setState((s) => ({ modelos: s.modelos.filter((m) => m.ref !== c.ref), confirm: null, toast: 'Modelo eliminado' }));
    } else {
      devolver(c.id);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 95 }} onClick={close}>
      <div className="modal-box confirm" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, color: 'var(--danger-1)', margin: '0 0 8px' }}>{titulo}</h2>
        <div style={{ fontSize: 14, color: 'var(--gris-500)', lineHeight: 1.5, marginBottom: 24 }}>{texto}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-outline" onClick={close}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirmar}>{cta}</button>
        </div>
      </div>
    </div>
  );
}
