import { useState } from 'react'
import { useUI } from '../../state/ui'
import { cop, paresDe, unidadTxt } from '../../lib/format'
import { useCrearProducto, useProductos, useGuardarProducto } from '../../hooks/useProductos'
import { BoxIcon } from '../Icons'
import { Btn, KvRow } from '../ui'

interface FormState {
  original: string | null
  ref: string
  nombre: string
  color: string
  precio: string
  costo: string
  min: string
  modo_stock: 'total' | 'talla'
  rango: string
  stock: string
  tallas: Record<string, string>
}

function digits(v: string) { return v.replace(/[^0-9]/g, '') }

function parseRango(value: string): string[] | null {
  const match = value.trim().match(/^(\d{1,2})\s*(?:-|–)\s*(\d{1,2})$/)
  if (!match) return null
  const desde = Number(match[1]), hasta = Number(match[2])
  if (desde < 1 || hasta > 99 || desde > hasta || hasta - desde > 50) return null
  return Array.from({ length: hasta - desde + 1 }, (_, index) => String(desde + index))
}

export default function ModeloModal() {
  const { modalPayload, closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const guardar = useGuardarProducto()
  const crear = useCrearProducto()
  const refEdicion = modalPayload as string | null
  const existente = refEdicion ? productos.find((p) => p.ref === refEdicion) : undefined
  const unidadLabel = existente?.unidad === 'unidad' ? 'unidad' : 'par'
  const [form, setForm] = useState<FormState>(() => {
    const tallas = existente?.tallas ?? {}
    const keys = Object.keys(tallas).sort((a, b) => Number(a) - Number(b))
    return existente
      ? {
          original: existente.ref,
          ref: existente.ref,
          nombre: existente.nombre,
          color: existente.color ?? '',
          precio: String(existente.precio),
          costo: String(existente.costo),
          min: String(existente.min),
          modo_stock: existente.modo_stock,
          rango: keys.length ? `${keys[0]}-${keys[keys.length - 1]}` : '',
          stock: String(existente.stock),
          tallas: Object.fromEntries(keys.map((key) => [key, String(tallas[key])])),
        }
      : {
          original: null, ref: '', nombre: '', color: '', precio: '', costo: '', min: '10',
          modo_stock: 'total', rango: '', stock: '', tallas: {},
        }
  })
  const [guardando, setGuardando] = useState(false)

  function setF<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const rangoTallas = parseRango(form.rango)
  const tallas = form.modo_stock === 'talla' && rangoTallas
    ? Object.fromEntries(rangoTallas.map((size) => [size, Number(form.tallas[size]) || 0]))
    : Object.fromEntries((rangoTallas ?? []).map((size) => [size, 0]))
  const total = form.modo_stock === 'total'
    ? Number(form.stock) || 0
    : Object.values(tallas).reduce((sum, quantity) => sum + Number(quantity), 0)
  const utilidad = (Number(form.precio) || 0) - (Number(form.costo) || 0)

  async function onGuardar() {
    if (!form.ref.trim() || !form.nombre.trim()) {
      showToast('Referencia y nombre son obligatorios')
      return
    }
    if (!rangoTallas) {
      showToast('Escribe un rango de tallas válido, por ejemplo 34-40')
      return
    }
    if (form.modo_stock === 'total' && total <= 0) {
      showToast('Indica la cantidad total de pares')
      return
    }
    setGuardando(true)
    try {
      if (form.original) {
        const producto = productos.find((p) => p.ref === form.original)
        if (!producto) throw new Error('No se encontró el producto que deseas editar')
        await guardar.mutateAsync({
          ref: producto.ref,
          nombre: form.nombre.trim(),
          color: form.color || null,
          precio: Number(form.precio) || 0,
          costo: Number(form.costo) || 0,
          min: Number(form.min) || 0,
        })
      } else {
        await crear.mutateAsync({
          ref: form.ref.trim().toUpperCase(),
          nombre: form.nombre.trim(),
          modo_stock: form.modo_stock,
          color: form.color || null,
          precio: Number(form.precio) || 0,
          costo: Number(form.costo) || 0,
          min: Number(form.min) || 0,
          tallas,
          stock: form.modo_stock === 'total' ? total : 0,
        })
      }
      showToast(form.original ? 'Producto actualizado' : 'Producto creado')
      closeModal()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.6)] backdrop-blur-[3px] z-[90] grid place-items-center p-[clamp(8px,3vw,24px)] overflow-auto" onClick={closeModal}>
      <div onClick={(event) => event.stopPropagation()} className="w-[min(820px,100%)] max-h-[92vh] flex flex-col bg-sura-blanco rounded-[20px] overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4 px-[clamp(12px,3vw,20px)] py-[clamp(12px,2.5vw,16px)] bg-sura-azul-oscuro text-sura-blanco">
          <div className="w-11 h-11 rounded-2xl bg-white/14 grid place-items-center shrink-0"><BoxIcon /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[19px] font-bold">{form.original ? 'Editar ' + form.original : 'Nuevo producto'}</div>
            <div className="text-[13px] opacity-80">Registra la referencia, su rango de tallas y las existencias.</div>
          </div>
          <button onClick={closeModal} title="Cerrar" className="w-[34px] h-[34px] rounded-full border border-white/40 bg-transparent text-sura-blanco cursor-pointer text-[17px] leading-none">×</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-4 p-[clamp(12px,3vw,20px)] items-start">
          <div className="flex-[3_1_380px] min-w-0 grid gap-4">
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))]">
              <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Referencia</span>
                <input value={form.ref} readOnly={Boolean(form.original)} onChange={(event) => setF('ref', event.target.value)} placeholder="SU-101"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full font-mono focus:border-b-sura-azul-cielo" />
              </label>
              <label className="grid gap-1.5 min-w-0 col-span-full"><span className="text-xs font-bold text-gris-500">Nombre</span>
                <input value={form.nombre} onChange={(event) => setF('nombre', event.target.value)} placeholder="Suela Clásica"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
              </label>
              <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Color</span>
                <input value={form.color} onChange={(event) => setF('color', event.target.value)} placeholder="Negro"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
              </label>
              <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Costo por {unidadLabel} (COP)</span>
                <input value={form.costo} onChange={(event) => setF('costo', digits(event.target.value))} placeholder="0"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
              </label>
              <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Precio por {unidadLabel} (COP)</span>
                <input value={form.precio} onChange={(event) => setF('precio', digits(event.target.value))} placeholder="0"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
              </label>
            </div>

            <div>
              <label className="grid gap-1.5 max-w-xs"><span className="text-xs font-bold text-gris-500">Rango de tallas</span>
                <input value={form.rango} readOnly={Boolean(form.original)} onChange={(event) => setF('rango', event.target.value)} placeholder="34-40"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo read-only:bg-gris-100" />
              </label>
              {form.original && <div className="text-xs text-gris-500 mt-1">Para cambiar las existencias o su control por talla, usa “Actualizar stock”.</div>}
            </div>

            {!form.original && (
              <>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">Control de existencias</div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: 'total', label: 'Cantidad total', detail: 'Al vender, no se pedirá talla.' },
                      { key: 'talla', label: 'Cantidad por talla', detail: 'Al vender, se elegirá la talla.' },
                    ] as const).map((option) => (
                      <button key={option.key} type="button" onClick={() => setF('modo_stock', option.key)}
                        aria-pressed={form.modo_stock === option.key}
                        className={`flex-[1_1_190px] text-left rounded-2xl px-4 py-3.5 cursor-pointer border-2 ${form.modo_stock === option.key ? 'border-sura-azul-cielo bg-sura-azul-tint' : 'border-sura-azul-divider bg-sura-blanco'}`}>
                        <div className="text-sm font-bold">{option.label}</div>
                        <div className="text-xs text-gris-500 mt-0.5">{option.detail}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {form.modo_stock === 'total' ? (
                  <label className="grid gap-1.5 max-w-xs"><span className="text-xs font-bold text-gris-500">Pares totales en bodega</span>
                    <input value={form.stock} onChange={(event) => setF('stock', digits(event.target.value))} placeholder="0"
                      className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
                  </label>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {(rangoTallas ?? []).map((size) => (
                      <label key={size} className="w-[84px] border border-sura-azul-divider rounded-xl p-2.5 bg-sura-azul-tint-light">
                        <span className="block text-[13px] font-bold mb-1">Talla {size}</span>
                        <input aria-label={'Pares talla ' + size} value={form.tallas[size] ?? ''}
                          onChange={(event) => setForm((current) => ({ ...current, tallas: { ...current.tallas, [size]: digits(event.target.value) } }))}
                          className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2 py-1.5 text-sm outline-none text-right focus:border-b-sura-azul-cielo" />
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

            {form.original && (
              <div className="rounded-2xl bg-sura-azul-tint-light border border-sura-azul-divider px-3.5 py-3 text-[13px] text-gris-500">
                Hay {paresDe(existente ?? { modo_stock: form.modo_stock, tallas, stock: Number(form.stock) || 0 })} {existente ? unidadTxt(existente) : 'pares'} en bodega.
              </div>
            )}

            <div className="flex flex-wrap gap-x-3.5 gap-y-2.5 items-center bg-sura-azul-tint-light border border-sura-azul-divider rounded-2xl px-3.5 py-3">
              <div className="flex-[1_1_170px] min-w-0">
                <div className="text-[13px] font-bold">Stock mínimo</div>
                <div className="text-xs text-gris-500">Avisa cuando queden {Number(form.min) || 0} {existente ? unidadTxt(existente) : 'pares'} o menos</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setF('min', String(Math.max(0, (Number(form.min) || 0) - 1)))} className="w-9 h-9 rounded-full border border-gris-300 bg-sura-blanco cursor-pointer text-lg font-bold">−</button>
                <input value={form.min} onChange={(event) => setF('min', digits(event.target.value))} placeholder="10"
                  className="w-[72px] border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2.5 py-2 text-[15px] outline-none text-right tabular-nums focus:border-b-sura-azul-cielo" />
                <button onClick={() => setF('min', String((Number(form.min) || 0) + 1))} className="w-9 h-9 rounded-full border-none bg-sura-azul-cielo text-sura-blanco cursor-pointer text-lg font-bold">+</button>
              </div>
            </div>
          </div>

          <div className="flex-[1_1_220px] min-w-0 bg-sura-azul-tint-light border border-sura-azul-divider rounded-2xl p-3.5">
            <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2.5">Resumen</div>
            <div className="text-[15px] font-bold mb-0.5">{form.nombre.trim() || 'Producto sin nombre'}</div>
            <div className="text-xs text-gris-500 mb-4">{form.color || 'Sin color'}{form.ref ? ' · ' + form.ref.toUpperCase() : ''}</div>
            <div className="grid gap-0.5">
              <KvRow k="Rango de tallas">{form.rango || 'Sin definir'}</KvRow>
              <KvRow k={form.modo_stock === 'total' ? 'Pares totales' : 'Pares por talla'}>{total.toLocaleString('es-CO')}</KvRow>
              <KvRow k="Precio">{cop(Number(form.precio) || 0)}</KvRow>
              <KvRow k="Utilidad"><span className={utilidad > 0 ? 'text-success-1' : utilidad < 0 ? 'text-danger-1' : 'text-gris-350'}>{cop(utilidad)}</span></KvRow>
              <KvRow k="Valor en bodega">{cop(total * (Number(form.costo) || 0))}</KvRow>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 justify-end px-[clamp(12px,3vw,20px)] py-4 border-t border-sura-azul-divider">
          <Btn onClick={closeModal}>Cancelar</Btn>
          <Btn variant="cta" disabled={guardando} onClick={() => void onGuardar()}>{guardando ? 'Guardando…' : form.original ? 'Guardar cambios' : 'Crear producto'}</Btn>
        </div>
      </div>
    </div>
  )
}
