'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { listUsers, deactivateUser, activateUser, deleteUser } from '@/lib/user-management'
import Sidebar from '@/components/Sidebar'
import NovoUsuarioModal from '@/components/NovoUsuarioModal'
import EditarUsuarioModal from '@/components/EditarUsuarioModal'

interface User {
  id: string
  email: string
  nome_completo: string
  role: 'admin' | 'colaborador'
  ativo: boolean
  criado_em: string
  avatar_url?: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          console.log('Erro de auth:', authError)
          router.push('/auth')
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError || userData?.role !== 'admin') {
          console.log('Usuário não é admin')
          setErrorMsg('Acesso negado - você não é admin')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }

        setIsAdminUser(true)

        const { data, error: listError } = await listUsers()
        if (listError) {
          console.log('Erro ao listar usuários:', listError)
          setErrorMsg('Erro ao carregar usuários')
          return
        }

        if (data) {
          setUsuarios(data)
        }
      } catch (err) {
        console.error('Erro geral:', err)
        setErrorMsg('Erro ao carregar página')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDeactivate(id: string) {
    const { success } = await deactivateUser(id)
    if (success) {
      setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, ativo: false } : u)))
    }
  }

  async function handleActivate(id: string) {
    const { success } = await activateUser(id)
    if (success) {
      setUsuarios(usuarios.map((u) => (u.id === id ? { ...u, ativo: true } : u)))
    }
  }

  async function handleDelete(id: string) {
    try {
      const usuario = usuarios.find((u) => u.id === id)
      if (!usuario) return

      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: id,
          email: usuario.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMsg(data.error || 'Erro ao deletar usuário')
        return
      }

      setUsuarios(usuarios.filter((u) => u.id !== id))
      setDeleteConfirm(null)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  function handleUserCreated(newUser: User) {
    setUsuarios([...usuarios, newUser].sort((a, b) =>
      new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    ))
    setShowModal(false)
  }

  function handleUserUpdated(updatedUser: User) {
    setUsuarios(usuarios.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
    setShowEditModal(false)
    setEditingUser(null)
  }

  function getInitials(nome: string): string {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Acesso negado</p>
            <p className="text-gray-600">Apenas admins podem acessar esta página</p>
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
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + Novo Usuário
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Busca */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Função</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Criado em</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {usuario.avatar_url ? (
                            <img
                              src={usuario.avatar_url}
                              alt={usuario.nome_completo}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                              {getInitials(usuario.nome_completo)}
                            </div>
                          )}
                          <p className="font-medium text-gray-900">{usuario.nome_completo}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{usuario.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            usuario.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {usuario.role === 'admin' ? 'Admin' : 'Colaborador'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            usuario.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(usuario)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Editar
                        </button>

                        {usuario.ativo ? (
                          <button
                            onClick={() => handleDeactivate(usuario.id)}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(usuario.id)}
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            Ativar
                          </button>
                        )}

                        {deleteConfirm === usuario.id ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleDelete(usuario.id)}
                              className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(usuario.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Deletar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal Novo */}
      {showModal && (
        <NovoUsuarioModal
          onClose={() => setShowModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {/* Modal Editar */}
      {showEditModal && editingUser && (
        <EditarUsuarioModal
          usuario={editingUser}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  )
}
