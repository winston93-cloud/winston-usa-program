import type { Nivel } from '../types/alumno'

/**
 * Correos de Control Escolar (InsForge `public.usuario`, cuentas activas).
 * Mapeo por nivel del programa USA (Kinder / Primaria / Secundaria).
 */
export const CORREO_CONTROL_ESCOLAR_POR_NIVEL: Record<Nivel, string> = {
  Kinder: 'controlescolariew@winston93.edu.mx',
  Primaria: 'controlescolar.primaria@winston93.edu.mx',
  Secundaria: 'controlescolar.secundaria@winston93.edu.mx',
}

/** Destino de pruebas (no padres) mientras se valida el flujo. */
export const CORREO_PRUEBA_CARTAS =
  'sistemas.desarrollo@winston93.edu.mx'

export function correoControlEscolarPorNivel(nivel: Nivel | string): string {
  if (nivel === 'Kinder' || nivel === 'Primaria' || nivel === 'Secundaria') {
    return CORREO_CONTROL_ESCOLAR_POR_NIVEL[nivel]
  }
  return CORREO_CONTROL_ESCOLAR_POR_NIVEL.Primaria
}

/** Nivel numérico Winston (branding correo): 2=Kinder/IEW, 3=Primaria, 4=Secundaria. */
export function nivelNumericoParaCorreo(nivel: Nivel | string): number {
  if (nivel === 'Kinder') return 2
  if (nivel === 'Secundaria') return 4
  return 3
}

export type SmtpAuth = { user: string; pass: string }

/** Resuelve SMTP CE por nivel (solo en servidor / API). */
export function smtpEnvKeysPorNivel(nivel: Nivel | string): {
  userEnv: string
  passEnv: string
  defaultUser: string
} {
  const n =
    nivel === 'Kinder' || nivel === 'Primaria' || nivel === 'Secundaria'
      ? nivel
      : 'Primaria'
  if (n === 'Kinder') {
    return {
      userEnv: 'MAIL_CE_KINDER_USER',
      passEnv: 'MAIL_CE_KINDER_PASS',
      defaultUser: CORREO_CONTROL_ESCOLAR_POR_NIVEL.Kinder,
    }
  }
  if (n === 'Secundaria') {
    return {
      userEnv: 'MAIL_CE_SECUNDARIA_USER',
      passEnv: 'MAIL_CE_SECUNDARIA_PASS',
      defaultUser: CORREO_CONTROL_ESCOLAR_POR_NIVEL.Secundaria,
    }
  }
  return {
    userEnv: 'MAIL_CE_PRIMARIA_USER',
    passEnv: 'MAIL_CE_PRIMARIA_PASS',
    defaultUser: CORREO_CONTROL_ESCOLAR_POR_NIVEL.Primaria,
  }
}
