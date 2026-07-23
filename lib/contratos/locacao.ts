import { ContratoTemplate, texto, numero, dataFmt, formatMoeda, pessoas, qualificacaoPessoa } from './types'

export const locacaoTemplate: ContratoTemplate = {
  id: 'locacao',
  categoria: 'locacao',
  nome: 'Contrato de Locação',
  titulo: 'CONTRATO DE LOCAÇÃO',
  campos: [
    { key: 'finalidade', label: 'Finalidade do Imóvel', tipo: 'select', opcoes: ['residencial', 'comercial'], obrigatorio: true },
    { key: 'imovel_endereco', label: 'Endereço do Imóvel', tipo: 'textarea', obrigatorio: true, placeholder: 'Rua, número, bairro, cidade - UF, CEP' },
    { key: 'prazo_meses', label: 'Prazo (em meses)', tipo: 'numero', obrigatorio: true, padrao: 12 },
    { key: 'data_inicio', label: 'Data de Início', tipo: 'data', obrigatorio: true },
    { key: 'data_fim', label: 'Data de Término', tipo: 'data', obrigatorio: true },
    { key: 'valor_aluguel', label: 'Valor do Aluguel Mensal (R$)', tipo: 'moeda', obrigatorio: true },
    { key: 'dia_vencimento', label: 'Dia de Vencimento', tipo: 'numero', padrao: 10 },
    { key: 'taxa_reajuste', label: 'Taxa de Reajuste (%)', tipo: 'numero', padrao: 0 },
    { key: 'periodo_reajuste', label: 'Periodicidade do Reajuste', tipo: 'select', opcoes: ['semestral', 'anual'], padrao: 'anual' },
    { key: 'aviso_previo_dias', label: 'Aviso Prévio para Desocupação (dias)', tipo: 'numero', padrao: 30 },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  partes: [
    {
      key: 'locadores',
      label: 'Locador(es)',
      labelSingular: 'Locador',
      minimo: 1,
      camposPessoa: [
        { key: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { key: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
        { key: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
        { key: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
        { key: 'rg', label: 'RG', tipo: 'texto' },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
      ],
    },
    {
      key: 'locatarios',
      label: 'Locatário(s)',
      labelSingular: 'Locatário',
      minimo: 1,
      camposPessoa: [
        { key: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { key: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
        { key: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
        { key: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
        { key: 'rg', label: 'RG', tipo: 'texto' },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
      ],
    },
  ],
  gerarClausulas(dados) {
    const locadores = pessoas(dados, 'locadores')
    const locatarios = pessoas(dados, 'locatarios')
    const valor = numero(dados, 'valor_aluguel')
    const taxa = numero(dados, 'taxa_reajuste')
    const clausulas: string[] = []

    locadores.forEach((p, i) => {
      clausulas.push(`${locadores.length > 1 ? `LOCADOR ${i + 1}` : 'LOCADOR'}: ${qualificacaoPessoa(p)}.`)
    })
    locatarios.forEach((p, i) => {
      clausulas.push(`${locatarios.length > 1 ? `LOCATÁRIO ${i + 1}` : 'LOCATÁRIO'}: ${qualificacaoPessoa(p)}.`)
    })

    clausulas.push(
      `CLÁUSULA PRIMEIRA: O(A) LOCADOR(A) dá em locação, para fins ${texto(dados, 'finalidade', 'residenciais')}, o imóvel situado em ${texto(dados, 'imovel_endereco')}.`
    )
    clausulas.push(
      `CLÁUSULA SEGUNDA: O prazo da locação é de ${texto(dados, 'prazo_meses')} meses, iniciando em ${dataFmt(dados, 'data_inicio')} e terminando em ${dataFmt(dados, 'data_fim')}.`
    )
    clausulas.push(
      `§ 1º. Terminado o prazo inicialmente convencionado e não havendo qualquer manifestação das partes, a locação será prorrogada por tempo indeterminado, podendo ser denunciada por qualquer das partes a qualquer tempo, com aviso prévio de ${texto(dados, 'aviso_previo_dias', '30')} dias para a desocupação do imóvel.`
    )
    clausulas.push(
      `§ 2º. Caso o(a) LOCATÁRIO(A) não conceda o aviso prévio na desocupação do imóvel, ficará obrigado(a) a pagar, a título de multa, o valor de um mês de aluguel.`
    )

    let clausulaTerceira = `CLÁUSULA TERCEIRA: O aluguel mensal convencionado é de ${formatMoeda(valor)}, a ser pago pelo(a) LOCATÁRIO(A) até o dia ${texto(dados, 'dia_vencimento', '10')} de cada mês, diretamente ao(à) LOCADOR(A) ou mediante depósito em conta bancária por ele(a) indicada.`
    if (taxa > 0) {
      clausulaTerceira += ` O valor do aluguel será reajustado ${texto(dados, 'periodo_reajuste', 'anualmente')}, com taxa fixada em ${taxa}% sobre o valor corrente.`
    }
    clausulas.push(clausulaTerceira)

    clausulas.push(
      `CLÁUSULA QUARTA: O imóvel locado destina-se exclusivamente para fins ${texto(dados, 'finalidade', 'residenciais')}, sendo vedada outra destinação, transferência ou sublocação, total ou parcial, sem o consentimento expresso do(a) LOCADOR(A).`
    )
    clausulas.push(
      `CLÁUSULA QUINTA: O(A) LOCATÁRIO(A) declara ter recebido o imóvel em perfeitas condições de habitabilidade e conservação.`
    )
    clausulas.push(
      `CLÁUSULA SEXTA: O(A) LOCATÁRIO(A) obriga-se a manter o imóvel locado sempre limpo e conservado, restituindo-o, finda a locação, nas mesmas condições em que o recebeu, correndo por sua conta os reparos necessários à sua conservação.`
    )
    clausulas.push(
      `CLÁUSULA SÉTIMA: Os contratantes elegem o foro de ${texto(dados, 'foro_cidade')}, por mais privilegiado que outro possa ser, para dirimir quaisquer dúvidas surgidas do presente contrato.`
    )
    clausulas.push(
      `E por estarem justos e contratados, as partes firmam o presente contrato em duas vias de igual teor, na presença de duas testemunhas.`
    )

    return clausulas
  },
  gerarAssinaturas(dados) {
    return [...pessoas(dados, 'locadores'), ...pessoas(dados, 'locatarios')].map((p) => ({
      nome: String(p.nome || '').toUpperCase(),
      documento: p.cpf ? `CPF: ${p.cpf}` : undefined,
    }))
  },
}
