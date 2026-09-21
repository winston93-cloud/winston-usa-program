import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  USA_SESSION_KEY,
  canEditNivel,
  resolveAccessByEmail,
  type UsaSession,
} from '../lib/authAccess'
import { loginGoogleClient, loginManualClient } from '../lib/authLogin'
import { insforge } from '../lib/insforge'
import type { Nivel } from '../types/alumno'

type AuthValue = {
  session: UsaSession | null
  loading: boolean
  loginManual: (login: string, password: string) => Promise<void>
  loginGoogle: (accessToken: string) => Promise<void>
  /** Completa sesión USA tras OAuth InsForge. false = aún no hay usuario Google. */
  completeGoogleInsforgeSession: () => Promise<boolean>
  logout: () => void
  canEdit: (nivel: Nivel | string) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthValue | null>(null)

function loadStored(): UsaSession | null {
  try {
    const raw = localStorage.getItem(USA_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { session?: UsaSession }
    if (!parsed.session) return null
    if (parsed.session.exp < Date.now()) {
      localStorage.removeItem(USA_SESSION_KEY)
      return null
    }
    const access = resolveAccessByEmail(parsed.session.email)
    if (!access) {
      localStorage.removeItem(USA_SESSION_KEY)
      return null
    }
    return {
      ...parsed.session,
      ...access,
      nombre: parsed.session.nombre,
      usuario: parsed.session.usuario,
    }
  } catch {
    return null
  }
}

function persist(session: UsaSession) {
  localStorage.setItem(USA_SESSION_KEY, JSON.stringify({ session }))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UsaSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSession(loadStored())
    setLoading(false)
  }, [])

  const loginManual = useCallback(async (login: string, password: string) => {
    const next = await loginManualClient(login, password)
    persist(next)
    setSession(next)
  }, [])

  const loginGoogle = useCallback(async (accessToken: string) => {
    const next = await loginGoogleClient(accessToken)
    persist(next)
    setSession(next)
  }, [])

  const completeGoogleInsforgeSession = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser()
    if (error || !data?.user?.email) {
      return false
    }
    const access = resolveAccessByEmail(data.user.email)
    if (!access) {
      await insforge.auth.signOut()
      throw new Error(
        'Este correo de Google no tiene acceso. Solo Sistemas y Control Escolar.',
      )
    }
    const next: UsaSession = {
      ...access,
      nombre: data.user.name || access.label,
      usuario: data.user.email.split('@')[0] || data.user.email,
      exp: Date.now() + 12 * 60 * 60 * 1000,
    }
    persist(next)
    setSession(next)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(USA_SESSION_KEY)
    void insforge.auth.signOut()
    setSession(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      loginManual,
      loginGoogle,
      completeGoogleInsforgeSession,
      logout,
      canEdit: (nivel) => canEditNivel(session, nivel),
      isAdmin: session?.role === 'admin',
    }),
    [
      session,
      loading,
      loginManual,
      loginGoogle,
      completeGoogleInsforgeSession,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
