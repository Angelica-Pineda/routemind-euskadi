import { AnimatePresence, motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiErrorWarningLine,
  RiLoader4Line,
  RiMapPin2Line,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import { paceOptions, transportOptions } from "../../../shared/catalog.js";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomMultiSelect } from "../ui/CustomMultiSelect";
import { CustomSelect } from "../ui/CustomSelect";
import { CustomTimeSelect } from "../ui/CustomTimeSelect";

const planOptions = [
  { value: "playa", label: "Playa y costa" },
  { value: "montana", label: "Montañismo y naturaleza" },
  {
    value: "monumentos-sitios-historicos",
    label: "Monumentos y Sitios históricos",
  },
  { value: "sidrerias", label: "Sidrerías tradicionales" },
  { value: "bodegas", label: "Bodegas y enoturismo" },
  { value: "gastronomia", label: "Alta gastronomía" },
  { value: "conciertos-festivales", label: "Conciertos y Festivales" },
  { value: "teatro-arte", label: "Teatro y Arte" },
  { value: "eventos-culturales", label: "Eventos Culturales" },
  { value: "txakoli", label: "Rutas y catas de Txakoli" },
];

export function PlannerForm({
  form,
  health,
  status,
  error,
  tripDurationDays,
  activeStep,
  selectedZone,
  selectedZoneSites,
  defaultStartDate,
  maxDate,
  onSubmit,
  updateField,
  toggleSite,
}) {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      onSubmit={onSubmit}
      className="relative z-20 rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Planificador
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Ajusta tu viaje
            </h2>
          </div>
          <span className="mt-6 hidden items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-300 sm:inline-flex">
            <RiVerifiedBadgeFill className="h-3 w-3" />
            {health.label}
          </span>
        </div>
        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-300">
          {tripDurationDays} días
        </span>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <CustomDatePicker
            label="Rango de fechas"
            value={form.dateRange}
            minDate={defaultStartDate}
            maxDate={maxDate}
            onChange={(value) => updateField("dateRange", value)}
            disabled={false}
            isNext={activeStep === 0}
          />
        </div>
        <CustomTimeSelect label="Hora de llegada" value={form.arrivalTime} onChange={(value) => updateField("arrivalTime", value)} disabled={false} isNext={false} />
        <CustomTimeSelect label="Hora de salida" value={form.departureTime} onChange={(value) => updateField("departureTime", value)} disabled={false} isNext={false} />
        <CustomSelect
          label="Transporte"
          value={form.transport}
          onChange={(value) => updateField("transport", value)}
          options={transportOptions}
          disabled={activeStep < 1}
          isNext={activeStep === 1}
        />
        <CustomSelect
          label="Ritmo"
          value={form.pace}
          onChange={(value) => updateField("pace", value)}
          options={paceOptions}
          disabled={activeStep < 2}
          isNext={activeStep === 2}
        />
        <CustomSelect
          label="Presupuesto"
          value={form.budget}
          onChange={(value) => updateField("budget", value)}
          options={[
            { value: "bajo", label: "Bajo" },
            { value: "medio", label: "Medio" },
            { value: "alto", label: "Alto" },
          ]}
          disabled={activeStep < 3}
          isNext={activeStep === 3}
        />
        <CustomSelect
          label="Personas"
          value={form.partySize}
          onChange={(value) => updateField("partySize", value)}
          options={Array.from({ length: 12 }, (_, index) => ({
            value: index + 1,
            label: `${index + 1} ${index === 0 ? "persona" : "personas"}`,
          }))}
          disabled={activeStep < 4}
          isNext={activeStep === 4}
        />
        <div className="sm:col-span-2">
          <CustomMultiSelect
            label="Preferencia de planes"
            value={form.plans}
            onChange={(value) => updateField("plans", value)}
            options={planOptions}
            disabled={activeStep < 5}
            isNext={activeStep === 5}
          />
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Sitios clave
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white">
              Marca hasta tres lugares imprescindibles para ti. De esta manera
              Gemini estructurará un viaje armónico a su alrededor.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300">
            {selectedZone?.province}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {selectedZoneSites.map((site) => {
            const active = form.sites.includes(site.id);
            const disabled = !active && form.sites.length >= 3;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => toggleSite(site.id)}
                disabled={disabled}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300",
                  active
                    ? "border-orange-500/60 bg-orange-500/15 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10",
                  disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
                ].join(" ")}
              >
                <RiMapPin2Line className="h-4 w-4" />
                {site.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
        <button
          type="submit"
          disabled={status === "loading" || activeStep < 6}
          className="group inline-flex items-center gap-3 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? (
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
      </div>
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200"
          >
            <div className="flex items-start gap-3">
              <RiErrorWarningLine className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold text-rose-100">
                  Algo no ha ido bien
                </p>
                <p className="mt-1 text-rose-300/80">{error}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.form>
  );
}
