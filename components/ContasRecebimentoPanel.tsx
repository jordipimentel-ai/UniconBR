'use client'

import { useEffect, useState } from 'react'
import { ContaRecebimento, listarContasRecebimento, criarContaRecebimento, excluirContaRecebimento } from '@/lib/cobrancas'

export default function ContasRecebimentoPanel() {
  const [contas, setContas] = useState<ContaRecebimento[]>([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'Caixa' | 'Banco'>('Banco')
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data } = await listarContasRecebimento()
    setContas(data)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriar() {
    setErro(null)
    if (!nome.trim()) {
      setErro('Informe o nome da conta')
      return
    }
    const { error } = await criarContaRecebimento(nome.trim(), tipo)
    if (error) {
      setErro(error)
      return
    }
    setNome('')
    await carregar()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Remover esta conta?')) return
    await excluirContaRecebimento(id)
    await carregar()
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da conta (ex: Caixa, Banco do Brasil)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'Caixa' | 'Banco')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Banco">Banco</option>
          <option value="Caixa">Caixa</option>
        </select>
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
      ) : contas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {contas.map((c) => (
            <li key={c.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-gray-900">
                {c.tipo === 'Caixa' ? '💵' : '🏦'} {c.nome}
              </span>
              <button onClick={() => handleExcluir(c.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
