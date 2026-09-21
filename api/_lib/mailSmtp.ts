/**
 * SMTP helpers para APIs Vercel (sin importar desde src/).
 */
export const CORREO_CE = {
  Kinder: 'controlescolariew@winston93.edu.mx',
  Primaria: 'controlescolar.primaria@winston93.edu.mx',
  Secundaria: 'controlescolar.secundaria@winston93.edu.mx',
} as const

export type SmtpAuth = { user: string; pass: string }

export function smtpAvisos(): SmtpAuth | { error: string } {
  const user = process.env.MAIL_USER ?? 'avisos_no-replay@winston93.edu.mx'
  const pass = process.env.MAIL_PASS
  if (!pass) return { error: 'Falta MAIL_PASS' }
  return { user, pass }
}

export function smtpControlEscolar(
  nivel: string,
): SmtpAuth | { error: string } {
  const n =
    nivel === 'Kinder' || nivel === 'Primaria' || nivel === 'Secundaria'
      ? nivel
      : 'Primaria'
  const userEnv =
    n === 'Kinder'
      ? process.env.MAIL_CE_KINDER_USER
      : n === 'Secundaria'
        ? process.env.MAIL_CE_SECUNDARIA_USER
        : process.env.MAIL_CE_PRIMARIA_USER
  const passEnv =
    n === 'Kinder'
      ? process.env.MAIL_CE_KINDER_PASS
      : n === 'Secundaria'
        ? process.env.MAIL_CE_SECUNDARIA_PASS
        : process.env.MAIL_CE_PRIMARIA_PASS

  const user = (userEnv || CORREO_CE[n]).trim()
  const pass = passEnv?.trim()
  if (!pass) {
    return {
      error: `Falta MAIL_CE_${n.toUpperCase()}_PASS (enviar 1.er pago desde Control Escolar)`,
    }
  }
  return { user, pass }
}

export function correoPrueba(): string {
  return (
    process.env.CARTA_EMAIL_TO_PRUEBA?.trim() ||
    'sistemas.desarrollo@winston93.edu.mx'
  ).toLowerCase()
}

export function correoCePorNivel(nivel: string): string {
  if (nivel === 'Kinder' || nivel === 'Primaria' || nivel === 'Secundaria') {
    return CORREO_CE[nivel]
  }
  return CORREO_CE.Primaria
}
