import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nome_completo, role, permissions } = await request.json()

    // Usar service_role key no backend (seguro)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Criar usuário no Auth
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    const userId = data.user.id

    // 2. Inserir na tabela users
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          nome_completo,
          role,
          ativo: true,
        },
      ])

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      )
    }

    // 3. Se for admin, adicionar todas as permissões; se for colaborador, adicionar permissões selecionadas
    if (role === 'admin') {
      // Buscar todas as permissões
      const { data: allPermissions, error: permError } = await supabase
        .from('permissoes')
        .select('id')

      if (permError) {
        console.error('Erro ao buscar permissões:', permError)
        // Não falhar a criação do usuário
      } else if (allPermissions && allPermissions.length > 0) {
        // Inserir todas as permissões para o admin
        const userPermissions = allPermissions.map((p) => ({
          user_id: userId,
          permissao_id: p.id,
        }))

        const { error: insertPermError } = await supabase
          .from('user_permissoes')
          .insert(userPermissions)

        if (insertPermError) {
          console.error('Erro ao inserir permissões:', insertPermError)
        }
      }
    } else if (permissions && permissions.length > 0) {
      // Inserir permissões selecionadas para colaborador
      const userPermissions = permissions.map((permissionId: string) => ({
        user_id: userId,
        permissao_id: permissionId,
      }))

      const { error: insertPermError } = await supabase
        .from('user_permissoes')
        .insert(userPermissions)

      if (insertPermError) {
        console.error('Erro ao inserir permissões:', insertPermError)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        nome_completo,
        role,
        ativo: true,
        criado_em: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
