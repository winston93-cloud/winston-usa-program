import type { Nivel } from '../types/alumno'
import { CORREO_CONTROL_ESCOLAR_POR_NIVEL } from './controlEscolarCorreos'

export type UsaRole = 'admin' | 'control_escolar'

export type UsaAccess = {
  email: string
  role: UsaRole
  /** null = puede editar todos los niveles (admin) */
  nivelEditable: Nivel | null
  label: string
}

/** Cuentas de Sistemas / administración (editan todo). */
export const ADMIN_EMAILS = [
  'sistemas.desarrollo@winston93.edu.mx',
  'sistemas@winston93.edu.mx',
  'sistemas2@winston93.edu.mx',
  'sistemas3@winston93.edu.mx',
  'dg@winston93.edu.mx',
] as const

const CE_BY_EMAIL: Record<string, Nivel> = Object.fromEntries(
  (Object.entries(CORREO_CONTROL_ESCOLAR_POR_NIVEL) as [Nivel, string][]).map(
    ([nivel, email]) => [email.toLowerCase(), nivel],
  ),
)

const CE_LABEL: Record<Nivel, string> = {
  Kinder: 'CE Kinder',
  Primaria: 'CE Prim.',
  Secundaria: 'CE Sec.',
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function resolveAccessByEmail(emailRaw: string): UsaAccess | null {
  const email = normalizeEmail(emailRaw)
  if (!email.endsWith('@winston93.edu.mx')) return null

  if (ADMIN_EMAILS.includes(email as (typeof ADMIN_EMAILS)[number])) {
    return {
      email,
      role: 'admin',
      nivelEditable: null,
      label: 'Admin',
    }
  }

  const nivel = CE_BY_EMAIL[email]
  if (nivel) {
    return {
      email,
      role: 'control_escolar',
      nivelEditable: nivel,
      label: CE_LABEL[nivel],
    }
  }

  return null
}

export function canEditNivel(
  access: UsaAccess | null | undefined,
  nivel: Nivel | string,
): boolean {
  if (!access) return false
  if (access.role === 'admin') return true
  return access.nivelEditable === nivel
}

/** Nombre corto para el chip del header (1ª palabra). */
export function shortSessionName(session: {
  nombre?: string
  usuario?: string
}): string {
  const raw = String(session.nombre ?? '').trim()
  if (!raw) return String(session.usuario ?? '').trim() || '—'
  const first = raw.split(/\s+/)[0] ?? raw
  return first.length > 14 ? `${first.slice(0, 12)}…` : first
}

export type UsaSession = UsaAccess & {
  nombre: string
  usuario: string
  exp: number
}

export const USA_SESSION_KEY = 'usa-program-auth-v1'
