import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import L from 'leaflet'
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CircleAlert,
  CloudSun,
  Compass,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Route,
  Sparkles,
  ExternalLink,
  WandSparkles,
} from 'lucide-react'
import { paceOptions, preferenceOptions, siteOptions, transportOptions, zoneOptions } from '../shared/catalog.js'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { requestApiHealth, requestItinerary } from './lib/plannerClient.js'
import './App.css'
import 'leaflet/dist/leaflet.css'

function formatDateInput(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const clone = new Date(date)
  clone.setDate(clone.getDate() + days)
  return clone
}

function addMonths(date, months) {
  const clone = new Date(date)
  clone.setMonth(clone.getMonth() + months)
  return clone
}

function getDateSpan(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  const dayMs = 1000 * 60 * 60 * 24
  return Math.max(1, Math.round((end - start) / dayMs) + 1)
}

const defaultStartDate = formatDateInput(new Date())
const defaultEndDate = formatDateInput(addDays(new Date(), 2))
const maxDate = formatDateInput(addMonths(new Date(), 3))

const initialFormState = {
  startDate: defaultStartDate,
  endDate: defaultEndDate,
  zone: 'bilbao-metro',
  preference: 'indiferente',
  transport: 'publico',
  pace: 'equilibrado',
  budget: 'medio',
  partySize: 2,
  accessibility: 'normal',
  focus: 'equilibrio',
  notes: '',
  sites: ['guggenheim-bilbao', 'casco-viejo-bilbao'],
}

const heroMetrics = [
  {
    icon: BrainCircuit,
    title: 'Explora sin friccion',
    text: 'Empieza por una zona y deja que la app te guie a sitios coherentes con ese territorio.',
  },
  {
    icon: Compass,
    title: 'Selecciona hasta 3 sitios',
    text: 'Combina lugares principales, eventos y puntos de interes sin saturar la experiencia.',
  },
  {
    icon: CloudSun,
    title: 'Genera cuando quieras',
    text: 'Puedes ajustar la zona y volver a crear el itinerario tantas veces como quieras.',
  },
]

function MetricCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-300">{text}</p>
        </div>
      </div>
    </div>
  )
}

function LinkedinMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M19.5 3H4.5A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3ZM8.25 18H5.5v-8.5h2.75V18ZM6.88 8.46A1.61 1.61 0 1 1 6.9 5.24a1.61 1.61 0 0 1-.02 3.22ZM18 18h-2.75v-4.14c0-1-.02-2.27-1.38-2.27-1.38 0-1.59 1.08-1.59 2.19V18H9.53v-8.5h2.64v1.16h.04c.37-.7 1.27-1.45 2.61-1.45 2.8 0 3.32 1.84 3.32 4.23V18Z"/>
    </svg>
  )
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.72c-2.78.62-3.37-1.17-3.37-1.17-.46-1.2-1.12-1.52-1.12-1.52-.92-.65.07-.64.07-.64 1.02.07 1.56 1.07 1.56 1.07.9 1.59 2.36 1.13 2.93.86.09-.67.35-1.13.64-1.39-2.22-.26-4.56-1.13-4.56-5.05 0-1.12.39-2.04 1.03-2.76-.11-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.06a9.12 9.12 0 0 1 5 0c1.91-1.34 2.75-1.06 2.75-1.06.55 1.41.21 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.93-2.34 4.79-4.57 5.04.36.32.68.95.68 1.92v2.84c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z"/>
    </svg>
  )
}

function createZoneMarkerIcon(active) {
  return L.divIcon({
    className: 'route-marker-icon',
    html: `
      <div class="route-marker ${active ? 'route-marker--active' : ''}">
        <span></span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  })
}

function MapZonePreview({ selectedZone, onSelectZone }) {
  const mapCenter = selectedZone?.center ?? zoneOptions[0].center

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_24px_100px_rgba(2,6,23,0.3)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Mapa real</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Selecciona la zona con el mapa o con la lista</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
          <LocateFixed className="h-3.5 w-3.5 text-emerald-200" />
          {selectedZone?.label}
        </div>
      </div>

      <div className="map-preview-shell">
        <div className="map-shell map-preview-map h-[34rem] min-h-[28rem] lg:h-[40rem]">
          <MapContainer center={mapCenter} zoom={8} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {zoneOptions.map((zone) => {
              const active = selectedZone?.id === zone.id

              return (
                <Marker
                  key={zone.id}
                  position={zone.center}
                  icon={createZoneMarkerIcon(active)}
                  eventHandlers={{ click: () => onSelectZone(zone.id) }}
                >
                  <Popup>
                    <div className="max-w-[220px]">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{zone.shortLabel}</p>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900">{zone.label}</h4>
                      <p className="mt-2 text-sm text-slate-700">{zone.summary}</p>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>

        <aside className="map-preview-sidebar rounded-[2rem] border border-white/10 bg-slate-950/92 p-4 shadow-[0_24px_100px_rgba(2,6,23,0.3)] backdrop-blur-xl lg:absolute lg:right-4 lg:top-4 lg:w-[24rem] lg:max-w-[calc(100%-2rem)] lg:p-5 xl:w-[27rem]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Zonas</p>
              <h4 className="mt-2 text-lg font-semibold text-white">Explora y cambia sin salir del mapa</h4>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
              {zoneOptions.length} opciones
            </span>
          </div>

          <div className="mt-4 grid gap-3 max-h-[26rem] overflow-y-auto pr-1 lg:max-h-[32rem]">
            {zoneOptions.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone.id)}
                className={[
                  'rounded-2xl border p-4 text-left transition-all duration-200',
                  selectedZone?.id === zone.id
                    ? 'border-emerald-300/50 bg-emerald-300/10 shadow-[0_0_28px_rgba(16,185,129,0.12)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{zone.shortLabel}</p>
                    <h4 className="mt-1 text-base font-semibold text-white">{zone.label}</h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                    {zone.province}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{zone.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {zone.cities.slice(0, 3).map((city) => (
                    <span key={city} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      {city}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950/80">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_20%_120%,rgba(59,130,246,0.1),transparent_24%)]" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-none flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr_0.9fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-100">
              RouteMind Euskadi
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Proyecto open source creado para convertir la planificación de turismo en Euskadi en una experiencia más clara, inspiradora y útil: un punto de partida visual para descubrir territorio, combinar intereses y generar itinerarios con IA.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Autor del TFM</p>
            <div className="mt-4 space-y-3">
              <a
                href="https://www.linkedin.com/in/angelica-pineda-martinez-8094a6186/"
                target="_blank"
                rel="noreferrer"
                className="footer-link group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:bg-white/8"
              >
                <span className="flex items-center gap-3">
                  <span className="footer-link-icon text-emerald-200"><LinkedinMark /></span>
                  LinkedIn
                </span>
                <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-200" />
              </a>
              <a
                href="https://github.com/Angelica-Pineda"
                target="_blank"
                rel="noreferrer"
                className="footer-link group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:bg-white/8"
              >
                <span className="flex items-center gap-3">
                  <span className="footer-link-icon text-emerald-200"><GithubMark /></span>
                  GitHub
                </span>
                <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-200" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Proyecto open source</p>
            <a
              href="https://github.com/Angelica-Pineda/routemind-euskadi"
              target="_blank"
              rel="noreferrer"
              className="group mt-4 flex items-center justify-between rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-4 text-sm text-emerald-50 transition hover:border-emerald-300/40 hover:bg-emerald-300/15"
            >
              <span>
                Repositorio del proyecto
                <span className="mt-1 block text-xs text-emerald-100/80">Código, estructura y evolución completa</span>
              </span>
              <ExternalLink className="h-4 w-4 text-emerald-100 transition group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function DayCard({ day, index }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_16px_48px_rgba(2,6,23,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Dia {index + 1}</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{day.label ?? day.date}</h4>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {day.theme}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Mañana', day.morning],
          ['Mediodia', day.midday],
          ['Tarde', day.afternoon],
          ['Noche', day.evening],
        ].map(([label, block]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
            {block ? (
              <>
                <h5 className="mt-2 text-sm font-semibold text-white">{block.title}</h5>
                <p className="mt-2 text-xs leading-5 text-slate-300">{block.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  {block.place ? <span>{block.place}</span> : null}
                  {block.setting ? <span>{block.setting}</span> : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Sin datos</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-slate-400">Meteorologia</span>
          <p className="mt-2 leading-6">{day.weatherNote || 'La API genero una propuesta adaptada al contexto disponible.'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-slate-400">Transporte</span>
          <p className="mt-2 leading-6">{day.transportNote || 'La movilidad se ajusta al modo elegido por el usuario.'}</p>
        </div>
      </div>

      {Array.isArray(day.notes) && day.notes.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {day.notes.map((note) => (
            <span key={note} className="rounded-full border border-white/10 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
              {note}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function App() {
  const [form, setForm] = useState(initialFormState)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [health, setHealth] = useState({ state: 'checking', label: 'Comprobando API interna' })

  const selectedZone = useMemo(
    () => zoneOptions.find((zone) => zone.id === form.zone) ?? zoneOptions[0],
    [form.zone]
  )

  const selectedZoneSites = useMemo(
    () => siteOptions.filter((site) => selectedZone?.siteIds?.includes(site.id)),
    [selectedZone]
  )

  const tripDurationDays = useMemo(() => getDateSpan(form.startDate, form.endDate), [form.startDate, form.endDate])

  useEffect(() => {
    let cancelled = false

    requestApiHealth()
      .then((payload) => {
        if (!cancelled) {
          setHealth({ state: 'online', label: payload.service || 'API interna activa' })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({ state: 'offline', label: 'La API interna no responde todavia' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleZoneSelect(zoneId) {
    const zone = zoneOptions.find((item) => item.id === zoneId)

    setForm((current) => ({
      ...current,
      zone: zoneId,
      sites: zone?.siteIds?.length ? zone.siteIds.slice(0, 3) : current.sites,
    }))
  }

  function toggleSite(siteId) {
    setForm((current) => {
      const alreadySelected = current.sites.includes(siteId)

      if (alreadySelected) {
        return {
          ...current,
          sites: current.sites.filter((item) => item !== siteId),
        }
      }

      if (current.sites.length >= 3) {
        return current
      }

      return {
        ...current,
        sites: [...current.sites, siteId],
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const payload = await requestItinerary(form)
      setResult(payload)
      setStatus('success')
    } catch (requestError) {
      setStatus('error')
      setError(requestError.message || 'No se pudo generar el itinerario.')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="aurora-base pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="grid-layer pointer-events-none absolute inset-0" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-none flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-8">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl hero-orb" aria-hidden="true" />
          <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl hero-orb hero-orb-delayed" aria-hidden="true" />

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              RouteMind Euskadi
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-200" />
              {health.label}
            </span>
          </div>

          <div className="relative z-10 mt-6 max-w-3xl">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Crea tu itinerario por Euskadi con una experiencia visual, viva y lista para repetirse cuantas veces quieras.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Elige una zona en el mapa, ajusta tus preferencias y genera un itinerario nuevo cada vez que quieras explorar el territorio a tu ritmo.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </header>

        <section className="space-y-6">
          <MapZonePreview selectedZone={selectedZone} onSelectZone={handleZoneSelect} />

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.3)] backdrop-blur-xl sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Zona elegida</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Tu base territorial para este viaje</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <LocateFixed className="h-3.5 w-3.5 text-emerald-200" />
                {selectedZone?.label}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedZone?.cities?.map((city) => (
                <span key={city} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {city}
                </span>
              ))}
            </div>
          </motion.section>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.3)] backdrop-blur-xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Planificador</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Ajusta tu viaje</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {tripDurationDays} dias seleccionados
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Fecha desde</span>
                <input
                  type="date"
                  value={form.startDate}
                  min={defaultStartDate}
                  max={maxDate}
                  onChange={(event) => updateField('startDate', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Fecha hasta</span>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || defaultStartDate}
                  max={maxDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Preferencia de plan</span>
                <select
                  value={form.preference}
                  onChange={(event) => updateField('preference', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                >
                  {preferenceOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Transporte</span>
                <select
                  value={form.transport}
                  onChange={(event) => updateField('transport', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                >
                  {transportOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Ritmo del viaje</span>
                <select
                  value={form.pace}
                  onChange={(event) => updateField('pace', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                >
                  {paceOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Presupuesto</span>
                <select
                  value={form.budget}
                  onChange={(event) => updateField('budget', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                >
                  {['bajo', 'medio', 'alto'].map((option) => (
                    <option key={option} value={option} className="bg-slate-950">
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Tamaño del grupo</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.partySize}
                  onChange={(event) => updateField('partySize', Number(event.target.value) || 1)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Accesibilidad</span>
                <select
                  value={form.accessibility}
                  onChange={(event) => updateField('accessibility', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-300/60 focus:bg-white/8"
                >
                  {['normal', 'step-free', 'low-walk', 'high-comfort'].map((option) => (
                    <option key={option} value={option} className="bg-slate-950">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Sitios sugeridos por la zona</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">El mapa ya te da una base útil</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Toca un punto del mapa o usa la lista para activar hasta tres sitios. La selección previa ayuda a Gemini a construir un itinerario coherente.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                  {selectedZone?.province}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedZoneSites.map((site) => {
                  const active = form.sites.includes(site.id)
                  const disabled = !active && form.sites.length >= 3

                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => toggleSite(site.id)}
                      disabled={disabled}
                      className={[
                        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-200',
                        active
                          ? 'border-emerald-300/60 bg-emerald-300/15 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10',
                        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {site.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Notas o contexto adicional</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={4}
                  placeholder="Ejemplo: viaje en pareja, interes en gastronomia local y necesidad de alternar indoor/outdoor."
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:bg-white/8"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Generando itinerario
                  </>
                ) : (
                  <>
                    Generar itinerario
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <span className="text-sm text-slate-400">
                Puedes volver a generar tantas veces como quieras con la misma base territorial o cambiando de zona.
              </span>
            </div>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100"
                >
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">La solicitud no pudo completarse</p>
                      <p className="mt-1 leading-6">{error}</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.form>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.3)] backdrop-blur-xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Salida</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Itinerario generado</h2>
              </div>
              {status === 'loading' ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Procesando JSON
                </span>
              ) : result ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {result.source}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Esperando una consulta
                </span>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              {result ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-100">
                      <Route className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">{result.itinerary?.title || 'Itinerario listo'}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{result.itinerary?.summary || 'Tu itinerario aparece aquí con una lectura clara y reutilizable.'}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Zona</p>
                      <p className="mt-2 text-white">{result.catalogSummary?.selectedZone || selectedZone?.label || 'n/a'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Sitios</p>
                      <p className="mt-2 text-white">{result.catalogSummary?.places ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Eventos</p>
                      <p className="mt-2 text-white">{result.catalogSummary?.events ?? 0}</p>
                    </div>
                  </div>

                  <div className="mt-5 max-h-[38rem] space-y-4 overflow-y-auto pr-1">
                    {Array.isArray(result.itinerary?.days) && result.itinerary.days.length ? (
                      result.itinerary.days.map((day, index) => <DayCard key={`${day.date}-${index}`} day={day} index={index} />)
                    ) : (
                      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300">
                        Tu itinerario aparecerá aquí con bloques por día.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Consejos de equipaje</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(result.itinerary?.packingTips || []).map((tip) => (
                          <span key={tip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {tip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Plan B</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {(result.itinerary?.backupPlan || []).map((item) => (
                          <li key={item} className="flex gap-2 leading-6">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                    <p className="flex items-center gap-2 text-white">
                      <MapPin className="h-4 w-4 text-emerald-200" />
                      Transporte y contexto elegido
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(result.itinerary?.transportNotes || []).map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Como se usará</p>
                    <div className="mt-4 space-y-4 text-sm text-slate-300">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-100">1</div>
                        <p>Elige una zona en el mapa y afina tus preferencias.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-100">2</div>
                        <p>Marca hasta tres sitios y pulsa generar para crear una propuesta nueva.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-100">3</div>
                        <p>Repite el proceso tantas veces como quieras sin perder el contexto visual.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                    <p className="flex items-center gap-2 text-white">
                      <WandSparkles className="h-4 w-4 text-emerald-200" />
                      Atajos útiles
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Cambiar de zona</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Probar indoor/outdoor</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Ajustar transporte</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default App
