type VentaCajaLike = {
  metodo?: 'Efectivo' | 'Transferencia'
  total?: number
  devuelta?: boolean
  fecha?: string
}

type ProductoCajaLike = {
  ref: string
  nombre: string
  unidad: 'par' | 'unidad'
  tallas?: Record<string, number>
  stock?: number
  precio?: number
}

type ItemCarritoLike = {
  ref: string
  talla?: string | null
  pares?: number
  precio?: number
  nombre?: string
  unidad?: 'par' | 'unidad'
}

export function fechaOperativaCaja(date?: Date): string
export function obtenerCajaDelDia<T extends { fecha: string }>(cajas?: T[], fecha?: string): T | null

export function calcularTotalesCarrito(carrito?: ItemCarritoLike[]): {
  items: number
  pares: number
  unidades: number
  total: number
}

export function obtenerResumenCaja(ventas?: VentaCajaLike[]): {
  efectivo: number
  transferencia: number
  total: number
  devoluciones: number
}

export function revisarVentaParaCaja(args: {
  cajaAbierta: boolean
  carrito?: Array<{ ref: string; talla?: string | null; pares?: number }>
  productos?: ProductoCajaLike[]
}): { ok: true } | { ok: false; error: string }

export function contarUnidadesVenta(ventaItems?: Array<{ pares?: number; unidad?: 'par' | 'unidad' }>): {
  pares: number
  unidades: number
}

export function textoCantidadVenta(ventaItems?: Array<{ pares?: number; unidad?: 'par' | 'unidad' }>): string

export function mapearErrorCajaVenta(error: unknown): { code: string | null; message: string }
