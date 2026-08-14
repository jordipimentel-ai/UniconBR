'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import NovoEventoModal from './NovoEventoModal'
import { deleteEvento, RepetirEvento } from '@/lib/event-management'
import { parseDataLocal } from '@/lib/date-utils'

interface Evento {
  id: string
  eventoId?: string
  data: string
  titulo: string
  tipo: 'evento' | 'compromisso' | 'prazo' | 'tarefa'
  descricao?: string
  hora?: string
  cor?: string
  status?: string
  responsavel?: string
  repetir?: RepetirEvento
}

interface CalendarProps {
  showNewEventButton?: boolean
}

const CORES_TIPO: Record<Evento['tipo'], string> = {
  evento: '#3B82F6',
  compromisso: '#D97706',
  prazo: '#DC2626',
  tarefa: '#059669',
}

const DIAS_SEMANA_LONGO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const DIAS_SEMANA_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function inicioDaSemana(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

function getTipoIcon(tipo: string) {
  switch (tipo) {
    case 'evento': return '📅'
    case 'compromisso': return '🤝'
    case 'prazo': return '⏰'
    case 'tarefa': return '✓'
    default: return '📌'
  }
}

function getCorStatus(status: string) {
  const statusColors: { [key: string]: string } = {
    'Rascunho': '#9CA3AF',
    'Recebido': '#3B82F6',
    'Em andamento': '#F59E0B',
    'Aguardando documentação': '#EC4899',
    'Aguardando órgão externo': '#8B5CF6',
    'Em revisão': '#06B6D4',
    'Concluído': '#10B981',
    'Cancelado': '#EF4444',
  }
  return statusColors[status] || '#3B82F6'
}

export default function Calendar({ showNewEventButton = false }: CalendarProps) {
  const [modo, setModo] = useState<'mes' | 'semana'>('mes')
  const [dataRef, setDataRef] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const primeiroDiaMes = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1)
  const ultimoDiaMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0)
  const inicioSemana = inicioDaSemana(dataRef)
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(fimSemana.getDate() + 6)

  const rangeInicio = modo === 'mes' ? primeiroDiaMes : inicioSemana
  const rangeFim = modo === 'mes' ? ultimoDiaMes : fimSemana

  useEffect(() => {
    loadEventos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, dataRef.getFullYear(), dataRef.getMonth(), modo === 'semana' ? inicioSemana.getTime() : 0])

  async function loadEventos() {
    try {
      setLoading(true)

      const { data: eventosDb } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: true })

      const { data: tarefasDb } = await supabase
        .from('tarefas')
        .select('*')
        .order('prazo', { ascending: true })

      const { data: usuariosDb } = await supabase
        .from('users')
        .select('id, nome_completo')

      const usuariosMap = new Map((usuariosDb || []).map((u: any) => [u.id, u.nome_completo]))

      const eventosExpandidos: Evento[] = []

      if (eventosDb) {
        eventosDb.forEach((e: any) => {
          let dataAtual = parseDataLocal(e.data)

          if (dataAtual >= rangeInicio && dataAtual <= rangeFim) {
            eventosExpandidos.push({
              id: e.id, eventoId: e.id, data: e.data, titulo: e.titulo, tipo: e.tipo,
              descricao: e.descricao, hora: e.hora, cor: e.cor, repetir: e.repetir,
            })
          }

          if (e.repetir !== 'nao') {
            while (true) {
              if (e.repetir === 'diario') dataAtual = new Date(dataAtual.getTime() + 24 * 60 * 60 * 1000)
              else if (e.repetir === 'semanal') dataAtual = new Date(dataAtual.getTime() + 7 * 24 * 60 * 60 * 1000)
              else if (e.repetir === 'mensal') dataAtual.setMonth(dataAtual.getMonth() + 1)
              else if (e.repetir === 'anual') dataAtual.setFullYear(dataAtual.getFullYear() + 1)

              if (dataAtual > rangeFim || dataAtual.getFullYear() > dataRef.getFullYear() + 2) break

              if (dataAtual >= rangeInicio && dataAtual <= rangeFim) {
                eventosExpandidos.push({
                  id: `${e.id}-${toDateStr(dataAtual)}`, eventoId: e.id, data: toDateStr(dataAtual),
                  titulo: e.titulo, tipo: e.tipo, descricao: e.descricao, hora: e.hora, cor: e.cor, repetir: e.repetir,
                })
              }
            }
          }
        })
      }

      if (tarefasDb) {
        tarefasDb.forEach((t: any) => {
          if (!t.prazo) return
          const dataTarefa = parseDataLocal(t.prazo)
          if (dataTarefa >= rangeInicio && dataTarefa <= rangeFim) {
            const responsavel = t.user_id ? usuariosMap.get(t.user_id) || 'Não atribuído' : 'Não atribuído'
            eventosExpandidos.push({
              id: `tarefa-${t.id}`, data: t.prazo, titulo: t.descricao, tipo: 'tarefa',
              status: t.status, responsavel, cor: getCorStatus(t.status),
            })
          }
        })
      }

      setEventos(eventosExpandidos)
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  function getEventosDoDia(d: Date): Evento[] {
    const dataStr = toDateStr(d)
    return eventos.filter((e) => e.data === dataStr)
  }

  function getCorEvento(cor?: string) {
    return cor || '#3B82F6'
  }

  function handleEditar(evento: Evento) {
    setEventoEditando(evento)
  }

  async function handleExcluir(evento: Evento) {
    if (!evento.eventoId) return
    const confirmMsg = evento.repetir && evento.repetir !== 'nao'
      ? 'Este evento se repete. Deseja excluir TODAS as ocorrências deste evento?'
      : 'Deseja excluir este evento?'
    if (!confirm(confirmMsg)) return

    setExcluindoId(evento.id)
    const { success } = await deleteEvento(evento.eventoId)
    setExcluindoId(null)
    if (success) loadEventos()
    else alert('Erro ao excluir evento')
  }

  function irParaHoje() {
    const hoje = new Date()
    setDataRef(hoje)
    setDiaSelecionado(hoje)
  }

  function navegar(direcao: 1 | -1) {
    if (modo === 'mes') {
      setDataRef(new Date(dataRef.getFullYear(), dataRef.getMonth() + direcao, 1))
    } else {
      const nova = new Date(dataRef)
      nova.setDate(nova.getDate() + direcao * 7)
      setDataRef(nova)
    }
  }

  // Grade do mini-calendário (Mês)
  const diaComecaMes = primeiroDiaMes.getDay()
  const diasNoMes = ultimoDiaMes.getDate()
  const celulasMes: (Date | null)[] = []
  for (let i = 0; i < diaComecaMes; i++) celulasMes.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulasMes.push(new Date(dataRef.getFullYear(), dataRef.getMonth(), d))

  // Colunas da Semana
  const diasSemanaAtual: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(d.getDate() + i)
    return d
  })

  const eventosDiaSelecionado = getEventosDoDia(diaSelecionado)

  function renderItemCard(evento: Evento, compact = false) {
    return (
      <div
        key={evento.id}
        className="flex items-start gap-3 p-3 rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 transition"
        style={{ borderLeftColor: getCorEvento(evento.cor) }}
      >
        <div className="text-xl">{getTipoIcon(evento.tipo)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm">{evento.titulo}</div>
          {evento.hora && <div className="text-xs text-slate-600 mt-0.5">🕐 {evento.hora}</div>}
          {evento.descricao && !evento.status && (
            <div className="text-xs text-slate-600 mt-1">{evento.descricao}</div>
          )}
          {evento.status && (
            <div className="text-xs text-slate-600 mt-1">
              <div>📊 {evento.status}</div>
              {evento.responsavel && <div>👤 {evento.responsavel}</div>}
            </div>
          )}
          <div
            className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
            style={{ backgroundColor: getCorEvento(evento.cor) }}
          >
            {evento.tipo === 'tarefa' ? (evento.status || 'Tarefa') : evento.tipo === 'prazo' ? '⏰ Prazo' : evento.tipo === 'compromisso' ? '🤝 Compromisso' : '📅 Evento'}
          </div>
          {showNewEventButton && evento.tipo !== 'tarefa' && (
            <div className="flex gap-3 mt-2">
              <button onClick={() => handleEditar(evento)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Editar</button>
              <button
                onClick={() => handleExcluir(evento)}
                disabled={excluindoId === evento.id}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:text-slate-400"
              >
                {excluindoId === evento.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const tituloTopo = modo === 'mes'
    ? `${MESES[dataRef.getMonth()]} ${dataRef.getFullYear()}`
    : `${inicioSemana.getDate()} ${MESES[inicioSemana.getMonth()].slice(0, 3)} — ${fimSemana.getDate()} ${MESES[fimSemana.getMonth()].slice(0, 3)}`

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="inline-flex bg-slate-100 border border-slate-200 rounded-lg p-1 gap-1">
              <button
                onClick={() => setModo('mes')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${modo === 'mes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
              >
                ▦ Mês
              </button>
              <button
                onClick={() => setModo('semana')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${modo === 'semana' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
              >
                ▤ Semana
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{tituloTopo}</h2>
          </div>

          <div className="flex gap-2">
            {showNewEventButton && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold text-sm shadow-sm"
              >
                + Novo Evento
              </button>
            )}
            <button onClick={() => navegar(-1)} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium text-sm">←</button>
            <button onClick={irParaHoje} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm">Hoje</button>
            <button onClick={() => navegar(1)} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium text-sm">→</button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-5 text-xs text-slate-600 px-6 py-3 border-b border-slate-100">
          {(['evento', 'compromisso', 'prazo', 'tarefa'] as const).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CORES_TIPO[t] }} />
              <span className="capitalize">{t}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">Carregando...</div>
        ) : modo === 'mes' ? (
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            {/* Mini-calendário */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DIAS_SEMANA_CURTO.map((d, i) => (
                  <div key={i} className="text-[10px] font-bold text-slate-400 pb-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {celulasMes.map((d, idx) => {
                  if (!d) return <div key={idx} />
                  const selecionado = mesmoDia(d, diaSelecionado)
                  const hoje = mesmoDia(d, new Date())
                  const evts = getEventosDoDia(d)
                  return (
                    <button
                      key={idx}
                      onClick={() => setDiaSelecionado(d)}
                      className={`relative text-xs rounded-lg py-1.5 transition ${
                        selecionado
                          ? 'bg-blue-600 text-white font-bold'
                          : hoje
                          ? 'border border-blue-400 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d.getDate()}
                      {evts.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {evts.slice(0, 3).map((e, i) => (
                            <span
                              key={i}
                              className="w-1 h-1 rounded-full inline-block"
                              style={{ backgroundColor: selecionado ? 'white' : getCorEvento(e.cor) }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Painel do dia selecionado */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {DIAS_SEMANA_LONGO[diaSelecionado.getDay()]}, {diaSelecionado.getDate()} de {MESES[diaSelecionado.getMonth()]}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {eventosDiaSelecionado.length === 0
                    ? 'Nenhum item neste dia'
                    : `${eventosDiaSelecionado.length} ${eventosDiaSelecionado.length === 1 ? 'item' : 'itens'} neste dia`}
                </p>
              </div>
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {eventosDiaSelecionado.map((e) => renderItemCard(e))}
              </div>
            </div>
          </div>
        ) : (
          /* Visão Semana */
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[900px]">
              {diasSemanaAtual.map((d, idx) => {
                const hoje = mesmoDia(d, new Date())
                const evts = getEventosDoDia(d)
                return (
                  <div key={idx} className={`border-r last:border-r-0 border-slate-200 min-h-[420px] ${hoje ? 'bg-blue-50/40' : ''}`}>
                    <div className="text-center py-3 border-b border-slate-200 sticky top-0 bg-white">
                      <div className="text-[10px] font-bold text-slate-400">{DIAS_SEMANA_CURTO[idx] === 'S' && idx === 6 ? 'SÁB' : DIAS_SEMANA_LONGO[idx].toUpperCase()}</div>
                      <div className={`text-sm mt-1 ${hoje ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold' : 'font-semibold text-slate-900'}`}>
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="p-2 space-y-2">
                      {evts.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => e.tipo !== 'tarefa' && showNewEventButton ? handleEditar(e) : setDiaSelecionado(d)}
                          className="w-full text-left rounded-lg px-2 py-1.5"
                          style={{ backgroundColor: `${getCorEvento(e.cor)}1a` }}
                        >
                          <div className="text-[10px] font-bold" style={{ color: getCorEvento(e.cor) }}>{e.hora || 'Dia inteiro'}</div>
                          <div className="text-xs font-medium text-slate-800 leading-tight mt-0.5 break-words">{e.titulo}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de novo evento */}
      {showNewEventButton && showModal && (
        <NovoEventoModal
          onClose={() => setShowModal(false)}
          onEventoCreated={() => {
            loadEventos()
            setShowModal(false)
          }}
        />
      )}

      {/* Modal de editar evento */}
      {showNewEventButton && eventoEditando && (
        <NovoEventoModal
          onClose={() => setEventoEditando(null)}
          onEventoCreated={() => {
            loadEventos()
            setEventoEditando(null)
          }}
          eventoParaEditar={{
            id: eventoEditando.eventoId || eventoEditando.id,
            titulo: eventoEditando.titulo,
            descricao: eventoEditando.descricao,
            data: eventoEditando.data,
            hora: eventoEditando.hora,
            tipo: eventoEditando.tipo as 'evento' | 'compromisso' | 'prazo',
            repetir: eventoEditando.repetir,
            cor: eventoEditando.cor,
          }}
        />
      )}
    </>
  )
}
