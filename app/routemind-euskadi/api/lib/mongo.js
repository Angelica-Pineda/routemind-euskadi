import { MongoClient } from 'mongodb'
import { eventOptions, siteOptions, zoneOptions } from '../../shared/catalog.js'

const TERRITORY_CODES = {
  Araba: '01',
  Gipuzkoa: '20',
  Bizkaia: '48',
}

function getSelectedTerritoryCodes(zoneId) {
  const province = zoneOptions.find((zone) => zone.id === zoneId)?.province

  if (!province || province === 'Pais Vasco') {
    return Object.values(TERRITORY_CODES)
  }

  return TERRITORY_CODES[province] ? [TERRITORY_CODES[province]] : Object.values(TERRITORY_CODES)
}

function buildTerritoryCodeRegex(codes) {
  return `(^|\\s)(${codes.join('|')})(\\s|$)`
}

function normalizeTerritoryCodes(value) {
  return String(value ?? '').match(/01|20|48/g) ?? []
}

function normalizeSetting(...values) {
  const text = values.filter(Boolean).map(String).join(' ').toLowerCase()

  if (/(indoor|interior|museo|exposici|teatro|galer[ií]a|restauraci[oó]n|restaurante|bodega)/i.test(text)) {
    return 'indoor'
  }

  if (/(outdoor|exterior|playa|costa|monta[nñ]a|naturaleza|senderismo|parque|mirador|deporte)/i.test(text)) {
    return 'outdoor'
  }

  return 'mixed'
}

function calendarBoundary(value, endOfDay = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return date
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0)
}

let cachedClientPromise = null

function normalizePlace(document) {
  const territoryCodes = normalizeTerritoryCodes(document.territorycode)

  return {
    id: String(document._id ?? document.documentName ?? 'place'),
    label: String(document.documentName ?? 'Punto sin nombre'),
    city: String(document.municipality ?? document.municipalitycode ?? ''),
    province: territoryCodes.join(' '),
    territoryCodes,
    setting: normalizeSetting(document.templateType, document.category, document.marks),
    tags: [document.marks, document.templateType, document.category].filter(Boolean).map(String),
    // durationHours: 2,
    priority: 75,
    description: String(document.marks ?? document.templateType ?? 'Punto de interés turístico.'),
    coordinates: document.latwgs84 && document.lonwgs84 ? [Number(document.latwgs84), Number(document.lonwgs84)] : null,
    userCategory: String(document.user_category ?? ''),
  }
}

function normalizeEvent(document) {
  const territoryCodes = normalizeTerritoryCodes(document.countyId)

  return {
    id: String(document.id ?? document._id ?? 'event'),
    label: String(document.name ?? 'Evento sin nombre'),
    city: String(document.municipality ?? ''),
    province: territoryCodes.join(' '),
    territoryCodes,
    setting: normalizeSetting(document.type_name, document.user_category, document.location),
    tags: [document.type_name, document.user_category].filter(Boolean).map(String),
    // durationHours: 2,
    priority: 80,
    openingHour: String(document.opening_hour ?? 'Evento cultural disponible en las fechas seleccionadas.'),
    coordinates: document.location ?? null,
    userCategory: String(document.user_category ?? ''),
    startDate: document.startDate ?? null,
    endDate: document.endDate ?? null,
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

export async function fetchCatalogSnapshot(request = {}) {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return buildFallbackSnapshot()
  }

  try {
    const client = await getMongoClient(uri)
    const db = client.db(process.env.MONGODB_DB || 'routemind_euskadi')

    const selectedCategories = Array.isArray(request.plans)
      ? request.plans.filter(Boolean).map((category) => String(category))
      : []
    const selectedTerritoryCodes = getSelectedTerritoryCodes(request.zone)
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const categoryFilter = selectedCategories.length ? { user_category: { $in: selectedCategories } } : {}
    const eventDateFilter = { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    const territoryCodeRegex = buildTerritoryCodeRegex(selectedTerritoryCodes)
    const placeTerritoryFilter = { territorycode: { $regex: territoryCodeRegex } }
    const eventTerritoryFilter = { countyId: { $in: selectedTerritoryCodes } }
    const weatherFilter = { date: { $gte: calendarBoundary(startDate), $lte: calendarBoundary(endDate, true) }, countyId: { $in: selectedTerritoryCodes } }

    const [places, events, weather] = await Promise.all([
      db.collection('visit_points_user_category').find({ ...categoryFilter, ...placeTerritoryFilter }).limit(100).toArray(),
      db.collection('events_user_category').find({ ...categoryFilter, ...eventDateFilter, ...eventTerritoryFilter }).limit(100).toArray(),
      db.collection('weather_prediction_scoring').find(weatherFilter).sort({ date: 1 }).limit(31).toArray(),
    ])

    const normalizedPlaces = places.map(normalizePlace)
    const normalizedEvents = events.map(normalizeEvent)

    return {
      source: 'mongo',
      filters: {
        selectedCategories,
        selectedTerritoryCodes,
        eventDateRange: { startDate: request.startDate, endDate: request.endDate },
        weatherDateRange: { startDate: request.startDate, endDate: request.endDate },
      },
      places: normalizedPlaces,
      events: normalizedEvents,
      weather: weather.map((document) => ({
        date: document.date,
        outdoorScore: Number(document.scoring_outdoor ?? 0),
        label: `Puntuación outdoor: ${Number(document.scoring_outdoor ?? 0).toFixed(2)}`,
        recommendation: Number(document.scoring_outdoor ?? 0) >= 0.6 ? 'Buen contexto para actividades exteriores.' : 'Conviene priorizar actividades cubiertas.',
        dayPart: 'general',
      })),
    }
  } catch {
    return buildFallbackSnapshot()
  }
}