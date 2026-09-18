import fontUrl from '../assets/carta/body-font.ttf?url'
import footerUrl from '../assets/carta/logo-hokku-footer.png'
import headerUrl from '../assets/carta/logo-winston-header.png'
import type { Alumno } from '../types/alumno'
import {
  buildCartaBienvenidaPdf,
  cartaFileName,
  downloadPdfBytes,
  type CartaAlumnoData,
  type CartaAssets,
} from './cartaBienvenidaPdf'

let assetsPromise: Promise<CartaAssets> | null = null

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo cargar recurso de carta: ${url}`)
  return new Uint8Array(await res.arrayBuffer())
}

export async function loadCartaAssets(): Promise<CartaAssets> {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      fetchBytes(fontUrl),
      fetchBytes(headerUrl),
      fetchBytes(footerUrl),
    ]).then(([fontBytes, headerBytes, footerBytes]) => ({
      fontBytes,
      headerBytes,
      footerBytes,
    }))
  }
  return assetsPromise
}

function toCartaData(alumno: Alumno): CartaAlumnoData {
  return {
    nombreCompleto: alumno.nombreCompleto,
    folio: alumno.folio,
    alumnoRef: alumno.alumnoRef,
    nivel: alumno.nivel,
    grado: alumno.grado,
  }
}

/** Genera y descarga la carta PDF de un alumno (prueba local, sin correo). */
export async function generateAndDownloadCarta(alumno: Alumno): Promise<string> {
  const assets = await loadCartaAssets()
  const data = toCartaData(alumno)
  const bytes = await buildCartaBienvenidaPdf(data, assets)
  const name = cartaFileName(data)
  downloadPdfBytes(bytes, name)
  return name
}

/** Genera cartas para varios alumnos (p. ej. nuevos tras sync). */
export async function generateAndDownloadCartas(
  alumnos: Alumno[],
): Promise<string[]> {
  const names: string[] = []
  for (const alumno of alumnos) {
    if (!alumno.nombreCompleto?.trim()) continue
    names.push(await generateAndDownloadCarta(alumno))
  }
  return names
}
