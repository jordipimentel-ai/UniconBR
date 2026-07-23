import { parseDataLocal, formatDataPorExtenso, nomeMesPorExtenso } from '@/lib/date-utils'

interface FaturamentoMes {
  mes: string
  valor: number
}

interface DeclaracaoFaturamentoPreviewProps {
  declaracao: {
    clienteNome: string
    clienteCnpj: string
    ano: number
    cidade: string
    dataEmissao: string
    contadorNome: string
    contadorCRC: string
    meses: FaturamentoMes[]
  }
}

export default function DeclaracaoFaturamentoPreview({ declaracao }: DeclaracaoFaturamentoPreviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const total = declaracao.meses.reduce((acc, m) => acc + m.valor, 0)
  const dataEmissaoFormatada = declaracao.dataEmissao
    ? formatDataPorExtenso(parseDataLocal(declaracao.dataEmissao))
    : ''

  return (
    <div id="declaracao-preview" className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 space-y-8">
      {/* Cabeçalho com logo */}
      <div className="flex flex-col items-center text-center border-b-2 border-gray-200 pb-6">
        <img src="/logo-jr-contabilidade.jpg" alt="Logo" className="h-24 object-contain mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 tracking-wide">DECLARAÇÃO DE FATURAMENTO</h2>
      </div>

      {/* Cidade e data */}
      <div className="text-right text-sm text-gray-700">
        {declaracao.cidade}, {dataEmissaoFormatada}.
      </div>

      {/* Corpo da declaração */}
      <div className="text-justify text-gray-900 leading-relaxed">
        <p>
          Eu, <span className="font-semibold">{declaracao.contadorNome}</span>, Contador Responsável da{' '}
          <span className="font-semibold">{declaracao.clienteNome}</span>
          {declaracao.clienteCnpj && <> CNPJ: <span className="font-semibold">{declaracao.clienteCnpj}</span></>},
          {' '}INFORMO, que constam em seus registros os seguintes valores, incluindo suas filiais em território
          nacional e subsidiárias no exterior, no período de{' '}
          <span className="font-semibold">Janeiro a Dezembro de {declaracao.ano}</span>:
        </p>
      </div>

      {/* Tabela de faturamento mensal */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Período</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Consolidado</th>
            </tr>
          </thead>
          <tbody>
            {declaracao.meses.map((m) => {
              const [mm] = m.mes.split('/')
              const nomeMes = nomeMesPorExtenso(parseInt(mm, 10) - 1).slice(0, 3)
              return (
                <tr key={m.mes} className="border-b border-gray-200">
                  <td className="px-4 py-2 text-gray-900 border-r border-gray-200">{nomeMes}.</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(m.valor)}</td>
                </tr>
              )
            })}
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <td className="px-4 py-2 text-gray-900 border-r border-gray-300">Total</td>
              <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Assinatura */}
      <div className="pt-16 text-center">
        <div className="inline-block border-t border-gray-400 pt-2 px-8">
          <p className="font-semibold text-gray-900">{declaracao.contadorNome}</p>
          <p className="text-sm text-gray-600">CRC: {declaracao.contadorCRC}</p>
        </div>
      </div>
    </div>
  )
}
