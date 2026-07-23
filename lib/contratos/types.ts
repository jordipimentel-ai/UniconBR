import { formatDataLocal } from '../date-utils'

export type CampoTipo = 'texto' | 'textarea' | 'numero' | 'data' | 'select' | 'moeda'

export interface CampoSchema {
  key: string
  label: string
  tipo: CampoTipo
  opcoes?: string[]
  obrigatorio?: boolean
  placeholder?: string
  padrao?: string | number
}

export interface GrupoRepetivel {
  key: string
  label: string
  labelSingular: string
  minimo: number
  camposPessoa: CampoSchema[]
}

export type ValoresCampos = Record<string, string | number>
export type ValoresPartes = Record<string, ValoresCampos[]>

export interface DadosContrato {
  campos: ValoresCampos
  partes: ValoresPartes
}

export interface ContratoTemplate {
  id: string
  categoria: string
  nome: string
  titulo: string
  campos: CampoSchema[]
  partes?: GrupoRepetivel[]
  gerarClausulas: (dados: DadosContrato) => string[]
  gerarAssinaturas: (dados: DadosContrato) => { nome: string; documento?: string }[]
}

export function texto(dados: DadosContrato, key: string, padrao = ''): string {
  const v = dados.campos[key]
  return v !== undefined && v !== null && v !== '' ? String(v) : padrao
}

// Formata um campo de data (YYYY-MM-DD) para o padrão brasileiro DD/MM/AAAA
export function dataFmt(dados: DadosContrato, key: string): string {
  const v = dados.campos[key]
  if (!v) return ''
  try {
    return formatDataLocal(String(v))
  } catch {
    return String(v)
  }
}

export function numero(dados: DadosContrato, key: string): number {
  const v = dados.campos[key]
  return typeof v === 'number' ? v : parseFloat(String(v || '0').replace(',', '.')) || 0
}

export function formatMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export function pessoas(dados: DadosContrato, key: string): ValoresCampos[] {
  return dados.partes[key] || []
}

// Descreve uma pessoa no padrão jurídico: "NOME, nacionalidade, estado civil,
// profissão, portador do CPF nº X e RG nº Y, residente e domiciliado em Z"
export function qualificacaoPessoa(p: ValoresCampos): string {
  const partes = [
    String(p.nome || '').toUpperCase(),
    p.nacionalidade || 'brasileiro(a)',
    p.estado_civil,
    p.profissao,
  ].filter(Boolean)

  let texto = partes.join(', ')
  if (p.rg) texto += `, portador(a) do RG nº ${p.rg}`
  if (p.cpf) texto += `${p.rg ? ' e' : ','} portador(a) do CPF nº ${p.cpf}`
  if (p.endereco) texto += `, residente e domiciliado(a) em ${p.endereco}`
  return texto
}

export function listaPessoas(pessoas: ValoresCampos[]): string {
  return pessoas.map((p) => qualificacaoPessoa(p)).join('; e ')
}
