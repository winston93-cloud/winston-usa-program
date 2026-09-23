import type { Alumno } from '../types/alumno'
import {
  CORREO_PRUEBA_CARTAS,
  correoControlEscolarPorNivel,
  nivelNumericoParaCorreo,
} from './controlEscolarCorreos'
import {
  buildCartaBienvenidaPdf,
  cartaFileName,
} from './cartaBienvenidaPdf'
import { loadCartaAssets } from './generateCartaBienvenida'

export type ModoCorreoCarta = 'prueba' | 'padre'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export type EnvioCartaResult = {
  ok: boolean
  folio: string
  modo?: ModoCorreoCarta
  to?: string
  replyTo?: string
  error?: string
}

type EnvioOpts = {
  /**
   * prueba → sistemas + HTML de revisión.
   * padre → correo tutor + HTML exacto de producción.
   */
  modo?: ModoCorreoCarta
  /** Forzar destino (p. ej. revisión del HTML padre sin mandar al tutor). */
  toOverride?: string
}

/** Genera el PDF y lo envía por la API (avisos_no-replay). */
export async function enviarCartaBienvenidaPorCorreo(
  alumno: Alumno,
  opts: EnvioOpts = {},
): Promise<EnvioCartaResult> {
  const modo = opts.modo ?? 'padre'

  if (!alumno.nombreCompleto?.trim()) {
    return {
      ok: false,
      folio: alumno.folio,
      modo,
      error: 'Sin nombre de alumno',
    }
  }

  const tutor = alumno.correoTutor?.trim().toLowerCase() ?? ''
  if (modo === 'padre' && !opts.toOverride && !tutor) {
    return {
      ok: false,
      folio: alumno.folio,
      modo,
      error: 'Sin correo del tutor',
    }
  }

  const assets = await loadCartaAssets()
  const bytes = await buildCartaBienvenidaPdf(
    {
      nombreCompleto: alumno.nombreCompleto,
      folio: alumno.folio,
      alumnoRef: alumno.alumnoRef,
      nivel: alumno.nivel,
      grado: alumno.grado,
    },
    assets,
  )
  const filename = cartaFileName(alumno)
  const replyTo = correoControlEscolarPorNivel(alumno.nivel)
  const to =
    opts.toOverride?.trim().toLowerCase() ||
    (modo === 'padre' ? tutor : CORREO_PRUEBA_CARTAS)

  const res = await fetch('/api/enviar-carta-bienvenida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      modo,
      nivelLabel: alumno.nivel,
      nivelNumerico: nivelNumericoParaCorreo(alumno.nivel),
      replyTo,
      alumnoNombre: alumno.nombreCompleto,
      folio: alumno.folio,
      filename,
      pdfBase64: bytesToBase64(bytes),
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    to?: string
    replyTo?: string
    modo?: ModoCorreoCarta
  }

  if (!res.ok || !data.ok) {
    return {
      ok: false,
      folio: alumno.folio,
      modo,
      error: data.error || `HTTP ${res.status}`,
    }
  }

  return {
    ok: true,
    folio: alumno.folio,
    modo: data.modo ?? modo,
    to: data.to ?? to,
    replyTo: data.replyTo ?? replyTo,
  }
}

export async function enviarCartasBienvenidaPorPago(
  alumnos: Alumno[],
): Promise<{ ok: number; fail: number; errors: string[] }> {
  let ok = 0
  let fail = 0
  const errors: string[] = []
  for (const alumno of alumnos) {
    // Sync operativo: contenido de producción hacia el tutor.
    const result = await enviarCartaBienvenidaPorCorreo(alumno, {
      modo: 'padre',
    })
    if (result.ok) ok += 1
    else {
      fail += 1
      errors.push(`${result.folio}: ${result.error ?? 'error'}`)
    }
  }
  return { ok, fail, errors }
}
