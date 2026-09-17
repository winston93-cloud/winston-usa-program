import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string | undefined
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined

if (!baseUrl || !anonKey) {
  console.warn(
    'InsForge: faltan VITE_INSFORGE_URL o VITE_INSFORGE_ANON_KEY en .env',
  )
}

export const insforge = createClient({
  baseUrl: baseUrl ?? '',
  anonKey: anonKey ?? '',
})

export const isInsforgeConfigured = Boolean(baseUrl && anonKey)
