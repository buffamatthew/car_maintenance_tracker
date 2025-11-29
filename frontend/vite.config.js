import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Listen on all addresses including LAN
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true  // Better for Docker
    },
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  }
})
