import { Fragment, useEffect, useRef } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { RiCheckLine, RiTimeLine } from 'react-icons/ri'

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0')
  const minutes = index % 2 === 0 ? '00' : '30'
  const value = `${hours}:${minutes}`

  return { value, label: value }
})

export function CustomTimeSelect({ value, onChange, label, disabled, isNext }) {
  const buttonRef = useRef(null)
  const selectedTime = timeOptions.find((option) => option.value === value)?.label ?? 'Selecciona una hora'

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

  return (
    <div className={`grid gap-2 transition-all duration-500 ${disabled ? 'pointer-events-none opacity-40 grayscale' : 'opacity-100'}`}>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className={`relative mt-1 ${open ? 'z-50' : 'z-0'}`}>
            <Listbox.Button
              ref={buttonRef}
              className={`relative w-full cursor-pointer rounded-2xl border px-4 py-3 text-left text-zinc-100 shadow-sm transition-all duration-300 focus:outline-none ${isNext ? 'border-orange-500/80 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/50' : 'border-white/10 bg-white/5 hover:border-orange-500/40 hover:bg-white/10'}`}
            >
              <span className={`block truncate ${value ? 'font-medium text-white' : 'text-zinc-500'}`}>{selectedTime}</span>
              <RiTimeLine className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isNext ? 'text-orange-300' : 'text-orange-400'}`} aria-hidden="true" />
            </Listbox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-white/10 bg-zinc-900 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl focus:outline-none [&::-webkit-scrollbar]:hidden">
                {timeOptions.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) => `relative cursor-pointer select-none px-4 py-3 text-sm transition-colors ${active ? 'bg-orange-500/15 text-orange-300' : 'text-zinc-300'}`}
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <span className={selected ? 'font-medium text-white' : 'font-normal'}>{option.label}</span>
                        {selected ? <RiCheckLine className="h-4 w-4 text-orange-400" aria-hidden="true" /> : null}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  )
}
