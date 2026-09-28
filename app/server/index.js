import http from 'node:http'
import dotenv from 'dotenv'
import { sendReportEmail } from './emailService.js'
import { validateEmailApiRequest } from './emailApiAuth.js'

dotenv.config({ path: '.env.local' })

const PORT = Number(process.env.PORT || 3001)
const allowedOrigins = (process.env.ALLOWED_EMAIL_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174').split(',').map((value) => value.trim()).filter(Boolean)

const server = http.createServer(async (req, res) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  if (origin && !allowedOrigins.includes(origin)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: 'Origen no autorizado' }))
    return
  }

  res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const authCheck = await validateEmailApiRequest({ headers: req.headers })
  if (!authCheck.ok) {
    res.statusCode = authCheck.status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: authCheck.error }))
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk

  try {
    const payload = body ? JSON.parse(body) : {}
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
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: message }))
  }
})

server.listen(PORT, () => {
  console.log(`Servidor de correo escuchando en http://localhost:${PORT}`)
})

export function createServerForTest() {
  return server
}
