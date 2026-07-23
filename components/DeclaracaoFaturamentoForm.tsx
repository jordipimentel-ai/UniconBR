'use client'

import { useState, useEffect } from 'react'
import UploadZone from './UploadZone'
import { extractPDFData, montarAnoFaturamento, DeclaracaoExtraida } from '@/lib/pdf-processor'
import { nomeMesPorExtenso } from '@/lib/date-utils'

interface Cliente {
  id: string
  nome_razao_social: string
  cpf_cnpj?: string
}

interface FaturamentoMes {
  mes: string
  valor: number
}

export interface DeclaracaoFaturamentoData {
  clienteNome: string
  clienteCnpj: string
  ano: number
  cidade: string
  dataEmissao: string
  contadorNome: string
  contadorCRC: string
  meses: FaturamentoMes[]
}

interface DeclaracaoFaturamentoFormProps {
  clientes: Cliente[]
  onGerar: (dados: DeclaracaoFaturamentoData) => void
}

const STORAGE_KEY = 'uniconbr_declaracao_contador'

export default function DeclaracaoFaturamentoForm({ clientes, onGerar }: DeclaracaoFaturamentoFormProps) {
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [cidade, setCidade] = useState('')
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0])
  const [contadorNome, setContadorNome] = useState('')
  const [contadorCRC, setContadorCRC] = useState('')
  const [arquivos, setArquivos] = useState<File[]>([])
  const [meses, setMeses] = useState<FaturamentoMes[]>(
    Array.from({ length: 12 }, (_, i) => ({ mes: `${String(i + 1).padStart(2, '0')}/${new Date().getFullYear()}`, valor: 0 }))
  )
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Lembra os dados do contador entre sessões, já que raramente mudam
  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (salvo) {
      try {
        const dados = JSON.parse(salvo)
        setCidade(dados.cidade || '')
        setContadorNome(dados.contadorNome || '')
        setContadorCRC(dados.contadorCRC || '')
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cidade, contadorNome, contadorCRC }))
  }, [cidade, contadorNome, contadorCRC])

  useEffect(() => {
    setMeses(Array.from({ length: 12 }, (_, i) => ({ mes: `${String(i + 1).padStart(2, '0')}/${ano}`, valor: 0 })))
  }, [ano])

  async function handlePreencherComPGDAS() {
    if (arquivos.length === 0) {
      setErro('Anexe pelo menos uma Declaração do PGDAS-D')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const declaracoes: DeclaracaoExtraida[] = []

      for (const arquivo of arquivos) {
        const dados = await extractPDFData(arquivo)
        if (dados.pgdasDeclaracao) {
          declaracoes.push(dados.pgdasDeclaracao)
        }
      }

      if (declaracoes.length === 0) {
        setErro('Nenhum dos arquivos anexados parece ser uma Declaração do PGDAS-D')
        setLoading(false)
        return
      }

      const anoCompleto = montarAnoFaturamento(declaracoes, ano)
      setMeses(anoCompleto)

      const encontrados = anoCompleto.filter((m) => m.valor > 0).length
      if (encontrados < 12) {
        setErro(`Foram encontrados dados de ${encontrados} de 12 meses. Preencha manualmente os meses restantes abaixo.`)
      }
    } catch (err: any) {
      console.error('Erro ao processar PGDAS:', err)
      setErro(err.message || 'Erro ao processar arquivos')
    } finally {
      setLoading(false)
    }
  }

  function handleGerar() {
    const cliente = clientes.find((c) => c.id === clienteSelecionado)

    if (!cliente) {
      setErro('Selecione um cliente')
      return
    }
    if (!contadorNome.trim() || !contadorCRC.trim()) {
      setErro('Preencha o nome e o CRC do contador responsável')
      return
    }
    if (!cidade.trim()) {
      setErro('Preencha a cidade')
      return
    }

    onGerar({
      clienteNome: cliente.nome_razao_social,
      clienteCnpj: cliente.cpf_cnpj || '',
      ano,
      cidade,
      dataEmissao,
      contadorNome,
      contadorCRC,
      meses,
    })
  }

  return (
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ano *</label>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i
              return <option key={year} value={year}>{year}</option>
            })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data de Emissão *</label>
          <input
            type="date"
            value={dataEmissao}
            onChange={(e) => setDataEmissao(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Ex: São José da Laje"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contador Responsável *</label>
          <input
            type="text"
            value={contadorNome}
            onChange={(e) => setContadorNome(e.target.value)}
            placeholder="Nome completo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CRC *</label>
          <input
            type="text"
            value={contadorCRC}
            onChange={(e) => setContadorCRC(e.target.value)}
            placeholder="Ex: 009936-5/O"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preencher automaticamente com PGDAS (opcional)
        </label>
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
        <button
          onClick={handlePreencherComPGDAS}
          disabled={loading || arquivos.length === 0}
          className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50 transition text-sm"
        >
          {loading ? 'Processando...' : '📄 Preencher meses com base nos PDFs'}
        </button>
      </div>

      {erro && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      <div className="pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Faturamento por mês — revise ou preencha manualmente
        </label>
        <div className="grid grid-cols-3 gap-3">
          {meses.map((m, idx) => {
            const [mm] = m.mes.split('/')
            return (
              <div key={m.mes}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {nomeMesPorExtenso(parseInt(mm, 10) - 1)}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={m.valor}
                  onChange={(e) => {
                    const novo = [...meses]
                    novo[idx] = { ...novo[idx], valor: parseFloat(e.target.value) || 0 }
                    setMeses(novo)
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleGerar}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          📋 Gerar Declaração de Faturamento
        </button>
      </div>
    </div>
  )
}
