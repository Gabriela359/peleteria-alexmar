import { useApp } from '../state/store';
import FacturaModal from './modals/FacturaModal';
import ModeloModal from './modals/ModeloModal';
import EntradaModal from './modals/EntradaModal';
import AjusteModal from './modals/AjusteModal';
import ConfirmModal from './modals/ConfirmModal';
import CorreoPreviewModal from './modals/CorreoPreviewModal';

export default function ModalRoot() {
  const { state } = useApp();
  return (
    <>
      {state.modal === 'factura' && <FacturaModal />}
      {state.modal === 'modelo' && <ModeloModal />}
      {state.modal === 'entrada' && <EntradaModal />}
      {state.modal === 'ajuste' && <AjusteModal />}
      {state.modal === 'correo' && <CorreoPreviewModal />}
      {/* El diálogo de confirmación puede aparecer sobre cualquier pantalla, no solo sobre un modal. */}
      {state.confirm && <ConfirmModal />}
    </>
  );
}
