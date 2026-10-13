import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../state/auth'
import { EyeIcon, EyeOffIcon } from '../components/Icons'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
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
    <div className="grid min-h-screen place-items-center bg-linear-to-br from-sura-azul-oscuro to-sura-azul-prof p-4 sm:p-10">
      <div className="w-full max-w-[420px] rounded-2xl bg-sura-blanco p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex justify-center sm:mb-7">
          <img
            src="/alexmar-logo.png"
            alt="Logo de Peletería Alexmar"
            className="h-20 w-20 rounded-2xl border border-sura-azul-chip bg-sura-blanco object-contain shadow-sm sm:h-24 sm:w-24"
          />
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
          <div className="grid gap-1.5">
            <span className="text-xs font-bold text-gris-500">Contraseña</span>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'} required autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gris-300 border-b-2 border-b-gris-500 rounded-t-xl px-3.5 py-2.5 pr-11 text-sm outline-none focus:border-b-sura-azul-cielo"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
                onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gris-500 hover:text-sura-azul-prof focus-visible:outline-2 focus-visible:outline-sura-azul-cielo"
              >
                {mostrarPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

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
