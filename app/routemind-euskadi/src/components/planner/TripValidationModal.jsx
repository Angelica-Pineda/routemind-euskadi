import { RiCloseLine, RiErrorWarningLine } from 'react-icons/ri'

export function TripValidationModal({ message, onClose }) {
  if (!message) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/75 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="trip-validation-title">
      <div className="w-full max-w-lg rounded-[2rem] border border-amber-500/25 bg-zinc-950 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400"><RiErrorWarningLine className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 id="trip-validation-title" className="text-xl font-semibold text-white">Ajusta tu itinerario</h2>
              <button type="button" onClick={onClose} aria-label="Cerrar aviso" className="rounded-full p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"><RiCloseLine className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{message}</p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">Modifica los datos indicados y vuelve a generar el itinerario.</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-orange-400">Entendido</button>
          </div>
        </div>
      </div>
    </div>
  )
}
