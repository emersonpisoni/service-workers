import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' updates the SW automatically
      // 'prompt' asks the user before updating
      registerType: 'prompt',

      // Custom Service Worker (our study file)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      // Manifest para PWA
      manifest: {
        name: 'Service Workers Lab',
        short_name: 'SW Lab',
        description: 'Study project for Service Workers in React',
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

      // Service Workers do not work correctly in dev mode with injectManifest.
      // Use: npm run build && npm run preview
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
