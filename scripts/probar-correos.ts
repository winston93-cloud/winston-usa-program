/**
 * Rutina para revisar correos (avisos_no-replay).
 *
 *   npx tsx scripts/probar-correos.ts prueba
 *     → Solo valida SMTP (mensaje corto a sistemas).
 *
 *   npx tsx scripts/probar-correos.ts padre
 *     → Contenido exacto de la carta a padres (HTML producción),
 *       enviado a CARTA_EMAIL_TO_PRUEBA para revisión segura.
 *
 * Requiere MAIL_PASS (p. ej. tras `npx vercel env pull .env.vercel ...`).
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import nodemailer from 'nodemailer'
import {
  htmlCartaFamilia,
  htmlPruebaSmtp,
} from '../api/_lib/cartaBienvenidaHtml.ts'
import { correoCePorNivel } from '../api/_lib/mailSmtp.ts'

function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
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

loadEnvFile(resolve(process.cwd(), '.env.vercel'))
loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

const to =
  process.env.CARTA_EMAIL_TO_PRUEBA?.trim().toLowerCase() ||
  'sistemas.desarrollo@winston93.edu.mx'
const user = (
  process.env.MAIL_USER || 'avisos_no-replay@winston93.edu.mx'
).trim()
const pass = String(process.env.MAIL_PASS ?? '')
  .trim()
  .replace(/\s+/g, '')

type Modo = 'prueba' | 'padre'

function parseModo(argv: string[]): Modo {
  const arg = (argv[2] || '').toLowerCase()
  if (arg === 'padre' || arg === 'familia' || arg === 'produccion') return 'padre'
  return 'prueba'
}

async function main() {
  if (!pass) {
    console.error('Falta MAIL_PASS')
    process.exit(1)
  }

  const modo = parseModo(process.argv)
  console.log(`Modo: ${modo}\nFrom: ${user}\nTo: ${to}\n`)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  if (modo === 'prueba') {
    const info = await transporter.sendMail({
      from: `"Winston USA Program" <${user}>`,
      to,
      subject: '[PRUEBA] Envío SMTP — Winston USA Program',
      html: htmlPruebaSmtp(user),
    })
    console.log('OK prueba SMTP', info.messageId)
    return
  }

  const nivelLabel = 'Primaria'
  const alumnoNombre = 'Alumno Ejemplo Revisión'
  const folio = 'REV-000'
  const replyTo = correoCePorNivel(nivelLabel)
  const info = await transporter.sendMail({
    from: `"Winston USA Program" <${user}>`,
    to,
    replyTo,
    subject: `Carta de bienvenida USA Program — ${alumnoNombre}`,
    html: htmlCartaFamilia({
      nivelLabel,
      alumnoNombre,
      folio,
      modo: 'padre',
    }),
  })
  console.log('OK carta versión padre (revisión)', info.messageId)
  console.log(`Reply-To: ${replyTo}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
