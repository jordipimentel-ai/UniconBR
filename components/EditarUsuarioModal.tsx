'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import SelectPill from '@/components/SelectPill'

interface EditarUsuarioModalProps {
  usuario: {
    id: string
    nome_completo: string
    email: string
    role: 'admin' | 'financeiro' | 'rh'
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
    role: usuario.role,
    avatar_url: usuario.avatar_url || '',
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mostrarSenha && novaSenha) {
      if (novaSenha.length < 6) {
        setError('A nova senha precisa ter pelo menos 6 caracteres')
        return
      }
      if (novaSenha !== confirmarSenha) {
        setError('As senhas não coincidem')
        return
      }
    }

    setLoading(true)

    try {
      // Atualizar dados do usuário
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nome_completo: formData.nome_completo,
          role: formData.role,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', usuario.id)

      if (updateError) throw updateError

      // Trocar a senha, se foi preenchida
      if (mostrarSenha && novaSenha) {
        const res = await fetch('/api/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: usuario.id, password: novaSenha }),
        })
        const resultado = await res.json()
        if (!res.ok) throw new Error(resultado.error || 'Erro ao definir a nova senha')
      }

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
            <SelectPill
              value={formData.role}
              onChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'financeiro' | 'rh' })}
              options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'financeiro', label: 'Financeiro' },
                { value: 'rh', label: 'RH' },
              ]}
            />
            <p className="text-xs text-gray-600 mt-1">
              {formData.role === 'admin'
                ? 'Administrador tem acesso a Financeiro, Usuários e Meu Escritório, além do restante do sistema.'
                : 'Terá acesso a todo o sistema, exceto Financeiro, Usuários e Meu Escritório.'}
            </p>
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

          {/* Nova Senha */}
          <div className="pt-2 border-t">
            {!mostrarSenha ? (
              <button
                type="button"
                onClick={() => setMostrarSenha(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                🔒 Definir nova senha
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                  <button
                    type="button"
                    onClick={() => { setMostrarSenha(false); setNovaSenha(''); setConfirmarSenha('') }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}
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
