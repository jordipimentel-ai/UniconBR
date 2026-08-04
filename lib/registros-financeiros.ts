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

// Converte "MM/AAAA" (formato usado no processamento de PDF/Relatórios) para
// a data de referência do banco, sempre dia 1 do mês ("AAAA-MM-01")
export function mesAnoParaData(mesAno: string): string | null {
  const match = mesAno.match(/^(\d{2})\/(\d{4})$/)
  if (!match) return null
  return `${match[2]}-${match[1]}-01`
}

// Grava/atualiza só os campos informados para aquele cliente+mês, sem afetar
// outros campos já preenchidos manualmente (folha, notas de compra etc.) —
// usado tanto pelo upload de PGDAS quanto pela geração de Relatórios
export async function upsertRegistroFinanceiroMes(
  clienteId: string,
  mesReferenciaData: string,
  patch: Partial<Pick<RegistroFinanceiroCliente, 'faturamento' | 'folha_paga' | 'folha_valor'>>
) {
  const { error } = await supabase
    .from('registros_financeiros_clientes')
    .upsert(
      { cliente_id: clienteId, mes_referencia: mesReferenciaData, ...patch, atualizado_em: new Date().toISOString() },
      { onConflict: 'cliente_id,mes_referencia' }
    )
  return { success: !error, error: error?.message || null }
}
