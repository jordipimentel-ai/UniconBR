import { ContratoTemplate, texto, numero, formatMoeda, pessoas, qualificacaoPessoa } from './types'

export const transformacaoEILtdaTemplate: ContratoTemplate = {
  id: 'transformacao_ei_ltda',
  categoria: 'juceal',
  nome: 'Transformação de Empresário Individual em Sociedade Limitada',
  titulo: 'ALTERAÇÃO DE INSTRUMENTO DE EMPRESÁRIO INDIVIDUAL POR TRANSFORMAÇÃO EM SOCIEDADE LIMITADA',
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
    { key: 'administrador', label: 'Administrador(es) da Sociedade', tipo: 'texto', placeholder: 'Ex: ambos os sócios, ou nome do administrador' },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  partes: [
    {
      key: 'socios',
      label: 'Sócios (incluindo o titular)',
      labelSingular: 'Sócio',
      minimo: 2,
      camposPessoa: [
        { key: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { key: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
        { key: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
        { key: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
        { key: 'quotas', label: 'Nº de Quotas', tipo: 'numero', obrigatorio: true },
        { key: 'percentual', label: 'Percentual de Participação (%)', tipo: 'numero', obrigatorio: true },
      ],
    },
  ],
  gerarClausulas(dados) {
    const socios = pessoas(dados, 'socios')
    const capital = numero(dados, 'capital_social')
    const clausulas: string[] = []

    clausulas.push(
      `${texto(dados, 'titular_nome').toUpperCase()}, ${texto(dados, 'titular_nacionalidade', 'brasileiro(a)')}${texto(dados, 'titular_estado_civil') ? `, ${texto(dados, 'titular_estado_civil')}` : ''}, portador(a) do CPF nº ${texto(dados, 'titular_cpf')}${texto(dados, 'titular_rg') ? ` e RG nº ${texto(dados, 'titular_rg')}` : ''}, residente e domiciliado(a) em ${texto(dados, 'titular_endereco')}, EMPRESÁRIO(A), com sede em ${texto(dados, 'endereco_sede')}, registrado(a) na Junta Comercial do Estado de Alagoas – JUCEAL sob o NIRE nº ${texto(dados, 'nire')}, inscrito(a) no CNPJ sob nº ${texto(dados, 'cnpj')}, resolve:`
    )
    clausulas.push(
      `CLÁUSULA PRIMEIRA – Fica transformado este Empresário Individual em Sociedade Limitada, sob o nome empresarial de ${texto(dados, 'nome_empresarial_novo').toUpperCase()}, com sub-rogação de todos os direitos e obrigações pertinentes.`
    )
    clausulas.push(
      `CLÁUSULA SEGUNDA – O acervo deste Empresário Individual, no valor de ${formatMoeda(capital)}, passa a constituir o capital da Sociedade Limitada mencionada na cláusula anterior.`
    )
    clausulas.push(`Para tanto, firma nesta mesma data, em documento separado, o Contrato Social de constituição por transformação de Empresário Individual.`)

    clausulas.push('---CONTRATO SOCIAL---')

    clausulas.push(`CONTRATO SOCIAL DA SOCIEDADE ${texto(dados, 'nome_empresarial_novo').toUpperCase()}`)

    socios.forEach((s, i) => {
      clausulas.push(`SÓCIO ${i + 1}: ${qualificacaoPessoa(s)}, titular de ${s.quotas} quotas (${s.percentual}% do capital social).`)
    })

    clausulas.push(`Os sócios acima qualificados, entre si justos e contratados, resolvem constituir uma Sociedade Empresária Limitada, mediante as seguintes cláusulas:`)
    clausulas.push(`Cláusula Primeira – A sociedade girará sob o nome empresarial ${texto(dados, 'nome_empresarial_novo').toUpperCase()}.`)
    clausulas.push(`Cláusula Segunda – A sociedade terá sua sede em ${texto(dados, 'endereco_sede')}, podendo abrir ou fechar filiais mediante alteração contratual assinada por todos os sócios.`)
    clausulas.push(`Cláusula Terceira – O objeto da sociedade é: ${texto(dados, 'objeto_social')}.`)
    clausulas.push(`Cláusula Quarta – O prazo de duração da sociedade é indeterminado.`)

    const numQuotas = numero(dados, 'numero_quotas')
    const valorQuota = numero(dados, 'valor_quota')
    clausulas.push(
      `Cláusula Quinta – O capital social é de ${formatMoeda(capital)}, dividido em ${numQuotas} quotas no valor nominal de ${formatMoeda(valorQuota)} cada uma, totalmente integralizadas em moeda corrente, distribuídas entre os sócios na proporção indicada na qualificação de cada um.`
    )
    clausulas.push(`Cláusula Sexta – A responsabilidade de cada sócio é restrita ao valor de suas quotas, respondendo todos solidariamente pela integralização do capital social, conforme art. 1.052 do Código Civil.`)
    clausulas.push(
      `Cláusula Sétima – A administração da sociedade será exercida por ${texto(dados, 'administrador', 'todos os sócios')}, que representará(ão) legalmente a sociedade, podendo praticar todo e qualquer ato de gestão pertinente ao objeto social.`
    )
    clausulas.push(`Cláusula Oitava – As quotas são indivisíveis e não poderão ser cedidas ou transferidas a terceiros sem o consentimento dos demais sócios, a quem fica assegurado direito de preferência para aquisição.`)
    clausulas.push(`Cláusula Nona – O exercício social coincidirá com o ano civil, cabendo aos sócios, na proporção de suas quotas, os lucros ou perdas apurados.`)
    clausulas.push(`Cláusula Décima – Em caso de morte de um dos sócios, a sociedade não será dissolvida, continuando a ser gerida pelo sócio remanescente ou pelos herdeiros, observada a apuração de haveres na forma da lei.`)
    clausulas.push(
      `Cláusula Décima Primeira – As partes elegem o foro de ${texto(dados, 'foro_cidade')} para dirimir quaisquer dúvidas decorrentes do presente instrumento, renunciando a qualquer outro, por mais privilegiado que seja.`
    )
    clausulas.push(`E, por estarem justos e contratados, assinam o presente instrumento particular em via única.`)

    return clausulas
  },
  gerarAssinaturas(dados) {
    return pessoas(dados, 'socios').map((p) => ({
      nome: String(p.nome || '').toUpperCase(),
      documento: p.cpf ? `CPF: ${p.cpf}` : undefined,
    }))
  },
}
