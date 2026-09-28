// Formato de moneda, fechas y textos + utilidades de reportes/paginación.
import type { Producto, Venta, VentaConItems } from '../types/database'

export function cop(n: number): string {
  return '$ ' + Math.round(n || 0).toLocaleString('es-CO')
}

export function fecha(iso: string): string {
  const d = new Date(iso)
  return (
    String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear()
  )
}

export function hhmm(iso: string): string {
  const d = new Date(iso)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

export function esHoy(iso: string): boolean {
  const d = new Date(iso), h = new Date()
  return d.toDateString() === h.toDateString()
}

export function hoyLargo(): string {
  const s = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function porTalla(m: Pick<Producto, 'unidad'>): boolean {
  return m.unidad !== 'unidad'
}
export function unidadTxt(m: Pick<Producto, 'unidad'>): string {
  return porTalla(m) ? 'pares' : 'unidades'
}
export function paresDe(m: Pick<Producto, 'unidad' | 'tallas' | 'stock'>): number {
  return porTalla(m)
    ? Object.values(m.tallas || {}).reduce((a, v) => a + Number(v || 0), 0)
    : Number(m.stock || 0)
}

export function detalle(v: VentaConItems): string {
  return v.venta_items.map((i) => i.nombre + (i.talla ? ' T' + i.talla : '') + ' ×' + i.pares).join(' · ')
}

export interface Rango { desde: Date; hasta: Date; desdePrev: Date; hastaPrev: Date; dias: number }

export function rango(periodo: 'dia' | 'semana' | 'mes'): Rango {
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)
  const dias = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : 30
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - (dias - 1))
  desde.setHours(0, 0, 0, 0)
  const desdePrev = new Date(desde)
  desdePrev.setDate(desdePrev.getDate() - dias)
  const hastaPrev = new Date(desde)
  hastaPrev.setMilliseconds(-1)
  return { desde, hasta: hoy, desdePrev, hastaPrev, dias }
}

export function entre(v: Venta, a: Date, b: Date): boolean {
  const d = new Date(v.fecha)
  return d >= a && d <= b && !v.devuelta
}

export interface Agg { total: number; pares: number; util: number; n: number }

export function agg(list: VentaConItems[]): Agg {
  return {
    total: list.reduce((a, v) => a + v.total, 0),
    pares: list.reduce((a, v) => a + v.venta_items.filter((i) => i.unidad === 'par').reduce((x, i) => x + i.pares, 0), 0),
    util: list.reduce((a, v) => a + (v.total - v.costo), 0),
    n: list.length,
  }
}

export function delta(a: number, b: number): { txt: string; color: string } {
  if (!b) return { txt: a > 0 ? 'Sin dato del periodo anterior' : 'Sin movimiento', color: 'var(--color-gris-350)' }
  const p = Math.round(((a - b) / b) * 100)
  return { txt: (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs. periodo anterior', color: p >= 0 ? 'var(--color-success-1)' : 'var(--color-danger-1)' }
}

export interface PagerInfo {
  pagina: number
  desde: number
  hasta: number
  texto: string
  paginas: (number | '…')[]
  hayPrev: boolean
  hayNext: boolean
}

export function pager(total: number, porPag: number, actual: number): PagerInfo {
  const paginas = Math.max(1, Math.ceil(total / porPag))
  const p = Math.min(Math.max(1, actual), paginas)
  const nums: (number | '…')[] = []
  for (let i = 1; i <= paginas; i++) {
    if (paginas <= 7 || i === 1 || i === paginas || Math.abs(i - p) <= 1) nums.push(i)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }
  const desde = total === 0 ? 0 : (p - 1) * porPag + 1
  const hasta = Math.min(p * porPag, total)
  return {
    pagina: p, desde, hasta,
    texto: total === 0 ? 'Sin registros' : 'Mostrando ' + desde + '–' + hasta + ' de ' + total,
    paginas: nums, hayPrev: p > 1, hayNext: p < paginas,
  }
}
