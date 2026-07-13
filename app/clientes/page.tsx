'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

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
  ativo: boolean
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadClientes() {
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Carregar clientes
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('ativo', true)
        .order('nome_razao_social', { ascending: true })

      if (!error && data) {
        setClientes(data)
      }

      setLoading(false)
    }

    loadClientes()
  }, [router])

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome_razao_social.toLowerCase().includes(search.toLowerCase()) ||
    cliente.cpf_cnpj.includes(search)
  )

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return

    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id)

    if (!error) {
      setClientes(clientes.filter((c) => c.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <Link
              href="/clientes/novo"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + Novo Cliente
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ/CPF..."
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">CPF/CNPJ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{cliente.nome_razao_social}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{cliente.cpf_cnpj}</td>
                    <td className="px-6 py-4 text-gray-600">{cliente.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.tipo === 'PF' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {cliente.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.em_funcionamento ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cliente.em_funcionamento ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(cliente.id)}
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
    </div>
  )
}
