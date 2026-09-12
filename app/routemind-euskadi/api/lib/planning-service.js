import { eventOptions, getCatalogSeed, getSitesByIds, getZoneById, paceOptions, preferenceOptions, siteOptions, transportOptions, zoneOptions } from '../../shared/catalog.js'
import { fetchCatalogSnapshot } from './mongo.js'
import { generateItineraryWithGemini } from './gemini.js'

const MAX_PLAN_MONTHS = 3

const TERRITORY_CODES = {
  Araba: '01',
  Gipuzkoa: '20',
  Bizkaia: '48',
}

function startOfDay(date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function addMonths(date, months) {
  const clone = new Date(date)
  clone.setMonth(clone.getMonth() + months)
  return clone
}

function addDays(date, days) {
  const clone = new Date(date)
  clone.setDate(clone.getDate() + days)
  return clone
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isoDate(date) {
  return startOfDay(date).toISOString().slice(0, 10)
}

function toDate(value) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed)
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeString(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const cleaned = value.trim().toLowerCase()

  return cleaned || fallback
}

function getSelectedTerritoryCodes(zone) {
  const code = TERRITORY_CODES[zone?.province]
  return code ? [code] : []
}

function getItemTerritoryCodes(item) {
  if (Array.isArray(item.territoryCodes)) {
    return item.territoryCodes
  }

  const code = TERRITORY_CODES[item.province]
  return code ? [code] : []
}

function buildGeminiPrompt(request, catalog, selectedZone, rankings) {
  const input = {
    dates: { start: request.startDate, end: request.endDate },
    preferences: {
      plans: request.plans,
      transport: request.transport,
      pace: request.pace,
      budget: request.budget,
      partySize: request.partySize,
    },
    zone: selectedZone?.label,
    selectedSites: request.sites,
  }

  const places = catalog.places.map((place) => ({
    id: place.id,
    name: place.label,
    city: place.city,
    category: place.userCategory,
    type: place.setting,
    description: place.description,
    coordinates: place.coordinates,
  }))
  const events = catalog.events.map((event) => ({
    id: event.id,
    name: event.label,
    city: event.city,
    category: event.userCategory,
    type: event.setting,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
  }))
  const weather = catalog.weather.map((item) => ({
    date: item.date,
    outdoorScore: item.outdoorScore,
    recommendation: item.recommendation,
  }))

  const responseSchema = {
    title: 'string',
    summary: 'string',
    days: [{
      date: 'YYYY-MM-DD',
      label: 'string',
      theme: 'string',
      morning: { title: 'string', place: 'string', reason: 'string', setting: 'string' },
      midday: { title: 'string', place: 'string', reason: 'string', setting: 'string' },
      afternoon: { title: 'string', place: 'string', reason: 'string', setting: 'string' },
      evening: { title: 'string', place: 'string', reason: 'string', setting: 'string' },
      weatherNote: 'string',
      transportNote: 'string',
      notes: ['string'],
    }],
    packingTips: ['string'],
    transportNotes: ['string'],
    backupPlan: ['string'],
    sources: {
      catalogSource: 'string',
      selectedZone: 'string',
      selectedSites: ['string'],
    },
  }

  return `Eres un planificador turístico experto en Euskadi. Genera un itinerario usando únicamente los lugares, eventos y clima proporcionados.

PREFERENCIAS DE USUARIO DEL VIAJE:
${JSON.stringify(input, null, 2)}

DATOS FILTRADOS A TENER EN CUENTA:
${JSON.stringify({ places, events, weather }, null, 2)}

CLASIFICACIÓN:
${JSON.stringify(rankings, null, 2)}

REGLAS OBLIGATORIAS:
1. Respeta las fechas, planes, transporte, ritmo, presupuesto y número de personas.
2. No inventes lugares, eventos, fechas ni datos meteorológicos.
3. Usa null cuando un bloque del día no tenga una actividad adecuada.
4. Responde únicamente con JSON válido, sin Markdown, sin comentarios y sin texto adicional.
5. Mantén exactamente las claves, tipos y estructura de este esquema. No añadas, elimines ni renombres propiedades:
${JSON.stringify(responseSchema, null, 2)}

Cada actividad debe tener esta estructura cuando no sea null: {"title":"string","place":"string","reason":"string","setting":"string"}.`
}

export function normalizeTripRequest(input = {}) {
  const sites = Array.isArray(input.sites) ? input.sites : Array.isArray(input.siteIds) ? input.siteIds : []
  const plans = Array.isArray(input.plans) ? input.plans.filter(Boolean).map(String) : []

  return {
    startDate: String(input.startDate ?? input.from ?? ''),
    endDate: String(input.endDate ?? input.to ?? ''),
    zone: normalizeString(input.zone ?? input.area ?? 'bilbao-metro', 'bilbao-metro'),
    preference: normalizeString(input.preference ?? input.planPreference ?? 'indiferente', 'indiferente'),
    transport: normalizeString(input.transport ?? input.transportMode ?? 'publico', 'publico'),
    pace: normalizeString(input.pace ?? input.tripPace ?? 'equilibrado', 'equilibrado'),
    budget: normalizeString(input.budget ?? 'medio', 'medio'),
    partySize: toPositiveInteger(input.partySize ?? input.travelers, 2),
    accessibility: normalizeString(input.accessibility ?? 'normal', 'normal'),
    focus: normalizeString(input.focus ?? 'equilibrio', 'equilibrio'),
    sites: sites.filter(Boolean).map((site) => String(site)).slice(0, 3),
    plans,
    notes: String(input.notes ?? ''),
  }
}

export function validateTripRequest(request) {
  const errors = []
  const startDate = toDate(request.startDate)
  const endDate = toDate(request.endDate)
  const today = startOfDay(new Date())
  const maxDate = addMonths(today, MAX_PLAN_MONTHS)

  if (!startDate) {
    errors.push('La fecha de inicio es obligatoria.')
  }

  if (!endDate) {
    errors.push('La fecha de fin es obligatoria.')
  }

  if (startDate && startDate < today) {
    errors.push('La fecha de inicio no puede ser anterior a hoy.')
  }

  if (endDate && endDate > maxDate) {
    errors.push('La fecha de fin no puede superar los tres meses a partir de hoy.')
  }

  if (startDate && endDate && endDate < startDate) {
    errors.push('La fecha de fin debe ser posterior o igual a la fecha de inicio.')
  }

  if (request.sites.length > 3) {
    errors.push('Solo se permiten hasta tres sitios por solicitud.')
  }

  if (request.preference && !preferenceOptions.some((item) => item.value === request.preference)) {
    errors.push('La preferencia de plan no es valida.')
  }

  if (request.zone && !zoneOptions.some((item) => item.id === request.zone)) {
    errors.push('La zona elegida no es valida.')
  }

  if (request.transport && !transportOptions.some((item) => item.value === request.transport)) {
    errors.push('El tipo de transporte no es valido.')
  }

  if (request.pace && !paceOptions.some((item) => item.value === request.pace)) {
    errors.push('El ritmo del viaje no es valido.')
  }

  return errors
}

function scoreItem(item, request) {
  let score = Number(item.priority ?? 70)
  const selectedZone = getZoneById(request.zone)

  if (request.sites.includes(item.id)) {
    score += 60
  }

  if (selectedZone) {
    if (Array.isArray(selectedZone.siteIds) && selectedZone.siteIds.includes(item.id)) {
      score += 40
    }

    if (selectedZone.province === item.province) {
      score += 20
    }

    if (Array.isArray(selectedZone.cities) && selectedZone.cities.includes(item.city)) {
      score += 15
    }

    const selectedTerritoryCodes = getSelectedTerritoryCodes(selectedZone)
    if (selectedTerritoryCodes.some((code) => getItemTerritoryCodes(item).includes(code))) {
      score += 30
    }
  }

  if (request.preference !== 'indiferente') {
    if (item.setting === request.preference) {
      score += 25
    }

    if (Array.isArray(item.tags) && item.tags.includes(request.preference)) {
      score += 10
    }
  }

  if (request.plans?.includes(item.userCategory)) {
    score += 35
  }

  if (request.pace === 'relajado' && Number(item.durationHours ?? 2) <= 3) {
    score += 10
  }

  if (request.pace === 'intenso' && Number(item.durationHours ?? 2) >= 3) {
    score += 10
  }

  return score
}

function rankItems(items, request) {
  return [...items]
    .map((item) => ({ ...item, score: scoreItem(item, request) }))
    .sort((left, right) => right.score - left.score)
}

function getTripDays(request) {
  const startDate = toDate(request.startDate)
  const endDate = toDate(request.endDate)

  if (!startDate || !endDate) {
    return []
  }

  const days = []
  let cursor = startDate

  while (cursor <= endDate) {
    days.push(new Date(cursor))
    cursor = addDays(cursor, 1)
  }

  return days
}

function createDayPlan(date, index, anchorItems, request, weatherNote) {
  const rotation = index % Math.max(anchorItems.length, 1)
  const orderedItems = anchorItems.slice(rotation).concat(anchorItems.slice(0, rotation))
  const morning = orderedItems[0] ?? null
  const midday = orderedItems[1] ?? orderedItems[0] ?? null
  const afternoon = orderedItems[2] ?? orderedItems[1] ?? orderedItems[0] ?? null
  const weatherSummary =
    typeof weatherNote === 'string'
      ? weatherNote
      : [weatherNote?.label, weatherNote?.recommendation].filter(Boolean).join(' ')

  return {
    date: isoDate(date),
    label: formatDate(date),
    theme: request.preference === 'indiferente' ? 'Plan mixto' : `${request.preference} en Euskadi`,
    morning: morning
      ? {
          title: morning.label,
          place: morning.city,
          reason: morning.description,
          setting: morning.setting,
        }
      : null,
    midday: midday
      ? {
          title: midday.label,
          place: midday.city,
          reason: midday.description,
          setting: midday.setting,
        }
      : null,
    afternoon: afternoon
      ? {
          title: afternoon.label,
          place: afternoon.city,
          reason: afternoon.description,
          setting: afternoon.setting,
        }
      : null,
    evening: {
      title: request.transport === 'publico' ? 'Cierre con movilidad ligera' : 'Cierre flexible y gastronomico',
      place: request.transport === 'publico' ? 'Centro urbano' : 'Zona de alojamiento',
      reason: 'Momento para descansar, cenar y preparar el siguiente bloque.',
      setting: 'indoor',
    },
    weatherNote: weatherSummary,
    transportNote:
      request.transport === 'publico'
        ? 'Prioriza trazados urbanos y conexiones cortas en transporte publico.'
        : request.transport === 'a pie'
          ? 'El recorrido favorece paseos compactos y transiciones cortas.'
          : 'La ruta admite desplazamientos flexibles entre puntos con vehiculo propio.',
    notes: [
      request.notes ? `Nota del usuario: ${request.notes}` : null,
      request.accessibility !== 'normal' ? `Accesibilidad declarada: ${request.accessibility}` : null,
    ].filter(Boolean),
  }
}

function buildPackingTips(request) {
  const tips = [
    'Lleva calzado comodo y una capa ligera impermeable.',
    'Reserva hueco para gastronomia local y tiempos de traslado.',
  ]

  if (request.preference === 'outdoor') {
    tips.unshift('Incluye proteccion solar y agua suficiente para recorridos al aire libre.')
  }

  if (request.preference === 'indoor') {
    tips.unshift('Comprueba horarios y posibles reservas previas en museos y centros culturales.')
  }

  return tips
}

function buildFallbackItinerary(request, catalog) {
  const selectedZone = getZoneById(request.zone) ?? zoneOptions[0]
  const rankedPlaces = rankItems(catalog.places.length ? catalog.places : siteOptions, request)
  const rankedEvents = rankItems(catalog.events.length ? catalog.events : eventOptions, request)
  const primaryAnchors = rankedPlaces.slice(0, 6)
  const weatherNotes = catalog.weather.length
    ? catalog.weather
    : [
        {
          label: 'Clima variable, con margen para indoor y outdoor.',
          recommendation: 'Combina un punto cubierto con uno exterior por jornada.',
        },
      ]

  const days = getTripDays(request)

  return {
    title: `Itinerario inteligente para ${selectedZone?.label ?? 'Euskadi'} y ${days.length} dias`,
    summary:
      request.preference === 'indoor'
        ? 'Predomina la capa cultural indoor, con escapadas cortas y control de traslados.'
        : request.preference === 'outdoor'
          ? 'Ruta marcada por paisajes, costa y paradas de ritmo medio o dinamico.'
          : 'Propuesta equilibrada entre cultura, naturaleza y gastronomia local.',
    days: days.map((date, index) =>
      createDayPlan(date, index, primaryAnchors, request, weatherNotes[index % weatherNotes.length])
    ),
    packingTips: buildPackingTips(request),
    transportNotes: [
      `Modo de transporte preferido: ${request.transport}`,
      request.partySize > 2 ? 'Se priorizan rutas faciles de coordinar para grupos.' : 'Se priorizan trayectos agiles y de baja friccion.',
    ],
    backupPlan: [
      'Si el tiempo cambia, intercambia el bloque outdoor por el museo o evento cultural mejor puntuado.',
      'Si el itinerario supera la energia prevista, reduce el ultimo bloque de la jornada a una cena tranquila.',
    ],
    sources: {
      catalogSource: catalog.source,
      selectedZone: selectedZone?.label ?? 'Todo Euskadi',
      selectedSites: getSitesByIds(request.sites).map((site) => site.label),
      rankedEvents: rankedEvents.slice(0, 3).map((event) => event.label),
    },
  }
}

function extractJson(text) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? trimmed

  try {
    return JSON.parse(candidate)
  } catch {
    const firstBrace = candidate.indexOf('{')
    const lastBrace = candidate.lastIndexOf('}')

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1))
      } catch {
        return null
      }
    }

    return null
  }
}

function normalizeGeminiPlan(parsedPlan, fallbackPlan) {
  if (!parsedPlan || typeof parsedPlan !== 'object') {
    return fallbackPlan
  }

  const candidateDays = Array.isArray(parsedPlan.days)
    ? parsedPlan.days
    : Array.isArray(parsedPlan.daily_plan)
      ? parsedPlan.daily_plan
      : fallbackPlan.days

  return {
    title: String(parsedPlan.title ?? fallbackPlan.title),
    summary: String(parsedPlan.summary ?? parsedPlan.overview ?? fallbackPlan.summary),
    days: candidateDays.map((day, index) => {
      const fallbackDay = fallbackPlan.days[index] ?? fallbackPlan.days[0] ?? null

      if (!fallbackDay) {
        return null
      }

      const safeDay = day && typeof day === 'object' ? day : {}

      return {
        date: String(safeDay.date ?? fallbackDay.date),
        label: String(safeDay.label ?? safeDay.title ?? fallbackDay.label),
        theme: String(safeDay.theme ?? fallbackDay.theme),
        morning: normalizeActivity(safeDay.morning, fallbackDay.morning),
        midday: normalizeActivity(safeDay.midday, fallbackDay.midday),
        afternoon: normalizeActivity(safeDay.afternoon, fallbackDay.afternoon),
        evening: normalizeActivity(safeDay.evening, fallbackDay.evening),
        weatherNote: String(safeDay.weatherNote ?? safeDay.weather ?? fallbackDay.weatherNote ?? ''),
        transportNote: String(safeDay.transportNote ?? fallbackDay.transportNote ?? ''),
        notes: Array.isArray(safeDay.notes) ? safeDay.notes.map(String) : fallbackDay.notes,
      }
    }),
    packingTips: Array.isArray(parsedPlan.packingTips) ? parsedPlan.packingTips : fallbackPlan.packingTips,
    transportNotes: Array.isArray(parsedPlan.transportNotes)
      ? parsedPlan.transportNotes
      : fallbackPlan.transportNotes,
    backupPlan: Array.isArray(parsedPlan.backupPlan) ? parsedPlan.backupPlan : fallbackPlan.backupPlan,
    sources: normalizeSources(parsedPlan.sources, fallbackPlan.sources),
  }
}

function normalizeActivity(activity, fallbackActivity) {
  if (activity === null) {
    return null
  }

  const candidate = activity && typeof activity === 'object' ? activity : fallbackActivity

  if (!candidate) {
    return null
  }

  return {
    title: String(candidate.title ?? ''),
    place: String(candidate.place ?? ''),
    reason: String(candidate.reason ?? ''),
    setting: String(candidate.setting ?? ''),
  }
}

function toPromptItem(item) {
  return {
    id: item.id,
    name: item.label,
    city: item.city,
    territoryCodes: item.territoryCodes ?? [],
    category: item.userCategory,
    type: item.setting,
    score: item.score,
  }
}

export async function planTrip(input = {}) {
  const request = normalizeTripRequest(input)
  const errors = validateTripRequest(request)
  const selectedZone = getZoneById(request.zone) ?? zoneOptions[0]

  if (errors.length) {
    const error = new Error(errors[0])
    error.statusCode = 400
    error.errors = errors
    throw error
  }

  const catalog = await fetchCatalogSnapshot(request)
  const fallbackPlan = buildFallbackItinerary(request, catalog)

  const rankings = {
    places: rankItems(catalog.places.length ? catalog.places : getCatalogSeed().places, request).slice(0, 8).map(toPromptItem),
    events: rankItems(catalog.events.length ? catalog.events : getCatalogSeed().events, request).slice(0, 5).map(toPromptItem),
  }
  const debugPrompt = buildGeminiPrompt(request, catalog, selectedZone, rankings)
  const geminiResult = await generateItineraryWithGemini(debugPrompt)
  const parsed = geminiResult.text ? extractJson(geminiResult.text) : null
  const itinerary = parsed ? normalizeGeminiPlan(parsed, fallbackPlan) : fallbackPlan
  const aiSucceeded = Boolean(parsed)

  return {
    ok: true,
    source: aiSucceeded ? `gemini:${catalog.source}` : `fallback:${catalog.source}`,
    request: {
      ...request,
      startDate: isoDate(toDate(request.startDate)),
      endDate: isoDate(toDate(request.endDate)),
    },
    catalogSummary: {
      source: catalog.source,
      selectedZone: selectedZone?.label ?? 'Todo Euskadi',
      places: catalog.places.length,
      events: catalog.events.length,
      weatherBands: catalog.weather.length,
      previewDates: getTripDays(request).slice(0, 3).map((date) => isoDate(date)),
    },
    prompt: debugPrompt,
    promptMetadata: {
      mongoSource: catalog.source,
      filters: catalog.filters ?? null,
      collections: ['events_user_category', 'visit_points_user_category', 'weather_prediction_scoring'],
    },
    ai: {
      ok: aiSucceeded,
      model: geminiResult.model,
      responseCode: geminiResult.responseCode ?? null,
      attempts: geminiResult.attempts,
      fallbackReason: aiSucceeded ? null : geminiResult.reason ?? 'invalid_json_response',
    },
    itinerary,
  }
}

function normalizeSources(sources, fallbackSources) {
  const candidate = sources && typeof sources === 'object' ? sources : fallbackSources

  return {
    catalogSource: String(candidate?.catalogSource ?? ''),
    selectedZone: String(candidate?.selectedZone ?? ''),
    selectedSites: Array.isArray(candidate?.selectedSites) ? candidate.selectedSites.map(String) : [],
  }
}