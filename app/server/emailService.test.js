import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRecipients } from './emailService.js'
import { validateEmailApiRequest } from './emailApiAuth.js'

test('normalizeRecipients incluye el destinatario por defecto', () => {
  const recipients = normalizeRecipients(['', 'gabrielaempresa572@gmail.com', 'otro@correo.com'])
  assert.deepEqual(recipients, ['gabrielaempresa572@gmail.com', 'otro@correo.com'])
})

test('normalizeRecipients usa el correo principal si no llega lista', () => {
  const recipients = normalizeRecipients([])
  assert.deepEqual(recipients, ['gabrielaempresa572@gmail.com'])
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
