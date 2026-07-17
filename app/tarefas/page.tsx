'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import NovoTarefaModal from '@/components/NovoTarefaModal'

interface Tarefa {
  id: string
  processo_id: string
  descricao: string
  prazo: string
  prioridade: 'baixa' | 'media' | 'alta'
  status: 'pendente' | 'em_andamento' | 'concluida'
  user_id?: string
  criado_em: string
  tipos_processo?: { nome: string }
  users?: { nome_completo: string }
}

const STATUS_CONFIGS = {
  pendente: { label: 'Pendente', color: 'bg-gray-100', badge: '⚪' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100', badge: '🔵' },
  concluida: { label: 'Concluída', color: 'bg-green-100', badge: '✅' },
}

const PRIORIDADE_CONFIGS = {
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-800', emoji: '🟢' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' },
  alta: { label: 'Alta', color: 'bg-red-100 text-red-800', emoji: '🔴' },
}

export default function TarefasPage() {
  const router = useRouter()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function loadTarefas() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const { data, error } = await supabase
          .from('tarefas')
          .select(`
            *,
            tipos_processo:tipos_processo(nome),
            users:users(nome_completo)
          `)
          .order('prazo', { ascending: true })

        if (!error && data) {
          setTarefas(data as Tarefa[])
        }
      } catch (err) {
        console.error('Erro ao carregar tarefas:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTarefas()
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja deletar esta tarefa?')) return

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)

    if (!error) {
      setTarefas(tarefas.filter((t) => t.id !== id))
    }
  }

  const agruparPorStatus = () => {
    const agrupadas: { [key: string]: Tarefa[] } = {
      pendente: [],
      em_andamento: [],
      concluida: [],
    }

    tarefas.forEach((tarefa) => {
      agrupadas[tarefa.status].push(tarefa)
    })

    return agrupadas
  }

  const tarefasAgrupadas = agruparPorStatus()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold shadow-sm"
            >
              + Nova Tarefa
            </button>
          </div>
        </header>

        {/* Main - Kanban Board */}
        <main className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pendente */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚪</span>
                <h2 className="text-xl font-bold text-gray-900">Pendente</h2>
                <span className="ml-auto bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {tarefasAgrupadas.pendente.length}
                </span>
              </div>
              <div className="space-y-4 flex-1">
                {tarefasAgrupadas.pendente.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhuma tarefa pendente
                  </div>
                ) : (
                  tarefasAgrupadas.pendente.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      onDelete={handleDelete}
                      onEdit={(id) => router.push(`/tarefas/${id}`)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Em andamento */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔵</span>
                <h2 className="text-xl font-bold text-gray-900">Em andamento</h2>
                <span className="ml-auto bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {tarefasAgrupadas.em_andamento.length}
                </span>
              </div>
              <div className="space-y-4 flex-1">
                {tarefasAgrupadas.em_andamento.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhuma tarefa em andamento
                  </div>
                ) : (
                  tarefasAgrupadas.em_andamento.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      onDelete={handleDelete}
                      onEdit={(id) => router.push(`/tarefas/${id}`)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Concluída */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✅</span>
                <h2 className="text-xl font-bold text-gray-900">Concluída</h2>
                <span className="ml-auto bg-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {tarefasAgrupadas.concluida.length}
                </span>
              </div>
              <div className="space-y-4 flex-1">
                {tarefasAgrupadas.concluida.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhuma tarefa concluída
                  </div>
                ) : (
                  tarefasAgrupadas.concluida.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      onDelete={handleDelete}
                      onEdit={(id) => router.push(`/tarefas/${id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Total: {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}
          </div>
        </main>
      </div>

      {/* Modal Nova Tarefa */}
      {showModal && (
        <NovoTarefaModal
          onClose={() => setShowModal(false)}
          onTarefaCreated={() => {
            setShowModal(false)
            // Reload tarefas
            supabase
              .from('tarefas')
              .select(`
                *,
                tipos_processo:tipos_processo(nome),
                users:users(nome_completo)
              `)
              .order('prazo', { ascending: true })
              .then(({ data }) => {
                if (data) setTarefas(data as Tarefa[])
              })
          }}
        />
      )}
    </div>
  )
}

// Componente Card de Tarefa
function TarefaCard({
  tarefa,
  onDelete,
  onEdit,
}: {
  tarefa: Tarefa
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const prioridadeConfig = PRIORIDADE_CONFIGS[tarefa.prioridade]
  const statusConfig = STATUS_CONFIGS[tarefa.status]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      {/* Título */}
      <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">
        {tarefa.descricao}
      </h3>

      {/* Processo */}
      {tarefa.tipos_processo && (
        <p className="text-xs text-gray-500 mb-3">
          📋 {tarefa.tipos_processo.nome}
        </p>
      )}

      {/* Responsável */}
      {tarefa.users && (
        <p className="text-xs text-gray-600 mb-3">
          👤 {tarefa.users.nome_completo}
        </p>
      )}

      {/* Prazo */}
      <p className="text-xs text-gray-600 mb-3">
        📅 {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}
      </p>

      {/* Status Badge */}
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${statusConfig.color}`}>
          {statusConfig.badge} {statusConfig.label}
        </span>
      </div>

      {/* Prioridade Badge */}
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${prioridadeConfig.color}`}>
          {prioridadeConfig.emoji} {prioridadeConfig.label}
        </span>
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(tarefa.id)}
          className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(tarefa.id)}
          className="flex-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition"
        >
          Deletar
        </button>
      </div>
    </div>
  )
}
