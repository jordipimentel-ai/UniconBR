// "new Date('YYYY-MM-DD')" interpreta a string como meia-noite em UTC. Em
// fusos atrás de UTC (como o Brasil), isso "volta" a data para o dia anterior
// ao converter para o horário local — fazendo datas no dia 1 do mês sumirem
// de comparações de intervalo, ou aparecerem um dia antes em exibições.
// Use sempre esta função para datas no formato YYYY-MM-DD (sem horário).
export function parseDataLocal(dataStr: string): Date {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function formatDataLocal(dataStr: string): string {
  return parseDataLocal(dataStr).toLocaleDateString('pt-BR')
}

const MESES_POR_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Ex.: parseDataLocal('2026-05-25') -> "25 de Maio de 2026"
export function formatDataPorExtenso(data: Date): string {
  return `${data.getDate()} de ${MESES_POR_EXTENSO[data.getMonth()]} de ${data.getFullYear()}`
}

export function nomeMesPorExtenso(mesIndex: number): string {
  return MESES_POR_EXTENSO[mesIndex] || ''
}

// Lista de chaves "MM/AAAA" de Janeiro a Dezembro de um ano
export function gerarMesesDoAno(ano: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${String(i + 1).padStart(2, '0')}/${ano}`)
}

// Lista de chaves "MM/AAAA" de Janeiro do anoInicial até Dezembro do ano seguinte (24 meses)
export function gerarMesesDoisAnos(anoInicial: number): string[] {
  return [...gerarMesesDoAno(anoInicial), ...gerarMesesDoAno(anoInicial + 1)]
}

// Lista de chaves "MM/AAAA" dos últimos 12 meses terminando no mês atual
export function gerarUltimos12Meses(): string[] {
  const hoje = new Date()
  const meses: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    meses.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`)
  }
  return meses
}

// Descreve um intervalo de meses "MM/AAAA" (assume que já vem ordenado) em
// texto por extenso, ex.: "Janeiro a Dezembro de 2025" ou
// "Agosto de 2025 a Julho de 2026" quando cruza o ano
export function descreverPeriodoMeses(mesesChaves: string[]): string {
  if (mesesChaves.length === 0) return ''

  const [mmIni, anoIni] = mesesChaves[0].split('/')
  const [mmFim, anoFim] = mesesChaves[mesesChaves.length - 1].split('/')
  const nomeIni = nomeMesPorExtenso(parseInt(mmIni, 10) - 1)
  const nomeFim = nomeMesPorExtenso(parseInt(mmFim, 10) - 1)

  if (anoIni === anoFim) {
    return `${nomeIni} a ${nomeFim} de ${anoIni}`
  }
  return `${nomeIni} de ${anoIni} a ${nomeFim} de ${anoFim}`
}
