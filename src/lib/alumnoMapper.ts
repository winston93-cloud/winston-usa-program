import type { Alumno, AlumnoPatch, SN } from '../types/alumno'
import { etiquetaExpediente } from './pagos'

/** Fila de programa + identidad en vivo (RPC usa_programa_list). */
export type AlumnoRow = {
  id: string
  alumno_id: number | null
  alumno_ref: number | null
  folio: string
  estado: string
  nombre_completo: string
  nivel: string
  grado: string
  curp: string
  fecha_nacimiento: string
  correo_tutor: string
  tipo_incorporacion: string
  fecha_pago1: string
  fecha_pago2: string
  fecha_pago3: string
  fecha_correo_bienvenida: string
  fecha_alta_reporte_inicial?: string
  carpeta_drive: string
  curp_drive: string
  boletas_drive: string
  expediente_documental: string
  autorizacion_control_escolar: string
  validacion_archivo_final: string
  fecha_inclusion_archivo_final: string
  devolucion_solicitada: string
  fecha_devolucion: string
  observaciones: string
}

/** Resultado de usa_lookup_alumno_por_ref */
export type AlumnoLookup = {
  alumno_id: number
  alumno_ref: number
  matricula: string
  nombre_completo: string
  nivel: string
  grado: string
  curp: string
  fecha_nacimiento: string
  correo_tutor: string
  tipo_incorporacion: string
}

/** Campos que SÍ se guardan en usa_programa_alumno (no identidad). */
export type ProgramaPatchRow = {
  folio?: string
  alumno_ref?: number | null
  alumno_id?: number | null
  estado?: string
  fecha_pago1?: string
  fecha_pago2?: string
  fecha_pago3?: string
  fecha_correo_bienvenida?: string
  carpeta_drive?: string
  curp_drive?: string
  boletas_drive?: string
  expediente_documental?: string
  autorizacion_control_escolar?: string
  validacion_archivo_final?: string
  fecha_inclusion_archivo_final?: string
  devolucion_solicitada?: string
  fecha_devolucion?: string
  observaciones?: string
}

/** Lee S/N o Si/No históricos → Si/No de UI. */
export function toUiSn(raw: string | null | undefined): SN {
  const v = (raw ?? '').trim()
  if (v === 'S' || v === 'Si' || v === 'Sí' || v === 'SI') return 'Si'
  return 'No'
}

/** Persiste Si/No de UI como S/N en BD (compatibilidad). */
export function toDbSn(value: SN | string): string {
  return value === 'Si' || value === 'S' || value === 'Sí' ? 'S' : 'N'
}

export function rowToAlumno(row: AlumnoRow): Alumno {
  const carpetaDrive = toUiSn(row.carpeta_drive)
  const curpDrive = toUiSn(row.curp_drive)
  const boletasDrive = toUiSn(row.boletas_drive)
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    folio: row.folio,
    alumnoRef: row.alumno_ref != null ? String(row.alumno_ref) : '',
    nivel: (row.nivel || 'Primaria') as Alumno['nivel'],
    estado: row.estado as Alumno['estado'],
    nombreCompleto: row.nombre_completo ?? '',
    grado: row.grado ?? '',
    curp: row.curp ?? '',
    fechaNacimiento: row.fecha_nacimiento ?? '',
    correoTutor: row.correo_tutor ?? '',
    tipoIncorporacion: (row.tipo_incorporacion ||
      'Nuevo Ingreso') as Alumno['tipoIncorporacion'],
    fechaPago1: row.fecha_pago1,
    fechaPago2: row.fecha_pago2,
    fechaPago3: row.fecha_pago3,
    fechaCorreoBienvenida: row.fecha_correo_bienvenida,
    carpetaDrive,
    curpDrive,
    boletasDrive,
    expedienteDocumental: etiquetaExpediente({
      carpetaDrive,
      curpDrive,
      boletasDrive,
    }),
    autorizacionControlEscolar: toUiSn(row.autorizacion_control_escolar),
    validacionArchivoFinal: toUiSn(row.validacion_archivo_final),
    fechaInclusionArchivoFinal: row.fecha_inclusion_archivo_final,
    devolucionSolicitada: toUiSn(row.devolucion_solicitada),
    fechaDevolucion: row.fecha_devolucion,
    observaciones: row.observaciones,
  }
}

const SN_KEYS = new Set<keyof AlumnoPatch>([
  'carpetaDrive',
  'curpDrive',
  'boletasDrive',
  'autorizacionControlEscolar',
  'validacionArchivoFinal',
  'devolucionSolicitada',
])

const PATCH_MAP: Partial<Record<keyof AlumnoPatch, keyof ProgramaPatchRow>> = {
  folio: 'folio',
  alumnoRef: 'alumno_ref',
  estado: 'estado',
  fechaPago1: 'fecha_pago1',
  fechaPago2: 'fecha_pago2',
  fechaPago3: 'fecha_pago3',
  fechaCorreoBienvenida: 'fecha_correo_bienvenida',
  carpetaDrive: 'carpeta_drive',
  curpDrive: 'curp_drive',
  boletasDrive: 'boletas_drive',
  expedienteDocumental: 'expediente_documental',
  autorizacionControlEscolar: 'autorizacion_control_escolar',
  validacionArchivoFinal: 'validacion_archivo_final',
  fechaInclusionArchivoFinal: 'fecha_inclusion_archivo_final',
  devolucionSolicitada: 'devolucion_solicitada',
  fechaDevolucion: 'fecha_devolucion',
  observaciones: 'observaciones',
}

export function patchToRow(patch: AlumnoPatch): ProgramaPatchRow {
  const row: ProgramaPatchRow = {}
  for (const [key, value] of Object.entries(patch) as [
    keyof AlumnoPatch,
    string | number | null | undefined,
  ][]) {
    const col = PATCH_MAP[key]
    if (col === undefined || value === undefined) continue
    if (col === 'alumno_ref') {
      const n = Number.parseInt(String(value).trim(), 10)
      row.alumno_ref = Number.isFinite(n) ? n : null
    } else if (SN_KEYS.has(key)) {
      ;(row as Record<string, string>)[col] = toDbSn(String(value))
    } else {
      ;(row as Record<string, string>)[col] = String(value)
    }
  }
  return row
}

export function lookupToLink(hit: AlumnoLookup): {
  alumnoId: number
  alumnoRef: number
  patch: AlumnoPatch
} {
  return {
    alumnoId: hit.alumno_id,
    alumnoRef: hit.alumno_ref,
    patch: {
      alumnoRef: String(hit.alumno_ref),
      nombreCompleto: hit.nombre_completo,
      nivel: hit.nivel as Alumno['nivel'],
      grado: hit.grado,
      curp: hit.curp,
      fechaNacimiento: hit.fecha_nacimiento,
      correoTutor: hit.correo_tutor,
      tipoIncorporacion: hit.tipo_incorporacion as Alumno['tipoIncorporacion'],
    },
  }
}
