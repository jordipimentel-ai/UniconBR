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

const PRIORIDADE_CONFIGS = {
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-800', emoji: '🟢' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' },
  alta: { label: 'Alta', color: 'bg-red-100 text-red-800', emoji: '🔴' },
}

const STATUS_CONFIGS = {
  pendente: { label: 'A fazer', color: 'bg-gray-100 text-gray-800', emoji: '⚪' },
  em_andamento: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800', emoji: '🔵' },
  concluida: { label: 'Concluído', color: 'bg-green-100 text-green-800', emoji: '✅' },
}

export default function TarefasPage() {
  const router = useRouter()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

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

  // Filtrar tarefas por busca
  const tarefasFiltradas = tarefas.filter((tarefa) =>
    tarefa.descricao.toLowerCase().includes(search.toLowerCase()) ||
    tarefa.tipos_processo?.nome.toLowerCase().includes(search.toLowerCase()) ||
    tarefa.users?.nome_completo.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

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
          <div className="px-8 py-6 flex justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar por descrição, processo ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold whitespace-nowrap"
            >
              + Nova Tarefa
            </button>
          </div>
        </header>

        {/* Main - Lista */}
        <main className="px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Processo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Responsável
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Prazo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Prioridade
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tarefasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {search ? 'Nenhuma tarefa encontrada com essa busca' : 'Nenhuma tarefa criada'}
                      </td>
                    </tr>
                  ) : (
                    tarefasFiltradas.map((tarefa) => {
                      const prioridadeConfig = PRIORIDADE_CONFIGS[tarefa.prioridade]
                      const statusConfig = STATUS_CONFIGS[tarefa.status]

                      return (
                        <tr key={tarefa.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{tarefa.descricao}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {tarefa.tipos_processo?.nome || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              {tarefa.users?.nome_completo ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                                    {tarefa.users.nome_completo.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{tarefa.users.nome_completo}</span>
                                </>
                              ) : (
                                '—'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(tarefa.prazo)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded ${statusConfig.color}`}>
                              {statusConfig.emoji} {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded ${prioridadeConfig.color}`}>
                              {prioridadeConfig.emoji} {prioridadeConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => router.push(`/tarefas/${tarefa.id}`)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(tarefa.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Deletar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-4 text-sm text-gray-600">
            Exibindo {tarefasFiltradas.length} de {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}
          </div>
        </main>
      </div>

      {/* Modal Nova Tarefa */}
      {showModal && (
        <NovoTarefaModal
          onClose={() => setShowModal(false)}
          onTarefaCreated={() => {
            setShowModal(false)
            setSearch('')
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
