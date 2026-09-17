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

export const SN_OPTIONS = ['S', 'N'] as const
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
  folio: string
  matricula: string
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
  fechaAltaReporteInicial: string
  carpetaDrive: SN
  curpDrive: SN
  boletasDrive: SN
  expedienteDocumental: string
  autorizacionControlEscolar: SN
  validacionArchivoFinal: SN
  fechaInclusionArchivoFinal: string
  devolucionSolicitada: SN
  fechaDevolucion: string
  observaciones: string
}

export type AlumnoPatch = Partial<Omit<Alumno, 'id'>>
