import { useState } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import { useCajas, useAbrirCaja, useCerrarCaja } from '../hooks/useCaja'
import { useVentas } from '../hooks/useVentas'
import { cop, esHoy, fecha, hhmm } from '../lib/format'
import { obtenerResumenCaja } from '../lib/ventasCaja.js'
import { Badge, Btn, Card, CardTitle, EmptyRow, KvRow } from './ui'

// Apertura y cierre de caja (corte Z) del negocio: una sola caja
// compartida por día, sin importar cuántos vendedores atiendan.
export default function CajaPanel() {
  const { profile } = useAuth()
  const isAdmin = profile?.rol === 'admin'
  const { showToast } = useUI()
  const { data: cajas = [] } = useCajas()
  const { data: ventas = [] } = useVentas()
  const abrir = useAbrirCaja()
  const cerrar = useCerrarCaja()

  // cajas viene ordenado por id desc: el primero es "la caja actual"
  // (abierta, o la última que se cerró si hoy aún no se abre otra).
  const actual = cajas[0] ?? null
  const puedeAbrir = !actual || actual.estado === 'cerrada'
  const historial = cajas.slice(1)

  const [fondo, setFondo] = useState('')
  const [contado, setContado] = useState('')
  const [enviando, setEnviando] = useState(false)

  const ventasHoy = ventas.filter((v) => !v.devuelta && esHoy(v.fecha))
  const { efectivo: efectivoHoy, transferencia: transferenciaHoy } = obtenerResumenCaja(ventasHoy)
  const esperadoEstimado = (actual?.fondo_inicial ?? 0) + efectivoHoy

  async function onAbrir() {
    if (fondo === '' || isNaN(Number(fondo)) || Number(fondo) < 0) { showToast('Escribe el fondo inicial de caja'); return }
    setEnviando(true)
    try {
      await abrir.mutateAsync(Number(fondo))
      setFondo('')
      showToast('Caja abierta')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo abrir la caja')
    } finally {
      setEnviando(false)
    }
  }

  async function onCerrar() {
    if (contado === '' || isNaN(Number(contado)) || Number(contado) < 0) { showToast('Escribe el efectivo que contaste'); return }
    setEnviando(true)
    try {
      await cerrar.mutateAsync(Number(contado))
      setContado('')
      showToast('Caja cerrada · corte Z generado')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cerrar la caja')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="mb-4">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-3.5">
        <CardTitle className="mb-0">Caja del día</CardTitle>
        {actual && <Badge tone={actual.estado === 'abierta' ? 'success' : 'neutral'}>{actual.estado === 'abierta' ? 'Abierta' : 'Cerrada'}</Badge>}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-sura-azul-divider bg-sura-azul-tint px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gris-350">Fondo inicial</div>
          <div className="mt-1 text-[22px] font-bold tabular-nums text-sura-azul-prof">{cop(actual?.fondo_inicial ?? Number(fondo || 0))}</div>
        </div>
        <div className="rounded-2xl border border-sura-azul-divider bg-sura-blanco px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gris-350">Ventas hoy</div>
          <div className="mt-1 text-[22px] font-bold tabular-nums text-gris-500">{cop(efectivoHoy + transferenciaHoy)}</div>
        </div>
        <div className="rounded-2xl border border-sura-azul-divider bg-sura-blanco px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gris-350">Efectivo esperado</div>
          <div className="mt-1 text-[22px] font-bold tabular-nums text-gris-500">{cop(esperadoEstimado)}</div>
        </div>
      </div>

      {puedeAbrir && (
        <div className="flex flex-wrap gap-3 items-end">
          <label className="grid gap-1.5 min-w-0">
            <span className="text-xs font-bold text-gris-500">Fondo inicial en efectivo</span>
            <input
              value={fondo} onChange={(e) => setFondo(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="$ 0"
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none w-40 focus:border-b-sura-azul-cielo"
            />
          </label>
          <Btn variant="cta" disabled={enviando} onClick={() => void onAbrir()}>Abrir caja</Btn>
        </div>
      )}

      {actual && actual.estado === 'abierta' && (
        <>
          <div className="grid gap-0.5 mb-3.5">
            <KvRow k="Abierta por">{actual.abierta_por_nombre}</KvRow>
            <KvRow k="Hora de apertura">{hhmm(actual.abierta_en)}</KvRow>
            <KvRow k="Fondo inicial">{cop(actual.fondo_inicial)}</KvRow>
          </div>
          <div className="bg-sura-azul-tint border border-sura-azul-chip rounded-xl px-3.5 py-3 text-[13px] text-sura-azul-prof mb-3.5">
            Vendido hoy: {cop(efectivoHoy)} en efectivo · {cop(transferenciaHoy)} por transferencia.
            Efectivo esperado estimado en caja: <strong>{cop(esperadoEstimado)}</strong>.
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="grid gap-1.5 min-w-0">
              <span className="text-xs font-bold text-gris-500">Efectivo contado al cerrar</span>
              <input
                value={contado} onChange={(e) => setContado(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="$ 0"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none w-40 focus:border-b-sura-azul-cielo"
              />
            </label>
            <Btn variant="cta" disabled={enviando} onClick={() => void onCerrar()}>Cerrar caja · corte Z</Btn>
          </div>
        </>
      )}

      {actual && actual.estado === 'cerrada' && (
        <div className="grid gap-0.5">
          <KvRow k="Abierta por">{actual.abierta_por_nombre}</KvRow>
          <KvRow k="Cerrada por">{actual.cerrada_por_nombre ?? '—'}</KvRow>
          <KvRow k="Fondo inicial">{cop(actual.fondo_inicial)}</KvRow>
          <KvRow k="Vendido en efectivo">{cop(actual.total_efectivo ?? 0)}</KvRow>
          <KvRow k="Vendido por transferencia">{cop(actual.total_transferencia ?? 0)}</KvRow>
          <KvRow k="Efectivo esperado">{cop(actual.efectivo_esperado ?? 0)}</KvRow>
          <KvRow k="Efectivo contado">{cop(actual.efectivo_contado ?? 0)}</KvRow>
          <div className="flex flex-wrap items-baseline gap-2.5 py-2 text-sm">
            <span className="text-gris-500">Diferencia del corte Z</span>
            <span className="flex-1 border-b border-dotted border-gris-300 -translate-y-0.5" />
            <Badge tone={(actual.diferencia ?? 0) === 0 ? 'success' : (actual.diferencia ?? 0) > 0 ? 'info' : 'danger'}>
              {(actual.diferencia ?? 0) === 0 ? 'Cuadró exacto' : (actual.diferencia ?? 0) > 0 ? 'Sobran ' + cop(actual.diferencia ?? 0) : 'Faltan ' + cop(Math.abs(actual.diferencia ?? 0))}
            </Badge>
          </div>
        </div>
      )}

      {!actual && <EmptyRow>Aún no se ha abierto ninguna caja.</EmptyRow>}

      {isAdmin && historial.length > 0 && (
        <>
          <div className="text-sm font-bold uppercase tracking-wide text-sura-azul-prof mt-5 mb-2.5">Historial de cortes Z</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gris-100 text-left">
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold">Fecha</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold">Abrió / cerró</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Fondo</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Ventas</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Esperado</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Contado</th>
                  <th className="p-2.5 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((c) => {
                  const dif = c.diferencia ?? 0
                  return (
                    <tr key={c.id} className="border-b border-sura-azul-divider">
                      <td className="p-2.5">{fecha(c.fecha)}</td>
                      <td className="p-2.5 text-gris-500">{c.abierta_por_nombre} / {c.cerrada_por_nombre ?? '—'}</td>
                      <td className="p-2.5 text-right tabular-nums">{cop(c.fondo_inicial)}</td>
                      <td className="p-2.5 text-right tabular-nums font-bold">{cop(c.total_ventas ?? 0)}</td>
                      <td className="p-2.5 text-right tabular-nums">{cop(c.efectivo_esperado ?? 0)}</td>
                      <td className="p-2.5 text-right tabular-nums">{cop(c.efectivo_contado ?? 0)}</td>
                      <td className={'p-2.5 text-right tabular-nums font-bold ' + (dif === 0 ? 'text-gris-500' : dif > 0 ? 'text-sura-azul-prof' : 'text-danger-1')}>
                        {dif === 0 ? cop(0) : (dif > 0 ? '+ ' : '− ') + cop(Math.abs(dif))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
