'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Calendar from '@/components/Calendar'

export default function CalendarioPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-slate-900">Calendário</h1>
            <p className="text-slate-600 mt-2">Visualize prazos, tarefas e compromissos</p>
          </div>
        </header>

        {/* Main */}
        <main className="px-8 py-8">
          <Calendar />
        </main>
      </div>
    </div>
  )
}
