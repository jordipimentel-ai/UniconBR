'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { listTiposProcesso } from '@/lib/process-management'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

interface TipoProcesso {
  id: string
  nome: string
  descricao: string
  criado_em: string
}

export default function ProcessosPage() {
  const router = useRouter()
  const [tipos, setTipos] = useState<TipoProcesso[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const { data } = await listTiposProcesso()
        if (data) setTipos(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    try {
      if (editingId) {
        // Atualizar
        const { error: updateError } = await supabase
          .from('tipos_processo')
          .update(formData)
          .eq('id', editingId)

        if (updateError) throw updateError

        setTipos(tipos.map((t) => (t.id === editingId ? { ...t, ...formData } : t)))
        setEditingId(null)
      } else {
        // Criar
        const { data, error: insertError } = await supabase
          .from('tipos_processo')
          .insert([formData])
          .select()

        if (insertError) throw insertError

        if (data) {
          setTipos([...tipos, data[0]])
        }
      }

      setFormData({ nome: '', descricao: '' })
      setShowModal(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este tipo de processo?')) return

    try {
      const { error: deleteError } = await supabase
        .from('tipos_processo')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setTipos(tipos.filter((t) => t.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleEdit(tipo: TipoProcesso) {
    setEditingId(tipo.id)
    setFormData({ nome: tipo.nome, descricao: tipo.descricao })
    setShowModal(true)
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
            <h1 className="text-2xl font-bold text-gray-900">Tipos de Processos</h1>
            <button
              onClick={() => {
                setEditingId(null)
                setFormData({ nome: '', descricao: '' })
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + Novo Tipo
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

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Descrição</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tipos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-600">
                      Nenhum tipo de processo cadastrado
                    </td>
                  </tr>
                ) : (
                  tipos.map((tipo) => (
                    <tr key={tipo.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{tipo.nome}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{tipo.descricao}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(tipo)}
                          className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(tipo.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingId ? 'Editar Tipo de Processo' : 'Novo Tipo de Processo'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Ex: Abertura de Empresa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  placeholder="Descrição opcional..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? 'Atualizar' : 'Criar'}
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
