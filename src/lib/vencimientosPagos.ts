/** Vencimientos USA Program (calendario de la carta de bienvenida). */
export const ANIO_VENCIMIENTOS_USA = 2025

export type ParcialidadPago = 1 | 2 | 3

export const VENCIMIENTOS_PAGO: Record<
  ParcialidadPago,
  { month: number; day: number; label: string; usd: number; concepto: string }
> = {
  1: {
    month: 10,
    day: 15,
    label: '15 de octubre',
    usd: 100,
    concepto: 'Inscripción / 1.er pago',
  },
  2: {
    month: 11,
    day: 15,
    label: '15 de noviembre',
    usd: 125,
    concepto: 'Segunda parcialidad',
  },
  3: {
    month: 12,
    day: 15,
    label: '15 de diciembre',
    usd: 125,
    concepto: 'Tercera parcialidad',
  },
}

/** Alertas: 10 días antes, 5 días antes y el día del vencimiento. */
export const DIAS_ALERTA_PAGO = [10, 5, 0] as const
export type DiasAlertaPago = (typeof DIAS_ALERTA_PAGO)[number]

export function fechaVencimientoIso(
  parcialidad: ParcialidadPago,
  anio = ANIO_VENCIMIENTOS_USA,
): string {
  const v = VENCIMIENTOS_PAGO[parcialidad]
  const m = String(v.month).padStart(2, '0')
  const d = String(v.day).padStart(2, '0')
  return `${anio}-${m}-${d}`
}

/** YYYY-MM-DD en zona America/Mexico_City. */
export function hoyMexicoCity(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export type AlertaPendiente = {
  parcialidad: 2 | 3
  diasAntes: DiasAlertaPago
  fechaVencimiento: string
  fechaAlerta: string
}

/** Si hoy coincide con alguna alerta de 2.º o 3.er pago. */
export function alertasParaHoy(hoy = hoyMexicoCity()): AlertaPendiente[] {
  const out: AlertaPendiente[] = []
  for (const parcialidad of [2, 3] as const) {
    const venc = fechaVencimientoIso(parcialidad)
    for (const diasAntes of DIAS_ALERTA_PAGO) {
      const fechaAlerta = addDaysIso(venc, -diasAntes)
      if (fechaAlerta === hoy) {
        out.push({ parcialidad, diasAntes, fechaVencimiento: venc, fechaAlerta })
      }
    }
  }
  return out
}
