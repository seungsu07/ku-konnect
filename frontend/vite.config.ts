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
      '/api': {
        target: 'https://api.konnect.hydv.kr',
        changeOrigin: true,
      }
    },
    watch: {
      usePolling: true
    }
  }
})
