import { useMemo } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import { useProductos } from '../hooks/useProductos'
import { useVentas } from '../hooks/useVentas'
import { cop, delta, detalle, esHoy, fecha, hhmm, hoyLargo, paresDe } from '../lib/format'
import { textoCantidadVenta } from '../lib/ventasCaja.js'
import { useConfiguracion } from '../hooks/useCorreo'
import { AlertTriangleIcon } from '../components/Icons'
import { Btn, Card, CardTitle, EmptyRow } from '../components/ui'

const NOM_DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export default function Panel() {
  const { profile } = useAuth()
  const { openModal } = useUI()
  const isAdmin = profile?.rol === 'admin'
  const { data: productos = [] } = useProductos()
  const { data: ventas = [] } = useVentas()
  const { data: config } = useConfiguracion()

  const data = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const dias7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(d.getDate() - i)
      const dv = ventas.filter((v) => !v.devuelta && new Date(v.fecha).toDateString() === d.toDateString())
      const pares = dv.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'par').reduce((x, i) => x + i.pares, 0), 0)
      const unidades = dv.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'unidad').reduce((x, i) => x + i.pares, 0), 0)
      dias7.push({
        diaNom: NOM_DIA[d.getDay()], fecha: fecha(d.toISOString()).slice(0, 5),
        facturas: dv.length, pares, unidades, totalFmt: cop(dv.reduce((a, v) => a + v.total, 0)),
      })
    }
    const ultimos5 = dias7.slice().reverse().slice(0, 5)

    const hoyVentas = ventas.filter((v) => esHoy(v.fecha) && !v.devuelta)
    const hoyAgg = {
      total: hoyVentas.reduce((a, v) => a + v.total, 0),
      pares: hoyVentas.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'par').reduce((x, i) => x + i.pares, 0), 0),
      unidades: hoyVentas.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'unidad').reduce((x, i) => x + i.pares, 0), 0),
      util: hoyVentas.reduce((a, v) => a + (v.total - v.costo), 0),
      n: hoyVentas.length,
    }
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
    const ayerVentas = ventas.filter((v) => !v.devuelta && new Date(v.fecha).toDateString() === ayer.toDateString())
    const dh = delta(hoyAgg.total, ayerVentas.reduce((a, v) => a + v.total, 0))

    const activos = productos.filter((p) => !p.archivado)
    const alertasArr = activos.filter((p) => paresDe(p) <= p.min)
    const heroMetrics = [
      { label: 'Vendido hoy', valor: cop(hoyAgg.total), delta: dh.txt, deltaColor: dh.color },
      { label: 'Pares vendidos hoy', valor: String(hoyAgg.pares), delta: hoyAgg.n + (hoyAgg.n === 1 ? ' factura' : ' facturas'), deltaColor: 'var(--color-gris-350)' },
    ]
    if (isAdmin) heroMetrics.push({ label: 'Utilidad hoy', valor: cop(hoyAgg.util), delta: 'Precio menos costo', deltaColor: 'var(--color-gris-350)' })
    heroMetrics.push({
      label: 'Stock en bodega', valor: activos.reduce((a, p) => a + paresDe(p), 0).toLocaleString('es-CO'),
      delta: alertasArr.length + ' productos en alerta', deltaColor: alertasArr.length ? 'var(--color-warning-1)' : 'var(--color-success-1)',
    })

    const alertas = alertasArr.map((p) => ({ nombre: p.nombre, pares: paresDe(p), detalle: 'Mínimo ' + p.min + ' pares · ' + p.ref }))

    const ventasHoyAll = hoyVentas.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const ventasHoy = ventasHoyAll.slice(0, 6)
    const ventasHoyTitulo = ventasHoyAll.length > 6 ? 'Últimas ventas de hoy · ' + ventasHoyAll.length + ' facturas' : 'Ventas de hoy'

    return { ultimos5, heroMetrics, alertas, ventasHoy, ventasHoyTitulo }
  }, [ventas, productos, isAdmin])

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Panel del día</h1>
          <div className="text-sm text-gris-500">{hoyLargo()} · corte automático a las {config?.hora_envio ?? '—'}</div>
        </div>
        <Btn variant="cta" onClick={() => openModal('correo')}>Ver reporte diario</Btn>
      </div>

      <div className="grid gap-4 mb-5 grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))]">
        {data.heroMetrics.map((m, i) => (
          <Card key={i}>
            <div className="text-xs font-bold uppercase tracking-wide text-sura-azul-prof">{m.label}</div>
            <div className="text-3xl font-bold my-2 tabular-nums">{m.valor}</div>
            <div className="text-[13px]" style={{ color: m.deltaColor }}>{m.delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 mb-4 items-start grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <Card>
          <CardTitle>Últimos 5 días</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gris-100 text-left">
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold">Día</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Facturas</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Pares</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Vendido</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimos5.map((d, i) => (
                  <tr key={i} className="border-b border-sura-azul-divider">
                    <td className="p-2.5"><span className="font-bold">{d.diaNom}</span> <span className="text-gris-350">{d.fecha}</span></td>
                    <td className="p-2.5 text-right tabular-nums text-gris-500">{d.facturas}</td>
                    <td className="p-2.5 text-right tabular-nums">{d.pares}</td>
                    <td className="p-2.5 text-right tabular-nums font-bold">{d.totalFmt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardTitle>Alertas de stock</CardTitle>
          <div className="grid gap-2.5">
            {data.alertas.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF5EC] border border-[#FCD9B6]">
                <AlertTriangleIcon color="#ED8B00" />
                <div className="flex-1">
                  <div className="text-sm font-bold">{a.nombre}</div>
                  <div className="text-xs text-gris-500">{a.detalle}</div>
                </div>
                <div className="text-lg font-bold text-[#ED8B00] tabular-nums">{a.pares}</div>
              </div>
            ))}
            {data.alertas.length === 0 && <EmptyRow>Todo el catálogo está por encima del mínimo.</EmptyRow>}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>{data.ventasHoyTitulo}</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Factura</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Hora</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Vendedor</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Detalle</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Pares</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.ventasHoy.map((v) => (
                <tr key={v.id} className="border-b border-sura-azul-divider">
                  <td className="p-3 font-mono text-[13px]">{v.id}</td>
                  <td className="p-3 text-gris-500">{hhmm(v.fecha)}</td>
                  <td className="p-3">{v.vendedor_nombre}</td>
                  <td className="p-3 text-gris-500">{detalle(v)}</td>
                  <td className="p-3 text-right tabular-nums font-bold">{textoCantidadVenta(v.venta_items)}</td>
                  <td className="p-3 text-right tabular-nums font-bold">{cop(v.total)}</td>
                  <td className="p-3 text-right">
                    <Btn variant="outlineCielo" size="sm" onClick={() => openModal('factura', v)}>Factura</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.ventasHoy.length === 0 && <EmptyRow>Todavía no hay ventas registradas hoy.</EmptyRow>}
      </Card>
    </div>
  )
}
