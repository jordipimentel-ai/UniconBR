import { ContratoTemplate, texto, numero, formatMoeda, pessoas } from './types'

function qualificacaoPJ(p: Record<string, any>): string {
  let t = `${String(p.razao_social || '').toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${p.cnpj}, com sede em ${p.endereco}`
  if (p.representante_nome) {
    t += `, neste ato representada por ${p.representante_cargo ? `seu(sua) ${p.representante_cargo}, ` : ''}${p.representante_nome}${p.representante_cpf ? `, CPF nº ${p.representante_cpf}` : ''}`
  }
  return t
}

export const prestacaoServicoTemplate: ContratoTemplate = {
  id: 'prestacao_servico',
  categoria: 'prestacao_servico',
  nome: 'Contrato de Prestação de Serviços (PJ)',
  titulo: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
  campos: [
    { key: 'objeto_servico', label: 'Objeto do Contrato (descrição do serviço)', tipo: 'textarea', obrigatorio: true },
    { key: 'prazo_vigencia', label: 'Prazo de Vigência', tipo: 'texto', placeholder: 'Ex: 12 meses', obrigatorio: true },
    { key: 'valor_pagamento', label: 'Valor do Pagamento (R$)', tipo: 'moeda', obrigatorio: true },
    { key: 'periodicidade_pagamento', label: 'Periodicidade do Pagamento', tipo: 'select', opcoes: ['Mensal', 'Quinzenal', 'Por entrega/serviço', 'Única'], padrao: 'Mensal' },
    { key: 'multa_atraso', label: 'Multa por Atraso no Pagamento (%)', tipo: 'numero', padrao: 2 },
    { key: 'juros_mora', label: 'Juros de Mora ao Mês (%)', tipo: 'numero', padrao: 1 },
    { key: 'multa_rescisao', label: 'Multa por Rescisão Antecipada (%)', tipo: 'numero', padrao: 10 },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  partes: [
    {
      key: 'contratantes',
      label: 'Contratante(s)',
      labelSingular: 'Contratante',
      minimo: 1,
      camposPessoa: [
        { key: 'razao_social', label: 'Razão Social', tipo: 'texto', obrigatorio: true },
        { key: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
        { key: 'representante_nome', label: 'Nome do Representante Legal', tipo: 'texto' },
        { key: 'representante_cargo', label: 'Cargo do Representante', tipo: 'texto' },
        { key: 'representante_cpf', label: 'CPF do Representante', tipo: 'texto' },
      ],
    },
    {
      key: 'contratadas',
      label: 'Contratada(s)',
      labelSingular: 'Contratada',
      minimo: 1,
      camposPessoa: [
        { key: 'razao_social', label: 'Razão Social', tipo: 'texto', obrigatorio: true },
        { key: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
        { key: 'representante_nome', label: 'Nome do Representante Legal', tipo: 'texto' },
        { key: 'representante_cargo', label: 'Cargo do Representante', tipo: 'texto' },
        { key: 'representante_cpf', label: 'CPF do Representante', tipo: 'texto' },
      ],
    },
  ],
  gerarClausulas(dados) {
    const contratantes = pessoas(dados, 'contratantes')
    const contratadas = pessoas(dados, 'contratadas')
    const clausulas: string[] = []

    contratantes.forEach((p) => clausulas.push(`CONTRATANTE: ${qualificacaoPJ(p)}.`))
    contratadas.forEach((p) => clausulas.push(`CONTRATADA: ${qualificacaoPJ(p)}.`))

    clausulas.push(`1. DO OBJETO: O presente contrato tem como objeto a prestação de serviços de ${texto(dados, 'objeto_servico')}, pela CONTRATADA à CONTRATANTE.`)
    clausulas.push(`2. DO PRAZO DE VIGÊNCIA: Este contrato terá vigência de ${texto(dados, 'prazo_vigencia')}, contados a partir da data de sua assinatura, podendo ser prorrogado mediante aditivo contratual firmado por ambas as partes com antecedência mínima de 30 (trinta) dias do término do prazo inicial.`)
    clausulas.push(
      `3. DO PAGAMENTO: O pagamento pelos serviços prestados será realizado pela CONTRATANTE com periodicidade ${texto(dados, 'periodicidade_pagamento', 'mensal').toLowerCase()}, no valor de ${formatMoeda(numero(dados, 'valor_pagamento'))}. Em caso de atraso, incidirá multa de ${texto(dados, 'multa_atraso', '2')}% sobre o valor devido, além de juros de mora de ${texto(dados, 'juros_mora', '1')}% ao mês.`
    )
    clausulas.push(`4. DAS OBRIGAÇÕES DA CONTRATADA: A CONTRATADA deverá realizar os serviços com a diligência e o profissionalismo esperados, seguindo as normas e regulamentações aplicáveis à sua área de atuação.`)
    clausulas.push(`5. DAS OBRIGAÇÕES DA CONTRATANTE: A CONTRATANTE se obriga a fornecer todas as informações, documentos e dados necessários à realização do serviço, com precisão e agilidade.`)
    clausulas.push(`6. DA CONFIDENCIALIDADE: A CONTRATADA compromete-se a manter sigilo absoluto sobre todas as informações confidenciais recebidas da CONTRATANTE durante a vigência deste contrato, obrigação que se estende por 5 (cinco) anos após seu término.`)
    clausulas.push(
      `7. DA RESCISÃO ANTECIPADA: Em caso de rescisão antecipada sem justificativa, será aplicada multa compensatória de ${texto(dados, 'multa_rescisao', '10')}% sobre o valor total do contrato, devendo a rescisão ser formalizada por escrito com antecedência mínima de 30 (trinta) dias.`
    )
    clausulas.push(`8. DO FORO: Fica eleito o foro de ${texto(dados, 'foro_cidade')} para dirimir quaisquer dúvidas ou litígios oriundos deste contrato.`)
    clausulas.push(`9. DAS DISPOSIÇÕES GERAIS: Qualquer modificação a este contrato deverá ser formalizada por escrito e assinada por ambas as partes, passando a integrá-lo para todos os efeitos legais.`)
    clausulas.push(`As partes concordam com as disposições acima e assinam o presente instrumento em duas vias de igual teor, na presença de duas testemunhas.`)

    return clausulas
  },
  gerarAssinaturas(dados) {
    return [...pessoas(dados, 'contratantes'), ...pessoas(dados, 'contratadas')].map((p) => ({
      nome: String(p.razao_social || '').toUpperCase(),
      documento: p.cnpj ? `CNPJ: ${p.cnpj}` : undefined,
    }))
  },
}
