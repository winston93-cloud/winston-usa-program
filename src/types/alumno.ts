export const NIVELES = ['Kinder', 'Primaria', 'Secundaria'] as const
export type Nivel = (typeof NIVELES)[number]

export const ESTADOS = [
  'Activo',
  'Baja - gestionar devolución',
  'Reembolso Realizado',
] as const
export type EstadoAlumno = (typeof ESTADOS)[number]

export const TIPOS_INCORPORACION = ['Nuevo Ingreso', 'Continuidad'] as const
export type TipoIncorporacion = (typeof TIPOS_INCORPORACION)[number]

export const SN_OPTIONS = ['Si', 'No'] as const
export type SN = (typeof SN_OPTIONS)[number]

export type EstatusPago =
  | 'Sin pago'
  | 'Inscrito (1.er pago)'
  | 'Parcial'
  | 'Liquidado'

export type ChipFiltro =
  | 'todos'
  | 'inscritos'
  | 'activos'
  | 'liquidados'
  | 'archivo'
  | 'devoluciones'

export type Alumno = {
  id: string
  /** FK public.alumno.alumno_id — identidad se lee siempre desde ahí */
  alumnoId: number | null
  folio: string
  /** alumno_ref Winston (atajo; fuente de verdad en public.alumno) */
  alumnoRef: string
  /** Desde public.alumno (en vivo vía usa_programa_list) */
  nivel: Nivel
  estado: EstadoAlumno
  nombreCompleto: string
  grado: string
  curp: string
  fechaNacimiento: string
  correoTutor: string
  tipoIncorporacion: TipoIncorporacion
  fechaPago1: string
  fechaPago2: string
  fechaPago3: string
  fechaCorreoBienvenida: string
  carpetaDrive: SN
  curpDrive: SN
  boletasDrive: SN
  /** Derivado: Completo si Carpeta+CURP+Boletas Drive = Si */
  expedienteDocumental: string
  autorizacionControlEscolar: SN
  validacionArchivoFinal: SN
  fechaInclusionArchivoFinal: string
  devolucionSolicitada: SN
  fechaDevolucion: string
  observaciones: string
}

/** Parches de UI; identidad solo se refleja en memoria tras lookup/list. */
export type AlumnoPatch = Partial<Omit<Alumno, 'id' | 'alumnoId'>>
