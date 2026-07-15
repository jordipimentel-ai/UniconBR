import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userData } = await userClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem executar migrações' },
        { status: 403 }
      )
    }

    // Usar service_role key para executar as operações
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Adicionar coluna prioridade
    try {
      await adminClient.rpc('exec_sql', {
        query: `ALTER TABLE processos ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media';`,
      })
    } catch (err) {
      console.log('Coluna prioridade já existe ou erro menor')
    }

    // 2. Adicionar coluna status_tarefa
    try {
      await adminClient.rpc('exec_sql', {
        query: `ALTER TABLE processos ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';`,
      })
    } catch (err) {
      console.log('Coluna status_tarefa já existe ou erro menor')
    }

    // 3. Criar índices
    try {
      await adminClient.rpc('exec_sql', {
        query: `CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);`,
      })
    } catch (err) {
      console.log('Índice prioridade já existe')
    }

    try {
      await adminClient.rpc('exec_sql', {
        query: `CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);`,
      })
    } catch (err) {
      console.log('Índice status_tarefa já existe')
    }

    // 4. Verificar se colunas foram criadas
    const { data: columns, error: checkError } = await adminClient
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'processos')
      .in('column_name', ['prioridade', 'status_tarefa'])

    const hasColumns = columns && columns.length === 2

    if (hasColumns) {
      return NextResponse.json({
        success: true,
        message: '✅ Colunas prioridade e status_tarefa adicionadas com sucesso!',
        details: {
          columns: ['prioridade', 'status_tarefa'],
          table: 'processos',
          type: 'VARCHAR(50)',
          defaults: { prioridade: 'media', status_tarefa: 'pendente' },
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: '⚠️ Não foi possível verificar as colunas automaticamente.',
        instructions: `
          Por favor, execute manualmente no Supabase SQL Editor:

          ALTER TABLE processos
          ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media',
          ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';

          CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);
          CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);
        `,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
      })
    }
  } catch (error: any) {
    console.error('Erro na migração:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao executar migração',
        message: 'Se o erro persistir, execute manualmente no Supabase SQL Editor.',
      },
      { status: 500 }
    )
  }
}
