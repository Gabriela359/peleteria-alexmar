import { useMemo, useRef, useState } from 'react'
import { useUI } from '../../state/ui'
import { cop } from '../../lib/format'
import { useProductos, useGuardarProducto, useSubirFotoProducto } from '../../hooks/useProductos'
import { useAgregarTipo, useOcultarTipo, useTiposProducto } from '../../hooks/useTipos'
import { BoxIcon, ImageIcon } from '../Icons'
import { Btn, KvRow } from '../ui'

const CON_TALLA_POR_DEFECTO = ['Suelas', 'Plantillas', 'Tacones']

interface TallaForm { talla: string; pares: string }
interface FormState {
  original: string | null
  ref: string; nombre: string; tipo: string; unidad: 'par' | 'unidad'; color: string
  precio: string; costo: string; min: string; stock: string; archivado: boolean
  foto_url: string | null
  tallas: TallaForm[]
}

function digits(v: string) { return v.replace(/[^0-9]/g, '') }

export default function ModeloModal() {
  const { modalPayload, closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const { data: tipos = [] } = useTiposProducto()
  const guardar = useGuardarProducto()
  const subirFoto = useSubirFotoProducto()
  const agregarTipo = useAgregarTipo()
  const ocultarTipo = useOcultarTipo()
  const fileInput = useRef<HTMLInputElement>(null)

  const refEdicion = modalPayload as string | null
  const existente = refEdicion ? productos.find((p) => p.ref === refEdicion) : undefined

  const [form, setForm] = useState<FormState>(() => existente
    ? {
      original: existente.ref, ref: existente.ref, nombre: existente.nombre, tipo: existente.tipo, unidad: existente.unidad,
      color: existente.color ?? '', precio: String(existente.precio), costo: String(existente.costo), min: String(existente.min),
      stock: String(existente.stock ?? 0), archivado: existente.archivado, foto_url: existente.foto_url,
      tallas: Object.keys(existente.tallas).sort().map((k) => ({ talla: k, pares: String(existente.tallas[k]) })),
    }
    : { original: null, ref: '', nombre: '', tipo: '', unidad: 'par', color: '', precio: '', costo: '', min: '10', stock: '', archivado: false, foto_url: null, tallas: [] })
  const [nuevaTalla, setNuevaTalla] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)

  function setF<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((f) => ({ ...f, [k]: v })) }

  const enUso = useMemo(() => {
    const m: Record<string, number> = {}
    productos.forEach((p) => { if (p.tipo) m[p.tipo] = (m[p.tipo] ?? 0) + 1 })
    return m
  }, [productos])

  const fPorTalla = form.unidad !== 'unidad'
  const fStock = fPorTalla ? form.tallas.reduce((a, t) => a + (Number(t.pares) || 0), 0) : Number(form.stock) || 0
  const fUtil = (Number(form.precio) || 0) - (Number(form.costo) || 0)

  async function onFotoChange(file: File | null) {
    if (!file || !form.ref.trim()) { showToast('Escribe la referencia antes de subir una foto'); return }
    setSubiendoFoto(true)
    try {
      const url = await subirFoto.mutateAsync({ ref: form.ref.trim().toUpperCase(), file })
      setF('foto_url', url)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  async function onGuardar() {
    if (!form.ref.trim() || !form.nombre.trim()) { showToast('Referencia y nombre son obligatorios'); return }
    if (!form.tipo) { showToast('Elige el tipo de producto'); return }
    if (form.unidad === 'par' && !form.tallas.length) { showToast('Agrega al menos una talla con sus pares'); return }
    const tallas: Record<string, number> = {}
    form.tallas.forEach((t) => { tallas[t.talla] = Number(t.pares) || 0 })
    setGuardando(true)
    try {
      await guardar.mutateAsync({
        ref: form.ref.trim().toUpperCase(), nombre: form.nombre.trim(), tipo: form.tipo, unidad: form.unidad,
        color: form.color || null, precio: Number(form.precio) || 0, costo: Number(form.costo) || 0, min: Number(form.min) || 0,
        tallas: form.unidad === 'par' ? tallas : {}, stock: form.unidad === 'par' ? 0 : Number(form.stock) || 0,
        foto_url: form.foto_url, archivado: form.archivado,
      })
      showToast(form.original ? 'Producto actualizado' : 'Producto creado')
      closeModal()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  function onAddTalla() {
    const t = nuevaTalla.trim()
    if (!t || form.tallas.some((x) => x.talla === t)) { showToast('Talla inválida o repetida'); return }
    setF('tallas', form.tallas.concat([{ talla: t, pares: '0' }]).sort((a, b) => Number(a.talla) - Number(b.talla)))
    setNuevaTalla('')
  }

  function onAddTipo() {
    const t = nuevoTipo.trim()
    if (!t) { showToast('Escribe el nombre del tipo'); return }
    agregarTipo.mutate(t, {
      onSuccess: () => { setNuevoTipo(''); setF('tipo', t); setF('unidad', 'unidad'); showToast('Tipo "' + t + '" agregado') },
      onError: (e) => showToast(e instanceof Error ? e.message : 'No se pudo agregar el tipo'),
    })
  }

  function onDelTipo(nombre: string) {
    if (enUso[nombre]) { showToast('No se puede eliminar: ' + enUso[nombre] + ' producto(s) usan "' + nombre + '"'); return }
    ocultarTipo.mutate({ nombre, ocultar: true }, {
      onSuccess: () => { if (form.tipo === nombre) setF('tipo', ''); showToast('Tipo "' + nombre + '" eliminado') },
      onError: (e) => showToast(e instanceof Error ? e.message : 'No se pudo eliminar el tipo'),
    })
  }

  const tiposVisibles = tipos.filter((t) => t.activo)

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.6)] backdrop-blur-[3px] z-[90] grid place-items-center p-[clamp(8px,3vw,24px)] overflow-auto" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="w-[min(820px,100%)] max-h-[92vh] flex flex-col bg-sura-blanco rounded-[20px] overflow-hidden shadow-2xl">

        <div className="flex items-center gap-4 px-[clamp(12px,3vw,20px)] py-[clamp(12px,2.5vw,16px)] bg-sura-azul-oscuro text-sura-blanco">
          <div className="w-11 h-11 rounded-2xl bg-white/14 grid place-items-center shrink-0"><BoxIcon /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[19px] font-bold">{form.original ? 'Actualizar ' + form.original : 'Nuevo producto'}</div>
            <div className="text-[13px] opacity-80">Suelas, plantillas, pegantes, herrajes: todo lo que se vende en el local.</div>
          </div>
          <button onClick={closeModal} title="Cerrar" className="w-[34px] h-[34px] rounded-full border border-white/40 bg-transparent text-sura-blanco cursor-pointer text-[17px] leading-none">×</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-4 p-[clamp(12px,3vw,20px)] items-start">
          <div className="flex-[3_1_380px] min-w-0 grid gap-4">

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">1 · Tipo de producto</div>
              <div className="flex flex-wrap gap-2 mb-2.5">
                {tiposVisibles.map((t) => (
                  <span
                    key={t.id} onClick={() => setForm((f) => ({ ...f, tipo: t.nombre, unidad: CON_TALLA_POR_DEFECTO.includes(t.nombre) || t.con_talla ? 'par' : 'unidad' }))}
                    className={`rounded-full pl-3.5 pr-1.5 py-2 text-[13px] font-bold border cursor-pointer inline-flex items-center gap-1.5 ${form.tipo === t.nombre ? 'border-sura-azul-prof bg-sura-azul-prof text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}
                  >
                    {t.nombre}
                    <button title="Eliminar tipo" onClick={(e) => { e.stopPropagation(); onDelTipo(t.nombre) }}
                      className={`border-none bg-transparent cursor-pointer text-[15px] leading-none px-1.5 ${form.tipo === t.nombre ? 'text-sura-blanco' : 'text-gris-350'}`}
                    >×</button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <input value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} placeholder="Crear otro tipo: cremalleras, tintes…"
                  className="flex-[1_1_200px] min-w-0 border border-dashed border-gris-300 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-sura-azul-cielo" />
                <Btn variant="outlineProf" size="sm" onClick={onAddTipo}>Agregar tipo</Btn>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">2 · Cómo se vende</div>
              <div className="flex flex-wrap gap-2.5">
                {[{ key: 'par' as const, label: 'Por pares con talla', desc: 'Suelas, plantillas, tacones' }, { key: 'unidad' as const, label: 'Por unidad', desc: 'Cordones, pegantes, hilos, herrajes' }].map((u) => (
                  <button key={u.key} onClick={() => setF('unidad', u.key)}
                    className={`flex-[1_1_190px] text-left rounded-2xl px-4 py-3.5 cursor-pointer border-2 ${form.unidad === u.key ? 'border-sura-azul-cielo bg-sura-azul-tint' : 'border-sura-azul-divider bg-sura-blanco'}`}
                  >
                    <div className="text-sm font-bold">{u.label}</div>
                    <div className="text-xs text-gris-500 mt-0.5">{u.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">3 · Datos del producto</div>
              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))]">
                <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Referencia</span>
                  <input value={form.ref} onChange={(e) => setF('ref', e.target.value)} placeholder="SU-101"
                    className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full font-mono focus:border-b-sura-azul-cielo" />
                </label>
                <label className="grid gap-1.5 min-w-0 col-span-full"><span className="text-xs font-bold text-gris-500">Nombre</span>
                  <input value={form.nombre} onChange={(e) => setF('nombre', e.target.value)} placeholder="Suela Clásica Ranger"
                    className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
                </label>
                <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Color</span>
                  <input value={form.color} onChange={(e) => setF('color', e.target.value)} placeholder="Negro"
                    className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
                </label>
                <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Costo {fPorTalla ? 'por par (COP)' : 'por unidad (COP)'}</span>
                  <input value={form.costo} onChange={(e) => setF('costo', digits(e.target.value))} placeholder="0"
                    className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
                </label>
                <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Precio {fPorTalla ? 'por par (COP)' : 'por unidad (COP)'}</span>
                  <input value={form.precio} onChange={(e) => setF('precio', digits(e.target.value))} placeholder="0"
                    className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
                </label>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">4 · Foto del producto</div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-sura-azul-divider bg-sura-azul-tint-light grid place-items-center overflow-hidden shrink-0">
                  {form.foto_url ? <img src={form.foto_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon />}
                </div>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void onFotoChange(e.target.files?.[0] ?? null)} />
                <Btn size="sm" disabled={subiendoFoto} onClick={() => fileInput.current?.click()}>{subiendoFoto ? 'Subiendo…' : 'Subir foto'}</Btn>
                {form.foto_url && <Btn size="sm" variant="dangerOutline" onClick={() => setF('foto_url', null)}>Quitar</Btn>}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2">5 · Existencias y stock mínimo</div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-2.5 items-center bg-sura-azul-tint-light border border-sura-azul-divider rounded-2xl px-3.5 py-3 mb-3">
                <div className="flex-[1_1_170px] min-w-0">
                  <div className="text-[13px] font-bold">Stock mínimo</div>
                  <div className="text-xs text-gris-500">Avisa cuando queden {Number(form.min) || 0} {fPorTalla ? 'pares' : 'unidades'} o menos</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setF('min', String(Math.max(0, (Number(form.min) || 0) - 1)))} className="w-9 h-9 rounded-full border border-gris-300 bg-sura-blanco cursor-pointer text-lg font-bold">−</button>
                  <input value={form.min} onChange={(e) => setF('min', digits(e.target.value))} placeholder="10"
                    className="w-[72px] border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2.5 py-2 text-[15px] outline-none text-right tabular-nums focus:border-b-sura-azul-cielo" />
                  <button onClick={() => setF('min', String((Number(form.min) || 0) + 1))} className="w-9 h-9 rounded-full border-none bg-sura-azul-cielo text-sura-blanco cursor-pointer text-lg font-bold">+</button>
                </div>
              </div>

              {!fPorTalla && (
                <div className="flex items-center gap-3">
                  <input value={form.stock} onChange={(e) => setF('stock', digits(e.target.value))} placeholder="0"
                    className="w-[150px] border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-base outline-none text-right tabular-nums focus:border-b-sura-azul-cielo" />
                  <span className="text-[13px] text-gris-500">unidades en bodega</span>
                </div>
              )}

              {fPorTalla && (
                <div className="flex flex-wrap gap-2.5 items-start">
                  {form.tallas.map((t, idx) => (
                    <div key={idx} className="w-[92px] border border-sura-azul-divider rounded-2xl p-2.5 bg-sura-azul-tint-light">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[13px] font-bold">Talla {t.talla}</span>
                        <button title="Quitar talla" onClick={() => setF('tallas', form.tallas.filter((_, i) => i !== idx))} className="border-none bg-transparent cursor-pointer text-danger-1 leading-none text-[15px]">×</button>
                      </div>
                      <input value={t.pares} onChange={(e) => { const arr = form.tallas.slice(); arr[idx] = { talla: t.talla, pares: digits(e.target.value) }; setF('tallas', arr) }}
                        className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2 py-1.5 text-sm outline-none text-right focus:border-b-sura-azul-cielo" />
                    </div>
                  ))}
                  <div className="w-[92px] grid gap-1.5">
                    <input value={nuevaTalla} onChange={(e) => setNuevaTalla(digits(e.target.value))} placeholder="Talla"
                      className="w-full border border-dashed border-gris-300 rounded-t-xl px-2 py-2 text-[13px] outline-none text-center focus:border-sura-azul-cielo" />
                    <Btn variant="outlineProf" size="sm" onClick={onAddTalla}>Agregar talla</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-[1_1_220px] min-w-0 bg-sura-azul-tint-light border border-sura-azul-divider rounded-2xl p-3.5">
            <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof mb-2.5">Resumen</div>
            <div className="text-[15px] font-bold mb-0.5">{form.nombre.trim() || 'Producto sin nombre'}</div>
            <div className="text-xs text-gris-500 mb-4">{(form.tipo || 'Sin tipo') + (form.color ? ' · ' + form.color : '') + (form.ref ? ' · ' + form.ref.toUpperCase() : '')}</div>
            <div className="grid gap-0.5">
              <KvRow k={fPorTalla ? 'Tallas cargadas' : 'Presentación'}>{fPorTalla ? String(form.tallas.length) : 'Por unidad'}</KvRow>
              <KvRow k={fPorTalla ? 'Pares totales' : 'Unidades'}>{fStock.toLocaleString('es-CO')}</KvRow>
              <KvRow k="Precio">{cop(Number(form.precio) || 0)}</KvRow>
              <KvRow k="Utilidad"><span className={fUtil > 0 ? 'text-success-1' : fUtil < 0 ? 'text-danger-1' : 'text-gris-350'}>{cop(fUtil)}</span></KvRow>
              <KvRow k="Valor en bodega">{cop(fStock * (Number(form.costo) || 0))}</KvRow>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-between items-center px-[clamp(12px,3vw,20px)] py-3 border-t border-sura-azul-divider bg-gris-100">
          <div className="text-[13px] text-gris-500">{fPorTalla ? 'El stock se lleva talla por talla, siempre en pares.' : 'El stock se lleva como unidades sueltas.'}</div>
          <div className="flex gap-2.5">
            <Btn onClick={closeModal}>Cancelar</Btn>
            <Btn variant="cta" disabled={guardando} onClick={() => void onGuardar()}>{form.original ? 'Guardar cambios' : 'Crear producto'}</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
