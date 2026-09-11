import { motion } from 'framer-motion'

const steps = [
  ['01.', 'Elige tu zona', 'Explora el mapa y selecciona tu base territorial. Euskadi tiene rincones únicos esperando por ti.'],
  ['02.', 'Contexto exacto', 'Define tus fechas y preferencias. El sistema evaluará eventos culturales, monumentos y sitios clave de la zona.'],
  ['03.', 'Itinerario vivo', 'Obtén un itinerario lógico y armónico, equilibrando los sitios imprescindibles con los mejores eventos locales.'],
]

export function HowItWorksSection() {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7, ease: 'easeOut' }} className="relative mx-auto w-full pt-8">
      <div className="relative mx-auto h-[450px] w-full max-w-100% overflow-hidden sm:h-[500px]">
        <img src="/bilbao3.jpg" alt="Fondo Bilbao" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-l from-zinc-950/50 via-transparent to-transparent" /><div className="absolute inset-0 bg-linear-to-t from-zinc-950/20 via-transparent to-transparent" /><div className="absolute inset-0 bg-zinc-900/10 mix-blend-multiply" />
        <div className="relative z-10 flex h-full flex-col items-end p-8 pt-12 sm:p-16"><p className="text-xs font-bold uppercase tracking-[0.3em] text-white">Cómo funciona</p><h2 className="mt-4 text-right font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">Diseña tu ruta <br /><span className="bg-linear-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">en 3 pasos</span></h2></div>
      </div>
      <div className="relative z-20 mx-auto -mt-32 grid max-w-7xl gap-6 px-4 sm:-mt-40 md:grid-cols-3 sm:px-8">
        {steps.map(([number, title, description]) => <div key={number} className="group rounded-[2rem] border border-white/5 bg-zinc-900/95 p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:border-orange-500/50 hover:shadow-[0_24px_50px_rgba(249,115,22,0.15)]"><div className="text-5xl font-bold text-blue-400/50 transition-colors group-hover:text-blue-400">{number}</div><h4 className="mt-4 text-xl font-bold text-white">{title}</h4><p className="mt-4 text-sm leading-relaxed text-zinc-400">{description}</p></div>)}
      </div>
    </motion.section>
  )
}
