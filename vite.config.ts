import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // loadEnv + process.env: Vercel inyecta en process.env en el build.
  const fileEnv = loadEnv(mode, process.cwd(), 'INSFORGE_')
  const url = process.env.INSFORGE_URL ?? fileEnv.INSFORGE_URL ?? ''
  const anonKey =
    process.env.INSFORGE_ANON_KEY ?? fileEnv.INSFORGE_ANON_KEY ?? ''

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: 'INSFORGE_',
    define: {
      'import.meta.env.INSFORGE_URL': JSON.stringify(url),
      'import.meta.env.INSFORGE_ANON_KEY': JSON.stringify(anonKey),
    },
  }
})
