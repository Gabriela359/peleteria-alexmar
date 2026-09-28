import { useMemo, useState } from 'react'
import { useAuth } from '../state/auth'
import { useUI } from '../state/ui'
import { useArchivarProducto, useProductos } from '../hooks/useProductos'
import { cop, pager, porTalla, unidadTxt, paresDe } from '../lib/format'
import { Badge, Btn, Card, Pager, Pill } from '../components/ui'

const FILTROS: [string, string][] = [['activos', 'Activos'], ['bajo', 'Stock bajo'], ['agotado', 'Agotados'], ['archivados', 'Archivados']]
const POR_PAGINA = 8

export default function Inventario() {
  const { profile } = useAuth()
  const { openModal, setConfirm, showToast } = useUI()
  const { data: productos = [] } = useProductos()
  const archivar = useArchivarProducto()
  const isAdmin = profile?.rol === 'admin'

  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('activos')
  const [pag, setPag] = useState(1)

  const data = useMemo(() => {
    const qq = q.toLowerCase()
    const match = (m: typeof productos[number]) => (m.ref + ' ' + m.nombre + ' ' + m.tipo + ' ' + (m.color ?? '')).toLowerCase().includes(qq)
    const filtrados = productos.filter(match).filter((m) => {
      if (filtro === 'archivados') return m.archivado
      if (m.archivado) return false
      if (filtro === 'bajo') return paresDe(m) <= m.min
      if (filtro === 'agotado') return porTalla(m) ? Object.values(m.tallas).some((v) => Number(v) === 0) : paresDe(m) === 0
      return true
    })
    const info = pager(filtrados.length, POR_PAGINA, pag)
    const rows = filtrados.slice((info.pagina - 1) * POR_PAGINA, info.pagina * POR_PAGINA)
    const activos = productos.filter((m) => !m.archivado)
    const alertasCount = activos.filter((m) => paresDe(m) <= m.min).length
    const archivadosCount = productos.length - activos.length
    const resumen = activos.reduce((a, m) => a + paresDe(m), 0).toLocaleString('es-CO') + ' unidades/pares en ' + activos.length +
      ' productos activos · ' + alertasCount + ' en alerta de stock · ' + archivadosCount + (archivadosCount === 1 ? ' archivado' : ' archivados')
    return { rows, info, resumen }
  }, [productos, q, filtro, pag])

  function onArchivar(ref: string, archivado: boolean) {
    archivar.mutate({ ref, archivado: !archivado }, {
      onSuccess: () => showToast(!archivado ? 'Modelo archivado · ya no aparece en ventas' : 'Modelo reactivado'),
      onError: (e) => showToast(e instanceof Error ? e.message : 'No se pudo archivar'),
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold m-0 mb-1">Inventario</h1>
          <div className="text-sm text-gris-500">{data.resumen}</div>
        </div>
        {isAdmin && (
          <div className="flex gap-2.5">
            <Btn variant="outlineProf" onClick={() => openModal('entrada')}>Entrada de mercancía</Btn>
            <Btn variant="cta" onClick={() => openModal('modelo', null)}>Nuevo producto</Btn>
          </div>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap gap-x-3 gap-y-2.5 items-center mb-4">
          <input
            value={q} onChange={(e) => { setQ(e.target.value); setPag(1) }} placeholder="Buscar referencia, producto, tipo o color"
            className="flex-[1_1_220px] min-w-0 border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
          />
          {FILTROS.map(([key, label]) => (
            <Pill key={key} tone="prof" active={filtro === key} onClick={() => { setFiltro(key); setPag(1) }}>{label}</Pill>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gris-100 text-left">
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Ref.</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Producto</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Tipo · color</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Presentación</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Stock</th>
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Precio</th>
                {isAdmin && <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Utilidad</th>}
                <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold">Estado</th>
                {isAdmin && <th className="p-3 text-xs uppercase tracking-wide text-gris-500 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((m) => {
                const pares = paresDe(m)
                const bajo = pares <= m.min
                const porT = porTalla(m)
                const keys = porT ? Object.keys(m.tallas).sort() : []
                const agotadas = porT ? keys.filter((k) => Number(m.tallas[k]) === 0).length : 0
                const estado = m.archivado ? 'Archivado' : bajo ? 'Stock bajo' : agotadas ? agotadas + ' talla(s) en cero' : 'Disponible'
                const tone = m.archivado ? 'neutral' : bajo ? 'danger' : agotadas ? 'warning' : 'success'
                return (
                  <tr key={m.ref} className="border-b border-sura-azul-divider">
                    <td className="p-3 font-mono text-[13px] text-sura-azul-prof">{m.ref}</td>
                    <td className="p-3 font-bold">{m.nombre}</td>
                    <td className="p-3 text-gris-500">{m.tipo} · {m.color}</td>
                    <td className="p-3 text-gris-500 text-[13px]">{porT ? 'Tallas ' + keys[0] + '–' + keys[keys.length - 1] + ' (' + keys.length + ')' : 'Por unidad'}</td>
                    <td className="p-3 text-right tabular-nums font-bold">{pares.toLocaleString('es-CO')} {unidadTxt(m)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{cop(m.precio)} <span className="text-xs text-gris-350">{porT ? '/ par' : '/ und'}</span></td>
                    {isAdmin && <td className="p-3 text-right tabular-nums text-success-1">{cop(m.precio - m.costo)}</td>}
                    <td className="p-3"><Badge tone={tone}>{estado}</Badge></td>
                    {isAdmin && (
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex gap-1.5 justify-end">
                          <Btn size="sm" onClick={() => openModal('modelo', m.ref)}>Actualizar</Btn>
                          <Btn size="sm" onClick={() => openModal('ajuste', { ref: m.ref, talla: porT ? keys[0] : null })}>Ajustar</Btn>
                          <Btn size="sm" className={m.archivado ? 'border-success-border! text-success-1!' : ''} onClick={() => onArchivar(m.ref, m.archivado)}>
                            {m.archivado ? 'Reactivar' : 'Archivar'}
                          </Btn>
                          <Btn size="sm" variant="dangerOutline" onClick={() => setConfirm({ tipo: 'del', ref: m.ref, nombre: m.nombre })}>Eliminar</Btn>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pager info={data.info} onGo={setPag} />
      </Card>
    </div>
  )
}
