'use client'

import { useEffect, useState } from 'react'
import { formatMoeda } from '@/lib/contratos'
import {
  ServicoCobranca,
  ContaRecebimento,
  listarServicos,
  criarServico,
  listarContasRecebimento,
  criarContaRecebimento,
  gerarProximoNumeroContrato,
  criarContratoAtivo,
  DescontoTipo,
  TerminoTipo,
} from '@/lib/cobrancas'

interface Cliente {
  id: string
  nome_razao_social: string
}

interface Usuario {
  id: string
  nome_completo: string
}

interface Props {
  clientes: Cliente[]
  usuarios: Usuario[]
  onCriado: () => void
  onCancelar: () => void
}

const DIAS_MES = Array.from({ length: 28 }, (_, i) => i + 1)

function ordinalDia(dia: number): string {
  return `${dia}º dia do mês`
}

function proximaOcorrencia(dataInicio: string, diaAlvo: number): Date | null {
  if (!dataInicio) return null
  const [y, m, d] = dataInicio.split('-').map(Number)
  let ano = y
  let mes = m
  if (d > diaAlvo) {
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return new Date(ano, mes - 1, diaAlvo)
}

function formatarDataBR(d: Date | null): string {
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function diffMeses(inicio: string, termino: string): number | null {
  if (!inicio || !termino) return null
  const [y1, m1] = inicio.split('-').map(Number)
  const [y2, m2] = termino.split('-').map(Number)
  const diff = (y2 - y1) * 12 + (m2 - m1) + 1
  return diff > 0 ? diff : null
}

function inputMoeda(valor: number | null, onChange: (v: number | null) => void, placeholder = 'R$ 0,00') {
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
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Boleto Bancário', 'Cartão de Crédito', 'Transferência Bancária']

export default function NovoContratoAtivoForm({ clientes, usuarios, onCriado, onCancelar }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [servicos, setServicos] = useState<ServicoCobranca[]>([])
  const [contas, setContas] = useState<ContaRecebimento[]>([])
  const [novoServicoNome, setNovoServicoNome] = useState('')
  const [novaContaNome, setNovaContaNome] = useState('')

  const hoje = new Date().toISOString().slice(0, 10)

  const [numeroContrato, setNumeroContrato] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [dataInicio, setDataInicio] = useState(hoje)
  const [diaGeracao, setDiaGeracao] = useState(5)

  const [recorrenciaIntervalo, setRecorrenciaIntervalo] = useState(1)
  const [recorrenciaUnidade, setRecorrenciaUnidade] = useState<'mes' | 'ano'>('mes')
  const [terminoTipo, setTerminoTipo] = useState<TerminoTipo>('indeterminado')
  const [dataTermino, setDataTermino] = useState('')

  const [categoriaFinanceira, setCategoriaFinanceira] = useState('Receitas de Serviços')
  const [vendedorId, setVendedorId] = useState('')

  const [servicoId, setServicoId] = useState('')
  const [itensValor, setItensValor] = useState<number | null>(null)

  const [descontoTipo, setDescontoTipo] = useState<DescontoTipo>('valor')
  const [descontoValor, setDescontoValor] = useState<number | null>(null)

  const [formaPagamento, setFormaPagamento] = useState('')
  const [contaRecebimentoId, setContaRecebimentoId] = useState('')
  const [diaVencimento, setDiaVencimento] = useState(5)

  useEffect(() => {
    async function init() {
      const numero = await gerarProximoNumeroContrato()
      setNumeroContrato(numero)
      const [{ data: servicosData }, { data: contasData }] = await Promise.all([
        listarServicos(),
        listarContasRecebimento(),
      ])
      setServicos(servicosData)
      setContas(contasData)
    }
    init()
  }, [])

  async function handleRegenerarNumero() {
    setNumeroContrato(await gerarProximoNumeroContrato())
  }

  function handleSelecionarServico(id: string) {
    setServicoId(id)
    const servico = servicos.find((s) => s.id === id)
    if (servico?.valor_padrao != null) setItensValor(servico.valor_padrao)
  }

  async function handleCriarServico() {
    if (!novoServicoNome.trim()) return
    const { data, error } = await criarServico(novoServicoNome.trim())
    if (error) {
      setErro(error)
      return
    }
    if (data) {
      setServicos((prev) => [...prev, data])
      setServicoId(data.id)
    }
    setNovoServicoNome('')
  }

  async function handleCriarConta() {
    if (!novaContaNome.trim()) return
    const { data, error } = await criarContaRecebimento(novaContaNome.trim(), 'Banco')
    if (error) {
      setErro(error)
      return
    }
    if (data) {
      setContas((prev) => [...prev, data])
      setContaRecebimentoId(data.id)
    }
    setNovaContaNome('')
  }

  const itens = itensValor || 0
  const desconto = descontoTipo === 'valor' ? (descontoValor || 0) : itens * ((descontoValor || 0) / 100)
  const totalLiquido = itens - desconto

  const dataPrimeiraVenda = proximaOcorrencia(dataInicio, diaGeracao)
  const dataPrimeiroVencimento = proximaOcorrencia(dataInicio, diaVencimento)
  const vigenciaMeses = terminoTipo === 'periodo' ? diffMeses(dataInicio, dataTermino) : null

  async function handleSalvar() {
    setErro(null)

    if (!numeroContrato.trim()) {
      setErro('Informe o número do contrato')
      return
    }
    if (!clienteId) {
      setErro('Selecione o cliente')
      return
    }
    if (terminoTipo === 'periodo' && !dataTermino) {
      setErro('Informe a data de término')
      return
    }
    if (totalLiquido <= 0) {
      setErro('O valor total líquido precisa ser maior que zero')
      return
    }

    setSalvando(true)

    const servicoNome = servicos.find((s) => s.id === servicoId)?.nome || 'Honorários'

    const { success, error } = await criarContratoAtivo({
      cliente_id: clienteId,
      numero_contrato: numeroContrato.trim(),
      descricao: servicoNome,
      valor_mensal: totalLiquido,
      dia_vencimento: diaVencimento,
      dia_geracao: diaGeracao,
      data_inicio: dataInicio,
      categoria_financeira: categoriaFinanceira || undefined,
      vendedor_id: vendedorId || null,
      servico_id: servicoId || null,
      itens_valor: itens,
      desconto_tipo: descontoTipo,
      desconto_valor: descontoValor || 0,
      forma_pagamento: formaPagamento || undefined,
      conta_recebimento_id: contaRecebimentoId || null,
      recorrencia_intervalo: recorrenciaIntervalo,
      recorrencia_unidade: recorrenciaUnidade,
      termino_tipo: terminoTipo,
      data_termino: terminoTipo === 'periodo' ? dataTermino : null,
    })

    setSalvando(false)

    if (!success) {
      setErro(error || 'Erro ao criar contrato')
      return
    }

    onCriado()
  }

  const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="space-y-6">
      {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>}

      {/* Informações */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-gray-900">Informações</h3>

        <div>
          <label className={labelClass}>Tipo da venda</label>
          <div className="flex gap-2">
            <button type="button" disabled className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
              Orçamento (em breve)
            </button>
            <button type="button" disabled className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
              Venda avulsa (em breve)
            </button>
            <button type="button" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Venda recorrente (contrato)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Número do contrato *</label>
            <div className="flex gap-2">
              <input type="text" value={numeroContrato} onChange={(e) => setNumeroContrato(e.target.value)} className={inputClass} />
              <button type="button" onClick={handleRegenerarNumero} title="Gerar automaticamente" className="px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                ⚡
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Cliente *</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputClass}>
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Data de início *</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dia da geração das vendas *</label>
            <select value={diaGeracao} onChange={(e) => setDiaGeracao(parseInt(e.target.value, 10))} className={inputClass}>
              {DIAS_MES.map((d) => (
                <option key={d} value={d}>{ordinalDia(d)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Data da primeira venda</label>
            <p className="px-4 py-2 text-sm text-gray-700">{formatarDataBR(dataPrimeiraVenda)}</p>
          </div>
        </div>

        <h4 className="text-sm font-bold text-gray-900 pt-2">Configurações de recorrência</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Repetir venda a cada *</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={recorrenciaIntervalo}
                onChange={(e) => setRecorrenciaIntervalo(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select value={recorrenciaUnidade} onChange={(e) => setRecorrenciaUnidade(e.target.value as 'mes' | 'ano')} className={inputClass}>
                <option value="mes">Mês/meses</option>
                <option value="ano">Ano/anos</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Término da recorrência *</label>
            <select value={terminoTipo} onChange={(e) => setTerminoTipo(e.target.value as TerminoTipo)} className={inputClass}>
              <option value="indeterminado">Indeterminado</option>
              <option value="periodo">Em um período específico</option>
            </select>
          </div>
          {terminoTipo === 'periodo' && (
            <>
              <div>
                <label className={labelClass}>Data de término *</label>
                <input type="date" value={dataTermino} onChange={(e) => setDataTermino(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Vigência total</label>
                {vigenciaMeses && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {vigenciaMeses} {vigenciaMeses === 1 ? 'mês' : 'meses'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Classificação */}
      <div className="pt-4 border-t space-y-4">
        <h3 className="text-base font-bold text-gray-900">Classificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Categoria financeira</label>
            <input
              type="text"
              list="categorias-financeiras"
              value={categoriaFinanceira}
              onChange={(e) => setCategoriaFinanceira(e.target.value)}
              className={inputClass}
            />
            <datalist id="categorias-financeiras">
              <option value="Receitas de Serviços" />
              <option value="Honorários Contábeis" />
              <option value="Outras Receitas" />
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Vendedor responsável</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome_completo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="pt-4 border-t space-y-4">
        <h3 className="text-base font-bold text-gray-900">Itens</h3>
        <div>
          <label className={labelClass}>Selecione ou crie um novo item *</label>
          <select value={servicoId} onChange={(e) => handleSelecionarServico(e.target.value)} className={inputClass}>
            <option value="">Selecione um serviço</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={novoServicoNome}
              onChange={(e) => setNovoServicoNome(e.target.value)}
              placeholder="Ou digite o nome de um novo serviço"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={handleCriarServico} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium whitespace-nowrap">
              + Novo
            </button>
          </div>
        </div>
      </div>

      {/* Valor */}
      <div className="pt-4 border-t space-y-4">
        <h3 className="text-base font-bold text-gray-900">Valor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Valor do Item</label>
            {inputMoeda(itensValor, setItensValor)}
          </div>
          <div>
            <label className={labelClass}>Desconto</label>
            <div className="flex gap-2">
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  type="button"
                  onClick={() => setDescontoTipo('valor')}
                  className={`px-3 py-2 text-sm font-medium ${descontoTipo === 'valor' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setDescontoTipo('percentual')}
                  className={`px-3 py-2 text-sm font-medium ${descontoTipo === 'percentual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  %
                </button>
              </div>
              {descontoTipo === 'valor' ? (
                inputMoeda(descontoValor, setDescontoValor)
              ) : (
                <input
                  type="number"
                  value={descontoValor ?? ''}
                  onChange={(e) => setDescontoValor(e.target.value === '' ? null : parseFloat(e.target.value))}
                  placeholder="0"
                  className={inputClass}
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Itens (R$)</span>
            <span>{formatMoeda(itens)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Desconto (R$)</span>
            <span>-{formatMoeda(desconto)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
            <span>Total líquido (R$) — cobrado por mês</span>
            <span>{formatMoeda(totalLiquido)}</span>
          </div>
        </div>
      </div>

      {/* Informações de pagamento */}
      <div className="pt-4 border-t space-y-4">
        <h3 className="text-base font-bold text-gray-900">Informações de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Forma de pagamento</label>
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Conta de recebimento</label>
            <select value={contaRecebimentoId} onChange={(e) => setContaRecebimentoId(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={novaContaNome}
                onChange={(e) => setNovaContaNome(e.target.value)}
                placeholder="Ou digite o nome de uma nova conta"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={handleCriarConta} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium whitespace-nowrap">
                + Nova
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Vencer sempre no *</label>
            <select value={diaVencimento} onChange={(e) => setDiaVencimento(parseInt(e.target.value, 10))} className={inputClass}>
              {DIAS_MES.map((d) => (
                <option key={d} value={d}>{ordinalDia(d)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Vencimento da primeira cobrança</label>
            <p className="px-4 py-2 text-sm text-gray-700">{formatarDataBR(dataPrimeiroVencimento)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {salvando ? 'Salvando...' : 'Salvar Contrato'}
        </button>
        <button onClick={onCancelar} className="px-6 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition">
          Cancelar
        </button>
      </div>
    </div>
  )
}
