import { supabase } from './supabase'

export interface RegistroFinanceiroCliente {
  id: string
  cliente_id: string
  mes_referencia: string // 'YYYY-MM-DD', sempre dia 1
  faturamento: number | null
  folha_paga: boolean
  folha_valor: number | null
  notas_compra_quantidade: number | null
  notas_compra_valor: number | null
  observacoes: string | null
}

export type NovoRegistroFinanceiro = Omit<RegistroFinanceiroCliente, 'id'>

export async function listarRegistrosFinanceiros(clienteId: string) {
  const { data, error } = await supabase
    .from('registros_financeiros_clientes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('mes_referencia', { ascending: false })

  return { data: (data as RegistroFinanceiroCliente[] | null) || [], error: error?.message || null }
}

export async function salvarRegistroFinanceiro(
  registro: NovoRegistroFinanceiro,
  id?: string
) {
  if (id) {
    const { error } = await supabase
      .from('registros_financeiros_clientes')
      .update({ ...registro, atualizado_em: new Date().toISOString() })
      .eq('id', id)
    return { success: !error, error: error?.message || null }
  }

  const { error } = await supabase.from('registros_financeiros_clientes').insert([registro])
  return { success: !error, error: error?.message || null }
}

export async function excluirRegistroFinanceiro(id: string) {
  const { error } = await supabase.from('registros_financeiros_clientes').delete().eq('id', id)
  return { success: !error, error: error?.message || null }
}
