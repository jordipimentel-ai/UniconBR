'use client'

import { parseDataLocal, formatDataLocal } from '@/lib/date-utils'

interface ProcessoCardProps {
  id: string
  cliente: string
  tipo: string
  prazo: string
  descricao: string
  prioridade?: 'baixa' | 'media' | 'alta'
  statusTarefa?: 'pendente' | 'em_andamento' | 'concluida'
  responsavel?: string
  onDragStart: (id: string) => void
  onClick: (id: string) => void
}

export default function ProcessoCard({
  id,
  cliente,
  tipo,
  prazo,
  descricao,
  prioridade = 'media',
  statusTarefa = 'pendente',
  responsavel,
  onDragStart,
  onClick,
}: ProcessoCardProps) {
  const diasAteVencimento = Math.ceil(
    (parseDataLocal(prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const getUrgenciaColor = () => {
    if (diasAteVencimento < 0) return 'bg-red-100 text-red-800 border-red-300'
    if (diasAteVencimento < 3) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (diasAteVencimento < 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getPrioridadeColor = () => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800'
      case 'media':
        return 'bg-yellow-100 text-yellow-800'
      case 'baixa':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusTarefaColor = () => {
    switch (statusTarefa) {
      case 'pendente':
        return 'bg-gray-100 text-gray-800'
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800'
      case 'concluida':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusTarefaLabel = () => {
    switch (statusTarefa) {
      case 'pendente':
        return 'Pendente'
      case 'em_andamento':
        return 'Em andamento'
      case 'concluida':
        return 'Concluída'
      default:
        return statusTarefa
    }
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onClick={() => onClick(id)}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-move hover:border-blue-300 transition mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm flex-1">{tipo}</h4>
        <div className="flex gap-1 ml-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${getPrioridadeColor()}`}>
            {prioridade === 'alta' ? '🔴' : prioridade === 'media' ? '🟡' : '🟢'} {prioridade}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-2">{cliente}</p>

      {descricao && (
        <p className="text-xs text-gray-700 mb-3 line-clamp-2">{descricao}</p>
      )}

      {responsavel && (
        <p className="text-xs text-blue-600 mb-2">👤 {responsavel}</p>
      )}

      <div className="flex gap-2 mb-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded border ${getStatusTarefaColor()}`}>
          {getStatusTarefaLabel()}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full border ${getUrgenciaColor()}`}>
          {diasAteVencimento < 0
            ? `${Math.abs(diasAteVencimento)}d atrasado`
            : `${diasAteVencimento}d`}
        </span>
      </div>

      <span className="text-xs text-gray-500">
        {formatDataLocal(prazo)}
      </span>
    </div>
  )
}
