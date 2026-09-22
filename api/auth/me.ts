/**
 * Valida token de sesión (opcional; el cliente también decodifica en memoria).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { decodeSession } from '../_lib/authSession.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const session = decodeSession(token)
  if (!session) {
    return res.status(401).json({ ok: false, error: 'Sesión inválida o expirada' })
  }
  return res.status(200).json({ ok: true, session })
}
