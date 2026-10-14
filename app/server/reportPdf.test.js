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

test('buildReportPdf conserva el detalle de productos y muestra solo la tarjeta de total vendido', async () => {
  const pdf = await buildReportPdf({
    fecha: '2026-09-21',
    total: 1250,
    cantidadVentas: 3,
    inventario: [{
      nombre: 'GA-0810 · Herrajes',
      vendidos: 2,
      totalVenta: 1250,
      quedan: '45 unidades',
    }],
  })

  const text = decodePdfText(pdf)

  assert.ok(Buffer.isBuffer(pdf))
  assert.match(pdf.toString('latin1').slice(0, 5), /^%PDF-/)
  assert.match(text, /Reporte diario|Reporte del día/)
  assert.match(text, /TOTAL VENDIDO/)
  assert.match(text, /\$1\.250/)
  assert.match(text, /Productos vendidos e inventario/)
  assert.match(text, /Cantidad/)
  assert.match(text, /Total vendido/)
  assert.match(text, /Queda en inventario/)
  assert.match(text, /GA-0810/)
  assert.match(text, /45 unidades/)
  assert.doesNotMatch(text, /EN INVENTARIO/)
})

test('buildReportPdf pagina los productos y mantiene el detalle de inventario', async () => {
  const pdf = await buildReportPdf({
    fecha: '2026-09-21',
    total: 78000,
    cantidadVentas: 12,
    inventario: Array.from({ length: 40 }, (_, index) => ({
      nombre: `Producto ${index + 1}`,
      vendidos: index,
      totalVenta: index * 1000,
      quedan: `${100 - index} pares`,
    })),
  })
  const text = decodePdfText(pdf)
  const pageCount = [...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length

  assert.ok(pageCount > 1)
  assert.match(text, /TOTAL VENDIDO/)
  assert.match(text, /Producto 40/)
  assert.match(text, /continuación/)
  assert.doesNotMatch(text, /EN INVENTARIO/)
})
