import { RiErrorWarningLine, RiVerifiedBadgeFill } from "react-icons/ri";

export function AiStatusNotice({ result }) {
  if (!result?.ai) return null;

  if (result.ai.ok) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        <RiVerifiedBadgeFill className="h-5 w-5 shrink-0" />
        Itinerario generado con IA usando el modelo {result.ai.model}.
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <RiErrorWarningLine className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <span>
        La IA no pudo generar la ruta. Mostramos un itinerario genérico basado
        en los datos disponibles.
      </span>
    </div>
  );
}
