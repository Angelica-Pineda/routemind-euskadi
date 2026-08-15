import { sendJson } from './lib/http.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  sendJson(res, 200, {
    ok: true,
    service: 'routemind-euskadi-api',
    timestamp: new Date().toISOString(),
  })
}