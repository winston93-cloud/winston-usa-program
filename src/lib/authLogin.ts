import { insforge, isInsforgeConfigured } from './insforge'
import {
  resolveAccessByEmail,
  type UsaSession,
} from './authAccess'
import {
  demoSession,
  isDemoLogin,
  verifyDemoCredentials,
} from './authDemo'

type AuthLoginRow = {
  usuario_id: number
  usuario_email: string
  usuario_username: string
  usuario_nombre: string
  usuario_app: string
  usuario_apm: string
}

function asRows(data: unknown): AuthLoginRow[] {
  if (Array.isArray(data)) return data as AuthLoginRow[]
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: AuthLoginRow[] }).data
  }
  return []
}

function sessionFromAuthRow(user: AuthLoginRow, displayName?: string): UsaSession {
  const access = resolveAccessByEmail(user.usuario_email)
  if (!access) {
    throw new Error(
      'Esta cuenta no tiene acceso al programa USA (solo Sistemas y Control Escolar).',
    )
  }
  const nombre =
    displayName ||
    [user.usuario_nombre, user.usuario_app, user.usuario_apm]
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .join(' ')
  return {
    ...access,
    nombre: nombre || user.usuario_username || access.label,
    usuario: user.usuario_username || user.usuario_email.split('@')[0] || '',
    exp: Date.now() + 12 * 60 * 60 * 1000,
  }
}

/** Login manual vía RPC SECURITY DEFINER (sin leer tabla usuario desde anon). */
export async function loginManualClient(
  login: string,
  password: string,
): Promise<UsaSession> {
  const userLogin = login.trim()
  const pass = password
  if (!userLogin || !pass) {
    throw new Error('Usuario/correo y contraseña requeridos')
  }

  if (isDemoLogin(userLogin)) {
    const ok = await verifyDemoCredentials(userLogin, pass)
    if (!ok) throw new Error('Credenciales incorrectas')
    return demoSession()
  }

  if (!isInsforgeConfigured) {
    throw new Error('InsForge no configurado (INSFORGE_URL / INSFORGE_ANON_KEY).')
  }

  const { data, error } = await insforge.database.rpc('usa_programa_auth_login', {
    p_login: userLogin,
    p_password: pass,
  })

  if (error) {
    throw new Error(error.message ?? 'Error al autenticar')
  }

  const rows = asRows(data)
  const user = rows[0]
  if (!user?.usuario_email) {
    throw new Error('Credenciales incorrectas')
  }
  return sessionFromAuthRow(user)
}

/** Login Google con access_token (GIS) + allowlist. */
export async function loginGoogleClient(accessToken: string): Promise<UsaSession> {
  const token = accessToken.trim()
  if (!token) throw new Error('Falta el token de Google')

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) {
    throw new Error('No se pudo validar la sesión de Google')
  }
  const user = (await userRes.json()) as {
    email?: string
    email_verified?: boolean | string
    name?: string
  }
  const verified =
    user.email_verified === true || user.email_verified === 'true'
  const email = String(user.email ?? '')
    .trim()
    .toLowerCase()
  if (!email || !verified) {
    throw new Error('El correo de Google no está verificado')
  }
  if (!email.endsWith('@winston93.edu.mx')) {
    throw new Error('Solo se permiten cuentas @winston93.edu.mx')
  }

  const access = resolveAccessByEmail(email)
  if (!access) {
    throw new Error(
      'Este correo de Google no tiene acceso. Solo Sistemas y Control Escolar.',
    )
  }

  return {
    ...access,
    nombre: user.name || access.label,
    usuario: email.split('@')[0] || email,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  }
}
