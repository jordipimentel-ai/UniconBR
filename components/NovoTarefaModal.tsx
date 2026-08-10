'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import SelectPill from '@/components/SelectPill'

interface Cliente {
  id: string
  nome_razao_social: string
}

interface TipoProcesso {
  id: string
  nome: string
}

interface Usuario {
  id: string
  nome_completo: string
}

interface NovoTarefaModalProps {
  onClose: () => void
  onTarefaCreated: (tarefa: any) => void
}

export default function NovoTarefaModal({
  onClose,
  onTarefaCreated,
}: NovoTarefaModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tiposProcesso, setTiposProcesso] = useState<TipoProcesso[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    cliente_nome: '',
    processo_id: '',
    prazo: '',
    descricao: '',
    user_id: '',
    prioridade: 'media',
    status: 'pendente',
  })

  useEffect(() => {
    async function loadData() {
      try {
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }

        const [clientesRes, tiposRes, usuariosRes] = await Promise.all([
          supabase
            .from('clientes')
            .select('id, nome_razao_social')
            .eq('ativo', true)
            .order('nome_razao_social'),
          supabase
            .from('tipos_processo')
            .select('id, nome')
            .order('nome'),
          supabase
            .from('users')
            .select('id, nome_completo')
            .eq('ativo', true)
            .order('nome_completo'),
        ])

        if (clientesRes.data) setClientes(clientesRes.data)
        if (tiposRes.data) setTiposProcesso(tiposRes.data)
        if (usuariosRes.data) setUsuarios(usuariosRes.data)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.processo_id || !formData.prazo || !formData.descricao) {
        setError('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      const tarefaData = {
        cliente_nome: formData.cliente_nome.trim() || null,
        processo_id: formData.processo_id,
        prazo: formData.prazo,
        descricao: formData.descricao,
        user_id: formData.user_id || currentUserId || undefined,
        prioridade: formData.prioridade,
        status: formData.status,
      }

      // Tentar inserir com todos os campos
      let response = await supabase
        .from('tarefas')
        .insert([tarefaData])
        .select()

      let createError = response.error

      // Se a coluna cliente_nome ainda não existir no banco, tenta sem ela
      if (createError?.message?.toLowerCase().includes('cliente_nome')) {
        console.log('Tentando inserir sem cliente_nome (coluna ainda não existe)...')
        const { cliente_nome, ...resto } = tarefaData
        response = await supabase
          .from('tarefas')
          .insert([resto])
          .select()
        createError = response.error
      }

      // Se falhar por schema cache, tentar sem user_id
      if (createError?.message?.includes('user_id')) {
        console.log('Tentando inserir sem user_id obrigatório...')
        const { processo_id, prazo, descricao, prioridade, status } = tarefaData
        response = await supabase
          .from('tarefas')
          .insert([{ processo_id, prazo, descricao, prioridade, status }])
          .select()
        createError = response.error
      }

      if (createError) {
        setError(createError.message || 'Erro ao criar tarefa')
        setLoading(false)
        return
      }

      onTarefaCreated(response.data?.[0])
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nova Tarefa</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente (Opcional)
            </label>
            <input
              type="text"
              list="clientes-cadastrados"
              value={formData.cliente_nome}
              onChange={(e) =>
                setFormData({ ...formData, cliente_nome: e.target.value })
              }
              placeholder="Selecione um cliente cadastrado ou digite um nome novo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <datalist id="clientes-cadastrados">
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.nome_razao_social} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para uma tarefa sem cliente vinculado, ou digite um nome que ainda não está cadastrado.
            </p>
          </div>

          {/* Tipo de Processo */}
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
              rows={3}
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
              onChange={(v) => setFormData({ ...formData, prioridade: v })}
              options={[
                { value: 'baixa', label: '🟢 Baixa' },
                { value: 'media', label: '🟡 Média' },
                { value: 'alta', label: '🔴 Alta' },
              ]}
            />
          </div>

          {/* Status da Tarefa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <SelectPill
              value={formData.status}
              onChange={(v) => setFormData({ ...formData, status: v })}
              options={[
                { value: 'pendente', label: '⚪ Pendente' },
                { value: 'em_andamento', label: '🔵 Em andamento' },
                { value: 'concluida', label: '✅ Concluída' },
              ]}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
