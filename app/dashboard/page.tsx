'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Calendar from '@/components/Calendar'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    clientes: 0,
    processos: 0,
    tarefas: 0,
    tarefasPendentes: 0,
    tarefasEmAndamento: 0,
    tarefasConcluidas: 0,
    tarefasAlta: 0,
    tarefasMedia: 0,
    tarefasBaixa: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Pegar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }
      setUser(currentUser)

      // Carregar estatísticas básicas
      const [clientesRes, processosRes, tarefasRes] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('processos').select('id', { count: 'exact', head: true }),
        supabase.from('tarefas').select('*', { count: 'exact', head: false }),
      ])

      // Carregar estatísticas detalhadas de tarefas
      const { data: tarefasData } = await supabase
        .from('tarefas')
        .select('status, prioridade')

      let tarefasPendentes = 0
      let tarefasEmAndamento = 0
      let tarefasConcluidas = 0
      let tarefasAlta = 0
      let tarefasMedia = 0
      let tarefasBaixa = 0

      if (tarefasData) {
        tarefasData.forEach((t: any) => {
          if (t.status === 'pendente') tarefasPendentes++
          if (t.status === 'em_andamento') tarefasEmAndamento++
          if (t.status === 'concluida') tarefasConcluidas++
          if (t.prioridade === 'alta') tarefasAlta++
          if (t.prioridade === 'media') tarefasMedia++
          if (t.prioridade === 'baixa') tarefasBaixa++
        })
      }

      setStats({
        clientes: clientesRes.count || 0,
        processos: processosRes.count || 0,
        tarefas: tarefasRes.count || 0,
        tarefasPendentes,
        tarefasEmAndamento,
        tarefasConcluidas,
        tarefasAlta,
        tarefasMedia,
        tarefasBaixa,
      })

      setLoading(false)
    }

    loadData()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">Bem-vindo ao sistema de gestão contábil</p>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="px-8 py-8">
        {/* Saudação */}
        <div className="mb-10">
          <p className="text-lg text-slate-700">
            Olá, <span className="font-semibold text-slate-900">{user?.email}</span>
          </p>
          <p className="text-slate-600 text-sm mt-1">Gerencie seu escritório com eficiência</p>
        </div>

        {/* Stats Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Clientes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Clientes</p>
                <p className="text-4xl font-bold text-slate-900 mt-3">{stats.clientes}</p>
                <p className="text-slate-500 text-xs mt-3">Total de clientes cadastrados</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <span className="text-3xl">👥</span>
              </div>
            </div>
          </div>

          {/* Processos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Processos</p>
                <p className="text-4xl font-bold text-slate-900 mt-3">{stats.processos}</p>
                <p className="text-slate-500 text-xs mt-3">Tipos de processos cadastrados</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <span className="text-3xl">📋</span>
              </div>
            </div>
          </div>

          {/* Tarefas Total */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Total de Tarefas</p>
                <p className="text-4xl font-bold text-slate-900 mt-3">{stats.tarefas}</p>
                <p className="text-slate-500 text-xs mt-3">Todas as tarefas criadas</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg">
                <span className="text-3xl">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Detalhadas de Tarefas */}
        <h3 className="text-xl font-bold text-slate-900 mb-6">Estatísticas de Tarefas</h3>

        {/* Por Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Pendentes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 font-medium">Pendentes</p>
              <span className="text-2xl">⚪</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.tarefasPendentes}</p>
            <div className="mt-4 bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${stats.tarefas > 0 ? (stats.tarefasPendentes / stats.tarefas) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Em Andamento */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 font-medium">Em andamento</p>
              <span className="text-2xl">🔵</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.tarefasEmAndamento}</p>
            <div className="mt-4 bg-blue-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${stats.tarefas > 0 ? (stats.tarefasEmAndamento / stats.tarefas) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Concluídas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 font-medium">Concluídas</p>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.tarefasConcluidas}</p>
            <div className="mt-4 bg-green-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{ width: `${stats.tarefas > 0 ? (stats.tarefasConcluidas / stats.tarefas) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Por Prioridade */}
        <h3 className="text-xl font-bold text-slate-900 mb-6">Tarefas por Prioridade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Alta */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 font-medium">Alta Prioridade</p>
              <span className="text-2xl">🔴</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.tarefasAlta}</p>
            <p className="text-slate-500 text-sm mt-2">Requer atenção imediata</p>
          </div>

          {/* Média */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 font-medium">Média Prioridade</p>
              <span className="text-2xl">🟡</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.tarefasMedia}</p>
            <p className="text-slate-500 text-sm mt-2">Prioridade normal</p>
          </div>

          {/* Baixa */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 font-medium">Baixa Prioridade</p>
              <span className="text-2xl">🟢</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.tarefasBaixa}</p>
            <p className="text-slate-500 text-sm mt-2">Pode ser feito depois</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/clientes"
              className="group block p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition"
            >
              <div className="text-2xl mb-3">👥</div>
              <p className="text-slate-900 font-semibold text-lg">Gerenciar Clientes</p>
              <p className="text-slate-600 text-sm mt-2">Ver e criar clientes</p>
              <div className="mt-4 text-blue-600 font-medium text-sm group-hover:translate-x-1 transition">→ Acessar</div>
            </Link>
            <Link
              href="/tarefas"
              className="group block p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-green-300 transition"
            >
              <div className="text-2xl mb-3">✓</div>
              <p className="text-slate-900 font-semibold text-lg">Gerenciar Tarefas</p>
              <p className="text-slate-600 text-sm mt-2">Ver tarefas em andamento</p>
              <div className="mt-4 text-green-600 font-medium text-sm group-hover:translate-x-1 transition">→ Acessar</div>
            </Link>
            <Link
              href="/usuarios"
              className="group block p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition"
            >
              <div className="text-2xl mb-3">👤</div>
              <p className="text-slate-900 font-semibold text-lg">Gerenciar Usuários</p>
              <p className="text-slate-600 text-sm mt-2">Ver e criar usuários</p>
              <div className="mt-4 text-purple-600 font-medium text-sm group-hover:translate-x-1 transition">→ Acessar</div>
            </Link>
          </div>
        </div>

        {/* Calendário */}
        <div>
          <Calendar />
        </div>
        </main>
      </div>
    </div>
  )
}
