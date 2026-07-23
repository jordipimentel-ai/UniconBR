export async function extractPDFData(file: File) {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    const nome = file.name.toLowerCase()
    const dados: any = {}

    if (nome.includes('declaracao') || nome.includes('declaração')) {
      dados.pgdasDeclaracao = extractPGDASDeclaracaoData(fullText)
    } else if (nome.includes('recibo')) {
      dados.pgdasRecibo = extractPGDASReciboData(fullText)
    } else if (nome.includes('pgdas')) {
      // Nome genérico: tenta o formato mais completo (declaração) e cai para o recibo se não achar nada
      const declaracao = extractPGDASDeclaracaoData(fullText)
      if (declaracao.faturamento > 0) {
        dados.pgdasDeclaracao = declaracao
      } else {
        dados.pgdasRecibo = extractPGDASReciboData(fullText)
      }
    } else if (nome.includes('extrato') || nome.includes('folha') || nome.includes('pagamento')) {
      dados.folha = extractFolhaData(fullText)
    } else if (nome.includes('imposto') || nome.includes('taxa')) {
      dados.impostos = extractImpostosGenericos(fullText)
    }

    return dados
  } catch (error) {
    console.error('Erro ao extrair PDF:', error)
    throw new Error('Erro ao processar arquivo PDF')
  }
}

function parseValorBR(valor: string): number {
  return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0
}

// Textos extraídos de PDF por pdfjs costumam ter espaçamento irregular entre
// palavras (múltiplos espaços), então rótulos viram regex tolerante a isso.
function labelToRegexSource(label: string): string {
  return label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
}

const VALOR_BR = 'R?\\$?\\s*([\\d]{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+[.,]\\d{2})'

// Casa o primeiro valor monetário logo após um rótulo, tolerando texto entre eles
function matchValorAposLabel(text: string, label: string, maxGap = 40): number {
  const re = new RegExp(labelToRegexSource(label) + `[^\\d]{0,${maxGap}}?${VALOR_BR}`, 'i')
  const match = text.match(re)
  return match ? parseValorBR(match[1]) : 0
}

// Casa dois valores em sequência após um rótulo — usado quando o layout em
// tabela lista vários rótulos e só depois os valores correspondentes, em ordem
function matchDoisValoresAposLabel(text: string, label: string, maxGap1 = 200, maxGap2 = 30): [number, number] | null {
  const re = new RegExp(
    labelToRegexSource(label) + `[^\\d]{0,${maxGap1}}?${VALOR_BR}[^\\d]{1,${maxGap2}}?${VALOR_BR}`,
    'i'
  )
  const match = text.match(re)
  return match ? [parseValorBR(match[1]), parseValorBR(match[2])] : null
}

export interface FaturamentoMes {
  mes: string
  valor: number
}

// Seção "2.2.1) Mercado Interno" traz o faturamento (Receita Bruta) dos meses
// anteriores em pares "MM/AAAA valor", um após o outro
function extractHistoricoReceitas(text: string): FaturamentoMes[] {
  const inicio = text.search(/2\.2\.1\)\s*Mercado\s+Interno/i)
  if (inicio === -1) return []

  const fimRelativo = text.slice(inicio).search(/2\.2\.2\)\s*Mercado\s+Externo|2\.3\)/i)
  const fim = fimRelativo === -1 ? text.length : inicio + fimRelativo
  const trecho = text.slice(inicio, fim)

  const historico: FaturamentoMes[] = []
  const re = /(\d{2}\/\d{4})[^\d]{0,10}?([\d]{1,3}(?:\.\d{3})*,\d{2})/g
  let match
  while ((match = re.exec(trecho)) !== null) {
    historico.push({ mes: match[1], valor: parseValorBR(match[2]) })
  }
  return historico
}

// PGDAS-D Declaração: bloco "2.6) Resumo da Declaração" traz Receita Bruta
// Auferida e Valor Total do Débito Declarado em sequência, um logo após o outro
function extractPGDASDeclaracaoData(text: string) {
  let faturamento = 0
  let impostoTotal = 0

  const resumo = matchDoisValoresAposLabel(text, 'Receita Bruta Auferida')
  if (resumo) {
    faturamento = resumo[0]
    impostoTotal = resumo[1]
  }

  // Fallback: "Receita Bruta do PA (RPA) - Competência" (Mercado Interno | Mercado Externo | Total)
  if (!faturamento) {
    const re = new RegExp(
      labelToRegexSource('Receita Bruta do PA') + `[^\\d]{0,40}?${VALOR_BR}\\s*${VALOR_BR}\\s*${VALOR_BR}`,
      'i'
    )
    const rpa = text.match(re)
    if (rpa) faturamento = parseValorBR(rpa[3] || rpa[1])
  }

  const historico = extractHistoricoReceitas(text)
  const periodoAtual = extractPeriodoApuracao(text)

  return { faturamento, impostoTotal, historico, periodoAtual }
}

// "Período de Apuração: 01/06/2026 a 30/06/2026" -> extrai "06/2026", o mês a
// que pertence o faturamento (RPA) desta declaração — não incluído no histórico
function extractPeriodoApuracao(text: string): string | null {
  const re = new RegExp(labelToRegexSource('Período de Apuração') + `[^\\d]{0,10}?\\d{2}\\/(\\d{2})\\/(\\d{4})`, 'i')
  const match = text.match(re)
  return match ? `${match[1]}/${match[2]}` : null
}

// Recibo de Entrega do PGDAS-D: período e número da apuração (também números)
// aparecem entre o rótulo e os valores, então exige o marcador "R$" antes deles
function extractPGDASReciboData(text: string) {
  const re = new RegExp(
    labelToRegexSource('Receita Bruta') + `[\\s\\S]{0,300}?R\\$\\s*([\\d]{1,3}(?:\\.\\d{3})*,\\d{2})[\\s\\S]{0,30}?R\\$\\s*([\\d]{1,3}(?:\\.\\d{3})*,\\d{2})`,
    'i'
  )
  const match = text.match(re)
  return match
    ? { faturamento: parseValorBR(match[1]), impostoTotal: parseValorBR(match[2]) }
    : { faturamento: 0, impostoTotal: 0 }
}

// Extrato Mensal (folha de pagamento): "Total Geral Proventos" e "Total Geral
// Descontos" aparecem como dois rótulos seguidos pelos dois valores em sequência
function extractFolhaData(text: string) {
  const totais = matchDoisValoresAposLabel(text, 'Total Geral Proventos', 80, 30)
  if (totais) {
    return { salarios: totais[0], encargos: totais[1] }
  }

  // Fallback genérico para outros formatos de folha
  return {
    salarios: matchValorAposLabel(text, 'sal[áa]rio bruto|proventos totais'),
    encargos: matchValorAposLabel(text, 'encargos|contribui[çc][ãa]o patronal'),
  }
}

function extractImpostosGenericos(text: string) {
  const impostos: Record<string, number> = {}
  const rotulos = ['INSS', 'ICMS', 'PIS', 'COFINS', 'ISS']

  rotulos.forEach((rotulo) => {
    const valor = matchValorAposLabel(text, rotulo)
    if (valor > 0) impostos[rotulo] = valor
  })

  return impostos
}

function chaveOrdenacaoMes(mes: string): string {
  const [m, y] = mes.split('/')
  return `${y}-${m}`
}

// Junta o histórico de meses anteriores (vindo da Declaração do PGDAS) com o
// faturamento do próprio mês do relatório, ordena e mantém só os últimos 6
function montarHistoricoSeisMeses(historicoAnterior: FaturamentoMes[], periodo: string, faturamento: number): FaturamentoMes[] {
  const meses = [...historicoAnterior]

  if (periodo.includes('/') && faturamento > 0 && !meses.some((m) => m.mes === periodo)) {
    meses.push({ mes: periodo, valor: faturamento })
  }

  return meses.sort((a, b) => chaveOrdenacaoMes(a.mes).localeCompare(chaveOrdenacaoMes(b.mes))).slice(-6)
}

export interface DeclaracaoExtraida {
  faturamento: number
  historico: FaturamentoMes[]
  periodoAtual: string | null
}

// Monta os meses pedidos (mesesAlvo, no formato "MM/AAAA") a partir de uma ou
// mais Declarações do PGDAS. Cada declaração já traz até ~10 meses anteriores
// no seu próprio histórico, então normalmente um único arquivo recente cobre
// quase o período inteiro; meses sem dado nenhum voltam com valor 0 para o
// usuário revisar/preencher na mão.
export function montarPeriodoFaturamento(declaracoes: DeclaracaoExtraida[], mesesAlvo: string[]): FaturamentoMes[] {
  const mapa = new Map<string, number>()

  declaracoes.forEach((d) => {
    d.historico.forEach((h) => {
      if (h.valor > 0 && (!mapa.has(h.mes) || mapa.get(h.mes) === 0)) {
        mapa.set(h.mes, h.valor)
      }
    })
    if (d.periodoAtual && d.faturamento > 0) {
      mapa.set(d.periodoAtual, d.faturamento)
    }
  })

  return mesesAlvo.map((mes) => ({ mes, valor: mapa.get(mes) || 0 }))
}

export function consolidarDados(dados: any, cliente: string, periodo: string) {
  const pgdas = dados.pgdasDeclaracao?.faturamento
    ? dados.pgdasDeclaracao
    : dados.pgdasRecibo?.faturamento
    ? dados.pgdasRecibo
    : null

  const faturamento = pgdas?.faturamento || 0
  const impostos =
    pgdas?.impostoTotal ||
    (dados.impostos ? Object.values(dados.impostos).reduce((a: number, b: any) => a + b, 0) : 0)
  const aliquota = faturamento > 0 ? (impostos / faturamento) * 100 : 0

  const salarios = dados.folha?.salarios || 0
  const encargos = dados.folha?.encargos || 0

  const saldoLiquido = faturamento - (salarios + encargos + impostos)

  const historicoFaturamento = montarHistoricoSeisMeses(dados.pgdasDeclaracao?.historico || [], periodo, faturamento)

  return {
    cliente,
    periodo,
    faturamento,
    salarios,
    encargos,
    impostos,
    aliquota,
    saldoLiquido,
    historicoFaturamento,
    detalhes: dados,
  }
}
