import { supabase } from './supabase'

export type ProcessStatus =
  | 'Rascunho'
  | 'Recebido'
  | 'Em andamento'
  | 'Aguardando documentação'
  | 'Aguardando órgão externo'
  | 'Em revisão'
  | 'Concluído'
  | 'Cancelado'

interface Processo {
  id: string
  cliente_id: string
  tipo_processo_id: string
  status: ProcessStatus
  prazo: string
  descricao: string
  criado_em: string
  atualizado_em: string
  cliente?: { nome_razao_social: string }
  tipo_processo?: { nome: string }
}

// Listar processos
export async function listProcessos() {
  try {
    const { data, error } = await supabase
      .from('processos')
      .select(`
        *,
        cliente:clientes(nome_razao_social),
        tipo_processo:tipos_processo(nome)
      `)
      .order('criado_em', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Buscar processo por ID
export async function getProcessoById(id: string) {
  try {
    const { data, error } = await supabase
      .from('processos')
      .select(`
        *,
        cliente:clientes(*),
        tipo_processo:tipos_processo(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Criar processo
export async function createProcesso(processo: {
  cliente_id: string
  tipo_processo_id: string
  status: ProcessStatus
  prazo: string
  descricao: string
}) {
  try {
    const { data, error } = await supabase
      .from('processos')
      .insert([processo])
      .select(`
        *,
        cliente:clientes(nome_razao_social),
        tipo_processo:tipos_processo(nome)
      `)

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Atualizar status do processo
export async function updateProcessoStatus(id: string, status: ProcessStatus) {
  try {
    const { error } = await supabase
      .from('processos')
      .update({ status, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Atualizar processo
export async function updateProcesso(id: string, updates: Partial<Processo>) {
  try {
    const { error } = await supabase
      .from('processos')
      .update({ ...updates, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Deletar processo
export async function deleteProcesso(id: string) {
  try {
    const { error } = await supabase
      .from('processos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Listar tipos de processo
export async function listTiposProcesso() {
  try {
    const { data, error } = await supabase
      .from('tipos_processo')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Listar clientes
export async function listClientes() {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .order('nome_razao_social', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
