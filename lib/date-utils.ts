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
