'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import NovoTarefaModal from '@/components/NovoTarefaModal'

interface Tarefa {
  id: string
  cliente_id: string
  processo_id: string
  descricao: string
  prazo: string
  prioridade: 'baixa' | 'media' | 'alta'
  status: 'pendente' | 'em_andamento' | 'concluida'
  responsavel_id?: string
  criado_em: string
  cliente?: { nome_razao_social: string }
  tipos_processo?: { nome: string }
  users?: { nome_completo: string }
}

const PRIORIDADES = ['baixa', 'media', 'alta']
const STATUSES = ['pendente', 'em_andamento', 'concluida']

export default function TarefasPage() {
  const router = useRouter()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [sortBy, setSortBy] = useState<string>('prazo')

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
            cliente:clientes(nome_razao_social),
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

  const filteredTarefas = tarefas.filter((tarefa) => {
    const matchSearch =
      tarefa.descricao.toLowerCase().includes(search.toLowerCase()) ||
      tarefa.cliente?.nome_razao_social?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === 'todos' || tarefa.status === filterStatus

    return matchSearch && matchStatus
  })

  const sortedTarefas = [...filteredTarefas].sort((a, b) => {
    switch (sortBy) {
      case 'descricao':
        return a.descricao.localeCompare(b.descricao)
      case 'cliente':
        return (a.cliente?.nome_razao_social || '').localeCompare(
          b.cliente?.nome_razao_social || ''
        )
      case 'prazo':
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime()
      default:
        return 0
    }
  })

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)

    if (!error) {
      setTarefas(tarefas.filter((t) => t.id !== id))
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pendente': 'bg-gray-100 text-gray-800',
      'em_andamento': 'bg-yellow-100 text-yellow-800',
      'concluida': 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPrioridadeColor = (prioridade: string) => {
    const colors: { [key: string]: string } = {
      'baixa': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-red-100 text-red-800',
    }
    return colors[prioridade] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pendente': 'Pendente',
      'em_andamento': 'Em andamento',
      'concluida': 'Concluída',
    }
    return labels[status] || status
  }

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: { [key: string]: string } = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
    }
    return labels[prioridade] || prioridade
  }

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
        <header className="bg-white border-b border-gray-200 shadow-sm">
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

        {/* Main */}
        <main className="px-8 py-8">
          {/* Filtros e Busca */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Buscar por descrição ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="todos">Todos os Status</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => setSortBy('descricao')}
                    >
                      Descrição {sortBy === 'descricao' && '↓'}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => setSortBy('cliente')}
                    >
                      Cliente {sortBy === 'cliente' && '↓'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Responsável
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => setSortBy('prazo')}
                    >
                      Prazo {sortBy === 'prazo' && '↓'}
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
                  {sortedTarefas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                        Nenhuma tarefa encontrada
                      </td>
                    </tr>
                  ) : (
                    sortedTarefas.map((tarefa) => (
                      <tr key={tarefa.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 max-w-xs truncate">
                            {tarefa.descricao}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {tarefa.tipos_processo?.nome}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {tarefa.cliente?.nome_razao_social}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {tarefa.users?.nome_completo || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(tarefa.prazo)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(tarefa.status)}`}>
                            {getStatusLabel(tarefa.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(tarefa.prioridade)}`}>
                            {getPrioridadeLabel(tarefa.prioridade)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/tarefas/${tarefa.id}`)}
                              className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(tarefa.id)}
                              className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                            >
                              Deletar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Exibindo {sortedTarefas.length} de {tarefas.length} tarefas
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
                cliente:clientes(nome_razao_social),
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
