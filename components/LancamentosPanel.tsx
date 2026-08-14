'use client'

import { useEffect, useState } from 'react'
import { formatMoeda } from '@/lib/contratos'
import { formatDataLocal } from '@/lib/date-utils'
import {
  LancamentoReceita,
  StatusLancamento,
  listarLancamentos,
  criarLancamento,
  atualizarStatusLancamentosAtrasados,
  marcarLancamentoComoPago,
  reverterLancamentoParaPendente,
  excluirLancamento,
} from '@/lib/lancamentos-receita'
import { ServicoCobranca, listarServicos } from '@/lib/cobrancas'
import SelectPill from '@/components/SelectPill'

interface Cliente {
  id: string
  nome_razao_social: string
}

interface Props {
  clientes: Cliente[]
}

const STATUS_CONFIG: Record<StatusLancamento, { label: string; cor: string }> = {
  pendente: { label: '🟢 Em dia', cor: 'bg-blue-100 text-blue-800' },
  pago: { label: '✅ Pago', cor: 'bg-green-100 text-green-800' },
  atrasado: { label: '🔴 Atrasado', cor: 'bg-red-100 text-red-800' },
  cancelado: { label: '⛔ Cancelado', cor: 'bg-gray-100 text-gray-500' },
}

function inputMoeda(valor: number | null, onChange: (v: number | null) => void) {
  const exibicao = valor === null || valor === undefined ? '' : formatMoeda(valor)
  return (
    <input
      type="text"
      inputMode="numeric"
      value={exibicao}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, '')
        onChange(digitos ? parseInt(digitos, 10) / 100 : null)
      }}
      placeholder="R$ 0,00"
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

export default function LancamentosPanel({ clientes }: Props) {
  const [lancamentos, setLancamentos] = useState<LancamentoReceita[]>([])
  const [servicos, setServicos] = useState<ServicoCobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusLancamento>('todos')

  const [clienteTexto, setClienteTexto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState<number | null>(null)
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10))

  async function carregar() {
    setLoading(true)
    await atualizarStatusLancamentosAtrasados()
    const [{ data: lancData }, { data: servData }] = await Promise.all([listarLancamentos(), listarServicos()])
    setLancamentos(lancData)
    setServicos(servData)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriar() {
    setErro(null)
    if (!descricao.trim() || !valor) {
      setErro('Informe a descrição e o valor')
      return
    }

    const nomeDigitado = clienteTexto.trim()
    const clienteExistente = clientes.find((c) => c.nome_razao_social.toLowerCase() === nomeDigitado.toLowerCase())

    const { success, error } = await criarLancamento({
      cliente_id: clienteExistente?.id || null,
      cliente_nome: clienteExistente ? null : nomeDigitado || null,
      descricao: descricao.trim(),
      categoria: categoria || undefined,
      valor,
      vencimento,
    })
    if (!success) {
      setErro(error || 'Erro ao criar lançamento')
      return
    }
    setClienteTexto('')
    setDescricao('')
    setCategoria('')
    setValor(null)
    setMostrarForm(false)
    await carregar()
  }

  async function handleMarcarPago(id: string) {
    await marcarLancamentoComoPago(id)
    await carregar()
  }

  async function handleReverter(id: string) {
    await reverterLancamentoParaPendente(id)
    await carregar()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await excluirLancamento(id)
    await carregar()
  }

  const lancamentosFiltrados = lancamentos.filter((l) => filtroStatus === 'todos' || l.status === filtroStatus)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SelectPill
          className="w-40"
          value={filtroStatus}
          onChange={(v) => setFiltroStatus(v as any)}
          options={[
            { value: 'todos', label: 'Todos os status' },
            { value: 'pendente', label: 'Em dia' },
            { value: 'atrasado', label: 'Atrasado' },
            { value: 'pago', label: 'Pago' },
          ]}
        />
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)} className="text-sm px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
            + Novo Lançamento
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{erro}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Cliente (opcional)</label>
              <input
                type="text"
                list="lancamentos-clientes"
                value={clienteTexto}
                onChange={(e) => setClienteTexto(e.target.value)}
                placeholder="Selecione um cliente cadastrado ou digite um nome novo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="lancamentos-clientes">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nome_razao_social} />
                ))}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Abertura de CNPJ avulsa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <SelectPill
                value={categoria}
                onChange={setCategoria}
                options={servicos.map((s) => ({ value: s.nome, label: s.nome }))}
                placeholder="Selecione um serviço"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor *</label>
              {inputMoeda(valor, setValor)}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vencimento *</label>
              <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCriar} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm">Salvar</button>
            <button onClick={() => { setMostrarForm(false); setErro(null) }} className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : lancamentosFiltrados.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum lançamento encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">Descrição</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Categoria</th>
                <th className="py-2 pr-4">Valor</th>
                <th className="py-2 pr-4">Vencimento</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentosFiltrados.map((l) => (
                <tr key={l.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{l.descricao}</td>
                  <td className="py-2 pr-4">{l.clientes?.nome_razao_social || l.cliente_nome || '—'}</td>
                  <td className="py-2 pr-4">{l.categoria || '—'}</td>
                  <td className="py-2 pr-4">{formatMoeda(l.valor)}</td>
                  <td className="py-2 pr-4">{formatDataLocal(l.vencimento)}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[l.status].cor}`}>{STATUS_CONFIG[l.status].label}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-3">
                      {l.status === 'pago' ? (
                        <button onClick={() => handleReverter(l.id)} className="text-gray-600 hover:text-gray-700 font-medium">Reverter</button>
                      ) : (
                        <button onClick={() => handleMarcarPago(l.id)} className="text-green-600 hover:text-green-700 font-medium">Marcar como Pago</button>
                      )}
                      <button onClick={() => handleExcluir(l.id)} className="text-red-600 hover:text-red-700 font-medium">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
