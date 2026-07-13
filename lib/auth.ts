import { supabase } from './supabase'

export async function signUp(email: string, password: string, nomeCompleto: string, role: 'admin' | 'colaborador') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          role,
        },
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return { data: data?.user || null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
