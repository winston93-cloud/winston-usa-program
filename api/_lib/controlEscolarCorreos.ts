import type { Nivel } from './nivel.js'

/**
 * Correos de Control Escolar (InsForge `public.usuario`, cuentas activas).
 */
export const CORREO_CONTROL_ESCOLAR_POR_NIVEL: Record<Nivel, string> = {
  Kinder: 'controlescolariew@winston93.edu.mx',
  Primaria: 'controlescolar.primaria@winston93.edu.mx',
  Secundaria: 'controlescolar.secundaria@winston93.edu.mx',
}

export const CORREO_PRUEBA_CARTAS =
  'sistemas.desarrollo@winston93.edu.mx'

export function correoControlEscolarPorNivel(nivel: Nivel | string): string {
  if (nivel === 'Kinder' || nivel === 'Primaria' || nivel === 'Secundaria') {
    return CORREO_CONTROL_ESCOLAR_POR_NIVEL[nivel]
  }
  return CORREO_CONTROL_ESCOLAR_POR_NIVEL.Primaria
}
