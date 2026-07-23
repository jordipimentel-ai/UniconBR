import { supabase } from './supabase'

export interface Escritorio {
  id: string
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  contador_nome: string
  contador_crc: string
  logo_url: string | null
  atualizado_em: string
}

// Como é um único registro de configuração do escritório, sempre busca a
// primeira linha existente (não há conceito de "vários escritórios" aqui)
export async function getEscritorio() {
  try {
    const { data, error } = await supabase
      .from('escritorio')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data: data as Escritorio | null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function salvarEscritorio(dados: Partial<Escritorio> & { id?: string }) {
  try {
    if (dados.id) {
      const { id, ...updates } = dados
      const { data, error } = await supabase
        .from('escritorio')
        .update({ ...updates, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }

    const { data, error } = await supabase
      .from('escritorio')
      .insert([{ ...dados, atualizado_em: new Date().toISOString() }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function uploadLogoEscritorio(file: File) {
  try {
    const extensao = file.name.split('.').pop()
    const nomeArquivo = `logo-${Date.now()}.${extensao}`

    const { error: uploadError } = await supabase.storage
      .from('escritorio')
      .upload(nomeArquivo, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('escritorio').getPublicUrl(nomeArquivo)
    return { url: data.publicUrl, error: null }
  } catch (error: any) {
    return { url: null, error: error.message }
  }
}
