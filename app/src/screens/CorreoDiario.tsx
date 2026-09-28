import { useMemo, useState } from 'react'
import { useUI } from '../state/ui'
import { fecha } from '../lib/format'
import { useAgregarDestinatario, useDestinatarios, useEnviosCorreo, useQuitarDestinatario } from '../hooks/useCorreo'
import { Btn, Card, CardTitle } from '../components/ui'

const DEFAULT_REPORT_EMAIL = 'gabrielaempresa572@gmail.com'

export default function CorreoDiario() {
  const { openModal, showToast } = useUI()
  const { data: destinatarios = [] } = useDestinatarios()
  const { data: envios = [] } = useEnviosCorreo()
  const agregar = useAgregarDestinatario()
  const quitar = useQuitarDestinatario()
  const [nuevo, setNuevo] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroCorreo, setFiltroCorreo] = useState('')

  const enviosFiltrados = useMemo(() => {
    return envios.filter((envio) => {
      const fechaExacta = filtroFecha ? new Date(envio.fecha).toISOString().slice(0, 10) === filtroFecha : true
      const textoCorreo = filtroCorreo.trim().toLowerCase()
      const matchCorreo = !textoCorreo || (envio.destinatarios || []).some((email) => email.toLowerCase().includes(textoCorreo))
      return fechaExacta && matchCorreo
    })
  }, [envios, filtroFecha, filtroCorreo])

  function onAgregar() {
    const v = nuevo.trim().toLowerCase()
    if (!v.includes('@')) { showToast('Escribe un correo válido'); return }
    if (destinatarios.some((d) => d.email.toLowerCase() === v)) {
      showToast('Ese correo ya está agregado')
      return
    }

    const email = v || DEFAULT_REPORT_EMAIL
    agregar.mutate(email, {
      onSuccess: () => { setNuevo(''); showToast('Destinatario agregado') },
      onError: (e) => showToast(e instanceof Error ? e.message : 'No se pudo agregar'),
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold m-0 mb-1">Correo diario</h1>
      <div className="text-sm text-gris-500 mb-5">Cada noche sale un correo con el PDF del cierre: lo vendido, cuánto se facturó en pesos y cómo quedó el inventario.</div>
      <div className="grid gap-4 items-start grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <Card>
          <CardTitle>Destinatarios</CardTitle>
          <div className="flex flex-wrap gap-2 mb-4">
            {destinatarios.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-sura-azul-tint border border-sura-azul-chip rounded-full pl-3.5 pr-2 py-1.5 text-[13px]">
                {c.email}
                <button onClick={() => quitar.mutate(c.id)} className="border-none bg-transparent cursor-pointer text-sura-azul-prof text-base leading-none">×</button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5 mb-5">
            <input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAgregar() }}
              placeholder={DEFAULT_REPORT_EMAIL}
              className="flex-[1_1_200px] min-w-0 border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
            />
            <Btn variant="outlineProf" onClick={onAgregar}>Agregar</Btn>
          </div>
          <Btn variant="cta" onClick={() => openModal('correo')}>Enviar ahora</Btn>
        </Card>
        <Card>
          <CardTitle>Últimos envíos</CardTitle>
          <div className="grid gap-3 mb-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
              />
              <input
                type="text"
                value={filtroCorreo}
                onChange={(e) => setFiltroCorreo(e.target.value)}
                placeholder="Filtrar destinatario"
                className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
              />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <div className="grid gap-2">
              {enviosFiltrados.map((e) => (
                <div key={e.id} className="border border-sura-azul-divider rounded-xl p-3 bg-sura-azul-tint/30">
                  <div className="font-bold text-sm text-sura-azul-prof">{fecha(e.fecha)}</div>
                  <div className="mt-2 text-[13px] text-gris-500">
                    {(e.destinatarios && e.destinatarios.length > 0 ? e.destinatarios.join(', ') : 'Sin destinatarios')}
                  </div>
                </div>
              ))}
              {enviosFiltrados.length === 0 && (
                <div className="text-[13px] text-gris-350 py-2">No hay envíos para ese día o destinatario.</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
