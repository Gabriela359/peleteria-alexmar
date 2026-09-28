import { useState } from 'react'
import { useUI } from '../../state/ui'
import { useProductos, useRegistrarEntrada } from '../../hooks/useProductos'
import { porTalla, unidadTxt, paresDe } from '../../lib/format'
import { Btn } from '../ui'

function digits(v: string) { return v.replace(/[^0-9]/g, '') }

export default function EntradaModal() {
  const { closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const registrar = useRegistrarEntrada()
  const activos = productos.filter((p) => !p.archivado)

  const [ref, setRef] = useState(activos[0]?.ref ?? '')
  const [proveedor, setProveedor] = useState('')
  const [tallas, setTallas] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  const modelo = productos.find((p) => p.ref === ref)
  const porT = modelo ? porTalla(modelo) : true

  const total = porT
    ? Object.entries(tallas).filter(([k]) => k !== '__u').reduce((a, [, v]) => a + (Number(v) || 0), 0)
    : Number(tallas.__u) || 0

  async function onGuardar() {
    if (!modelo) return
    if (total <= 0) { showToast('Indica cuántas ' + unidadTxt(modelo) + ' entran'); return }
    setEnviando(true)
    try {
      const payload = porT
        ? Object.fromEntries(Object.entries(tallas).filter(([k, v]) => k !== '__u' && Number(v) > 0).map(([k, v]) => [k, Number(v)]))
        : { __u: Number(tallas.__u) || 0 }
      await registrar.mutateAsync({ ref: modelo.ref, tallas: payload, proveedor: proveedor.trim() || null })
      showToast('Entrada registrada · +' + total + ' ' + unidadTxt(modelo))
      closeModal()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo registrar la entrada')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[90] grid place-items-center p-[clamp(8px,3vw,32px)] overflow-auto" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="w-[min(560px,95vw)] max-h-[92vh] overflow-y-auto bg-sura-blanco rounded-2xl p-[clamp(12px,3vw,20px)] shadow-2xl">
        <h2 className="text-xl text-sura-azul-prof m-0 mb-1">Entrada de mercancía</h2>
        <div className="text-[13px] text-gris-500 mb-5">Registra lo que llegó del proveedor. Suma al stock del producto.</div>
        <div className="grid gap-3.5 mb-4 grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))]">
          <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Modelo</span>
            <div className="flex flex-wrap gap-1.5">
              {activos.map((m) => (
                <button key={m.ref} onClick={() => { setRef(m.ref); setTallas({}) }}
                  className={`rounded-full px-3 py-1.5 text-xs font-mono font-bold border cursor-pointer ${ref === m.ref ? 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}
                >{m.ref}</button>
              ))}
            </div>
          </label>
          <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Proveedor</span>
            <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Suelas del Oriente S.A.S."
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
          </label>
        </div>
        <div className="text-sm font-bold uppercase tracking-wide text-sura-azul-prof mb-2.5">{porT ? 'Pares que entran por talla' : 'Unidades que entran'}</div>
        {!porT && modelo && (
          <div className="flex items-center gap-3.5 mb-[18px]">
            <input value={tallas.__u ?? ''} onChange={(e) => setTallas({ __u: digits(e.target.value) })} placeholder="0"
              className="w-[140px] border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-base outline-none text-right tabular-nums focus:border-b-sura-azul-cielo" />
            <span className="text-[13px] text-gris-500">hoy hay {paresDe(modelo)} {unidadTxt(modelo)}</span>
          </div>
        )}
        {porT && modelo && (
          <div className="flex flex-wrap gap-2.5 mb-[18px]">
            {Object.keys(modelo.tallas).sort().map((t) => (
              <div key={t} className="w-[84px] border border-sura-azul-divider rounded-xl p-2.5 bg-sura-azul-tint-light">
                <div className="text-[13px] font-bold mb-0.5">Talla {t}</div>
                <div className="text-[11px] text-gris-350 mb-1.5">hoy {modelo.tallas[t]}</div>
                <input value={tallas[t] ?? ''} onChange={(e) => setTallas((s) => ({ ...s, [t]: digits(e.target.value) }))}
                  className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2 py-1.5 text-sm outline-none text-right focus:border-b-sura-azul-cielo" />
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3 justify-between items-center pt-[18px] border-t border-sura-azul-divider">
          <div className="text-sm text-gris-500">Total a ingresar: <strong className="text-lg text-gris-900">{total} {modelo ? unidadTxt(modelo) : 'pares'}</strong></div>
          <div className="flex gap-2.5">
            <Btn onClick={closeModal}>Cancelar</Btn>
            <Btn variant="cta" disabled={enviando} onClick={() => void onGuardar()}>Registrar entrada</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
