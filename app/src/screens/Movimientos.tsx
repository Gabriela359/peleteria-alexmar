import { useMemo } from 'react'
import { useMovimientos } from '../hooks/useMovimientos'
import { useProductos } from '../hooks/useProductos'
import { useVentas } from '../hooks/useVentas'
import { cop, fecha, hhmm, paresDe, unidadTxt } from '../lib/format'
import { Card, EmptyRow } from '../components/ui'
import type { Movimiento, Producto, VentaConItems } from '../types/database'

const SIN_MOVIMIENTOS: Movimiento[] = []
const SIN_PRODUCTOS: Producto[] = []
const SIN_VENTAS: VentaConItems[] = []

interface FilaMovimiento {
  id: string
  fecha: string
  productoRef: string | null
  producto: string
  detalle: string
  entradas: number
  salidas: number
  existencia: number | null
  unidad: string
  deltaStock: number
  costoUnitario: number | null
  valorMovimiento: number | null
  valorExistencia: number | null
}

export default function Movimientos() {
  const movimientosQuery = useMovimientos()
  const productosQuery = useProductos()
  const ventasQuery = useVentas()
  const movimientos = movimientosQuery.data ?? SIN_MOVIMIENTOS
  const productos = productosQuery.data ?? SIN_PRODUCTOS
  const ventas = ventasQuery.data ?? SIN_VENTAS

  const filas = useMemo(() => {
    const porRef = new Map(productos.map((producto) => [producto.ref, producto]))
    const resultado: FilaMovimiento[] = []

    for (const movimiento of movimientos) {
      if (movimiento.tipo === 'archivado' || movimiento.tipo === 'reactivado' || movimiento.tipo === 'devolucion') continue

      const producto = movimiento.producto_ref ? porRef.get(movimiento.producto_ref) : undefined
      const cantidad = Number(movimiento.pares) || 0
      const entradas = Math.max(cantidad, 0)
      const salidas = movimiento.tipo === 'ajuste' ? Math.max(-cantidad, 0) : 0

      resultado.push({
        id: `mov-${movimiento.id}`,
        fecha: movimiento.fecha,
        productoRef: movimiento.producto_ref,
        producto: movimiento.modelo,
        detalle: movimiento.detalle,
        entradas,
        salidas,
        existencia: producto ? paresDe(producto) : null,
        unidad: producto ? unidadTxt(producto) : 'pares',
        deltaStock: movimiento.tipo === 'ajuste' ? cantidad : entradas,
        costoUnitario: producto?.costo ?? null,
        valorMovimiento: null,
        valorExistencia: null,
      })
    }

    for (const venta of ventas) {
      for (const item of venta.venta_items) {
        const producto = item.ref ? porRef.get(item.ref) : undefined
        const cantidad = Number(item.pares) || 0
        const productoLabel = `${item.ref ? item.ref + ' · ' : ''}${item.nombre}`
        const costoUnitario = Number(item.costo ?? producto?.costo ?? 0)

        resultado.push({
          id: `venta-${venta.id}-${item.id}`,
          fecha: venta.fecha,
          productoRef: item.ref,
          producto: productoLabel,
          detalle: `Venta · Factura ${venta.id}${item.talla ? ' · Talla ' + item.talla : ''}`,
          entradas: 0,
          salidas: cantidad,
          existencia: producto ? paresDe(producto) : null,
          unidad: item.unidad === 'unidad' ? 'unidades' : 'pares',
          deltaStock: -cantidad,
          costoUnitario,
          valorMovimiento: null,
          valorExistencia: null,
        })

        if (venta.devuelta) {
          resultado.push({
            id: `devolucion-${venta.id}-${item.id}`,
            fecha: venta.fecha,
            productoRef: item.ref,
            producto: productoLabel,
            detalle: `Devolución · Factura ${venta.id}${item.talla ? ' · Talla ' + item.talla : ''}`,
            entradas: cantidad,
            salidas: 0,
            existencia: producto ? paresDe(producto) : null,
            unidad: item.unidad === 'unidad' ? 'unidades' : 'pares',
            deltaStock: cantidad,
            costoUnitario,
            valorMovimiento: null,
            valorExistencia: null,
          })
        }
      }
    }

    const ascendente = resultado.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    const saldos = new Map<string, number>()

    for (const fila of ascendente) {
      if (fila.productoRef && fila.existencia !== null) {
        saldos.set(fila.productoRef, fila.existencia)
      }
    }

    for (const fila of ascendente.slice().reverse()) {
      if (!fila.productoRef || fila.existencia === null) continue
      const saldoDespues = saldos.get(fila.productoRef)
      if (saldoDespues === undefined) continue

      fila.existencia = saldoDespues
      fila.valorMovimiento = fila.costoUnitario === null ? null : fila.deltaStock * fila.costoUnitario
      fila.valorExistencia = fila.costoUnitario === null ? null : saldoDespues * fila.costoUnitario
      saldos.set(fila.productoRef, saldoDespues - fila.deltaStock)
    }

    return ascendente.reverse()
  }, [movimientos, productos, ventas])

  const error = movimientosQuery.error || productosQuery.error || ventasQuery.error

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Movimientos de inventario</h1>
          <div className="text-sm text-gris-500">Consulta los aumentos y descuentos del valor del inventario con cada movimiento.</div>
          <div className="text-xs text-gris-500 mt-1">Las entradas suman al inventario; las ventas descuentan el costo de las unidades vendidas.</div>
          <div className="text-xs text-gris-500">El total indica el valor restante del inventario tras cada movimiento, usando el costo unitario actual.</div>
        </div>
      </div>
      <Card>
        {error && <div role="alert" className="mb-3 rounded-xl border border-danger-border bg-danger-2 px-3 py-2 text-sm text-danger-1">
          No se pudieron cargar todos los movimientos: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th rowSpan={2} className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Fecha</th>
                <th rowSpan={2} className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Producto</th>
                <th rowSpan={2} className="p-3 text-xs uppercase tracking-wide text-success-1 font-semibold text-right">Entradas</th>
                <th rowSpan={2} className="p-3 text-xs uppercase tracking-wide text-danger-1 font-semibold text-right">Salidas</th>
                <th rowSpan={2} className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Existencia actual</th>
                <th colSpan={2} className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-center">Valor</th>
              </tr>
              <tr className="bg-gris-100 text-left border-t border-gris-200">
                <th className="p-3 text-xs tracking-wide text-gris-500 font-semibold text-right">Aumenta / descuenta</th>
                <th className="p-3 text-xs tracking-wide text-gris-500 font-semibold text-right">Total inventario después</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.id} className="border-b border-sura-azul-divider">
                  <td className="p-3 text-gris-500 whitespace-nowrap">{fecha(fila.fecha)} {hhmm(fila.fecha)}</td>
                  <td className="p-3 min-w-[220px]">
                    <div className="font-bold">{fila.producto}</div>
                    <div className="text-xs text-gris-500 mt-0.5">{fila.detalle}</div>
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold text-success-1">
                    {fila.entradas > 0 ? `+${fila.entradas.toLocaleString('es-CO')} ${fila.unidad}` : '—'}
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold text-danger-1">
                    {fila.salidas > 0 ? `−${fila.salidas.toLocaleString('es-CO')} ${fila.unidad}` : '—'}
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold">
                    {fila.existencia === null ? '—' : `${fila.existencia.toLocaleString('es-CO')} ${fila.unidad}`}
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold whitespace-nowrap">
                    {fila.valorMovimiento === null ? '—' : (
                      <span className={fila.valorMovimiento > 0 ? 'text-success-1' : fila.valorMovimiento < 0 ? 'text-danger-1' : 'text-gris-500'}>
                        {fila.valorMovimiento > 0 ? '+' : fila.valorMovimiento < 0 ? '−' : ''}{cop(Math.abs(fila.valorMovimiento))}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold whitespace-nowrap text-sura-azul-prof">
                    {fila.valorExistencia === null ? '—' : cop(fila.valorExistencia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!error && filas.length === 0 && <EmptyRow>Aún no hay entradas ni ventas registradas.</EmptyRow>}
      </Card>
    </div>
  )
}
