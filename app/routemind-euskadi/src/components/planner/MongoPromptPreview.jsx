import { useState } from 'react'
import { RiDatabase2Line, RiFileCopyLine } from 'react-icons/ri'

export function MongoPromptPreview({ result }) {
  const [copied, setCopied] = useState(false)

  if (!result?.prompt) return null

  async function copyPrompt() {
    await navigator.clipboard.writeText(result.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400"><RiDatabase2Line className="h-4 w-4" />MongoDB + prompt temporal</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Datos preparados para Gemini</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">Este bloque es solo de validación. Gemini todavía no recibe la petición.</p>
        </div>
        <button type="button" onClick={copyPrompt} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 transition hover:border-amber-400/40 hover:text-amber-300"><RiFileCopyLine className="h-4 w-4" />{copied ? 'Copiado' : 'Copiar prompt'}</button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-300"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Origen: {result.promptMetadata?.mongoSource ?? 'desconocido'}</span>{(result.promptMetadata?.collections ?? []).map((collection) => <span key={collection} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{collection}</span>)}</div>
      <pre className="mt-5 max-h-[38rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-zinc-950/80 p-5 text-xs leading-6 text-amber-100/90">{result.prompt}</pre>
    </section>
  )
}
