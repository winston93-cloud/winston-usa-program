/**
 * En `npm run dev`, Vite no monta /api (eso solo vive en Vercel).
 * Este plugin ejecuta los handlers de /api/*.ts para correos y Google auth.
 */
import { existsSync, readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return {}
  }
}

function attachVercelRes(res: ServerResponse) {
  const api = res as ServerResponse & {
    status: (code: number) => typeof api
    json: (body: unknown) => typeof api
    send: (body: unknown) => typeof api
  }
  api.status = (code: number) => {
    res.statusCode = code
    return api
  }
  api.json = (body: unknown) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
    res.end(JSON.stringify(body))
    return api
  }
  api.send = (body: unknown) => {
    if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
      return api.json(body)
    }
    res.end(body as string | Buffer)
    return api
  }
  return api
}

export function devApiPlugin(): Plugin {
  return {
    name: 'usa-dev-api',
    configureServer(server: ViteDevServer) {
      const root = server.config.root
      loadEnvFile(path.resolve(root, '.env'))
      loadEnvFile(path.resolve(root, '.env.local'))
      loadEnvFile(path.resolve(root, '.env.vercel'))

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        const pathname = url.split('?')[0] ?? ''
        if (!pathname.startsWith('/api/')) {
          next()
          return
        }

        const rel = pathname.replace(/^\/api\//, '').replace(/\/+$/, '')
        if (!rel || rel.includes('..')) {
          next()
          return
        }
        const abs = path.resolve(root, 'api', `${rel}.ts`)
        const rootApi = path.resolve(root, 'api')
        if (!abs.startsWith(rootApi) || !existsSync(abs)) {
          next()
          return
        }

        try {
          const query: Record<string, string> = {}
          const q = url.includes('?') ? url.slice(url.indexOf('?') + 1) : ''
          for (const [k, v] of new URLSearchParams(q)) query[k] = v

          const body =
            req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'
              ? {}
              : await readJsonBody(req)

          const id = `/${path.relative(root, abs).replace(/\\/g, '/')}`
          const mod = (await server.ssrLoadModule(id)) as {
            default: (
              req: IncomingMessage & {
                body?: unknown
                query?: Record<string, string>
              },
              res: ReturnType<typeof attachVercelRes>,
            ) => Promise<void>
          }
          const handler = mod.default
          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: `Sin handler en ${id}` }))
            return
          }

          const vReq = req as IncomingMessage & {
            body?: unknown
            query?: Record<string, string>
          }
          vReq.body = body
          vReq.query = query
          await handler(vReq, attachVercelRes(res))
          if (!res.writableEnded) res.end()
        } catch (err) {
          if (res.headersSent) return
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          const message = err instanceof Error ? err.message : 'Error en /api'
          res.end(JSON.stringify({ ok: false, error: message }))
        }
      })
    },
  }
}
