/**
 * Login manual vía RPC SECURITY DEFINER (sin SELECT directo a public.usuario).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@insforge/sdk'
import { resolveAccessByEmail } from '../_lib/authAccess.js'
import { encodeSession } from '../_lib/authSession.js'

type AuthLoginRow = {
  usuario_id: number
  usuario_email: string
  usuario_username: string
  usuario_nombre: string
  usuario_app: string
  usuario_apm: string
}

function asRows(data: unknown): AuthLoginRow[] {
  if (Array.isArray(data)) return data as AuthLoginRow[]
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: AuthLoginRow[] }).data
  }
  return []
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

  const body = (req.body ?? {}) as {
    email?: string
    usuario?: string
    password?: string
  }
  const login = (body.email || body.usuario || '').trim()
  const password = String(body.password ?? '')
  if (!login || !password) {
    return res
      .status(400)
      .json({ ok: false, error: 'Usuario/correo y contraseña requeridos' })
  }

  const baseUrl = process.env.INSFORGE_URL
  const anonKey = process.env.INSFORGE_ANON_KEY
  if (!baseUrl || !anonKey) {
    return res.status(500).json({ ok: false, error: 'InsForge no configurado' })
  }

  const db = createClient({ baseUrl, anonKey })
  const { data, error } = await db.database.rpc('usa_programa_auth_login', {
    p_login: login,
    p_password: password,
  })

  if (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }

  const user = asRows(data)[0]
  if (!user?.usuario_email) {
    return res.status(401).json({ ok: false, error: 'Credenciales incorrectas' })
  }

  const access = resolveAccessByEmail(user.usuario_email)
  if (!access) {
    return res.status(403).json({
      ok: false,
      error:
        'Esta cuenta no tiene acceso al programa USA (solo Sistemas y Control Escolar).',
    })
  }

  const nombre = [user.usuario_nombre, user.usuario_app, user.usuario_apm]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .join(' ')

  const session = {
    ...access,
    nombre: nombre || user.usuario_username || access.label,
    usuario: user.usuario_username || user.usuario_email.split('@')[0],
  }
  const token = encodeSession(session)
  return res.status(200).json({ ok: true, token, session })
}
