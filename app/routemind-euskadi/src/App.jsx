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
  Mail,
  WandSparkles,
  ChevronDown,
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
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
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
    title: 'Explora sin fricción',
    text: 'Empieza por una zona y deja que la app te guíe a sitios coherentes con ese territorio.',
  },
  {
    icon: Compass,
    title: 'Selecciona tus sitios',
    text: 'Combina lugares principales, eventos y puntos de interés sin saturar la experiencia.',
  },
  {
    icon: CloudSun,
    title: 'Genera cuando quieras',
    text: 'Puedes ajustar la zona y volver a crear el itinerario tantas veces como desees.',
  },
]

function MetricCard({ icon: Icon, title, text }) {
  return (
    <div className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl transition duration-300 hover:border-emerald-500/30 hover:bg-white/[0.05]">
      <div className="flex flex-col gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 transition-transform duration-300 group-hover:-translate-y-1 group-hover:bg-emerald-500/20">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
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

function EuskadiFlag() {
  return <img src="/Flag.svg" alt="Bandera de Euskadi" className="h-6 w-9 rounded-[4px] border border-white/10 object-cover shadow-sm" />
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
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_24px_100px_rgba(2,6,23,0.3)] backdrop-blur-md">
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

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-4 lg:p-4">
        <div className="map-shell map-preview-map h-[34rem] min-h-[28rem] lg:h-[40rem] lg:rounded-[1.6rem]">
          <MapContainer center={mapCenter} zoom={8} scrollWheelZoom={false} className="h-full w-full">
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

        <aside className="map-preview-sidebar border-t border-white/10 bg-slate-950/92 p-4 backdrop-blur-xl lg:sticky lg:top-4 lg:self-start lg:rounded-[1.6rem] lg:border lg:border-white/10 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Zonas</p>
              <h4 className="mt-2 text-lg font-semibold text-white">Explora sin salir</h4>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
              {zoneOptions.length} opciones
            </span>
          </div>

          <div className="mt-4 grid max-h-[26rem] gap-3 overflow-y-auto pr-1 lg:max-h-[32rem]">
            {zoneOptions.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone.id)}
                className={[
                  'rounded-2xl border p-4 text-left transition-all duration-200',
                  selectedZone?.id === zone.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_28px_rgba(16,185,129,0.12)]'
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
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-[#07131f]">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-slate-200">
              <EuskadiFlag />
              <span className="text-slate-100">RouteMind Euskadi</span>
            </div>
            <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Hecho por Angélica Pineda
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-[15px]">
              Una plataforma abierta para convertir la planificación de turismo en Euskadi en una experiencia más clara, inspiradora y humana: descubrir, combinar y generar rutas con criterio.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">CONTACTO</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="https://www.linkedin.com/in/angelica-pineda-martinez-8094a6186/"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link group flex items-center gap-3 text-slate-300 transition hover:text-white"
                  >
                    <span className="footer-link-icon text-emerald-300"><LinkedinMark /></span>
                    <span className="border-b border-transparent pb-0.5 transition group-hover:border-emerald-400/50">LinkedIn</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-emerald-300" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Angelica-Pineda"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link group flex items-center gap-3 text-slate-300 transition hover:text-white"
                  >
                    <span className="footer-link-icon text-emerald-300"><GithubMark /></span>
                    <span className="border-b border-transparent pb-0.5 transition group-hover:border-emerald-400/50">GitHub</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-emerald-300" />
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:angelicap2298@gmail.com"
                    className="footer-link group flex items-center gap-3 text-slate-300 transition hover:text-white"
                  >
                    <span className="footer-link-icon text-emerald-300">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="border-b border-transparent pb-0.5 transition group-hover:border-emerald-400/50">angelicap2298@gmail.com</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Open source</p>
              <a
                href="https://github.com/Angelica-Pineda/routemind-euskadi"
                target="_blank"
                rel="noreferrer"
                className="footer-link group mt-4 flex items-center gap-3 text-sm text-slate-300 transition hover:text-white"
              >
                <span className="footer-link-icon text-emerald-300"><Route className="h-4 w-4" /></span>
                <span className="border-b border-transparent pb-0.5 transition group-hover:border-emerald-400/50">Repositorio del proyecto</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-emerald-300" />
              </a>
              <p className="mt-3 text-xs leading-6 text-slate-400">
                Código, estructura y evolución completa del proyecto.
              </p>
            </div>
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
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Día {index + 1}</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{day.label ?? day.date}</h4>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {day.theme}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Mañana', day.morning],
          ['Mediodía', day.midday],
          ['Tarde', day.afternoon],
          ['Noche', day.evening],
        ].map(([label, block]) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
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
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-slate-400">Meteorología</span>
          <p className="mt-2 leading-6">{day.weatherNote || 'La API generó una propuesta adaptada al contexto disponible.'}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-slate-400">Transporte</span>
          <p className="mt-2 leading-6">{day.transportNote || 'La movilidad se ajusta al modo elegido.'}</p>
        </div>
      </div>

      {Array.isArray(day.notes) && day.notes.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {day.notes.map((note) => (
            <span key={note} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
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
        if (!cancelled) setHealth({ state: 'online', label: payload.service || 'API interna activa' })
      })
      .catch(() => {
        if (!cancelled) setHealth({ state: 'offline', label: 'La API interna no responde todavía' })
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
        return { ...current, sites: current.sites.filter((item) => item !== siteId) }
      }
      if (current.sites.length >= 3) return current
      return { ...current, sites: [...current.sites, siteId] }
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

  const scrollToMap = () => {
    document.getElementById('mapa-zonas')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* ========================================
        NEW HERO SECTION (100dvh, Minimalist)
        ========================================
      */}
      <header className="relative flex h-[100dvh] min-h-[600px] w-full flex-col justify-between overflow-hidden">
        
        {/* Creative Euskadi Flag Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/Flag.svg" 
            alt="Fondo Euskadi" 
            className="h-full w-full object-cover opacity-20 mix-blend-screen grayscale-[30%]" 
          />
          {/* Gradients to blend flag and create dark sleek mood */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        </div>

        {/* Hero Top Nav / Logo placeholder */}
        <div className="relative z-10 flex w-full items-center justify-between p-6 sm:p-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-lg border border-white/10 p-0.5 shadow-lg">
              <EuskadiFlag />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
              RouteMind
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
            <BadgeCheck className="h-3.5 w-3.5" />
            {health.label}
          </div>
        </div>

        {/* Hero Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 text-center sm:px-6"
        >
          <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
            Descubre Euskadi <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-100 bg-clip-text text-transparent">
              a tu propio ritmo.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg lg:text-xl">
            Genera itinerarios vivos, visuales y adaptados a tus gustos. Planificación turística inteligente lista para repetirse cuantas veces quieras.
          </p>
          
          <div className="mt-10 flex justify-center">
            <button 
              onClick={scrollToMap}
              className="group flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-white/10"
            >
              <ChevronDown className="h-6 w-6 text-emerald-300 transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </motion.div>

        {/* Hero Floating Metrics Container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full pb-8 pt-4"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
            {heroMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </motion.div>
      </header>

      {/* ========================================
        MAIN CONTENT (Separated from header)
        ========================================
      */}
      <main id="mapa-zonas" className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:gap-14 lg:px-8 lg:py-24">
        
        <section className="space-y-8">
          <MapZonePreview selectedZone={selectedZone} onSelectZone={handleZoneSelect} />

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Zona elegida</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Tu base territorial para este viaje</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200">
                <LocateFixed className="h-4 w-4 text-emerald-300" />
                {selectedZone?.label}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedZone?.cities?.map((city) => (
                <span key={city} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {city}
                </span>
              ))}
            </div>
          </motion.section>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Planificador</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Ajusta tu viaje</h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200">
                {tripDurationDays} días
              </span>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Fecha desde</span>
                <input
                  type="date"
                  value={form.startDate}
                  min={defaultStartDate}
                  max={maxDate}
                  onChange={(event) => updateField('startDate', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Fecha hasta</span>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || defaultStartDate}
                  max={maxDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Preferencia</span>
                <select
                  value={form.preference}
                  onChange={(event) => updateField('preference', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                >
                  {preferenceOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Transporte</span>
                <select
                  value={form.transport}
                  onChange={(event) => updateField('transport', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                >
                  {transportOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Ritmo</span>
                <select
                  value={form.pace}
                  onChange={(event) => updateField('pace', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                >
                  {paceOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Presupuesto</span>
                <select
                  value={form.budget}
                  onChange={(event) => updateField('budget', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                >
                  {['bajo', 'medio', 'alto'].map((option) => (
                    <option key={option} value={option} className="bg-slate-900 capitalize">
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Personas</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.partySize}
                  onChange={(event) => updateField('partySize', Number(event.target.value) || 1)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Accesibilidad</span>
                <select
                  value={form.accessibility}
                  onChange={(event) => updateField('accessibility', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                >
                  {['normal', 'step-free', 'low-walk', 'high-comfort'].map((option) => (
                    <option key={option} value={option} className="bg-slate-900">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/5 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Sitios clave</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Guía la inteligencia artificial</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Marca hasta tres lugares imprescindibles para ti. De esta manera Gemini estructurará un viaje armónico a su alrededor.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
                  {selectedZone?.province}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
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
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300',
                        active
                          ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10',
                        disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {site.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Instrucciones o contexto adicional (Opcional)</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={3}
                  placeholder="Ej: Viaje de aniversario, buscamos probar sidrerías, preferimos evitar madrugar."
                  className="resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-white/10"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/5 pt-8">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group inline-flex items-center gap-3 rounded-full bg-emerald-400 px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Generando magia...
                  </>
                ) : (
                  <>
                    Generar Itinerario
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <span className="text-sm text-slate-500">
                Modifica y regenera sin límite.
              </span>
            </div>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200"
                >
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold text-rose-100">Algo no ha ido bien</p>
                      <p className="mt-1 text-rose-300/80">{error}</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.form>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Resultado</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Tu ruta planificada</h2>
              </div>
              {status === 'loading' ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  <LoaderCircle className="h-4 w-4 animate-spin text-emerald-400" />
                  Conectando...
                </span>
              ) : result ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  {result.source}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                  <Sparkles className="h-4 w-4" />
                  Esperando consulta
                </span>
              )}
            </div>

            <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
              {result ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                      <Route className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{result.itinerary?.title || 'Itinerario listo'}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{result.itinerary?.summary}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Zona</p>
                      <p className="mt-2 font-medium text-white">{result.catalogSummary?.selectedZone || selectedZone?.label}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Sitios</p>
                      <p className="mt-2 font-medium text-white">{result.catalogSummary?.places ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Eventos</p>
                      <p className="mt-2 font-medium text-white">{result.catalogSummary?.events ?? 0}</p>
                    </div>
                  </div>

                  <div className="mt-8 max-h-[45rem] space-y-5 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {Array.isArray(result.itinerary?.days) && result.itinerary.days.length ? (
                      result.itinerary.days.map((day, index) => <DayCard key={`${day.date}-${index}`} day={day} index={index} />)
                    ) : (
                      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-slate-400">
                        Los detalles del viaje aparecerán aquí.
                      </div>
                    )}
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Tips de equipaje</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(result.itinerary?.packingTips || []).map((tip) => (
                          <span key={tip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                            {tip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-300">Plan B</p>
                      <ul className="mt-4 space-y-3 text-sm text-slate-300">
                        {(result.itinerary?.backupPlan || []).map((item) => (
                          <li key={item} className="flex gap-3 leading-relaxed">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/80" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <MapPin className="h-4 w-4 text-emerald-300" />
                      Transporte y contexto
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(result.itinerary?.transportNotes || []).map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-slate-900/50 px-4 py-1.5 text-xs text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Cómo funciona</p>
                    <div className="mt-6 space-y-6 text-sm text-slate-300">
                      <div className="flex gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-semibold text-emerald-300">1</div>
                        <p className="pt-1.5">Navega por el mapa de arriba y elige la zona que servirá como centro base.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-semibold text-emerald-300">2</div>
                        <p className="pt-1.5">Personaliza filtros, marca hasta tres sitios favoritos y añade el contexto extra.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-semibold text-emerald-300">3</div>
                        <p className="pt-1.5">Pulsa <span className="font-semibold text-emerald-100">Generar Itinerario</span> para desatar la magia de la inteligencia artificial.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <WandSparkles className="h-4 w-4 text-emerald-300" />
                      Ideas para probar
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-400">
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Prueba "Transporte público" vs "Coche"</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Viaje lento vs Acelerado</span>
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