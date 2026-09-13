import { useEffect, useMemo, useRef, useState } from 'react'
import { siteOptions, zoneOptions } from '../shared/catalog.js'
import { requestApiHealth, requestItinerary } from './lib/plannerClient.js'
import { Footer, EuskadiFlag } from './components/layout/Footer'
import { HeroSection } from './components/home/HeroSection'
import { HowItWorksSection } from './components/home/HowItWorksSection'
import { ZoneMapPreview } from './components/map/ZoneMapPreview'
import { PlannerForm } from './components/planner/PlannerForm'
import { MongoPromptPreview } from './components/planner/MongoPromptPreview'
import { AiStatusNotice } from './components/planner/AiStatusNotice'
import { GeminiLoader } from './components/planner/GeminiLoader'
import { ItineraryResult } from './components/itinerary/ItineraryResult'
import './App.css'
import 'leaflet/dist/leaflet.css'

const heroCards = [
  { title: 'TERRITORIO A TU MEDIDA', text: 'Explora sin preocupaciones', video: '/hero-video1.mp4' },
  { title: 'RITMO\nY\nEQUILIBRIO', text: 'Combina sitios clave', video: '/hero-video2.mp4' },
  { title: 'VIAJA COMO QUIERAS', text: 'Genera tus itinerarios', video: '/hero-video3.mp4' },
]

const initialFormState = {
  dateRange: { startDate: null, endDate: null }, zone: 'bilbao-metro', transport: '', pace: '', budget: '', partySize: '', plans: [], sites: ['guggenheim-bilbao', 'casco-viejo-bilbao'],
}

function formatDateInput(date) { return date.toISOString().slice(0, 10) }
function addMonths(date, months) { const clone = new Date(date); clone.setMonth(clone.getMonth() + months); return clone }
function getDateSpan(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate); const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

const defaultStartDate = formatDateInput(new Date())
const maxDate = formatDateInput(addMonths(new Date(), 3))

function App() {
  const [form, setForm] = useState(initialFormState)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [health, setHealth] = useState({ state: 'checking', label: 'Comprobando API interna' })
  const resultRef = useRef(null)
  const selectedZone = useMemo(() => zoneOptions.find((zone) => zone.id === form.zone) ?? zoneOptions[0], [form.zone])
  const selectedZoneSites = useMemo(() => siteOptions.filter((site) => selectedZone?.siteIds?.includes(site.id)), [selectedZone])
  const tripDurationDays = useMemo(() => getDateSpan(form.dateRange?.startDate, form.dateRange?.endDate), [form.dateRange])
  const formSequence = ['dateRange', 'transport', 'pace', 'budget', 'partySize', 'plans']
  const currentStepIndex = formSequence.findIndex((key) => key === 'dateRange' ? !form.dateRange?.startDate || !form.dateRange?.endDate : key === 'plans' ? !form.plans?.length : !form[key])
  const activeStep = currentStepIndex === -1 ? formSequence.length : currentStepIndex

  useEffect(() => {
    let cancelled = false
    requestApiHealth().then((payload) => { if (!cancelled) setHealth({ state: 'online', label: payload.service || 'API interna activa' }) }).catch(() => { if (!cancelled) setHealth({ state: 'offline', label: 'La API interna no responde todavía' }) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!result?.ai) return

    result.ai.attempts?.forEach((attempt) => {
      const method = attempt.ok ? 'info' : 'warn'
      console[method](`[Gemini] Modelo ${attempt.model}. Código: ${attempt.responseCode}. Estado: ${attempt.ok ? 'correcto' : 'fallido'}`)
    })
  }, [result])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    if (status === 'loading') {
      root.classList.add('is-generating')
      body.classList.add('is-generating')
      return () => {
        root.classList.remove('is-generating')
        body.classList.remove('is-generating')
      }
    }

    root.classList.remove('is-generating')
    body.classList.remove('is-generating')
  }, [status])

  useEffect(() => {
    if (status !== 'success' || !result || !resultRef.current) return

    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [status, result])

  function updateField(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  function handleZoneSelect(zoneId) { const zone = zoneOptions.find((item) => item.id === zoneId); setForm((current) => ({ ...current, zone: zoneId, sites: zone?.siteIds?.length ? zone.siteIds.slice(0, 3) : current.sites })) }
  function toggleSite(siteId) { setForm((current) => { const alreadySelected = current.sites.includes(siteId); if (alreadySelected) return { ...current, sites: current.sites.filter((item) => item !== siteId) }; if (current.sites.length >= 3) return current; return { ...current, sites: [...current.sites, siteId] } }) }
  async function handleSubmit(event) {
    event.preventDefault(); setStatus('loading'); setError('')
    console.info('[Gemini] Iniciando generación. Orden de modelos: gemini-3.8-flash -> gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash -> gemini-3-flash-preview -> gemini-2.5-flash')
    try { const payload = await requestItinerary({ ...form, startDate: form.dateRange.startDate, endDate: form.dateRange.endDate }); setResult(payload); setStatus('success') }
    catch (requestError) { setStatus('error'); setError(requestError.message || 'No se pudo generar el itinerario.') }
  }

  return <div className="relative min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-orange-500/30 selection:text-orange-100">
    {status === 'loading' ? <GeminiLoader /> : null}
    <HeroSection heroCards={heroCards} EuskadiFlag={EuskadiFlag} />
    <HowItWorksSection />
    <main id="mapa-zonas" className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:gap-14 lg:px-8 lg:py-24"><section className="space-y-8">
      <ZoneMapPreview selectedZone={selectedZone} onSelectZone={handleZoneSelect} />
      <PlannerForm form={form} health={health} status={status} error={error} tripDurationDays={tripDurationDays} activeStep={activeStep} selectedZone={selectedZone} selectedZoneSites={selectedZoneSites} defaultStartDate={defaultStartDate} maxDate={maxDate} onSubmit={handleSubmit} updateField={updateField} toggleSite={toggleSite} />
      <MongoPromptPreview result={result} />
      <AiStatusNotice result={result} />
      <ItineraryResult result={result} status={status} selectedZone={selectedZone} resultRef={resultRef} />
    </section></main>
    <Footer />
  </div>
}

export default App
