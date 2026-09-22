/**
 * Envía pruebas SMTP locales (mismas cuentas que Vercel).
 * Uso: npx vercel env pull .env.vercel --environment production -y
 *      npx tsx scripts/probar-correos.ts
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import nodemailer from 'nodemailer'

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

function pass(raw?: string) {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
}

const to =
  process.env.CARTA_EMAIL_TO_PRUEBA?.trim().toLowerCase() ||
  'sistemas.desarrollo@winston93.edu.mx'

const cuentas = [
  {
    label: 'CE Kinder',
    user:
      process.env.MAIL_CE_KINDER_USER || 'controlescolariew@winston93.edu.mx',
    pass: pass(process.env.MAIL_CE_KINDER_PASS),
    carta: true as const,
    nivel: 'Kinder',
  },
  {
    label: 'CE Primaria',
    user:
      process.env.MAIL_CE_PRIMARIA_USER ||
      'controlescolar.primaria@winston93.edu.mx',
    pass: pass(process.env.MAIL_CE_PRIMARIA_PASS),
    carta: true as const,
    nivel: 'Primaria',
  },
  {
    label: 'CE Secundaria',
    user:
      process.env.MAIL_CE_SECUNDARIA_USER ||
      'controlescolar.secundaria@winston93.edu.mx',
    pass: pass(process.env.MAIL_CE_SECUNDARIA_PASS),
    carta: true as const,
    nivel: 'Secundaria',
  },
  {
    label: 'avisos_no-replay',
    user: process.env.MAIL_USER || 'avisos_no-replay@winston93.edu.mx',
    pass: pass(process.env.MAIL_PASS),
    carta: false as const,
    nivel: '',
  },
]

async function main() {
  console.log(`Destino: ${to}\n`)
  for (const c of cuentas) {
    if (!c.pass) {
      console.log(`FAIL  ${c.label}: falta contraseña en env`)
      continue
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: c.user, pass: c.pass },
    })
    try {
      const info = await transporter.sendMail({
        from: `"Winston USA Program" <${c.user}>`,
        to,
        subject: `Prueba envío automático — Winston USA Program (${c.label})`,
        text: `Prueba envío automático Winston USA Program.\nRemitente: ${c.user}\n`,
        html: `<p><strong>Prueba envío automático Winston USA Program</strong></p>
<p>Remitente: <code>${c.user}</code> (${c.label})</p>`,
      })
      console.log(`OK    smtp  ${c.label} → ${to}  ${info.messageId}`)
    } catch (e) {
      console.log(
        `FAIL  smtp  ${c.label}: ${e instanceof Error ? e.message : e}`,
      )
      continue
    }

    if (c.carta) {
      try {
        const info = await transporter.sendMail({
          from: `"Control Escolar ${c.nivel}" <${c.user}>`,
          to,
          replyTo: c.user,
          subject: `Prueba carta bienvenida USA Program — ${c.nivel}`,
          html: `<p><strong>Prueba envío automático Winston USA Program</strong></p>
<p>Carta de bienvenida de prueba — nivel <strong>${c.nivel}</strong>.</p>
<p>Remitente: ${c.user}</p>`,
        })
        console.log(`OK    carta ${c.label} → ${to}  ${info.messageId}`)
      } catch (e) {
        console.log(
          `FAIL  carta ${c.label}: ${e instanceof Error ? e.message : e}`,
        )
      }
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
