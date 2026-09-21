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
  to?: string
  replyTo?: string
  error?: string
}

/** Genera el PDF y lo envía por la API (prueba → sistemas.desarrollo). */
export async function enviarCartaBienvenidaPorCorreo(
  alumno: Alumno,
): Promise<EnvioCartaResult> {
  if (!alumno.nombreCompleto?.trim()) {
    return {
      ok: false,
      folio: alumno.folio,
      error: 'Sin nombre de alumno',
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

  const res = await fetch('/api/enviar-carta-bienvenida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: CORREO_PRUEBA_CARTAS,
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
  }

  if (!res.ok || !data.ok) {
    return {
      ok: false,
      folio: alumno.folio,
      error: data.error || `HTTP ${res.status}`,
    }
  }

  return {
    ok: true,
    folio: alumno.folio,
    to: data.to ?? CORREO_PRUEBA_CARTAS,
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
    const result = await enviarCartaBienvenidaPorCorreo(alumno)
    if (result.ok) ok += 1
    else {
      fail += 1
      errors.push(`${result.folio}: ${result.error ?? 'error'}`)
    }
  }
  return { ok, fail, errors }
}
