import { supabase } from './supabase'

export type TerminoTipo = 'periodo' | 'indeterminado'
export type DescontoTipo = 'valor' | 'percentual'

export interface ContratoAtivo {
  id: string
  cliente_id: string
  numero_contrato: string | null
  descricao: string
  valor_mensal: number
  dia_vencimento: number
  dia_geracao: number
  data_inicio: string // 'YYYY-MM-DD'
  ativo: boolean
  categoria_financeira: string | null
  vendedor_id: string | null
  servico_id: string | null
  itens_valor: number | null
  desconto_tipo: DescontoTipo
  desconto_valor: number
  forma_pagamento: string | null
  conta_recebimento_id: string | null
  recorrencia_intervalo: number
  recorrencia_unidade: 'mes' | 'ano'
  termino_tipo: TerminoTipo
  data_termino: string | null
  clientes?: { nome_razao_social: string }
  users?: { nome_completo: string }
  servicos_cobranca?: { nome: string }
  contas_recebimento?: { nome: string }
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
  contratos_ativos?: { descricao: string; numero_contrato: string | null }
}

export interface ServicoCobranca {
  id: string
  nome: string
  valor_padrao: number | null
  ativo: boolean
}

export interface ContaRecebimento {
  id: string
  nome: string
  tipo: 'Caixa' | 'Banco'
  ativo: boolean
}

const SELECT_CONTRATOS = '*, clientes(nome_razao_social), users(nome_completo), servicos_cobranca(nome), contas_recebimento(nome)'
const SELECT_COBRANCAS = '*, clientes(nome_razao_social), contratos_ativos(descricao, numero_contrato)'

export async function listarContratosAtivos() {
  const { data, error } = await supabase
    .from('contratos_ativos')
    .select(SELECT_CONTRATOS)
    .order('criado_em', { ascending: false })

  return { data: (data as unknown as ContratoAtivo[] | null) || [], error: error?.message || null }
}

export async function gerarProximoNumeroContrato() {
  const { count } = await supabase.from('contratos_ativos').select('id', { count: 'exact', head: true })
  return String((count || 0) + 1)
}

export interface NovoContratoAtivo {
  cliente_id: string
  numero_contrato: string
  descricao: string
  valor_mensal: number
  dia_vencimento: number
  dia_geracao: number
  data_inicio: string
  categoria_financeira?: string
  vendedor_id?: string | null
  servico_id?: string | null
  itens_valor?: number
  desconto_tipo?: DescontoTipo
  desconto_valor?: number
  forma_pagamento?: string
  conta_recebimento_id?: string | null
  recorrencia_intervalo?: number
  recorrencia_unidade?: 'mes' | 'ano'
  termino_tipo?: TerminoTipo
  data_termino?: string | null
}

export async function criarContratoAtivo(dados: NovoContratoAtivo) {
  const { error } = await supabase.from('contratos_ativos').insert([dados])
  return { success: !error, error: error?.message || null }
}

export async function atualizarContratoAtivo(id: string, patch: Partial<ContratoAtivo>) {
  const { error } = await supabase.from('contratos_ativos').update(patch).eq('id', id)
  return { success: !error, error: error?.message || null }
}

// Exclui o contrato ativo e, por causa do ON DELETE CASCADE, todas as
// cobranças já geradas a partir dele também são removidas junto
export async function excluirContratoAtivo(id: string) {
  const { error } = await supabase.from('contratos_ativos').delete().eq('id', id)
  return { success: !error, error: error?.message || null }
}

export async function listarCobrancas() {
  const { data, error } = await supabase
    .from('cobrancas')
    .select(SELECT_COBRANCAS)
    .order('competencia', { ascending: false })

  return { data: (data as unknown as Cobranca[] | null) || [], error: error?.message || null }
}

function competenciaAtual(): { ano: number; mes: number; dia: number; data: string } {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() + 1
  const dia = hoje.getDate()
  return { ano, mes, dia, data: `${ano}-${String(mes).padStart(2, '0')}-01` }
}

// Garante que exista uma cobrança do mês atual para cada contrato ativo —
// já entra referente ao mês corrente assim que o mês começa (não espera o
// dia de geração chegar: se estamos em agosto, a cobrança já é "de agosto"),
// respeita a data de término, e não sobrescreve cobranças já existentes
// (pagas ou não) daquele mês
export async function gerarCobrancasDoMes() {
  const { data: contratos } = await listarContratosAtivos()
  const { ano, mes, data: competencia } = competenciaAtual()

  const ativos = contratos.filter((c) => {
    if (!c.ativo) return false
    if (c.data_inicio > competencia) return false
    if (c.termino_tipo === 'periodo' && c.data_termino && c.data_termino < competencia) return false
    return true
  })
  if (ativos.length === 0) return { criadas: 0, error: null }

  const linhas = ativos.map((c) => {
    // Se o dia de vencimento é anterior ao dia de geração, o vencimento cai
    // no mês seguinte — senão a cobrança venceria antes mesmo de existir
    // (ex.: gerada dia 28, vencendo dia 2 → vence 02 do mês seguinte, não do mesmo mês)
    let anoVenc = ano
    let mesVenc = mes
    if (c.dia_vencimento < (c.dia_geracao || 1)) {
      mesVenc += 1
      if (mesVenc > 12) {
        mesVenc = 1
        anoVenc += 1
      }
    }

    return {
      contrato_ativo_id: c.id,
      cliente_id: c.cliente_id,
      competencia,
      valor: c.valor_mensal,
      vencimento: `${anoVenc}-${String(mesVenc).padStart(2, '0')}-${String(c.dia_vencimento).padStart(2, '0')}`,
      status: 'pendente' as StatusCobranca,
    }
  })

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

// --- Serviços (submenu de Cobranças) ---

export async function listarServicos() {
  const { data, error } = await supabase
    .from('servicos_cobranca')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  return { data: (data as ServicoCobranca[] | null) || [], error: error?.message || null }
}

export async function criarServico(nome: string, valorPadrao?: number | null) {
  const { data, error } = await supabase
    .from('servicos_cobranca')
    .insert([{ nome, valor_padrao: valorPadrao ?? null }])
    .select()
    .single()
  return { data: data as ServicoCobranca | null, error: error?.message || null }
}

export async function excluirServico(id: string) {
  const { error } = await supabase.from('servicos_cobranca').update({ ativo: false }).eq('id', id)
  return { success: !error, error: error?.message || null }
}

// --- Contas de Recebimento (submenu de Cobranças) ---

export async function listarContasRecebimento() {
  const { data, error } = await supabase
    .from('contas_recebimento')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  return { data: (data as ContaRecebimento[] | null) || [], error: error?.message || null }
}

export async function criarContaRecebimento(nome: string, tipo: 'Caixa' | 'Banco') {
  const { data, error } = await supabase
    .from('contas_recebimento')
    .insert([{ nome, tipo }])
    .select()
    .single()
  return { data: data as ContaRecebimento | null, error: error?.message || null }
}

export async function excluirContaRecebimento(id: string) {
  const { error } = await supabase.from('contas_recebimento').update({ ativo: false }).eq('id', id)
  return { success: !error, error: error?.message || null }
}
