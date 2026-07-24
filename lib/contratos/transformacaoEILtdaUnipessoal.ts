import { ContratoTemplate, texto, numero, formatMoeda, pessoas, qualificacaoPessoa } from './types'

// Sociedade Limitada Unipessoal (SLU): um único titular detém 100% das
// quotas — introduzida pela Lei 13.874/2019 (Lei da Liberdade Econômica),
// que alterou o art. 1.052 do Código Civil para dispensar a pluralidade
// de sócios na constituição de uma sociedade limitada
export const transformacaoEILtdaUnipessoalTemplate: ContratoTemplate = {
  id: 'transformacao_ei_ltda_unipessoal',
  categoria: 'juceal',
  nome: 'Transformação de EI em Sociedade Limitada Unipessoal (1 titular)',
  titulo: 'ALTERAÇÃO DE INSTRUMENTO DE EMPRESÁRIO INDIVIDUAL POR TRANSFORMAÇÃO EM SOCIEDADE LIMITADA UNIPESSOAL',
  campos: [
    { key: 'titular_nome', label: 'Nome do Titular (Empresário)', tipo: 'texto', obrigatorio: true },
    { key: 'titular_nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
    { key: 'titular_estado_civil', label: 'Estado Civil', tipo: 'texto' },
    { key: 'titular_cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
    { key: 'titular_rg', label: 'RG', tipo: 'texto' },
    { key: 'titular_endereco', label: 'Endereço Residencial', tipo: 'textarea', obrigatorio: true },
    { key: 'firma_atual', label: 'Nome Empresarial Atual (Firma)', tipo: 'texto', obrigatorio: true },
    { key: 'endereco_sede', label: 'Endereço da Sede', tipo: 'textarea', obrigatorio: true },
    { key: 'nire', label: 'NIRE', tipo: 'texto', obrigatorio: true },
    { key: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true },
    { key: 'nome_empresarial_novo', label: 'Novo Nome Empresarial (deve terminar em LTDA)', tipo: 'texto', obrigatorio: true },
    { key: 'objeto_social', label: 'Objeto Social (atividades da empresa)', tipo: 'textarea', obrigatorio: true },
    { key: 'capital_social', label: 'Capital Social (R$)', tipo: 'moeda', obrigatorio: true },
    { key: 'numero_quotas', label: 'Número de Quotas', tipo: 'numero', obrigatorio: true },
    { key: 'valor_quota', label: 'Valor Nominal de Cada Quota (R$)', tipo: 'moeda', obrigatorio: true },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  partes: [
    {
      key: 'socios',
      label: 'Titular (único quotista)',
      labelSingular: 'Titular',
      minimo: 1,
      maximo: 1,
      camposPessoa: [
        { key: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { key: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
        { key: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
        { key: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
      ],
    },
  ],
  gerarClausulas(dados) {
    const titular = pessoas(dados, 'socios')[0]
    const capital = numero(dados, 'capital_social')
    const clausulas: string[] = []

    clausulas.push(
      `${texto(dados, 'titular_nome').toUpperCase()}, ${texto(dados, 'titular_nacionalidade', 'brasileiro(a)')}${texto(dados, 'titular_estado_civil') ? `, ${texto(dados, 'titular_estado_civil')}` : ''}, portador(a) do CPF nº ${texto(dados, 'titular_cpf')}${texto(dados, 'titular_rg') ? ` e RG nº ${texto(dados, 'titular_rg')}` : ''}, residente e domiciliado(a) em ${texto(dados, 'titular_endereco')}, EMPRESÁRIO(A), com sede em ${texto(dados, 'endereco_sede')}, registrado(a) na Junta Comercial do Estado de Alagoas – JUCEAL sob o NIRE nº ${texto(dados, 'nire')}, inscrito(a) no CNPJ sob nº ${texto(dados, 'cnpj')}, resolve:`
    )
    clausulas.push(
      `CLÁUSULA PRIMEIRA – Fica transformado este Empresário Individual em Sociedade Limitada Unipessoal, sob o nome empresarial de ${texto(dados, 'nome_empresarial_novo').toUpperCase()}, com sub-rogação de todos os direitos e obrigações pertinentes.`
    )
    clausulas.push(
      `CLÁUSULA SEGUNDA – O acervo deste Empresário Individual, no valor de ${formatMoeda(capital)}, passa a constituir o capital da Sociedade Limitada Unipessoal mencionada na cláusula anterior.`
    )
    clausulas.push(`Para tanto, firma nesta mesma data, em documento separado, o Ato Constitutivo de Sociedade Limitada Unipessoal por transformação de Empresário Individual.`)

    clausulas.push('---CONTRATO SOCIAL---')

    clausulas.push(`ATO CONSTITUTIVO DA SOCIEDADE LIMITADA UNIPESSOAL ${texto(dados, 'nome_empresarial_novo').toUpperCase()}`)

    if (titular) {
      clausulas.push(`TITULAR: ${qualificacaoPessoa(titular)}, único(a) titular da totalidade das quotas do capital social.`)
    }

    clausulas.push(
      `O titular acima qualificado resolve constituir uma Sociedade Limitada Unipessoal, nos termos do art. 1.052, § 1º, do Código Civil (com redação dada pela Lei nº 13.874/2019), mediante as seguintes cláusulas:`
    )
    clausulas.push(`Cláusula Primeira – A sociedade girará sob o nome empresarial ${texto(dados, 'nome_empresarial_novo').toUpperCase()}.`)
    clausulas.push(`Cláusula Segunda – A sociedade terá sua sede em ${texto(dados, 'endereco_sede')}, podendo abrir ou fechar filiais mediante alteração do ato constitutivo.`)
    clausulas.push(`Cláusula Terceira – O objeto da sociedade é: ${texto(dados, 'objeto_social')}.`)
    clausulas.push(`Cláusula Quarta – O prazo de duração da sociedade é indeterminado.`)

    const numQuotas = numero(dados, 'numero_quotas')
    const valorQuota = numero(dados, 'valor_quota')
    clausulas.push(
      `Cláusula Quinta – O capital social é de ${formatMoeda(capital)}, dividido em ${numQuotas} quotas no valor nominal de ${formatMoeda(valorQuota)} cada uma, totalmente integralizadas em moeda corrente, pertencentes integralmente ao titular único.`
    )
    clausulas.push(`Cláusula Sexta – A responsabilidade do titular é restrita ao valor de suas quotas, integralmente subscritas e integralizadas, conforme art. 1.052 do Código Civil.`)
    clausulas.push(
      `Cláusula Sétima – A administração da sociedade será exercida pelo próprio titular, que representará legalmente a sociedade, podendo praticar todo e qualquer ato de gestão pertinente ao objeto social.`
    )
    clausulas.push(`Cláusula Oitava – O exercício social coincidirá com o ano civil, cabendo ao titular a integralidade dos lucros ou perdas apurados.`)
    clausulas.push(`Cláusula Nona – Em caso de falecimento do titular, a sociedade não será dissolvida, sendo suas quotas transmitidas aos herdeiros na forma da lei, ou liquidada a critério destes.`)
    clausulas.push(
      `Cláusula Décima – Fica eleito o foro de ${texto(dados, 'foro_cidade')} para dirimir quaisquer dúvidas decorrentes do presente instrumento, renunciando o titular a qualquer outro, por mais privilegiado que seja.`
    )
    clausulas.push(`E, por estar assim justo e acertado, assina o presente instrumento particular em via única.`)

    return clausulas
  },
  gerarAssinaturas(dados) {
    return pessoas(dados, 'socios').map((p) => ({
      nome: String(p.nome || '').toUpperCase(),
      documento: p.cpf ? `CPF: ${p.cpf}` : undefined,
    }))
  },
}
