import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SEED_ALUMNOS } from '../data/seed'
import { STORAGE_KEY } from '../lib/constants'
import type { Alumno, AlumnoPatch } from '../types/alumno'

function loadAlumnos(): Alumno[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_ALUMNOS
    const parsed = JSON.parse(raw) as Alumno[]
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_ALUMNOS
    return parsed
  } catch {
    return SEED_ALUMNOS
  }
}

function nextFolio(alumnos: Alumno[]): string {
  const nums = alumnos.map((a) => {
    const match = a.folio.match(/(\d+)$/)
    return match ? Number(match[1]) : 0
  })
  const next = Math.max(0, ...nums) + 1
  return `A-${String(next).padStart(3, '0')}`
}

function blankAlumno(folio: string): Alumno {
  return {
    id: crypto.randomUUID(),
    folio,
    matricula: '',
    nivel: 'Primaria',
    estado: 'Activo',
    nombreCompleto: '',
    grado: '',
    curp: '',
    fechaNacimiento: '',
    correoTutor: '',
    tipoIncorporacion: 'Nuevo Ingreso',
    fechaPago1: '',
    fechaPago2: '',
    fechaPago3: '',
    fechaCorreoBienvenida: '',
    fechaAltaReporteInicial: '',
    carpetaDrive: 'N',
    curpDrive: 'N',
    boletasDrive: 'N',
    expedienteDocumental: '',
    autorizacionControlEscolar: 'N',
    validacionArchivoFinal: 'N',
    fechaInclusionArchivoFinal: '',
    devolucionSolicitada: 'N',
    fechaDevolucion: '',
    observaciones: '',
  }
}

type StoreValue = {
  alumnos: Alumno[]
  updateAlumno: (id: string, patch: AlumnoPatch) => void
  addAlumno: () => void
  resetSeed: () => void
}

const AlumnosContext = createContext<StoreValue | null>(null)

export function AlumnosProvider({ children }: { children: ReactNode }) {
  const [alumnos, setAlumnos] = useState<Alumno[]>(loadAlumnos)

  const persist = useCallback((next: Alumno[]) => {
    setAlumnos(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const updateAlumno = useCallback(
    (id: string, patch: AlumnoPatch) => {
      persist(alumnos.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    },
    [alumnos, persist],
  )

  const addAlumno = useCallback(() => {
    persist([...alumnos, blankAlumno(nextFolio(alumnos))])
  }, [alumnos, persist])

  const resetSeed = useCallback(() => {
    persist(SEED_ALUMNOS)
  }, [persist])

  const value = useMemo(
    () => ({ alumnos, updateAlumno, addAlumno, resetSeed }),
    [alumnos, updateAlumno, addAlumno, resetSeed],
  )

  return (
    <AlumnosContext.Provider value={value}>{children}</AlumnosContext.Provider>
  )
}

export function useAlumnos() {
  const ctx = useContext(AlumnosContext)
  if (!ctx) throw new Error('useAlumnos debe usarse dentro de AlumnosProvider')
  return ctx
}
