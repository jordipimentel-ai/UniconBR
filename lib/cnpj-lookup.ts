// Busca dados públicos de CNPJ via BrasilAPI, que replica a base pública do
// CNPJ da Receita Federal (sem necessidade de login/certificado — é aberto).
// https://brasilapi.com.br/docs#tag/CNPJ

export interface DadosCNPJ {
  nomeRazaoSocial: string
  nomeFantasia: string
  endereco: string
  cnaes: string
  porte: string
  naturezaJuridica: string
  dataAbertura: string // 'YYYY-MM-DD'
}

interface CnaeSecundario {
  codigo: number
  descricao: string
}

interface BrasilAPICNPJResponse {
  razao_social?: string
  nome_fantasia?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  cnae_fiscal_descricao?: string
  cnaes_secundarios?: CnaeSecundario[]
  descricao_porte?: string
  porte?: string
  natureza_juridica?: string
  data_inicio_atividade?: string
}

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

function montarEndereco(d: BrasilAPICNPJResponse): string {
  const partes = [
    [d.logradouro, d.numero].filter(Boolean).join(', '),
    d.complemento,
    d.bairro,
    [d.municipio, d.uf].filter(Boolean).join(' - '),
    d.cep ? `CEP ${d.cep}` : '',
  ].filter(Boolean)
  return partes.join(', ')
}

function montarCnaes(d: BrasilAPICNPJResponse): string {
  const lista = [d.cnae_fiscal_descricao, ...(d.cnaes_secundarios || []).map((c) => c.descricao)].filter(Boolean)
  return lista.join('; ')
}

export async function buscarDadosCNPJ(cnpj: string): Promise<{ data: DadosCNPJ | null; error: string | null }> {
  const digitos = apenasDigitos(cnpj)
  if (digitos.length !== 14) {
    return { data: null, error: 'Informe um CNPJ completo (14 dígitos) antes de buscar' }
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`)

    if (res.status === 404) {
      return { data: null, error: 'CNPJ não encontrado na base da Receita Federal' }
    }
    if (!res.ok) {
      return { data: null, error: 'Não foi possível consultar o CNPJ agora. Tente novamente em instantes.' }
    }

    const d: BrasilAPICNPJResponse = await res.json()

    return {
      data: {
        nomeRazaoSocial: d.razao_social || '',
        nomeFantasia: d.nome_fantasia || '',
        endereco: montarEndereco(d),
        cnaes: montarCnaes(d),
        porte: d.descricao_porte || d.porte || '',
        naturezaJuridica: d.natureza_juridica || '',
        dataAbertura: d.data_inicio_atividade || '',
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Erro de conexão ao consultar o CNPJ' }
  }
}
