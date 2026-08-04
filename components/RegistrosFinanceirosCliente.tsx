'use client'

import { useEffect, useState } from 'react'
import { formatMoeda } from '@/lib/contratos'
import {
  RegistroFinanceiroCliente,
  listarRegistrosFinanceiros,
  salvarRegistroFinanceiro,
  excluirRegistroFinanceiro,
} from '@/lib/registros-financeiros'

interface Props {
  clienteId: string
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatMesReferencia(mesRef: string): string {
  const [ano, mes] = mesRef.split('-')
  return `${MESES[parseInt(mes, 10) - 1]}/${ano}`
}

function inputMoeda(valor: string | number | null | undefined, onChange: (v: number | null) => void, placeholder = 'R$ 0,00') {
  const numerico = typeof valor === 'number' ? valor : 0
  const exibicao = valor === null || valor === undefined || valor === '' ? '' : formatMoeda(numerico)
  return (
    <input
      type="text"
      inputMode="numeric"
      value={exibicao}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, '')
        onChange(digitos ? parseInt(digitos, 10) / 100 : null)
      }}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
    />
  )
}

const FORM_VAZIO = {
  mes_referencia: '',
  faturamento: null as number | null,
  folha_paga: false,
  folha_valor: null as number | null,
  notas_compra_quantidade: null as number | null,
  notas_compra_valor: null as number | null,
  observacoes: '',
}

export default function RegistrosFinanceirosCliente({ clienteId }: Props) {
  const [registros, setRegistros] = useState<RegistroFinanceiroCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ ...FORM_VAZIO })

  async function carregar() {
    setLoading(true)
    const { data, error } = await listarRegistrosFinanceiros(clienteId)
    if (error) setErro(error)
    setRegistros(data)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  function abrirNovo() {
    setForm({ ...FORM_VAZIO })
    setEditandoId(null)
    setMostrarForm(true)
    setErro(null)
  }

  function abrirEdicao(registro: RegistroFinanceiroCliente) {
    setForm({
      mes_referencia: registro.mes_referencia.slice(0, 7),
      faturamento: registro.faturamento,
      folha_paga: registro.folha_paga,
      folha_valor: registro.folha_valor,
      notas_compra_quantidade: registro.notas_compra_quantidade,
      notas_compra_valor: registro.notas_compra_valor,
      observacoes: registro.observacoes || '',
    })
    setEditandoId(registro.id)
    setMostrarForm(true)
    setErro(null)
  }

  async function handleSalvar() {
    if (!form.mes_referencia) {
      setErro('Selecione o mês de referência')
      return
    }

    const { success, error } = await salvarRegistroFinanceiro(
      {
        cliente_id: clienteId,
        mes_referencia: `${form.mes_referencia}-01`,
        faturamento: form.faturamento,
        folha_paga: form.folha_paga,
        folha_valor: form.folha_valor,
        notas_compra_quantidade: form.notas_compra_quantidade,
        notas_compra_valor: form.notas_compra_valor,
        observacoes: form.observacoes || null,
      },
      editandoId || undefined
    )

    if (!success) {
      setErro(
        error?.toLowerCase().includes('duplicate') || error?.toLowerCase().includes('unique')
          ? 'Já existe um registro para esse mês. Edite o registro existente.'
          : error || 'Erro ao salvar registro'
      )
      return
    }

    setMostrarForm(false)
    await carregar()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este registro mensal?')) return
    const { success, error } = await excluirRegistroFinanceiro(id)
    if (success) {
      setRegistros((prev) => prev.filter((r) => r.id !== id))
    } else {
      alert(error || 'Erro ao excluir registro')
    }
  }

  return (
    <div className="pt-6 border-t">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Histórico Financeiro Mensal</h3>
        {!mostrarForm && (
          <button
            type="button"
            onClick={abrirNovo}
            className="text-sm px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Novo Registro
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{erro}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mês de Referência *</label>
              <input
                type="month"
                value={form.mes_referencia}
                onChange={(e) => setForm({ ...form, mes_referencia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">💰 Faturamento do Mês</label>
              {inputMoeda(form.faturamento, (v) => setForm({ ...form, faturamento: v }))}
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                <input
                  type="checkbox"
                  checked={form.folha_paga}
                  onChange={(e) => setForm({ ...form, folha_paga: e.target.checked })}
                  className="w-4 h-4"
                />
                📋 Folha de Pagamento Paga
              </label>
              {form.folha_paga && inputMoeda(form.folha_valor, (v) => setForm({ ...form, folha_valor: v }), 'Valor da folha')}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">🧾 Notas de Compra (quantidade)</label>
              <input
                type="number"
                value={form.notas_compra_quantidade ?? ''}
                onChange={(e) => setForm({ ...form, notas_compra_quantidade: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">🧾 Notas de Compra (valor total)</label>
              {inputMoeda(form.notas_compra_valor, (v) => setForm({ ...form, notas_compra_valor: v }))}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">📝 Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSalvar}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Salvar Registro
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando histórico...</p>
      ) : registros.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum registro mensal cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">Mês</th>
                <th className="py-2 pr-4">Faturamento</th>
                <th className="py-2 pr-4">Folha</th>
                <th className="py-2 pr-4">Notas de Compra</th>
                <th className="py-2 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{formatMesReferencia(r.mes_referencia)}</td>
                  <td className="py-2 pr-4">{r.faturamento != null ? formatMoeda(r.faturamento) : '—'}</td>
                  <td className="py-2 pr-4">
                    {r.folha_paga ? (
                      <span className="text-green-700">✅ Paga{r.folha_valor != null ? ` (${formatMoeda(r.folha_valor)})` : ''}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {r.notas_compra_quantidade || r.notas_compra_valor ? (
                      <span>
                        {r.notas_compra_quantidade ?? 0} nota(s){r.notas_compra_valor != null ? ` — ${formatMoeda(r.notas_compra_valor)}` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-3">
                      <button onClick={() => abrirEdicao(r)} className="text-blue-600 hover:text-blue-700 font-medium">
                        Editar
                      </button>
                      <button onClick={() => handleExcluir(r.id)} className="text-red-600 hover:text-red-700 font-medium">
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
    </div>
  )
}
