'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SelectPill from '@/components/SelectPill'

interface Tarefa {
  id: string
  processo_id: string
  cliente_nome?: string | null
  descricao: string
  prazo: string
  prioridade: 'baixa' | 'media' | 'alta'
  status: 'pendente' | 'em_andamento' | 'concluida'
  user_id?: string
  criado_em: string
}

interface TipoProcesso {
  id: string
  nome: string
}

interface Usuario {
  id: string
  nome_completo: string
}

interface Cliente {
  id: string
  nome_razao_social: string
}

export default function EditarTarefaPage() {
  const router = useRouter()
  const params = useParams()
  const tarefaId = params.id as string

  const [tarefa, setTarefa] = useState<Tarefa | null>(null)
  const [tiposProcesso, setTiposProcesso] = useState<TipoProcesso[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    cliente_nome: '',
    processo_id: '',
    descricao: '',
    prazo: '',
    prioridade: 'media' as const,
    status: 'pendente' as const,
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

        // Carregar tarefa
        const { data: tarefaData, error: tarefaError } = await supabase
          .from('tarefas')
          .select('*')
          .eq('id', tarefaId)
          .single()

        if (tarefaError || !tarefaData) {
          setError('Tarefa não encontrada')
          return
        }

        setTarefa(tarefaData)
        setFormData({
          cliente_nome: tarefaData.cliente_nome || '',
          processo_id: tarefaData.processo_id,
          descricao: tarefaData.descricao,
          prazo: tarefaData.prazo,
          prioridade: tarefaData.prioridade,
          status: tarefaData.status,
          user_id: tarefaData.user_id || '',
        })

        // Carregar tipos de processo, usuários e clientes
        const [tiposRes, usuariosRes, clientesRes] = await Promise.all([
          supabase.from('tipos_processo').select('id, nome').order('nome'),
          supabase
            .from('users')
            .select('id, nome_completo')
            .eq('ativo', true)
            .order('nome_completo'),
          supabase
            .from('clientes')
            .select('id, nome_razao_social')
            .eq('ativo', true)
            .order('nome_razao_social'),
        ])

        if (tiposRes.data) setTiposProcesso(tiposRes.data)
        if (usuariosRes.data) setUsuarios(usuariosRes.data)
        if (clientesRes.data) setClientes(clientesRes.data)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Erro ao carregar tarefa')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tarefaId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('tarefas')
        .update({
          cliente_nome: formData.cliente_nome.trim() || null,
          processo_id: formData.processo_id,
          descricao: formData.descricao,
          prazo: formData.prazo,
          prioridade: formData.prioridade,
          status: formData.status,
          user_id: formData.user_id || null,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', tarefaId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('✅ Tarefa atualizada com sucesso!')
      setTimeout(() => {
        router.push('/tarefas')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!tarefa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Tarefa não encontrada</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Editar Tarefa</h1>
            <button
              onClick={() => router.push('/tarefas')}
              className="px-5 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-semibold"
            >
              ← Voltar
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="px-8 py-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente (Opcional)
              </label>
              <input
                type="text"
                list="clientes-cadastrados-edit"
                value={formData.cliente_nome}
                onChange={(e) =>
                  setFormData({ ...formData, cliente_nome: e.target.value })
                }
                placeholder="Selecione um cliente cadastrado ou digite um nome novo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <datalist id="clientes-cadastrados-edit">
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.nome_razao_social} />
                ))}
              </datalist>
            </div>

            {/* Processo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processo *
              </label>
              <SelectPill
                value={formData.processo_id}
                onChange={(v) => setFormData({ ...formData, processo_id: v })}
                options={tiposProcesso.map((tipo) => ({ value: tipo.id, label: tipo.nome }))}
                placeholder="Selecione um processo"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Descreva a tarefa..."
              />
            </div>

            {/* Prazo */}
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

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável (Opcional)
              </label>
              <SelectPill
                value={formData.user_id}
                onChange={(v) => setFormData({ ...formData, user_id: v })}
                options={usuarios.map((usuario) => ({ value: usuario.id, label: usuario.nome_completo }))}
                placeholder="Selecione um responsável"
              />
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <SelectPill
                value={formData.prioridade}
                onChange={(v) => setFormData({ ...formData, prioridade: v as 'baixa' | 'media' | 'alta' })}
                options={[
                  { value: 'baixa', label: '🟢 Baixa' },
                  { value: 'media', label: '🟡 Média' },
                  { value: 'alta', label: '🔴 Alta' },
                ]}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <SelectPill
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v as 'pendente' | 'em_andamento' | 'concluida' })}
                options={[
                  { value: 'pendente', label: '⚪ Pendente' },
                  { value: 'em_andamento', label: '🔵 Em andamento' },
                  { value: 'concluida', label: '✅ Concluída' },
                ]}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/tarefas')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
