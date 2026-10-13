import { useMemo, useState } from 'react'
import { useUI } from '../state/ui'
import { fecha } from '../lib/format'
import { useAgregarDestinatario, useDestinatarios, useEnviosCorreo, useQuitarDestinatario } from '../hooks/useCorreo'
import { useUsuarios } from '../hooks/useUsuarios'
import { Btn, Card, CardTitle } from '../components/ui'

export default function CorreoDiario() {
  const { openModal, showToast } = useUI()
  const { data: destinatarios = [] } = useDestinatarios()
  const usuariosConsulta = useUsuarios()
  const usuarios = usuariosConsulta.data ?? []
  const usuariosActivos = usuarios.filter((usuario) => usuario.activo)
  const { data: envios = [] } = useEnviosCorreo()
  const agregar = useAgregarDestinatario()
  const quitar = useQuitarDestinatario()
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroCorreo, setFiltroCorreo] = useState('')
  const destinatariosPorCorreo = new Map(destinatarios.map((destinatario) => [destinatario.email.toLowerCase(), destinatario]))

  const enviosFiltrados = useMemo(() => {
    return envios.filter((envio) => {
      const fechaExacta = filtroFecha ? new Date(envio.fecha).toISOString().slice(0, 10) === filtroFecha : true
      const textoCorreo = filtroCorreo.trim().toLowerCase()
      const matchCorreo = !textoCorreo || (envio.destinatarios || []).some((email) => email.toLowerCase().includes(textoCorreo))
      return fechaExacta && matchCorreo
    })
  }, [envios, filtroFecha, filtroCorreo])

  return (
    <div>
      <h1 className="text-2xl font-bold m-0 mb-1">Correo diario</h1>
      <div className="text-sm text-gris-500 mb-5">Cada noche sale un correo con el PDF del cierre: lo vendido, cuánto se facturó en pesos y cómo quedó el inventario.</div>
      <div className="grid gap-4 items-start grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]">
        <Card>
          <CardTitle>Destinatarios</CardTitle>
          <div className="mb-4">
            <div className="text-sm font-bold text-sura-azul-prof mb-1">Usuarios registrados activos</div>
            <div className="text-xs text-gris-500 mb-2">Selecciona quién recibirá el reporte. Puedes añadir otras direcciones abajo.</div>
            {usuariosConsulta.isLoading && <div className="text-sm text-gris-500 py-2">Cargando usuarios…</div>}
            {usuariosConsulta.error && (
              <div role="alert" className="text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5">
                No se pudo cargar la lista de usuarios: {usuariosConsulta.error instanceof Error ? usuariosConsulta.error.message : 'Error desconocido'}
              </div>
            )}
            {!usuariosConsulta.isLoading && !usuariosConsulta.error && (
              <div className="grid gap-1 max-h-48 overflow-y-auto">
                {usuariosActivos.map((usuario) => {
                  const destinatario = destinatariosPorCorreo.get(usuario.correo.toLowerCase())
                  return (
                    <label key={usuario.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-sura-azul-tint-light cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(destinatario)}
                        disabled={agregar.isPending || quitar.isPending}
                        onChange={(e) => {
                          if (e.target.checked) {
                            agregar.mutate(usuario.correo, {
                              onError: (error) => showToast(error instanceof Error ? error.message : 'No se pudo agregar el destinatario'),
                            })
                          } else if (destinatario) {
                            quitar.mutate(destinatario.id, {
                              onError: (error) => showToast(error instanceof Error ? error.message : 'No se pudo quitar el destinatario'),
                            })
                          }
                        }}
                        className="accent-sura-azul-prof"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gris-900">{usuario.nombre}</span>
                        <span className="block text-xs text-gris-500">{usuario.correo}</span>
                      </span>
                    </label>
                  )
                })}
                {usuariosActivos.length === 0 && (
                  <div className="text-sm text-gris-500 py-2">No hay usuarios activos registrados.</div>
                )}
              </div>
            )}
          </div>
          <div className="text-sm font-bold text-sura-azul-prof mb-2">Destinatarios seleccionados</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {destinatarios.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-sura-azul-tint border border-sura-azul-chip rounded-full pl-3.5 pr-2 py-1.5 text-[13px]">
                {c.email}
                <button
                  type="button"
                  aria-label={`Quitar ${c.email} de destinatarios`}
                  disabled={quitar.isPending}
                  onClick={() => quitar.mutate(c.id, {
                    onError: (error) => showToast(error instanceof Error ? error.message : 'No se pudo quitar el destinatario'),
                  })}
                  className="border-none bg-transparent cursor-pointer text-sura-azul-prof text-base leading-none disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
            {destinatarios.length === 0 && <div className="text-sm text-gris-500 py-1">Selecciona al menos un usuario o agrega un correo.</div>}
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
