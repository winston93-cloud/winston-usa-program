/**
 * HTML de carta de bienvenida (familia) y notificación a CE.
 * `modo: 'padre'` = contenido de producción.
 * `modo: 'prueba'` = misma estructura + aviso de revisión interna.
 */

export type ModoCorreo = 'prueba' | 'padre'

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function htmlCartaFamilia(opts: {
  nivelLabel: string
  alumnoNombre: string
  folio: string
  modo: ModoCorreo
}): string {
  const institucion =
    opts.nivelLabel === 'Kinder'
      ? 'Instituto Educativo Winston'
      : 'Instituto Winston Churchill'
  const avisoPrueba =
    opts.modo === 'prueba'
      ? `<p style="margin:0 0 14px;color:#b45309;font-size:0.85rem;line-height:1.55;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:10px 12px;">
          <strong>Revisión interna</strong> · este correo es solo para probar el envío (no es el mensaje final a padres).
        </p>`
      : ''

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
        ${avisoPrueba}
        <p style="margin:0 0 14px;color:#334155;font-size:1rem;line-height:1.65;">Estimada familia:</p>
        <p style="margin:0 0 14px;color:#334155;font-size:1rem;line-height:1.65;">
          Adjunto encontrarán la carta de bienvenida de
          <strong>${escapeHtml(opts.alumnoNombre || 'alumno(a)')}</strong>
          (${escapeHtml(opts.folio || 'sin folio')}) al Winston USA Program
          — nivel <strong>${escapeHtml(opts.nivelLabel)}</strong>.
        </p>
        <p style="margin:0 0 14px;color:#334155;font-size:1rem;line-height:1.65;">
          Quedamos atentos a cualquier duda. Puede responder a este correo para
          contactar a Control Escolar de su nivel.
        </p>
        <p style="margin:24px 0 8px;color:#1e293b;font-size:1rem;font-weight:700;">${escapeHtml(institucion)}</p>
        <p style="margin:0;color:#64748b;font-size:0.85rem;">Control Escolar · ${escapeHtml(opts.nivelLabel)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function htmlNotificacionCe(opts: {
  nivelLabel: string
  alumnoNombre: string
  folio: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr>
      <td style="background:#0f172a;border-radius:16px 16px 0 0;padding:20px;text-align:center;">
        <p style="margin:0;color:#fff;font-weight:700;">Notificación · Nuevo alumno USA Program</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0 0 14px;color:#334155;line-height:1.65;">
          Se registró el <strong>1.er pago</strong> y se envió la carta de bienvenida a la familia de:
        </p>
        <p style="margin:0 0 14px;color:#1e293b;line-height:1.65;">
          <strong>${escapeHtml(opts.alumnoNombre || 'alumno(a)')}</strong><br/>
          Folio: ${escapeHtml(opts.folio || '—')}<br/>
          Nivel: ${escapeHtml(opts.nivelLabel)}
        </p>
        <p style="margin:0;color:#64748b;font-size:0.9rem;">
          Adjunto: la misma carta PDF enviada a la familia.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** HTML mínimo solo para validar SMTP. */
export function htmlPruebaSmtp(fromUser: string): string {
  return `<p><strong>Prueba de envío · Winston USA Program</strong></p>
<p>Remitente: <code>${escapeHtml(fromUser)}</code></p>
<p style="color:#64748b;font-size:0.85rem;">Solo comprueba que avisos_no-replay puede enviar. No es el correo a padres.</p>`
}
