import { useUI } from '../state/ui'
import { useMovimientos } from '../hooks/useMovimientos'
import { fecha } from '../lib/format'
import { Badge, Btn, Card, EmptyRow } from '../components/ui'
import type { MovimientoTipo } from '../types/database'

function tono(tipo: MovimientoTipo) {
  if (tipo === 'entrada') return 'success' as const
  if (tipo === 'devolucion') return 'info' as const
  if (tipo === 'archivado' || tipo === 'reactivado') return 'neutral' as const
  return 'warning' as const // ajuste
}
const ETIQUETA: Record<MovimientoTipo, string> = {
  entrada: 'Entrada', ajuste: 'Ajuste', devolucion: 'Devolución', archivado: 'Archivado', reactivado: 'Reactivado',
}

export default function Movimientos() {
  const { openModal } = useUI()
  const { data: movs = [] } = useMovimientos()

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Movimientos de inventario</h1>
          <div className="text-sm text-gris-500">Consulta mercancía recibida, conteos corregidos y devoluciones.</div>
        </div>
        <div className="flex gap-2.5">
          <Btn variant="cta" onClick={() => openModal('entrada')}>Actualizar stock</Btn>
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Fecha</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Tipo</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Producto</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Detalle</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Responsable</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Pares</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id} className="border-b border-sura-azul-divider">
                  <td className="p-3 text-gris-500">{fecha(m.fecha)}</td>
                  <td className="p-3"><Badge tone={tono(m.tipo)}>{ETIQUETA[m.tipo]}</Badge></td>
                  <td className="p-3 font-bold">{m.modelo}</td>
                  <td className="p-3 text-gris-500">{m.detalle}</td>
                  <td className="p-3 text-gris-500">{m.quien}</td>
                  <td className={`p-3 text-right tabular-nums font-bold ${m.pares === 0 ? 'text-gris-350' : m.pares > 0 ? 'text-success-1' : 'text-danger-1'}`}>
                    {m.pares === 0 ? '—' : (m.pares > 0 ? '+' : '') + m.pares}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {movs.length === 0 && <EmptyRow>Aún no hay movimientos registrados.</EmptyRow>}
      </Card>
    </div>
  )
}
