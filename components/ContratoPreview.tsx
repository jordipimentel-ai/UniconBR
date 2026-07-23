import { ContratoTemplate, DadosContrato, texto } from '@/lib/contratos'
import { formatDataPorExtenso, parseDataLocal } from '@/lib/date-utils'

interface ContratoPreviewProps {
  template: ContratoTemplate
  dados: DadosContrato
}

export default function ContratoPreview({ template, dados }: ContratoPreviewProps) {
  const clausulas = template.gerarClausulas(dados)
  const assinaturas = template.gerarAssinaturas(dados)
  const cidade = texto(dados, 'cidade')
  const dataAssinaturaRaw = texto(dados, 'data_assinatura')
  const dataAssinatura = dataAssinaturaRaw ? formatDataPorExtenso(parseDataLocal(dataAssinaturaRaw)) : ''

  return (
    <div id="contrato-preview" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="h-2 bg-blue-600" />

      <div className="p-12 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 text-center tracking-wide">{template.titulo}</h2>

        <div className="space-y-4 text-justify text-gray-900 leading-7 text-[15px]">
          {clausulas.map((clausula, idx) =>
            clausula === '---CONTRATO SOCIAL---' ? (
              <div key={idx} className="pt-4 border-t-2 border-gray-200" />
            ) : (
              <p key={idx}>{clausula}</p>
            )
          )}
        </div>

        {(cidade || dataAssinatura) && (
          <p className="text-gray-900 pt-4">
            {cidade}{cidade && dataAssinatura && ', '}{dataAssinatura}.
          </p>
        )}

        <div className="pt-16 grid grid-cols-2 gap-8">
          {assinaturas.map((a, idx) => (
            <div key={idx} className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-8">
                <p className="font-semibold text-gray-900 text-sm">{a.nome}</p>
                {a.documento && <p className="text-xs text-gray-600">{a.documento}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-12 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-8">
              <p className="text-sm text-gray-600">Testemunha</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-8">
              <p className="text-sm text-gray-600">Testemunha</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
