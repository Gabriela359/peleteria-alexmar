import { useState } from 'react'
import { useUI } from '../../state/ui'
import { useProductos, useRegistrarAjuste } from '../../hooks/useProductos'
import { porTalla, unidadTxt } from '../../lib/format'
import { Btn } from '../ui'

const MOTIVOS = ['Conteo físico', 'Rotura', 'Muestra', 'Pérdida']

interface Payload { ref: string; talla: string | null }

export default function AjusteModal() {
  const { modalPayload, closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const registrar = useRegistrarAjuste()
  const activos = productos.filter((p) => !p.archivado)
  const inicial = modalPayload as Payload | null

  const [ref, setRef] = useState(inicial?.ref ?? activos[0]?.ref ?? '')
  const [talla, setTalla] = useState<string | null>(inicial?.talla ?? null)
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState('Conteo físico')
  const [enviando, setEnviando] = useState(false)

  const modelo = productos.find((p) => p.ref === ref)
  const porT = modelo ? porTalla(modelo) : true
  const tallasDisponibles = modelo && porT ? Object.keys(modelo.tallas).sort() : []
  const actual = modelo ? (porT ? Number(modelo.tallas[talla ?? ''] ?? 0) : Number(modelo.stock ?? 0)) : 0
  const dif = valor === '' ? null : Number(valor) - actual
  const un = modelo ? unidadTxt(modelo) : 'pares'
  const resumen = !modelo ? 'Elige el producto que vas a ajustar.'
    : dif === null ? 'Sistema: ' + actual + ' ' + un + ' ' + (porT ? 'en talla ' + talla : 'en existencia') + '. Escribe cuántas contaste.'
    : 'Sistema ' + actual + ' → contado ' + valor + ' · diferencia ' + (dif > 0 ? '+' : '') + dif + ' ' + un + ' por ' + motivo.toLowerCase() + '.'

  async function onGuardar() {
    if (!modelo) return
    if (valor === '' || isNaN(Number(valor))) { showToast('Escribe las ' + unidadTxt(modelo) + ' que contaste'); return }
    setEnviando(true)
    try {
      await registrar.mutateAsync({ ref: modelo.ref, talla: porT ? talla : null, valor: Number(valor), motivo })
      showToast('Ajuste guardado')
      closeModal()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar el ajuste')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[90] grid place-items-center p-[clamp(8px,3vw,32px)] overflow-auto" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="w-[min(480px,95vw)] max-h-[92vh] overflow-y-auto bg-sura-blanco rounded-2xl p-[clamp(16px,4vw,28px)] shadow-2xl">
        <h2 className="text-xl text-sura-azul-prof m-0 mb-1">Ajuste de inventario</h2>
        <div className="text-[13px] text-gris-500 mb-5">Corrige el stock dejando el motivo por escrito.</div>

        <div className="grid gap-1.5 mb-3.5">
          <span className="text-xs font-bold text-gris-500">Modelo</span>
          <div className="flex flex-wrap gap-1.5">
            {activos.map((m) => (
              <button key={m.ref} onClick={() => { setRef(m.ref); setTalla(porTalla(m) ? Object.keys(m.tallas)[0] : null); setValor('') }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer ${ref === m.ref ? 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}
              >{m.ref}</button>
            ))}
          </div>
        </div>

        {porT && (
          <div className="grid gap-1.5 mb-3.5">
            <span className="text-xs font-bold text-gris-500">Talla</span>
            <div className="flex flex-wrap gap-1.5">
              {tallasDisponibles.map((t) => (
                <button key={t} onClick={() => { setTalla(t); setValor('') }}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer ${talla === t ? 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}
                >{t} ({modelo!.tallas[t]})</button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3.5 mb-3.5 grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))]">
          <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">{(porT ? 'Pares' : 'Unidades') + ' reales contadas'}</span>
            <input value={valor} onChange={(e) => setValor(e.target.value.replace(/[^0-9]/g, ''))}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right focus:border-b-sura-azul-cielo" />
          </label>
          <div className="grid gap-1.5 min-w-0">
            <span className="text-xs font-bold text-gris-500">Motivo</span>
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS.map((m) => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer ${motivo === m ? 'border-sura-azul-prof bg-sura-azul-prof text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-sura-azul-tint border border-sura-azul-chip rounded-xl px-3.5 py-3 text-[13px] text-sura-azul-prof mb-[18px]">{resumen}</div>

        <div className="flex justify-end gap-2.5 pt-[18px] border-t border-sura-azul-divider">
          <Btn onClick={closeModal}>Cancelar</Btn>
          <Btn variant="cta" disabled={enviando} onClick={() => void onGuardar()}>Guardar ajuste</Btn>
        </div>
      </div>
    </div>
  )
}
