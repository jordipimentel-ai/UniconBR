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
  maximo?: number
  camposPessoa: CampoSchema[]
}

// Um "tipo" de cláusula dentro de um grupo dinâmico — ex.: dentro de
// "Alterações", os tipos são Razão Social, Endereço, Capital, etc.,
// cada um com seus próprios campos
export interface TipoClausula {
  valor: string
  label: string
  campos: CampoSchema[]
}

// Grupo de cláusulas que o usuário vai adicionando uma a uma, escolhendo o
// tipo de cada uma (ex.: um contrato de alteração com várias alterações
// diferentes dentro do mesmo instrumento)
export interface GrupoClausulasDinamicas {
  key: string
  label: string
  tipos: TipoClausula[]
}

export interface ItemClausulaDinamica {
  tipo: string
  valores: ValoresCampos
}

export type ValoresCampos = Record<string, string | number>
export type ValoresPartes = Record<string, ValoresCampos[]>
export type ValoresClausulasDinamicas = Record<string, ItemClausulaDinamica[]>

export interface DadosContrato {
  campos: ValoresCampos
  partes: ValoresPartes
  clausulasDinamicas?: ValoresClausulasDinamicas
}

export interface ContratoTemplate {
  id: string
  categoria: string
  nome: string
  titulo: string
  campos: CampoSchema[]
  partes?: GrupoRepetivel[]
  clausulasDinamicas?: GrupoClausulasDinamicas[]
  gerarClausulas: (dados: DadosContrato) => string[]
  gerarAssinaturas: (dados: DadosContrato) => { nome: string; documento?: string }[]
}

const ORDINAIS = [
  'PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÉTIMA',
  'OITAVA', 'NONA', 'DÉCIMA', 'DÉCIMA PRIMEIRA', 'DÉCIMA SEGUNDA',
]

export function ordinal(indice: number): string {
  return ORDINAIS[indice] || `${indice + 1}ª`
}

export function itensClausula(dados: DadosContrato, key: string): ItemClausulaDinamica[] {
  return dados.clausulasDinamicas?.[key] || []
}

// Lê um campo de dentro de um item de cláusula dinâmica específico
export function itemTexto(item: ItemClausulaDinamica, key: string, padrao = ''): string {
  const v = item.valores[key]
  return v !== undefined && v !== null && v !== '' ? String(v) : padrao
}

export function itemNumero(item: ItemClausulaDinamica, key: string): number {
  const v = item.valores[key]
  return typeof v === 'number' ? v : parseFloat(String(v || '0').replace(',', '.')) || 0
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
