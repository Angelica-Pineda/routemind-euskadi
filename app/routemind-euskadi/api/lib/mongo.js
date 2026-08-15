import { MongoClient } from 'mongodb'
import { eventOptions, siteOptions } from '../../shared/catalog.js'

let cachedClientPromise = null

function normalizeDocument(document, fallbackType) {
  return {
    id: String(document.id ?? document._id ?? `${fallbackType}-${document.name ?? 'item'}`),
    label: String(document.label ?? document.name ?? document.title ?? 'Punto sin nombre'),
    city: String(document.city ?? document.municipality ?? document.locality ?? ''),
    province: String(document.province ?? document.region ?? document.territory ?? ''),
    setting: String(document.setting ?? document.activityMode ?? document.type ?? 'indiferente'),
    tags: Array.isArray(document.tags)
      ? document.tags.map((tag) => String(tag))
      : Array.isArray(document.categories)
        ? document.categories.map((tag) => String(tag))
        : [],
    transport: Array.isArray(document.transport)
      ? document.transport.map((item) => String(item))
      : Array.isArray(document.transportModes)
        ? document.transportModes.map((item) => String(item))
        : [],
    durationHours: Number(document.durationHours ?? document.duration ?? 2),
    priority: Number(document.priority ?? document.score ?? 75),
    description: String(document.description ?? document.summary ?? ''),
    coordinates: document.coordinates ?? document.geo ?? null,
    source: 'mongo',
  }
}

async function getMongoClient(uri) {
  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(uri).connect()
  }

  return cachedClientPromise
}

function buildFallbackSnapshot() {
  return {
    source: 'mock',
    places: siteOptions,
    events: eventOptions,
    weather: [
      {
        dayPart: 'manana',
        label: 'Probabilidad de cielos despejados y temperaturas suaves.',
        recommendation: 'Ideal para outdoor ligero y traslados en coche o moto.',
      },
      {
        dayPart: 'tarde',
        label: 'Alternancia de nubes con ventanas de estabilidad.',
        recommendation: 'Combina una visita urbana indoor con un paseo corto.',
      },
      {
        dayPart: 'noche',
        label: 'Descenso termico moderado.',
        recommendation: 'Reserva cenas y planes cubiertos si la salida se alarga.',
      },
    ],
  }
}

export async function fetchCatalogSnapshot() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return buildFallbackSnapshot()
  }

  try {
    const client = await getMongoClient(uri)
    const db = client.db(process.env.MONGODB_DB || 'routemind_euskadi')

    const [places, events, weather] = await Promise.all([
      db.collection('places').find({}).limit(24).toArray(),
      db.collection('events').find({}).limit(24).toArray(),
      db.collection('weather_forecasts').find({}).limit(12).toArray(),
    ])

    const normalizedPlaces = places.map((document) => normalizeDocument(document, 'place'))
    const normalizedEvents = events.map((document) => normalizeDocument(document, 'event'))

    if (!normalizedPlaces.length && !normalizedEvents.length) {
      return buildFallbackSnapshot()
    }

    return {
      source: 'mongo',
      places: normalizedPlaces.length ? normalizedPlaces : siteOptions,
      events: normalizedEvents.length ? normalizedEvents : eventOptions,
      weather: weather.map((document) => ({
        label: String(document.label ?? document.summary ?? 'Pronostico no disponible'),
        recommendation: String(document.recommendation ?? document.note ?? ''),
        dayPart: String(document.dayPart ?? document.period ?? 'general'),
      })),
    }
  } catch {
    return buildFallbackSnapshot()
  }
}