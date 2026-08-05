'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getClienteById, updateCliente, deleteCliente } from '@/lib/client-management'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import RegistrosFinanceirosCliente from '@/components/RegistrosFinanceirosCliente'
import UploadPGDASCliente from '@/components/UploadPGDASCliente'
import AnexosCliente from '@/components/AnexosCliente'
import SecaoAccordion from '@/components/SecaoAccordion'
import { buscarDadosCNPJ } from '@/lib/cnpj-lookup'
import { formatDataLocal } from '@/lib/date-utils'

interface Cliente {
  id: string
  nome_razao_social: string
  cpf_cnpj: string
  email: string
  telefone: string
  tipo: 'PF' | 'PJ'
  regime_tributario: string
  segmento: string
  em_funcionamento: boolean
  representante: string
  observacoes: string
  ativo: boolean
  nome_fantasia?: string
  endereco?: string
  cnaes?: string
  porte?: string
  natureza_juridica?: string
  data_abertura?: string
  email_cobranca?: string
  whatsapp_cobranca?: string
  ie_indicador?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  inscricao_suframa?: string
}

const REGIME_LABELS: Record<string, string> = {
  Simples: 'Simples Nacional',
  'Lucro Presumido': 'Lucro Presumido',
  'Lucro Real': 'Lucro Real',
}

export default function ClienteDetalhePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<Partial<Cliente>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [historicoKey, setHistoricoKey] = useState(0)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [erroCNPJ, setErroCNPJ] = useState<string | null>(null)

  async function handleBuscarCNPJ() {
    setErroCNPJ(null)
    setBuscandoCNPJ(true)

    const { data, error: erroBusca } = await buscarDadosCNPJ(formData.cpf_cnpj || '')

    if (!data) {
      setErroCNPJ(erroBusca || 'Não foi possível buscar os dados do CNPJ')
      setBuscandoCNPJ(false)
      return
    }

    setFormData({
      ...formData,
      nome_fantasia: data.nomeFantasia,
      endereco: data.endereco,
      cnaes: data.cnaes,
      porte: data.porte,
      natureza_juridica: data.naturezaJuridica,
      data_abertura: data.dataAbertura,
    })
    setBuscandoCNPJ(false)
  }

  useEffect(() => {
    async function loadCliente() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const { data } = await getClienteById(clienteId)
        if (data) {
          setCliente(data)
          setFormData(data)
        } else {
          setError('Cliente não encontrado')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCliente()
  }, [clienteId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { success: updateSuccess, error: updateError } = await updateCliente(
      clienteId,
      formData
    )

    if (!updateSuccess) {
      setError(updateError)
      setSaving(false)
      return
    }

    setSuccess(true)
    setCliente({ ...cliente, ...formData } as Cliente)
    setModoEdicao(false)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return

    setSaving(true)
    const { success: deleteSuccess, error: deleteError } = await deleteCliente(clienteId)

    if (!deleteSuccess) {
      setError(deleteError)
      setSaving(false)
      return
    }

    router.push('/clientes')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Cliente não encontrado</p>
            <Link href="/clientes" className="text-blue-600 hover:text-blue-700">
              ← Voltar para Clientes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/clientes" className="text-blue-600 hover:text-blue-700 text-sm">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {modoEdicao ? 'Editar Cliente' : cliente.nome_razao_social}
            </h1>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl bg-white rounded-lg shadow p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && !modoEdicao && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Cliente atualizado com sucesso!
              </div>
            )}

            {!modoEdicao && (
              <>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    cliente.tipo === 'PJ' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {cliente.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    cliente.em_funcionamento ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cliente.em_funcionamento ? 'Em funcionamento' : 'Inativo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">CPF/CNPJ</p>
                    <p className="text-gray-900 font-medium">{cliente.cpf_cnpj || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{cliente.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Telefone</p>
                    <p className="text-gray-900 font-medium">{cliente.telefone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Regime Tributário</p>
                    <p className="text-gray-900 font-medium">{REGIME_LABELS[cliente.regime_tributario] || cliente.regime_tributario || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Segmento</p>
                    <p className="text-gray-900 font-medium">{cliente.segmento || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Representante</p>
                    <p className="text-gray-900 font-medium">{cliente.representante || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nome Fantasia</p>
                    <p className="text-gray-900 font-medium">{cliente.nome_fantasia || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Porte</p>
                    <p className="text-gray-900 font-medium">{cliente.porte || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Natureza Jurídica</p>
                    <p className="text-gray-900 font-medium">{cliente.natureza_juridica || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Data de Abertura</p>
                    <p className="text-gray-900 font-medium">{cliente.data_abertura ? formatDataLocal(cliente.data_abertura) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email de Cobrança</p>
                    <p className="text-gray-900 font-medium">{cliente.email_cobranca || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">WhatsApp de Cobrança</p>
                    <p className="text-gray-900 font-medium">{cliente.whatsapp_cobranca || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Inscrição Estadual</p>
                    <p className="text-gray-900 font-medium">
                      {cliente.inscricao_estadual || '—'}
                      {cliente.ie_indicador && <span className="text-gray-500"> ({cliente.ie_indicador})</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Inscrição Municipal</p>
                    <p className="text-gray-900 font-medium">{cliente.inscricao_municipal || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Inscrição Suframa</p>
                    <p className="text-gray-900 font-medium">{cliente.inscricao_suframa || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Endereço</p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{cliente.endereco || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">CNAEs</p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{cliente.cnaes || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Observações</p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{cliente.observacoes || '—'}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setModoEdicao(true); setSuccess(false); setError(null) }}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={saving}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                  >
                    Deletar Cliente
                  </button>
                </div>
              </>
            )}

            {modoEdicao && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Básicos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Básicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razão Social / Nome
                      </label>
                      <input
                        type="text"
                        name="nome_razao_social"
                        value={formData.nome_razao_social || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF / CNPJ
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="cpf_cnpj"
                          value={formData.cpf_cnpj || ''}
                          onChange={handleChange}
                          required
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed outline-none"
                        />
                        {formData.tipo === 'PJ' && (
                          <button
                            type="button"
                            onClick={handleBuscarCNPJ}
                            disabled={buscandoCNPJ}
                            className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition text-sm whitespace-nowrap"
                          >
                            {buscandoCNPJ ? 'Buscando...' : '🔍 Atualizar da Receita'}
                          </button>
                        )}
                      </div>
                      {erroCNPJ && <p className="text-xs text-red-600 mt-1">{erroCNPJ}</p>}
                      <p className="text-xs text-gray-500 mt-1">Não pode ser alterado</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone Celular
                      </label>
                      <input
                        type="text"
                        name="telefone"
                        value={formData.telefone || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contato para Cobrança e Faturamento */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Contato para Cobrança e Faturamento</h3>
                  <p className="text-xs text-gray-500 mb-4">Cobranças e contratos são enviados para o(s) contato(s) informado(s) aqui.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email_cobranca"
                        value={formData.email_cobranca || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                      <input
                        type="text"
                        name="whatsapp_cobranca"
                        value={formData.whatsapp_cobranca || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Classificação */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Classificação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        name="tipo"
                        value={formData.tipo || 'PF'}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="PF">Pessoa Física</option>
                        <option value="PJ">Pessoa Jurídica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regime Tributário
                      </label>
                      <select
                        name="regime_tributario"
                        value={formData.regime_tributario || 'Simples'}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="Simples">Simples Nacional</option>
                        <option value="Lucro Presumido">Lucro Presumido</option>
                        <option value="Lucro Real">Lucro Real</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Segmento
                      </label>
                      <input
                        type="text"
                        name="segmento"
                        value={formData.segmento || ''}
                        onChange={handleChange}
                        placeholder="Ex: Comércio, Serviços..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Representante (PJ)
                      </label>
                      <input
                        type="text"
                        name="representante"
                        value={formData.representante || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indicador de Inscrição Estadual</label>
                      <select
                        name="ie_indicador"
                        value={formData.ie_indicador || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Selecione</option>
                        <option value="Contribuinte">Contribuinte</option>
                        <option value="Contribuinte Isento">Contribuinte Isento</option>
                        <option value="Não Contribuinte">Não Contribuinte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Inscrição Estadual</label>
                      <input
                        type="text"
                        name="inscricao_estadual"
                        value={formData.inscricao_estadual || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Inscrição Municipal</label>
                      <input
                        type="text"
                        name="inscricao_municipal"
                        value={formData.inscricao_municipal || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Inscrição Suframa</label>
                      <input
                        type="text"
                        name="inscricao_suframa"
                        value={formData.inscricao_suframa || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados da Receita Federal (CNPJ) */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Receita Federal (CNPJ)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Fantasia</label>
                      <input
                        type="text"
                        name="nome_fantasia"
                        value={formData.nome_fantasia || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data de Abertura</label>
                      <input
                        type="date"
                        name="data_abertura"
                        value={formData.data_abertura || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Porte</label>
                      <input
                        type="text"
                        name="porte"
                        value={formData.porte || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Natureza Jurídica</label>
                      <input
                        type="text"
                        name="natureza_juridica"
                        value={formData.natureza_juridica || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <textarea
                        name="endereco"
                        value={formData.endereco || ''}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">CNAEs</label>
                      <textarea
                        name="cnaes"
                        value={formData.cnaes || ''}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="em_funcionamento"
                      checked={formData.em_funcionamento || false}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Em funcionamento</span>
                  </label>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModoEdicao(false)
                      setFormData(cliente)
                      setError(null)
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <UploadPGDASCliente clienteId={clienteId} onSalvo={() => setHistoricoKey((k) => k + 1)} />

            <RegistrosFinanceirosCliente key={historicoKey} clienteId={clienteId} />

            <div className="pt-6 border-t">
              <SecaoAccordion titulo="📎 Anexos">
                <AnexosCliente clienteId={clienteId} />
              </SecaoAccordion>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmação de Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tem certeza?</h3>
            <p className="text-gray-600 mb-6">
              Esta ação não pode ser desfeita. O cliente será deletado permanentemente.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                Deletar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
