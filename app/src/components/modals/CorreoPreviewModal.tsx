import { useMemo, useState } from 'react'
import { useUI } from '../../state/ui'
import { useProductos } from '../../hooks/useProductos'
import { useVentas } from '../../hooks/useVentas'
import { useDestinatarios, useRegistrarEnvioCorreo } from '../../hooks/useCorreo'
import { cop, esHoy, fecha, paresDe, unidadTxt } from '../../lib/format'
import { FileIcon } from '../Icons'
import { Btn } from '../ui'

export default function CorreoPreviewModal() {
  const { closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const { data: ventas = [] } = useVentas()
  const { data: destinatarios = [] } = useDestinatarios()
  const registrarEnvio = useRegistrarEnvioCorreo()
  const [enviando, setEnviando] = useState(false)

  const data = useMemo(() => {
    const hoyVentas = ventas.filter((v) => esHoy(v.fecha) && !v.devuelta)
    const hoyAgg = {
      total: hoyVentas.reduce((a, v) => a + v.total, 0),
      pares: hoyVentas.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'par').reduce((x, i) => x + i.pares, 0), 0),
      unidades: hoyVentas.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'unidad').reduce((x, i) => x + i.pares, 0), 0),
    }
    const activos = productos.filter((p) => !p.archivado)
    const stockTotal = activos.reduce((a, p) => a + paresDe(p), 0)
    const mailInv = activos.map((m) => {
      const vend = hoyVentas.reduce((a, v) => a + v.venta_items.filter((i) => i.ref === m.ref).reduce((x, i) => x + i.pares, 0), 0)
      return { nombre: m.ref + ' · ' + m.nombre, vendidos: vend, quedan: paresDe(m) + ' ' + unidadTxt(m) }
    })
    return { hoyAgg, stockTotal, mailInv }
  }, [ventas, productos])

  const hoyIso = new Date().toISOString()
  const mailAsunto = 'Reporte del día · Peletería El Progreso · ' + fecha(hoyIso)
  const mailPdf = 'cierre-' + hoyIso.slice(0, 10) + '.pdf'

  async function onEnviar() {
    const emails = destinatarios.map((d) => d.email.trim()).filter(Boolean)
    if (emails.length === 0) {
      showToast('Agrega al menos un destinatario antes de enviar')
      return
    }

    setEnviando(true)
    try {
      await registrarEnvio.mutateAsync({
        total: data.hoyAgg.total,
        pares: data.hoyAgg.pares,
        recipients: emails,
        snapshot: {
          fecha: hoyIso,
          destinatarios: emails,
          total: data.hoyAgg.total,
          pares: data.hoyAgg.pares,
          stockTotal: data.stockTotal,
          inventario: data.mailInv,
        },
      })
      closeModal()
      showToast('Reporte enviado a ' + emails.length + ' destinatario' + (emails.length === 1 ? '' : 's'))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo registrar el envío')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[90] grid place-items-center p-[clamp(8px,3vw,32px)] overflow-auto" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="w-[min(620px,100%)] max-h-[92vh] flex flex-col bg-sura-blanco rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-sura-azul-oscuro text-sura-blanco px-[clamp(16px,4vw,28px)] py-[clamp(16px,4vw,20px)]">
          <div className="text-xs uppercase tracking-wide opacity-75">Vista previa del correo automático</div>
          <div className="text-lg font-bold mt-1">{mailAsunto}</div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-[clamp(14px,3vw,20px)]">
          <div className="grid gap-1 text-[13px] text-gris-500 pb-4 border-b border-sura-azul-divider mb-[18px]">
            <div><strong className="text-gris-900">Para:</strong> {destinatarios.map((d) => d.email).join(', ') || '—'}</div>
            <div><strong className="text-gris-900">Envío:</strong> inmediato al pulsar el botón</div>
          </div>
          <div className="border border-sura-azul-divider rounded-2xl overflow-hidden mb-5">
            <div className="bg-sura-azul-oscuro text-sura-blanco px-[18px] py-3.5 flex items-center gap-2.5">
              <FileIcon />
              <div className="flex-1">
                <div className="text-sm font-bold">{mailPdf}</div>
                <div className="text-xs opacity-75">Snapshot adjunto · cierre del {fecha(hoyIso)}</div>
              </div>
            </div>
            <div className="p-[18px]">
              <div className="grid gap-3 mb-4 grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))]">
                <div className="bg-sura-azul-tint-light rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wide text-sura-azul-prof font-bold">Vendido</div>
                  <div className="text-xl font-bold tabular-nums">{cop(data.hoyAgg.total)}</div>
                </div>
                <div className="bg-sura-azul-tint-light rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wide text-sura-azul-prof font-bold">Pares</div>
                  <div className="text-xl font-bold tabular-nums">{data.hoyAgg.pares}</div>
                </div>
                <div className="bg-sura-azul-tint-light rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wide text-sura-azul-prof font-bold">Unidades</div>
                  <div className="text-xl font-bold tabular-nums">{data.hoyAgg.unidades}</div>
                </div>
                <div className="bg-sura-azul-tint-light rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wide text-sura-azul-prof font-bold">En inventario</div>
                  <div className="text-xl font-bold tabular-nums">{data.stockTotal.toLocaleString('es-CO')}</div>
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">Inventario al cierre</div>
              <div className="grid gap-0.5">
                {data.mailInv.map((m, i) => (
                  <div key={i} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] py-1.5 border-b border-gris-100">
                    <span className="flex-[1_1_150px] min-w-0">{m.nombre}</span>
                    <span className="flex-1 border-b border-dotted border-gris-300 -translate-y-0.5" />
                    <span className="text-gris-500">vendidos {m.vendidos}</span>
                    <span className="font-bold tabular-nums min-w-[96px] text-right">{m.quedan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <Btn onClick={closeModal}>Cerrar</Btn>
            <Btn variant="cta" disabled={enviando} onClick={() => void onEnviar()}>Enviar ahora</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
