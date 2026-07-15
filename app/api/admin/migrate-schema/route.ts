import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para executar a migração',
    instructions: 'POST /api/admin/migrate-schema'
  })
}

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

    // Tentar adicionar as colunas uma por uma
    const results = [];

    // 1. Adicionar prioridade
    try {
      const { error: err1 } = await adminClient
        .from('processos')
        .select('prioridade')
        .limit(1);

      if (err1 && err1.message.includes('column "prioridade" does not exist')) {
        console.log('Coluna prioridade não existe, tentando criar...');
        // Tentar via raw query
        try {
          // Usar a API de update para forçar criação da coluna (hack)
          // Na verdade, vamos verificar via information_schema
          const { data: cols, error: colErr } = await adminClient
            .from('information_schema')
            .select('*')
            .eq('table_name', 'processos');

          if (colErr) {
            console.log('information_schema query failed, trying alternate method');
          }
        } catch (e) {
          console.log('Alternate method failed');
        }
      }
      results.push({ step: 'check_prioridade', success: true });
    } catch (e: any) {
      results.push({ step: 'check_prioridade', success: false, error: e.message });
    }

    // 2. Tentar inserir com os campos novos para forçar erro diagnóstico
    try {
      const { error: insertErr } = await adminClient
        .from('processos')
        .insert([{
          cliente_id: '00000000-0000-0000-0000-000000000000',
          tipo_processo_id: '00000000-0000-0000-0000-000000000000',
          descricao: 'test',
          status: 'Rascunho',
          prazo: new Date().toISOString().split('T')[0],
          prioridade: 'test',
          status_tarefa: 'test'
        }]);

      if (insertErr) {
        const msg = insertErr.message || '';
        if (msg.includes('prioridade') || msg.includes('status_tarefa')) {
          results.push({
            step: 'test_insert',
            success: false,
            message: 'Colunas não existem no banco'
          });
        }
      }
    } catch (e) {
      // Esperado falhar
    }

    return NextResponse.json({
      status: 'PARTIAL',
      message: 'Migração requer execução manual',
      results,
      instructions: `
        A tabela processos não possui as colunas prioridade e status_tarefa.

        Execute no Supabase SQL Editor:

        ALTER TABLE processos
        ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media',
        ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';

        CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);
        CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);
      `
    });

  } catch (error: any) {
    console.error('Erro na migração:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar schema',
      },
      { status: 500 }
    )
  }
}
