'use client'

import { useEffect, useState } from 'react'
import {
  ClienteDocumento,
  listarDocumentosCliente,
  uploadDocumentoCliente,
  excluirDocumentoCliente,
} from '@/lib/cliente-documentos'

interface Props {
  clienteId: string
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AnexosCliente({ clienteId }: Props) {
  const [documentos, setDocumentos] = useState<ClienteDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data, error } = await listarDocumentosCliente(clienteId)
    if (error) setErro(error)
    setDocumentos(data)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  async function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || [])
    e.target.value = ''
    if (arquivos.length === 0) return

    setEnviando(true)
    setErro(null)
    let falhas = 0

    for (const arquivo of arquivos) {
      const { success } = await uploadDocumentoCliente(clienteId, arquivo)
      if (!success) falhas++
    }

    setEnviando(false)
    if (falhas > 0) setErro(`${falhas} arquivo(s) não foram enviados. Tente novamente.`)
    await carregar()
  }

  async function handleExcluir(doc: ClienteDocumento) {
    if (!confirm(`Excluir "${doc.nome_arquivo}"?`)) return
    const { success, error } = await excluirDocumentoCliente(doc)
    if (success) {
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id))
    } else {
      alert(error || 'Erro ao excluir arquivo')
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        multiple
        onChange={handleArquivos}
        disabled={enviando}
        className="text-sm text-gray-600"
      />
      {enviando && <p className="text-sm text-gray-500">Enviando...</p>}
      {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{erro}</div>}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando anexos...</p>
      ) : documentos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum documento anexado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {documentos.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-medium truncate">
                📎 {doc.nome_arquivo}
              </a>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs text-gray-500">{formatarTamanho(doc.tamanho_bytes)}</span>
                <button onClick={() => handleExcluir(doc)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
