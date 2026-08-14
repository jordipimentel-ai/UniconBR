'use client'

import { useState } from 'react'
import { formatMoeda } from '@/lib/contratos'
import { formatDataLocal } from '@/lib/date-utils'
import { ContratoAtivo, Cobranca } from '@/lib/cobrancas'
import { Despesa } from '@/lib/despesas'
import { LancamentoReceita } from '@/lib/lancamentos-receita'

interface Props {
  contratos: ContratoAtivo[]
  cobrancas: Cobranca[]
  despesas: Despesa[]
  lancamentos: LancamentoReceita[]
}

interface Movimentacao {
  id: string
  tipo: 'receita' | 'despesa'
  origem: 'Cobrança' | 'Lançamento' | 'Despesa'
  descricao: string
  cliente: string | null
  categoria: string | null
  valor: number
  vencimento: string
  status: string
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function inicioDaSemana(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

function Card({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className={`text-xl font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  pendente: '🟢 Em dia',
  pago: '✅ Pago',
  atrasado: '🔴 Atrasado',
  cancelado: '⛔ Cancelado',
}

export default function DashboardFinanceiro({ contratos, cobrancas, despesas, lancamentos }: Props) {
  const [modo, setModo] = useState<'mes' | 'semana'>('mes')
  const [dataRef, setDataRef] = useState(new Date())

  const primeiroDiaMes = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1)
  const ultimoDiaMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0)
  const inicioSemana = inicioDaSemana(dataRef)
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(fimSemana.getDate() + 6)

  const rangeInicioStr = toDateStr(modo === 'mes' ? primeiroDiaMes : inicioSemana)
  const rangeFimStr = toDateStr(modo === 'mes' ? ultimoDiaMes : fimSemana)

  function noPeriodo(dataStr: string) {
    return dataStr >= rangeInicioStr && dataStr <= rangeFimStr
  }

  function navegar(direcao: 1 | -1) {
    if (modo === 'mes') {
      setDataRef(new Date(dataRef.getFullYear(), dataRef.getMonth() + direcao, 1))
    } else {
      const nova = new Date(dataRef)
      nova.setDate(nova.getDate() + direcao * 7)
      setDataRef(nova)
    }
  }

  const cobrancasPeriodo = cobrancas.filter((c) => noPeriodo(c.vencimento))
  const lancamentosPeriodo = lancamentos.filter((l) => noPeriodo(l.vencimento))
  const despesasPeriodo = despesas.filter((d) => noPeriodo(d.vencimento))

  const aReceber =
    cobrancasPeriodo.filter((c) => c.status === 'pendente' || c.status === 'atrasado').reduce((s, c) => s + c.valor, 0) +
    lancamentosPeriodo.filter((l) => l.status === 'pendente' || l.status === 'atrasado').reduce((s, l) => s + l.valor, 0)
  const recebido =
    cobrancasPeriodo.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0) +
    lancamentosPeriodo.filter((l) => l.status === 'pago').reduce((s, l) => s + l.valor, 0)
  const aPagar = despesasPeriodo.filter((d) => d.status === 'pendente' || d.status === 'atrasado').reduce((s, d) => s + d.valor, 0)
  const pago = despesasPeriodo.filter((d) => d.status === 'pago').reduce((s, d) => s + d.valor, 0)
  const contratosAtivos = contratos.filter((c) => c.ativo).length
  const saldoPeriodo = recebido - pago

  // Fluxo de caixa: por dia (Semana) ou por semana do mês (Mês), usando a
  // data em que o dinheiro de fato entrou/saiu (data_pagamento)
  const baldes = modo === 'semana'
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(inicioSemana)
        d.setDate(d.getDate() + i)
        return { chave: toDateStr(d), rotulo: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i] }
      })
    : [1, 2, 3, 4, 5].map((s) => ({ chave: s, rotulo: `Sem ${s}` }))

  function pertenceAoBalde(dataPagamento: string, balde: any): boolean {
    if (modo === 'semana') return dataPagamento === balde.chave
    // Mês: precisa estar no mesmo mês/ano exibido, e cair na semana-do-mês certa
    const noMes = dataPagamento >= toDateStr(primeiroDiaMes) && dataPagamento <= toDateStr(ultimoDiaMes)
    return noMes && Math.ceil(parseInt(dataPagamento.slice(8, 10), 10) / 7) === balde.chave
  }

  const entradasPorBalde = baldes.map((balde) =>
    cobrancas
      .filter((c) => c.status === 'pago' && (c as any).data_pagamento && pertenceAoBalde((c as any).data_pagamento, balde))
      .reduce((s, c) => s + c.valor, 0) +
    lancamentos
      .filter((l) => l.status === 'pago' && l.data_pagamento && pertenceAoBalde(l.data_pagamento, balde))
      .reduce((s, l) => s + l.valor, 0)
  )
  const saidasPorBalde = baldes.map((balde) =>
    despesas
      .filter((d) => d.status === 'pago' && d.data_pagamento && pertenceAoBalde(d.data_pagamento, balde))
      .reduce((s, d) => s + d.valor, 0)
  )

  const maiorValor = Math.max(1, ...entradasPorBalde, ...saidasPorBalde)

  const movimentacoes: Movimentacao[] = [
    ...cobrancasPeriodo.map((c) => ({
      id: `cob-${c.id}`,
      tipo: 'receita' as const,
      origem: 'Cobrança' as const,
      descricao: c.contratos_ativos?.descricao || 'Honorários',
      cliente: c.clientes?.nome_razao_social || null,
      categoria: null,
      valor: c.valor,
      vencimento: c.vencimento,
      status: c.status,
    })),
    ...lancamentosPeriodo.map((l) => ({
      id: `lan-${l.id}`,
      tipo: 'receita' as const,
      origem: 'Lançamento' as const,
      descricao: l.descricao,
      cliente: l.clientes?.nome_razao_social || l.cliente_nome || null,
      categoria: l.categoria,
      valor: l.valor,
      vencimento: l.vencimento,
      status: l.status,
    })),
    ...despesasPeriodo.map((d) => ({
      id: `desp-${d.id}`,
      tipo: 'despesa' as const,
      origem: 'Despesa' as const,
      descricao: d.descricao,
      cliente: null,
      categoria: d.categoria,
      valor: d.valor,
      vencimento: d.vencimento,
      status: d.status,
    })),
  ].sort((a, b) => b.vencimento.localeCompare(a.vencimento))

  const tituloPeriodo = modo === 'mes'
    ? `${MESES[dataRef.getMonth()]} ${dataRef.getFullYear()}`
    : `${inicioSemana.getDate()} ${MESES[inicioSemana.getMonth()].slice(0, 3)} — ${fimSemana.getDate()} ${MESES[fimSemana.getMonth()].slice(0, 3)}`

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="inline-flex bg-gray-100 border border-gray-200 rounded-lg p-1 gap-1">
            <button
              onClick={() => setModo('mes')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${modo === 'mes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setModo('semana')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${modo === 'semana' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              Semana
            </button>
          </div>
          <h2 className="text-base font-bold text-gray-900">{tituloPeriodo}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navegar(-1)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition text-sm">←</button>
          <button onClick={() => setDataRef(new Date())} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">Hoje</button>
          <button onClick={() => navegar(1)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition text-sm">→</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card titulo="Contratos Ativos" valor={String(contratosAtivos)} cor="text-blue-600" />
        <Card titulo="A Receber" valor={formatMoeda(aReceber)} cor="text-gray-700" />
        <Card titulo="Recebido" valor={formatMoeda(recebido)} cor="text-green-600" />
        <Card titulo="A Pagar" valor={formatMoeda(aPagar)} cor="text-gray-700" />
        <Card titulo="Pago" valor={formatMoeda(pago)} cor="text-red-600" />
        <Card titulo="Saldo" valor={formatMoeda(saldoPeriodo)} cor={saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Fluxo de Caixa {modo === 'mes' ? 'do Mês (por semana)' : 'da Semana (por dia)'}
        </h3>
        <div className="flex items-end gap-4 h-40 overflow-x-auto">
          {baldes.map((balde, idx) => (
            <div key={idx} className="flex-1 min-w-[40px] flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 h-32">
                <div
                  className="w-6 bg-green-500 rounded-t"
                  style={{ height: `${(entradasPorBalde[idx] / maiorValor) * 100}%` }}
                  title={`Entradas: ${formatMoeda(entradasPorBalde[idx])}`}
                />
                <div
                  className="w-6 bg-red-400 rounded-t"
                  style={{ height: `${(saidasPorBalde[idx] / maiorValor) * 100}%` }}
                  title={`Saídas: ${formatMoeda(saidasPorBalde[idx])}`}
                />
              </div>
              <span className="text-xs text-gray-500">{balde.rotulo}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Entradas</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Saídas</span>
        </div>
      </div>

      {/* Movimentações */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Movimentações do Período</h3>
        {movimentacoes.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma movimentação neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Descrição</th>
                  <th className="py-2 pr-4">Cliente / Categoria</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Vencimento</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.tipo === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {m.tipo === 'receita' ? '💰 Receita' : '📤 Despesa'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-medium text-gray-900">{m.descricao}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.cliente || m.categoria || '—'}</td>
                    <td className={`py-2 pr-4 font-medium ${m.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}`}>
                      {m.tipo === 'receita' ? '+' : '-'}{formatMoeda(m.valor)}
                    </td>
                    <td className="py-2 pr-4">{formatDataLocal(m.vencimento)}</td>
                    <td className="py-2 pr-4">{STATUS_LABEL[m.status] || m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
