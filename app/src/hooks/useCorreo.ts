import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Configuracion, DestinatarioCorreo, EnvioCorreo } from '../types/database'

export function useDestinatarios() {
  return useQuery({
    queryKey: ['destinatarios'],
    queryFn: async (): Promise<DestinatarioCorreo[]> => {
      const { data, error } = await supabase.from('destinatarios_correo').select('*').order('email')
      if (error) throw error
      return data
    },
  })
}

export function useAgregarDestinatario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.from('destinatarios_correo').insert({ email })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destinatarios'] }),
  })
}

export function useQuitarDestinatario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('destinatarios_correo').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destinatarios'] }),
  })
}

export function useConfiguracion() {
  return useQuery({
    queryKey: ['configuracion'],
    queryFn: async (): Promise<Configuracion> => {
      const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).single()
      if (error) throw error
      return data
    },
  })
}

export function useActualizarHoraEnvio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (hora_envio: string) => {
      const { error } = await supabase.from('configuracion').update({ hora_envio }).eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracion'] }),
  })
}

export function useEnviosCorreo() {
  return useQuery({
    queryKey: ['envios_correo'],
    queryFn: async (): Promise<EnvioCorreo[]> => {
      const { data, error } = await supabase.from('envios_correo').select('*').order('fecha', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => ({
        ...row,
        destinatarios: Array.isArray(row.destinatarios) ? row.destinatarios : [],
      }))
    },
  })
}

// Sube un snapshot del cierre (JSON) a Storage y deja el registro en
// envios_correo. El envío real por SMTP no corre aquí (ver README): esto dispara
// la parte que sí es del frontend — guardar y dejar constancia del cierre.
export function useRegistrarEnvioCorreo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      total: number
      pares: number
      snapshot: unknown
      subject?: string
      recipients?: string[]
      html?: string
      text?: string
    }) => {
      const path = `cierres/${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`
      const blob = new Blob([JSON.stringify(args.snapshot, null, 2)], { type: 'application/json' })
      const { error: upErr } = await supabase.storage.from('reportes').upload(path, blob, { upsert: true })
      if (upErr) throw upErr

      const recipients = (args.recipients && args.recipients.length > 0 ? args.recipients : ['gabrielaempresa572@gmail.com'])
        .map((email) => String(email || '').trim())
        .filter(Boolean)

      const { error } = await supabase.from('envios_correo').insert({
        fecha: new Date().toISOString().slice(0, 10),
        total: Number(args.total || 0),
        pares: Number(args.pares || 0),
        destinatarios: recipients,
        storage_path: path,
      })
      if (error) throw error

      const emailApiUrl = (import.meta.env.VITE_EMAIL_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')
      const snapshot = (args.snapshot as any) || {}
      const snapshotText = JSON.stringify(snapshot, null, 2)
      const inventario = Array.isArray(snapshot.inventario) ? snapshot.inventario : []
      const fechaCierre = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
      const productosActivos = inventario.length
      const resumenHtml = inventario.length > 0
        ? inventario.map((item: any) => {
            const nombre = String(item?.nombre || 'Producto')
            const vendidos = Number(item?.vendidos ?? 0)
            const quedan = item?.quedan ?? '—'
            return `<tr><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${nombre}</td><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${vendidos}</td><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb; text-align:right;">${quedan}</td></tr>`
          }).join('')
        : '<tr><td colspan="3" style="padding:10px;border-bottom:1px solid #e5e7eb;">No hay información disponible.</td></tr>'

      const emailPayload = {
        to: recipients,
        subject: args.subject ?? `Reporte del día · Peletería El Progreso · ${fechaCierre}`,
        html: args.html ?? `
          <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dfe7f5;">
            <div style="background:#0f1f4d;color:#ffffff;padding:22px 24px 18px 24px;">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Vista previa del correo automático</div>
              <div style="font-size:32px;font-weight:bold;line-height:1.2;margin-top:8px;">Reporte del día · Peletería El Progreso · ${fechaCierre}</div>
            </div>
            <div style="padding:24px;">
              <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:18px;">
                <div><strong>Para:</strong> ${recipients.join(', ') || '—'}</div>
                <div><strong>Fecha:</strong> ${fechaCierre}</div>
                <div><strong>Envío:</strong> inmediato al pulsar el botón</div>
              </div>

              <div style="display:flex;gap:14px;margin:0 0 18px;flex-wrap:wrap;">
                <div style="background:#eef4ff;border:1px solid #d7e5ff;border-radius:12px;padding:12px 16px;min-width:150px;flex:1;">
                  <div style="font-size:11px;text-transform:uppercase;color:#1d4ed8;font-weight:bold;">Vendido</div>
                  <div style="font-size:22px;font-weight:bold;">$${Number(args.total || 0).toLocaleString('es-CO')}</div>
                </div>
                <div style="background:#eef4ff;border:1px solid #d7e5ff;border-radius:12px;padding:12px 16px;min-width:150px;flex:1;">
                  <div style="font-size:11px;text-transform:uppercase;color:#1d4ed8;font-weight:bold;">Pares</div>
                  <div style="font-size:22px;font-weight:bold;">${Number(args.pares || 0)}</div>
                </div>
                <div style="background:#eef4ff;border:1px solid #d7e5ff;border-radius:12px;padding:12px 16px;min-width:150px;flex:1;">
                  <div style="font-size:11px;text-transform:uppercase;color:#1d4ed8;font-weight:bold;">En inventario</div>
                  <div style="font-size:22px;font-weight:bold;">${Number(snapshot.stockTotal || 0).toLocaleString('es-CO')}</div>
                </div>
              </div>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;">
                <div style="font-size:12px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;margin-bottom:8px;">Inventario al cierre</div>
                <div style="font-size:12px;color:#475569;margin-bottom:8px;">Productos activos: <strong>${productosActivos}</strong> · Total de líneas del cierre: <strong>${inventario.length}</strong></div>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Producto</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Vendidos</th>
                      <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Quedan</th>
                    </tr>
                  </thead>
                  <tbody>${resumenHtml}</tbody>
                </table>
              </div>
            </div>
          </div>
        `,
        text: args.text ?? `Reporte del día\n\nFecha: ${fechaCierre}\nPara: ${recipients.join(', ') || '—'}\n\nVendido: $${Number(args.total || 0).toLocaleString('es-CO')}\nPares: ${Number(args.pares || 0)}\nEn inventario: ${Number(snapshot.stockTotal || 0).toLocaleString('es-CO')}\nProductos activos: ${productosActivos}\n\nInventario al cierre:\n${inventario.map((item: any) => `- ${item?.nombre || 'Producto'} | vendidos ${Number(item?.vendidos ?? 0)} | quedan ${item?.quedan ?? '—'}`).join('\n') || 'No hay información disponible.'}\n\n${snapshotText}`,
        report: {
          fecha: new Date().toISOString().slice(0, 10),
          destinatarios: recipients,
          total: args.total,
          pares: args.pares,
          stockTotal: snapshot.stockTotal ?? 0,
          inventario: inventario,
        },
        attachments: [],
        includeReportPdf: false,
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${emailApiUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(emailPayload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo enviar el correo')
      }

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios_correo'] }),
  })
}
