import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import type { UsaSession } from './authAccess.js'
import { resolveAccessByEmail } from './authAccess.js'

export function authSecret(): string {
  return (
    process.env.USA_AUTH_SECRET?.trim() ||
    process.env.MAIL_PASS?.trim() ||
    'usa-program-dev-secret-change-me'
  )
}

export function md5Hex(raw: string): string {
  return createHash('md5').update(raw, 'utf8').digest('hex')
}

export function passwordMatches(
  stored: string | null | undefined,
  plain: string,
): boolean {
  const s = String(stored ?? '')
  if (!s || !plain) return false
  if (s === plain) return true
  const md5 = md5Hex(plain)
  if (s.toLowerCase() === md5.toLowerCase()) return true
  return false
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', authSecret()).update(payloadB64).digest('base64url')
}

export function encodeSession(
  session: Omit<UsaSession, 'exp'> & { exp?: number },
): string {
  const full: UsaSession = {
    ...session,
    exp: session.exp ?? Date.now() + 12 * 60 * 60 * 1000,
  }
  const payloadB64 = Buffer.from(JSON.stringify(full), 'utf8').toString(
    'base64url',
  )
  return `${payloadB64}.${signPayload(payloadB64)}`
}

export function decodeSession(token: string | null | undefined): UsaSession | null {
  if (!token) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  const expected = signPayload(payloadB64)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const session = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as UsaSession
    if (!session?.email || !session?.role || !session?.exp) return null
    if (session.exp < Date.now()) return null
    // Revalidar allowlist por si se revocó acceso
    const access = resolveAccessByEmail(session.email)
    if (!access) return null
    return { ...session, ...access, nombre: session.nombre, usuario: session.usuario }
  } catch {
    return null
  }
}

export async function verifyGoogleAccessToken(
  accessToken: string,
): Promise<{ email: string; name?: string }> {
  const token = accessToken.trim()
  if (!token) throw new Error('Falta el token de Google.')

  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    process.env.USA_GOOGLE_CLIENT_ID?.trim() ||
    ''

  // Si hay Client ID, validar aud; si no (solo OAuth InsForge / GIS opcional), confiar en userinfo.
  if (clientId) {
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
    )
    if (!infoRes.ok) throw new Error('No se pudo verificar la sesión de Google.')
    const info = (await infoRes.json()) as { aud?: string; error?: string }
    if (info.error || String(info.aud ?? '') !== clientId) {
      throw new Error('Token de Google no válido para esta aplicación.')
    }
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!userRes.ok) throw new Error('No se pudo leer el correo de Google.')
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
    throw new Error('El correo de Google no está verificado.')
  }
  if (!email.endsWith('@winston93.edu.mx')) {
    throw new Error('Solo se permiten cuentas @winston93.edu.mx.')
  }
  return { email, name: user.name }
}
