'use client'

import { useState, useEffect } from 'react'
import {
  ContratoTemplate,
  CampoSchema,
  ValoresCampos,
  ValoresPartes,
  ValoresClausulasDinamicas,
  ItemClausulaDinamica,
  DadosContrato,
} from '@/lib/contratos'
import { getEscritorio, Escritorio } from '@/lib/escritorio'

interface ClienteOpcao {
  id: string
  nome_razao_social: string
  cpf_cnpj?: string
}

interface ContratoFormProps {
  template: ContratoTemplate
  onGerar: (dados: DadosContrato) => void | Promise<void>
  clientesDisponiveis?: ClienteOpcao[]
}

function valoresIniciaisCampos(campos: CampoSchema[]): ValoresCampos {
  const valores: ValoresCampos = {}
  campos.forEach((c) => {
    if (c.padrao !== undefined) valores[c.key] = c.padrao
  })
  return valores
}

function pessoaVazia(camposPessoa: CampoSchema[]): ValoresCampos {
  const p: ValoresCampos = {}
  camposPessoa.forEach((c) => {
    if (c.padrao !== undefined) p[c.key] = c.padrao
  })
  return p
}

function clausulasIniciais(grupos: ContratoTemplate['clausulasDinamicas']): ValoresClausulasDinamicas {
  const iniciais: ValoresClausulasDinamicas = {}
  ;(grupos || []).forEach((grupo) => {
    iniciais[grupo.key] = []
  })
  return iniciais
}

export default function ContratoForm({ template, onGerar, clientesDisponiveis = [] }: ContratoFormProps) {
  const [campos, setCampos] = useState<ValoresCampos>(() => valoresIniciaisCampos(template.campos))
  const [partes, setPartes] = useState<ValoresPartes>(() => {
    const iniciais: ValoresPartes = {}
    ;(template.partes || []).forEach((grupo) => {
      iniciais[grupo.key] = Array.from({ length: grupo.minimo }, () => pessoaVazia(grupo.camposPessoa))
    })
    return iniciais
  })
  const [clausulas, setClausulas] = useState<ValoresClausulasDinamicas>(() => clausulasIniciais(template.clausulasDinamicas))
  const [erro, setErro] = useState<string | null>(null)
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null)

  useEffect(() => {
    getEscritorio().then(({ data }) => {
      if (data) setEscritorio(data)
    })
  }, [])

  function handleUsarDadosEscritorio(grupoKey: string) {
    if (!escritorio) return
    const lista = partes[grupoKey] || []
    const nova = [...lista]
    nova[0] = {
      ...nova[0],
      nome: escritorio.nome || nova[0]?.nome || '',
      cnpj: escritorio.cnpj || nova[0]?.cnpj || '',
      endereco: escritorio.endereco || nova[0]?.endereco || '',
      representante_nome: escritorio.contadores?.[0]?.nome || nova[0]?.representante_nome || '',
    }
    setPartes({ ...partes, [grupoKey]: nova })
  }

  function handleSelecionarCliente(grupoKey: string, clienteId: string) {
    const cliente = clientesDisponiveis.find((c) => c.id === clienteId)
    if (!cliente) return
    const lista = partes[grupoKey] || []
    const nova = [...lista]
    nova[0] = {
      ...nova[0],
      nome: cliente.nome_razao_social,
      cnpj: cliente.cpf_cnpj || '',
    }
    setPartes({ ...partes, [grupoKey]: nova })
  }

  // Reseta o formulário sempre que o tipo de contrato muda
  useEffect(() => {
    setCampos(valoresIniciaisCampos(template.campos))
    const iniciais: ValoresPartes = {}
    ;(template.partes || []).forEach((grupo) => {
      iniciais[grupo.key] = Array.from({ length: grupo.minimo }, () => pessoaVazia(grupo.camposPessoa))
    })
    setPartes(iniciais)
    setClausulas(clausulasIniciais(template.clausulasDinamicas))
    setErro(null)
  }, [template])

  function renderCampoInput(campo: CampoSchema, valor: any, onChange: (v: any) => void) {
    const className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'

    if (campo.tipo === 'textarea') {
      return (
        <textarea
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          rows={2}
          className={className}
        />
      )
    }
    if (campo.tipo === 'select') {
      return (
        <select value={valor ?? ''} onChange={(e) => onChange(e.target.value)} className={className}>
          <option value="">Selecione</option>
          {(campo.opcoes || []).map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      )
    }
    if (campo.tipo === 'data') {
      return <input type="date" value={valor ?? ''} onChange={(e) => onChange(e.target.value)} className={className} />
    }
    if (campo.tipo === 'numero' || campo.tipo === 'moeda') {
      return (
        <input
          type="number"
          step={campo.tipo === 'moeda' ? '0.01' : '1'}
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
          placeholder={campo.placeholder}
          className={className}
        />
      )
    }
    return (
      <input
        type="text"
        value={valor ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        className={className}
      />
    )
  }

  function handleGerar() {
    for (const campo of template.campos) {
      if (campo.obrigatorio && !campos[campo.key]) {
        setErro(`Preencha o campo "${campo.label}"`)
        return
      }
    }

    for (const grupo of template.partes || []) {
      const lista = partes[grupo.key] || []
      for (const pessoa of lista) {
        for (const campo of grupo.camposPessoa) {
          if (campo.obrigatorio && !pessoa[campo.key]) {
            setErro(`Preencha o campo "${campo.label}" de ${grupo.labelSingular}`)
            return
          }
        }
      }
    }

    for (const grupo of template.clausulasDinamicas || []) {
      const itens = clausulas[grupo.key] || []
      for (const item of itens) {
        const tipoDef = grupo.tipos.find((t) => t.valor === item.tipo)
        if (!tipoDef) continue
        for (const campo of tipoDef.campos) {
          if (campo.obrigatorio && !item.valores[campo.key]) {
            setErro(`Preencha o campo "${campo.label}" em "${tipoDef.label}"`)
            return
          }
        }
      }
    }

    setErro(null)
    onGerar({ campos, partes, clausulasDinamicas: clausulas })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-900">{template.nome}</h2>

      {(template.partes || []).map((grupo) => {
        const lista = partes[grupo.key] || []
        const atingiuMaximo = grupo.maximo !== undefined && lista.length >= grupo.maximo
        return (
          <div key={grupo.key} className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-800">{grupo.label}</label>
              {grupo.key === 'contratada' && escritorio && (
                <button
                  type="button"
                  onClick={() => handleUsarDadosEscritorio(grupo.key)}
                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition"
                >
                  Usar dados do escritório
                </button>
              )}
            </div>
            {grupo.key === 'contratante' && clientesDisponiveis.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleSelecionarCliente(grupo.key, e.target.value)
                  e.target.value = ''
                }}
                className="w-full px-4 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">Selecionar cliente cadastrado (preenche nome e CNPJ/CPF)</option>
                {clientesDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
                ))}
              </select>
            )}
            {lista.map((pessoa, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">{grupo.labelSingular} {idx + 1}</span>
                  {lista.length > grupo.minimo && (
                    <button
                      onClick={() => {
                        const nova = [...lista]
                        nova.splice(idx, 1)
                        setPartes({ ...partes, [grupo.key]: nova })
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {grupo.camposPessoa.map((campo) => (
                    <div key={campo.key} className={campo.tipo === 'textarea' ? 'col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {campo.label}{campo.obrigatorio && ' *'}
                      </label>
                      {renderCampoInput(campo, pessoa[campo.key], (v) => {
                        const nova = [...lista]
                        nova[idx] = { ...nova[idx], [campo.key]: v }
                        setPartes({ ...partes, [grupo.key]: nova })
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!atingiuMaximo && (
              <button
                onClick={() => setPartes({ ...partes, [grupo.key]: [...lista, pessoaVazia(grupo.camposPessoa)] })}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Adicionar {grupo.labelSingular.toLowerCase()}
              </button>
            )}
          </div>
        )
      })}

      {(template.clausulasDinamicas || []).map((grupo) => {
        const itens = clausulas[grupo.key] || []
        return (
          <div key={grupo.key} className="pt-4 border-t space-y-3">
            <label className="block text-sm font-semibold text-gray-800">{grupo.label}</label>

            {itens.map((item, idx) => {
              const tipoDef = grupo.tipos.find((t) => t.valor === item.tipo) || grupo.tipos[0]
              return (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <select
                      value={item.tipo}
                      onChange={(e) => {
                        const novoTipo = e.target.value
                        const novos = [...itens]
                        novos[idx] = { tipo: novoTipo, valores: {} }
                        setClausulas({ ...clausulas, [grupo.key]: novos })
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                    >
                      {grupo.tipos.map((t) => (
                        <option key={t.valor} value={t.valor}>{t.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const novos = [...itens]
                        novos.splice(idx, 1)
                        setClausulas({ ...clausulas, [grupo.key]: novos })
                      }}
                      className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(tipoDef?.campos || []).map((campo) => (
                      <div key={campo.key} className={campo.tipo === 'textarea' ? 'col-span-2' : ''}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {campo.label}{campo.obrigatorio && ' *'}
                        </label>
                        {renderCampoInput(campo, item.valores[campo.key], (v) => {
                          const novos = [...itens]
                          novos[idx] = { ...novos[idx], valores: { ...novos[idx].valores, [campo.key]: v } }
                          setClausulas({ ...clausulas, [grupo.key]: novos })
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => {
                const novoItem: ItemClausulaDinamica = { tipo: grupo.tipos[0].valor, valores: {} }
                setClausulas({ ...clausulas, [grupo.key]: [...itens, novoItem] })
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Adicionar alteração
            </button>
          </div>
        )
      })}

      <div className="pt-4 border-t grid grid-cols-2 gap-4">
        {template.campos.map((campo) => (
          <div key={campo.key} className={campo.tipo === 'textarea' ? 'col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {campo.label}{campo.obrigatorio && ' *'}
            </label>
            {renderCampoInput(campo, campos[campo.key], (v) => setCampos({ ...campos, [campo.key]: v }))}
          </div>
        ))}
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleGerar}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          📄 Gerar Contrato
        </button>
      </div>
    </div>
  )
}
