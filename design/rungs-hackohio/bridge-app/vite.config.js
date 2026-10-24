import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Backend team: proxy /api to your server during development.
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
