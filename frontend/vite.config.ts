import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'konnect.hydv.kr'
    ],
    proxy: {
      '^/api/data/(professor|course|lecture|lectureclass|building|classroom)': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://api.konnect.hydv.kr',
        changeOrigin: true,
        cookieDomainRewrite: '',
      }
    },
    watch: {
      usePolling: true
    }
  }
})
