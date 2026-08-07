'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { buscarDadosCNPJ } from '@/lib/cnpj-lookup'
import { uploadDocumentoCliente } from '@/lib/cliente-documentos'
import { formatarTelefone } from '@/lib/telefone'
import SecaoAccordion from '@/components/SecaoAccordion'

const SEGMENTOS = ['Comércio', 'Serviços', 'Comércio e Serviços']

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [erroCNPJ, setErroCNPJ] = useState<string | null>(null)
  const [anexosPendentes, setAnexosPendentes] = useState<File[]>([])

  const [formData, setFormData] = useState({
    nome_razao_social: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    email_cobranca: '',
    whatsapp_cobranca: '',
    tipo: 'PF' as 'PF' | 'PJ',
    regime_tributario: 'Simples',
    segmento: '',
    em_funcionamento: true,
    representante: '',
    observacoes: '',
    nome_fantasia: '',
    endereco: '',
    cnaes: '',
    porte: '',
    natureza_juridica: '',
    data_abertura: '',
    ie_indicador: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    inscricao_suframa: '',
  })

  async function handleBuscarCNPJ() {
    setErroCNPJ(null)
    setBuscandoCNPJ(true)

    const { data, error: erroBusca } = await buscarDadosCNPJ(formData.cpf_cnpj)

    if (!data) {
      setErroCNPJ(erroBusca || 'Não foi possível buscar os dados do CNPJ')
      setBuscandoCNPJ(false)
      return
    }

    setFormData({
      ...formData,
      tipo: 'PJ',
      nome_razao_social: data.nomeRazaoSocial || formData.nome_razao_social,
      nome_fantasia: data.nomeFantasia,
      endereco: data.endereco,
      cnaes: data.cnaes,
      porte: data.porte,
      natureza_juridica: data.naturezaJuridica,
      data_abertura: data.dataAbertura,
    })
    setBuscandoCNPJ(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: novoCliente, error: insertError } = await supabase
      .from('clientes')
      .insert([formData])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (anexosPendentes.length > 0 && novoCliente) {
      for (const arquivo of anexosPendentes) {
        await uploadDocumentoCliente(novoCliente.id, arquivo)
      }
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

  function handleTelefoneChange(campo: 'telefone' | 'whatsapp_cobranca', valor: string) {
    setFormData({ ...formData, [campo]: formatarTelefone(valor) })
  }

  function handleAdicionarAnexos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || [])
    e.target.value = ''
    setAnexosPendentes((prev) => [...prev, ...arquivos])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/clientes" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Novo Cliente</h1>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Dados Gerais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pessoa
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF / CNPJ
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCNPJ}
                      disabled={buscandoCNPJ}
                      className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition text-sm whitespace-nowrap"
                    >
                      {buscandoCNPJ ? 'Buscando...' : '🔍 Buscar dados'}
                    </button>
                  </div>
                  {erroCNPJ && <p className="text-xs text-red-600 mt-1">{erroCNPJ}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Abertura
                  </label>
                  <input
                    type="date"
                    name="data_abertura"
                    value={formData.data_abertura}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Para pessoa jurídica: "Buscar dados" preenche nome fantasia, endereço, CNAEs, porte, natureza
                jurídica e data de abertura a partir da base pública da Receita Federal — tudo fica editável.
              </p>
            </div>

            {/* Informações Adicionais */}
            <SecaoAccordion titulo="Informações Adicionais">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone Celular</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleTelefoneChange('telefone', e.target.value)}
                    placeholder="(82) 98298-8834"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </SecaoAccordion>

            {/* Contato para Cobrança e Faturamento */}
            <SecaoAccordion
              titulo="Contato para Cobrança e Faturamento"
              badge="Novidade"
              subtitulo="Cobranças e contratos serão enviados para o(s) contato(s) informado(s) aqui."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email_cobranca"
                    value={formData.email_cobranca}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input
                    type="text"
                    name="whatsapp_cobranca"
                    value={formData.whatsapp_cobranca}
                    onChange={(e) => handleTelefoneChange('whatsapp_cobranca', e.target.value)}
                    placeholder="(82) 98298-8834"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </SecaoAccordion>

            {/* Informações Fiscais */}
            <SecaoAccordion titulo="Informações Fiscais" defaultAberta>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Razão Social / Nome *</label>
                  <input
                    type="text"
                    name="nome_razao_social"
                    value={formData.nome_razao_social}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Regime Tributário</label>
                  <select
                    name="regime_tributario"
                    value={formData.regime_tributario}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="Simples">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Segmento</label>
                  <select
                    name="segmento"
                    value={formData.segmento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Selecione</option>
                    {SEGMENTOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Representante (PJ)</label>
                  <input
                    type="text"
                    name="representante"
                    value={formData.representante}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Indicador de Inscrição Estadual</label>
                  <select
                    name="ie_indicador"
                    value={formData.ie_indicador}
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
                    value={formData.inscricao_estadual}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inscrição Municipal</label>
                  <input
                    type="text"
                    name="inscricao_municipal"
                    value={formData.inscricao_municipal}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inscrição Suframa</label>
                  <input
                    type="text"
                    name="inscricao_suframa"
                    value={formData.inscricao_suframa}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </SecaoAccordion>

            {/* Endereço */}
            <SecaoAccordion titulo="Endereço">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                  <textarea
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Porte</label>
                  <input
                    type="text"
                    name="porte"
                    value={formData.porte}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Natureza Jurídica</label>
                  <input
                    type="text"
                    name="natureza_juridica"
                    value={formData.natureza_juridica}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNAEs</label>
                  <textarea
                    name="cnaes"
                    value={formData.cnaes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </SecaoAccordion>

            {/* Observações */}
            <SecaoAccordion titulo="Observações">
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </SecaoAccordion>

            {/* Anexos */}
            <SecaoAccordion titulo="Anexos">
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  onChange={handleAdicionarAnexos}
                  className="text-sm text-gray-600"
                />
                {anexosPendentes.length > 0 && (
                  <ul className="space-y-2">
                    {anexosPendentes.map((arquivo, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700 truncate">📎 {arquivo.name}</span>
                        <button
                          type="button"
                          onClick={() => setAnexosPendentes((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-600 hover:text-red-700 font-medium ml-3"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-500">Os arquivos são enviados assim que o cliente for salvo.</p>
              </div>
            </SecaoAccordion>

            {/* Status */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="em_funcionamento"
                  checked={formData.em_funcionamento}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Em funcionamento</span>
              </label>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Salvando...' : 'Salvar Cliente'}
              </button>
              <Link
                href="/clientes"
                className="px-6 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
