import { Fragment, useEffect, useRef } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { 
  RiArrowDownSLine, 
  RiCheckboxCircleFill, 
  RiCheckboxBlankCircleLine,
  RiCheckLine
} from 'react-icons/ri'

export function CustomMultiSelect({ value, onChange, options, label, onClose, disabled, isNext }) {
  const buttonRef = useRef(null)
  const isAllSelected = value.length === options.length
  const hasSelection = value.length > 0

  // Auto-abrir cuando sea el turno (isNext)
  useEffect(() => {
    if (isNext && !disabled) {
      const timer = setTimeout(() => {
        const isExpanded = buttonRef.current?.getAttribute('aria-expanded') === 'true'
        if (!isExpanded) {
          buttonRef.current?.focus({ preventScroll: true })
          buttonRef.current?.click()
        }
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [isNext, disabled])

  const toggleOption = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([]) 
    } else {
      onChange(options.map((opt) => opt.value)) 
    }
  }

  const displayValue = !hasSelection
    ? 'Selecciona tus planes a gusto...'
    : isAllSelected
    ? 'Todos los planes'
    : value.length === 1
    ? options.find((o) => o.value === value[0])?.label
    : `${value.length} planes elegidos`

  return (
    <div className={`grid gap-2 transition-all duration-500 ${disabled ? 'pointer-events-none opacity-40 grayscale' : 'opacity-100'}`}>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <Popover className="relative mt-1">
        {({ open }) => (
          <>
            <Popover.Button
              ref={buttonRef}
              disabled={disabled}
              className={`relative w-full cursor-pointer rounded-2xl border px-4 py-3 text-left text-zinc-100 shadow-sm transition-all duration-300 focus:outline-none ${
                isNext 
                  ? 'border-orange-500/80 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/50' 
                  : open
                  ? 'border-orange-500/60 bg-white/10'
                  : 'border-white/10 bg-white/5 hover:border-orange-500/40 hover:bg-white/10'
              }`}
            >
              <span className={`block truncate ${hasSelection ? 'font-medium text-white' : 'text-zinc-400'}`}>
                {displayValue}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <RiArrowDownSLine
                  className={`h-5 w-5 transition-transform duration-300 ${isNext ? 'text-orange-300 animate-pulse' : 'text-orange-400'} ${open ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-50 mt-2 flex max-h-[26rem] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 py-0 shadow-[0_20px_60px_rgba(0,0,0,0.9)] focus:outline-none">
                {({ close }) => (
                  <>
                    <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-900/95 px-3 py-2 backdrop-blur-xl">
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="w-full rounded-xl bg-orange-500/10 py-2.5 text-xs font-bold uppercase tracking-wider text-orange-400 transition-colors hover:bg-orange-500/20"
                      >
                        {isAllSelected ? 'Limpiar selección' : 'Seleccionar todo'}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 py-2 [&::-webkit-scrollbar]:hidden">
                      <div className="flex flex-col gap-1">
                        {options.map((option) => {
                          const isSelected = value.includes(option.value)
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleOption(option.value)}
                              className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                                isSelected ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                              }`}
                            >
                              <span className={`text-sm transition-colors ${isSelected ? 'font-medium text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                {option.label}
                              </span>
                              {isSelected ? (
                                <RiCheckboxCircleFill className="h-5 w-5 text-orange-400" />
                              ) : (
                                <RiCheckboxBlankCircleLine className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="sticky bottom-0 z-10 border-t border-white/10 bg-zinc-900/95 p-3 backdrop-blur-xl">
                      <button
                        type="button"
                        onClick={() => {
                          close() 
                          if (onClose) onClose() 
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-orange-400"
                      >
                        <RiCheckLine className="h-5 w-5" />
                        Confirmar planes
                      </button>
                    </div>
                  </>
                )}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  )
}