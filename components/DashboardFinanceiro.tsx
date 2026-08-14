'use client'

import { formatMoeda } from '@/lib/contratos'
import { ContratoAtivo, Cobranca } from '@/lib/cobrancas'
import { Despesa } from '@/lib/despesas'
import { LancamentoReceita } from '@/lib/lancamentos-receita'

interface Props {
  contratos: ContratoAtivo[]
  cobrancas: Cobranca[]
  despesas: Despesa[]
  lancamentos: LancamentoReceita[]
}

function mesAtualStr(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

function Card({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className={`text-xl font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  )
}

export default function DashboardFinanceiro({ contratos, cobrancas, despesas, lancamentos }: Props) {
  const mesAtual = mesAtualStr()

  const cobrancasMes = cobrancas.filter((c) => c.competencia.startsWith(mesAtual))
  const despesasMes = despesas.filter((d) => d.vencimento.startsWith(mesAtual))
  const lancamentosMes = lancamentos.filter((l) => l.vencimento.startsWith(mesAtual))

  const aReceber =
    cobrancasMes.filter((c) => c.status === 'pendente' || c.status === 'atrasado').reduce((s, c) => s + c.valor, 0) +
    lancamentosMes.filter((l) => l.status === 'pendente' || l.status === 'atrasado').reduce((s, l) => s + l.valor, 0)
  const recebido =
    cobrancasMes.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0) +
    lancamentosMes.filter((l) => l.status === 'pago').reduce((s, l) => s + l.valor, 0)
  const aPagar = despesasMes.filter((d) => d.status === 'pendente' || d.status === 'atrasado').reduce((s, d) => s + d.valor, 0)
  const pago = despesasMes.filter((d) => d.status === 'pago').reduce((s, d) => s + d.valor, 0)
  const contratosAtivos = contratos.filter((c) => c.ativo).length
  const saldoMes = recebido - pago

  // Fluxo de caixa: agrupa por semana do mês atual, usando a data em que o
  // dinheiro de fato entrou/saiu (data_pagamento)
  const semanas = [1, 2, 3, 4, 5]
  const entradasPorSemana = semanas.map((semana) =>
    cobrancas
      .filter((c) => c.status === 'pago' && (c as any).data_pagamento?.startsWith(mesAtual) && Math.ceil(parseInt((c as any).data_pagamento.slice(8, 10), 10) / 7) === semana)
      .reduce((s, c) => s + c.valor, 0) +
    lancamentos
      .filter((l) => l.status === 'pago' && l.data_pagamento?.startsWith(mesAtual) && Math.ceil(parseInt(l.data_pagamento.slice(8, 10), 10) / 7) === semana)
      .reduce((s, l) => s + l.valor, 0)
  )
  const saidasPorSemana = semanas.map((semana) =>
    despesas
      .filter((d) => d.status === 'pago' && d.data_pagamento?.startsWith(mesAtual) && Math.ceil(parseInt(d.data_pagamento.slice(8, 10), 10) / 7) === semana)
      .reduce((s, d) => s + d.valor, 0)
  )

  const maiorValor = Math.max(1, ...entradasPorSemana, ...saidasPorSemana)
  const alturaMax = 100

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card titulo="Contratos Ativos" valor={String(contratosAtivos)} cor="text-blue-600" />
        <Card titulo="A Receber (mês)" valor={formatMoeda(aReceber)} cor="text-gray-700" />
        <Card titulo="Recebido (mês)" valor={formatMoeda(recebido)} cor="text-green-600" />
        <Card titulo="A Pagar (mês)" valor={formatMoeda(aPagar)} cor="text-gray-700" />
        <Card titulo="Pago (mês)" valor={formatMoeda(pago)} cor="text-red-600" />
        <Card titulo="Saldo do Mês" valor={formatMoeda(saldoMes)} cor={saldoMes >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Fluxo de Caixa do Mês (por semana)</h3>
        <div className="flex items-end gap-6 h-40">
          {semanas.map((semana, idx) => (
            <div key={semana} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 h-32">
                <div
                  className="w-6 bg-green-500 rounded-t"
                  style={{ height: `${(entradasPorSemana[idx] / maiorValor) * alturaMax}%` }}
                  title={`Entradas: ${formatMoeda(entradasPorSemana[idx])}`}
                />
                <div
                  className="w-6 bg-red-400 rounded-t"
                  style={{ height: `${(saidasPorSemana[idx] / maiorValor) * alturaMax}%` }}
                  title={`Saídas: ${formatMoeda(saidasPorSemana[idx])}`}
                />
              </div>
              <span className="text-xs text-gray-500">Sem {semana}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Entradas</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Saídas</span>
        </div>
      </div>
    </div>
  )
}
