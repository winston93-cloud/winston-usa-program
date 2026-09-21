/**
 * Envío de prueba de aviso 2.º/3.er pago (avisos_no-replay → CARTA_EMAIL_TO_PRUEBA).
 * No consulta BD ni registra en usa_alerta_pago_envio.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import { correoPrueba, smtpAvisos } from './_lib/mailSmtp'
import {
  fechaVencimientoIso,
  VENCIMIENTOS_PAGO,
  type DiasAlertaPago,
  type ParcialidadPago,
} from '../src/lib/vencimientosPagos'

type Body = {
  alumnoNombre?: string
  folio?: string
  nivel?: string
  /** 2 o 3; default 2 */
  parcialidad?: number
  /** 10, 5 o 0; default 10 */
  diasAntes?: number
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
  parcialidad: 2 | 3
  diasAntes: DiasAlertaPago
}): string {
  const meta = VENCIMIENTOS_PAGO[opts.parcialidad]
  const cuando =
    opts.diasAntes === 0
      ? `hoy (${meta.label})`
      : `en ${opts.diasAntes} días (${meta.label})`
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
        <p style="margin:0;color:#64748b;font-size:0.85rem;">
          <em>Envío de prueba</em> · remitente avisos_no-replay · no registrado en BD.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const smtp = smtpAvisos()
  if ('error' in smtp) {
    return res.status(500).json({ ok: false, error: smtp.error })
  }

  const body = (req.body ?? {}) as Body
  const parcialidad = (body.parcialidad === 3 ? 3 : 2) as Extract<
    ParcialidadPago,
    2 | 3
  >
  const diasAntes = ([10, 5, 0].includes(Number(body.diasAntes))
    ? Number(body.diasAntes)
    : 10) as DiasAlertaPago

  const alumnoNombre = String(body.alumnoNombre ?? 'Alumno Prueba').trim()
  const folio = String(body.folio ?? 'PRUEBA').trim()
  const nivel = String(body.nivel ?? 'Primaria').trim()
  const to = correoPrueba()
  const meta = VENCIMIENTOS_PAGO[parcialidad]

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtp.user, pass: smtp.pass },
    })
    const info = await transporter.sendMail({
      from: `"Winston USA Program" <${smtp.user}>`,
      to,
      subject: `[PRUEBA] Recordatorio ${meta.concepto} — ${alumnoNombre}`,
      html: htmlAlerta({
        alumnoNombre,
        folio,
        nivel,
        parcialidad,
        diasAntes,
      }),
    })
    return res.status(200).json({
      ok: true,
      to,
      from: smtp.user,
      parcialidad,
      diasAntes,
      fechaVencimiento: fechaVencimientoIso(parcialidad),
      messageId: info.messageId,
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Error al enviar aviso',
    })
  }
}
