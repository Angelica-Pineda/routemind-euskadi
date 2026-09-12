import { RiLoader4Line } from 'react-icons/ri'

export function GeminiLoader() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 px-6 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-[2rem] border border-orange-500/20 bg-zinc-950/95 p-8 text-center shadow-[0_24px_90px_rgba(249,115,22,0.16)]">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/10">
          <span className="absolute inset-1 animate-ping rounded-full bg-orange-400/15" />
          <RiLoader4Line className="relative h-7 w-7 animate-spin text-orange-400" />
        </span>
        <div>
          <p className="font-heading text-lg font-semibold text-white">Diseñando tu ruta</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Gemini está combinando tus preferencias con los datos de Euskadi.</p>
        </div>
      </div>
    </div>
  )
}
