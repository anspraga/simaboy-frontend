import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Simaboy CBT SMA 1 Boyolangu',
        short_name: 'Simaboy',
        description: 'Portal Akademik & Ujian SMA 1 Boyolangu',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone', // Ini yang membuat aplikasi tampil tanpa UI Browser!
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg', // Pastikan kamu punya icon resolusi tinggi (192x192 dan 512x512 berformat PNG) untuk production
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})