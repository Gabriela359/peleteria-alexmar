import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useProductos } from '../hooks/useProductos'
import { useVentas } from '../hooks/useVentas'
import { cop, paresDe, unidadTxt } from '../lib/format'
import { useUI } from '../state/ui'
import { Btn, Card, CardTitle } from '../components/ui'

function fechaLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const API_URL = (import.meta.env.VITE_EMAIL_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

export default function ReporteDiario() {
  const { showToast } = useUI()
  const ventasConsulta = useVentas()
  const productosConsulta = useProductos()
  const ventas = ventasConsulta.data
  const productos = productosConsulta.data
  const [fechaReporte, setFechaReporte] = useState(() => fechaLocal(new Date()))
  const [descargando, setDescargando] = useState(false)

  const reporte = useMemo(() => {
    const ventasDia = (ventas ?? [])
      .filter((venta) => !venta.devuelta && fechaLocal(new Date(venta.fecha)) === fechaReporte)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const itemsVendidos = ventasDia.flatMap((venta) => venta.venta_items)
    const productosActivos = (productos ?? []).filter((producto) => !producto.archivado)
    const inventario = productosActivos.map((producto) => {
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

  const errorCarga = ventasConsulta.error || productosConsulta.error
  const cargandoDatos = ventasConsulta.isLoading || productosConsulta.isLoading

  async function descargarReporte() {
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
          body: JSON.stringify({
            report: {
              fecha: reporte.fecha,
              total: reporte.total,
              cantidadVentas: reporte.cantidadVentas,
              inventario: reporte.inventario,
            },
          }),
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
        throw new Error('El servidor de reportes está desactualizado. Vuelve a desplegar el backend para que el PDF incluya la tabla de productos e inventario.')
      }

      const pdf = await response.blob()
      if (pdf.type !== 'application/pdf') throw new Error('El servidor no devolvió un archivo PDF válido')

      const url = URL.createObjectURL(pdf)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-diario-${fechaReporte}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('Reporte diario descargado')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo descargar el reporte')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold m-0 mb-1">Reporte diario</h1>
        <div className="text-sm text-gris-500">Consulta los productos vendidos de un día y descarga el reporte en PDF.</div>
      </div>

      <Card>
        <CardTitle>Descargar reporte</CardTitle>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-gris-700">
            Fecha del reporte
            <input
              type="date"
              value={fechaReporte}
              onChange={(event) => setFechaReporte(event.target.value)}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
            />
          </label>
          <Btn variant="cta" disabled={descargando || cargandoDatos || Boolean(errorCarga)} onClick={() => void descargarReporte()}>
            {descargando ? 'Generando PDF…' : 'Descargar PDF'}
          </Btn>
        </div>

        {cargandoDatos && <div className="mt-4 text-sm text-gris-500">Cargando ventas e inventario…</div>}
        {errorCarga && (
          <div role="alert" className="mt-4 text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5">
            No se pudieron cargar los datos del reporte: {errorCarga instanceof Error ? errorCarga.message : 'Error desconocido'}
          </div>
        )}
        {!cargandoDatos && !errorCarga && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-sura-azul-tint-light p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">Vendido</div>
              <div className="mt-1 text-xl font-bold tabular-nums">{cop(reporte.total)}</div>
            </div>
            <div className="rounded-xl bg-sura-azul-tint-light p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">Facturas del día</div>
              <div className="mt-1 text-xl font-bold tabular-nums">{reporte.cantidadVentas}</div>
            </div>
          </div>
        )}
      </Card>

      {!cargandoDatos && !errorCarga && (
        <Card>
          <CardTitle>Productos vendidos e inventario</CardTitle>
          <div className="overflow-x-auto">
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
                  <tr key={producto.nombre} className="border-b border-sura-azul-divider last:border-0">
                    <td className="py-2.5 pr-3">{producto.nombre}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{producto.vendidos}</td>
                    <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{cop(producto.totalVenta)}</td>
                    <td className="py-2.5 pl-2 text-right">{producto.quedan}</td>
                  </tr>
                ))}
                {reporte.inventario.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gris-500">No hay productos en inventario.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
