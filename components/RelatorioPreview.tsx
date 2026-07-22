interface FaturamentoMes {
  mes: string
  valor: number
}

interface RelatorioPreviewProps {
  relatorio: {
    cliente: string
    periodo: string
    faturamento: number
    salarios: number
    encargos: number
    impostos: number
    aliquota: number
    saldoLiquido: number
    historicoFaturamento?: FaturamentoMes[]
    detalhes: any
  }
}

export default function RelatorioPreview({ relatorio }: RelatorioPreviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (valor: number) => {
    if (valor < 0) return 'text-red-600'
    if (valor > 10000) return 'text-green-600'
    return 'text-gray-900'
  }

  const formatMes = (mes: string) => {
    const [m, y] = mes.split('/')
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${nomes[parseInt(m, 10) - 1]}/${y.slice(2)}`
  }

  const historico = relatorio.historicoFaturamento || []
  const maiorValor = Math.max(...historico.map((h) => h.valor), 1)

  return (
    <div id="relatorio-preview" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-200 pb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">UniConBR</h2>
            <p className="text-gray-600">Gestão de Escritório</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Data de Geração</p>
            <p className="font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Cliente</p>
            <p className="font-semibold text-gray-900">{relatorio.cliente}</p>
          </div>
          <div>
            <p className="text-gray-600">Período</p>
            <p className="font-semibold text-gray-900">{relatorio.periodo}</p>
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo Executivo</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Faturamento Total</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(relatorio.faturamento)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Total de Saídas</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(relatorio.salarios + relatorio.encargos + relatorio.impostos)}
            </p>
          </div>
          <div className={`bg-blue-50 rounded-lg p-4 border border-blue-200 ${getStatusColor(relatorio.saldoLiquido)}`}>
            <p className="text-sm text-gray-600 mb-1">Saldo Líquido</p>
            <p className={`text-2xl font-bold ${getStatusColor(relatorio.saldoLiquido)}`}>
              {formatCurrency(relatorio.saldoLiquido)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Entradas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">ENTRADAS</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Descrição</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">Faturamento</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatCurrency(relatorio.faturamento)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela de Saídas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">SAÍDAS</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Descrição</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Valor</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.salarios > 0 && (
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">Salários</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    -{formatCurrency(relatorio.salarios)}
                  </td>
                </tr>
              )}
              {relatorio.encargos > 0 && (
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">Encargos e Descontos da Folha (INSS)</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    -{formatCurrency(relatorio.encargos)}
                  </td>
                </tr>
              )}
              {relatorio.impostos > 0 && (
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    Impostos e Taxas (Simples Nacional)
                    <span className="ml-2 text-xs font-semibold text-gray-500">
                      Alíquota efetiva: {relatorio.aliquota.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    -{formatCurrency(relatorio.impostos)}
                  </td>
                </tr>
              )}
              <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total de Saídas</td>
                <td className="px-4 py-3 text-right text-red-600">
                  -{formatCurrency(relatorio.salarios + relatorio.encargos + relatorio.impostos)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Faturamento */}
      {historico.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">FATURAMENTO DOS ÚLTIMOS {historico.length} MESES</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-end justify-between gap-3" style={{ height: '160px' }}>
              {historico.map((item) => {
                const alturaPercentual = Math.max((item.valor / maiorValor) * 100, 2)
                const ehMesAtual = item.mes === relatorio.periodo
                return (
                  <div key={item.mes} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-semibold text-gray-700 mb-1 whitespace-nowrap">
                      {formatCurrency(item.valor).replace('R$', '').trim()}
                    </span>
                    <div
                      className={`w-full rounded-t ${ehMesAtual ? 'bg-blue-600' : 'bg-blue-300'}`}
                      style={{ height: `${alturaPercentual}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-600 mt-2 font-medium">{formatMes(item.mes)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resumo Final */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Saldo Líquido</p>
            <p className={`text-3xl font-bold ${getStatusColor(relatorio.saldoLiquido)}`}>
              {formatCurrency(relatorio.saldoLiquido)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-2">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-600">Período: {relatorio.periodo}</p>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-600">
        <p>Este é um documento gerado automaticamente pelo sistema UniConBR</p>
        <p className="mt-2">Consulte um profissional habilitado para validar os dados</p>
      </div>
    </div>
  )
}
