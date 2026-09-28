import type { Nivel } from '../types/alumno'
import { CORREO_CONTROL_ESCOLAR_POR_NIVEL } from './controlEscolarCorreos'

export type UsaRole = 'admin' | 'control_escolar'

export type UsaAccess = {
  email: string
  role: UsaRole
  /** null = puede editar todos los niveles (admin / dirección) */
  nivelEditable: Nivel | null
  label: string
}

/** Sistemas — acceso total (editar + validar). */
export const SISTEMAS_EMAILS = [
  'sistemas.desarrollo@winston93.edu.mx',
  'sistemas@winston93.edu.mx',
  'sistemas2@winston93.edu.mx',
  'sistemas3@winston93.edu.mx',
] as const

/** Dirección académica — acceso total (editar + validar). */
export const DIRECCION_EMAILS = [
  'direccion.academica@winston93.edu.mx',
] as const

/** Alias histórico (Sistemas + DG). Preferir SISTEMAS_EMAILS / DIRECCION. */
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

/** Correo sintético de la cuenta demo (login `winston`). */
export const DEMO_EMAIL = 'prueba@winston93.edu.mx'

/**
 * Allowlist USA Program (Google / InsForge):
 * - Sistemas y Dirección académica → admin (todo)
 * - Control Escolar por nivel → solo su nivel
 * - Validar archivo final → solo CE Primaria (+ admins)
 */
export function resolveAccessByEmail(emailRaw: string): UsaAccess | null {
  const email = normalizeEmail(emailRaw)
  if (!email.endsWith('@winston93.edu.mx')) return null

  if (email === DEMO_EMAIL) {
    return {
      email,
      role: 'admin',
      nivelEditable: null,
      label: 'Prueba',
    }
  }

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

/**
 * Solo Control Escolar Primaria (y admins: Sistemas / Dir. Acad.) pueden
 * marcar Validación final.
 */
export function canValidar(access: UsaAccess | null | undefined): boolean {
  if (!access) return false
  if (access.role === 'admin') return true
  return access.nivelEditable === 'Primaria'
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
