import { useState } from 'react'
import { useUI } from '../../state/ui'
import { useProductos, useRegistrarAjuste, useRegistrarEntrada } from '../../hooks/useProductos'
import { paresDe } from '../../lib/format'
import { Btn } from '../ui'

function digits(value: string) { return value.replace(/[^0-9]/g, '') }

function parseRango(value: string): string[] | null {
  const match = value.trim().match(/^(\d{1,2})\s*(?:-|–)\s*(\d{1,2})$/)
  if (!match) return null
  const desde = Number(match[1]), hasta = Number(match[2])
  if (desde < 1 || hasta > 99 || desde > hasta || hasta - desde > 50) return null
  return Array.from({ length: hasta - desde + 1 }, (_, index) => String(desde + index))
}

interface Payload { ref?: string }

export default function EntradaModal() {
  const { modalPayload, closeModal, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const registrarEntrada = useRegistrarEntrada()
  const registrarAjuste = useRegistrarAjuste()
  const activos = productos.filter((product) => !product.archivado)
  const inicial = modalPayload as Payload | null
  const [ref, setRef] = useState(inicial?.ref ?? activos[0]?.ref ?? '')
  const [modo, setModo] = useState<'entrada' | 'conteo'>('entrada')
  const modeloInicial = activos.find((product) => product.ref === (inicial?.ref ?? activos[0]?.ref))
  const [modoStock, setModoStock] = useState<'total' | 'talla'>(modeloInicial?.modo_stock ?? 'total')
  const [rango, setRango] = useState('')
  const [stock, setStock] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [tallas, setTallas] = useState<Record<string, string>>({})
  const [talla, setTalla] = useState<string | null>(null)
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState('Conteo físico')
  const [enviando, setEnviando] = useState(false)

  const modelo = productos.find((product) => product.ref === ref)
  const tallasGuardadas = modelo ? Object.keys(modelo.tallas).sort((a, b) => Number(a) - Number(b)) : []
  const tallasActuales = tallasGuardadas.length ? tallasGuardadas : parseRango(rango) ?? []
  const cantidadTallas = tallasActuales.reduce((sum, size) => sum + (Number(tallas[size]) || 0), 0)
  const actual = modelo ? paresDe(modelo) : 0

  function seleccionarProducto(nextRef: string) {
    const seleccionado = activos.find((product) => product.ref === nextRef)
    setRef(nextRef)
    setModoStock(seleccionado?.modo_stock ?? 'total')
    setRango('')
    setStock('')
    setProveedor('')
    setTallas({})
    setValor('')
    setTalla(null)
  }

  async function onGuardar() {
    if (!modelo) return
    const tallasPayload = Object.fromEntries(tallasActuales.map((size) => [size, Number(tallas[size]) || 0]))
    if (modoStock === 'talla' && !tallasActuales.length) {
      showToast('Escribe un rango de tallas válido, por ejemplo 34-40')
      return
    }
    if (modo === 'entrada' && modoStock === 'total' && Number(stock) <= 0) {
      showToast('Indica cuántos pares entran')
      return
    }
    if (modo === 'entrada' && modoStock === 'talla' && cantidadTallas <= 0) {
      showToast('Indica cuántos pares entran por talla')
      return
    }
    if (modo === 'conteo' && modoStock === 'total' && valor === '') {
      showToast('Escribe la cantidad real que contaste')
      return
    }
    setEnviando(true)
    try {
      if (modo === 'entrada') {
        await registrarEntrada.mutateAsync({
          ref: modelo.ref,
          modo_stock: modoStock,
          tallas: modoStock === 'talla' ? tallasPayload : {},
          stock: modoStock === 'total' ? Number(stock) : 0,
          proveedor: proveedor.trim() || null,
        })
        showToast('Existencias actualizadas')
      } else {
        await registrarAjuste.mutateAsync({
          ref: modelo.ref,
          modo_stock: modoStock,
          tallas: modoStock === 'talla' ? tallasPayload : {},
          stock: modoStock === 'total' ? Number(valor) : 0,
          talla: modoStock === 'talla' ? talla : null,
          valor: Number(valor) || 0,
          motivo,
        })
        showToast('Existencias corregidas')
      }
      closeModal()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudieron guardar las existencias')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,63,0.55)] z-[90] grid place-items-center p-[clamp(8px,3vw,32px)] overflow-auto" onClick={closeModal}>
      <div onClick={(event) => event.stopPropagation()} className="w-[min(600px,95vw)] max-h-[92vh] overflow-y-auto bg-sura-blanco rounded-2xl p-[clamp(12px,3vw,20px)] shadow-2xl">
        <h2 className="text-xl text-sura-azul-prof m-0 mb-1">Actualizar stock</h2>
        <div className="text-[13px] text-gris-500 mb-4">Registra la entrada o corrige el conteo del producto.</div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {([{ key: 'entrada', label: 'Llegó mercancía' }, { key: 'conteo', label: 'Conteo real' }] as const).map((option) => (
            <button key={option.key} onClick={() => { setModo(option.key); setStock(''); setTallas({}); setValor('') }} aria-pressed={modo === option.key}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold cursor-pointer ${modo === option.key ? 'border-sura-azul-cielo bg-sura-azul-tint' : 'border-sura-azul-divider bg-sura-blanco'}`}>
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3.5 mb-4 grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))]">
          <label className="grid gap-1.5 min-w-0"><span className="text-xs font-bold text-gris-500">Producto</span>
            <select value={ref} onChange={(event) => seleccionarProducto(event.target.value)}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo">
              {activos.map((product) => <option key={product.ref} value={product.ref}>{product.ref} · {product.nombre}</option>)}
            </select>
          </label>
          <div className="grid gap-1.5 min-w-0">
            <span className="text-xs font-bold text-gris-500">Forma de control</span>
            <div className="flex gap-2">
              {([
                { key: 'total', label: 'Total' },
                { key: 'talla', label: 'Por talla' },
              ] as const).map((option) => (
                <button key={option.key} onClick={() => { setModoStock(option.key); setStock(''); setTallas({}); setValor('') }} aria-pressed={modoStock === option.key}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold cursor-pointer ${modoStock === option.key ? 'border-sura-azul-cielo bg-sura-azul-tint text-sura-azul-prof' : 'border-gris-300 bg-sura-blanco text-gris-500'}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {modo === 'entrada' && (
            <label className="grid gap-1.5 max-w-sm mb-4"><span className="text-xs font-bold text-gris-500">Proveedor (opcional)</span>
              <input value={proveedor} onChange={(event) => setProveedor(event.target.value)} placeholder="Nombre del proveedor"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
            </label>
          )}
        </div>

        {modoStock === 'total' ? (
          <div className="grid gap-1.5 mb-4">
            <label className="grid gap-1.5 max-w-xs"><span className="text-xs font-bold text-gris-500">{modo === 'entrada' ? 'Pares que ingresan' : 'Cantidad total contada'}</span>
              <input value={modo === 'entrada' ? stock : valor} onChange={(event) => modo === 'entrada' ? setStock(digits(event.target.value)) : setValor(digits(event.target.value))} placeholder="0"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full text-right tabular-nums focus:border-b-sura-azul-cielo" />
            </label>
            {modo === 'entrada' && modelo?.modo_stock === 'talla' && <div className="text-xs text-gris-500">El total actual por talla se sumará a esta cantidad y pasará a control total.</div>}
            {modo === 'conteo' && modelo?.modo_stock === 'talla' && <div className="text-xs text-gris-500">El conteo total reemplazará las cantidades existentes por talla.</div>}
          </div>
        ) : (
          <>
            {modelo?.modo_stock === 'total' && <div className="text-xs text-gris-500 mb-2">Este desglose reemplazará el stock total actual ({actual} pares).</div>}
            {modo === 'entrada' && modelo?.modo_stock === 'total' && <div className="text-xs text-gris-500 mb-2">Al ingresar cantidades por talla, estas reemplazarán el total que no tiene desglose.</div>}
            {!tallasGuardadas.length && (
              <label className="grid gap-1.5 max-w-xs mb-3.5"><span className="text-xs font-bold text-gris-500">Rango de tallas</span>
                <input value={rango} onChange={(event) => { setRango(event.target.value); setTallas({}) }} placeholder="34-40"
                  className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo" />
              </label>
            )}
            {modo === 'conteo' && <div className="text-xs text-gris-500 mb-2">Escribe el conteo real de cada talla. Este desglose reemplazará las existencias anteriores.</div>}
            <div className="flex flex-wrap gap-2.5 mb-4">
              {tallasActuales.map((size) => (
                <label key={size} className="w-[84px] border border-sura-azul-divider rounded-xl p-2.5 bg-sura-azul-tint-light">
                  <span className="block text-[13px] font-bold mb-0.5">Talla {size}</span>
                  <span className="block text-[11px] text-gris-500 mb-1.5">Hay {modelo?.tallas[size] ?? 0}</span>
                  <input aria-label={(modo === 'entrada' ? 'Pares que ingresan talla ' : 'Conteo real talla ') + size}
                    value={tallas[size] ?? ''} onChange={(event) => setTallas((current) => ({ ...current, [size]: digits(event.target.value) }))}
                    className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-2 py-1.5 text-sm outline-none text-right focus:border-b-sura-azul-cielo" />
                </label>
              ))}
            </div>
            <div className="text-xs text-gris-500 mb-4">Total {modo === 'entrada' ? 'que ingresa' : 'contado'}: {cantidadTallas} pares</div>
          </>
        )}

        {modo === 'conteo' && (
          <label className="grid gap-1.5 mb-4 max-w-xs"><span className="text-xs font-bold text-gris-500">Motivo</span>
            <select value={motivo} onChange={(event) => setMotivo(event.target.value)}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3 py-2.5 text-sm outline-none w-full focus:border-b-sura-azul-cielo">
              {['Conteo físico', 'Rotura', 'Muestra', 'Pérdida'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        )}

        <div className="bg-sura-azul-tint border border-sura-azul-chip rounded-xl px-3.5 py-3 text-[13px] text-sura-azul-prof mb-[18px]">
          Stock actual: {actual} pares. {modo === 'entrada' && modoStock === 'total' && modelo?.modo_stock === 'total' && `Quedarán ${actual + (Number(stock) || 0)} pares.`}
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 justify-end pt-[18px] border-t border-sura-azul-divider">
          <Btn onClick={closeModal}>Cancelar</Btn>
          <Btn variant="cta" disabled={enviando || !modelo} onClick={() => void onGuardar()}>{enviando ? 'Guardando…' : modo === 'entrada' ? 'Guardar entrada' : 'Guardar conteo'}</Btn>
        </div>
      </div>
    </div>
  )
}
