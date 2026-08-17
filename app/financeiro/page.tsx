'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { formatMoeda } from '@/lib/contratos'
import { formatDataLocal } from '@/lib/date-utils'
import NovoContratoAtivoForm from '@/components/NovoContratoAtivoForm'
import ServicosCobrancaPanel from '@/components/ServicosCobrancaPanel'
import ContasRecebimentoPanel from '@/components/ContasRecebimentoPanel'
import DespesasPanel from '@/components/DespesasPanel'
import LancamentosPanel from '@/components/LancamentosPanel'
import DashboardFinanceiro from '@/components/DashboardFinanceiro'
import SelectPill from '@/components/SelectPill'
import {
  ContratoAtivo,
  Cobranca,
  StatusCobranca,
  listarContratosAtivos,
  atualizarContratoAtivo,
  excluirContratoAtivo,
  listarCobrancas,
  gerarCobrancasDoMes,
  atualizarStatusAtrasados,
  marcarCobrancaComoPaga,
  reverterCobrancaParaPendente,
} from '@/lib/cobrancas'
import { Despesa, listarDespesas, atualizarStatusDespesasAtrasadas } from '@/lib/despesas'
import { LancamentoReceita, listarLancamentos, atualizarStatusLancamentosAtrasados } from '@/lib/lancamentos-receita'

interface Cliente {
  id: string
  nome_razao_social: string
}

interface Usuario {
  id: string
  nome_completo: string
}

const STATUS_CONFIG: Record<StatusCobranca, { label: string; cor: string }> = {
  pendente: { label: '🟢 Em dia', cor: 'bg-blue-100 text-blue-800' },
  pago: { label: '✅ Pago', cor: 'bg-green-100 text-green-800' },
  atrasado: { label: '🔴 Atrasado', cor: 'bg-red-100 text-red-800' },
  cancelado: { label: '⛔ Cancelado', cor: 'bg-gray-100 text-gray-500' },
}

function formatCompetencia(data: string): string {
  const [ano, mes] = data.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[parseInt(mes, 10) - 1]}/${ano}`
}

const ABAS = ['Dashboard', 'Contratos Ativos', 'Cobranças', 'Lançamentos', 'Serviços', 'Contas'] as const
type Aba = typeof ABAS[number]

export default function FinanceiroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<Aba>('Dashboard')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [contratos, setContratos] = useState<ContratoAtivo[]>([])
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [lancamentos, setLancamentos] = useState<LancamentoReceita[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [contratoEditando, setContratoEditando] = useState<ContratoAtivo | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusCobranca>('todos')
  const [filtroCompetencia, setFiltroCompetencia] = useState<'todos' | string>('todos')
  const [filtroContratoAtivo, setFiltroContratoAtivo] = useState(true)
  const [subAbaLancamentos, setSubAbaLancamentos] = useState<'Receitas' | 'Despesas'>('Receitas')
  const [acessoNegado, setAcessoNegado] = useState(false)

  async function carregarTudo() {
    const [{ data: contratosData }, { data: cobrancasData }, { data: despesasData }, { data: lancamentosData }] = await Promise.all([
      listarContratosAtivos(),
      listarCobrancas(),
      listarDespesas(),
      listarLancamentos(),
    ])
    setContratos(contratosData)
    setCobrancas(cobrancasData)
    setDespesas(despesasData)
    setLancamentos(lancamentosData)
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        setAcessoNegado(true)
        setTimeout(() => router.push('/tarefas'), 2000)
        return
      }

      const [{ data: clientesData }, { data: usuariosData }] = await Promise.all([
        supabase.from('clientes').select('id, nome_razao_social').eq('ativo', true).order('nome_razao_social'),
        supabase.from('users').select('id, nome_completo').eq('ativo', true).order('nome_completo'),
      ])
      if (clientesData) setClientes(clientesData)
      if (usuariosData) setUsuarios(usuariosData)

      await gerarCobrancasDoMes()
      await atualizarStatusAtrasados()
      await atualizarStatusDespesasAtrasadas()
      await atualizarStatusLancamentosAtrasados()
      await carregarTudo()

      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function handleToggleAtivo(contrato: ContratoAtivo) {
    await atualizarContratoAtivo(contrato.id, { ativo: !contrato.ativo })
    await carregarTudo()
  }

  async function handleExcluirContrato(contrato: ContratoAtivo) {
    if (!confirm(`Excluir o contrato nº ${contrato.numero_contrato || contrato.id}? As cobranças já geradas por ele também serão apagadas. Essa ação não pode ser desfeita.`)) return
    const { success, error } = await excluirContratoAtivo(contrato.id)
    if (!success) {
      alert(error || 'Erro ao excluir contrato')
      return
    }
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

  const contratosFiltrados = contratos.filter((c) => c.ativo === filtroContratoAtivo)

  const competenciasDisponiveis = Array.from(new Set(cobrancas.map((c) => c.competencia))).sort((a, b) => b.localeCompare(a))

  const cobrancasFiltradas = cobrancas.filter((c) =>
    (filtroStatus === 'todos' || c.status === filtroStatus) &&
    (filtroCompetencia === 'todos' || c.competencia === filtroCompetencia)
  )

  if (acessoNegado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Acesso negado</p>
            <p className="text-gray-600">Apenas administradores podem acessar o Financeiro</p>
          </div>
        </div>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold text-gray-900">💰 Financeiro</h1>
            <p className="text-gray-600 text-sm mt-1">Contratos, honorários mensais, despesas e fluxo de caixa</p>
          </div>
        </header>

        <main className="px-8 py-8 max-w-6xl mx-auto">
          <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6 overflow-x-auto">
            {ABAS.map((a) => (
              <button
                key={a}
                onClick={() => { setAba(a); setMostrarForm(false); setContratoEditando(null) }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                  aba === a ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {aba === 'Dashboard' && (
            <DashboardFinanceiro contratos={contratos} cobrancas={cobrancas} despesas={despesas} lancamentos={lancamentos} />
          )}

          {aba === 'Contratos Ativos' && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Contratos</h2>
                {!mostrarForm && (
                  <button
                    onClick={() => { setContratoEditando(null); setMostrarForm(true) }}
                    className="text-sm px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    + Novo Contrato
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFiltroContratoAtivo(true)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    filtroContratoAtivo ? 'bg-blue-100 text-blue-700 border-blue-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setFiltroContratoAtivo(false)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    !filtroContratoAtivo ? 'bg-blue-100 text-blue-700 border-blue-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Inativos
                </button>
              </div>

              {mostrarForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <NovoContratoAtivoForm
                    clientes={clientes}
                    usuarios={usuarios}
                    contratoExistente={contratoEditando || undefined}
                    onCancelar={() => { setMostrarForm(false); setContratoEditando(null) }}
                    onCriado={async () => {
                      setMostrarForm(false)
                      setContratoEditando(null)
                      await gerarCobrancasDoMes()
                      await carregarTudo()
                    }}
                  />
                </div>
              )}

              {contratosFiltrados.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {filtroContratoAtivo ? 'Nenhum contrato ativo.' : 'Nenhum contrato inativo.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="py-2 pr-4">Nº</th>
                        <th className="py-2 pr-4">Cliente</th>
                        <th className="py-2 pr-4">Serviço</th>
                        <th className="py-2 pr-4">Valor Mensal</th>
                        <th className="py-2 pr-4">Vencimento</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratosFiltrados.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-500">{c.numero_contrato || '—'}</td>
                          <td className="py-2 pr-4 font-medium text-gray-900">{c.clientes?.nome_razao_social || '—'}</td>
                          <td className="py-2 pr-4">{c.servicos_cobranca?.nome || c.descricao}</td>
                          <td className="py-2 pr-4">{formatMoeda(c.valor_mensal)}</td>
                          <td className="py-2 pr-4">Dia {c.dia_vencimento}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                              {c.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setContratoEditando(c); setMostrarForm(true) }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Editar
                              </button>
                              <button onClick={() => handleToggleAtivo(c)} className="text-gray-600 hover:text-gray-700 font-medium">
                                {c.ativo ? 'Desativar' : 'Reativar'}
                              </button>
                              <button onClick={() => handleExcluirContrato(c)} className="text-red-600 hover:text-red-700 font-medium">
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {aba === 'Cobranças' && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Cobranças</h2>
                <div className="flex gap-2">
                  <SelectPill
                    className="w-48"
                    value={filtroCompetencia}
                    onChange={setFiltroCompetencia}
                    options={[
                      { value: 'todos', label: 'Todos os meses' },
                      ...competenciasDisponiveis.map((comp) => ({ value: comp, label: `Referente a ${formatCompetencia(comp)}` })),
                    ]}
                  />
                  <SelectPill
                    className="w-40"
                    value={filtroStatus}
                    onChange={(v) => setFiltroStatus(v as any)}
                    options={[
                      { value: 'todos', label: 'Todos os status' },
                      { value: 'pendente', label: 'Em dia' },
                      { value: 'atrasado', label: 'Atrasado' },
                      { value: 'pago', label: 'Pago' },
                      { value: 'cancelado', label: 'Cancelado' },
                    ]}
                  />
                </div>
              </div>

              {cobrancasFiltradas.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma cobrança encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="py-2 pr-4">Nº Contrato</th>
                        <th className="py-2 pr-4">Cliente</th>
                        <th className="py-2 pr-4">Mês Referente</th>
                        <th className="py-2 pr-4">Valor</th>
                        <th className="py-2 pr-4">Vencimento</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobrancasFiltradas.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-500">{c.contratos_ativos?.numero_contrato || '—'}</td>
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
          )}

          {aba === 'Lançamentos' && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lançamentos</h2>
                <p className="text-xs text-gray-500 mt-1">Movimentações fora dos contratos recorrentes: receitas de serviços avulsos e contas a pagar.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSubAbaLancamentos('Receitas')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    subAbaLancamentos === 'Receitas' ? 'bg-green-100 text-green-700 border-green-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  💰 Receitas
                </button>
                <button
                  onClick={() => setSubAbaLancamentos('Despesas')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    subAbaLancamentos === 'Despesas' ? 'bg-red-100 text-red-700 border-red-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📤 Despesas
                </button>
              </div>

              {subAbaLancamentos === 'Receitas' ? (
                <LancamentosPanel clientes={clientes} />
              ) : (
                <DespesasPanel />
              )}
            </section>
          )}

          {aba === 'Serviços' && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Catálogo de Serviços</h2>
              <ServicosCobrancaPanel />
            </section>
          )}

          {aba === 'Contas' && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Contas de Recebimento</h2>
              <ContasRecebimentoPanel />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
