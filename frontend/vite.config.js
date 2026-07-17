import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from any device on local network
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      // Only proxy uploaded images from backend (not all /images)
      '/images/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
