import { useMemo, useState } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import { logger } from '../lib/logger'
import { useProductos } from '../hooks/useProductos'
import { useRegistrarVenta } from '../hooks/useVentas'
import { useCajas } from '../hooks/useCaja'
import { cop, paresDe, porTalla, unidadTxt } from '../lib/format'
import { calcularTotalesCarrito, mapearErrorCajaVenta, obtenerCajaDelDia, revisarVentaParaCaja } from '../lib/ventasCaja.js'
import type { Producto, MetodoPago, VentaConItems } from '../types/database'
import { SearchIcon } from '../components/Icons'
import { Btn, Card, Pill } from '../components/ui'

const METODOS: MetodoPago[] = ['Efectivo', 'Transferencia']

interface ItemCarrito {
  ref: string
  talla: string | null
  nombre: string
  unidad: 'par' | 'unidad'
  pares: number
  precio: number
  costo: number
}

export default function Venta() {
  const { profile } = useAuth()
  const { openModal, showToast, setScreen } = useUI()
  const { data: productos = [] } = useProductos()
  const { data: cajas = [] } = useCajas()
  const registrarVenta = useRegistrarVenta()
  const cajaAbierta = obtenerCajaDelDia(cajas)?.estado === 'abierta'

  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [selRef, setSelRef] = useState<string | null>(null)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [mostrarArticulos, setMostrarArticulos] = useState(false)
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo')
  const [cliente, setCliente] = useState('')
  const [enviando, setEnviando] = useState(false)

  const activos = useMemo(() => productos.filter((p) => !p.archivado), [productos])
  const sel = productos.find((p) => p.ref === selRef) ?? null

  logger.info('VENTAS', 'Render de pantalla de venta', {
    productos: productos.length,
    cajaAbierta,
    carritoItems: carrito.length,
    selected: selRef,
  })

  const data = useMemo(() => {
    const qq = q.toLowerCase()
    const match = (m: Producto) => (m.ref + ' ' + m.nombre + ' ' + m.tipo + ' ' + (m.color ?? '')).toLowerCase().includes(qq)
    const disponibles = activos.filter(match).filter((m) => {
      if (filtro === 'todos') return true
      if (filtro === 'disponibles') return paresDe(m) > 0
      return m.tipo === filtro
    })
    const tiposCat: string[] = []
    activos.forEach((m) => { if (!tiposCat.includes(m.tipo)) tiposCat.push(m.tipo) })
    const filtros: [string, string][] = [['todos', 'Todos'], ['disponibles', 'Con stock'], ...tiposCat.map((x): [string, string] => [x, x])]
    return { disponibles, filtros }
  }, [activos, q, filtro])

  const enCarrito = (ref: string, talla: string | null) => carrito.find((c) => c.ref === ref && c.talla === talla)?.pares ?? 0

  // Fija la cantidad exacta (escrita a mano o con las flechas ↑/↓ del input),
  // recortada a lo que hay en bodega.
  function setCantidad(m: Producto, talla: string | null, cantidadDeseada: number) {
    const stock = porTalla(m) ? Number(m.tallas[talla ?? ''] ?? 0) : Number(m.stock ?? 0)
    const un = unidadTxt(m)
    const donde = talla ? ' en la talla ' + talla : ' de ' + m.nombre
    let cant = Math.max(0, Math.floor(Number.isFinite(cantidadDeseada) ? cantidadDeseada : 0))
    if (cant > stock) {
      cant = stock
      logger.warn('VENTAS', 'Cantidad ajustada por stock', { ref: m.ref, talla, stock, requested: cantidadDeseada, final: cant })
      showToast(stock <= 0 ? 'Sin ' + un + ' disponibles' + donde : 'Solo quedan ' + stock + ' ' + un + donde)
    }
    logger.info('VENTAS', 'Actualizar cantidad en carrito', { ref: m.ref, talla, cantidadDeseada, final: cant, stock })
    setCarrito((prev) => {
      const i = prev.findIndex((x) => x.ref === m.ref && x.talla === talla)
      if (i >= 0) {
        const copia = prev.slice()
        if (cant <= 0) copia.splice(i, 1); else copia[i] = { ...copia[i], pares: cant }
        return copia
      }
      if (cant > 0) return prev.concat([{ ref: m.ref, talla, nombre: m.nombre, unidad: m.unidad, pares: cant, precio: m.precio, costo: m.costo }])
      return prev
    })
  }

  // Botones +/− del catálogo: suma o resta 1 sobre lo que ya haya en el carrito.
  function addCarrito(m: Producto, talla: string | null, n: number) {
    setCantidad(m, talla, enCarrito(m.ref, talla) + n)
  }

  const { items: carritoItems, pares: carritoPares, unidades: carritoUnidades, total: carritoTotal } = calcularTotalesCarrito(carrito)

  async function cobrar() {
    if (!carrito.length || enviando) return

    logger.info('VENTAS', 'Intento de cobro', { items: carrito.length, metodo, cliente: cliente.trim() || 'Consumidor final' })

    const validacion = revisarVentaParaCaja({ cajaAbierta, carrito: carrito.map((c) => ({ ref: c.ref, talla: c.talla, pares: c.pares })), productos })
    if (!validacion.ok) {
      logger.error('VENTAS', 'Validación de venta fallida', { error: validacion.error, items: carrito.length })
      showToast(validacion.error ?? 'No se pudo validar la venta')
      return
    }

    if (!cajaAbierta) {
      logger.warn('VENTAS', 'Venta bloqueada: caja cerrada')
      showToast('Debes abrir la caja del día antes de registrar ventas')
      return
    }

    setEnviando(true)
    try {
      logger.info('VENTAS', 'Enviando venta a Supabase', { items: carrito.length, metodo, cliente: cliente.trim() || 'Consumidor final' })
      const id = await registrarVenta.mutateAsync({
        items: carrito.map((c) => ({ ref: c.ref, talla: c.talla, pares: c.pares })),
        metodo, cliente: cliente.trim() || null,
      })
      logger.success('VENTAS', 'Venta registrada correctamente', { id, total: carritoTotal })
      const venta: VentaConItems = {
        id, fecha: new Date().toISOString(), vendedor_id: profile?.id ?? '', vendedor_nombre: profile?.nombre ?? '',
        metodo, cliente: cliente.trim() || 'Consumidor final', total: carritoTotal,
        costo: carrito.reduce((a, c) => a + c.pares * c.costo, 0), devuelta: false, created_at: new Date().toISOString(),
        venta_items: carrito.map((c, idx) => ({ id: idx, venta_id: id, ref: c.ref, nombre: c.nombre, talla: c.talla, unidad: c.unidad, pares: c.pares, precio: c.precio, costo: c.costo })),
      }
      setCarrito([]); setCliente(''); setSelRef(null)
      logger.info('VENTAS', 'Carrito reiniciado tras venta', { ventaId: id })
      openModal('factura', venta)
      logger.info('VENTAS', 'Factura abierta', { ventaId: id, total: carritoTotal })
    } catch (err) {
      const error = mapearErrorCajaVenta(err)
      logger.error('VENTAS', 'Error al registrar la venta', { code: error.code, msg: error.message, items: carrito.length, metodo })
      showToast(error.message)
    } finally {
      setEnviando(false)
      logger.info('VENTAS', 'Fin del flujo de cobro', { enviando: false, carritoActual: carrito.length })
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Nueva venta</h1>
          <div className="text-sm text-gris-500">Paso 1: elige el modelo. Paso 2: ajusta cantidades. Paso 3: cobra.</div>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${cajaAbierta ? 'border-success-border bg-success-2 text-success-1' : 'border-warning-border bg-warning-2 text-warning-1'}`}>
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${cajaAbierta ? 'bg-success-1' : 'bg-warning-1'}`} />
          {cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-sura-azul-divider bg-sura-blanco px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gris-350">Paso 1</div>
          <div className="mt-1 text-sm font-bold text-sura-azul-prof">Busca el producto</div>
        </div>
        <div className="rounded-2xl border border-sura-azul-divider bg-sura-blanco px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gris-350">Paso 2</div>
          <div className="mt-1 text-sm font-bold text-sura-azul-prof">Ajusta cantidades</div>
        </div>
        <div className="rounded-2xl border border-sura-azul-divider bg-sura-blanco px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gris-350">Paso 3</div>
          <div className="mt-1 text-sm font-bold text-sura-azul-prof">Cobro y factura</div>
        </div>
      </div>

      {!cajaAbierta && (
        <div className="flex flex-wrap gap-3 items-center justify-between bg-warning-2 border border-warning-border rounded-xl px-4 py-3 mb-4 text-sm text-warning-1">
          <span><strong>Debes abrir la caja del día</strong> antes de registrar ventas.</span>
          <Btn size="sm" variant="cta" onClick={() => setScreen('reportes')}>Ir a abrir caja</Btn>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-start">
        <div className="flex-[4_1_440px] min-w-0 grid gap-4">

          {sel && porTalla(sel) && (
            <Card className="border-2 border-sura-azul-cielo">
              <div className="flex flex-wrap gap-3 justify-between items-start mb-3.5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">Paso 2 · toca la talla para agregar un par</div>
                  <div className="text-[17px] font-bold mt-1">{sel.ref} · {sel.nombre} · {sel.color}</div>
                  <div className="text-[13px] text-gris-500 mt-0.5">{cop(sel.precio)} por par · toca la talla, usa + y − o escribe la cantidad</div>
                </div>
                <Btn size="sm" onClick={() => setSelRef(null)}>Cambiar modelo</Btn>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {Object.keys(sel.tallas).sort().map((t) => {
                  const stock = Number(sel.tallas[t])
                  const enCarr = enCarrito(sel.ref, t)
                  return (
                    <div
                      key={t} onClick={() => addCarrito(sel, t, 1)}
                      className={`w-[108px] rounded-xl p-3 cursor-pointer select-none border ${enCarr ? 'border-sura-azul-cielo bg-sura-azul-tint' : 'border-sura-azul-divider bg-sura-azul-tint-light'} ${stock === 0 ? 'opacity-55' : ''}`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-[22px] font-bold leading-none">{t}</span>
                        <span className={`text-xs font-bold tabular-nums ${stock === 0 ? 'text-danger-1' : stock < 6 ? 'text-warning-1' : 'text-gris-350'}`}>{stock}</span>
                      </div>
                      <div className="text-[11px] text-gris-350 my-0.5 mb-2.5">pares en bodega</div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); addCarrito(sel, t, -1) }} className="w-7 h-7 rounded-full border border-gris-300 bg-sura-blanco cursor-pointer font-bold">−</button>
                        <input
                          type="number" min={0} inputMode="numeric" value={enCarr === 0 ? '' : enCarr}
                          onClick={(e) => { e.stopPropagation(); if (enCarr === 0) e.currentTarget.value = '' }}
                          onChange={(e) => { e.stopPropagation(); setCantidad(sel, t, Number(e.target.value || 0)) }}
                          className="flex-1 w-0 min-w-0 text-center text-[15px] font-bold tabular-nums border border-gris-300 rounded-md py-0.5 outline-none focus:border-sura-azul-cielo [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={(e) => { e.stopPropagation(); addCarrito(sel, t, 1) }} className="w-7 h-7 rounded-full border-none bg-sura-azul-cielo text-sura-blanco cursor-pointer font-bold">+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {sel && !porTalla(sel) && (
            <Card className="border-2 border-sura-azul-cielo flex flex-wrap gap-4 items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">Paso 2 · cuántas unidades</div>
                <div className="text-[17px] font-bold mt-1">{sel.ref} · {sel.nombre} · {sel.color}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                  <span className="rounded-full bg-sura-azul-tint px-2.5 py-1 font-bold text-sura-azul-prof">{cop(sel.precio)} / unidad</span>
                  <span className="rounded-full bg-gris-100 px-2.5 py-1 font-bold text-gris-500">Stock: {paresDe(sel)} {unidadTxt(sel)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => addCarrito(sel, null, -1)} className="w-10 h-10 rounded-full border border-gris-300 bg-sura-blanco text-xl font-bold cursor-pointer">−</button>
                <input
                  type="number" min={0} inputMode="numeric" value={enCarrito(sel.ref, null) === 0 ? '' : enCarrito(sel.ref, null)}
                  onFocus={(e) => { if (enCarrito(sel.ref, null) === 0) e.currentTarget.value = '' }}
                  onChange={(e) => setCantidad(sel, null, Number(e.target.value || 0))}
                  className="min-w-[56px] w-[76px] text-center text-2xl font-bold tabular-nums border border-gris-300 rounded-lg py-1 outline-none focus:border-sura-azul-cielo [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button onClick={() => addCarrito(sel, null, 1)} className="w-10 h-10 rounded-full border-none bg-sura-azul-cielo text-sura-blanco text-xl font-bold cursor-pointer">+</button>
                <Btn size="sm" onClick={() => setSelRef(null)}>Cambiar producto</Btn>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap gap-x-3 gap-y-2.5 items-center mb-3">
              <div className="flex-[1_1_240px] min-w-0 relative">
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Paso 1 · escribe la referencia o el nombre del producto"
                  className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl pl-10 pr-3.5 py-3 text-sm outline-none focus:border-b-sura-azul-cielo"
                />
                <span className="absolute left-3.5 top-3"><SearchIcon /></span>
              </div>
              {q.length > 0 && <Btn size="sm" onClick={() => { setQ(''); setFiltro('todos') }}>Limpiar</Btn>}
            </div>

            <div className="flex gap-2 items-center mb-3 flex-wrap">
              {data.filtros.map(([key, label]) => (
                <Pill key={key} tone="prof" active={filtro === key} onClick={() => setFiltro(key)}>{label}</Pill>
              ))}
              <div className="flex-1" />
              <div className="text-[13px] text-gris-350 whitespace-nowrap">{data.disponibles.length} de {activos.length} modelos</div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-sura-azul-divider rounded-xl">
              {data.disponibles.map((m, idx) => {
                const pares = paresDe(m)
                const activo = selRef === m.ref
                return (
                  <div
                    key={m.ref} onClick={() => setSelRef(m.ref)}
                    className={`flex flex-wrap items-center gap-x-3.5 gap-y-2 px-3.5 py-2.5 cursor-pointer select-none ${idx !== 0 ? 'border-t border-sura-azul-divider' : ''} ${activo ? 'bg-sura-azul-tint' : 'bg-sura-blanco'} ${pares === 0 ? 'opacity-55' : ''}`}
                  >
                    <span className="flex-[1_1_190px] min-w-0 grid gap-0.5">
                      <span className="text-sm font-bold break-words">{m.nombre}</span>
                      <span className="text-xs text-gris-500"><span className="font-mono text-sura-azul-prof">{m.ref}</span> · {m.tipo} · {m.color}</span>
                    </span>
                    <span className={`flex-none text-right text-[13px] tabular-nums whitespace-nowrap ${pares === 0 ? 'text-danger-1' : pares <= m.min ? 'text-warning-1' : 'text-gris-500'}`}>
                      {pares === 0 ? 'agotado' : pares + ' ' + unidadTxt(m)}
                    </span>
                    <span className="flex-none text-right text-sm font-bold tabular-nums whitespace-nowrap">{cop(m.precio)}</span>
                    <span className={`flex-none min-w-[76px] text-center rounded-full px-3 py-1.5 text-xs font-bold border ${activo ? 'border-sura-azul-cielo bg-sura-azul-cielo text-sura-blanco' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}>
                      {activo ? 'Elegido' : 'Elegir'}
                    </span>
                  </div>
                )
              })}
              {data.disponibles.length === 0 && (
                <div className="py-7 px-4 text-center text-sm text-gris-350">No encontramos modelos con esa búsqueda. Revisa la referencia o limpia los filtros.</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="flex-[1_1_320px] min-w-0 max-w-[420px] sticky top-[84px]">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="text-sm font-bold uppercase tracking-wide text-sura-azul-prof">Carrito</div>
            <div className="rounded-full bg-sura-azul-tint px-2.5 py-1 text-[11px] font-bold text-sura-azul-prof">{carritoItems} artículo{carritoItems === 1 ? '' : 's'}</div>
          </div>

          <div className="rounded-2xl bg-gris-150 border border-gris-200 px-3.5 py-3 mb-3.5">
            <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-gris-350">
              <span>Resumen</span>
              <span>{metodo}</span>
            </div>
            <div className="grid gap-2.5 text-sm">
              <button
                type="button"
                aria-expanded={mostrarArticulos}
                onClick={() => setMostrarArticulos((mostrar) => !mostrar)}
                className="flex w-full items-center justify-between rounded-xl bg-sura-blanco px-2.5 py-2 border border-gris-200 text-left cursor-pointer"
              >
                <span className="text-gris-500">Artículos <span className="text-[11px]">{mostrarArticulos ? '−' : '+'}</span></span>
                <span className="font-bold tabular-nums">{carritoItems}</span>
              </button>
              {mostrarArticulos && (
                <div className={`pr-1 ${carrito.length > 5 ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                  {carrito.length === 0 ? (
                    <div className="py-3 text-center text-[13px] text-gris-350">Agrega productos desde el catálogo.</div>
                  ) : (
                    <div className="grid gap-2.5">
                      {carrito.map((c, i) => {
                        const producto = productos.find((p) => p.ref === c.ref)
                        const itemLabel = c.unidad === 'par' ? (c.talla ? `Talla ${c.talla}` : 'Pares') : 'Unidad'
                        const productoFallback = {
                          ref: c.ref,
                          nombre: c.nombre,
                          tipo: '',
                          unidad: c.unidad,
                          color: null,
                          precio: c.precio,
                          costo: c.costo,
                          min: 0,
                          tallas: {},
                          stock: 0,
                          foto_url: null,
                          archivado: false,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        } as unknown as Producto
                        const productoActivo = producto ?? productoFallback
                        return (
                          <div key={i} className="rounded-2xl border border-sura-azul-divider bg-gris-100/70 p-2.5">
                            <div className="flex items-start gap-2.5">
                              <div className="flex-[1_1_130px] min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="rounded-full bg-sura-azul-tint px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sura-azul-prof">{c.unidad === 'par' ? 'Par' : 'Unidad'}</span>
                                  <span className="text-[11px] text-gris-500">{c.ref}</span>
                                </div>
                                <div className="text-sm font-bold leading-snug">{c.nombre}</div>
                                <div className="text-xs text-gris-500 mt-0.5">{itemLabel} · {cop(c.precio)} / {c.unidad === 'unidad' ? 'unidad' : 'par'}</div>
                              </div>

                              <button title="Quitar" onClick={() => setCarrito((prev) => prev.filter((x) => !(x.ref === c.ref && x.talla === c.talla)))} className="border-none bg-transparent cursor-pointer text-danger-1 text-base leading-none mt-0.5">×</button>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => addCarrito(productoActivo, c.talla, -1)} className="w-6 h-6 rounded-full border border-gris-300 bg-sura-blanco cursor-pointer font-bold">−</button>
                                <input
                                  type="number" min={0} inputMode="numeric" value={c.pares === 0 ? '' : c.pares}
                                  onFocus={(e) => { if (c.pares === 0) e.currentTarget.value = '' }}
                                  onChange={(e) => setCantidad(productoActivo, c.talla, Number(e.target.value || 0))}
                                  className="w-12 text-center font-bold tabular-nums border border-gris-300 rounded-md py-0.5 outline-none focus:border-sura-azul-cielo [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button onClick={() => addCarrito(productoActivo, c.talla, 1)} className="w-6 h-6 rounded-full border-none bg-sura-azul-cielo text-sura-blanco cursor-pointer font-bold">+</button>
                              </div>

                              <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wide text-gris-350">Subtotal</div>
                                <div className="font-bold tabular-nums text-sm">{cop(c.pares * c.precio)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl bg-sura-blanco px-2.5 py-2 border border-gris-200">
                <span className="text-gris-500">Pares</span>
                <span className="font-bold tabular-nums text-sura-azul-prof">{carritoPares}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-sura-blanco px-2.5 py-2 border border-gris-200">
                <span className="text-gris-500">Unidades</span>
                <span className="font-bold tabular-nums text-warning-1">{carritoUnidades}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-sura-azul-tint px-2.5 py-2.5 border border-sura-azul-cielo">
                <span className="font-bold text-sura-azul-prof">Total</span>
                <span className="font-black tabular-nums text-sura-azul-prof">{cop(carritoTotal)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof my-1.5 mb-2">Forma de pago</div>
          <div className="flex flex-wrap gap-2 mb-2.5">
            {METODOS.map((m) => (
              <Pill key={m} active={metodo === m} onClick={() => setMetodo(m)} className="w-full text-left px-4 py-2.5">{m}</Pill>
            ))}
          </div>
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente (opcional)"
            className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm mb-3.5 outline-none focus:border-b-sura-azul-cielo" />
          <Btn variant="cta" className="w-full py-3.5 text-[15px]" disabled={carrito.length === 0 || enviando || !cajaAbierta} onClick={() => void cobrar()}>
            {enviando ? 'Cobrando…' : !cajaAbierta ? 'Abre la caja para cobrar' : `Cobrar y facturar · ${cop(carritoTotal)}`}
          </Btn>
        </Card>
      </div>
    </div>
  )
}
