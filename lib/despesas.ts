import { supabase } from './supabase'

export type StatusDespesa = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

export interface Despesa {
  id: string
  descricao: string
  categoria: string | null
  valor: number
  vencimento: string
  status: StatusDespesa
  data_pagamento: string | null
  observacoes: string | null
}

export async function listarDespesas() {
  const { data, error } = await supabase
    .from('despesas')
    .select('*')
    .order('vencimento', { ascending: false })

  return { data: (data as Despesa[] | null) || [], error: error?.message || null }
}

export async function criarDespesa(dados: {
  descricao: string
  categoria?: string
  valor: number
  vencimento: string
  observacoes?: string
}) {
  const { error } = await supabase.from('despesas').insert([dados])
  return { success: !error, error: error?.message || null }
}

export async function atualizarStatusDespesasAtrasadas() {
  const hoje = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('despesas')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('vencimento', hoje)
  return { success: !error, error: error?.message || null }
}

export async function marcarDespesaComoPaga(id: string) {
  const { error } = await supabase
    .from('despesas')
    .update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10), atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function reverterDespesaParaPendente(id: string) {
  const { error } = await supabase
    .from('despesas')
    .update({ status: 'pendente', data_pagamento: null, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function excluirDespesa(id: string) {
  const { error } = await supabase.from('despesas').delete().eq('id', id)
  return { success: !error, error: error?.message || null }
}
