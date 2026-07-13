'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  listProcessos,
  updateProcessoStatus,
  listTiposProcesso,
  listClientes,
  createProcesso,
  ProcessStatus,
} from '@/lib/process-management'
import Sidebar from '@/components/Sidebar'
import ProcessoCard from '@/components/ProcessoCard'

interface Processo {
  id: string
  cliente_id: string
  tipo_processo_id: string
  status: ProcessStatus
  prazo: string
  descricao: string
  cliente: { nome_razao_social: string }
  tipo_processo: { nome: string }
}

interface TipoProcesso {
  id: string
  nome: string
}

interface Cliente {
  id: string
  nome_razao_social: string
}

const STATUSES: ProcessStatus[] = [
  'Rascunho',
  'Recebido',
  'Em andamento',
  'Aguardando documentação',
  'Aguardando órgão externo',
  'Em revisão',
  'Concluído',
  'Cancelado',
]

export default function TarefasPage() {
  const router = useRouter()
  const [processos, setProcessos] = useState<Processo[]>([])
  const [tiposProcesso, setTiposProcesso] = useState<TipoProcesso[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({
    cliente_id: '',
    tipo_processo_id: '',
    prazo: '',
    descricao: '',
    prioridade: 'media',
    status_tarefa: 'pendente',
    user_id: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const [processosRes, tiposRes, clientesRes, usuariosRes] = await Promise.all([
          listProcessos(),
          listTiposProcesso(),
          listClientes(),
          supabase.from('users').select('id, nome_completo, role').eq('ativo', true),
        ])

        if (processosRes.data) setProcessos(processosRes.data)
        if (tiposRes.data) setTiposProcesso(tiposRes.data)
        if (clientesRes.data) setClientes(clientesRes.data)
        if (usuariosRes.data) setUsuarios(usuariosRes.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-50')
  }

  async function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove('bg-blue-50')
  }

  async function handleDrop(e: React.DragEvent, novoStatus: ProcessStatus) {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-50')

    if (!draggedId) return

    const { success } = await updateProcessoStatus(draggedId, novoStatus)
    if (success) {
      setProcessos(
        processos.map((p) =>
          p.id === draggedId ? { ...p, status: novoStatus } : p
        )
      )
      setDraggedId(null)
    }
  }

  async function handleCreateProcesso(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formData.cliente_id || !formData.tipo_processo_id || !formData.prazo) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    const { data, error: createError } = await createProcesso({
      cliente_id: formData.cliente_id,
      tipo_processo_id: formData.tipo_processo_id,
      status: 'Rascunho',
      prazo: formData.prazo,
      descricao: formData.descricao,
    })

    if (createError) {
      setError(createError)
      return
    }

    if (data) {
      setProcessos([data, ...processos])
      setShowModal(false)
      setFormData({
        cliente_id: '',
        tipo_processo_id: '',
        prazo: '',
        descricao: '',
        prioridade: 'media',
        status_tarefa: 'pendente',
        user_id: '',
      } as any)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Tarefas em Andamento</h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + Nova Tarefa
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 overflow-x-auto">
            {STATUSES.map((status) => {
              const processosDoStatus = processos.filter((p) => p.status === status)

              return (
                <div
                  key={status}
                  className="bg-gray-100 rounded-lg p-4 min-h-96"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">{status}</h3>
                    <p className="text-sm text-gray-600">{processosDoStatus.length} tarefas</p>
                  </div>

                  <div className="space-y-2">
                    {processosDoStatus.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Nenhuma tarefa
                      </div>
                    ) : (
                      processosDoStatus.map((processo: any) => (
                        <ProcessoCard
                          key={processo.id}
                          id={processo.id}
                          cliente={processo.cliente.nome_razao_social}
                          tipo={processo.tipo_processo.nome}
                          prazo={processo.prazo}
                          descricao={processo.descricao}
                          prioridade={processo.prioridade || 'media'}
                          statusTarefa={processo.status_tarefa || 'pendente'}
                          responsavel={processo.responsavel_nome}
                          onDragStart={setDraggedId}
                          onClick={(id) => router.push(`/tarefas/${id}`)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>

      {/* Modal Nova Tarefa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nova Tarefa</h2>

            <form onSubmit={handleCreateProcesso} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  value={formData.cliente_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cliente_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome_razao_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Serviço *
                </label>
                <select
                  value={formData.tipo_processo_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_processo_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione um tipo</option>
                  {tiposProcesso.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo *
                </label>
                <input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) =>
                    setFormData({ ...formData, prazo: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione um responsável</option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) =>
                      setFormData({ ...formData, prioridade: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="baixa">🟢 Baixa</option>
                    <option value="media">🟡 Média</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status_tarefa}
                    onChange={(e) =>
                      setFormData({ ...formData, status_tarefa: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="pendente">⚪ Pendente</option>
                    <option value="em_andamento">🔵 Em andamento</option>
                    <option value="concluida">✅ Concluída</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Criar Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
