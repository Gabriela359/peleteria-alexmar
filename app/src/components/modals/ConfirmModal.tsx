import { useState } from 'react'
import { useUI } from '../../state/ui'
import { useEliminarProducto } from '../../hooks/useProductos'
import { useRegistrarDevolucion } from '../../hooks/useVentas'
import { Btn } from '../ui'

export default function ConfirmModal() {
  const { confirm, closeModal, showToast } = useUI()
  const eliminar = useEliminarProducto()
  const devolver = useRegistrarDevolucion()
  const [enviando, setEnviando] = useState(false)
  if (!confirm) return null

  const esDel = confirm.tipo === 'del'
  const titulo = esDel ? 'Eliminar modelo' : 'Registrar devolución'
  const texto = esDel
    ? `Vas a eliminar "${confirm.nombre ?? ''}" del catálogo junto con todo su stock. Esta acción no se puede deshacer.`
    : `Los pares de la factura ${confirm.id} vuelven al inventario y la venta deja de sumar en los reportes.`
  const cta = esDel ? 'Eliminar' : 'Confirmar devolución'

  async function onConfirmar() {
    if (!confirm) return
    setEnviando(true)
    try {
      if (esDel && confirm.ref) {
        await eliminar.mutateAsync(confirm.ref)
        showToast('Modelo eliminado')
      } else if (confirm.id) {
        await devolver.mutateAsync(confirm.id)
        showToast('Devolución registrada')
      }
      closeModal()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo completar la acción')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[95] grid place-items-center p-[clamp(8px,3vw,32px)]" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="w-[min(440px,100%)] max-h-[92vh] overflow-y-auto bg-sura-blanco rounded-2xl p-[clamp(16px,4vw,28px)] shadow-2xl">
        <h2 className="text-xl text-danger-1 m-0 mb-2">{titulo}</h2>
        <div className="text-sm text-gris-500 leading-relaxed mb-6">{texto}</div>
        <div className="flex justify-end gap-2.5">
          <Btn onClick={closeModal}>Cancelar</Btn>
          <Btn variant="danger" disabled={enviando} onClick={() => void onConfirmar()}>{cta}</Btn>
        </div>
      </div>
    </div>
  )
}
