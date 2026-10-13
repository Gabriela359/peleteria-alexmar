import http from 'node:http'
import dotenv from 'dotenv'
import { sendReportEmail } from './emailService.js'
import { validateEmailApiRequest } from './emailApiAuth.js'
import { createManagedUser, deleteManagedUser, UserApiError } from './userApi.js'

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
    (req.method === 'POST' && pathname !== '/' && pathname !== '/users') ||
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
