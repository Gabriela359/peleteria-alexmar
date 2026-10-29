import test from 'node:test'
import assert from 'node:assert/strict'
import { fechaBogota, fechaMinimaReporte, fechaReportePermitida } from './reportRetention.js'

test('la retención toma como referencia la fecha operativa de Bogotá', () => {
  const ahora = new Date('2026-01-01T04:30:00.000Z')

  assert.equal(fechaBogota(ahora), '2025-12-31')
  assert.equal(fechaMinimaReporte(ahora), '2025-10-02')
  assert.equal(fechaReportePermitida('2025-10-02', ahora), true)
  assert.equal(fechaReportePermitida('2025-10-01', ahora), false)
  assert.equal(fechaReportePermitida('2026-01-01', ahora), false)
})

test('rechaza fechas inexistentes y acepta hoy en Bogotá', () => {
  const ahora = new Date('2026-06-10T18:00:00.000Z')

  assert.equal(fechaReportePermitida('2026-06-10', ahora), true)
  assert.equal(fechaReportePermitida('2026-02-30', ahora), false)
  assert.equal(fechaReportePermitida('not-a-date', ahora), false)
})
