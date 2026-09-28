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
    auth: {
      user: EMAIL_USER,
      pass: cleanPass,
    },
  })
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
  const transport = createTransport()
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
