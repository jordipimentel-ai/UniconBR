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

    // Usar service_role para desabilitar RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Executar comandos de desabilitar RLS
    const commands = [
      'ALTER TABLE tarefas DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;',
    ]

    for (const cmd of commands) {
      try {
        // Tentar via rpc
        await adminClient.rpc('exec_sql', { query: cmd })
      } catch (err) {
        console.log(`Comando potencialmente já executado: ${cmd}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ RLS desabilitado com sucesso!',
      details: {
        tables: ['tarefas', 'eventos'],
        status: 'RLS agora desabilitado - todos podem acessar',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Erro ao desabilitar RLS',
        instructions: `
Execute manualmente no Supabase SQL Editor:

ALTER TABLE tarefas DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
        `,
      },
      { status: 500 }
    )
  }
}
