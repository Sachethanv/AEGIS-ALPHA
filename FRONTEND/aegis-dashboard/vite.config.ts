import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // ESP32 hardware feed
      '/esp32-data': {
        target: 'http://10.1.19.103', // Lecture Hall (Infrastructure)
        // target: 'http://192.168.4.1', // AEGIS Tactical (MANNET Gateway)
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp32-data/, '/data')
      },
      // AEGIS SMS backend (Twilio proxy)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
