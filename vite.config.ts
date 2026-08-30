import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'local-api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || ''
            const apiKey = (
              (req.headers['x-ors-api-key'] as string) ||
              env.ORS_API_KEY ||
              env.VITE_ORS_API_KEY ||
              ''
            ).trim()

            if (url.startsWith('/api/directions') && req.method === 'POST') {
              let bodyStr = ''
              req.on('data', (chunk) => {
                bodyStr += chunk
              })
              req.on('end', async () => {
                try {
                  const orsRes = await fetch(
                    'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
                    {
                      method: 'POST',
                      headers: {
                        Authorization: apiKey,
                        'Content-Type': 'application/json',
                      },
                      body: bodyStr,
                    },
                  )
                  const text = await orsRes.text()
                  res.statusCode = orsRes.status
                  res.setHeader('Content-Type', 'application/json')
                  res.end(text)
                } catch {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(
                    JSON.stringify({
                      error: { message: 'Impossible de contacter openrouteservice en local.' },
                    }),
                  )
                }
              })
              return
            }

            if (url.startsWith('/api/geocode') && req.method === 'GET') {
              try {
                const parsedUrl = new URL(url, 'http://localhost')
                const queryText = parsedUrl.searchParams.get('text') || ''
                const size = parsedUrl.searchParams.get('size') || '5'

                const orsUrl = `https://api.openrouteservice.org/geocode/search?${new URLSearchParams({
                  api_key: apiKey,
                  text: queryText.trim(),
                  size,
                })}`

                const orsRes = await fetch(orsUrl, {
                  headers: { Authorization: apiKey },
                })
                const text = await orsRes.text()
                res.statusCode = orsRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(text)
              } catch {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    error: { message: 'Impossible de contacter openrouteservice en local.' },
                  }),
                )
              }
              return
            }

            next()
          })
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Pas restants',
          short_name: 'Pas restants',
          description:
            "Calcule la distance restante pour atteindre ton objectif de pas et génère un trajet piéton réel autour de chez toi.",
          theme_color: '#061d18',
          background_color: '#061d18',
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
      }),
    ],
  }
})
