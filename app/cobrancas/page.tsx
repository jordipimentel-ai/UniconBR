'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { formatMoeda } from '@/lib/contratos'
import { formatDataLocal } from '@/lib/date-utils'
import {
  ContratoAtivo,
  Cobranca,
  StatusCobranca,
  listarContratosAtivos,
  criarContratoAtivo,
  atualizarContratoAtivo,
  listarCobrancas,
  gerarCobrancasDoMes,
  atualizarStatusAtrasados,
  marcarCobrancaComoPaga,
  reverterCobrancaParaPendente,
} from '@/lib/cobrancas'

interface Cliente {
  id: string
  nome_razao_social: string
}

const STATUS_CONFIG: Record<StatusCobranca, { label: string; cor: string }> = {
  pendente: { label: '⚪ Pendente', cor: 'bg-gray-100 text-gray-800' },
  pago: { label: '✅ Pago', cor: 'bg-green-100 text-green-800' },
  atrasado: { label: '🔴 Atrasado', cor: 'bg-red-100 text-red-800' },
  cancelado: { label: '⛔ Cancelado', cor: 'bg-gray-100 text-gray-500' },
}

function formatCompetencia(data: string): string {
  const [ano, mes] = data.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[parseInt(mes, 10) - 1]}/${ano}`
}

const FORM_VAZIO = {
  cliente_id: '',
  descricao: 'Honorários Contábeis Mensais',
  valor_mensal: null as number | null,
  dia_vencimento: 10,
  data_inicio: new Date().toISOString().slice(0, 10),
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
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
    />
  )
}

export default function CobrancasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratos, setContratos] = useState<ContratoAtivo[]>([])
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ ...FORM_VAZIO })
  const [erro, setErro] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusCobranca>('todos')

  async function carregarTudo() {
    const [{ data: contratosData }, { data: cobrancasData }] = await Promise.all([
      listarContratosAtivos(),
      listarCobrancas(),
    ])
    setContratos(contratosData)
    setCobrancas(cobrancasData)
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nome_razao_social')
        .eq('ativo', true)
        .order('nome_razao_social')
      if (clientesData) setClientes(clientesData)

      // Garante que as cobranças do mês existam e marca atrasos, antes de exibir
      await gerarCobrancasDoMes()
      await atualizarStatusAtrasados()
      await carregarTudo()

      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function handleCriarContrato() {
    setErro(null)
    if (!form.cliente_id || !form.valor_mensal) {
      setErro('Selecione o cliente e informe o valor mensal')
      return
    }

    const { success, error } = await criarContratoAtivo({
      cliente_id: form.cliente_id,
      descricao: form.descricao,
      valor_mensal: form.valor_mensal,
      dia_vencimento: form.dia_vencimento,
      data_inicio: form.data_inicio,
    })

    if (!success) {
      setErro(error || 'Erro ao criar contrato de cobrança')
      return
    }

    setMostrarForm(false)
    setForm({ ...FORM_VAZIO })
    await gerarCobrancasDoMes()
    await carregarTudo()
  }

  async function handleToggleAtivo(contrato: ContratoAtivo) {
    await atualizarContratoAtivo(contrato.id, { ativo: !contrato.ativo })
    await carregarTudo()
  }

  async function handleMarcarPago(id: string) {
    await marcarCobrancaComoPaga(id)
    await carregarTudo()
  }

  async function handleReverter(id: string) {
    await reverterCobrancaParaPendente(id)
    await carregarTudo()
  }

  const cobrancasFiltradas = cobrancas.filter((c) => filtroStatus === 'todos' || c.status === filtroStatus)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">💳 Cobranças</h1>
            <p className="text-gray-600 text-sm mt-1">Honorários mensais dos clientes e controle de recebimentos</p>
          </div>
        </header>

        <main className="px-8 py-8 space-y-8 max-w-6xl mx-auto">
          {/* Contratos Ativos */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Contratos Ativos de Cobrança</h2>
              {!mostrarForm && (
                <button
                  onClick={() => setMostrarForm(true)}
                  className="text-sm px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  + Novo Contrato de Cobrança
                </button>
              )}
            </div>

            {mostrarForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{erro}</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
                    <select
                      value={form.cliente_id}
                      onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor Mensal *</label>
                    {inputMoeda(form.valor_mensal, (v) => setForm({ ...form, valor_mensal: v }))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dia de Vencimento</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={form.dia_vencimento}
                      onChange={(e) => setForm({ ...form, dia_vencimento: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Início da Cobrança</label>
                    <input
                      type="date"
                      value={form.data_inicio}
                      onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCriarContrato}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => { setMostrarForm(false); setErro(null) }}
                    className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {contratos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum contrato de cobrança cadastrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-4">Cliente</th>
                      <th className="py-2 pr-4">Descrição</th>
                      <th className="py-2 pr-4">Valor Mensal</th>
                      <th className="py-2 pr-4">Vencimento</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratos.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">{c.clientes?.nome_razao_social || '—'}</td>
                        <td className="py-2 pr-4">{c.descricao}</td>
                        <td className="py-2 pr-4">{formatMoeda(c.valor_mensal)}</td>
                        <td className="py-2 pr-4">Dia {c.dia_vencimento}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                            {c.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            onClick={() => handleToggleAtivo(c)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {c.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Cobranças */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Cobranças</h2>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {cobrancasFiltradas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma cobrança encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-4">Cliente</th>
                      <th className="py-2 pr-4">Competência</th>
                      <th className="py-2 pr-4">Valor</th>
                      <th className="py-2 pr-4">Vencimento</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cobrancasFiltradas.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">{c.clientes?.nome_razao_social || '—'}</td>
                        <td className="py-2 pr-4">{formatCompetencia(c.competencia)}</td>
                        <td className="py-2 pr-4">{formatMoeda(c.valor)}</td>
                        <td className="py-2 pr-4">{formatDataLocal(c.vencimento)}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[c.status].cor}`}>
                            {STATUS_CONFIG[c.status].label}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {c.status === 'pago' ? (
                            <button onClick={() => handleReverter(c.id)} className="text-gray-600 hover:text-gray-700 font-medium">
                              Reverter
                            </button>
                          ) : (
                            <button onClick={() => handleMarcarPago(c.id)} className="text-green-600 hover:text-green-700 font-medium">
                              Marcar como Pago
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
