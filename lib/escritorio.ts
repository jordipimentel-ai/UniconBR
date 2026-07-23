import { supabase } from './supabase'

export interface ContadorResponsavel {
  nome: string
  crc: string
}

export interface Escritorio {
  id: string
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  // Campos antigos (um único contador) mantidos só para migrar registros
  // salvos antes da lista de vários contadores existir
  contador_nome?: string
  contador_crc?: string
  contadores: ContadorResponsavel[]
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

    if (data) {
      // Migra o registro antigo (contador único) para o novo formato em lista,
      // caso ainda não tenha sido preenchido
      if ((!data.contadores || data.contadores.length === 0) && data.contador_nome) {
        data.contadores = [{ nome: data.contador_nome, crc: data.contador_crc || '' }]
      }
      if (!data.contadores) data.contadores = []
    }

    return { data: data as Escritorio | null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function salvarEscritorio(dados: Partial<Escritorio> & { id?: string }) {
  try {
    // Remove explicitamente o "id" do payload em vez de confiar que uma
    // chave com valor undefined some sozinha na serialização — assim o
    // banco sempre aplica o DEFAULT gen_random_uuid() na criação
    const { id, ...resto } = dados

    if (id) {
      const { data, error } = await supabase
        .from('escritorio')
        .update({ ...resto, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }

    const { data, error } = await supabase
      .from('escritorio')
      .insert([{ ...resto, atualizado_em: new Date().toISOString() }])
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
