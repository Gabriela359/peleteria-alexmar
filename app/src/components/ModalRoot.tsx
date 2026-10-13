import { useUI } from '../state/ui'
import FacturaModal from './modals/FacturaModal'
import ModeloModal from './modals/ModeloModal'
import EntradaModal from './modals/EntradaModal'
import ConfirmModal from './modals/ConfirmModal'
import CorreoPreviewModal from './modals/CorreoPreviewModal'

export default function ModalRoot() {
  const { modal, confirm } = useUI()
  return (
    <>
      {modal === 'factura' && <FacturaModal />}
      {modal === 'modelo' && <ModeloModal />}
      {modal === 'entrada' && <EntradaModal />}
      {modal === 'correo' && <CorreoPreviewModal />}
      {/* El diálogo de confirmación puede aparecer sobre cualquier pantalla, no solo sobre un modal. */}
      {confirm && <ConfirmModal />}
    </>
  )
}
