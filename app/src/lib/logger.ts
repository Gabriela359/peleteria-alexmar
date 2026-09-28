export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'
export type LoggerModule = 'APP' | 'AUTH' | 'VENTAS' | 'INVENTARIO' | 'CAJA' | 'REPORTES' | 'USUARIOS' | 'CORREO' | 'SUPABASE' | 'ERROR' | 'UI'

const SENSITIVE_KEYS = /(password|passwd|secret|token|jwt|api[_-]?key|smtp|private|authorization|cookie)/i

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return value
    return trimmed.length > 24 ? `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}` : trimmed
  }

  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(redactValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redactValue(item),
      ])
    )
  }

  return value
}

function shouldLog(level: LoggerLevel): boolean {
  if (level === 'error' || level === 'warn') return true
  return import.meta.env.DEV
}

function writeLog(level: LoggerLevel, module: string, message: string, meta?: unknown) {
  if (!shouldLog(level)) return

  const payload = meta === undefined ? '' : JSON.stringify(redactValue(meta))
  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${module}] [${level.toUpperCase()}]`

  switch (level) {
    case 'error':
      console.error(prefix, message, payload || '')
      return
    case 'warn':
      console.warn(prefix, message, payload || '')
      return
    case 'success':
      console.info(prefix, message, payload || '')
      return
    case 'debug':
      console.debug(prefix, message, payload || '')
      return
    default:
      console.info(prefix, message, payload || '')
  }
}

export const logger = Object.assign(
  (level: LoggerLevel, message: string, meta?: unknown) => writeLog(level, 'APP', message, meta),
  {
    debug: (module: string, message: string, meta?: unknown) => writeLog('debug', module, message, meta),
    info: (module: string, message: string, meta?: unknown) => writeLog('info', module, message, meta),
    warn: (module: string, message: string, meta?: unknown) => writeLog('warn', module, message, meta),
    error: (module: string, message: string, meta?: unknown) => writeLog('error', module, message, meta),
    success: (module: string, message: string, meta?: unknown) => writeLog('success', module, message, meta),
  },
)

export function logApp(level: LoggerLevel, message: string, meta?: unknown) {
  return writeLog(level, 'APP', message, meta)
}
