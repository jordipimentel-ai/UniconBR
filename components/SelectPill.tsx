'use client'

import { useEffect, useRef, useState } from 'react'

export interface SelectPillOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectPillOption[]
  placeholder?: string
  className?: string
}

export default function SelectPill({ value, onChange, options, placeholder = 'Selecione', className = '' }: Props) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const selecionado = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
      >
        <span className={selecionado ? 'text-gray-900' : 'text-gray-400'}>
          {selecionado?.label || placeholder}
        </span>
        <span className={`text-gray-400 transition-transform shrink-0 ${aberto ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {aberto && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-400">Nenhuma opção</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setAberto(false) }}
                className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left hover:bg-blue-50 transition"
              >
                <span className="text-gray-900">{opt.label}</span>
                {opt.value === value && <span className="text-blue-600">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
