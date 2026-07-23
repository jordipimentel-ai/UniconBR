import { ContratoTemplate, texto, numero, formatMoeda } from './types'

export const alteracaoEITemplate: ContratoTemplate = {
  id: 'alteracao_ei',
  categoria: 'juceal',
  nome: 'Alteração de Empresário Individual',
  titulo: 'INSTRUMENTO DE ALTERAÇÃO DE EMPRESÁRIO INDIVIDUAL',
  campos: [
    { key: 'empresario_nome', label: 'Nome do Empresário', tipo: 'texto', obrigatorio: true },
    { key: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
    { key: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
    { key: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
    { key: 'rg', label: 'RG', tipo: 'texto' },
    { key: 'endereco_residencial', label: 'Endereço Residencial', tipo: 'textarea', obrigatorio: true },
    { key: 'firma', label: 'Nome Empresarial (Firma)', tipo: 'texto', obrigatorio: true },
    { key: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true },
    { key: 'nire', label: 'NIRE', tipo: 'texto', obrigatorio: true },
    { key: 'endereco_empresa_atual', label: 'Endereço Atual da Empresa', tipo: 'textarea', obrigatorio: true },
    { key: 'alterar_capital', label: 'Alterar Capital Social?', tipo: 'select', opcoes: ['Não', 'Sim'], padrao: 'Não' },
    { key: 'capital_antigo', label: 'Capital Social Atual (R$)', tipo: 'moeda' },
    { key: 'capital_novo', label: 'Novo Capital Social (R$)', tipo: 'moeda' },
    { key: 'alterar_endereco', label: 'Alterar Endereço da Empresa?', tipo: 'select', opcoes: ['Não', 'Sim'], padrao: 'Não' },
    { key: 'endereco_empresa_novo', label: 'Novo Endereço da Empresa', tipo: 'textarea' },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  gerarClausulas(dados) {
    const clausulas: string[] = []
    const nome = texto(dados, 'empresario_nome').toUpperCase()

    clausulas.push(
      `${nome}, ${texto(dados, 'nacionalidade', 'brasileiro(a)')}${texto(dados, 'estado_civil') ? `, ${texto(dados, 'estado_civil')}` : ''}, portador(a) do CPF nº ${texto(dados, 'cpf')}${texto(dados, 'rg') ? ` e RG nº ${texto(dados, 'rg')}` : ''}, residente e domiciliado(a) em ${texto(dados, 'endereco_residencial')}, registrado(a) sob a firma ${texto(dados, 'firma')}, com sede em ${texto(dados, 'endereco_empresa_atual')}, inscrita no CNPJ nº ${texto(dados, 'cnpj')}, registrada na Junta Comercial do Estado de Alagoas sob o NIRE nº ${texto(dados, 'nire')}, resolve ALTERAR o EMPRESÁRIO INDIVIDUAL mediante as seguintes cláusulas:`
    )

    let numeroClausula = 1
    const ordinal = ['PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA']

    if (texto(dados, 'alterar_capital') === 'Sim') {
      const antigo = numero(dados, 'capital_antigo')
      const novo = numero(dados, 'capital_novo')
      clausulas.push(
        `CLÁUSULA ${ordinal[numeroClausula - 1]}: O Capital Social da empresa, que antes era de ${formatMoeda(antigo)}, passa a ser de ${formatMoeda(novo)}, totalmente subscrito e integralizado em moeda corrente do país.`
      )
      numeroClausula++
    }

    if (texto(dados, 'alterar_endereco') === 'Sim') {
      clausulas.push(
        `CLÁUSULA ${ordinal[numeroClausula - 1]}: A empresa, que vinha exercendo suas atividades em ${texto(dados, 'endereco_empresa_atual')}, passa a fazê-lo em ${texto(dados, 'endereco_empresa_novo')}.`
      )
      numeroClausula++
    }

    clausulas.push(`CLÁUSULA ${ordinal[numeroClausula - 1]}: Permanecem inalteradas as demais cláusulas contratuais não modificadas pelas condições acima mencionadas.`)
    clausulas.push(`E por estar assim justo e acertado, assina o presente instrumento em uma única via.`)

    return clausulas
  },
  gerarAssinaturas(dados) {
    return [{ nome: texto(dados, 'empresario_nome').toUpperCase(), documento: `CPF: ${texto(dados, 'cpf')}` }]
  },
}
