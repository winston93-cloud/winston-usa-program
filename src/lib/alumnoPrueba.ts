import type { Alumno, Nivel } from '../types/alumno'
import { hoyMexicoCity } from './vencimientosPagos'

export const PRUEBA_ID_PREFIX = 'prueba-'

export function isAlumnoPrueba(id: string): boolean {
  return id.startsWith(PRUEBA_ID_PREFIX)
}

/** Alumno solo en memoria (no se inserta en InsForge). */
export function crearAlumnoPrueba(nivel: Nivel): Alumno {
  const hoy = hoyMexicoCity()
  const stamp = Date.now().toString(36).slice(-5).toUpperCase()
  return {
    id: `${PRUEBA_ID_PREFIX}${crypto.randomUUID()}`,
    alumnoId: null,
    folio: `PRUEBA-${stamp}`,
    alumnoRef: '',
    nivel,
    estado: 'Activo',
    nombreCompleto: `Alumno Prueba ${nivel}`,
    grado: nivel === 'Kinder' ? '3' : '1',
    curp: '',
    fechaNacimiento: '',
    correoTutor: 'sistemas.desarrollo@winston93.edu.mx',
    tipoIncorporacion: 'Nuevo Ingreso',
    fechaPago1: hoy,
    fechaPago2: '',
    fechaPago3: '',
    fechaCorreoBienvenida: '',
    carpetaDrive: 'No',
    curpDrive: 'No',
    boletasDrive: 'No',
    expedienteDocumental: '',
    autorizacionControlEscolar: 'No',
    validacionArchivoFinal: 'No',
    fechaInclusionArchivoFinal: '',
    devolucionSolicitada: 'No',
    fechaDevolucion: '',
    observaciones: 'Fila de prueba (no registrada en BD)',
  }
}
