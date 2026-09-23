/**
 * Correos de Control Escolar — solo direcciones (Reply-To / notificación futura).
 * Todo el SMTP sale de avisos_no-replay (MAIL_USER / MAIL_PASS).
 */
import type { Nivel } from '../types/alumno'

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
