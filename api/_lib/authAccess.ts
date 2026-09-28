import type { Nivel } from './nivel.js'
import { CORREO_CONTROL_ESCOLAR_POR_NIVEL } from './controlEscolarCorreos.js'

export type UsaRole = 'admin' | 'control_escolar'

export type UsaAccess = {
  email: string
  role: UsaRole
  nivelEditable: Nivel | null
  label: string
}

export const SISTEMAS_EMAILS = [
  'sistemas.desarrollo@winston93.edu.mx',
  'sistemas@winston93.edu.mx',
  'sistemas2@winston93.edu.mx',
  'sistemas3@winston93.edu.mx',
] as const

export const DIRECCION_EMAILS = [
  'direccion.academica@winston93.edu.mx',
] as const

export const ADMIN_EMAILS = [
  ...SISTEMAS_EMAILS,
  ...DIRECCION_EMAILS,
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

  if (DIRECCION_EMAILS.includes(email as (typeof DIRECCION_EMAILS)[number])) {
    return {
      email,
      role: 'admin',
      nivelEditable: null,
      label: 'Dir. Acad.',
    }
  }

  if (SISTEMAS_EMAILS.includes(email as (typeof SISTEMAS_EMAILS)[number])) {
    return {
      email,
      role: 'admin',
      nivelEditable: null,
      label: 'Sistemas',
    }
  }

  if (email === 'dg@winston93.edu.mx') {
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

export function canValidar(access: UsaAccess | null | undefined): boolean {
  if (!access) return false
  if (access.role === 'admin') return true
  return access.nivelEditable === 'Primaria'
}

export type UsaSession = UsaAccess & {
  nombre: string
  usuario: string
  exp: number
}
