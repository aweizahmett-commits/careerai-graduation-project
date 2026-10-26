import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: false, // auto-pick 3001 if 3000 is taken
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 300000, // 5 min — covers large PDF upload + OpenAI analysis
        timeout: 300000,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy Error] Cannot reach Django backend:', err.message)
          })
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('[Vite Proxy]', req.method, req.url, '→ http://127.0.0.1:8000')
          })
        },
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
