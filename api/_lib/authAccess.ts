import type { Nivel } from './nivel.js'
import { CORREO_CONTROL_ESCOLAR_POR_NIVEL } from './controlEscolarCorreos.js'

export type UsaRole = 'admin' | 'control_escolar'

export type UsaAccess = {
  email: string
  role: UsaRole
  nivelEditable: Nivel | null
  label: string
}

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

export type UsaSession = UsaAccess & {
  nombre: string
  usuario: string
  exp: number
}
