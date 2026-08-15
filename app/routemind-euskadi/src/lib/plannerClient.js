export async function requestItinerary(payload) {
  const response = await fetch('/api/itinerary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.error || 'No se pudo generar el itinerario.'
    const details = Array.isArray(data?.details) ? data.details : []
    const error = new Error(message)
    error.details = details
    throw error
  }

  return data
}

export async function requestApiHealth() {
  const response = await fetch('/api/health')
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.error || 'No se pudo comprobar la API.')
    throw error
  }

  return data
}