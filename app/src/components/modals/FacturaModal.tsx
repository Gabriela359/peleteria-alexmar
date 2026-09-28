import { useUI } from '../../state/ui'
import { cop, fecha, hhmm } from '../../lib/format'
import { contarUnidadesVenta } from '../../lib/ventasCaja.js'
import type { VentaConItems } from '../../types/database'
import { Btn } from '../ui'

export default function FacturaModal() {
  const { modalPayload, closeModal } = useUI()
  const v = modalPayload as VentaConItems | null
  if (!v) return null
  const cantidades = contarUnidadesVenta(v.venta_items)
  const pares = cantidades.pares
  const unidades = cantidades.unidades
  const soloUnidad = v.venta_items.every((i) => i.unidad === 'unidad')

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[90] grid place-items-center p-[clamp(8px,3vw,32px)] overflow-auto" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="grid gap-4 justify-items-center">
        <div id="tirilla" className="w-[302px] bg-sura-blanco px-[18px] py-5 font-mono text-xs text-gris-900 leading-[1.45] shadow-2xl">
          <div className="text-center mb-2.5">
            <div className="font-display text-[15px] font-bold tracking-wide">PELETERÍA EL PROGRESO</div>
            <div>NIT 901.442.118-3</div>
            <div>Cra 15 # 34-22, Bucaramanga</div>
            <div>Tel. 607 645 2210</div>
          </div>
          <div className="border-t border-b border-dashed border-gris-900 py-2 mb-2">
            <div className="flex justify-between"><span>Factura</span><span>{v.id}</span></div>
            <div className="flex justify-between"><span>Fecha</span><span>{fecha(v.fecha)} {hhmm(v.fecha)}</span></div>
            <div className="flex justify-between"><span>Vendedor</span><span>{v.vendedor_nombre}</span></div>
            <div className="flex justify-between"><span>Cliente</span><span>{v.cliente || 'Consumidor final'}</span></div>
          </div>
          <div className="flex font-bold border-b border-dashed border-gris-900 pb-1 mb-1.5">
            <span className="flex-1">DESCRIPCIÓN</span>
            <span className="w-[42px] text-right">CANT.</span>
            <span className="w-[62px] text-right">TOTAL</span>
          </div>
          {v.venta_items.map((it) => (
            <div key={it.id} className="mb-1.5">
              <div className="flex">
                <span className="flex-1">{it.nombre}</span>
                <span className="w-[42px] text-right font-bold">{it.pares}</span>
                <span className="w-[62px] text-right">{cop(it.pares * it.precio)}</span>
              </div>
              <div className="text-gris-500">
                {it.ref + (it.talla ? ' · talla ' + it.talla : '') + ' · ' + it.pares + ' ' + (it.unidad === 'unidad' ? (it.pares === 1 ? 'unidad' : 'unidades') : (it.pares === 1 ? 'par' : 'pares')) + ' × ' + cop(it.precio)}
              </div>
            </div>
          ))}
          <div className="border-t border-dashed border-gris-900 pt-2 mt-1">
            <div className="flex justify-between font-bold"><span>{soloUnidad ? 'TOTAL UNIDADES' : 'TOTAL PARES'}</span><span>{soloUnidad ? unidades : pares}</span></div>
            <div className="flex justify-between text-[15px] font-bold mt-1"><span>TOTAL</span><span>{cop(v.total)}</span></div>
            <div className="flex justify-between mt-1"><span>Forma de pago</span><span>{v.metodo}</span></div>
          </div>
          <div className="text-center mt-3.5 pt-2.5 border-t border-dashed border-gris-900">
            <div>Precios en pesos colombianos.</div>
            <div>Cambios dentro de 8 días con esta tirilla.</div>
            <div className="font-bold mt-1.5">¡Gracias por su compra!</div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Btn variant="dark" onClick={closeModal}>Cerrar</Btn>
          <Btn variant="cta" onClick={() => window.print()}>Imprimir tirilla 80mm</Btn>
        </div>
      </div>
    </div>
  )
}
