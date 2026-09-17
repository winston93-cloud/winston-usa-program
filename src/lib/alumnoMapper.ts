import type { Alumno, AlumnoPatch } from '../types/alumno'

/** Fila en public.usa_programa_alumno */
export type AlumnoRow = {
  id: string
  alumno_id: number | null
  alumno_ref: number | null
  folio: string
  matricula: string
  nivel: string
  estado: string
  nombre_completo: string
  grado: string
  curp: string
  fecha_nacimiento: string
  correo_tutor: string
  tipo_incorporacion: string
  fecha_pago1: string
  fecha_pago2: string
  fecha_pago3: string
  fecha_correo_bienvenida: string
  fecha_alta_reporte_inicial: string
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

export function rowToAlumno(row: AlumnoRow): Alumno {
  return {
    id: row.id,
    folio: row.folio,
    alumnoRef: row.alumno_ref != null ? String(row.alumno_ref) : '',
    matricula: row.matricula,
    nivel: row.nivel as Alumno['nivel'],
    estado: row.estado as Alumno['estado'],
    nombreCompleto: row.nombre_completo,
    grado: row.grado,
    curp: row.curp,
    fechaNacimiento: row.fecha_nacimiento,
    correoTutor: row.correo_tutor,
    tipoIncorporacion: row.tipo_incorporacion as Alumno['tipoIncorporacion'],
    fechaPago1: row.fecha_pago1,
    fechaPago2: row.fecha_pago2,
    fechaPago3: row.fecha_pago3,
    fechaCorreoBienvenida: row.fecha_correo_bienvenida,
    fechaAltaReporteInicial: row.fecha_alta_reporte_inicial,
    carpetaDrive: row.carpeta_drive as Alumno['carpetaDrive'],
    curpDrive: row.curp_drive as Alumno['curpDrive'],
    boletasDrive: row.boletas_drive as Alumno['boletasDrive'],
    expedienteDocumental: row.expediente_documental,
    autorizacionControlEscolar:
      row.autorizacion_control_escolar as Alumno['autorizacionControlEscolar'],
    validacionArchivoFinal:
      row.validacion_archivo_final as Alumno['validacionArchivoFinal'],
    fechaInclusionArchivoFinal: row.fecha_inclusion_archivo_final,
    devolucionSolicitada: row.devolucion_solicitada as Alumno['devolucionSolicitada'],
    fechaDevolucion: row.fecha_devolucion,
    observaciones: row.observaciones,
  }
}

export function alumnoToRow(alumno: Alumno): AlumnoRow {
  const refNum = Number.parseInt(alumno.alumnoRef.trim(), 10)
  return {
    id: alumno.id,
    alumno_id: null,
    alumno_ref: Number.isFinite(refNum) ? refNum : null,
    folio: alumno.folio,
    matricula: alumno.matricula,
    nivel: alumno.nivel,
    estado: alumno.estado,
    nombre_completo: alumno.nombreCompleto,
    grado: alumno.grado,
    curp: alumno.curp,
    fecha_nacimiento: alumno.fechaNacimiento,
    correo_tutor: alumno.correoTutor,
    tipo_incorporacion: alumno.tipoIncorporacion,
    fecha_pago1: alumno.fechaPago1,
    fecha_pago2: alumno.fechaPago2,
    fecha_pago3: alumno.fechaPago3,
    fecha_correo_bienvenida: alumno.fechaCorreoBienvenida,
    fecha_alta_reporte_inicial: alumno.fechaAltaReporteInicial,
    carpeta_drive: alumno.carpetaDrive,
    curp_drive: alumno.curpDrive,
    boletas_drive: alumno.boletasDrive,
    expediente_documental: alumno.expedienteDocumental,
    autorizacion_control_escolar: alumno.autorizacionControlEscolar,
    validacion_archivo_final: alumno.validacionArchivoFinal,
    fecha_inclusion_archivo_final: alumno.fechaInclusionArchivoFinal,
    devolucion_solicitada: alumno.devolucionSolicitada,
    fecha_devolucion: alumno.fechaDevolucion,
    observaciones: alumno.observaciones,
  }
}

const PATCH_MAP: Partial<Record<keyof AlumnoPatch, keyof AlumnoRow>> = {
  folio: 'folio',
  alumnoRef: 'alumno_ref',
  matricula: 'matricula',
  nivel: 'nivel',
  estado: 'estado',
  nombreCompleto: 'nombre_completo',
  grado: 'grado',
  curp: 'curp',
  fechaNacimiento: 'fecha_nacimiento',
  correoTutor: 'correo_tutor',
  tipoIncorporacion: 'tipo_incorporacion',
  fechaPago1: 'fecha_pago1',
  fechaPago2: 'fecha_pago2',
  fechaPago3: 'fecha_pago3',
  fechaCorreoBienvenida: 'fecha_correo_bienvenida',
  fechaAltaReporteInicial: 'fecha_alta_reporte_inicial',
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

export function patchToRow(patch: AlumnoPatch): Partial<AlumnoRow> {
  const row: Partial<AlumnoRow> = {}
  for (const [key, value] of Object.entries(patch) as [
    keyof AlumnoPatch,
    string,
  ][]) {
    const col = PATCH_MAP[key]
    if (col === undefined || value === undefined) continue
    if (col === 'alumno_ref') {
      const n = Number.parseInt(String(value).trim(), 10)
      row.alumno_ref = Number.isFinite(n) ? n : null
    } else {
      ;(row as Record<string, string>)[col] = value
    }
  }
  return row
}

export function lookupToPatch(hit: AlumnoLookup): {
  alumnoId: number
  alumnoRef: string
  patch: AlumnoPatch
} {
  return {
    alumnoId: hit.alumno_id,
    alumnoRef: String(hit.alumno_ref),
    patch: {
      alumnoRef: String(hit.alumno_ref),
      matricula: hit.matricula,
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
