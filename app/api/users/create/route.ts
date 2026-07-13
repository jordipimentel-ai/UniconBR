import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nome_completo, role } = await request.json()

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
