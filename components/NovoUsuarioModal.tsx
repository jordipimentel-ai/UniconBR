'use client'

import { useState } from 'react'
import { createUser, generateRandomPassword } from '@/lib/user-management'

interface NovoUsuarioModalProps {
  onClose: () => void
  onUserCreated: (user: any) => void
}

export default function NovoUsuarioModal({ onClose, onUserCreated }: NovoUsuarioModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    role: 'colaborador' as 'admin' | 'colaborador',
    password: generateRandomPassword(),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nome_completo: formData.nome_completo,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar usuário')
        setLoading(false)
        return
      }

      // Chamar callback com o novo usuário
      onUserCreated(data.user)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  function handleGeneratePassword() {
    setFormData({
      ...formData,
      password: generateRandomPassword(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Novo Usuário</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex: João Silva"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="joao@example.com"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Função
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="colaborador">Colaborador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Senha Temporária */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Senha Temporária
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Gerar nova
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formData.password)
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Envie essa senha ao usuário. Ele deverá alterar na primeira vez que acessar.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
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
