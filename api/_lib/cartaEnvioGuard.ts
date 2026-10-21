import { createClient } from '@insforge/sdk'

function dbClient() {
  const baseUrl = process.env.INSFORGE_URL?.trim()
  const anonKey = process.env.INSFORGE_ANON_KEY?.trim()
  if (!baseUrl || !anonKey) return null
  return createClient({ baseUrl, anonKey })
}

function fechaDeFila(row: unknown): string {
  if (!row || typeof row !== 'object') return ''
  const raw = (row as { fecha_correo_bienvenida?: unknown })
    .fecha_correo_bienvenida
  return String(raw ?? '').trim()
}

/** Fecha ya persistida, o '' si aún no se envió. */
export async function fechaCartaBienvenida(
  alumnoId: string,
): Promise<string | null> {
  const id = alumnoId.trim()
  if (!id) return null
  const db = dbClient()
  if (!db) return null
  const { data, error } = await db.database
    .from('usa_programa_alumno')
    .select('fecha_correo_bienvenida')
    .eq('id', id)
  if (error) return null
  const row = Array.isArray(data) ? data[0] : data
  return fechaDeFila(row) || null
}

export async function marcarCartaBienvenida(
  alumnoId: string,
  fecha: string,
): Promise<void> {
  const id = alumnoId.trim()
  if (!id || !fecha.trim()) return
  const db = dbClient()
  if (!db) return
  await db.database
    .from('usa_programa_alumno')
    .update({ fecha_correo_bienvenida: fecha })
    .eq('id', id)
}
