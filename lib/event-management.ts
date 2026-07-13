import { supabase } from './supabase'

export type RepetirEvento = 'nao' | 'diario' | 'semanal' | 'mensal' | 'anual'

interface Evento {
  id: string
  titulo: string
  descricao: string
  data: string
  hora: string
  tipo: 'evento' | 'compromisso' | 'prazo'
  repetir: RepetirEvento
  cor: string
  criado_em: string
}

// Criar evento
export async function createEvento(evento: Omit<Evento, 'id' | 'criado_em'>) {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .insert([evento])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Listar eventos por mês
export async function listEventosPorMes(ano: number, mes: number) {
  try {
    const primeirodia = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimodia = `${ano}-${String(mes).padStart(2, '0')}-31`

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .gte('data', primeirodia)
      .lte('data', ultimodia)
      .order('data', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Buscar evento por ID
export async function getEventoById(id: string) {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Atualizar evento
export async function updateEvento(id: string, updates: Partial<Evento>) {
  try {
    const { error } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Deletar evento
export async function deleteEvento(id: string) {
  try {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
