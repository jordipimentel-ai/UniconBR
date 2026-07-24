import { ContratoTemplate, texto, itensClausula, itemTexto, itemNumero, formatMoeda, ordinal } from './types'

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
    { key: 'firma', label: 'Nome Empresarial Atual (Firma)', tipo: 'texto', obrigatorio: true },
    { key: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true },
    { key: 'nire', label: 'NIRE', tipo: 'texto', obrigatorio: true },
    { key: 'endereco_empresa_atual', label: 'Endereço Atual da Empresa', tipo: 'textarea', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  // Cada alteração é adicionada uma a uma pelo usuário, podendo combinar
  // quantas quiser dentro do mesmo instrumento (ex.: mudar endereço E capital
  // no mesmo contrato), na ordem em que forem inseridas
  clausulasDinamicas: [
    {
      key: 'alteracoes',
      label: 'Alterações',
      tipos: [
        {
          valor: 'razao_social',
          label: 'Razão Social e Nome Fantasia',
          campos: [
            { key: 'razao_social_nova', label: 'Nova Razão Social', tipo: 'texto', obrigatorio: true },
            { key: 'nome_fantasia_novo', label: 'Novo Nome Fantasia (opcional)', tipo: 'texto' },
          ],
        },
        {
          valor: 'endereco',
          label: 'Endereço',
          campos: [
            { key: 'endereco_novo', label: 'Novo Endereço da Empresa', tipo: 'textarea', obrigatorio: true },
          ],
        },
        {
          valor: 'capital',
          label: 'Capital Social',
          campos: [
            { key: 'capital_antigo', label: 'Capital Social Atual (R$)', tipo: 'moeda', obrigatorio: true },
            { key: 'capital_novo', label: 'Novo Capital Social (R$)', tipo: 'moeda', obrigatorio: true },
          ],
        },
        {
          valor: 'atividades',
          label: 'Atividades (Objeto Social)',
          campos: [
            { key: 'objeto_social_novo', label: 'Nova Descrição das Atividades', tipo: 'textarea', obrigatorio: true },
            { key: 'cnaes_novos', label: 'CNAEs (opcional)', tipo: 'textarea', placeholder: 'Ex: 4729-6/99 - Comércio varejista...' },
          ],
        },
        {
          valor: 'enquadramento',
          label: 'Enquadramento',
          campos: [
            {
              key: 'novo_enquadramento',
              label: 'Novo Enquadramento',
              tipo: 'select',
              obrigatorio: true,
              opcoes: ['Microempresa (ME)', 'Empresa de Pequeno Porte (EPP)', 'Sem enquadramento especial'],
            },
          ],
        },
      ],
    },
  ],
  gerarClausulas(dados) {
    const clausulas: string[] = []
    const nome = texto(dados, 'empresario_nome').toUpperCase()

    clausulas.push(
      `${nome}, ${texto(dados, 'nacionalidade', 'brasileiro(a)')}${texto(dados, 'estado_civil') ? `, ${texto(dados, 'estado_civil')}` : ''}, portador(a) do CPF nº ${texto(dados, 'cpf')}${texto(dados, 'rg') ? ` e RG nº ${texto(dados, 'rg')}` : ''}, residente e domiciliado(a) em ${texto(dados, 'endereco_residencial')}, registrado(a) sob a firma ${texto(dados, 'firma')}, com sede em ${texto(dados, 'endereco_empresa_atual')}, inscrita no CNPJ nº ${texto(dados, 'cnpj')}, registrada na Junta Comercial do Estado de Alagoas sob o NIRE nº ${texto(dados, 'nire')}, resolve ALTERAR o EMPRESÁRIO INDIVIDUAL mediante as seguintes cláusulas:`
    )

    const itens = itensClausula(dados, 'alteracoes')

    itens.forEach((item, idx) => {
      const cl = `CLÁUSULA ${ordinal(idx)}`

      if (item.tipo === 'razao_social') {
        const nomeFantasia = itemTexto(item, 'nome_fantasia_novo')
        clausulas.push(
          `${cl}: O nome empresarial passa a ser ${itemTexto(item, 'razao_social_nova')}${nomeFantasia ? `, adotando o nome fantasia ${nomeFantasia}` : ''}.`
        )
      } else if (item.tipo === 'endereco') {
        clausulas.push(
          `${cl}: A empresa, que vinha exercendo suas atividades em ${texto(dados, 'endereco_empresa_atual')}, passa a fazê-lo em ${itemTexto(item, 'endereco_novo')}.`
        )
      } else if (item.tipo === 'capital') {
        clausulas.push(
          `${cl}: O Capital Social da empresa, que antes era de ${formatMoeda(itemNumero(item, 'capital_antigo'))}, passa a ser de ${formatMoeda(itemNumero(item, 'capital_novo'))}, totalmente subscrito e integralizado em moeda corrente do país.`
        )
      } else if (item.tipo === 'atividades') {
        const cnaes = itemTexto(item, 'cnaes_novos')
        clausulas.push(
          `${cl}: A empresa passa a ter por objeto o exercício das seguintes atividades: ${itemTexto(item, 'objeto_social_novo')}.${cnaes ? ` Passando a exercer os seguintes CNAEs: ${cnaes}.` : ''}`
        )
      } else if (item.tipo === 'enquadramento') {
        clausulas.push(
          `${cl}: A empresa passa a se enquadrar como ${itemTexto(item, 'novo_enquadramento')}, nos termos da Lei Complementar nº 123, de 14 de dezembro de 2006.`
        )
      }
    })

    clausulas.push(`CLÁUSULA ${ordinal(itens.length)}: Permanecem inalteradas as demais cláusulas contratuais não modificadas pelas condições acima mencionadas.`)
    clausulas.push(`E por estar assim justo e acertado, assina o presente instrumento em uma única via.`)

    return clausulas
  },
  gerarAssinaturas(dados) {
    return [{ nome: texto(dados, 'empresario_nome').toUpperCase(), documento: `CPF: ${texto(dados, 'cpf')}` }]
  },
}
