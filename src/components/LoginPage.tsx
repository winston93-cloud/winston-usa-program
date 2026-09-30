import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCircleExclamation,
  faEye,
  faEyeSlash,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import logo from '../assets/logo_winston.png'
import { useAuth } from '../store/authStore'
import { insforge } from '../lib/insforge'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope: string
            prompt?: string
            callback: (res: {
              access_token?: string
              error?: string
              error_description?: string
            }) => void
            error_callback?: (err: { type?: string; message?: string }) => void
          }) => { requestAccessToken: (o?: { prompt?: string }) => void }
        }
      }
    }
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google GIS')))
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se cargó Google Sign-In'))
    document.head.appendChild(s)
  })
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

const campo =
  'field-input min-h-12 w-full rounded-xl py-3 pl-11 pr-4 text-base placeholder:text-ink-muted/50'

export function LoginPage() {
  const { loginManual, loginGoogle, completeGoogleInsforgeSession } = useAuth()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const finishingOAuth = useRef(false)
  const tokenClient = useRef<{
    requestAccessToken: (o?: { prompt?: string }) => void
  } | null>(null)

  const clientId = (
    import.meta.env.USA_GOOGLE_CLIENT_ID as string | undefined
  )?.trim()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError =
      params.get('error_description') ||
      params.get('error') ||
      params.get('insforge_error')
    if (oauthError) {
      setError(decodeURIComponent(oauthError))
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    const comingFromOAuth = params.has('insforge_code') || params.has('code')

    void (async () => {
      if (finishingOAuth.current) return
      finishingOAuth.current = true
      try {
        if (comingFromOAuth) setBusy(true)
        const ok = await completeGoogleInsforgeSession()
        if (ok || comingFromOAuth) {
          window.history.replaceState({}, '', window.location.pathname)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error con Google')
        window.history.replaceState({}, '', window.location.pathname)
      } finally {
        setBusy(false)
        finishingOAuth.current = false
      }
    })()
  }, [completeGoogleInsforgeSession])

  useEffect(() => {
    if (!clientId) {
      setGoogleReady(true)
      return
    }
    void (async () => {
      try {
        await loadGis()
        tokenClient.current = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: (res) => {
            void (async () => {
              if (res.error || !res.access_token) {
                setError(
                  res.error_description || res.error || 'Google cancelado',
                )
                setBusy(false)
                return
              }
              try {
                await loginGoogle(res.access_token)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Error Google')
              } finally {
                setBusy(false)
              }
            })()
          },
          error_callback: (err) => {
            setBusy(false)
            if (err?.type === 'popup_closed') return
            setError(err?.message || 'No se pudo abrir Google')
          },
        })
        setGoogleReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar Google')
        setGoogleReady(true)
      }
    })()
  }, [clientId, loginGoogle])

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      void (async () => {
        setBusy(true)
        setError('')
        try {
          await loginManual(login, password)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al entrar')
        } finally {
          setBusy(false)
        }
      })()
    },
    [login, password, loginManual],
  )

  const onGoogle = useCallback(() => {
    void (async () => {
      setBusy(true)
      setError('')
      try {
        if (clientId && tokenClient.current) {
          tokenClient.current.requestAccessToken({ prompt: 'select_account' })
          return
        }
        const { error: oauthError } = await insforge.auth.signInWithOAuth(
          'google',
          {
            redirectTo: window.location.origin,
            additionalParams: {
              prompt: 'select_account',
              hd: 'winston93.edu.mx',
            },
          },
        )
        if (oauthError) {
          throw new Error(oauthError.message || 'No se pudo iniciar Google')
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Google no disponible. Revisa OAuth Google en InsForge.',
        )
        setBusy(false)
      }
    })()
  }, [clientId])

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <form
          onSubmit={onSubmit}
          className="surface-card rounded-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.45)] sm:p-8"
          noValidate
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logo} alt="Winston" className="h-14 w-auto" />
            <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-gold">
              Programa USA
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Control de alumnos, pagos y documentación
            </p>
          </div>

          <label className="flex flex-col gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Usuario
            <span className="relative">
              <FontAwesomeIcon
                icon={faUser}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted"
                aria-hidden
              />
              <input
                type="text"
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Usuario"
                className={`${campo} font-normal normal-case`}
                required
              />
            </span>
          </label>

          <label className="mt-4 flex flex-col gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Contraseña
            <span className="relative">
              <FontAwesomeIcon
                icon={faLock}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted"
                aria-hidden
              />
              <input
                type={mostrarPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className={`${campo} pr-11 font-normal normal-case`}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPass((v) => !v)}
                aria-label={
                  mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:text-gold"
              >
                <FontAwesomeIcon
                  icon={mostrarPass ? faEyeSlash : faEye}
                  aria-hidden
                />
              </button>
            </span>
          </label>

          {error ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-baja-text">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5"
                aria-hidden
              />
              <span>{error}</span>
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="btn-accent mt-6 min-h-12 w-full rounded-xl text-base disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Entrando…' : 'Entrar'}
            <FontAwesomeIcon icon={faArrowRight} className="text-sm" aria-hidden />
          </button>

          <p className="my-4 text-center text-sm text-ink-muted">o</p>

          <button
            type="button"
            disabled={busy || !googleReady}
            onClick={onGoogle}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-base font-medium text-black/80 transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {busy ? 'Conectando…' : 'Continuar con Google'}
          </button>
        </form>
      </main>
    </div>
  )
}
