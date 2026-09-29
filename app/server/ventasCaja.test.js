import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularTotalesCarrito, fechaOperativaCaja, mapearErrorCajaVenta, obtenerCajaDelDia, obtenerResumenCaja, revisarVentaParaCaja } from '../src/lib/ventasCaja.js'

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

  it('explica el rechazo de venta cuando Supabase no encuentra la caja del día', () => {
    const result = mapearErrorCajaVenta({
      code: 'P0001',
      message: 'Debes abrir la caja del día antes de registrar ventas',
    })

    assert.equal(result.code, 'P0001')
    assert.match(result.message, /fecha operativa del servidor/i)
    assert.match(result.message, /antes de abrir otra caja/i)
  })

  it('usa la fecha de Colombia para caja y resuelve solo la caja de hoy', () => {
    assert.equal(fechaOperativaCaja(new Date('2026-09-29T03:33:38.572Z')), '2026-09-28')
    assert.deepEqual(obtenerCajaDelDia([
      { fecha: '2026-09-29', estado: 'abierta' },
      { fecha: '2026-09-28', estado: 'cerrada' },
    ], '2026-09-28'), { fecha: '2026-09-28', estado: 'cerrada' })
  })

  it('mapea el error del cierre cuando no encuentra la caja de hoy', () => {
    const result = mapearErrorCajaVenta({
      code: 'P0001',
      message: 'No hay una caja abierta hoy',
    })

    assert.equal(result.code, 'P0001')
    assert.match(result.message, /fecha operativa de hoy/i)
    assert.match(result.message, /evitar duplicados/i)
  })

  it('conserva errores desconocidos y proporciona un mensaje si no hay detalle', () => {
    assert.deepEqual(mapearErrorCajaVenta({ code: '23503', message: 'Referencia inválida' }), {
      code: '23503',
      message: 'Referencia inválida',
    })
    assert.deepEqual(mapearErrorCajaVenta({ code: 'P0001' }), {
      code: 'P0001',
      message: 'No se pudo registrar la venta. Inténtalo de nuevo.',
    })
  })
})
