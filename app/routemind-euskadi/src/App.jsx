import { useEffect, useMemo, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import L from 'leaflet'
import { 
  RiArrowRightLine, 
  RiVerifiedBadgeFill, 
  RiErrorWarningLine, 
  RiLoader4Line, 
  RiFocus3Line, 
  RiMapPin2Line, 
  RiRouteLine, 
  RiSparklingFill, 
  RiExternalLinkLine, 
  RiMailSendLine, 
  RiMagicLine, 
  RiArrowDownSLine,
  RiLinkedinFill,
  RiGithubFill
} from 'react-icons/ri'
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

const heroCards = [
  {
    title: 'TERRITORIO\nA\nMEDIDA',
    text: 'Explora sin fricción',
    video: '/hero-video1.mp4',
  },
  {
    title: 'RITMO\nY\nEQUILIBRIO',
    text: 'Combina sitios clave',
    video: '/hero-video2.mp4',
  },
  {
    title: 'VIAJA\nEN\nLIBERTAD',
    text: 'Genera sin límites',
    video: '/hero-video3.mp4',
  },
]

function WindowVideoCard({ title, text, video }) {
  return (
    <div className="group relative flex h-[340px] w-[260px] flex-col justify-center overflow-hidden rounded-t-[10rem] rounded-b-[2rem] border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-700 hover:-translate-y-2 hover:border-orange-500/40 hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] sm:h-[400px] sm:w-[280px]">
      <video
        src={video}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/30 transition-colors duration-700 group-hover:bg-black/50" />
      
      <div className="relative z-10 flex flex-col items-center p-6 text-center">
        <h3 className="font-heading text-3xl font-light tracking-widest text-white drop-shadow-lg sm:text-4xl">
          {title.split('\n').map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h3>
        <div className="mt-6 overflow-hidden">
          <p className="translate-y-full text-[10px] uppercase tracking-[0.3em] text-zinc-100 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

function EuskadiFlag() {
  return <img src="/Flag.svg" alt="Bandera de Euskadi" className="h-6 w-9 rounded-[4px] border border-white/10 object-cover shadow-sm" />
}

function createZoneMarkerIcon(active) {
  return L.divIcon({
    className: 'route-marker-icon',
    html: `
      <div class="route-marker ${active ? 'route-marker--active-orange' : ''}">
        <span></span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  })
}

function ZoneMarker({ zone, active, onSelect }) {
  const markerRef = useRef(null)

  useEffect(() => {
    if (active && markerRef.current) {
      setTimeout(() => {
        markerRef.current.openPopup()
      }, 100) // Ligero retraso para asegurar fluidez de Leaflet
    }
  }, [active])

  return (
    <Marker
      position={zone.center}
      icon={createZoneMarkerIcon(active)}
      eventHandlers={{ click: () => onSelect(zone.id) }}
      ref={markerRef}
    >
      <Popup>
        <div className="max-w-[220px]">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{zone.shortLabel}</p>
          <h4 className="mt-1 text-sm font-semibold text-zinc-900">{zone.label}</h4>
          <p className="mt-2 text-sm text-zinc-700">{zone.summary}</p>
        </div>
      </Popup>
    </Marker>
  )
}

function MapZonePreview({ selectedZone, onSelectZone }) {
  const mapCenter = selectedZone?.center ?? zoneOptions[0].center

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-[0_24px_100px_rgba(9,9,11,0.5)] backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-400/80">Mapa real</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Selecciona la zona con el mapa o con la lista</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
          <RiFocus3Line className="h-3.5 w-3.5 text-orange-400" />
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
            {zoneOptions.map((zone) => (
              <ZoneMarker 
                key={zone.id} 
                zone={zone} 
                active={selectedZone?.id === zone.id} 
                onSelect={onSelectZone} 
              />
            ))}
          </MapContainer>
        </div>

        <aside className="map-preview-sidebar border-t border-white/10 bg-zinc-950/92 p-4 backdrop-blur-xl lg:sticky lg:top-4 lg:self-start lg:rounded-[1.6rem] lg:border lg:border-white/10 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-orange-400/80">Zonas</p>
              <h4 className="mt-2 text-lg font-semibold text-white">Explora sin salir</h4>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
              {zoneOptions.length} opciones
            </span>
          </div>

          {/* Scroll invisible */}
          <div className="mt-4 grid max-h-[26rem] gap-3 overflow-y-auto lg:max-h-[32rem] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {zoneOptions.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone.id)}
                className={[
                  'rounded-2xl border p-4 text-left transition-all duration-200',
                  selectedZone?.id === zone.id
                    ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_28px_rgba(249,115,22,0.12)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">{zone.shortLabel}</p>
                    <h4 className="mt-1 text-base font-semibold text-white">{zone.label}</h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                    {zone.province}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{zone.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {zone.cities.slice(0, 3).map((city) => (
                    <span key={city} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
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
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-[#09090b]">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-zinc-200">
              <EuskadiFlag />
              <span className="text-zinc-100">RouteMind Euskadi</span>
            </div>
            <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Hecho por Angélica Pineda
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-[15px]">
              Una plataforma abierta para convertir la planificación de turismo en Euskadi en una experiencia más clara, inspiradora y humana: descubrir, combinar y generar rutas con criterio.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">CONTACTO</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="https://www.linkedin.com/in/angelica-pineda-martinez-8094a6186/"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link group flex items-center gap-3 text-zinc-300 transition hover:text-white"
                  >
                    <span className="footer-link-icon text-orange-400"><RiLinkedinFill className="h-5 w-5" /></span>
                    <span className="border-b border-transparent pb-0.5 transition group-hover:border-orange-500/50">LinkedIn</span>
                    <RiExternalLinkLine className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-orange-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Angelica-Pineda"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link group flex items-center gap-3 text-zinc-300 transition hover:text-white"
                  >
                    <span className="footer-link-icon text-orange-400"><RiGithubFill className="h-5 w-5" /></span>
                    <span className="border-b border-transparent pb-0.5 transition group-hover:border-orange-500/50">GitHub</span>
                    <RiExternalLinkLine className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-orange-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:angelicap2298@gmail.com"
                    className="footer-link group flex items-center gap-3 text-zinc-300 transition hover:text-white"
                  >
                    <span className="footer-link-icon text-orange-400">
                      <RiMailSendLine className="h-5 w-5" />
                    </span>
                    <span className="border-b border-transparent pb-0.5 transition group-hover:border-orange-500/50">angelicap2298@gmail.com</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Open source</p>
              <a
                href="https://github.com/Angelica-Pineda/routemind-euskadi"
                target="_blank"
                rel="noreferrer"
                className="footer-link group mt-4 flex items-center gap-3 text-sm text-zinc-300 transition hover:text-white"
              >
                <span className="footer-link-icon text-orange-400"><RiRouteLine className="h-5 w-5" /></span>
                <span className="border-b border-transparent pb-0.5 transition group-hover:border-orange-500/50">Repositorio del proyecto</span>
                <RiExternalLinkLine className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-orange-400" />
              </a>
              <p className="mt-3 text-xs leading-6 text-zinc-400">
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
    <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_16px_48px_rgba(9,9,11,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-400/80">Día {index + 1}</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{day.label ?? day.date}</h4>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
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
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{label}</p>
            {block ? (
              <>
                <h5 className="mt-2 text-sm font-semibold text-white">{block.title}</h5>
                <p className="mt-2 text-xs leading-5 text-zinc-300">{block.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                  {block.place ? <span>{block.place}</span> : null}
                  {block.setting ? <span>{block.setting}</span> : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">Sin datos</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-zinc-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-zinc-400">Meteorología</span>
          <p className="mt-2 leading-6">{day.weatherNote || 'La API generó una propuesta adaptada al contexto disponible.'}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-zinc-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-zinc-400">Transporte</span>
          <p className="mt-2 leading-6">{day.transportNote || 'La movilidad se ajusta al modo elegido.'}</p>
        </div>
      </div>

      {Array.isArray(day.notes) && day.notes.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {day.notes.map((note) => (
            <span key={note} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-200">
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
    <div className="relative min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-orange-500/30 selection:text-orange-100">
      
      {/* HEADER HERO (Ocupa mínimo el alto de pantalla, pero se adapta al contenido) */}
      <header className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden pb-12">
        
        {/* Fondo Ikurriña */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/Flag.svg" 
            alt="Fondo Euskadi" 
            className="h-full w-full object-cover opacity-20 mix-blend-screen grayscale-[30%]" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />
        </div>

        {/* Navbar */}
        <div className="relative z-10 flex w-full items-center justify-between p-6 sm:p-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-lg border border-white/10 p-0.5 shadow-lg">
              <EuskadiFlag />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-100">
              RouteMind
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-medium text-orange-300 backdrop-blur-md">
            <RiVerifiedBadgeFill className="h-4 w-4" />
            {health.label}
          </div>
        </div>

        {/* Main Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mx-auto mt-6 flex w-full max-w-5xl flex-col justify-center px-4 text-center sm:mt-10 sm:px-6"
        >
          <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
            Descubre Euskadi <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              a tu propio ritmo.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg lg:text-xl">
            Genera itinerarios vivos, visuales y adaptados a tus gustos. Planificación turística inteligente lista para repetirse cuantas veces quieras.
          </p>
          
          <div className="mt-8 flex justify-center sm:mt-10">
            <button 
              onClick={scrollToMap}
              className="group flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-orange-500/40 hover:bg-white/10"
            >
              <RiArrowDownSLine className="h-6 w-6 text-orange-400 transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </motion.div>

        {/* Arch Cards con Vídeos */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 mt-12 w-full sm:mt-16"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 px-4 sm:gap-8 lg:px-8">
            {heroCards.map((card) => (
              <WindowVideoCard key={card.title} {...card} />
            ))}
          </div>
        </motion.div>
      </header>

      {/* MAIN */}
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">Zona elegida</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Tu base territorial para este viaje</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200">
                <RiFocus3Line className="h-4 w-4 text-orange-400" />
                {selectedZone?.label}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedZone?.cities?.map((city) => (
                <span key={city} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">Planificador</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Ajusta tu viaje</h2>
              </div>
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-300">
                {tripDurationDays} días
              </span>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Fecha desde</span>
                <input
                  type="date"
                  value={form.startDate}
                  min={defaultStartDate}
                  max={maxDate}
                  onChange={(event) => updateField('startDate', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Fecha hasta</span>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || defaultStartDate}
                  max={maxDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Preferencia</span>
                <select
                  value={form.preference}
                  onChange={(event) => updateField('preference', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                >
                  {preferenceOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-zinc-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Transporte</span>
                <select
                  value={form.transport}
                  onChange={(event) => updateField('transport', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                >
                  {transportOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-zinc-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Ritmo</span>
                <select
                  value={form.pace}
                  onChange={(event) => updateField('pace', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                >
                  {paceOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-zinc-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Presupuesto</span>
                <select
                  value={form.budget}
                  onChange={(event) => updateField('budget', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                >
                  {['bajo', 'medio', 'alto'].map((option) => (
                    <option key={option} value={option} className="bg-zinc-900 capitalize">
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Personas</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.partySize}
                  onChange={(event) => updateField('partySize', Number(event.target.value) || 1)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Accesibilidad</span>
                <select
                  value={form.accessibility}
                  onChange={(event) => updateField('accessibility', event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                >
                  {['normal', 'step-free', 'low-walk', 'high-comfort'].map((option) => (
                    <option key={option} value={option} className="bg-zinc-900">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/5 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">Sitios clave</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Guía la inteligencia artificial</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    Marca hasta tres lugares imprescindibles para ti. De esta manera Gemini estructurará un viaje armónico a su alrededor.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300">
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
                          ? 'border-orange-500/60 bg-orange-500/15 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10',
                        disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <RiMapPin2Line className="h-4 w-4" />
                      {site.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-300">Instrucciones o contexto adicional (Opcional)</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={3}
                  placeholder="Ej: Viaje de aniversario, buscamos probar sidrerías, preferimos evitar madrugar."
                  className="resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 focus:bg-white/10"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/5 pt-8">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group inline-flex items-center gap-3 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <>
                    <RiLoader4Line className="h-5 w-5 animate-spin" />
                    Generando magia...
                  </>
                ) : (
                  <>
                    Generar Itinerario
                    <RiArrowRightLine className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <span className="text-sm text-zinc-500">
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
                    <RiErrorWarningLine className="mt-0.5 h-6 w-6 shrink-0" />
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">Resultado</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Tu ruta planificada</h2>
              </div>
              {status === 'loading' ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                  <RiLoader4Line className="h-4 w-4 animate-spin text-orange-400" />
                  Conectando...
                </span>
              ) : result ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300">
                  <RiVerifiedBadgeFill className="h-4 w-4" />
                  {result.source}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
                  <RiSparklingFill className="h-4 w-4" />
                  Esperando consulta
                </span>
              )}
            </div>

            <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
              {result ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                      <RiRouteLine className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{result.itinerary?.title || 'Itinerario listo'}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{result.itinerary?.summary}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Zona</p>
                      <p className="mt-2 font-medium text-white">{result.catalogSummary?.selectedZone || selectedZone?.label}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Sitios</p>
                      <p className="mt-2 font-medium text-white">{result.catalogSummary?.places ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">Eventos</p>
                      <p className="mt-2 font-medium text-white">{result.catalogSummary?.events ?? 0}</p>
                    </div>
                  </div>

                  {/* Scroll invisible */}
                  <div className="mt-8 max-h-[45rem] space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {Array.isArray(result.itinerary?.days) && result.itinerary.days.length ? (
                      result.itinerary.days.map((day, index) => <DayCard key={`${day.date}-${index}`} day={day} index={index} />)
                    ) : (
                      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-zinc-400">
                        Los detalles del viaje aparecerán aquí.
                      </div>
                    )}
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">Tips de equipaje</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(result.itinerary?.packingTips || []).map((tip) => (
                          <span key={tip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                            {tip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">Plan B</p>
                      <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                        {(result.itinerary?.backupPlan || []).map((item) => (
                          <li key={item} className="flex gap-3 leading-relaxed">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/80" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <RiMapPin2Line className="h-5 w-5 text-orange-400" />
                      Transporte y contexto
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(result.itinerary?.transportNotes || []).map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-zinc-900/50 px-4 py-1.5 text-xs text-zinc-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">Cómo funciona</p>
                    <div className="mt-6 space-y-6 text-sm text-zinc-300">
                      <div className="flex gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-semibold text-orange-400">1</div>
                        <p className="pt-1.5">Navega por el mapa de arriba y elige la zona que servirá como centro base.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-semibold text-orange-400">2</div>
                        <p className="pt-1.5">Personaliza filtros, marca hasta tres sitios favoritos y añade el contexto extra.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-semibold text-orange-400">3</div>
                        <p className="pt-1.5">Pulsa <span className="font-semibold text-orange-200">Generar Itinerario</span> para desatar la magia de la inteligencia artificial.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <RiMagicLine className="h-5 w-5 text-orange-400" />
                      Ideas para probar
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-400">
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