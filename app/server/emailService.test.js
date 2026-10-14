import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRecipients, sendReportEmail } from './emailService.js'
import { validateEmailApiRequest } from './emailApiAuth.js'

test('normalizeRecipients incluye el destinatario por defecto', () => {
  const recipients = normalizeRecipients(['', 'gabrielaempresa572@gmail.com', 'otro@correo.com'])
  assert.deepEqual(recipients, ['gabrielaempresa572@gmail.com', 'otro@correo.com'])
})

test('normalizeRecipients usa el correo principal si no llega lista', () => {
  const recipients = normalizeRecipients([])
  assert.deepEqual(recipients, ['gabrielaempresa572@gmail.com'])
})

test('sendReportEmail usa la API de Resend sin depender de SMTP', async () => {
  const originalKey = process.env.RESEND_API_KEY
  const originalFrom = process.env.EMAIL_FROM
  const originalFetch = globalThis.fetch
  process.env.RESEND_API_KEY = 'test_resend_key'
  process.env.EMAIL_FROM = 'Peletería ALEXMAR <reportes@example.com>'
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails')
    assert.equal(options.headers.Authorization, 'Bearer test_resend_key')
    const payload = JSON.parse(options.body)
    assert.equal(payload.from, process.env.EMAIL_FROM)
    assert.deepEqual(payload.to, ['gabrielaempresa572@gmail.com', 'destino@example.com'])
    return new Response(JSON.stringify({ id: 'email-test-id' }), { status: 200 })
  }

  try {
    const result = await sendReportEmail({
      to: ['destino@example.com'],
      subject: 'Prueba',
      text: 'Texto',
      html: '<p>Prueba</p>',
    })
    assert.equal(result.messageId, 'email-test-id')
  } finally {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
    if (originalFrom === undefined) delete process.env.EMAIL_FROM
    else process.env.EMAIL_FROM = originalFrom
    globalThis.fetch = originalFetch
  }
})

test('sendReportEmail usa Gmail API con OAuth y no necesita SMTP', async () => {
  const originalEnv = {
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  }
  const originalFetch = globalThis.fetch
  Object.assign(process.env, {
    GMAIL_CLIENT_ID: 'client-id',
    GMAIL_CLIENT_SECRET: 'client-secret',
    GMAIL_REFRESH_TOKEN: 'refresh-token',
    EMAIL_FROM: 'reportes@gmail.com',
  })
  delete process.env.RESEND_API_KEY
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    if (url === 'https://oauth2.googleapis.com/token') {
      return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 })
    }
    return new Response(JSON.stringify({ id: 'gmail-message-id' }), { status: 200 })
  }

  try {
    const result = await sendReportEmail({
      to: ['destino@example.com'],
      subject: 'Reporte de prueba',
      text: 'Resumen',
      html: '<p>Resumen</p>',
    })
    assert.equal(requests.length, 2)
    assert.equal(requests[1].url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
    assert.equal(requests[1].options.headers.Authorization, 'Bearer access-token')
    const raw = Buffer.from(JSON.parse(requests[1].options.body).raw, 'base64url').toString('utf8')
    assert.match(raw, /To: .*destino@example\.com/)
    assert.match(raw, /reportes@gmail\.com/)
    assert.ok(raw.includes(Buffer.from('Reporte de prueba').toString('base64')))
    assert.equal(result.messageId, 'gmail-message-id')
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    globalThis.fetch = originalFetch
  }
})

test('validateEmailApiRequest rechaza peticiones sin Authorization', async () => {
  const result = await validateEmailApiRequest({ headers: {} })
  assert.equal(result.ok, false)
  assert.equal(result.status, 401)
})

test('validateEmailApiRequest rechaza Bearer sin token', async () => {
  const result = await validateEmailApiRequest({ headers: { authorization: 'Bearer ' } })
  assert.equal(result.ok, false)
  assert.equal(result.status, 401)
})
