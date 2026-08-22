import { Fragment, useEffect, useRef } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri'

export function CustomSelect({ value, onChange, options, label, disabled, isNext }) {
  const buttonRef = useRef(null)
  const selectedOption = options.find((opt) => opt.value === value) || { label: 'Selecciona una opción...' }

  // Auto-abrir sin forzar el salto de scroll
  useEffect(() => {
    if (isNext && !disabled) {
      const timer = setTimeout(() => {
        // Evitamos hacer click si ya está abierto
        const isExpanded = buttonRef.current?.getAttribute('aria-expanded') === 'true'
        if (!isExpanded) {
          buttonRef.current?.focus({ preventScroll: true })
          buttonRef.current?.click()
        }
      }, 350) // Ligero retraso para que el usuario note la transición
      return () => clearTimeout(timer)
    }
  }, [isNext, disabled])

  return (
    <div className={`grid gap-2 transition-all duration-500 ${disabled ? 'pointer-events-none opacity-40 grayscale' : 'opacity-100'}`}>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative mt-1">
          <Listbox.Button 
            ref={buttonRef}
            className={`relative w-full cursor-pointer rounded-2xl border px-4 py-3 text-left text-zinc-100 shadow-sm transition-all duration-300 focus:outline-none ${isNext ? 'border-orange-500/80 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/50' : 'border-white/10 bg-white/5 hover:border-orange-500/40 hover:bg-white/10'}`}
          >
            <span className={`block truncate capitalize ${!value ? 'text-zinc-500' : ''}`}>
              {selectedOption.label || selectedOption.value}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <RiArrowDownSLine className={`h-5 w-5 transition-transform ${isNext ? 'text-orange-300 animate-pulse' : 'text-orange-400'}`} aria-hidden="true" />
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-white/10 bg-zinc-900 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl focus:outline-none [&::-webkit-scrollbar]:hidden">
              {options.map((option, index) => (
                <Listbox.Option
                  key={index}
                  className={({ active }) =>
                    `relative cursor-pointer select-none px-4 py-3 transition-colors ${
                      active ? 'bg-orange-500/15 text-orange-300' : 'text-zinc-300'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span className={`block truncate capitalize ${selected ? 'font-medium text-white' : 'font-normal'}`}>
                        {option.label || option.value}
                      </span>
                      {selected ? (
                        <span className="flex items-center text-orange-400">
                          <RiCheckLine className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}