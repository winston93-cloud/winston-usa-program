import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expone INSFORGE_* al cliente (sin prefijo VITE_) para usar los mismos nombres en Vercel.
  envPrefix: ['INSFORGE_'],
})
