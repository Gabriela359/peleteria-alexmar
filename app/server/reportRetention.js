const RETENTION_DAYS = 90
const BUSINESS_TIME_ZONE = 'America/Bogota'

export function fechaBogota(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type) => parts.find((part) => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function fechaMinimaReporte(date = new Date()) {
  const [year, month, day] = fechaBogota(date).split('-').map(Number)
  const cutoff = new Date(Date.UTC(year, month - 1, day - RETENTION_DAYS))
  return `${cutoff.getUTCFullYear()}-${String(cutoff.getUTCMonth() + 1).padStart(2, '0')}-${String(cutoff.getUTCDate()).padStart(2, '0')}`
}

export function fechaReportePermitida(fecha, ahora = new Date()) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  const parsed = new Date(`${fecha}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) return false
  return fecha >= fechaMinimaReporte(ahora) && fecha <= fechaBogota(ahora)
}
