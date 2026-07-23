'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { getEscritorio, salvarEscritorio, uploadLogoEscritorio, Escritorio } from '@/lib/escritorio'

export default function EscritorioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [escritorioId, setEscritorioId] = useState<string | undefined>(undefined)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    contador_nome: '',
    contador_crc: '',
  })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data, error } = await getEscritorio()
      if (error) {
        setErro(error)
      } else if (data) {
        setEscritorioId(data.id)
        setLogoUrl(data.logo_url)
        setFormData({
          nome: data.nome || '',
          cnpj: data.cnpj || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          contador_nome: data.contador_nome || '',
          contador_crc: data.contador_crc || '',
        })
      }
      setLoading(false)
    }

    init()
  }, [router])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErro(null)
    setSucesso(null)

    try {
      let novaLogoUrl = logoUrl

      if (logoFile) {
        const { url, error: uploadError } = await uploadLogoEscritorio(logoFile)
        if (uploadError) {
          setErro(`Erro ao enviar logo: ${uploadError}`)
          setSaving(false)
          return
        }
        novaLogoUrl = url
      }

      const { data, error } = await salvarEscritorio({
        id: escritorioId,
        ...formData,
        logo_url: novaLogoUrl,
      })

      if (error) {
        setErro(error)
        setSaving(false)
        return
      }

      if (data) {
        setEscritorioId(data.id)
        setLogoUrl(data.logo_url)
        setLogoFile(null)
      }
      setSucesso('Dados do escritório salvos com sucesso!')
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Meu Escritório</h1>
            <p className="text-gray-600 text-sm mt-1">
              Dados e logotipo do escritório, usados opcionalmente nos relatórios e declarações
            </p>
          </div>
        </header>

        <main className="px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSalvar} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
              )}
              {sucesso && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{sucesso}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logotipo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview || logoUrl ? (
                      <img src={logoPreview || logoUrl || ''} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-2">Sem logo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="text-sm text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Escritório</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: JR Contabilidade e Consultoria"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Ex: São José da Laje"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contador Responsável</label>
                  <input
                    type="text"
                    value={formData.contador_nome}
                    onChange={(e) => setFormData({ ...formData, contador_nome: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRC</label>
                  <input
                    type="text"
                    value={formData.contador_crc}
                    onChange={(e) => setFormData({ ...formData, contador_crc: e.target.value })}
                    placeholder="Ex: 009936-5/O"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 pt-2">
                Esses dados não são usados automaticamente em nenhum relatório — cada relatório pergunta antes de
                preencher com os dados cadastrados aqui.
              </p>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {saving ? 'Salvando...' : 'Salvar Dados do Escritório'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
