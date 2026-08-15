import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  CircleAlert,
  CloudSun,
  Compass,
  Gauge,
  LoaderCircle,
  MapPin,
  Route,
  Sparkles,
  TrainFront,
  WandSparkles,
} from 'lucide-react'
import { paceOptions, preferenceOptions, siteOptions, transportOptions } from '../shared/catalog.js'
import { requestApiHealth, requestItinerary } from './lib/plannerClient.js'
import './App.css'

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
    title: 'MongoDB + Gemini',
    text: 'Consulta la base curada y transforma los datos en un JSON listo para consumir.',
  },
  {
    icon: Compass,
    title: 'Hasta 3 sitios',
    text: 'El usuario define el recorrido y el backend valida el alcance antes de generar el plan.',
  },
  {
    icon: CloudSun,
    title: '3 meses vista',
    text: 'La ventana de viaje se limita para mantener la prediccion y el itinerario controlados.',
  },
]

function PillButton({ active, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'border-emerald-300/60 bg-emerald-300/15 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.18)]'
          : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

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

  const selectedSites = useMemo(
    () => siteOptions.filter((site) => form.sites.includes(site.id)),
    [form.sites]
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

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-8"
          >
            <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl hero-orb" aria-hidden="true" />
            <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl hero-orb hero-orb-delayed" aria-hidden="true" />

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                RouteMind Euskadi
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-200" />
                {health.label}
              </span>
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Itinerarios inteligentes para Euskadi, con datos reales y una salida lista para Gemini.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                El usuario define fechas, preferencias, transporte y hasta tres sitios. El backend consulta MongoDB,
                arma el contexto y genera un JSON listo para pintar en la interfaz.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <CalendarDays className="h-4 w-4 text-emerald-200" />
                Ventana maxima: 3 meses
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Route className="h-4 w-4 text-emerald-200" />
                Hasta 3 sitios por itinerario
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <TrainFront className="h-4 w-4 text-emerald-200" />
                Transporte publico, coche o moto
              </span>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.38)] backdrop-blur-xl sm:p-7"
          >
            <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_35%)]" aria-hidden="true" />

            <div className="relative z-10 flex h-full flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Estado del sistema</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Backend interno preparado para Vercel</h2>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dimensiones de la consulta</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-200">
                    <span className="rounded-full bg-white/5 px-3 py-1">{tripDurationDays} dias</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">{selectedSites.length}/3 sitios</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">Presupuesto {form.budget}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ruta tecnica</p>
                  <div className="mt-3 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="h-4 w-4 text-emerald-200" />
                      <span>MongoDB abastece el catalogo curado</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <WandSparkles className="h-4 w-4 text-emerald-200" />
                      <span>Gemini redacta el JSON del itinerario</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Route className="h-4 w-4 text-emerald-200" />
                      <span>El frontend pinta el resultado sin romper el flujo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="flex items-center gap-2 text-white">
                  <Gauge className="h-4 w-4 text-emerald-200" />
                  Regla de seguridad de la plataforma
                </p>
                <p className="mt-2 leading-6">
                  La fecha de fin nunca puede superar los tres meses desde hoy, y el numero de sitios queda limitado a tres para mantener el prompt de Gemini controlado.
                </p>
              </div>
            </div>
          </motion.aside>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
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
                <h2 className="mt-2 text-2xl font-semibold text-white">Configura el viaje</h2>
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

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Sitios a visitar</p>
                  <p className="mt-1 text-xs text-slate-400">Selecciona hasta tres puntos. El backend usara estos sitios como anclas del prompt.</p>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                  {selectedSites.length}/3 seleccionados
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {siteOptions.map((site) => {
                  const active = form.sites.includes(site.id)
                  const disabled = !active && form.sites.length >= 3

                  return (
                    <PillButton
                      key={site.id}
                      active={active}
                      label={`${site.label} · ${site.city}`}
                      disabled={disabled}
                      onClick={() => toggleSite(site.id)}
                    />
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
                El flujo envia el formulario a <code className="rounded bg-white/5 px-2 py-1 text-xs text-slate-200">/api/itinerary</code>.
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
                      <p className="mt-2 text-sm leading-6 text-slate-300">{result.itinerary?.summary || 'La IA no devolvio un resumen, pero la estructura de respuesta sigue disponible.'}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Origen</p>
                      <p className="mt-2 text-white">{result.catalogSummary?.source || 'n/a'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Plazas</p>
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
                        El itinerario no devolvio dias estructurados, pero el resto del JSON si esta disponible.
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
                      Transporte y anclaje del prompt
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
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Que ocurrira</p>
                    <div className="mt-4 space-y-4 text-sm text-slate-300">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-100">1</div>
                        <p>El frontend envia los filtros al endpoint interno.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-100">2</div>
                        <p>La API consulta MongoDB o usa el catalogo de reserva.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-100">3</div>
                        <p>Gemini recibe el JSON con el contexto y responde con otro JSON listo para renderizar.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                    <p className="flex items-center gap-2 text-white">
                      <WandSparkles className="h-4 w-4 text-emerald-200" />
                      Sugerencias de uso
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Fechas realistas</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Alternar indoor y outdoor</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Elegir un modo de transporte dominante</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  )
}

export default App
