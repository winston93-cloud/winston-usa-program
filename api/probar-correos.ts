/**
 * Rutina HTTP para revisar correos.
 * POST/GET ?modo=prueba|padre
 *
 * prueba → SMTP corto a CARTA_EMAIL_TO_PRUEBA.
 * padre  → HTML exacto de producción a la misma bandeja de revisión.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import {
  htmlCartaFamilia,
  htmlPruebaSmtp,
  type ModoCorreo,
} from './_lib/cartaBienvenidaHtml.js'
import {
  correoCePorNivel,
  correoPrueba,
  mailSendErrorMessage,
  smtpAvisos,
} from './_lib/mailSmtp.js'

function parseModo(req: VercelRequest): ModoCorreo {
  const q = typeof req.query.modo === 'string' ? req.query.modo : ''
  const body = (req.body ?? {}) as { modo?: string }
  const raw = (body.modo || q || 'prueba').toLowerCase()
  return raw === 'padre' ? 'padre' : 'prueba'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const smtp = smtpAvisos()
  if ('error' in smtp) {
    return res.status(500).json({ ok: false, error: smtp.error })
  }

  const modo = parseModo(req)
  const to = correoPrueba()
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtp.user, pass: smtp.pass },
  })

  try {
    if (modo === 'prueba') {
      const info = await transporter.sendMail({
        from: `"Winston USA Program" <${smtp.user}>`,
        to,
        subject: '[PRUEBA] Envío SMTP — Winston USA Program',
        html: htmlPruebaSmtp(smtp.user),
      })
      return res.status(200).json({
        ok: true,
        modo,
        to,
        from: smtp.user,
        messageId: info.messageId,
      })
    }

    const nivelLabel = 'Primaria'
    const alumnoNombre = 'Alumno Ejemplo Revisión'
    const folio = 'REV-000'
    const replyTo = correoCePorNivel(nivelLabel)
    const info = await transporter.sendMail({
      from: `"Winston USA Program" <${smtp.user}>`,
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
    return res.status(200).json({
      ok: true,
      modo,
      to,
      from: smtp.user,
      replyTo,
      messageId: info.messageId,
      nota: 'HTML idéntico al de padres; destino = bandeja de revisión',
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      modo,
      to,
      from: smtp.user,
      error: mailSendErrorMessage(err),
    })
  }
}
