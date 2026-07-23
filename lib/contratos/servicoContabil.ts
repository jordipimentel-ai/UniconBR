import { ContratoTemplate, texto, numero, formatMoeda, pessoas } from './types'

function qualificacaoParte(p: Record<string, any>): string {
  const ehPJ = !!p.cnpj
  if (ehPJ) {
    let t = `${String(p.nome || '').toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${p.cnpj}`
    if (p.endereco) t += `, com sede em ${p.endereco}`
    if (p.representante_nome) {
      t += `, neste ato representada por seu(sua) representante legal ${p.representante_nome}${p.representante_cpf ? `, CPF nº ${p.representante_cpf}` : ''}`
    }
    return t
  }
  let t = `${String(p.nome || '').toUpperCase()}, pessoa física${p.cpf ? `, CPF nº ${p.cpf}` : ''}`
  if (p.endereco) t += `, residente e domiciliado(a) em ${p.endereco}`
  return t
}

function listaContadores(contadores: Record<string, any>[]): string {
  const nomes = contadores.map((c) => `${c.nome}${c.crc ? ` (CRC ${c.crc})` : ''}`)
  if (nomes.length === 0) return ''
  if (nomes.length === 1) return nomes[0]
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

export const servicoContabilTemplate: ContratoTemplate = {
  id: 'servico_contabil',
  categoria: 'clientes',
  nome: 'Contrato de Prestação de Serviços Contábeis',
  titulo: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS',
  campos: [
    {
      key: 'servicos_recorrentes',
      label: 'Serviços Recorrentes (inclusos na mensalidade)',
      tipo: 'textarea',
      obrigatorio: true,
      padrao: 'apuração mensal de impostos, elaboração de demonstrativos contábeis (Balanço Patrimonial e DRE) e recolhimento de impostos e obrigações acessórias mensais',
    },
    {
      key: 'servicos_avulsos',
      label: 'Serviços Cobrados à Parte (não inclusos na mensalidade)',
      tipo: 'textarea',
      obrigatorio: true,
      padrao: 'abertura, baixa e alterações contratuais da empresa (JUCEAL/CNPJ) e Declaração de Imposto de Renda Pessoa Física (IRPF) dos sócios',
    },
    { key: 'valor_mensalidade', label: 'Valor da Mensalidade (R$)', tipo: 'moeda', obrigatorio: true },
    { key: 'dia_vencimento', label: 'Dia de Vencimento', tipo: 'numero', padrao: 10 },
    { key: 'multa_atraso', label: 'Multa por Atraso (%)', tipo: 'numero', padrao: 2 },
    { key: 'juros_mora', label: 'Juros de Mora ao Mês (%)', tipo: 'numero', padrao: 1 },
    { key: 'aviso_previo_dias', label: 'Aviso Prévio para Rescisão (dias)', tipo: 'numero', padrao: 30 },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  // "contratada" (o escritório) e seus contadores não aparecem aqui: são
  // preenchidos automaticamente com os dados de "Meu Escritório" na página,
  // não editáveis manualmente por este formulário genérico
  partes: [
    {
      key: 'contratante',
      label: 'Contratante (Cliente)',
      labelSingular: 'Contratante',
      minimo: 1,
      camposPessoa: [
        { key: 'nome', label: 'Nome / Razão Social', tipo: 'texto', obrigatorio: true },
        { key: 'cnpj', label: 'CNPJ (deixe em branco se pessoa física)', tipo: 'texto' },
        { key: 'cpf', label: 'CPF (se pessoa física)', tipo: 'texto' },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
        { key: 'representante_nome', label: 'Nome do Representante (se pessoa jurídica)', tipo: 'texto' },
        { key: 'representante_cpf', label: 'CPF do Representante', tipo: 'texto' },
      ],
    },
  ],
  gerarClausulas(dados) {
    const contratantes = pessoas(dados, 'contratante')
    const contratada = pessoas(dados, 'contratada')[0]
    const contadores = pessoas(dados, 'contadores_escritorio')
    const clausulas: string[] = []

    contratantes.forEach((p) => clausulas.push(`CONTRATANTE: ${qualificacaoParte(p)}.`))

    if (contratada) {
      let qualificacaoContratada = `${String(contratada.nome || '').toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${contratada.cnpj}`
      if (contratada.endereco) qualificacaoContratada += `, com sede em ${contratada.endereco}`
      if (contadores.length > 0) {
        qualificacaoContratada += `, neste ato representada por seu(s) contador(es) responsável(is) ${listaContadores(contadores)}`
      }
      clausulas.push(`CONTRATADA: ${qualificacaoContratada}.`)
    }

    clausulas.push(
      `CLÁUSULA PRIMEIRA – DO OBJETO: O presente contrato tem por objeto a prestação, pela CONTRATADA à CONTRATANTE, dos serviços de contabilidade da empresa, incluindo, dentro da mensalidade prevista neste contrato, ${texto(dados, 'servicos_recorrentes')}.`
    )
    clausulas.push(
      `Parágrafo único: Não estão inclusos na mensalidade os serviços de ${texto(dados, 'servicos_avulsos')}, que serão orçados e cobrados separadamente, conforme o serviço solicitado.`
    )
    clausulas.push(
      `CLÁUSULA SEGUNDA – DA VIGÊNCIA: O presente contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes, a qualquer tempo, mediante aviso prévio por escrito com antecedência mínima de ${texto(dados, 'aviso_previo_dias', '30')} dias.`
    )
    clausulas.push(
      `CLÁUSULA TERCEIRA – DOS HONORÁRIOS: Pelos serviços recorrentes prestados, a CONTRATANTE pagará à CONTRATADA a mensalidade de ${formatMoeda(numero(dados, 'valor_mensalidade'))}, com vencimento todo dia ${texto(dados, 'dia_vencimento', '10')} de cada mês. Em caso de atraso no pagamento, incidirá multa de ${texto(dados, 'multa_atraso', '2')}% sobre o valor devido, além de juros de mora de ${texto(dados, 'juros_mora', '1')}% ao mês.`
    )
    clausulas.push(
      `CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATADA: A CONTRATADA obriga-se a prestar os serviços contábeis com zelo, técnica e observância da legislação aplicável, entregando as obrigações dentro dos prazos legais, desde que tenha recebido da CONTRATANTE, em tempo hábil, toda a documentação necessária.`
    )
    clausulas.push(
      `CLÁUSULA QUINTA – DAS OBRIGAÇÕES DA CONTRATANTE: A CONTRATANTE obriga-se a fornecer à CONTRATADA, dentro dos prazos solicitados, todos os documentos e informações necessários à execução dos serviços, bem como a efetuar o pagamento da mensalidade e dos serviços avulsos nos prazos acordados.`
    )
    clausulas.push(
      `CLÁUSULA SEXTA – DA RESPONSABILIDADE: Cada parte responde pelos erros cometidos no exercício de suas próprias atribuições. A CONTRATADA responde pelos erros cometidos na execução dos serviços contábeis, com base nos documentos e informações recebidos da CONTRATANTE. A CONTRATANTE responde pela veracidade, exatidão e tempestividade dos documentos e informações que fornecer, não respondendo a CONTRATADA por erros, atrasos ou penalidades decorrentes de documentação incorreta, incompleta ou entregue fora do prazo.`
    )
    clausulas.push(
      `CLÁUSULA SÉTIMA – DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS: A CONTRATADA obriga-se a manter sigilo profissional sobre todas as informações e documentos a que tiver acesso em razão deste contrato, e a tratar os dados pessoais a que tiver acesso em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD), utilizando-os exclusivamente para a execução dos serviços aqui previstos.`
    )
    clausulas.push(
      `CLÁUSULA OITAVA – DO FORO: Fica eleito o foro de ${texto(dados, 'foro_cidade')} para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.`
    )
    clausulas.push(
      `E por estarem assim justas e contratadas, as partes firmam o presente instrumento em duas vias de igual teor, na presença de duas testemunhas.`
    )

    return clausulas
  },
  gerarAssinaturas(dados) {
    const assinaturasContratante = pessoas(dados, 'contratante').map((p) => ({
      nome: String(p.nome || '').toUpperCase(),
      documento: p.cnpj ? `CNPJ: ${p.cnpj}` : p.cpf ? `CPF: ${p.cpf}` : undefined,
    }))
    const assinaturasContadores = pessoas(dados, 'contadores_escritorio').map((c) => ({
      nome: String(c.nome || '').toUpperCase(),
      documento: c.crc ? `CRC: ${c.crc}` : undefined,
    }))
    return [...assinaturasContratante, ...assinaturasContadores]
  },
}
