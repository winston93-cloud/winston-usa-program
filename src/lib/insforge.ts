import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.INSFORGE_URL as string | undefined
const anonKey = import.meta.env.INSFORGE_ANON_KEY as string | undefined

if (!baseUrl || !anonKey) {
  console.warn('InsForge: faltan INSFORGE_URL o INSFORGE_ANON_KEY en .env')
}

export const insforge = createClient({
  baseUrl: baseUrl ?? '',
  anonKey: anonKey ?? '',
})

export const isInsforgeConfigured = Boolean(baseUrl && anonKey)
