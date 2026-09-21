/**
 * Login Google (GIS access_token) + allowlist USA Program.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveAccessByEmail } from '../src/lib/authAccess'
import { encodeSession, verifyGoogleAccessToken } from '../_lib/authSession'

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

  const body = (req.body ?? {}) as { accessToken?: string }
  const accessToken = String(body.accessToken ?? '').trim()
  if (!accessToken) {
    return res.status(400).json({ ok: false, error: 'Falta accessToken de Google' })
  }

  try {
    const { email, name } = await verifyGoogleAccessToken(accessToken)
    const access = resolveAccessByEmail(email)
    if (!access) {
      return res.status(403).json({
        ok: false,
        error:
          'Este correo de Google no tiene acceso. Solo Sistemas y Control Escolar.',
      })
    }
    const session = {
      ...access,
      nombre: name || access.label,
      usuario: email.split('@')[0],
    }
    const token = encodeSession(session)
    return res.status(200).json({ ok: true, token, session })
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Error de Google Auth',
    })
  }
}
