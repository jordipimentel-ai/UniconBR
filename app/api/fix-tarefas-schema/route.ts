import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData } = await userClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas admins podem fazer isso' },
        { status: 403 }
      )
    }

    // Usar service_role para executar SQL
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Remover NOT NULL constraint de user_id
    const { data, error } = await adminClient.rpc('exec_sql', {
      query: 'ALTER TABLE tarefas ALTER COLUMN user_id DROP NOT NULL;'
    }).catch(() => {
      // Se RPC falhar, retornar instrução manual
      return {
        data: null,
        error: { message: 'RPC não disponível' }
      }
    })

    if (error && error.message === 'RPC não disponível') {
      return NextResponse.json({
        success: false,
        message: 'Execute manualmente no Supabase SQL Editor',
        sql: 'ALTER TABLE tarefas ALTER COLUMN user_id DROP NOT NULL;'
      })
    }

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      message: '✅ Coluna user_id agora é opcional',
      sql: 'ALTER TABLE tarefas ALTER COLUMN user_id DROP NOT NULL;'
    })

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
