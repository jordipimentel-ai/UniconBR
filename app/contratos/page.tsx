'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import ContratoForm from '@/components/ContratoForm'
import ContratoPreview from '@/components/ContratoPreview'
import { CATEGORIAS, ContratoTemplate, DadosContrato } from '@/lib/contratos'
import { exportarElementoParaPDF } from '@/lib/pdf-export'

export default function ContratosPage() {
  const router = useRouter()
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(CATEGORIAS[0].id)
  const [templateSelecionado, setTemplateSelecionado] = useState<ContratoTemplate | null>(null)
  const [dadosGerados, setDadosGerados] = useState<DadosContrato | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setLoadingAuth(false)
    }
    checkAuth()
  }, [router])

  const categoriaAtual = CATEGORIAS.find((c) => c.id === categoriaSelecionada)

  function handleSelecionarTemplate(template: ContratoTemplate) {
    setTemplateSelecionado(template)
    setDadosGerados(null)
    setErro(null)
  }

  async function handleBaixarPDF() {
    if (!templateSelecionado || !dadosGerados) return

    const { success, error } = await exportarElementoParaPDF(
      'contrato-preview',
      `${templateSelecionado.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`
    )
    if (!success) setErro(error || 'Erro ao gerar PDF')
  }

  if (loadingAuth) {
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
            <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600 text-sm mt-1">Selecione o tipo de contrato e preencha os dados para gerar</p>
          </div>
        </header>

        <main className="px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Seleção de categoria */}
            <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex-wrap">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoriaSelecionada(cat.id)
                    setTemplateSelecionado(null)
                    setDadosGerados(null)
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium transition ${
                    categoriaSelecionada === cat.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat.nome}
                </button>
              ))}
            </div>

            {/* Seleção do tipo de contrato dentro da categoria */}
            {!dadosGerados && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Contrato *</label>
                <select
                  value={templateSelecionado?.id || ''}
                  onChange={(e) => {
                    const template = categoriaAtual?.templates.find((t) => t.id === e.target.value)
                    if (template) handleSelecionarTemplate(template)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione o tipo de contrato</option>
                  {categoriaAtual?.templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {templateSelecionado && !dadosGerados && (
              <ContratoForm
                key={templateSelecionado.id}
                template={templateSelecionado}
                onGerar={setDadosGerados}
              />
            )}

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
            )}

            {templateSelecionado && dadosGerados && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleBaixarPDF}
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    📥 Baixar PDF
                  </button>
                  <button
                    onClick={() => setDadosGerados(null)}
                    className="px-6 py-2 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition"
                  >
                    ← Voltar e Editar
                  </button>
                </div>
                <ContratoPreview template={templateSelecionado} dados={dadosGerados} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
