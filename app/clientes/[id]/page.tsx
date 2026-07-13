'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getClienteById, updateCliente, deleteCliente } from '@/lib/client-management'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

interface Cliente {
  id: string
  nome_razao_social: string
  cpf_cnpj: string
  email: string
  telefone: string
  tipo: 'PF' | 'PJ'
  regime_tributario: string
  segmento: string
  em_funcionamento: boolean
  representante: string
  observacoes: string
  ativo: boolean
}

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<Partial<Cliente>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function loadCliente() {
      try {
        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        // Carregar cliente
        const { data } = await getClienteById(clienteId)
        if (data) {
          setCliente(data)
          setFormData(data)
        } else {
          setError('Cliente não encontrado')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCliente()
  }, [clienteId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { success: updateSuccess, error: updateError } = await updateCliente(
      clienteId,
      formData
    )

    if (!updateSuccess) {
      setError(updateError)
      setSaving(false)
      return
    }

    setSuccess(true)
    setCliente({ ...cliente, ...formData } as Cliente)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return

    setSaving(true)
    const { success: deleteSuccess, error: deleteError } = await deleteCliente(clienteId)

    if (!deleteSuccess) {
      setError(deleteError)
      setSaving(false)
      return
    }

    router.push('/clientes')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
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

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Cliente não encontrado</p>
            <Link href="/clientes" className="text-blue-600 hover:text-blue-700">
              ← Voltar para Clientes
            </Link>
          </div>
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
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/clientes" className="text-blue-600 hover:text-blue-700 text-sm">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar Cliente</h1>
          </div>
        </header>

        {/* Main */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Cliente atualizado com sucesso!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Básicos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razão Social / Nome
                    </label>
                    <input
                      type="text"
                      name="nome_razao_social"
                      value={formData.nome_razao_social || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF / CNPJ
                    </label>
                    <input
                      type="text"
                      name="cpf_cnpj"
                      value={formData.cpf_cnpj || ''}
                      onChange={handleChange}
                      required
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Não pode ser alterado</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      name="telefone"
                      value={formData.telefone || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Classificação */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Classificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      name="tipo"
                      value={formData.tipo || 'PF'}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="PF">Pessoa Física</option>
                      <option value="PJ">Pessoa Jurídica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Regime Tributário
                    </label>
                    <select
                      name="regime_tributario"
                      value={formData.regime_tributario || 'Simples'}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="Simples">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Segmento
                    </label>
                    <input
                      type="text"
                      name="segmento"
                      value={formData.segmento || ''}
                      onChange={handleChange}
                      placeholder="Ex: Comércio, Serviços..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Representante (PJ)
                    </label>
                    <input
                      type="text"
                      name="representante"
                      value={formData.representante || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="em_funcionamento"
                    checked={formData.em_funcionamento || false}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Em funcionamento</span>
                </label>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                  className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  Deletar Cliente
                </button>

                <Link
                  href="/clientes"
                  className="px-6 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </Link>
              </div>
            </form>

            {/* Confirmação de Delete */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tem certeza?</h3>
                  <p className="text-gray-600 mb-6">
                    Esta ação não pode ser desfeita. O cliente será deletado permanentemente.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                    >
                      Deletar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
