import { supabase } from './supabase'

export interface ContratoAtivo {
  id: string
  cliente_id: string
  descricao: string
  valor_mensal: number
  dia_vencimento: number
  data_inicio: string // 'YYYY-MM-DD'
  ativo: boolean
  clientes?: { nome_razao_social: string }
}

export type StatusCobranca = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

export interface Cobranca {
  id: string
  contrato_ativo_id: string
  cliente_id: string
  competencia: string // 'YYYY-MM-DD', dia 1
  valor: number
  vencimento: string
  status: StatusCobranca
  data_pagamento: string | null
  observacoes: string | null
  clientes?: { nome_razao_social: string }
  contratos_ativos?: { descricao: string }
}

const SELECT_CONTRATOS = '*, clientes(nome_razao_social)'
const SELECT_COBRANCAS = '*, clientes(nome_razao_social), contratos_ativos(descricao)'

export async function listarContratosAtivos() {
  const { data, error } = await supabase
    .from('contratos_ativos')
    .select(SELECT_CONTRATOS)
    .order('criado_em', { ascending: false })

  return { data: (data as unknown as ContratoAtivo[] | null) || [], error: error?.message || null }
}

export async function criarContratoAtivo(dados: {
  cliente_id: string
  descricao: string
  valor_mensal: number
  dia_vencimento: number
  data_inicio: string
}) {
  const { error } = await supabase.from('contratos_ativos').insert([dados])
  return { success: !error, error: error?.message || null }
}

export async function atualizarContratoAtivo(id: string, patch: Partial<ContratoAtivo>) {
  const { error } = await supabase.from('contratos_ativos').update(patch).eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function listarCobrancas() {
  const { data, error } = await supabase
    .from('cobrancas')
    .select(SELECT_COBRANCAS)
    .order('competencia', { ascending: false })

  return { data: (data as unknown as Cobranca[] | null) || [], error: error?.message || null }
}

function competenciaAtual(): { ano: number; mes: number; data: string } {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() + 1
  return { ano, mes, data: `${ano}-${String(mes).padStart(2, '0')}-01` }
}

// Garante que exista uma cobrança do mês atual para cada contrato ativo —
// não sobrescreve cobranças já existentes (pagas ou não) daquele mês
export async function gerarCobrancasDoMes() {
  const { data: contratos } = await listarContratosAtivos()
  const { ano, mes, data: competencia } = competenciaAtual()

  const ativos = contratos.filter((c) => c.ativo && c.data_inicio <= competencia)
  if (ativos.length === 0) return { criadas: 0, error: null }

  const linhas = ativos.map((c) => ({
    contrato_ativo_id: c.id,
    cliente_id: c.cliente_id,
    competencia,
    valor: c.valor_mensal,
    vencimento: `${ano}-${String(mes).padStart(2, '0')}-${String(c.dia_vencimento).padStart(2, '0')}`,
    status: 'pendente' as StatusCobranca,
  }))

  const { error } = await supabase
    .from('cobrancas')
    .upsert(linhas, { onConflict: 'contrato_ativo_id,competencia', ignoreDuplicates: true })

  return { criadas: error ? 0 : linhas.length, error: error?.message || null }
}

// Qualquer cobrança pendente cujo vencimento já passou vira "atrasada"
export async function atualizarStatusAtrasados() {
  const hoje = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('cobrancas')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('vencimento', hoje)

  return { success: !error, error: error?.message || null }
}

export async function marcarCobrancaComoPaga(id: string) {
  const { error } = await supabase
    .from('cobrancas')
    .update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10), atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function reverterCobrancaParaPendente(id: string) {
  const { error } = await supabase
    .from('cobrancas')
    .update({ status: 'pendente', data_pagamento: null, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function excluirCobranca(id: string) {
  const { error } = await supabase.from('cobrancas').delete().eq('id', id)
  return { success: !error, error: error?.message || null }
}
