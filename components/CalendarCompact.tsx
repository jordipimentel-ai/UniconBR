'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Evento {
  id: string
  data: string
  titulo: string
  tipo: string
}

export default function CalendarCompact() {
  const [mesAtual, setMesAtual] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [diaHover, setDiaHover] = useState<number | null>(null)

  useEffect(() => {
    loadEventos()
  }, [mesAtual])

  async function loadEventos() {
    try {
      const primeirodia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
      const ultimodia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0)
      const primeiroStr = primeirodia.toISOString().split('T')[0]
      const ultimoStr = ultimodia.toISOString().split('T')[0]

      const { data } = await supabase
        .from('eventos')
        .select('*')
        .gte('data', primeiroStr)
        .lte('data', ultimoStr)

      setEventos(data || [])
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    }
  }

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear()
    const mes = mesAtual.getMonth()
    const primeirodia = new Date(ano, mes, 1)
    const ultimodia = new Date(ano, mes + 1, 0)
    const diasDoMes = ultimodia.getDate()
    const diaComeca = primeirodia.getDay()

    const dias = []
    for (let i = 0; i < diaComeca; i++) dias.push(null)
    for (let i = 1; i <= diasDoMes; i++) dias.push(i)
    return dias
  }

  const getEventosDoDia = (dia: number) => {
    if (!dia) return []
    const dataStr = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.filter((e) => e.data === dataStr)
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesNome = meses[mesAtual.getMonth()]
  const ano = mesAtual.getFullYear()
  const dias = getDiasDoMes()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          {mesNome} {ano}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))}
            className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
          >
            ←
          </button>
          <button
            onClick={() => setMesAtual(new Date())}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            Hoje
          </button>
          <button
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))}
            className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
          >
            →
          </button>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {diasSemana.map((dia) => (
          <div key={dia} className="text-center font-bold text-slate-700 text-xs py-2">
            {dia.substring(0, 1)}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia, idx) => {
          const eventosDoDia = dia ? getEventosDoDia(dia) : []
          const ehHoje =
            dia &&
            dia === new Date().getDate() &&
            mesAtual.getMonth() === new Date().getMonth() &&
            mesAtual.getFullYear() === new Date().getFullYear()

          return (
            <div
              key={idx}
              onMouseEnter={() => setDiaHover(dia)}
              onMouseLeave={() => setDiaHover(null)}
              className={`relative p-2 rounded-lg text-xs font-semibold text-center transition ${
                dia
                  ? ehHoje
                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-blue-300'
                  : 'bg-slate-50 border border-transparent'
              }`}
            >
              {dia && (
                <>
                  <div className="mb-1">{dia}</div>
                  {eventosDoDia.length > 0 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {eventosDoDia.slice(0, 2).map((e) => (
                        <div key={e.id} className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      ))}
                      {eventosDoDia.length > 2 && (
                        <div className="text-xs text-blue-600 font-bold">•</div>
                      )}
                    </div>
                  )}

                  {/* Tooltip compacto */}
                  {diaHover === dia && eventosDoDia.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 text-white rounded-lg shadow-lg p-3 z-50 min-w-48 text-xs">
                      {eventosDoDia.slice(0, 3).map((e) => (
                        <div key={e.id} className="truncate py-1 border-b border-slate-700 last:border-b-0">
                          {e.titulo}
                        </div>
                      ))}
                      {eventosDoDia.length > 3 && (
                        <div className="text-slate-400 text-xs mt-2">+{eventosDoDia.length - 3} mais</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
