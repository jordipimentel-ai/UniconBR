import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function usePermission(permissionName: string) {
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPermission() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setHasPermission(false)
          setLoading(false)
          return
        }

        // Verificar se é admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData?.role === 'admin') {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // Verificar permissão específica
        const { data: permissions } = await supabase
          .from('user_permissoes')
          .select(`
            permissoes:permissao_id(nome)
          `)
          .eq('user_id', user.id)

        const hasAccess = permissions?.some(p =>
          (p.permissoes as any)?.nome?.toLowerCase().replace(/[_\s]/g, '') ===
          permissionName.toLowerCase().replace(/[_\s]/g, '')
        )

        setHasPermission(hasAccess || false)
      } catch (error) {
        console.error('Erro ao verificar permissão:', error)
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [permissionName])

  return { hasPermission, loading }
}
