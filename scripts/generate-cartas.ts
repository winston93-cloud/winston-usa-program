/**
 * Genera cartas de bienvenida PDF para todos los alumnos del programa
 * y las guarda en ./cartas-bienvenida/ (prueba local, sin enviar correo).
 *
 * Uso: npm run cartas
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@insforge/sdk'
import {
  buildCartaBienvenidaPdf,
  cartaFileName,
} from '../src/lib/cartaBienvenidaPdf.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'cartas-bienvenida')
const assetsDir = path.join(root, 'src', 'assets', 'carta')

async function readEnv(): Promise<{ url: string; key: string }> {
  const envPath = path.join(root, '.env.local')
  let raw = ''
  try {
    raw = await fs.readFile(envPath, 'utf8')
  } catch {
    raw = ''
  }
  const map: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    map[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  const url = process.env.INSFORGE_URL || map.INSFORGE_URL
  const key = process.env.INSFORGE_ANON_KEY || map.INSFORGE_ANON_KEY
  if (!url || !key) {
    throw new Error('Faltan INSFORGE_URL / INSFORGE_ANON_KEY en .env.local')
  }
  return { url, key }
}

type ListRow = {
  folio: string
  alumno_ref: number | null
  nombre_completo: string
  nivel: string
  grado: string
}

async function main() {
  const { url, key } = await readEnv()
  const client = createClient({ baseUrl: url, anonKey: key })

  const { data, error } = await client.database.rpc('usa_programa_list')
  if (error) throw new Error(error.message ?? 'Error al listar alumnos')

  const rows = (data ?? []) as ListRow[]
  const assets = {
    fontBytes: await fs.readFile(path.join(assetsDir, 'body-font.ttf')),
    headerBytes: await fs.readFile(
      path.join(assetsDir, 'logo-winston-header.png'),
    ),
    footerBytes: await fs.readFile(
      path.join(assetsDir, 'logo-hokku-footer.png'),
    ),
  }

  await fs.mkdir(outDir, { recursive: true })

  let ok = 0
  let skipped = 0
  for (const row of rows) {
    const nombre = (row.nombre_completo || '').trim()
    if (!nombre) {
      skipped += 1
      console.warn(`Omitido ${row.folio}: sin nombre`)
      continue
    }
    const alumno = {
      nombreCompleto: nombre,
      folio: row.folio,
      alumnoRef: row.alumno_ref != null ? String(row.alumno_ref) : '',
      nivel: row.nivel,
      grado: row.grado,
    }
    const bytes = await buildCartaBienvenidaPdf(alumno, assets)
    const fileName = cartaFileName(alumno)
    await fs.writeFile(path.join(outDir, fileName), bytes)
    ok += 1
    console.log(`OK  ${fileName}`)
  }

  console.log(
    `\nListo: ${ok} PDF(s) en ${outDir}${skipped ? ` (${skipped} omitidos)` : ''}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
