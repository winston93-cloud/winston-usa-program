/**
 * Notifica a sistemas@ cuando un alumno pasa a Baja (gestionar reembolso).
 * Remitente: avisos_no-replay.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import { mailSendErrorMessage, smtpAvisos } from './_lib/mailSmtp.js'

const TO_SISTEMAS = 'sistemas@winston93.edu.mx'

type Body = {
  folio?: string
  nombreCompleto?: string
  nivel?: string
  grado?: string
  alumnoRef?: string
  curp?: string
  totalPagadoHint?: string
  solicitadoPor?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlBaja(opts: Required<
  Pick<Body, 'folio' | 'nombreCompleto' | 'nivel' | 'grado'>
> & {
  alumnoRef: string
  curp: string
  solicitadoPor: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr>
      <td style="background:#5f2436;border-radius:16px 16px 0 0;padding:20px;text-align:center;">
        <p style="margin:0;color:#fff;font-weight:700;">Winston USA Program · Baja / reembolso</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0 0 14px;color:#334155;line-height:1.65;">
          Se registró una <strong>baja</strong> que requiere <strong>gestionar el reembolso</strong>.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #e2e8f0;border-radius:8px;">
          <tr><td style="padding:10px 14px;color:#64748b;font-size:0.8rem;">Folio</td>
              <td style="padding:10px 14px;color:#0f172a;font-weight:600;">${escapeHtml(opts.folio)}</td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;color:#64748b;font-size:0.8rem;">Alumno</td>
              <td style="padding:10px 14px;background:#f8fafc;color:#0f172a;font-weight:600;">${escapeHtml(opts.nombreCompleto)}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-size:0.8rem;">Ref</td>
              <td style="padding:10px 14px;color:#0f172a;">${escapeHtml(opts.alumnoRef || '—')}</td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;color:#64748b;font-size:0.8rem;">Nivel / grado</td>
              <td style="padding:10px 14px;background:#f8fafc;color:#0f172a;">${escapeHtml(opts.nivel)} · ${escapeHtml(opts.grado || '—')}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-size:0.8rem;">CURP</td>
              <td style="padding:10px 14px;color:#0f172a;">${escapeHtml(opts.curp || '—')}</td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;color:#64748b;font-size:0.8rem;">Registró</td>
              <td style="padding:10px 14px;background:#f8fafc;color:#0f172a;">${escapeHtml(opts.solicitadoPor || 'Panel USA')}</td></tr>
        </table>
        <p style="margin:0;color:#64748b;font-size:0.85rem;line-height:1.55;">
          Acción requerida: procesar el reembolso y marcar el estado como
          <em>Reembolso Realizado</em> en el panel cuando corresponda.
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
  const folio = String(body.folio ?? '').trim() || '—'
  const nombreCompleto =
    String(body.nombreCompleto ?? '').trim() || 'Sin nombre'
  const nivel = String(body.nivel ?? '').trim() || '—'
  const grado = String(body.grado ?? '').trim()
  const alumnoRef = String(body.alumnoRef ?? '').trim()
  const curp = String(body.curp ?? '').trim()
  const solicitadoPor = String(body.solicitadoPor ?? '').trim() || 'Panel USA'

  const subject = `USA · Baja / reembolso · ${folio} · ${nombreCompleto}`

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtp.user, pass: smtp.pass },
    })
    await transporter.sendMail({
      from: `"Winston USA Program" <${smtp.user}>`,
      to: TO_SISTEMAS,
      subject,
      html: htmlBaja({
        folio,
        nombreCompleto,
        nivel,
        grado,
        alumnoRef,
        curp,
        solicitadoPor,
      }),
      text: [
        'Baja registrada — gestionar reembolso.',
        `Folio: ${folio}`,
        `Alumno: ${nombreCompleto}`,
        `Ref: ${alumnoRef || '—'}`,
        `Nivel / grado: ${nivel} · ${grado || '—'}`,
        `CURP: ${curp || '—'}`,
        `Registró: ${solicitadoPor}`,
      ].join('\n'),
    })
    return res.status(200).json({ ok: true, to: TO_SISTEMAS })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: mailSendErrorMessage(err),
    })
  }
}
