/**
 * Cron diario: alertas de 2.º y 3.er pago (10, 5 y 0 días antes del vencimiento).
 * Remitente: avisos_no-replay. Destino prueba: CARTA_EMAIL_TO_PRUEBA.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@insforge/sdk'
import nodemailer from 'nodemailer'
import { correoPrueba, smtpAvisos } from './_lib/mailSmtp'
import {
  alertasParaHoy,
  hoyMexicoCity,
  VENCIMIENTOS_PAGO,
  type AlertaPendiente,
} from '../src/lib/vencimientosPagos'

type ListRow = {
  id: string
  folio: string
  nombre_completo: string
  nivel: string
  fecha_pago1: string
  fecha_pago2: string
  fecha_pago3: string
  estado: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlAlerta(opts: {
  alumnoNombre: string
  folio: string
  nivel: string
  alerta: AlertaPendiente
}): string {
  const meta = VENCIMIENTOS_PAGO[opts.alerta.parcialidad]
  const cuando =
    opts.alerta.diasAntes === 0
      ? `hoy (${meta.label})`
      : `en ${opts.alerta.diasAntes} días (${meta.label})`
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr>
      <td style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:20px;text-align:center;">
        <p style="margin:0;color:#fff;font-weight:700;">Winston USA Program · Recordatorio de pago</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0 0 14px;color:#334155;line-height:1.65;">Estimada familia:</p>
        <p style="margin:0 0 14px;color:#334155;line-height:1.65;">
          Les recordamos que la <strong>${escapeHtml(meta.concepto)}</strong>
          (USD $${meta.usd}) de
          <strong>${escapeHtml(opts.alumnoNombre)}</strong>
          (${escapeHtml(opts.folio)}, ${escapeHtml(opts.nivel)})
          vence <strong>${escapeHtml(cuando)}</strong>.
        </p>
        <p style="margin:0 0 14px;color:#334155;line-height:1.65;">
          Es importante cubrir la parcialidad a tiempo para continuar el proceso del programa.
        </p>
        <p style="margin:0;color:#64748b;font-size:0.85rem;">
          Envío de prueba a Sistemas Desarrollo · remitente avisos_no-replay.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function authorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true
  const auth = req.headers.authorization || ''
  if (auth === `Bearer ${secret}`) return true
  if (req.headers['x-cron-secret'] === secret) return true
  if (req.headers['x-vercel-cron'] === '1') return true
  return false
}

function alumnoDebeAlertarse(row: ListRow, parcialidad: 2 | 3): boolean {
  if (row.estado === 'Reembolso Realizado') return false
  if (!row.fecha_pago1?.trim()) return false
  if (parcialidad === 2) return !row.fecha_pago2?.trim()
  return !row.fecha_pago3?.trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  if (!authorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const smtp = smtpAvisos()
  if ('error' in smtp) {
    return res.status(500).json({ ok: false, error: smtp.error })
  }

  const baseUrl = process.env.INSFORGE_URL
  const anonKey = process.env.INSFORGE_ANON_KEY
  if (!baseUrl || !anonKey) {
    return res.status(500).json({
      ok: false,
      error: 'Faltan INSFORGE_URL / INSFORGE_ANON_KEY',
    })
  }

  const hoy = hoyMexicoCity()
  const alertas = alertasParaHoy(hoy)
  if (alertas.length === 0) {
    return res.status(200).json({
      ok: true,
      hoy,
      message: 'Sin alertas programadas para hoy',
      sent: 0,
    })
  }

  const db = createClient({ baseUrl, anonKey })
  const { data: listData, error: listErr } = await db.database.rpc(
    'usa_programa_list',
  )
  if (listErr) {
    return res.status(500).json({
      ok: false,
      error: listErr.message ?? 'Error al listar alumnos',
    })
  }
  const alumnos = (listData ?? []) as ListRow[]

  const to = correoPrueba()
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtp.user, pass: smtp.pass },
  })

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const alerta of alertas) {
    const candidatos = alumnos.filter((a) =>
      alumnoDebeAlertarse(a, alerta.parcialidad),
    )
    for (const alumno of candidatos) {
      try {
        const { data: existing } = await db.database
          .from('usa_alerta_pago_envio')
          .select('id')
          .eq('programa_alumno_id', alumno.id)
          .eq('parcialidad', alerta.parcialidad)
          .eq('dias_antes', alerta.diasAntes)
          .eq('fecha_vencimiento', alerta.fechaVencimiento)

        const ya =
          Array.isArray(existing) && existing.length > 0
        if (ya) {
          skipped += 1
          continue
        }

        const meta = VENCIMIENTOS_PAGO[alerta.parcialidad]
        const info = await transporter.sendMail({
          from: `"Winston USA Program" <${smtp.user}>`,
          to,
          subject: `Recordatorio ${meta.concepto} — ${alumno.nombre_completo || alumno.folio}`,
          html: htmlAlerta({
            alumnoNombre: alumno.nombre_completo || 'alumno(a)',
            folio: alumno.folio,
            nivel: alumno.nivel,
            alerta,
          }),
        })

        const { error: insErr } = await db.database
          .from('usa_alerta_pago_envio')
          .insert([
            {
              programa_alumno_id: alumno.id,
              parcialidad: alerta.parcialidad,
              dias_antes: alerta.diasAntes,
              fecha_vencimiento: alerta.fechaVencimiento,
              fecha_alerta: alerta.fechaAlerta,
              enviado_a: to,
              message_id: info.messageId ?? null,
            },
          ])

        if (insErr) {
          if (/unique|duplicate/i.test(insErr.message ?? '')) {
            skipped += 1
            continue
          }
          throw new Error(insErr.message)
        }
        sent += 1
      } catch (err) {
        errors.push(
          `${alumno.folio}: ${err instanceof Error ? err.message : 'error'}`,
        )
      }
    }
  }

  return res.status(200).json({
    ok: errors.length === 0,
    hoy,
    alertas,
    sent,
    skipped,
    errors: errors.slice(0, 10),
  })
}
