import { MongoClient } from 'mongodb'
import { eventOptions, siteOptions, zoneOptions } from '../../shared/catalog.js'

let cachedClientPromise = null

function normalizePlace(document) {
  return {
    id: String(document._id ?? document.documentName ?? 'place'),
    label: String(document.documentName ?? 'Punto sin nombre'),
    city: String(document.municipality ?? document.municipalitycode ?? ''),
    province: String(document.territorycode ?? ''),
    setting: String(document.templateType ?? document.category ?? 'indiferente'),
    tags: [document.marks, document.templateType, document.category].filter(Boolean).map(String),
    transport: [],
    durationHours: 2,
    priority: 75,
    description: String(document.marks ?? document.templateType ?? 'Punto de interés turístico.'),
    coordinates: document.latwgs84 && document.lonwgs84 ? [Number(document.latwgs84), Number(document.lonwgs84)] : null,
    userCategory: String(document.user_category ?? ''),
    source: 'mongo',
  }
}

function normalizeEvent(document) {
  return {
    id: String(document.id ?? document._id ?? 'event'),
    label: String(document.name ?? 'Evento sin nombre'),
    city: String(document.municipality ?? ''),
    province: String(document.countyId ?? ''),
    setting: String(document.type_name ?? 'evento'),
    tags: [document.type_name, document.user_category].filter(Boolean).map(String),
    transport: [],
    durationHours: 2,
    priority: 80,
    description: String(document.opening_hour ?? 'Evento cultural disponible en las fechas seleccionadas.'),
    coordinates: document.location ?? null,
    userCategory: String(document.user_category ?? ''),
    startDate: document.startDate ?? null,
    endDate: document.endDate ?? null,
    source: 'mongo',
  }
}

function getZoneCities(zoneId) {
  return zoneOptions.find((zone) => zone.id === zoneId)?.cities ?? []
}

function getProvinceCode(zoneId) {
  const province = zoneOptions.find((zone) => zone.id === zoneId)?.province
  return province === 'Bizkaia' ? '48' : province === 'Gipuzkoa' ? '20' : province === 'Araba' ? '01' : null
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

export async function fetchCatalogSnapshot(request = {}) {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return buildFallbackSnapshot()
  }

  try {
    const client = await getMongoClient(uri)
    const db = client.db(process.env.MONGODB_DB || 'routemind_euskadi')

    const selectedCategories = Array.isArray(request.plans) ? request.plans : []
    const cities = getZoneCities(request.zone)
    const provinceCode = getProvinceCode(request.zone)
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const dateFilter = { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    const categoryFilter = selectedCategories.length ? { user_category: { $in: selectedCategories } } : {}
    const cityFilter = cities.length ? { municipality: { $in: cities } } : {}
    const weatherFilter = { date: { $gte: startDate, $lte: endDate }, ...(provinceCode ? { countyId: provinceCode } : {}) }

    const [places, events, weather] = await Promise.all([
      db.collection('visit_points_user_category').find({ ...categoryFilter, ...cityFilter }).limit(100).toArray(),
      db.collection('events_user_category').find({ ...dateFilter, ...categoryFilter, ...cityFilter }).limit(100).toArray(),
      db.collection('weather_prediction_scoring').find(weatherFilter).sort({ date: 1 }).limit(31).toArray(),
    ])

    const normalizedPlaces = places.map(normalizePlace)
    const normalizedEvents = events.map(normalizeEvent)

    return {
      source: 'mongo',
      filters: { selectedCategories, cities, provinceCode, startDate: request.startDate, endDate: request.endDate },
      places: normalizedPlaces,
      events: normalizedEvents,
      weather: weather.map((document) => ({
        date: document.date,
        label: `Puntuación outdoor: ${Number(document.scoring_outdoor ?? 0).toFixed(2)}`,
        recommendation: Number(document.scoring_outdoor ?? 0) >= 0.6 ? 'Buen contexto para actividades exteriores.' : 'Conviene priorizar actividades cubiertas.',
        dayPart: 'general',
      })),
    }
  } catch {
    return buildFallbackSnapshot()
  }
}