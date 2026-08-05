'use client'

import { useState } from 'react'

interface Props {
  titulo: string
  badge?: string
  subtitulo?: string
  defaultAberta?: boolean
  children: React.ReactNode
}

export default function SecaoAccordion({ titulo, badge, subtitulo, defaultAberta = false, children }: Props) {
  const [aberta, setAberta] = useState(defaultAberta)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition"
      >
        <div>
          <span className="font-semibold text-gray-900">
            {titulo}
            {badge && (
              <span className="ml-2 align-middle text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {badge}
              </span>
            )}
          </span>
          {subtitulo && <p className="text-xs text-gray-500 mt-1">{subtitulo}</p>}
        </div>
        <span className={`text-gray-400 transition-transform ${aberta ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {aberta && <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">{children}</div>}
    </div>
  )
}
