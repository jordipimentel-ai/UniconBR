'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import UploadZone from '@/components/UploadZone'
import RelatorioPreview from '@/components/RelatorioPreview'
import { extractPDFData, consolidarDados, FaturamentoMes } from '@/lib/pdf-processor'

interface Cliente {
  id: string
  nome_razao_social: string
}

interface RelatorioData {
  cliente: string
  periodo: string
  faturamento: number
  salarios: number
  encargos: number
  impostos: number
  aliquota: number
  saldoLiquido: number
  historicoFaturamento: FaturamentoMes[]
  detalhes: any
}

interface RevisaoData {
  faturamento: number
  salarios: number
  encargos: number
  impostos: number
  historicoFaturamento: FaturamentoMes[]
  detalhes: any
}

export default function RelatoriosPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [periodo, setPeriodo] = useState('mes')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [arquivos, setArquivos] = useState<File[]>([])
  const [revisao, setRevisao] = useState<RevisaoData | null>(null)
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function loadClientes() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const { data } = await supabase
          .from('clientes')
          .select('id, nome_razao_social')
          .order('nome_razao_social')

        if (data) setClientes(data)
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
      } finally {
        setLoadingClientes(false)
      }
    }

    loadClientes()
  }, [router])

  async function handleGerarRelatorio() {
    if (!clienteSelecionado) {
      setErro('Selecione um cliente')
      return
    }

    if (arquivos.length === 0) {
      setErro('Faça upload de pelo menos um arquivo')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const dadosExtraidos: any = {}

      for (const arquivo of arquivos) {
        const dados = await extractPDFData(arquivo)
        Object.assign(dadosExtraidos, dados)
      }

      const clienteNome = clientes.find(c => c.id === clienteSelecionado)?.nome_razao_social || ''
      const periodoStr = periodo === 'mes'
        ? `${String(mes).padStart(2, '0')}/${ano}`
        : `${ano}`

      const { saldoLiquido, ...extraido } = consolidarDados(dadosExtraidos, clienteNome, periodoStr)
      setRevisao(extraido)
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err)
      setErro(err.message || 'Erro ao processar arquivos')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirmarRevisao() {
    if (!revisao) return

    const clienteNome = clientes.find(c => c.id === clienteSelecionado)?.nome_razao_social || ''
    const periodoStr = periodo === 'mes'
      ? `${String(mes).padStart(2, '0')}/${ano}`
      : `${ano}`

    const aliquota = revisao.faturamento > 0 ? (revisao.impostos / revisao.faturamento) * 100 : 0

    // Se o faturamento foi ajustado na revisão, reflete isso no mês atual do histórico
    const historicoAtualizado = revisao.historicoFaturamento.map((item) =>
      item.mes === periodoStr ? { ...item, valor: revisao.faturamento } : item
    )

    setRelatorio({
      cliente: clienteNome,
      periodo: periodoStr,
      faturamento: revisao.faturamento,
      salarios: revisao.salarios,
      encargos: revisao.encargos,
      impostos: revisao.impostos,
      aliquota,
      saldoLiquido: revisao.faturamento - (revisao.salarios + revisao.encargos + revisao.impostos),
      historicoFaturamento: historicoAtualizado,
      detalhes: revisao.detalhes,
    })
    setRevisao(null)
  }

  async function handleBaixarPDF() {
    if (!relatorio) return

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { default: jsPDF } = await import('jspdf')
      const element = document.getElementById('relatorio-preview')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pdf.internal.pageSize.getHeight() - 20

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      pdf.save(`relatorio-${relatorio.cliente}-${relatorio.periodo}.pdf`)
    } catch (err) {
      console.error('Erro ao baixar PDF:', err)
      setErro('Erro ao gerar PDF')
    }
  }

  if (loadingClientes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
          </div>
        </header>

        <main className="px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                <select
                  value={clienteSelecionado}
                  onChange={(e) => setClienteSelecionado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Período *</label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="mes">Mensal</option>
                    <option value="ano">Anual</option>
                  </select>
                </div>

                {periodo === 'mes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mês *</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ano *</label>
                  <select
                    value={ano}
                    onChange={(e) => setAno(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>{year}</option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anexos (PDFs) *</label>
                <UploadZone onFilesSelected={setArquivos} />
                {arquivos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {arquivos.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm text-gray-700">📄 {file.name}</span>
                        <button
                          onClick={() => setArquivos(arquivos.filter((_, i) => i !== idx))}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleGerarRelatorio}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Gerando...' : '📊 Gerar Relatório'}
                </button>
              </div>
            </div>

            {revisao && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Revisar valores antes de gerar</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Os valores abaixo foram extraídos automaticamente dos PDFs e podem estar incompletos ou incorretos — confira e ajuste o que for necessário antes de confirmar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faturamento (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={revisao.faturamento}
                      onChange={(e) => setRevisao({ ...revisao, faturamento: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salários (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={revisao.salarios}
                      onChange={(e) => setRevisao({ ...revisao, salarios: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Encargos (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={revisao.encargos}
                      onChange={(e) => setRevisao({ ...revisao, encargos: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Impostos e Taxas (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={revisao.impostos}
                      onChange={(e) => setRevisao({ ...revisao, impostos: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
                  Alíquota efetiva (Impostos ÷ Faturamento):{' '}
                  <span className="font-semibold">
                    {revisao.faturamento > 0 ? ((revisao.impostos / revisao.faturamento) * 100).toFixed(2) : '0,00'}%
                  </span>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={handleConfirmarRevisao}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    ✓ Confirmar e Gerar Relatório
                  </button>
                  <button
                    onClick={() => setRevisao(null)}
                    className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {relatorio && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleBaixarPDF}
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    📥 Baixar PDF
                  </button>
                  <button
                    onClick={() => setRelatorio(null)}
                    className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition"
                  >
                    ← Voltar
                  </button>
                </div>
                <RelatorioPreview relatorio={relatorio} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
