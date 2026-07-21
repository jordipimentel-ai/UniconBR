import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export async function extractPDFData(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    const dados: any = {}

    if (file.name.toLowerCase().includes('pgdas') || file.name.toLowerCase().includes('declaração')) {
      dados.pgdas = extractPGDASData(fullText)
    } else if (file.name.toLowerCase().includes('folha') || file.name.toLowerCase().includes('pagamento')) {
      dados.folha = extractFolhaData(fullText)
    } else if (file.name.toLowerCase().includes('imposto') || file.name.toLowerCase().includes('taxa')) {
      dados.impostos = extractImpostosData(fullText)
    }

    return dados
  } catch (error) {
    console.error('Erro ao extrair PDF:', error)
    throw new Error('Erro ao processar arquivo PDF')
  }
}

function extractPGDASData(text: string) {
  const faturamento = extractValue(text, /faturamento|receita total|base de cálculo/gi)
  const impostos: Record<string, number> = {}

  impostos['INSS'] = extractValue(text, /INSS|Contribuição Sindical/gi)
  impostos['PIS'] = extractValue(text, /PIS|Programa de Integração/gi)
  impostos['COFINS'] = extractValue(text, /COFINS/gi)
  impostos['ICMS'] = extractValue(text, /ICMS/gi)
  impostos['ISS'] = extractValue(text, /ISS/gi)

  return {
    faturamento: faturamento || 0,
    impostos: Object.fromEntries(Object.entries(impostos).filter(([, v]) => v > 0))
  }
}

function extractFolhaData(text: string) {
  return {
    salarios: extractValue(text, /salário|provento|remuneração|bruto/gi) || 0,
    descontos: extractValue(text, /desconto|INSS|IRRF/gi) || 0,
    encargos: extractValue(text, /encargo|FGTS|contribuição patronal/gi) || 0
  }
}

function extractImpostosData(text: string) {
  const impostos: Record<string, number> = {}
  const patterns = {
    'INSS': /INSS.*?(\d+[.,]\d{2})/gi,
    'ICMS': /ICMS.*?(\d+[.,]\d{2})/gi,
    'PIS': /PIS.*?(\d+[.,]\d{2})/gi,
    'COFINS': /COFINS.*?(\d+[.,]\d{2})/gi,
    'ISS': /ISS.*?(\d+[.,]\d{2})/gi,
  }

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern)
    if (match) {
      const value = match[1].replace(',', '.')
      impostos[key] = parseFloat(value)
    }
  })

  return impostos
}

function extractValue(text: string, pattern: RegExp): number {
  const match = text.match(new RegExp(pattern.source + r'[:\s]*R?\$?\s*([\d.,]+)', pattern.flags))
  if (match && match[1]) {
    return parseFloat(match[1].replace('.', '').replace(',', '.'))
  }
  return 0
}

export function consolidarDados(dados: any, cliente: string, periodo: string) {
  const faturamento = dados.pgdas?.faturamento || 0
  const salarios = dados.folha?.salarios || 0
  const encargos = dados.folha?.encargos || 0
  
  let impostos = 0
  if (dados.pgdas?.impostos) {
    impostos += Object.values(dados.pgdas.impostos).reduce((a: number, b: any) => a + b, 0)
  }
  if (dados.impostos) {
    impostos += Object.values(dados.impostos).reduce((a: number, b: any) => a + b, 0)
  }

  const saldoLiquido = faturamento - (salarios + encargos + impostos)

  return {
    cliente,
    periodo,
    faturamento,
    salarios,
    encargos,
    impostos,
    saldoLiquido,
    detalhes: dados
  }
}
