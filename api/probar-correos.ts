/**
 * Prueba SMTP: un correo simple desde cada cuenta (CE ×3 + avisos)
 * y una carta de bienvenida de prueba desde cada CE (sin PDF pesado: HTML + nota).
 * Destino: CARTA_EMAIL_TO_PRUEBA.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import {
  correoPrueba,
  mailSendErrorMessage,
  normalizeMailPass,
  smtpAvisos,
  smtpControlEscolar,
  type SmtpAuth,
} from './_lib/mailSmtp.js'

type Resultado = {
  cuenta: string
  tipo: 'smtp' | 'carta'
  ok: boolean
  to?: string
  messageId?: string
  error?: string
}

async function enviarSimple(
  smtp: SmtpAuth,
  label: string,
  to: string,
): Promise<Resultado> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtp.user, pass: smtp.pass },
    })
    const info = await transporter.sendMail({
      from: `"Winston USA Program" <${smtp.user}>`,
      to,
      subject: `Prueba envío automático — Winston USA Program (${label})`,
      text:
        `Prueba envío automático Winston USA Program.\n\n` +
        `Cuenta remitente: ${smtp.user}\n` +
        `Etiqueta: ${label}\n` +
        `Fecha: ${new Date().toISOString()}\n`,
      html: `<p><strong>Prueba envío automático Winston USA Program</strong></p>
<p>Cuenta remitente: <code>${smtp.user}</code></p>
<p>Etiqueta: ${label}</p>
<p style="color:#64748b;font-size:0.85rem;">${new Date().toISOString()}</p>`,
    })
    return {
      cuenta: smtp.user,
      tipo: 'smtp',
      ok: true,
      to,
      messageId: info.messageId,
    }
  } catch (err) {
    return {
      cuenta: smtp.user,
      tipo: 'smtp',
      ok: false,
      to,
      error: mailSendErrorMessage(err),
    }
  }
}

async function enviarCartaPrueba(
  smtp: SmtpAuth,
  nivel: string,
  to: string,
): Promise<Resultado> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtp.user, pass: smtp.pass },
    })
    const info = await transporter.sendMail({
      from: `"Control Escolar ${nivel}" <${smtp.user}>`,
      to,
      replyTo: smtp.user,
      subject: `Prueba carta bienvenida USA Program — ${nivel}`,
      html: `<!DOCTYPE html>
<html><body style="font-family:Segoe UI,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 12px;font-weight:700;color:#1e3a5f;">Prueba envío automático Winston USA Program</p>
    <p style="margin:0 0 12px;color:#334155;">Carta de bienvenida de prueba (sin PDF adjunto) — nivel <strong>${nivel}</strong>.</p>
    <p style="margin:0;color:#64748b;font-size:0.85rem;">Remitente: ${smtp.user}</p>
  </div>
</body></html>`,
    })
    return {
      cuenta: smtp.user,
      tipo: 'carta',
      ok: true,
      to,
      messageId: info.messageId,
    }
  } catch (err) {
    return {
      cuenta: smtp.user,
      tipo: 'carta',
      ok: false,
      to,
      error: mailSendErrorMessage(err),
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const to = correoPrueba()
  const resultados: Resultado[] = []

  const cuentas: { label: string; smtp: SmtpAuth | { error: string }; carta?: string }[] =
    [
      { label: 'CE Kinder', smtp: smtpControlEscolar('Kinder'), carta: 'Kinder' },
      {
        label: 'CE Primaria',
        smtp: smtpControlEscolar('Primaria'),
        carta: 'Primaria',
      },
      {
        label: 'CE Secundaria',
        smtp: smtpControlEscolar('Secundaria'),
        carta: 'Secundaria',
      },
      { label: 'avisos_no-replay', smtp: smtpAvisos() },
    ]

  for (const c of cuentas) {
    if ('error' in c.smtp) {
      resultados.push({
        cuenta: c.label,
        tipo: 'smtp',
        ok: false,
        error: c.smtp.error,
      })
      continue
    }
    // Normalizar por si Vercel guardó espacios
    const smtp: SmtpAuth = {
      user: c.smtp.user,
      pass: normalizeMailPass(c.smtp.pass),
    }
    resultados.push(await enviarSimple(smtp, c.label, to))
    if (c.carta) {
      resultados.push(await enviarCartaPrueba(smtp, c.carta, to))
    }
  }

  const ok = resultados.every((r) => r.ok)
  return res.status(ok ? 200 : 207).json({
    ok,
    to,
    enviados: resultados.filter((r) => r.ok).length,
    fallidos: resultados.filter((r) => !r.ok).length,
    resultados,
  })
}
