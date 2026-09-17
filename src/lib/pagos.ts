import { CUOTA_ANUAL_USD, PAGO_1_USD, PAGO_2_USD, PAGO_3_USD } from './constants'
import type { Alumno, ChipFiltro, EstatusPago, Nivel } from '../types/alumno'

export function totalPagado(alumno: Alumno): number {
  let total = 0
  if (alumno.fechaPago1) total += PAGO_1_USD
  if (alumno.fechaPago2) total += PAGO_2_USD
  if (alumno.fechaPago3) total += PAGO_3_USD
  return total
}

export function saldo(alumno: Alumno): number {
  return CUOTA_ANUAL_USD - totalPagado(alumno)
}

export function estatusPago(alumno: Alumno): EstatusPago {
  const pagos = [alumno.fechaPago1, alumno.fechaPago2, alumno.fechaPago3].filter(
    Boolean,
  ).length
  if (pagos === 0) return 'Sin pago'
  if (pagos === 3) return 'Liquidado'
  if (pagos === 1 && alumno.fechaPago1) return 'Inscrito (1.er pago)'
  return 'Parcial'
}

export function esLiquidado(alumno: Alumno): boolean {
  return totalPagado(alumno) === CUOTA_ANUAL_USD
}

export function esBaja(alumno: Alumno): boolean {
  return alumno.estado === 'Baja - gestionar devolución'
}

export function matchesChip(alumno: Alumno, chip: ChipFiltro): boolean {
  switch (chip) {
    case 'todos':
      return true
    case 'inscritos':
      return Boolean(alumno.fechaPago1)
    case 'activos':
      return alumno.estado === 'Activo'
    case 'liquidados':
      return esLiquidado(alumno) && alumno.estado === 'Activo'
    case 'archivo':
      return alumno.validacionArchivoFinal === 'S' && esLiquidado(alumno)
    case 'devoluciones':
      return (
        alumno.estado !== 'Reembolso Realizado' &&
        (esBaja(alumno) || alumno.devolucionSolicitada === 'S')
      )
  }
}

export function filterAlumnos(
  alumnos: Alumno[],
  nivel: Nivel | 'Todos',
  chip: ChipFiltro,
): Alumno[] {
  return alumnos.filter((alumno) => {
    if (nivel !== 'Todos' && alumno.nivel !== nivel) return false
    return matchesChip(alumno, chip)
  })
}

export function chipCounts(alumnos: Alumno[], nivel: Nivel | 'Todos') {
  const scoped =
    nivel === 'Todos' ? alumnos : alumnos.filter((a) => a.nivel === nivel)
  return {
    todos: scoped.length,
    inscritos: scoped.filter((a) => matchesChip(a, 'inscritos')).length,
    activos: scoped.filter((a) => matchesChip(a, 'activos')).length,
    liquidados: scoped.filter((a) => matchesChip(a, 'liquidados')).length,
    archivo: scoped.filter((a) => matchesChip(a, 'archivo')).length,
    devoluciones: scoped.filter((a) => matchesChip(a, 'devoluciones')).length,
  }
}

export function kpis(alumnos: Alumno[], nivel: Nivel | 'Todos') {
  const scoped =
    nivel === 'Todos' ? alumnos : alumnos.filter((a) => a.nivel === nivel)
  const saldoPendiente = scoped
    .filter((a) => a.estado === 'Activo')
    .reduce((acc, a) => acc + saldo(a), 0)
  const recaudado = scoped.reduce((acc, a) => acc + totalPagado(a), 0)
  return {
    total: scoped.length,
    inscritos: scoped.filter((a) => matchesChip(a, 'inscritos')).length,
    activos: scoped.filter((a) => matchesChip(a, 'activos')).length,
    liquidados: scoped.filter((a) => matchesChip(a, 'liquidados')).length,
    archivo: scoped.filter((a) => matchesChip(a, 'archivo')).length,
    devoluciones: scoped.filter((a) => matchesChip(a, 'devoluciones')).length,
    saldoPendiente,
    recaudado,
  }
}
