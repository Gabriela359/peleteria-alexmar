import { useMemo, useState } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import { useVentas } from '../hooks/useVentas'
import { cop, detalle, fecha, hhmm, pager } from '../lib/format'
import { textoCantidadVenta } from '../lib/ventasCaja.js'
import type { VentaConItems } from '../types/database'
import { Btn, Card, CardTitle, EmptyRow, Pager } from '../components/ui'
import CajaPanel from '../components/CajaPanel'

const POR_PAGINA = 10

function descargarCSV(ventas: VentaConItems[]) {
  const cabecera = ['Factura', 'Fecha', 'Hora', 'Vendedor', 'Detalle', 'Pago', 'Pares', 'Total']
  const filas = ventas.map((v) => [
    v.id, fecha(v.fecha), hhmm(v.fecha), v.vendedor_nombre, detalle(v).replaceAll(',', ';'), v.metodo,
    textoCantidadVenta(v.venta_items), v.total,
  ])
  const csv = [cabecera, ...filas].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ventas-' + new Date().toISOString().slice(0, 10) + '.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function Reportes() {
  const { profile } = useAuth()
  const { openModal, setConfirm, showToast } = useUI()
  const { data: ventas = [] } = useVentas()
  const isAdmin = profile?.rol === 'admin'
  const [pag, setPag] = useState(1)

  const data = useMemo(() => {
    const repOrden = ventas.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const info = pager(repOrden.length, POR_PAGINA, pag)
    const repVentas = repOrden.slice((info.pagina - 1) * POR_PAGINA, info.pagina * POR_PAGINA)

    return { repOrden, info, repVentas }
  }, [ventas, pag])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">{isAdmin ? 'Caja y facturas' : 'Mis facturas'}</h1>
          <div className="text-sm text-gris-500">Resumen sencillo de caja y ventas del día.</div>
        </div>
        <Btn size="sm" onClick={() => { descargarCSV(data.repOrden); showToast('CSV generado con ' + data.repOrden.length + ' facturas') }}>Exportar CSV</Btn>
      </div>

      <CajaPanel />

      <Card>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="mb-0">Facturas · {data.repOrden.length}</CardTitle>
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
