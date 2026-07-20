'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface MenuItem {
  href: string
  label: string
  icon: string
  permission?: string // nome da permissão necessária, se vazio permite todos
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Verificar se é admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData?.role === 'admin') {
          setIsAdmin(true)
          setLoading(false)
          return
        }

        // Carregar permissões do usuário
        const { data: permissions } = await supabase
          .from('user_permissoes')
          .select('permissoes(nome)')
          .eq('user_id', user.id)

        if (permissions) {
          const permNames = permissions.map((p: any) => p.permissoes?.nome || '').filter(Boolean)
          setUserPermissions(permNames)
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const menuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/clientes', label: 'Clientes', icon: '👥', permission: 'clientes' },
    { href: '/processos', label: 'Processos', icon: '📋', permission: 'processos' },
    { href: '/tarefas', label: 'Tarefas', icon: '✓', permission: 'tarefas' },
    { href: '/calendario', label: 'Calendário', icon: '📅', permission: 'calendario' },
    { href: '/relatorios', label: 'Relatórios', icon: '📈', permission: 'relatorios' },
    { href: '/usuarios', label: 'Usuários', icon: '👤', permission: 'usuarios' },
  ]

  function hasPermission(permission?: string): boolean {
    if (!permission) return true // menu sem permissão requerida
    if (isAdmin) return true // admin pode acessar tudo
    return userPermissions.some(p =>
      p.toLowerCase().replace(/[_\s]/g, '') === permission.toLowerCase().replace(/[_\s]/g, '')
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <aside className="w-64 bg-blue-600 text-white h-screen fixed left-0 top-0 flex flex-col shadow-lg">
      {/* Logo/Header */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold text-white">UniConBR</h1>
        <p className="text-blue-100 text-sm mt-2">Gestão de Escritório</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) {
            return null
          }
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
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
