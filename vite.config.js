import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // ✅ IMPORTANT for Hostinger / shared hosting

  plugins: [react()],

  optimizeDeps: {
    include: ['mammoth'],
  },

  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
})