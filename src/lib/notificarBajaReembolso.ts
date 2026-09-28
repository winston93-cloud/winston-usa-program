import type { Alumno } from '../types/alumno'

export type NotificarBajaResult = {
  ok: boolean
  to?: string
  error?: string
}

/** Avisa a sistemas@ que hay una baja pendiente de reembolso. */
export async function notificarBajaReembolso(
  alumno: Alumno,
  opts?: { solicitadoPor?: string },
): Promise<NotificarBajaResult> {
  try {
    const res = await fetch('/api/notificar-baja-reembolso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folio: alumno.folio,
        nombreCompleto: alumno.nombreCompleto,
        nivel: alumno.nivel,
        grado: alumno.grado,
        alumnoRef: alumno.alumnoRef,
        curp: alumno.curp,
        solicitadoPor: opts?.solicitadoPor,
      }),
    })
    const data = (await res.json()) as {
      ok?: boolean
      to?: string
      error?: string
    }
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? `Error HTTP ${res.status}`,
      }
    }
    return { ok: true, to: data.to }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo notificar la baja',
    }
  }
}
