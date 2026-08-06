import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Informe o usuário e uma senha com pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Usar service_role key no backend (seguro) — troca de senha de outro
    // usuário exige privilégio admin do Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.auth.admin.updateUserById(userId, { password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
