import Datepicker from "react-tailwindcss-datepicker";

export function CustomDatePicker({ value, onChange, label, minDate, maxDate, disabled, isNext }) {
  
  // Garantiza que la librería siempre tenga la estructura que espera
  const safeValue = value?.startDate ? value : { startDate: null, endDate: null };

  return (
    <div className={`grid gap-2 transition-all duration-500 relative z-50 ${disabled ? 'pointer-events-none opacity-40 grayscale' : 'opacity-100'}`}>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <div className={`relative rounded-2xl transition-all duration-300 ${isNext ? 'shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50' : ''}`}>
        <Datepicker 
          asSingle={false} 
          useRange={true}
          value={safeValue} 
          onChange={onChange}
          minDate={new Date(minDate)}
          maxDate={new Date(maxDate)}
          displayFormat={"DD/MM/YYYY"}
          startWeekOn="mon"
          i18n={"es"}
          separator="-"
          disabled={disabled}
          readOnly={false} 
          popoverDirection="down"          
          containerClassName="relative w-full forzar-calendario"          
          toggleClassName="absolute bg-transparent rounded-r-2xl text-orange-400 right-0 h-full px-4 text-zinc-400 focus:outline-none transition hover:text-orange-300"
          inputClassName={`relative w-full cursor-pointer rounded-2xl border bg-white/5 px-4 py-3 text-left text-zinc-100 shadow-sm transition focus:outline-none ${isNext ? 'border-orange-500/80 bg-orange-500/10' : 'border-white/10 hover:border-orange-500/40 hover:bg-white/10'}`}
        />
      </div>
    </div>
  )
}