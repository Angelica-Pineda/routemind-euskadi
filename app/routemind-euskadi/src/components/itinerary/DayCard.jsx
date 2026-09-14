function formatDisplayDate(value) {
  const [year, month, day] = String(value ?? "")
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function DayCard({ day, index }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_16px_48px_rgba(9,9,11,0.5)]">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-400/80">
            {formatDisplayDate(day.date)}
          </p>
          <h4 className="mt-2 text-lg font-semibold text-white">
            Día {index + 1}: {day.theme}
          </h4>
        </div>
      </div>
      {/* <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="">Día {index + 1}</p><h4 className="mt-2 text-lg font-semibold text-white">{day.label ?? day.date}</h4></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">{day.theme}</span></div> */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Mañana", day.morning],
          ["Mediodía", day.midday],
          ["Tarde", day.afternoon],
          ["Noche", day.evening],
        ].map(([label, block]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
              {label}
            </p>
            {block ? (
              <>
                <h5 className="mt-2 text-sm font-semibold text-white">
                  {block.title}
                </h5>
                <p className="mt-2 text-xs leading-5 text-zinc-300">
                  {block.reason}
                </p>
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
          <span className="block text-xs uppercase tracking-[0.25em] text-zinc-400">
            Meteorología
          </span>
          <p className="mt-2 leading-6">
            {day.weatherNote ||
              "La API generó una propuesta adaptada al contexto disponible."}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-zinc-300">
          <span className="block text-xs uppercase tracking-[0.25em] text-zinc-400">
            Transporte
          </span>
          <p className="mt-2 leading-6">
            {day.transportNote || "La movilidad se ajusta al modo elegido."}
          </p>
        </div>
      </div>
      {Array.isArray(day.notes) && day.notes.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {day.notes.map((note) => (
            <span
              key={note}
              className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-200"
            >
              {note}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
