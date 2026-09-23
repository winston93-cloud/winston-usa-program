/**
 * SMTP: un solo remitente — avisos_no-replay.
 * Direcciones de Control Escolar solo para notificaciones (no SMTP).
 */
export const CORREO_CE = {
  Kinder: 'controlescolariew@winston93.edu.mx',
  Primaria: 'controlescolar.primaria@winston93.edu.mx',
  Secundaria: 'controlescolar.secundaria@winston93.edu.mx',
} as const

export type SmtpAuth = { user: string; pass: string }

/**
 * Contraseñas de aplicación de Google se muestran como "xxxx xxxx xxxx xxxx".
 * Gmail SMTP requiere los 16 caracteres sin espacios.
 */
export function normalizeMailPass(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
}

export function smtpAvisos(): SmtpAuth | { error: string } {
  const user = (
    process.env.MAIL_USER ?? 'avisos_no-replay@winston93.edu.mx'
  ).trim()
  const pass = normalizeMailPass(process.env.MAIL_PASS)
  if (!pass) {
    return {
      error:
        'Falta MAIL_PASS en Vercel. Contraseña de aplicación de avisos_no-replay (16 caracteres, sin espacios).',
    }
  }
  return { user, pass }
}

/** Destino de prueba mientras no se envíe a padres. */
export function correoPrueba(): string {
  return (
    process.env.CARTA_EMAIL_TO_PRUEBA?.trim() ||
    'sistemas.desarrollo@winston93.edu.mx'
  ).toLowerCase()
}

/** Correo de Control Escolar del nivel (notificación / Reply-To). */
export function correoCePorNivel(nivel: string): string {
  if (nivel === 'Kinder' || nivel === 'Primaria' || nivel === 'Secundaria') {
    return CORREO_CE[nivel]
  }
  return CORREO_CE.Primaria
}

export function mailSendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Error al enviar')
  if (/Invalid login|Username and Password not accepted|535|EAUTH/i.test(raw)) {
    return (
      'Gmail rechazó MAIL_PASS. Usa contraseña de aplicación de avisos_no-replay (16 caracteres, sin espacios).'
    )
  }
  return raw
}
