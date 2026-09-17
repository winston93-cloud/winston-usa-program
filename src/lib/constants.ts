/** Etiqueta UI; el número Winston (22 = 2025–2026) alimenta el sync de pagos. */
export const CICLO_ESCOLAR = '2025–2026'
export const CICLO_NUMERO = 22
/** Conceptos Winston USA / Doble titulación → pago1 / pago2 / pago3 */
export const CONCEPTOS_USA = ['23', '24', '25'] as const
export const CUOTA_ANUAL_USD = 350
export const PAGO_1_USD = 100
export const PAGO_2_USD = 125
export const PAGO_3_USD = 125
export const STORAGE_KEY = 'control-alumnos-v1'
export const COL_WIDTHS_KEY = 'control-alumnos-col-widths-v1'
export const COL_GROUPS_KEY = 'control-alumnos-col-groups-v1'
export const COL_ASSIGN_KEY = 'control-alumnos-col-assign-v1'
export const THEME_KEY = 'control-alumnos-theme-v1'

export type ThemeMode = 'light' | 'dark'

export const CHIP_LABELS = {
  todos: 'Todos',
  inscritos: 'INSCRITOS (1.er pago)',
  activos: 'ACTIVOS',
  liquidados: 'LIQUIDADOS',
  archivo: 'LISTOS PARA ARCHIVO FINAL',
  devoluciones: 'DEVOLUCIONES PENDIENTES',
} as const

export const CHIP_HINTS = {
  todos: 'Todos los registros del nivel seleccionado.',
  inscritos: 'Alumnos con fecha en el primer pago (USD $100).',
  activos: 'Estado Activo: captura de pagos y expediente en curso.',
  liquidados: 'Cuota anual cubierta (USD $350) y aún activos.',
  archivo: 'Liquidados con validación para archivo final.',
  devoluciones: 'Baja o devolución solicitada, sin reembolso cerrado.',
} as const

export function formatUsd(amount: number): string {
  return `USD $${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
