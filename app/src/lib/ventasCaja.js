export function calcularTotalesCarrito(carrito = []) {
  const pares = carrito
    .filter((item) => item?.unidad === 'par')
    .reduce((sum, item) => sum + Number(item?.pares || 0), 0)

  const unidades = carrito
    .filter((item) => item?.unidad === 'unidad')
    .reduce((sum, item) => sum + Number(item?.pares || 0), 0)

  const total = carrito.reduce((sum, item) => sum + Number(item?.pares || 0) * Number(item?.precio || 0), 0)

  return {
    items: Array.isArray(carrito) ? carrito.length : 0,
    pares,
    unidades,
    total,
  }
}

export function obtenerResumenCaja(ventas = []) {
  const ventasValidas = Array.isArray(ventas) ? ventas.filter((venta) => !venta?.devuelta) : []
  const efectivo = ventasValidas.filter((venta) => venta?.metodo === 'Efectivo').reduce((sum, venta) => sum + Number(venta?.total || 0), 0)
  const transferencia = ventasValidas.filter((venta) => venta?.metodo === 'Transferencia').reduce((sum, venta) => sum + Number(venta?.total || 0), 0)
  const devoluciones = (Array.isArray(ventas) ? ventas : []).filter((venta) => Boolean(venta?.devuelta)).reduce((sum, venta) => sum + Number(venta?.total || 0), 0)

  return {
    efectivo,
    transferencia,
    total: efectivo + transferencia,
    devoluciones,
  }
}

export function contarUnidadesVenta(ventaItems = []) {
  return ventaItems.reduce((acc, item) => {
    const cantidad = Number(item?.pares || 0)
    if (!Number.isFinite(cantidad)) return acc
    if (item?.unidad === 'unidad') acc.unidades += cantidad
    else acc.pares += cantidad
    return acc
  }, { pares: 0, unidades: 0 })
}

export function textoCantidadVenta(ventaItems = []) {
  const cantidad = contarUnidadesVenta(ventaItems)
  const partes = []
  if (cantidad.pares > 0) partes.push(`${cantidad.pares} pares`)
  if (cantidad.unidades > 0) partes.push(`${cantidad.unidades} unidades`)
  return partes.length ? partes.join(' + ') : '0'
}

export function revisarVentaParaCaja({ cajaAbierta, carrito = [], productos = [] }) {
  if (!cajaAbierta) {
    return { ok: false, error: 'Debes abrir la caja del día antes de registrar ventas' }
  }

  if (!Array.isArray(carrito) || carrito.length === 0) {
    return { ok: false, error: 'El carrito está vacío' }
  }

  for (const item of carrito) {
    const producto = productos.find((p) => p.ref === item.ref)
    if (!producto) {
      return { ok: false, error: `Producto ${item.ref} no existe` }
    }

    const cantidad = Number(item?.pares || 0)
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { ok: false, error: `La cantidad de ${producto.nombre} no es válida` }
    }

    if (producto.unidad === 'par' && (!item.talla || !String(item.talla).trim())) {
      return { ok: false, error: `Debes seleccionar la talla de ${producto.nombre}` }
    }

    if (producto.unidad === 'unidad' && item.talla) {
      return { ok: false, error: `El producto ${producto.nombre} se vende por unidades, no por talla` }
    }

    const disponible = producto.unidad === 'par'
      ? Number(producto.tallas?.[item.talla ?? ''] ?? 0)
      : Number(producto.stock ?? 0)

    if (cantidad > disponible) {
      return { ok: false, error: `No hay suficiente stock de ${producto.nombre} (quedan ${disponible})` }
    }
  }

  return { ok: true }
}
