import nodemailer from 'nodemailer'
import { buildReportPdf } from './reportPdf.js'

export const DEFAULT_REPORT_EMAIL = 'gabrielaempresa572@gmail.com'

export function normalizeRecipients(recipients = []) {
  const clean = (recipients || [])
    .map((email) => String(email || '').trim())
    .filter(Boolean)

  if (clean.length === 0) {
    return [DEFAULT_REPORT_EMAIL]
  }

  const unique = [...new Set(clean)]
  if (unique.includes(DEFAULT_REPORT_EMAIL)) {
    return unique
  }

  return [DEFAULT_REPORT_EMAIL, ...unique]
}

export function createTransport() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env
  const cleanPass = (EMAIL_PASS || '').replace(/\s+/g, '')

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !cleanPass) {
    throw new Error('Faltan variables SMTP: EMAIL_HOST, EMAIL_PORT, EMAIL_USER y EMAIL_PASS')
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: String(EMAIL_SECURE ?? 'true') === 'true',
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    auth: {
      user: EMAIL_USER,
      pass: cleanPass,
    },
  })
}

async function sendWithResend({ apiKey, from, recipients, subject, text, html, attachments }) {
  if (!from) throw new Error('Falta configurar EMAIL_FROM con un remitente verificado en Resend')

  let response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        text,
        html,
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.isBuffer(attachment.content)
            ? attachment.content.toString('base64')
            : attachment.content,
          content_type: attachment.contentType,
        })),
      }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Resend tardó demasiado en responder al envío del correo')
    }
    throw new Error('No se pudo conectar con la API de Resend')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.message || `Resend rechazó el correo (HTTP ${response.status})`)
  }

  return { messageId: result?.id, recipients }
}

function encodeMimeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function encodeBase64Lines(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n').trimEnd()
}

async function sendWithGoogleAppsScript({ url, token, from, recipients, subject, text, html }) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, from, to: recipients, subject, text, html }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Google Apps Script tardó demasiado en responder')
    }
    throw new Error('No se pudo conectar con Google Apps Script')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `Google Apps Script rechazó el envío (HTTP ${response.status})`)
  }

  return { messageId: result.messageId || null, recipients }
}

async function sendWithGmailApi({ clientId, clientSecret, refreshToken, from, recipients, subject, text, html }) {
  const fromValue = String(from || '').replace(/[\r\n]/g, ' ')
  const fromMatch = fromValue.match(/^(.*?)\s*<([^<>]+)>$/)
  const displayName = fromMatch?.[1].trim()
  const sender = fromMatch?.[2] || fromValue
  if (!sender || !sender.includes('@')) {
    throw new Error('Configura EMAIL_FROM con la misma cuenta Gmail autorizada en Gmail API')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const tokenResult = await tokenResponse.json().catch(() => null)
  if (!tokenResponse.ok || !tokenResult?.access_token) {
    throw new Error(tokenResult?.error_description || 'No se pudo autorizar el envío con Gmail API')
  }

  const boundary = `alexmar-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const safeFrom = sender.replace(/[\r\n<>]/g, '')
  const safeRecipients = recipients.map((recipient) => recipient.replace(/[\r\n<>]/g, ''))
  const safeSubject = encodeMimeHeader(String(subject || 'Reporte diario Peletería ALEXMAR').replace(/[\r\n]/g, ' '))
  const mime = [
    `From: ${displayName ? `${encodeMimeHeader(displayName)} <${safeFrom}>` : safeFrom}`,
    `To: ${safeRecipients.join(', ')}`,
    `Subject: ${safeSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBase64Lines(String(text || '')),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBase64Lines(String(html || '')),
    `--${boundary}--`,
    '',
  ].join('\r\n')
  const raw = Buffer.from(mime, 'utf8').toString('base64url')

  const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenResult.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(20_000),
  })
  const sendResult = await sendResponse.json().catch(() => null)
  if (!sendResponse.ok) {
    throw new Error(sendResult?.error?.message || `Gmail API rechazó el envío (HTTP ${sendResponse.status})`)
  }

  return { messageId: sendResult?.id, recipients }
}

export async function sendReportEmail({
  to,
  subject,
  html,
  text,
  attachments = [],
  report,
  includeReportPdf = false,
}) {
  const recipients = normalizeRecipients(Array.isArray(to) ? to : [to])
  const reportPdf = includeReportPdf && report ? await buildReportPdf(report) : null

  const validAttachments = (attachments || []).filter((attachment) => {
    if (!attachment || typeof attachment !== 'object') return false
    const name = String(attachment.filename || '').toLowerCase()
    return name.endsWith('.pdf') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')
  })

  const mailedAttachments = [
    ...validAttachments,
    ...(reportPdf ? [{ filename: `reporte-${new Date().toISOString().slice(0, 10)}.pdf`, content: reportPdf, contentType: 'application/pdf' }] : []),
  ]

  if (process.env.GOOGLE_APPS_SCRIPT_URL && process.env.GOOGLE_APPS_SCRIPT_TOKEN) {
    return sendWithGoogleAppsScript({
      url: process.env.GOOGLE_APPS_SCRIPT_URL,
      token: process.env.GOOGLE_APPS_SCRIPT_TOKEN,
      from: process.env.EMAIL_FROM,
      recipients,
      subject,
      text,
      html,
    })
  }

  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    return sendWithGmailApi({
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      from: process.env.EMAIL_FROM,
      recipients,
      subject,
      text,
      html,
    })
  }

  if (process.env.RESEND_API_KEY) {
    return sendWithResend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      recipients,
      subject,
      text,
      html,
      attachments: mailedAttachments,
    })
  }

  const transport = createTransport()
  const mail = await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || DEFAULT_REPORT_EMAIL,
    to: recipients,
    subject,
    text,
    html,
    attachments: mailedAttachments,
  })

  return { messageId: mail.messageId, recipients }
}
