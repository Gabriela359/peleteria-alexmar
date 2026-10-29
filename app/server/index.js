import http from 'node:http'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { sendReportEmail } from './emailService.js'
import { validateEmailApiRequest } from './emailApiAuth.js'
import { createManagedUser, deleteManagedUser, UserApiError } from './userApi.js'
import { buildReportPdf } from './reportPdf.js'
import { fechaReportePermitida } from './reportRetention.js'

dotenv.config({ path: '.env.local' })

const PORT = Number(process.env.PORT || 3001)
const allowedOrigins = (process.env.ALLOWED_EMAIL_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174').split(',').map((value) => value.trim()).filter(Boolean)

async function readJson(req, maxBytes) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) throw new UserApiError('La solicitud es demasiado grande', 413)
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    throw new UserApiError('El contenido de la solicitud no es válido', 400)
  }
}

async function verifyActiveAdmin(user, authorization) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) throw new UserApiError('Supabase no configurado en el backend', 503)

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: profile, error } = await client
    .from('profiles')
    .select('rol, activo')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw new UserApiError('No se pudo verificar el permiso de administrador', 500)
  if (!profile || profile.rol !== 'admin' || !profile.activo) {
    throw new UserApiError('Solo un administrador activo puede descargar reportes', 403)
  }
}

const server = http.createServer(async (req, res) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  if (origin && !allowedOrigins.includes(origin)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: 'Origen no autorizado' }))
    return
  }

  res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Expose-Headers', 'X-Report-Template-Version')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const pathname = new URL(req.url || '/', 'http://localhost').pathname
  if (req.method === 'GET' && pathname === '/health') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      ok: true,
      supabaseConfigured: !!((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
        (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)),
      userRegistrationConfigured: !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    }))
    return
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const deleteUserMatch = pathname.match(/^\/users\/([^/]+)$/)
  if (
    (req.method === 'POST' && pathname !== '/' && pathname !== '/users' && pathname !== '/reports/pdf') ||
    (req.method === 'DELETE' && !deleteUserMatch)
  ) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: 'Ruta no encontrada' }))
    return
  }

  const authCheck = await validateEmailApiRequest({ headers: req.headers })
  if (!authCheck.ok) {
    res.statusCode = authCheck.status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: authCheck.error }))
    return
  }

  try {
    if (req.method === 'DELETE') {
      const targetUserId = deleteUserMatch[1]
      const deleted = await deleteManagedUser({
        targetUserId,
        user: authCheck.user,
        token: String(req.headers.authorization).slice('Bearer '.length).trim(),
      })
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, user: deleted }))
      return
    }

    const payload = await readJson(req, pathname === '/users' ? 32 * 1024 : 5 * 1024 * 1024)
    if (pathname === '/users') {
      const authHeader = String(req.headers.authorization || '')
      const token = authHeader.slice('Bearer '.length).trim()
      const user = await createManagedUser({ payload, user: authCheck.user, token })
      res.statusCode = 201
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, user }))
      return
    }

    if (pathname === '/reports/pdf') {
      await verifyActiveAdmin(authCheck.user, String(req.headers.authorization || ''))
      const report = payload.report
      if (
        !report ||
        typeof report !== 'object' ||
        Array.isArray(report) ||
        typeof report.fecha !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(report.fecha) ||
        !fechaReportePermitida(report.fecha) ||
        typeof report.total !== 'number' ||
        !Number.isFinite(report.total) ||
        typeof report.cantidadVentas !== 'number' ||
        !Number.isInteger(report.cantidadVentas) ||
        report.cantidadVentas < 0 ||
        !Array.isArray(report.inventario) ||
        report.inventario.some((item) =>
          !item ||
          typeof item !== 'object' ||
          typeof item.nombre !== 'string' ||
          typeof item.vendidos !== 'number' ||
          !Number.isFinite(item.vendidos) ||
          typeof item.totalVenta !== 'number' ||
          !Number.isFinite(item.totalVenta) ||
          typeof item.quedan !== 'string'
        )
      ) {
        throw new UserApiError('Los datos del reporte no son válidos o la fecha está fuera de los últimos 90 días')
      }

      const pdf = await buildReportPdf(report)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('X-Report-Template-Version', '2')
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${report.fecha}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
      return
    }

    const result = await sendReportEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments || [],
      report: payload.report,
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, messageId: result.messageId, recipients: result.recipients }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error procesando solicitud de API', {
      pathname,
      code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      message,
    })
    res.statusCode = error instanceof UserApiError ? error.status : 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: message }))
  }
})

server.listen(PORT, () => {
  console.log(`Servidor de API escuchando en http://localhost:${PORT}`)
})

export function createServerForTest() {
  return server
}
