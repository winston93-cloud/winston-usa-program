import { DEMO_EMAIL, type UsaSession } from './authAccess'

/** Cuenta demo (hardcodeada). El pass no va en claro: se compara un hash SHA-256. */
export const DEMO_LOGIN_USER = 'winston'
/** sha256(`usa-program-demo|winston|…`) — no almacenar la contraseña en claro. */
const DEMO_PASS_DIGEST =
  '3dcc8cee9d0144e0c9e35159f51abf5f7ed253253ea8273712f7a56a75a6d0a2'

export function isDemoLogin(login: string): boolean {
  return login.trim().toLowerCase() === DEMO_LOGIN_USER
}

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** true si login/pass coinciden con la cuenta demo. */
export async function verifyDemoCredentials(
  login: string,
  password: string,
): Promise<boolean> {
  if (!isDemoLogin(login) || !password) return false
  const digest = await sha256Hex(
    `usa-program-demo|${DEMO_LOGIN_USER}|${password}`,
  )
  return timingSafeEqualHex(digest, DEMO_PASS_DIGEST)
}

export function demoSession(): UsaSession {
  return {
    email: DEMO_EMAIL,
    role: 'admin',
    nivelEditable: null,
    label: 'Prueba',
    nombre: 'Usuario prueba',
    usuario: DEMO_LOGIN_USER,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  }
}
