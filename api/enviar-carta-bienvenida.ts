/**
 * Carta de bienvenida (1.er pago).
 * Remitente: avisos_no-replay. Reply-To: Control Escolar del nivel.
 *
 * modo=prueba → destino CARTA_EMAIL_TO_PRUEBA + aviso de revisión en el HTML.
 * modo=padre  → contenido exacto a familia; destino = correo tutor (body.to).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import {
  htmlCartaFamilia,
  htmlNotificacionCe,
  type ModoCorreo,
} from './_lib/cartaBienvenidaHtml.js'
import {
  correoCePorNivel,
  correoPrueba,
  mailSendErrorMessage,
  smtpAvisos,
} from './_lib/mailSmtp.js'

type Body = {
  to?: string
  modo?: ModoCorreo
  nivelLabel?: string
  replyTo?: string
  subject?: string
  alumnoNombre?: string
  folio?: string
  filename?: string
  pdfBase64?: string
  /** Solo modo padre: notificar también a CE (default false hasta habilitar). */
  notificarCe?: boolean
}

function parseModo(raw: unknown): ModoCorreo {
  return raw === 'padre' ? 'padre' : 'prueba'
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

  const smtp = smtpAvisos()
  if ('error' in smtp) {
    return res.status(500).json({ ok: false, error: smtp.error })
  }

  const modo = parseModo(body.modo)
  const nivelLabel = body.nivelLabel || 'Primaria'
  const ceEmail = correoCePorNivel(nivelLabel)
  const requestedTo = (body.to || '').trim().toLowerCase()
  const to = modo === 'prueba' ? correoPrueba() : requestedTo

  if (!to) {
    return res.status(400).json({
      ok: false,
      error:
        modo === 'padre'
          ? 'modo=padre requiere correo destino (to = tutor o bandeja de revisión)'
          : 'Falta destino de correo',
    })
  }

  const alumnoNombre = body.alumnoNombre || ''
  const folio = body.folio || ''
  const filename =
    body.filename ||
    `carta-bienvenida-${folio || 'alumno'}.pdf`.replace(/[^\w.-]+/g, '_')
  const replyTo = body.replyTo || ceEmail
  const subject =
    body.subject ||
    (modo === 'prueba'
      ? `[PRUEBA] Carta de bienvenida USA Program — ${alumnoNombre || folio || nivelLabel}`
      : `Carta de bienvenida USA Program — ${alumnoNombre || folio || nivelLabel}`)

  let pdf: Buffer
  try {
    pdf = Buffer.from(pdfBase64, 'base64')
  } catch {
    return res.status(400).json({ ok: false, error: 'pdfBase64 inválido' })
  }
  if (pdf.length < 100) {
    return res.status(400).json({ ok: false, error: 'PDF vacío o inválido' })
  }

  const attachment = {
    filename,
    content: pdf,
    contentType: 'application/pdf' as const,
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtp.user, pass: smtp.pass },
  })

  try {
    const info = await transporter.sendMail({
      from: `"Winston USA Program" <${smtp.user}>`,
      to,
      replyTo,
      subject,
      html: htmlCartaFamilia({
        nivelLabel,
        alumnoNombre,
        folio,
        modo,
      }),
      attachments: [attachment],
    })

    const notificarCe = modo === 'padre' && body.notificarCe === true
    let ceMessageId: string | undefined
    if (notificarCe) {
      const infoCe = await transporter.sendMail({
        from: `"Winston USA Program" <${smtp.user}>`,
        to: ceEmail,
        replyTo: smtp.user,
        subject: `Notificación: nuevo alumno USA Program — ${alumnoNombre || folio}`,
        html: htmlNotificacionCe({ nivelLabel, alumnoNombre, folio }),
        attachments: [attachment],
      })
      ceMessageId = infoCe.messageId
    }

    return res.status(200).json({
      ok: true,
      modo,
      messageId: info.messageId,
      to,
      from: smtp.user,
      replyTo,
      ceNotificado: notificarCe,
      ceDestinoPrevisto: ceEmail,
      ceMessageId: ceMessageId ?? null,
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: mailSendErrorMessage(err) })
  }
}
