import { parseDataLocal, formatDataPorExtenso, nomeMesPorExtenso, descreverPeriodoMeses } from '@/lib/date-utils'

interface FaturamentoMes {
  mes: string
  valor: number
}

interface DeclaracaoFaturamentoPreviewProps {
  declaracao: {
    clienteNome: string
    clienteCnpj: string
    cidade: string
    dataEmissao: string
    contadorNome: string
    contadorCRC: string
    logoUrl?: string | null
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
  const descricaoPeriodo = descreverPeriodoMeses(declaracao.meses.map((m) => m.mes))

  // Agrupa por ano — a maioria dos casos tem um único ano, mas com "dois
  // anos" ou "últimos 12 meses" cruzando a virada do ano, mostra um bloco
  // (com subtotal) por ano para ficar mais fácil de ler
  const anos = Array.from(new Set(declaracao.meses.map((m) => m.mes.split('/')[1])))
  const gruposPorAno = anos.map((ano) => ({
    ano,
    meses: declaracao.meses.filter((m) => m.mes.split('/')[1] === ano),
  }))

  return (
    <div id="declaracao-preview" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Faixa de destaque no topo */}
      <div className="h-2 bg-blue-600" />

      <div className="p-12 space-y-10">
        {/* Cabeçalho com logo */}
        <div className="flex flex-col items-center text-center">
          <img
            src={declaracao.logoUrl || '/logo-jr-contabilidade.jpg'}
            alt="Logo"
            className="h-20 object-contain mb-5"
          />
          <h2 className="text-2xl font-bold text-gray-900 tracking-widest">DECLARAÇÃO DE FATURAMENTO</h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mt-3" />
        </div>

        {/* Cidade e data */}
        <div className="text-right text-sm text-gray-600 italic">
          {declaracao.cidade}, {dataEmissaoFormatada}.
        </div>

        {/* Corpo da declaração */}
        <div className="text-justify text-gray-900 leading-8 text-[15px]">
          <p>
            Eu, <span className="font-semibold">{declaracao.contadorNome}</span>, Contador Responsável da{' '}
            <span className="font-semibold">{declaracao.clienteNome}</span>
            {declaracao.clienteCnpj && (
              <>
                {' '}CNPJ: <span className="font-semibold">{declaracao.clienteCnpj}</span>
              </>
            )}
            , <span className="font-bold">INFORMO</span>, que constam em seus registros os seguintes valores,
            incluindo suas filiais em território nacional e subsidiárias no exterior, no período de{' '}
            <span className="font-semibold">{descricaoPeriodo}</span>:
          </p>
        </div>

        {/* Tabela(s) de faturamento mensal, uma por ano */}
        <div className="space-y-6">
          {gruposPorAno.map((grupo) => {
            const subtotal = grupo.meses.reduce((acc, m) => acc + m.valor, 0)
            return (
              <div key={grupo.ano} className="overflow-x-auto">
                {gruposPorAno.length > 1 && (
                  <h3 className="text-sm font-bold text-gray-700 mb-2">{grupo.ano}</h3>
                )}
                <table className="w-full rounded-lg overflow-hidden border border-gray-200">
                  <thead>
                    <tr className="bg-blue-600">
                      <th className="px-5 py-3 text-left font-semibold text-white text-sm tracking-wide">Período</th>
                      <th className="px-5 py-3 text-right font-semibold text-white text-sm tracking-wide">Consolidado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.meses.map((m, idx) => {
                      const [mm] = m.mes.split('/')
                      const nomeMes = nomeMesPorExtenso(parseInt(mm, 10) - 1)
                      return (
                        <tr key={m.mes} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-5 py-2.5 text-gray-800 border-t border-gray-100">{nomeMes}</td>
                          <td className="px-5 py-2.5 text-right text-gray-900 font-medium border-t border-gray-100">
                            {formatCurrency(m.valor)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-5 py-3 text-blue-900 font-bold">
                        {gruposPorAno.length > 1 ? `Subtotal ${grupo.ano}` : 'Total'}
                      </td>
                      <td className="px-5 py-3 text-right text-blue-900 font-bold text-base">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}

          {gruposPorAno.length > 1 && (
            <div className="bg-blue-600 rounded-lg px-5 py-4 flex justify-between items-center">
              <span className="text-white font-bold">Total Geral</span>
              <span className="text-white font-bold text-lg">{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        {/* Assinatura */}
        <div className="pt-12 flex flex-col items-center text-center">
          <div className="w-64 border-t border-gray-400 pt-3">
            <p className="font-semibold text-gray-900">{declaracao.contadorNome}</p>
            <p className="text-sm text-gray-600">CRC: {declaracao.contadorCRC}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
