import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Configuracion, DestinatarioCorreo, EnvioCorreo } from '../types/database'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

      const emailApiUrl = (import.meta.env.VITE_EMAIL_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')
      const snapshot = (args.snapshot as any) || {}
      const snapshotText = JSON.stringify(snapshot, null, 2)
      const inventario = Array.isArray(snapshot.inventario) ? snapshot.inventario : []
      const fechaCierre = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
      const productosActivos = inventario.length
      const resumenHtml = inventario.length > 0
        ? inventario.map((item: any) => {
            const nombre = escapeHtml(item?.nombre || 'Producto')
            const vendidos = Number(item?.vendidos ?? 0)
            const totalVenta = Number(item?.totalVenta ?? 0).toLocaleString('es-CO')
            const quedan = escapeHtml(item?.quedan ?? '—')
            return `<tr><td class="inventory-cell" style="padding:8px 10px;border-bottom:1px solid #e5e7eb;word-break:break-word;">${nombre}</td><td class="inventory-cell" style="padding:8px 10px;border-bottom:1px solid #e5e7eb;word-break:break-word;">${vendidos}</td><td class="inventory-cell" style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;word-break:break-word;">$${totalVenta}</td><td class="inventory-cell" style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;word-break:break-word;">${quedan}</td></tr>`
          }).join('')
        : '<tr><td colspan="4" class="inventory-cell" style="padding:10px;border-bottom:1px solid #e5e7eb;">No hay información disponible.</td></tr>'

      const emailPayload = {
        to: recipients,
        subject: args.subject ?? `Reporte del día · Peletería ALEXMAR · ${fechaCierre}`,
        html: args.html ?? `
          <!doctype html>
          <html lang="es">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <style>
                @media only screen and (max-width:600px) {
                  .email-shell { width:100% !important; }
                  .email-padding { padding:18px 14px !important; }
                  .email-title { font-size:25px !important; }
                  .email-metric { display:block !important; width:auto !important; padding:0 0 10px !important; }
                  .inventory-cell { padding:7px 5px !important; font-size:12px !important; }
                }
              </style>
            </head>
            <body style="margin:0;padding:0;width:100%;background:#f3f6fb;font-family:Arial,sans-serif;color:#1f2937;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f3f6fb;">
                <tr>
                  <td align="center" style="padding:16px 8px;">
                    <table class="email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:760px;background:#ffffff;border:1px solid #dfe7f5;border-radius:18px;overflow:hidden;">
                      <tr>
                        <td class="email-padding" style="background:#0f1f4d;color:#ffffff;padding:22px 24px 18px;">
                          <div class="email-title" style="font-size:32px;font-weight:bold;line-height:1.2;overflow-wrap:anywhere;">Reporte del día · Peletería ALEXMAR · ${fechaCierre}</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-padding" style="padding:24px;">
                          <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:18px;overflow-wrap:anywhere;">
                            <div><strong>Para:</strong> ${escapeHtml(recipients.join(', ') || '—')}</div>
                            <div><strong>Fecha:</strong> ${fechaCierre}</div>
                          </div>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 18px;border-collapse:separate;border-spacing:6px 0;">
                            <tr>
                              <td class="email-metric" width="100%" style="width:100%;background:#eef4ff;border:1px solid #d7e5ff;border-radius:12px;padding:12px 14px;vertical-align:top;">
                                <div style="font-size:11px;text-transform:uppercase;color:#1d4ed8;font-weight:bold;">Vendido</div>
                                <div style="font-size:22px;font-weight:bold;overflow-wrap:anywhere;">$${Number(args.total || 0).toLocaleString('es-CO')}</div>
                              </td>
                            </tr>
                          </table>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                            <tr>
                              <td class="email-padding" style="padding:16px;">
                                <div style="font-size:12px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;margin-bottom:8px;">Inventario al cierre</div>
                                <div style="font-size:12px;color:#475569;margin-bottom:8px;">Productos activos: <strong>${productosActivos}</strong> · Total de líneas del cierre: <strong>${inventario.length}</strong></div>
                                <table class="inventory-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px;">
                                  <thead>
                                    <tr>
                                      <th class="inventory-cell" width="40%" style="width:40%;text-align:left;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Producto</th>
                                      <th class="inventory-cell" width="14%" style="width:14%;text-align:left;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Vendidos</th>
                                      <th class="inventory-cell" width="28%" style="width:28%;text-align:right;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Total venta</th>
                                      <th class="inventory-cell" width="18%" style="width:18%;text-align:right;padding:8px 10px;border-bottom:1px solid #dbe2ea;">Quedan</th>
                                    </tr>
                                  </thead>
                                  <tbody>${resumenHtml}</tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
        text: args.text ?? `Reporte del día · Peletería ALEXMAR\n\nFecha: ${fechaCierre}\nPara: ${recipients.join(', ') || '—'}\n\nVendido: $${Number(args.total || 0).toLocaleString('es-CO')}\n\nInventario al cierre:\n${inventario.map((item: any) => `- ${item?.nombre || 'Producto'} | vendidos ${Number(item?.vendidos ?? 0)} | total venta $${Number(item?.totalVenta ?? 0).toLocaleString('es-CO')} | quedan ${item?.quedan ?? '—'}`).join('\n') || 'No hay información disponible.'}\n\n${snapshotText}`,
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
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 90_000)
      let response: Response
      try {
        response = await fetch(`${emailApiUrl}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify(emailPayload),
          signal: controller.signal,
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('El servidor tardó demasiado en confirmar el envío. Revisa si llegó el correo antes de volver a intentarlo.')
        }
        throw new Error('No se pudo conectar con el servidor de correo. Verifica que Render esté activo e inténtalo de nuevo.')
      } finally {
        window.clearTimeout(timeoutId)
      }

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo enviar el correo')
      }

      const { error } = await supabase.from('envios_correo').insert({
        fecha: new Date().toISOString().slice(0, 10),
        total: Number(args.total || 0),
        pares: Number(args.pares || 0),
        destinatarios: recipients,
        storage_path: path,
      })
      if (error) throw error

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['envios_correo'] }),
  })
}
