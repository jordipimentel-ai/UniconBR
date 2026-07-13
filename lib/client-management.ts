import { supabase } from './supabase'

interface Cliente {
  id: string
  nome_razao_social: string
  cpf_cnpj: string
  email: string
  telefone: string
  tipo: 'PF' | 'PJ'
  regime_tributario: string
  segmento: string
  em_funcionamento: boolean
  representante: string
  observacoes: string
  ativo: boolean
}

// Buscar cliente por ID
export async function getClienteById(id: string) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Atualizar cliente
export async function updateCliente(id: string, updates: Partial<Cliente>) {
  try {
    const { error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Deletar cliente (soft delete)
export async function deleteCliente(id: string) {
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
