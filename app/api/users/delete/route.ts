import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    // Usar service_role key no backend
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Deletar da tabela users
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) {
      return NextResponse.json(
        { error: `Erro ao deletar do banco: ${dbError.message}` },
        { status: 400 }
      )
    }

    // 2. Deletar do Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      return NextResponse.json(
        { error: `Erro ao deletar do auth: ${authError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${email} deletado com sucesso`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
