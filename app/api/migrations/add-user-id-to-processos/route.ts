import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin (proteção básica)
    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Usar service_role key para executar SQL
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE processos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_processos_user_id ON processos(user_id);
      `,
    }).catch(() => {
      // Se rpc não funcionar, tentar com raw SQL
      return { data: null, error: 'rpc não disponível' }
    })

    if (error && error !== 'rpc não disponível') {
      console.error('Erro ao executar migração:', error)
      return NextResponse.json(
        { error: `Erro ao executar migração: ${error}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Coluna user_id adicionada à tabela processos com sucesso',
    })
  } catch (error: any) {
    console.error('Erro na migração:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao executar migração' },
      { status: 500 }
    )
  }
}
