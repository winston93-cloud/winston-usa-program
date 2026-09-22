/**
 * API: carta de bienvenida (1.er pago) enviada DESDE la cuenta de Control Escolar del nivel.
 * Destino de prueba: sistemas.desarrollo (CARTA_EMAIL_TO_PRUEBA).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import {
  correoCePorNivel,
  correoPrueba,
  mailSendErrorMessage,
  smtpControlEscolar,
} from './_lib/mailSmtp.js'

const COPIA_SISTEMAS = 'sistemas.desarrollo@winston93.edu.mx'

type Body = {
  to?: string
  nivelLabel?: string
  replyTo?: string
  subject?: string
  alumnoNombre?: string
  folio?: string
  filename?: string
  pdfBase64?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlCarta(opts: {
  nivelLabel: string
  alumnoNombre: string
  folio: string
  fromUser: string
}): string {
  const institucion =
    opts.nivelLabel === 'Kinder'
      ? 'Instituto Educativo Winston'
      : 'Instituto Winston Churchill'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr>
      <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%);border-radius:16px 16px 0 0;padding:22px 20px;text-align:center;">
        <p style="margin:0;color:#fff;font-size:1.05rem;font-weight:700;">Winston USA Program · Carta de bienvenida</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0 0 14px;color:#334155;font-size:1rem;line-height:1.65;">Estimada familia:</p>
        <p style="margin:0 0 14px;color:#334155;font-size:1rem;line-height:1.65;">
          Adjunto encontrarán la carta de bienvenida de
          <strong>${escapeHtml(opts.alumnoNombre || 'alumno(a)')}</strong>
          (${escapeHtml(opts.folio || 'sin folio')}) al Winston USA Program
          — nivel <strong>${escapeHtml(opts.nivelLabel)}</strong>.
        </p>
        <p style="margin:0 0 14px;color:#64748b;font-size:0.9rem;line-height:1.55;">
          <em>Envío de prueba</em> a Sistemas Desarrollo. Remitente:
          ${escapeHtml(opts.fromUser)} (Control Escolar ${escapeHtml(opts.nivelLabel)}).
        </p>
        <p style="margin:24px 0 8px;color:#1e293b;font-size:1rem;font-weight:700;">${escapeHtml(institucion)}</p>
        <p style="margin:0;color:#64748b;font-size:0.85rem;">Control Escolar · ${escapeHtml(opts.nivelLabel)}</p>
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

  const body = (req.body ?? {}) as Body
  const pdfBase64 = body.pdfBase64?.trim()
  if (!pdfBase64) {
    return res.status(400).json({ ok: false, error: 'Falta pdfBase64' })
  }

  const nivelLabel = body.nivelLabel || 'Primaria'
  const smtp = smtpControlEscolar(nivelLabel)
  if ('error' in smtp) {
    return res.status(500).json({ ok: false, error: smtp.error })
  }

  const to = (body.to || correoPrueba()).trim().toLowerCase()
  const alumnoNombre = body.alumnoNombre || ''
  const folio = body.folio || ''
  const filename =
    body.filename ||
    `carta-bienvenida-${folio || 'alumno'}.pdf`.replace(/[^\w.-]+/g, '_')
  const fromName = `Control Escolar ${nivelLabel}`
  const replyTo = body.replyTo || correoCePorNivel(nivelLabel)

  let pdf: Buffer
  try {
    pdf = Buffer.from(pdfBase64, 'base64')
  } catch {
    return res.status(400).json({ ok: false, error: 'pdfBase64 inválido' })
  }
  if (pdf.length < 100) {
    return res.status(400).json({ ok: false, error: 'PDF vacío o inválido' })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtp.user, pass: smtp.pass },
  })

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${smtp.user}>`,
      to,
      bcc: to === COPIA_SISTEMAS ? undefined : COPIA_SISTEMAS,
      replyTo,
      subject:
        body.subject ||
        `Carta de bienvenida USA Program — ${alumnoNombre || folio || nivelLabel}`,
      html: htmlCarta({
        nivelLabel,
        alumnoNombre,
        folio,
        fromUser: smtp.user,
      }),
      attachments: [
        {
          filename,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    })

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
      to,
      from: smtp.user,
      fromName,
      replyTo,
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: mailSendErrorMessage(err) })
  }
}
