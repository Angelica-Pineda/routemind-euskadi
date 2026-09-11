import { motion } from 'framer-motion'
import { RiGithubFill } from 'react-icons/ri'

function WindowVideoCard({ title, text, video }) {
  return (
    <div className="group relative flex h-[280px] w-[220px] shrink-0 snap-center flex-col justify-center overflow-hidden rounded-t-[8rem] rounded-b-[2rem] border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-700 hover:-translate-y-2 hover:border-orange-500/40 hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] sm:h-[340px] sm:w-[260px] sm:rounded-t-[10rem]">
      <video src={video} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
      <div className="absolute inset-0 bg-black/30 transition-colors duration-700 group-hover:bg-black/50" />
      <div className="relative z-10 flex flex-col items-center p-6 text-center">
        <h3 className="font-heading text-2xl font-light tracking-widest text-white drop-shadow-lg sm:text-3xl">
          {title.split('\n').map((line) => <span key={line} className="block">{line}</span>)}
        </h3>
        <div className="mt-4 overflow-hidden">
          <p className="translate-y-full text-[10px] uppercase tracking-[0.3em] text-zinc-100 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">{text}</p>
        </div>
      </div>
    </div>
  )
}

export function HeroSection({ heroCards, EuskadiFlag }) {
  return (
    <header className="relative flex h-[100dvh] w-full flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/Flag.svg" alt="Fondo Euskadi" className="h-full w-full object-cover opacity-20 mix-blend-screen grayscale-[30%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 flex w-full shrink-0 items-center justify-between p-5 sm:p-8 lg:px-12">
        <div className="flex items-center gap-3"><div className="overflow-hidden rounded-lg border border-white/10 p-0.5 shadow-lg"><EuskadiFlag /></div><span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-100">RouteMind</span></div>
        <a href="https://github.com/Angelica-Pineda/routemind-euskadi" target="_blank" rel="noreferrer" className="group relative inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium text-zinc-300 backdrop-blur-md transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" /></span>
          <span className="hidden sm:inline">Ver repositorio</span><span className="sm:hidden">Repo</span><RiGithubFill className="h-4 w-4 transition-transform group-hover:scale-110" />
        </a>
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="relative z-10 mx-auto flex w-full max-w-4xl flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">Euskadi <br className="hidden sm:block" /><span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">a tu propio ritmo</span></h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">Planificación turística a medida • Genera itinerarios inteligentes</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} className="relative z-10 w-full shrink-0 pb-6 sm:pb-10">
        <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-4 pb-4 sm:justify-center sm:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">{heroCards.map((card) => <WindowVideoCard key={card.title} {...card} />)}</div>
      </motion.div>
    </header>
  )
}
