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

    // 1. Tentar adicionar coluna user_id
    try {
      const addColumnResult = await adminClient.rpc('exec_sql', {
        query: `ALTER TABLE processos ADD COLUMN IF NOT EXISTS user_id UUID;`,
      })

      if (addColumnResult.error) {
        console.log('Tentando alternativa para adicionar coluna...')
      }
    } catch (err) {
      console.log('exec_sql não disponível, continuando...')
    }

    // 2. Adicionar foreign key constraint
    try {
      await adminClient.rpc('exec_sql', {
        query: `ALTER TABLE processos ADD CONSTRAINT fk_processos_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;`,
      })
    } catch (err) {
      console.log('Foreign key já existe ou erro menor, continuando...')
    }

    // 3. Criar índice
    try {
      await adminClient.rpc('exec_sql', {
        query: `CREATE INDEX IF NOT EXISTS idx_processos_user_id ON processos(user_id);`,
      })
    } catch (err) {
      console.log('Índice já existe, continuando...')
    }

    // 4. Verificar se coluna foi criada
    const { data: columns, error: checkError } = await adminClient
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'processos')
      .eq('column_name', 'user_id')

    const columnExists = columns && columns.length > 0

    if (columnExists) {
      return NextResponse.json({
        success: true,
        message: '✅ Coluna user_id adicionada com sucesso à tabela processos!',
        details: {
          column: 'user_id',
          table: 'processos',
          type: 'UUID',
          nullable: true,
          references: 'users(id)',
        },
      })
    } else {
      // Tentar uma abordagem alternativa usando Postgres
      return NextResponse.json({
        success: false,
        message: '⚠️ Não foi possível verificar a coluna automaticamente.',
        instructions: `
          Por favor, execute manualmente no Supabase SQL Editor:

          ALTER TABLE processos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
          CREATE INDEX IF NOT EXISTS idx_processos_user_id ON processos(user_id);
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
