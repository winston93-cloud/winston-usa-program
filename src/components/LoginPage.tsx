import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons'
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
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.5 7.3l.1.1 6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { loginManual, loginGoogle, completeGoogleInsforgeSession } = useAuth()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const finishingOAuth = useRef(false)
  const tokenClient = useRef<{
    requestAccessToken: (o?: { prompt?: string }) => void
  } | null>(null)

  const clientId = (
    import.meta.env.USA_GOOGLE_CLIENT_ID as string | undefined
  )?.trim()

  // Tras redirect InsForge OAuth (?insforge_code=…) o sesión Google ya activa
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
    // InsForge ya tiene Google OAuth habilitado → botón listo sin GIS
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
        // Si GIS falla, igual usamos OAuth InsForge
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
        // Preferir GIS si hay Client ID local; si no, OAuth InsForge (Google ya activo)
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
        // El SDK redirige al navegador; si no, quedamos en busy hasta el return
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
    <div className="flex min-h-dvh items-center justify-center bg-brand-soft px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-cell p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-white/70 uppercase">
            Winston–Hökku Academy
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-white">
            Programa USA
          </h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Correo o usuario
            <input
              type="text"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border bg-cell px-3 py-2.5 text-ink outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-muted"
              required
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border bg-cell px-3 py-2.5 text-ink outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-muted"
              required
            />
          </label>
          {error ? (
            <p className="rounded-lg bg-estado-baja-input/40 px-3 py-2 text-sm text-estado-baja-text">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sec-white-head px-4 py-2.5 text-sm font-semibold text-on-brand hover:opacity-95 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faRightToBracket} />
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
          <span className="h-px flex-1 bg-brand-border" />
          o
          <span className="h-px flex-1 bg-brand-border" />
        </div>

        <button
          type="button"
          disabled={busy || !googleReady}
          onClick={onGoogle}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm text-black/80 
          font-semibold hover:bg-brand-soft hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleMark />
          {busy ? 'Conectando…' : 'Continuar con Google'}
        </button>
      </div>
    </div>
  )
}
