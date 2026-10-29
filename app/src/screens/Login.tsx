import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../state/auth'
import { EyeIcon, EyeOffIcon } from '../components/Icons'

function MarcaVisual() {
  return (
    <section className="relative hidden min-h-[620px] items-center justify-center overflow-hidden bg-sura-azul-oscuro px-10 py-12 text-sura-blanco lg:flex xl:px-14 xl:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-32 h-[440px] w-[440px] rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-16 h-[310px] w-[310px] rounded-full border border-sura-amarillo/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-24 h-[440px] w-[440px] rounded-full bg-sura-azul-prof/70" />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <img
          src="/alexmar-logo.png"
          alt="Logo de Peletería Alexmar"
          className="h-40 w-40 rounded-[30px] border border-white/20 bg-sura-blanco object-contain p-2 shadow-2xl xl:h-48 xl:w-48"
        />
        <h1 className="m-0 text-3xl font-bold tracking-wide text-sura-amarillo xl:text-4xl">Peletería Alexmar</h1>
      </div>
    </section>
  )
}

function InputIcon({ kind }: { kind: 'email' | 'password' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      {kind === 'email'
        ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>
        : <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>}
    </svg>
  )
}

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
    try {
      const { error } = await signIn(email.trim(), password)
      if (error) setError(error === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-sura-azul-tint px-3 py-5 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-[-7rem] h-[360px] w-[360px] rounded-full bg-sura-amarillo/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -right-24 h-[420px] w-[420px] rounded-full bg-sura-azul-prof/10 blur-3xl" />

      <div className="relative grid w-full max-w-[1180px] overflow-hidden rounded-[26px] border border-sura-azul-divider bg-sura-blanco shadow-[0_24px_70px_rgba(75,21,27,0.18)] lg:grid-cols-[1.08fr_0.92fr]">
        <MarcaVisual />

        <section className="flex min-h-[min(760px,calc(100vh-2.5rem))] flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src="/alexmar-logo.png" alt="Logo de Peletería Alexmar" className="h-14 w-14 rounded-xl border border-sura-azul-chip bg-sura-blanco object-contain p-0.5 shadow-sm" />
              <div>
                <div className="text-[10px] font-bold tracking-[0.18em] text-gris-500">PELETERÍA</div>
                <div className="text-xl font-bold text-sura-azul-prof">ALEXMAR</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sura-azul-cielo">Bienvenido</div>
              <h2 className="m-0 text-3xl font-bold tracking-tight text-sura-azul-oscuro sm:text-[34px]">Inicia sesión</h2>
              <p className="mt-2 text-sm leading-6 text-gris-500">Ingresa tus datos para continuar al sistema.</p>
            </div>

            <form onSubmit={onSubmit} className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-gris-500">Correo electrónico</span>
                <span className="flex h-[50px] items-center gap-3 rounded-xl border border-gris-300 bg-sura-blanco px-3.5 text-gris-350 transition-colors focus-within:border-sura-azul-cielo focus-within:ring-4 focus-within:ring-sura-azul-cielo/10">
                  <InputIcon kind="email" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-full min-w-0 flex-1 border-0! bg-transparent! p-0! text-sm text-gris-900 outline-none! shadow-none! placeholder:text-gris-350!"
                    placeholder="tu@correo.com"
                  />
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gris-500">Contraseña</span>
                <span className="flex h-[50px] items-center gap-3 rounded-xl border border-gris-300 bg-sura-blanco px-3.5 text-gris-350 transition-colors focus-within:border-sura-azul-cielo focus-within:ring-4 focus-within:ring-sura-azul-cielo/10">
                  <InputIcon kind="password" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full min-w-0 flex-1 border-0! bg-transparent! p-0! text-sm text-gris-900 outline-none! shadow-none! placeholder:text-gris-350!"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={mostrarPassword}
                    onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gris-500 transition-colors hover:bg-sura-azul-tint hover:text-sura-azul-prof focus-visible:outline-2 focus-visible:outline-sura-azul-cielo"
                  >
                    {mostrarPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>

              {error && (
                <div role="alert" className="rounded-xl border border-danger-border bg-danger-2 px-3.5 py-3 text-sm text-danger-1">{error}</div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 flex h-[50px] items-center justify-center gap-2 rounded-xl bg-sura-azul-prof px-5 text-sm font-bold text-sura-blanco shadow-sm transition-colors hover:bg-sura-azul-prof-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sura-azul-prof disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {enviando ? 'Ingresando…' : 'Entrar al sistema'}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-sura-azul-divider" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gris-350">Acceso seguro</span>
              <span className="h-px flex-1 bg-sura-azul-divider" />
            </div>

            <p className="m-0 text-center text-xs leading-5 text-gris-500">
              ¿No tienes cuenta? Pídele a un administrador que te cree un usuario.
            </p>
            <div className="mt-10 text-center text-[11px] text-gris-350">© Peletería Alexmar · Inventario y ventas</div>
          </div>
        </section>
      </div>
    </main>
  )
}
