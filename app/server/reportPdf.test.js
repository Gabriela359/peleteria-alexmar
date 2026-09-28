import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReportPdf } from './reportPdf.js'

function decodePdfText(pdf) {
  const raw = pdf.toString('latin1')
  const hexSegments = [...raw.matchAll(/<([0-9A-Fa-f\s]+)>/g)]
    .map((match) => match[1].replace(/\s+/g, ''))
    .join('')

  if (!hexSegments) return raw
  return Buffer.from(hexSegments, 'hex').toString('latin1')
}

test('buildReportPdf genera un PDF completo con resumen y inventario', async () => {
  const pdf = await buildReportPdf({
    fecha: '2026-09-21',
    destinatarios: ['gabrielaempresa572@gmail.com'],
    total: 1250,
    pares: 20,
    stockTotal: 56,
    inventario: [
      { nombre: 'GA-0810 · Herrajes de adidas', vendidos: 0, quedan: '45 unidades' },
      { nombre: 'ZU-0616 · Suela de zapato nike', vendidos: 0, quedan: '11 pares' },
    ],
  })

  const text = decodePdfText(pdf)

  assert.ok(Buffer.isBuffer(pdf))
  assert.match(pdf.toString('latin1').slice(0, 5), /^%PDF-/)
  assert.match(text, /Reporte diario|Reporte del día/)
  assert.match(text, /VENDIDO|Vendido/)
  assert.match(text, /PARES|Pares/)
  assert.match(text, /EN INVENTARIO|En inventario/)
  assert.match(text, /GA-0810/)
  assert.match(text, /ZU-0616/)
  assert.match(text, /Herrajes de adidas/)
})
