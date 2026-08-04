'use client'

import { useState } from 'react'
import { extractPDFData } from '@/lib/pdf-processor'
import { formatMoeda } from '@/lib/contratos'
import { mesAnoParaData, upsertRegistroFinanceiroMes } from '@/lib/registros-financeiros'

interface Props {
  clienteId: string
  onSalvo?: () => void
}

interface MesDetectado {
  mes: string // 'MM/AAAA', pode ser '' se não identificado (precisa o usuário escolher)
  valor: number
  incluir: boolean
}

function mesParaInputMonth(mes: string): string {
  const match = mes.match(/^(\d{2})\/(\d{4})$/)
  return match ? `${match[2]}-${match[1]}` : ''
}

function inputMonthParaMes(valor: string): string {
  const match = valor.match(/^(\d{4})-(\d{2})$/)
  return match ? `${match[2]}/${match[1]}` : ''
}

export default function UploadPGDASCliente({ clienteId, onSalvo }: Props) {
  const [processando, setProcessando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [meses, setMeses] = useState<MesDetectado[]>([])

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setProcessando(true)
    setErro(null)
    setSucesso(null)
    setMeses([])

    try {
      const dados = await extractPDFData(arquivo)
      const pgdas = dados.pgdasDeclaracao || dados.pgdasRecibo

      if (!pgdas || (!pgdas.faturamento && !(pgdas.historico?.length))) {
        setErro('Não foi possível identificar dados de faturamento neste PDF. Confira se é mesmo um PGDAS-D (Declaração ou Recibo).')
        return
      }

      const detectados: MesDetectado[] = []

      // Histórico de meses anteriores (só vem na Declaração completa)
      ;(pgdas.historico || []).forEach((h: { mes: string; valor: number }) => {
        if (h.valor > 0) detectados.push({ mes: h.mes, valor: h.valor, incluir: true })
      })

      // Mês do próprio período apurado neste PDF
      const periodoAtual = 'periodoAtual' in pgdas ? pgdas.periodoAtual : null
      if (pgdas.faturamento > 0 && !detectados.some((d) => d.mes === periodoAtual)) {
        detectados.push({ mes: periodoAtual || '', valor: pgdas.faturamento, incluir: true })
      }

      if (detectados.length === 0) {
        setErro('O PDF foi lido, mas nenhum valor de faturamento válido foi encontrado.')
        return
      }

      detectados.sort((a, b) => a.mes.localeCompare(b.mes))
      setMeses(detectados)
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar o PDF')
    } finally {
      setProcessando(false)
    }
  }

  async function handleSalvarHistorico() {
    setErro(null)
    const selecionados = meses.filter((m) => m.incluir)

    if (selecionados.length === 0) {
      setErro('Selecione pelo menos um mês para salvar')
      return
    }
    if (selecionados.some((m) => !m.mes)) {
      setErro('Preencha o mês de todos os itens selecionados antes de salvar')
      return
    }

    setSalvando(true)
    let falhas = 0

    for (const item of selecionados) {
      const dataRef = mesAnoParaData(item.mes)
      if (!dataRef) {
        falhas++
        continue
      }
      const { success } = await upsertRegistroFinanceiroMes(clienteId, dataRef, { faturamento: item.valor })
      if (!success) falhas++
    }

    setSalvando(false)

    if (falhas > 0) {
      setErro(`${falhas} mês(es) não foram salvos. Confira e tente novamente.`)
    } else {
      setSucesso(`${selecionados.length} mês(es) de faturamento salvos no histórico!`)
      setMeses([])
      onSalvo?.()
    }
  }

  return (
    <div className="pt-6 border-t space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">📄 Registrar Faturamento por PGDAS</h3>
        <p className="text-sm text-gray-500 mt-1">
          Envie a Declaração ou o Recibo do PGDAS-D (nome do arquivo deve conter "declaracao", "recibo" ou "pgdas") —
          o faturamento identificado (inclusive de meses anteriores, quando disponíveis) entra direto no histórico abaixo.
        </p>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleArquivo}
        disabled={processando}
        className="text-sm text-gray-600"
      />

      {processando && <p className="text-sm text-gray-500">Lendo PDF...</p>}

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{erro}</div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">{sucesso}</div>
      )}

      {meses.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-600">Confira os meses detectados antes de salvar:</p>
          <div className="space-y-2">
            {meses.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={item.incluir}
                  onChange={(e) => {
                    const novos = [...meses]
                    novos[idx] = { ...novos[idx], incluir: e.target.checked }
                    setMeses(novos)
                  }}
                  className="w-4 h-4"
                />
                <input
                  type="month"
                  value={mesParaInputMonth(item.mes)}
                  onChange={(e) => {
                    const novos = [...meses]
                    novos[idx] = { ...novos[idx], mes: inputMonthParaMes(e.target.value) }
                    setMeses(novos)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-900 font-medium flex-1 text-right">{formatMoeda(item.valor)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSalvarHistorico}
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition text-sm"
            >
              {salvando ? 'Salvando...' : 'Salvar no Histórico'}
            </button>
            <button
              type="button"
              onClick={() => setMeses([])}
              className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
