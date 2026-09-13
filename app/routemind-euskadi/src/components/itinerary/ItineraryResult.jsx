import { motion } from "framer-motion";
import {
  RiLoader4Line,
  RiMagicLine,
  RiMapPin2Line,
  RiRouteLine,
  RiSparklingFill,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import { DayCard } from "./DayCard";

export function ItineraryResult({ result, status, selectedZone, resultRef }) {
  return (
    <motion.section
      ref={resultRef}
      style={{ scrollMarginTop: "1.5rem" }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative z-0 rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Resultado
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Tu ruta planificada
          </h2>
        </div>
        {status === "loading" ? (
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
      <div className="mt-6 pt-6 sm:mt-8 border-t sm:pt-8 border-white/10">
        {result ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                <RiRouteLine className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {result.itinerary?.title || "Itinerario listo"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {result.itinerary?.summary}
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                [
                  "Zona",
                  result.catalogSummary?.selectedZone || selectedZone?.label,
                ],
                ["Sitios", result.catalogSummary?.places ?? 0],
                ["Eventos", result.catalogSummary?.events ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-2 font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-5">
              {Array.isArray(result.itinerary?.days) &&
              result.itinerary.days.length ? (
                result.itinerary.days.map((day, index) => (
                  <DayCard
                    key={`${day.date}-${index}`}
                    day={day}
                    index={index}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-zinc-400">
                  Los detalles del viaje aparecerÃ¡n aquÃ­.
                </div>
              )}
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
                  Tips de equipaje
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(result.itinerary?.packingTips || []).map((tip) => (
                    <span
                      key={tip}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">
                  Plan B
                </p>
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
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-zinc-900/50 px-4 py-1.5 text-xs text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
                CÃ³mo funciona
              </p>
              <div className="mt-6 space-y-6 text-sm text-zinc-300">
                {[
                  "Navega por el mapa de arriba y elige la zona que servirÃ¡ como centro base.",
                  "Personaliza filtros, marca hasta tres sitios favoritos y aÃ±ade el contexto extra.",
                  <>
                    Pulsa{" "}
                    <span className="font-semibold text-orange-200">
                      Generar Itinerario
                    </span>{" "}
                    para desatar la magia de la inteligencia artificial.
                  </>,
                ].map((text, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-semibold text-orange-400">
                      {index + 1}
                    </div>
                    <p className="pt-1.5">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <RiMagicLine className="h-5 w-5 text-orange-400" />
                Ideas para probar
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Prueba "Transporte público" vs "Coche"
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Viaje lento vs Acelerado
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
