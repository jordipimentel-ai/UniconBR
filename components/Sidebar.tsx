'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/clientes', label: 'Clientes', icon: '👥' },
    { href: '/processos', label: 'Processos', icon: '📋' },
    { href: '/tarefas', label: 'Tarefas', icon: '✓' },
    { href: '/calendario', label: 'Calendário', icon: '📅' },
    { href: '/relatorios', label: 'Relatórios', icon: '📈' },
    { href: '/usuarios', label: 'Usuários', icon: '👤' },
  ]

  return (
    <aside className="w-64 bg-slate-800 text-white h-screen fixed left-0 top-0 flex flex-col shadow-lg">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">Contabilidade</h1>
        <p className="text-slate-400 text-sm mt-2">Gestão Contábil</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-md"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
