import { eventOptions, getCatalogSeed, getSitesByIds, paceOptions, preferenceOptions, siteOptions, transportOptions } from '../../shared/catalog.js'
import { fetchCatalogSnapshot } from './mongo.js'
import { generateItineraryWithGemini } from './gemini.js'

const MAX_PLAN_MONTHS = 3

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

export function normalizeTripRequest(input = {}) {
  const sites = Array.isArray(input.sites) ? input.sites : Array.isArray(input.siteIds) ? input.siteIds : []

  return {
    startDate: String(input.startDate ?? input.from ?? ''),
    endDate: String(input.endDate ?? input.to ?? ''),
    preference: normalizeString(input.preference ?? input.planPreference ?? 'indiferente', 'indiferente'),
    transport: normalizeString(input.transport ?? input.transportMode ?? 'publico', 'publico'),
    pace: normalizeString(input.pace ?? input.tripPace ?? 'equilibrado', 'equilibrado'),
    budget: normalizeString(input.budget ?? 'medio', 'medio'),
    partySize: toPositiveInteger(input.partySize ?? input.travelers, 2),
    accessibility: normalizeString(input.accessibility ?? 'normal', 'normal'),
    focus: normalizeString(input.focus ?? 'equilibrio', 'equilibrio'),
    sites: sites.filter(Boolean).map((site) => String(site)).slice(0, 3),
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

  if (request.sites.includes(item.id)) {
    score += 60
  }

  if (request.preference !== 'indiferente') {
    if (item.setting === request.preference) {
      score += 25
    }

    if (Array.isArray(item.tags) && item.tags.includes(request.preference)) {
      score += 10
    }
  }

  if (request.transport && Array.isArray(item.transport) && item.transport.includes(request.transport)) {
    score += 15
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
    title: `Itinerario inteligente para ${days.length} dias en Euskadi`,
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
        return day
      }

      return {
        date: String(day.date ?? fallbackDay.date),
        label: String(day.label ?? day.title ?? fallbackDay.label),
        theme: String(day.theme ?? fallbackDay.theme),
        morning: day.morning ?? fallbackDay.morning,
        midday: day.midday ?? fallbackDay.midday,
        afternoon: day.afternoon ?? fallbackDay.afternoon,
        evening: day.evening ?? fallbackDay.evening,
        weatherNote: String(day.weatherNote ?? day.weather ?? fallbackDay.weatherNote ?? ''),
        transportNote: String(day.transportNote ?? fallbackDay.transportNote ?? ''),
        notes: Array.isArray(day.notes) ? day.notes : fallbackDay.notes,
      }
    }),
    packingTips: Array.isArray(parsedPlan.packingTips) ? parsedPlan.packingTips : fallbackPlan.packingTips,
    transportNotes: Array.isArray(parsedPlan.transportNotes)
      ? parsedPlan.transportNotes
      : fallbackPlan.transportNotes,
    backupPlan: Array.isArray(parsedPlan.backupPlan) ? parsedPlan.backupPlan : fallbackPlan.backupPlan,
    sources: parsedPlan.sources ?? fallbackPlan.sources,
  }
}

export async function planTrip(input = {}) {
  const request = normalizeTripRequest(input)
  const errors = validateTripRequest(request)

  if (errors.length) {
    const error = new Error(errors[0])
    error.statusCode = 400
    error.errors = errors
    throw error
  }

  const catalog = await fetchCatalogSnapshot(request)
  const fallbackPlan = buildFallbackItinerary(request, catalog)

  const promptPayload = {
    request,
    metadata: {
      generatedAt: new Date().toISOString(),
      maxPlanMonths: MAX_PLAN_MONTHS,
      allowedPreferences: preferenceOptions,
      allowedTransportModes: transportOptions,
      allowedPaceOptions: paceOptions,
    },
    catalogSummary: {
      source: catalog.source,
      places: catalog.places.slice(0, 12),
      events: catalog.events.slice(0, 8),
      weather: catalog.weather.slice(0, 6),
    },
    suggestedRankings: {
      places: rankItems(catalog.places.length ? catalog.places : getCatalogSeed().places, request)
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          label: item.label,
          city: item.city,
          province: item.province,
          setting: item.setting,
          description: item.description,
          score: item.score,
        })),
      events: rankItems(catalog.events.length ? catalog.events : getCatalogSeed().events, request)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          label: item.label,
          city: item.city,
          province: item.province,
          setting: item.setting,
          description: item.description,
          score: item.score,
        })),
    },
    responseRules: {
      format: 'json',
      requiredKeys: ['title', 'summary', 'days', 'packingTips', 'transportNotes', 'backupPlan', 'sources'],
      note: 'Return a concise but complete trip itinerary in JSON only.',
    },
  }

  const geminiText = await generateItineraryWithGemini(promptPayload)
  const parsed = geminiText ? extractJson(geminiText) : null
  const itinerary = parsed ? normalizeGeminiPlan(parsed, fallbackPlan) : fallbackPlan

  return {
    ok: true,
    source: geminiText ? `gemini:${catalog.source}` : `fallback:${catalog.source}`,
    request: {
      ...request,
      startDate: isoDate(toDate(request.startDate)),
      endDate: isoDate(toDate(request.endDate)),
    },
    catalogSummary: {
      source: catalog.source,
      places: catalog.places.length,
      events: catalog.events.length,
      weatherBands: catalog.weather.length,
      previewDates: getTripDays(request).slice(0, 3).map((date) => isoDate(date)),
    },
    itinerary,
  }
}