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
