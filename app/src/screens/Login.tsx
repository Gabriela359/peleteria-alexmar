import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../state/auth'
import { LogoIcon } from '../components/Icons'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    const { error } = await signIn(email.trim(), password)
    setEnviando(false)
    if (error) setError(error === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-linear-to-br from-sura-azul-oscuro to-sura-azul-prof p-10">
      <div className="w-[420px] max-w-full bg-sura-blanco rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl bg-sura-azul-cielo grid place-items-center shrink-0">
            <LogoIcon />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">Peletería El Progreso</div>
            <div className="text-[13px] text-gris-350">Inventario y ventas de suelas · Bucaramanga</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-gris-500">Correo</span>
            <input
              type="email" required autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
              placeholder="tu@correo.com"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-gris-500">Contraseña</span>
            <input
              type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 text-sm outline-none focus:border-b-sura-azul-cielo"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="text-sm text-danger-1 bg-danger-2 border border-danger-border rounded-xl px-3.5 py-2.5">{error}</div>
          )}

          <button
            type="submit" disabled={enviando}
            className="rounded-full bg-sura-amarillo text-sura-azul-oscuro font-bold text-sm py-3 mt-1 disabled:opacity-60 hover:bg-sura-amarillo-hover transition-colors"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="text-xs text-gris-350 leading-relaxed mt-6">
          ¿No tienes cuenta? Pídele a un administrador que te cree un usuario desde el panel de Supabase.
        </div>
      </div>
    </div>
  )
}
