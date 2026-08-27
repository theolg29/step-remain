import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pas restants',
        short_name: 'Pas restants',
        description:
          "Calcule la distance restante pour atteindre ton objectif de pas et génère un trajet piéton réel autour de chez toi.",
        theme_color: '#1f6f54',
        background_color: '#141814',
        display: 'standalone',
        start_url: '/',
        lang: 'fr',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Précache uniquement le shell de l'app (assets buildés). Les appels ORS restent
      // en réseau direct, non interceptés par le service worker : pas de fallback
      // hors-ligne pour la génération de trajet en V1 (voir PRD).
    }),
  ],
})
