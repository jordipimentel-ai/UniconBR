'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface EditarUsuarioModalProps {
  usuario: {
    id: string
    nome_completo: string
    email: string
    role: 'admin' | 'colaborador'
    avatar_url?: string
  }
  onClose: () => void
  onUserUpdated: (user: any) => void
}

export default function EditarUsuarioModal({
  usuario,
  onClose,
  onUserUpdated,
}: EditarUsuarioModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome_completo: usuario.nome_completo,
    role: usuario.role as 'admin' | 'colaborador',
    avatar_url: usuario.avatar_url || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nome_completo: formData.nome_completo,
          role: formData.role,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', usuario.id)

      if (updateError) throw updateError

      onUserUpdated({
        ...usuario,
        ...formData,
      })
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Editar Usuário</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Avatar
            </label>
            <div className="flex gap-3">
              {formData.avatar_url && (
                <img
                  src={formData.avatar_url}
                  alt={formData.nome_completo}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) =>
                setFormData({ ...formData, nome_completo: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Função */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Função
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'admin' | 'colaborador',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="colaborador">Colaborador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={usuario.email}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Salvando...' : 'Salvar'}
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
