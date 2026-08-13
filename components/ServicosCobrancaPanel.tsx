'use client'

import { useEffect, useState } from 'react'
import { formatMoeda } from '@/lib/contratos'
import { ServicoCobranca, listarServicos, criarServico, excluirServico, atualizarServico } from '@/lib/cobrancas'

function inputMoeda(valor: number | null, onChange: (v: number | null) => void, className = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500') {
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
      placeholder="R$ 0,00 (opcional)"
      className={className}
    />
  )
}

export default function ServicosCobrancaPanel() {
  const [servicos, setServicos] = useState<ServicoCobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [valorPadrao, setValorPadrao] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editValor, setEditValor] = useState<number | null>(null)

  async function carregar() {
    setLoading(true)
    const { data } = await listarServicos()
    setServicos(data)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriar() {
    setErro(null)
    if (!nome.trim()) {
      setErro('Informe o nome do serviço')
      return
    }
    const { error } = await criarServico(nome.trim(), valorPadrao)
    if (error) {
      setErro(error)
      return
    }
    setNome('')
    setValorPadrao(null)
    await carregar()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Remover este serviço do catálogo?')) return
    await excluirServico(id)
    await carregar()
  }

  function iniciarEdicao(s: ServicoCobranca) {
    setEditandoId(s.id)
    setEditNome(s.nome)
    setEditValor(s.valor_padrao)
    setErro(null)
  }

  function cancelarEdicao() {
    setEditandoId(null)
  }

  async function handleSalvarEdicao(id: string) {
    setErro(null)
    if (!editNome.trim()) {
      setErro('Informe o nome do serviço')
      return
    }
    const { success, error } = await atualizarServico(id, editNome.trim(), editValor)
    if (!success) {
      setErro(error || 'Erro ao salvar serviço')
      return
    }
    setEditandoId(null)
    await carregar()
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do serviço (ex: Honorários Contábeis)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="w-full md:w-48">{inputMoeda(valorPadrao, setValorPadrao)}</div>
        <button
          onClick={handleCriar}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
        >
          + Adicionar
        </button>
      </div>
      {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{erro}</div>}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : servicos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {servicos.map((s) =>
            editandoId === s.id ? (
              <li key={s.id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="w-full md:w-48">{inputMoeda(editValor, setEditValor)}</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSalvarEdicao(s.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-xs"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={cancelarEdicao}
                    className="px-3 py-1.5 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ) : (
              <li key={s.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-gray-900">{s.nome}</span>
                <div className="flex items-center gap-4">
                  {s.valor_padrao != null && <span className="text-sm text-gray-600">{formatMoeda(s.valor_padrao)}</span>}
                  <button onClick={() => iniciarEdicao(s)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Editar
                  </button>
                  <button onClick={() => handleExcluir(s.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                    Remover
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  )
}
