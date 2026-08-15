import { planTrip } from './lib/planning-service.js'
import { readJsonBody, sendJson } from './lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const body = await readJsonBody(req)
    const result = await planTrip(body)
    sendJson(res, 200, result)
  } catch (error) {
    const statusCode = error.statusCode || 500
    sendJson(res, statusCode, {
      ok: false,
      error: error.message || 'No se pudo generar el itinerario.',
      details: error.errors || [],
    })
  }
}