import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularTotalesCarrito, obtenerResumenCaja, revisarVentaParaCaja } from '../src/lib/ventasCaja.js'

describe('ventasCaja helpers', () => {
  it('resume el efectivo y transferencia de la caja del día', () => {
    const resumen = obtenerResumenCaja([
      { metodo: 'Efectivo', total: 100, devuelta: false, fecha: '2026-09-26T10:00:00Z' },
      { metodo: 'Transferencia', total: 80, devuelta: false, fecha: '2026-09-26T11:00:00Z' },
      { metodo: 'Efectivo', total: 20, devuelta: true, fecha: '2026-09-26T12:00:00Z' },
    ])

    assert.equal(resumen.efectivo, 100)
    assert.equal(resumen.transferencia, 80)
    assert.equal(resumen.total, 180)
    assert.equal(resumen.devoluciones, 20)
  })

  it('calcula subtotal, líneas y separa pares y unidades del carrito', () => {
    const totals = calcularTotalesCarrito([
      { ref: 'SU-101', talla: '38', nombre: 'Modelo A', unidad: 'par', pares: 2, precio: 150, costo: 80 },
      { ref: 'SU-102', talla: null, nombre: 'Modelo B', unidad: 'unidad', pares: 3, precio: 120, costo: 60 },
    ])

    assert.equal(totals.items, 2)
    assert.equal(totals.pares, 2)
    assert.equal(totals.unidades, 3)
    assert.equal(totals.total, 660)
  })

  it('valida que la caja esté abierta y que haya stock suficiente', () => {
    const result = revisarVentaParaCaja({
      cajaAbierta: true,
      carrito: [{ ref: 'SU-101', talla: '38', pares: 3 }],
      productos: [{
        ref: 'SU-101',
        nombre: 'Modelo A',
        unidad: 'par',
        tallas: { '38': 1 },
        stock: 0,
        precio: 150,
      }],
    })

    assert.equal(result.ok, false)
    assert.match(result.error, /No hay suficiente stock/i)
  })

  it('separa correctamente pares y unidades en ventas mixtas', () => {
    const res = calcularTotalesCarrito([
      { ref: 'SU-101', talla: '38', nombre: 'Modelo A', unidad: 'par', pares: 2, precio: 150 },
      { ref: 'SU-200', nombre: 'Modelo B', unidad: 'unidad', pares: 4, precio: 90 },
    ])

    assert.equal(res.pares, 2)
    assert.equal(res.unidades, 4)
    assert.equal(res.total, 660)
  })
})
