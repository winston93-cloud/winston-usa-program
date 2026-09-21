import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // loadEnv + process.env: Vercel inyecta en process.env en el build.
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const url = process.env.INSFORGE_URL ?? fileEnv.INSFORGE_URL ?? ''
  const anonKey =
    process.env.INSFORGE_ANON_KEY ?? fileEnv.INSFORGE_ANON_KEY ?? ''
  const googleClientId =
    process.env.USA_GOOGLE_CLIENT_ID ??
    process.env.GOOGLE_OAUTH_CLIENT_ID ??
    fileEnv.USA_GOOGLE_CLIENT_ID ??
    fileEnv.GOOGLE_OAUTH_CLIENT_ID ??
    ''

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['INSFORGE_', 'USA_'],
    define: {
      'import.meta.env.INSFORGE_URL': JSON.stringify(url),
      'import.meta.env.INSFORGE_ANON_KEY': JSON.stringify(anonKey),
      'import.meta.env.USA_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
  }
})
