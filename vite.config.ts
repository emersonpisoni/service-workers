import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' atualiza o SW automaticamente
      // 'prompt' pergunta ao usuário se quer atualizar
      registerType: 'prompt',

      // Service Worker customizado (nosso arquivo para estudo)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      // Manifest para PWA
      manifest: {
        name: 'Service Workers Lab',
        short_name: 'SW Lab',
        description: 'Projeto para estudar Service Workers no React',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      devOptions: {
        // Habilita o SW em modo dev para testar
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
