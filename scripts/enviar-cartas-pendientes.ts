/**
 * Envía cartas de bienvenida pendientes (pago 1 sin fecha_correo_bienvenida)
 * y marca la fecha en InsForge.
 *
 *   npx tsx scripts/enviar-cartas-pendientes.ts
 */
import { existsSync, readFileSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@insforge/sdk'
import nodemailer from 'nodemailer'
import {
  htmlCartaFamilia,
  htmlNotificacionCe,
} from '../api/_lib/cartaBienvenidaHtml.ts'
import { correoCePorNivel, smtpAvisos } from '../api/_lib/mailSmtp.ts'
import {
  buildCartaBienvenidaPdf,
  cartaFileName,
} from '../src/lib/cartaBienvenidaPdf.ts'
import { hoyMexicoCity } from '../src/lib/vencimientosPagos.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const assetsDir = path.join(root, 'src', 'assets', 'carta')

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile(path.join(root, '.env.vercel'))
loadEnvFile(path.join(root, '.env.local'))
loadEnvFile(path.join(root, '.env'))

type ListRow = {
  id: string
  folio: string
  alumno_ref: number | null
  nombre_completo: string
  nivel: string
  grado: string
  correo_tutor: string
  fecha_pago1: string
  fecha_correo_bienvenida: string
}

async function main() {
  const smtp = smtpAvisos()
  if ('error' in smtp) {
    console.error(smtp.error)
    process.exit(1)
  }

  const url = process.env.INSFORGE_URL?.trim()
  const key = process.env.INSFORGE_ANON_KEY?.trim()
  if (!url || !key) {
    console.error('Faltan INSFORGE_URL / INSFORGE_ANON_KEY')
    process.exit(1)
  }

  const client = createClient({ baseUrl: url, anonKey: key })
  const { data, error } = await client.database.rpc('usa_programa_list')
  if (error) throw new Error(error.message ?? 'Error al listar alumnos')

  const pendientes = ((data ?? []) as ListRow[]).filter(
    (row) =>
      Boolean(row.fecha_pago1?.trim()) && !row.fecha_correo_bienvenida?.trim(),
  )

  if (pendientes.length === 0) {
    console.log('No hay cartas pendientes.')
    return
  }

  const assets = {
    fontBytes: await fs.readFile(path.join(assetsDir, 'body-font.ttf')),
    headerBytes: await fs.readFile(
      path.join(assetsDir, 'logo-winston-header.png'),
    ),
    footerBytes: await fs.readFile(
      path.join(assetsDir, 'logo-hokku-footer.png'),
    ),
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const hoy = hoyMexicoCity()
  let ok = 0
  let fail = 0

  for (const row of pendientes) {
    const nombre = (row.nombre_completo || '').trim()
    const tutor = (row.correo_tutor || '').trim().toLowerCase()
    const folio = row.folio || '(sin folio)'
    if (!nombre) {
      fail += 1
      console.error(`FAIL ${folio}: sin nombre`)
      continue
    }
    if (!tutor) {
      fail += 1
      console.error(`FAIL ${folio}: sin correo del tutor`)
      continue
    }

    try {
      const alumno = {
        nombreCompleto: nombre,
        folio: row.folio,
        alumnoRef: row.alumno_ref != null ? String(row.alumno_ref) : '',
        nivel: row.nivel,
        grado: row.grado,
      }
      const bytes = await buildCartaBienvenidaPdf(alumno, assets)
      const filename = cartaFileName(alumno)
      const nivelLabel = row.nivel || 'Primaria'
      const replyTo = correoCePorNivel(nivelLabel)
      const attachment = {
        filename,
        content: Buffer.from(bytes),
        contentType: 'application/pdf' as const,
      }

      await transporter.sendMail({
        from: `"Winston USA Program" <${smtp.user}>`,
        to: tutor,
        replyTo,
        subject: `Carta de bienvenida USA Program — ${nombre}`,
        html: htmlCartaFamilia({
          nivelLabel,
          alumnoNombre: nombre,
          folio: row.folio,
          modo: 'padre',
        }),
        attachments: [attachment],
      })

      await transporter.sendMail({
        from: `"Winston USA Program" <${smtp.user}>`,
        to: replyTo,
        replyTo: smtp.user,
        subject: `Notificación: nuevo alumno USA Program — ${nombre}`,
        html: htmlNotificacionCe({
          nivelLabel,
          alumnoNombre: nombre,
          folio: row.folio,
        }),
        attachments: [attachment],
      })

      const { error: upErr } = await client.database
        .from('usa_programa_alumno')
        .update({ fecha_correo_bienvenida: hoy })
        .eq('id', row.id)
      if (upErr) {
        fail += 1
        console.error(
          `SENT ${folio} pero no se marcó fecha: ${upErr.message ?? 'update'}`,
        )
        continue
      }

      ok += 1
      console.log(`OK ${folio}`)
    } catch (err) {
      fail += 1
      const message = err instanceof Error ? err.message : String(err)
      console.error(`FAIL ${folio}: ${message}`)
    }
  }

  console.log(`\nEnviadas: ${ok}. Fallidas: ${fail}.`)
  if (fail > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
