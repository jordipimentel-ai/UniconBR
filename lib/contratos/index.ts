import { ContratoTemplate } from './types'
import { locacaoTemplate } from './locacao'
import { compraVendaTemplate } from './compraVenda'
import { prestacaoServicoTemplate } from './prestacaoServico'
import { alteracaoEITemplate } from './alteracaoEmpresarioIndividual'
import { transformacaoEILtdaTemplate } from './transformacaoEILtda'
import { servicoContabilTemplate } from './servicoContabil'

export * from './types'

export interface CategoriaContrato {
  id: string
  nome: string
  templates: ContratoTemplate[]
}

export const CATEGORIAS: CategoriaContrato[] = [
  {
    id: 'imoveis',
    nome: 'Imóveis',
    templates: [compraVendaTemplate, locacaoTemplate],
  },
  {
    id: 'servicos',
    nome: 'Prestação de Serviços',
    templates: [prestacaoServicoTemplate],
  },
  {
    id: 'juceal',
    nome: 'Alterações JUCEAL',
    templates: [alteracaoEITemplate, transformacaoEILtdaTemplate],
  },
  {
    id: 'clientes',
    nome: 'Contratos com Clientes',
    templates: [servicoContabilTemplate],
  },
]

export function getTemplateById(id: string): ContratoTemplate | undefined {
  for (const categoria of CATEGORIAS) {
    const template = categoria.templates.find((t) => t.id === id)
    if (template) return template
  }
  return undefined
}
