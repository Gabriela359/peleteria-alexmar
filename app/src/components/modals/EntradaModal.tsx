import { useState } from 'react'
import { useUI } from '../../state/ui'
import { useProductos, useRegistrarAjuste, useRegistrarEntrada } from '../../hooks/useProductos'
import { porTalla, unidadTxt, paresDe } from '../../lib/format'
import { Btn } from '../ui'

function digits(v: string) { return v.replace(/[^0-9]/g, '') }

interface Payload { ref?: string; talla?: string | null }

export default function EntradaModal() {
  const { modalPayload, closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const registrarEntrada = useRegistrarEntrada()
  const registrarAjuste = useRegistrarAjuste()
  const activos = productos.filter((p) => !p.archivado)
  const inicial = modalPayload as Payload | null

  const [ref, setRef] = useState(inicial?.ref ?? activos[0]?.ref ?? '')
  const [modo, setModo] = useState<'entrada' | 'conteo'>('entrada')
  const [talla, setTalla] = useState<string | null>(inicial?.talla ?? null)
  const [proveedor, setProveedor] = useState('')
  const [tallas, setTallas] = useState<Record<string, string>>({})
  const [conteo, setConteo] = useState('')
  const [motivo, setMotivo] = useState('Conteo físico')
  const [enviando, setEnviando] = useState(false)

  const modelo = productos.find((p) => p.ref === ref)
  const porT = modelo ? porTalla(modelo) : true
  const tallasDisponibles = modelo && porT ? Object.keys(modelo.tallas).sort() : []
  const tallaSeleccionada = talla && tallasDisponibles.includes(talla) ? talla : tallasDisponibles[0] ?? null
  const actual = modelo ? (porT ? Number(modelo.tallas[tallaSeleccionada ?? ''] ?? 0) : Number(modelo.stock ?? 0)) : 0

  const total = porT
    ? Object.entries(tallas).filter(([k]) => k !== '__u').reduce((a, [, v]) => a + (Number(v) || 0), 0)
    : Number(tallas.__u) || 0

  async function onGuardar() {
    if (!modelo) return
    if (modo === 'entrada' && total <= 0) { showToast('Indica cuántas ' + unidadTxt(modelo) + ' entran'); return }
    if (modo === 'conteo' && conteo === '') { showToast('Escribe la cantidad real que contaste'); return }
    if (modo === 'conteo' && porT && !tallaSeleccionada) { showToast('Elige una talla para corregir'); return }
    setEnviando(true)
    try {
      if (modo === 'entrada') {
        const payload = porT
          ? Object.fromEntries(Object.entries(tallas).filter(([k, v]) => k !== '__u' && Number(v) > 0).map(([k, v]) => [k, Number(v)]))
          : { __u: Number(tallas.__u) || 0 }
        await registrarEntrada.mutateAsync({ ref: modelo.ref, tallas: payload, proveedor: proveedor.trim() || null })
        showToast('Existencias aumentadas · +' + total + ' ' + unidadTxt(modelo))
      } else {
        await registrarAjuste.mutateAsync({ ref: modelo.ref, talla: porT ? tallaSeleccionada : null, valor: Number(conteo), motivo })
        showToast('Existencias corregidas')
      }
      closeModal()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudieron guardar las existencias')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[90] grid place-items-center p-[clamp(8px,3vw,32px)] overflow-auto" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="w-[min(560px,95vw)] max-h-[92vh] overflow-y-auto bg-sura-blanco rounded-2xl p-[clamp(12px,3vw,20px)] shadow-2xl">
        <h2 className="text-xl text-sura-azul-prof m-0 mb-1">Actualizar stock</h2>
        <div className="text-[13px] text-gris-500 mb-4">Elige si llegó mercancía o si vas a corregir la cantidad después de contar.</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-2 mb-4">
          {([{ key: 'entrada', label: 'Llegó mercancía', desc: 'Sumar las unidades o pares recibidos' }, { key: 'conteo', label: 'Conté lo que hay', desc: 'Reemplazar el stock por la cantidad real' }] as const).map((opcion) => (
            <button key={opcion.key} onClick={() => { setModo(opcion.key); setTallas({}); setConteo('') }}
              aria-pressed={modo === opcion.key}
              className={`text-left rounded-xl border-2 px-3 py-2.5 cursor-pointer ${modo === opcion.key ? 'border-sura-azul-cielo bg-sura-azul-tint' : 'border-sura-azul-divider bg-sura-blanco'}`}>
              <span className="block text-sm font-bold">{opcion.label}</span>
              <span className="block text-xs text-gris-500 mt-0.5">{opcion.desc}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-3.5 mb-4 grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))]">
          <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Producto</span>
            <select value={ref} onChange={(e) => { const seleccionado = activos.find((m) => m.ref === e.target.value); setRef(e.target.value); setTalla(seleccionado && porTalla(seleccionado) ? Object.keys(seleccionado.tallas).sort()[0] ?? null : null); setTallas({}); setConteo('') }}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo">
              {activos.map((m) => <option key={m.ref} value={m.ref}>{m.ref} · {m.nombre}</option>)}
            </select>
          </label>
          {modo === 'entrada' && (
            <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Proveedor (opcional)</span>
              <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Nombre del proveedor"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
            </label>
          )}
        </div>
        {modo === 'entrada' ? (
          <>
            <div className="text-sm font-bold text-sura-azul-prof mb-2.5">{porT ? '¿Cuántos pares llegaron de cada talla?' : '¿Cuántas unidades llegaron?'}</div>
            {!porT && modelo && (
              <div className="flex items-center gap-3.5 mb-[18px]">
                <input value={tallas.__u ?? ''} onChange={(e) => setTallas({ __u: digits(e.target.value) })} placeholder="0"
                  className="w-[140px] border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-base outline-none text-right tabular-nums focus:border-b-sura-azul-cielo" />
                <span className="text-[13px] text-gris-500">Actualmente hay {paresDe(modelo)} {unidadTxt(modelo)}</span>
              </div>
            )}
            {porT && modelo && (
              <div className="flex flex-wrap gap-2.5 mb-[18px]">
                {tallasDisponibles.map((t) => (
                  <label key={t} className="w-[84px] border border-sura-azul-divider rounded-xl p-2.5 bg-sura-azul-tint-light">
                    <span className="block text-[13px] font-bold mb-0.5">Talla {t}</span>
                    <span className="block text-[11px] text-gris-500 mb-1.5">Hay {modelo.tallas[t]}</span>
                    <input aria-label={'Pares recibidos talla ' + t} value={tallas[t] ?? ''} onChange={(e) => setTallas((s) => ({ ...s, [t]: digits(e.target.value) }))}
                      className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2 py-1.5 text-sm outline-none text-right focus:border-b-sura-azul-cielo" />
                  </label>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {porT && (
              <div className="mb-3.5">
                <div className="text-xs font-bold text-gris-500 mb-1.5">Talla que contaste</div>
                <div className="flex flex-wrap gap-1.5">
                  {tallasDisponibles.map((t) => (
                    <button key={t} onClick={() => { setTalla(t); setConteo('') }}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold border cursor-pointer ${tallaSeleccionada === t ? 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}>
                      {t} · hay {modelo?.tallas[t] ?? 0}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-3.5 mb-4 grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))]">
              <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Cantidad real que contaste ({modelo ? unidadTxt(modelo) : 'unidades'})</span>
                <input value={conteo} onChange={(e) => setConteo(digits(e.target.value))} placeholder="Escribe la cantidad"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
              </label>
              <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Motivo</span>
                <select value={motivo} onChange={(e) => setMotivo(e.target.value)}
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo">
                  {['Conteo físico', 'Rotura', 'Muestra', 'Pérdida'].map((opcion) => <option key={opcion}>{opcion}</option>)}
                </select>
              </label>
            </div>
            <div className="bg-sura-azul-tint border border-sura-azul-chip rounded-xl px-3.5 py-3 text-[13px] text-sura-azul-prof mb-[18px]">
              En el sistema hay {actual} {modelo ? unidadTxt(modelo) : 'unidades'}. {conteo !== '' && `Quedarán ${conteo} ${modelo ? unidadTxt(modelo) : 'unidades'}.`}
            </div>
          </>
        )}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-between items-stretch sm:items-center pt-[18px] border-t border-sura-azul-divider">
          <div className="text-sm text-gris-500">{modo === 'entrada' ? <>Se sumarán: <strong className="text-lg text-gris-900">{total} {modelo ? unidadTxt(modelo) : 'pares'}</strong></> : 'La cantidad del sistema quedará reemplazada por el conteo.'}</div>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Btn className="w-full sm:w-auto" onClick={closeModal}>Cancelar</Btn>
            <Btn className="w-full sm:w-auto" variant="cta" disabled={enviando || !modelo} onClick={() => void onGuardar()}>{modo === 'entrada' ? 'Agregar al stock' : 'Guardar cantidad real'}</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
