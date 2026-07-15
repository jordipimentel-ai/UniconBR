'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function MigrationPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (err) {
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  async function executeMigration() {
    setExecuting(true)
    setError(null)
    setResult(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Obter session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) throw new Error('Token não disponível')

      const response = await fetch('/api/migrations/add-user-id-to-processos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao executar migração')
        setResult(data)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExecuting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-gray-600">Verificando permissões...</div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-red-600">Acesso negado - apenas administradores</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Migrações</h1>
            <p className="text-gray-600 mt-2">Gerencie o schema do banco de dados</p>
          </div>
        </header>

        <main className="px-8 py-8">
          <div className="max-w-2xl">
            {/* Card de Migração */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Adicionar user_id à tabela processos
                </h2>
                <p className="text-gray-600">
                  Esta migração adiciona a coluna user_id à tabela processos, permitindo atribuir um responsável a cada processo/tarefa.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>O que será feito:</strong>
                </p>
                <ul className="text-sm text-blue-900 mt-2 space-y-1 ml-4 list-disc">
                  <li>Adicionar coluna <code className="bg-blue-100 px-2 py-0.5 rounded">user_id</code> na tabela processos</li>
                  <li>Criar foreign key para a tabela users</li>
                  <li>Criar índice para melhor performance</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  <strong>Erro:</strong> {error}
                </div>
              )}

              {result && result.success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                  <strong>✅ Sucesso!</strong> {result.message}
                  {result.details && (
                    <pre className="mt-3 bg-white p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {result && !result.success && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-6">
                  <strong>⚠️ Aviso:</strong> {result.message}
                  {result.instructions && (
                    <pre className="mt-3 bg-white p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {result.instructions}
                    </pre>
                  )}
                </div>
              )}

              <button
                onClick={executeMigration}
                disabled={executing}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {executing ? '⏳ Executando migração...' : '🚀 Executar Migração'}
              </button>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos passos:</h3>
                <ol className="space-y-3 text-sm text-gray-600 list-decimal ml-5">
                  <li>Clique no botão acima para executar a migração</li>
                  <li>Se aparecer ✅ Sucesso, a migração foi concluída</li>
                  <li>Vá para o menu "Tarefas" e teste criar uma nova tarefa</li>
                  <li>O formulário deve carregar sem erros</li>
                  <li>Você pode atribuir um responsável ao criar a tarefa</li>
                </ol>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
