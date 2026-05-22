import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // All requests to /api/* are forwarded to the backend.
      // The browser sees them as same-origin → no CORS preflight.
      '/api': {
        target: 'https://ala-mahlak.runasp.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
