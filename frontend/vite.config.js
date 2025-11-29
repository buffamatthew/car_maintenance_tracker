import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to disable host check
const disableHostCheckPlugin = {
  name: 'disable-host-check',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Allow all hosts
      next()
    })
  }
}

export default defineConfig({
  plugins: [react(), disableHostCheckPlugin],
  server: {
    host: '0.0.0.0',  // Listen on all addresses
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
