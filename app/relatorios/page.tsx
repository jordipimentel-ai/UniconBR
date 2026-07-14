'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface RelatorioData {
  totalUsuarios: number
  usuariosAtivos: number
  usuariosInativos: number
  totalClientes: number
  totalProcessos: number
  totalTarefas: number
  tarefasCompletas: number
  tarefasPendentes: number
}

export default function RelatoriosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RelatorioData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/auth')
          return
        }

        // Buscar dados para o relatório
        const [usuariosRes, clientesRes, processosRes, tarefasRes] = await Promise.all([
          supabase.from('users').select('id, ativo'),
          supabase.from('clientes').select('id'),
          supabase.from('processos').select('id'),
          supabase.from('tarefas').select('id, completo'),
        ])

        const usuarios = usuariosRes.data || []
        const clientes = clientesRes.data || []
        const processos = processosRes.data || []
        const tarefas = tarefasRes.data || []

        setData({
          totalUsuarios: usuarios.length,
          usuariosAtivos: usuarios.filter((u: any) => u.ativo).length,
          usuariosInativos: usuarios.filter((u: any) => !u.ativo).length,
          totalClientes: clientes.length,
          totalProcessos: processos.length,
          totalTarefas: tarefas.length,
          tarefasCompletas: tarefas.filter((t: any) => t.completo).length,
          tarefasPendentes: tarefas.filter((t: any) => !t.completo).length,
        })
      } catch (err) {
        console.error('Erro ao carregar relatório:', err)
        setErrorMsg('Erro ao carregar relatório')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const cartoes = [
    {
      titulo: 'Total de Usuários',
      valor: data?.totalUsuarios || 0,
      icon: '👥',
      cor: 'blue',
    },
    {
      titulo: 'Usuários Ativos',
      valor: data?.usuariosAtivos || 0,
      icon: '✓',
      cor: 'green',
    },
    {
      titulo: 'Usuários Inativos',
      valor: data?.usuariosInativos || 0,
      icon: '✗',
      cor: 'red',
    },
    {
      titulo: 'Total de Clientes',
      valor: data?.totalClientes || 0,
      icon: '🏢',
      cor: 'purple',
    },
    {
      titulo: 'Total de Processos',
      valor: data?.totalProcessos || 0,
      icon: '📋',
      cor: 'indigo',
    },
    {
      titulo: 'Total de Tarefas',
      valor: data?.totalTarefas || 0,
      icon: '✓',
      cor: 'orange',
    },
    {
      titulo: 'Tarefas Completas',
      valor: data?.tarefasCompletas || 0,
      icon: '✅',
      cor: 'emerald',
    },
    {
      titulo: 'Tarefas Pendentes',
      valor: data?.tarefasPendentes || 0,
      icon: '⏳',
      cor: 'amber',
    },
  ]

  const getCoresBg = (cor: string) => {
    const cores: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
      green: { bg: 'bg-green-50', text: 'text-green-700' },
      red: { bg: 'bg-red-50', text: 'text-red-700' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    }
    return cores[cor] || cores.blue
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-gray-600">Carregando relatórios...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 text-sm mt-1">Dashboard com estatísticas do sistema</p>
          </div>
        </header>

        {/* Main */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Grid de Cartões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cartoes.map((cartao, index) => {
              const cores = getCoresBg(cartao.cor)
              return (
                <div
                  key={index}
                  className={`${cores.bg} rounded-lg shadow-sm border border-gray-200 p-6`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{cartao.titulo}</p>
                      <p className={`text-3xl font-bold ${cores.text}`}>{cartao.valor}</p>
                    </div>
                    <span className="text-4xl">{cartao.icon}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumo Detalhado */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usuários */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>👥</span> Resumo de Usuários
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-gray-900">{data?.totalUsuarios}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${((data?.usuariosAtivos || 0) / (data?.totalUsuarios || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ativos: <span className="font-semibold text-green-600">{data?.usuariosAtivos}</span></span>
                  <span className="text-gray-600">Inativos: <span className="font-semibold text-red-600">{data?.usuariosInativos}</span></span>
                </div>
              </div>
            </div>

            {/* Tarefas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>✓</span> Resumo de Tarefas
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-gray-900">{data?.totalTarefas}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${((data?.tarefasCompletas || 0) / (data?.totalTarefas || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completas: <span className="font-semibold text-emerald-600">{data?.tarefasCompletas}</span></span>
                  <span className="text-gray-600">Pendentes: <span className="font-semibold text-amber-600">{data?.tarefasPendentes}</span></span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
