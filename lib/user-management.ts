import { supabase } from './supabase'

// Gerar senha aleatória
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Criar novo usuário
export async function createUser(
  email: string,
  password: string,
  nomeCompleto: string,
  role: 'admin' | 'colaborador'
) {
  try {
    // Criar no Auth
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    const userId = data.user.id

    // Inserir na tabela users
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          nome_completo: nomeCompleto,
          role,
          ativo: true,
        },
      ])

    if (dbError) throw dbError

    return { success: true, userId, error: null }
  } catch (error: any) {
    return { success: false, userId: null, error: error.message }
  }
}

// Listar usuários
export async function listUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Atualizar usuário
export async function updateUser(
  userId: string,
  updates: {
    nome_completo?: string
    role?: 'admin' | 'colaborador'
  }
) {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Desativar usuário
export async function deactivateUser(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ ativo: false })
      .eq('id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Ativar usuário
export async function activateUser(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ ativo: true })
      .eq('id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Deletar usuário (do Auth e da tabela)
export async function deleteUser(userId: string, email: string) {
  try {
    // Deletar da tabela users
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw dbError

    // Deletar do Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) throw authError

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Verificar se é admin
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    return data?.role === 'admin'
  } catch {
    return false
  }
}
