import { supabase } from './supabase'

export interface ClienteDocumento {
  id: string
  cliente_id: string
  nome_arquivo: string
  caminho_storage: string
  url: string
  tamanho_bytes: number | null
  criado_em: string
}

const BUCKET = 'clientes-documentos'

export async function listarDocumentosCliente(clienteId: string) {
  const { data, error } = await supabase
    .from('cliente_documentos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })

  return { data: (data as ClienteDocumento[] | null) || [], error: error?.message || null }
}

export async function uploadDocumentoCliente(clienteId: string, file: File) {
  try {
    const caminho = `${clienteId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(caminho, file)
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(caminho)

    const { error: insertError } = await supabase.from('cliente_documentos').insert([{
      cliente_id: clienteId,
      nome_arquivo: file.name,
      caminho_storage: caminho,
      url: urlData.publicUrl,
      tamanho_bytes: file.size,
    }])
    if (insertError) throw insertError

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao enviar arquivo' }
  }
}

export async function excluirDocumentoCliente(documento: ClienteDocumento) {
  try {
    await supabase.storage.from(BUCKET).remove([documento.caminho_storage])
    const { error } = await supabase.from('cliente_documentos').delete().eq('id', documento.id)
    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir arquivo' }
  }
}
