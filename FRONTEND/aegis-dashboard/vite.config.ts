import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/esp32-data': {
        target: 'http://192.168.1.8/data',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp32-data/, '')
      }
    }
  }
})
