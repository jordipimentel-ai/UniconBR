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


export default function Calendar({ showNewEventButton = false }: CalendarProps) {
  const [mesAtual, setMesAtual] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [diaHover, setDiaHover] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  useEffect(() => {
    loadEventos()
  }, [mesAtual])

  async function loadEventos() {
    try {
      setLoading(true)
      const primeirodia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
      const ultimodia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0)

      // Buscar eventos
      const { data: eventosDb } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: true })

      // Buscar tarefas da nova tabela
      const { data: tarefasDb } = await supabase
        .from('tarefas')
        .select('*')
        .order('prazo', { ascending: true })

      // Buscar usuários para mapear ids para nomes
      const { data: usuariosDb } = await supabase
        .from('users')
        .select('id, nome_completo')

      const usuariosMap = new Map(
        (usuariosDb || []).map((u: any) => [u.id, u.nome_completo])
      )

      const eventosExpandidos: Evento[] = []

      // Processar eventos
      if (eventosDb) {
        eventosDb.forEach((e: any) => {
          const dataOriginal = parseDataLocal(e.data)
          let dataAtual = parseDataLocal(e.data)

          if (dataAtual >= primeirodia && dataAtual <= ultimodia) {
            eventosExpandidos.push({
              id: e.id,
              eventoId: e.id,
              data: e.data,
              titulo: e.titulo,
              tipo: e.tipo,
              descricao: e.descricao,
              hora: e.hora,
              cor: e.cor,
              repetir: e.repetir,
            })
          }

          if (e.repetir !== 'nao') {
            while (true) {
              if (e.repetir === 'diario') {
                dataAtual = new Date(dataAtual.getTime() + 24 * 60 * 60 * 1000)
              } else if (e.repetir === 'semanal') {
                dataAtual = new Date(dataAtual.getTime() + 7 * 24 * 60 * 60 * 1000)
              } else if (e.repetir === 'mensal') {
                dataAtual.setMonth(dataAtual.getMonth() + 1)
              } else if (e.repetir === 'anual') {
                dataAtual.setFullYear(dataAtual.getFullYear() + 1)
              }

              if (dataAtual > ultimodia || dataAtual.getFullYear() > mesAtual.getFullYear() + 2) break

              if (dataAtual >= primeirodia && dataAtual <= ultimodia) {
                eventosExpandidos.push({
                  id: `${e.id}-${dataAtual.toISOString().split('T')[0]}`,
                  eventoId: e.id,
                  data: dataAtual.toISOString().split('T')[0],
                  titulo: e.titulo,
                  tipo: e.tipo,
                  descricao: e.descricao,
                  hora: e.hora,
                  cor: e.cor,
                  repetir: e.repetir,
                })
              }
            }
          }
        })
      }

      // Processar tarefas
      if (tarefasDb) {
        tarefasDb.forEach((t: any) => {
          if (!t.prazo) return
          const dataTarefa = parseDataLocal(t.prazo)
          if (dataTarefa >= primeirodia && dataTarefa <= ultimodia) {
            const responsavel = t.user_id ? usuariosMap.get(t.user_id) || 'Não atribuído' : 'Não atribuído'
            eventosExpandidos.push({
              id: `tarefa-${t.id}`,
              data: t.prazo,
              titulo: t.descricao,
              tipo: 'tarefa',
              status: t.status,
              responsavel: responsavel,
              cor: getCorStatus(t.status),
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

  const getCorStatus = (status: string) => {
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

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear()
    const mes = mesAtual.getMonth()
    const primeirodia = new Date(ano, mes, 1)
    const ultimodia = new Date(ano, mes + 1, 0)
    const diasDoMes = ultimodia.getDate()
    const diaComeca = primeirodia.getDay()

    const dias = []

    // Dias vazios antes do mês começar
    for (let i = 0; i < diaComeca; i++) {
      dias.push(null)
    }

    // Dias do mês
    for (let i = 1; i <= diasDoMes; i++) {
      dias.push(i)
    }

    return dias
  }

  const getEventosDoDia = (dia: number) => {
    if (!dia) return []
    const dataStr = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.filter((e) => e.data === dataStr)
  }

  const getCorEvento = (cor?: string) => {
    return cor || '#3B82F6'
  }

  const handleEditar = (evento: Evento) => {
    setEventoEditando(evento)
  }

  const handleExcluir = async (evento: Evento) => {
    if (!evento.eventoId) return

    const confirmMsg = evento.repetir && evento.repetir !== 'nao'
      ? 'Este evento se repete. Deseja excluir TODAS as ocorrências deste evento?'
      : 'Deseja excluir este evento?'

    if (!confirm(confirmMsg)) return

    setExcluindoId(evento.id)
    const { success } = await deleteEvento(evento.eventoId)
    setExcluindoId(null)

    if (success) {
      loadEventos()
    } else {
      alert('Erro ao excluir evento')
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'evento':
        return '📅'
      case 'compromisso':
        return '🤝'
      case 'prazo':
        return '⏰'
      case 'tarefa':
        return '✓'
      default:
        return '📌'
    }
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const mesNome = meses[mesAtual.getMonth()]
  const ano = mesAtual.getFullYear()
  const dias = getDiasDoMes()

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {mesNome} {ano}
          </h2>
          <div className="flex gap-2">
            {showNewEventButton && (
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold shadow-sm"
              >
                + Novo Evento
              </button>
            )}
            <button
              onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
            >
              ←
            </button>
            <button
              onClick={() => setMesAtual(new Date())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              Hoje
            </button>
            <button
              onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
            >
              →
            </button>
          </div>
        </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {diasSemana.map((dia) => (
          <div key={dia} className="text-center font-bold text-slate-700 text-sm py-3 border-b-2 border-slate-200">
            {dia}
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
              className={`relative min-h-24 p-3 rounded-lg border-2 transition ${
                dia
                  ? ehHoje
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50 hover:shadow-sm'
                  : 'border-transparent bg-slate-50'
              }`}
            >
              {dia && (
                <>
                  {/* Número do dia */}
                  <div className="font-bold text-slate-900 mb-2 text-lg">{dia}</div>

                  {/* Indicadores de eventos */}
                  <div className="space-y-1">
                    {eventosDoDia.slice(0, 2).map((evento) => (
                      <div
                        key={evento.id}
                        className="text-xs px-1.5 py-0.5 rounded text-white truncate"
                        style={{ backgroundColor: getCorEvento(evento.cor) }}
                        title={evento.titulo}
                      >
                        {getTipoIcon(evento.tipo)} {evento.titulo}
                      </div>
                    ))}
                    {eventosDoDia.length > 2 && (
                      <div className="text-xs px-1.5 py-0.5 text-gray-600 font-medium">
                        +{eventosDoDia.length - 2} mais
                      </div>
                    )}
                  </div>

                  {/* Tooltip ao hover */}
                  {diaHover === dia && eventosDoDia.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-900 text-white rounded-lg shadow-lg p-3 z-50 min-w-64 text-xs">
                      <div className="font-semibold mb-2">
                        {dia} de {mesNome}
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {eventosDoDia.map((evento) => (
                          <div key={evento.id} className="border-t border-gray-700 pt-2 first:border-t-0 first:pt-0">
                            <div className="flex items-center gap-2">
                              <span>{getTipoIcon(evento.tipo)}</span>
                              <span className="font-medium flex-1 truncate">{evento.titulo}</span>
                            </div>
                            {evento.hora && (
                              <div className="text-gray-300 text-xs mt-1">🕐 {evento.hora}</div>
                            )}
                            {evento.descricao && !evento.status && (
                              <div className="text-gray-300 text-xs mt-1">{evento.descricao}</div>
                            )}
                            {evento.status && (
                              <div className="text-gray-300 text-xs mt-1">
                                <div>📊 Status: {evento.status}</div>
                                {evento.responsavel && <div>👤 {evento.responsavel}</div>}
                              </div>
                            )}
                            <div className="mt-1 inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: getCorEvento(evento.cor) }}>
                              {evento.tipo === 'tarefa'
                                ? evento.status
                                : evento.tipo === 'prazo' ? '⏰ Prazo' : evento.tipo === 'compromisso' ? '🤝 Compromisso' : '📅 Evento'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

        {/* Legenda */}
        <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>Evento</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🤝</span>
            <span>Compromisso</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏰</span>
            <span>Prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Tarefa</span>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mt-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">
          Eventos e Tarefas de {mesNome}
        </h3>

        {eventos.length === 0 ? (
          <p className="text-slate-600 text-center py-12">Nenhum evento ou tarefa neste mês</p>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento) => {
              const dataParts = evento.data.split('-')
              const dia = parseInt(dataParts[2])

              return (
                <div
                  key={evento.id}
                  className="flex items-start gap-4 p-4 rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 transition"
                  style={{ borderLeftColor: evento.cor || '#3B82F6' }}
                >
                  <div className="text-2xl">{getTipoIcon(evento.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900">{evento.titulo}</div>
                    <div className="text-sm text-slate-600 mt-1.5">
                      <span className="font-semibold">{dia} de {mesNome}</span>
                      {evento.hora && <span> • {evento.hora}</span>}
                    </div>
                    {evento.descricao && !evento.status && (
                      <div className="text-sm text-slate-600 mt-2">{evento.descricao}</div>
                    )}
                    {evento.status && (
                      <div className="text-sm text-slate-600 mt-2">
                        <div>📊 Status: <span className="font-semibold">{evento.status}</span></div>
                        {evento.responsavel && <div>👤 Responsável: <span className="font-semibold">{evento.responsavel}</span></div>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap" style={{ backgroundColor: evento.cor || '#3B82F6', color: 'white' }}>
                      {evento.tipo === 'tarefa'
                        ? evento.status
                        : evento.tipo === 'prazo' ? '⏰ Prazo' : evento.tipo === 'compromisso' ? '🤝 Compromisso' : '📅 Evento'}
                    </div>
                    {showNewEventButton && evento.tipo !== 'tarefa' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditar(evento)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Editar
                        </button>
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
            })}
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
