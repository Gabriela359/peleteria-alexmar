import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import { useProductos } from '../hooks/useProductos'
import { useVentas } from '../hooks/useVentas'
import { cop, detalle, fecha, fechaBogota, fechaMinimaHistorial, hhmm, pager, paresDe, unidadTxt } from '../lib/format'
import { textoCantidadVenta } from '../lib/ventasCaja.js'
import type { Producto, VentaConItems } from '../types/database'
import { Btn, Card, CardTitle, EmptyRow, Pager } from '../components/ui'
import CajaPanel from '../components/CajaPanel'

const POR_PAGINA = 10
const SIN_VENTAS: VentaConItems[] = []
const SIN_PRODUCTOS: Producto[] = []
const API_URL = (import.meta.env.VITE_EMAIL_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

export default function Reportes() {
  const { profile } = useAuth()
  const { openModal, setConfirm, showToast } = useUI()
  const ventasConsulta = useVentas()
  const productosConsulta = useProductos()
  const ventas = ventasConsulta.data ?? SIN_VENTAS
  const productos = productosConsulta.data ?? SIN_PRODUCTOS
  const isAdmin = profile?.rol === 'admin'
  const [pag, setPag] = useState(1)
  const [fechaReporte, setFechaReporte] = useState(() => fechaBogota())
  const [descargando, setDescargando] = useState(false)

  const data = useMemo(() => {
    const repOrden = ventas.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const info = pager(repOrden.length, POR_PAGINA, pag)
    const repVentas = repOrden.slice((info.pagina - 1) * POR_PAGINA, info.pagina * POR_PAGINA)

    return { repOrden, info, repVentas }
  }, [ventas, pag])

  const reporte = useMemo(() => {
    const ventasDia = ventas
      .filter((venta) => !venta.devuelta && fechaBogota(new Date(venta.fecha)) === fechaReporte)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const itemsVendidos = ventasDia.flatMap((venta) => venta.venta_items)
    const inventario = productos.filter((producto) => !producto.archivado).map((producto) => {
      const vendidos = itemsVendidos.filter((item) => item.ref === producto.ref)
      return {
        nombre: `${producto.ref} · ${producto.nombre}`,
        vendidos: vendidos.reduce((cantidad, item) => cantidad + item.pares, 0),
        totalVenta: vendidos.reduce((total, item) => total + item.pares * item.precio, 0),
        quedan: `${paresDe(producto)} ${unidadTxt(producto)}`,
      }
    })
    return {
      fecha: fechaReporte,
      total: ventasDia.reduce((total, venta) => total + venta.total, 0),
      cantidadVentas: ventasDia.length,
      inventario,
    }
  }, [ventas, productos, fechaReporte])

  const minFechaReporte = fechaMinimaHistorial()
  const errorCargaReporte = ventasConsulta.error || productosConsulta.error
  const cargandoReporte = ventasConsulta.isLoading || productosConsulta.isLoading

  async function descargarReporte() {
    if (fechaReporte < minFechaReporte || fechaReporte > fechaBogota()) {
      showToast('El reporte solo se puede descargar para los últimos 90 días')
      return
    }
    setDescargando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente para descargar el reporte.')

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 90_000)
      let response: Response
      try {
        response = await fetch(`${API_URL}/reports/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ report: reporte }),
          signal: controller.signal,
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('El servidor tardó demasiado en generar el PDF. Inténtalo de nuevo.')
        }
        throw new Error('No se pudo conectar con el servidor de reportes. Verifica VITE_EMAIL_API_URL e inténtalo de nuevo.')
      } finally {
        window.clearTimeout(timeoutId)
      }
      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'No se pudo generar el reporte PDF')
      }
      if (response.headers.get('X-Report-Template-Version') !== '2') {
        throw new Error('El servidor de reportes está desactualizado. Vuelve a desplegar el backend.')
      }

      const pdf = await response.blob()
      if (pdf.type !== 'application/pdf') throw new Error('El servidor no devolvió un archivo PDF válido')
      const url = URL.createObjectURL(pdf)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-${fechaReporte}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('Reporte descargado')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo descargar el reporte')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">{isAdmin ? 'Caja y facturas' : 'Mis facturas'}</h1>
          <div className="text-sm text-gris-500">Facturas y cortes Z disponibles durante 90 días.</div>
        </div>
      </div>

      <CajaPanel />

      {isAdmin && (
        <Card>
          <CardTitle>Descargar reporte en PDF</CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-gris-700">
              Fecha del reporte
              <input
                type="date"
                value={fechaReporte}
                min={minFechaReporte}
                max={fechaBogota()}
                onChange={(event) => setFechaReporte(event.target.value)}
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
              />
            </label>
            <Btn variant="cta" disabled={descargando || cargandoReporte || Boolean(errorCargaReporte)} onClick={() => void descargarReporte()}>
              {descargando ? 'Generando PDF…' : 'Descargar PDF'}
            </Btn>
          </div>
          <div className="mt-2 text-xs text-gris-500">Solo se pueden descargar reportes desde hoy hasta 90 días atrás.</div>
          {cargandoReporte && <div className="mt-4 text-sm text-gris-500">Cargando ventas e inventario…</div>}
          {errorCargaReporte && (
            <div role="alert" className="mt-4 text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5">
              No se pudieron cargar los datos del reporte: {errorCargaReporte instanceof Error ? errorCargaReporte.message : 'Error desconocido'}
            </div>
          )}
          {!cargandoReporte && !errorCargaReporte && (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-sura-azul-tint-light p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">Vendido ese día</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{cop(reporte.total)}</div>
                </div>
                <div className="rounded-xl bg-sura-azul-tint-light p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">Facturas del día</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{reporte.cantidadVentas}</div>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[570px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gris-300 text-xs uppercase tracking-wide text-gris-500">
                      <th className="py-2 pr-3 font-semibold">Producto</th>
                      <th className="px-2 py-2 text-right font-semibold">Cantidad</th>
                      <th className="px-2 py-2 text-right font-semibold">Total vendido</th>
                      <th className="py-2 pl-2 text-right font-semibold">Queda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.inventario.map((producto) => (
                      <tr key={producto.nombre} className="border-b border-sura-azul-divider">
                        <td className="py-2.5 pr-3">{producto.nombre}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{producto.vendidos}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{cop(producto.totalVenta)}</td>
                        <td className="py-2.5 pl-2 text-right">{producto.quedan}</td>
                      </tr>
                    ))}
                    {reporte.inventario.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-gris-500">No hay productos activos en inventario.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      <Card>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="mb-0">Facturas de los últimos 90 días · {data.repOrden.length}</CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Factura</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Fecha</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Vendedor</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Detalle</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Pago</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Cantidad</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.repVentas.map((v) => (
                <tr key={v.id} className="border-b border-sura-azul-divider align-top">
                  <td className="p-3 font-mono text-[13px]">{v.id}</td>
                  <td className="p-3 text-gris-500 whitespace-nowrap">{fecha(v.fecha)} {hhmm(v.fecha)}</td>
                  <td className="p-3 whitespace-nowrap">{v.vendedor_nombre}</td>
                  <td className="p-3 text-gris-500 max-w-[260px]">{detalle(v)}</td>
                  <td className="p-3 text-gris-500 whitespace-nowrap">{v.metodo}</td>
                  <td className="p-3 text-right tabular-nums font-bold">{textoCantidadVenta(v.venta_items)}</td>
                  <td className="p-3 text-right tabular-nums font-bold">{cop(v.total)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Btn variant="outlineCielo" size="sm" className="mr-1.5" onClick={() => openModal('factura', v)}>Factura</Btn>
                    {isAdmin && (
                      <Btn size="sm" variant={v.devuelta ? 'outline' : 'dangerOutline'} onClick={() => !v.devuelta && setConfirm({ tipo: 'dev', id: v.id })}>
                        {v.devuelta ? 'Devuelta' : 'Devolver'}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.repOrden.length === 0 && <EmptyRow>No hay ventas en este momento.</EmptyRow>}
        <Pager info={data.info} onGo={setPag} />
      </Card>
    </div>
  )
}
