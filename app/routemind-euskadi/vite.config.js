import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { planTrip } from './api/lib/planning-service.js'
import { sendJson } from './api/lib/http.js'

function createDevApiPlugin() {
  return {
    name: 'routemind-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          next()
          return
        }

        const requestUrl = new URL(req.url, 'http://localhost')

        if (requestUrl.pathname === '/api/health') {
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, error: 'Method not allowed' })
            return
          }

          sendJson(res, 200, {
            ok: true,
            service: 'routemind-euskadi-dev-api',
            timestamp: new Date().toISOString(),
          })
          return
        }

        if (requestUrl.pathname === '/api/itinerary') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, error: 'Method not allowed' })
            return
          }

          try {
            const body = await new Promise((resolve, reject) => {
              let rawBody = ''

              req.on('data', (chunk) => {
                rawBody += chunk
              })

              req.on('end', () => {
                if (!rawBody) {
                  resolve({})
                  return
                }

                try {
                  resolve(JSON.parse(rawBody))
                } catch {
                  resolve({})
                }
              })

              req.on('error', reject)
            })

            const result = await planTrip(body)
            sendJson(res, 200, result)
          } catch (error) {
            sendJson(res, error.statusCode || 500, {
              ok: false,
              error: error.message || 'No se pudo generar el itinerario.',
              details: error.errors || [],
            })
          }

          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), createDevApiPlugin()],
})
