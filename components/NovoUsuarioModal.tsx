'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateRandomPassword } from '@/lib/user-management'

interface Permission {
  id: string
  nome: string
  descricao?: string
}

interface NovoUsuarioModalProps {
  onClose: () => void
  onUserCreated: (user: any) => void
}

export default function NovoUsuarioModal({ onClose, onUserCreated }: NovoUsuarioModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    role: 'colaborador' as 'admin' | 'colaborador',
    password: generateRandomPassword(),
  })

  useEffect(() => {
    async function loadPermissions() {
      try {
        const { data, error } = await supabase
          .from('permissoes')
          .select('*')
          .order('nome', { ascending: true })

        if (!error && data) {
          setPermissions(data)
          // Se for admin, marcar todas as permissões
          if (formData.role === 'admin') {
            setSelectedPermissions(new Set(data.map((p) => p.id)))
          }
        }
      } catch (err) {
        console.error('Erro ao carregar permissões:', err)
      } finally {
        setLoadingPermissions(false)
      }
    }

    loadPermissions()
  }, [])

  function handleRoleChange(newRole: 'admin' | 'colaborador') {
    setFormData({ ...formData, role: newRole })

    // Se for admin, marcar todas as permissões
    if (newRole === 'admin') {
      setSelectedPermissions(new Set(permissions.map((p) => p.id)))
    } else {
      setSelectedPermissions(new Set())
    }
  }

  function togglePermission(permissionId: string) {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

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
          permissions: Array.from(selectedPermissions),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar usuário')
        setLoading(false)
        return
      }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 my-8">
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

          {/* Função */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Função
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={(e) =>
                handleRoleChange(e.target.value as 'admin' | 'colaborador')
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="colaborador">Colaborador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Permissões */}
          {!loadingPermissions && formData.role === 'colaborador' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissões
              </label>
              <div className="space-y-2 border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                {permissions.length === 0 ? (
                  <p className="text-sm text-gray-600">Nenhuma permissão disponível</p>
                ) : (
                  permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {perm.nome.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formData.role === 'admin'
                  ? 'Admin tem acesso a todas as permissões'
                  : 'Selecione as permissões para este colaborador'}
              </p>
            </div>
          )}

          {!loadingPermissions && formData.role === 'admin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                ✓ Admin terá acesso a todas as {permissions.length} permissões
              </p>
            </div>
          )}

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
