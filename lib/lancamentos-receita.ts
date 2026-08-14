import { supabase } from './supabase'

export type StatusLancamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

export interface LancamentoReceita {
  id: string
  cliente_id: string | null
  descricao: string
  categoria: string | null
  valor: number
  vencimento: string
  status: StatusLancamento
  data_pagamento: string | null
  observacoes: string | null
  clientes?: { nome_razao_social: string }
}

const SELECT_LANCAMENTOS = '*, clientes(nome_razao_social)'

export async function listarLancamentos() {
  const { data, error } = await supabase
    .from('lancamentos_receita')
    .select(SELECT_LANCAMENTOS)
    .order('vencimento', { ascending: false })

  return { data: (data as unknown as LancamentoReceita[] | null) || [], error: error?.message || null }
}

export async function criarLancamento(dados: {
  cliente_id?: string | null
  descricao: string
  categoria?: string
  valor: number
  vencimento: string
  observacoes?: string
}) {
  const { error } = await supabase.from('lancamentos_receita').insert([dados])
  return { success: !error, error: error?.message || null }
}

export async function atualizarStatusLancamentosAtrasados() {
  const hoje = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('lancamentos_receita')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('vencimento', hoje)
  return { success: !error, error: error?.message || null }
}

export async function marcarLancamentoComoPago(id: string) {
  const { error } = await supabase
    .from('lancamentos_receita')
    .update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10), atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function reverterLancamentoParaPendente(id: string) {
  const { error } = await supabase
    .from('lancamentos_receita')
    .update({ status: 'pendente', data_pagamento: null, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function excluirLancamento(id: string) {
  const { error } = await supabase.from('lancamentos_receita').delete().eq('id', id)
  return { success: !error, error: error?.message || null }
}
