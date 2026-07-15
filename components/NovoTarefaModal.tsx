'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createProcesso } from '@/lib/process-management'

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
  const [formData, setFormData] = useState({
    cliente_id: '',
    tipo_processo_id: '',
    prazo: '',
    descricao: '',
    user_id: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
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
      if (!formData.cliente_id || !formData.tipo_processo_id || !formData.prazo || !formData.descricao) {
        setError('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      // Criar processo
      const { data, error: createError } = await createProcesso({
        cliente_id: formData.cliente_id,
        tipo_processo_id: formData.tipo_processo_id,
        status: 'Rascunho',
        prazo: formData.prazo,
        descricao: formData.descricao,
      })

      if (createError) {
        setError(createError)
        setLoading(false)
        return
      }

      // Atualizar user_id se houver
      if (data && formData.user_id) {
        try {
          await supabase
            .from('processos')
            .update({ user_id: formData.user_id })
            .eq('id', data.id)
        } catch (err) {
          console.log('Não foi possível atualizar responsável')
        }
      }

      onTarefaCreated(data)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
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

          {/* Tipo de Processo */}
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
            <select
              value={formData.user_id}
              onChange={(e) =>
                setFormData({ ...formData, user_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Selecione um responsável</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome_completo}
                </option>
              ))}
            </select>
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
