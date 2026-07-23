import { ContratoTemplate, texto, numero, dataFmt, formatMoeda, pessoas, qualificacaoPessoa } from './types'

export const compraVendaTemplate: ContratoTemplate = {
  id: 'compra_venda',
  categoria: 'compra_venda',
  nome: 'Contrato de Compra e Venda de Imóvel',
  titulo: 'CONTRATO DE COMPRA E VENDA DE IMÓVEL',
  campos: [
    { key: 'tipo_imovel', label: 'Tipo de Imóvel', tipo: 'select', opcoes: ['Casa (Urbano)', 'Terreno (Urbano)', 'Comercial (Urbano)', 'Rural'], obrigatorio: true },
    { key: 'imovel_descricao', label: 'Descrição do Imóvel', tipo: 'textarea', obrigatorio: true, placeholder: 'Medidas, área total (m² ou hectares), características' },
    { key: 'imovel_endereco', label: 'Endereço / Localização do Imóvel', tipo: 'textarea', obrigatorio: true, placeholder: 'Bairro/zona rural, município, endereço, CEP' },
    { key: 'matricula', label: 'Matrícula do Imóvel (opcional)', tipo: 'texto' },
    { key: 'valor_total', label: 'Valor Total (R$)', tipo: 'moeda', obrigatorio: true },
    { key: 'forma_pagamento', label: 'Forma de Pagamento', tipo: 'select', opcoes: ['À vista', 'Parcelado'], padrao: 'À vista' },
    { key: 'condicoes_pagamento', label: 'Condições de Pagamento (se parcelado)', tipo: 'textarea' },
    { key: 'data_pagamento', label: 'Data do Pagamento/Quitação', tipo: 'data' },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', tipo: 'data', obrigatorio: true },
  ],
  partes: [
    {
      key: 'vendedores',
      label: 'Vendedor(es)',
      labelSingular: 'Vendedor',
      minimo: 1,
      camposPessoa: [
        { key: 'nome', label: 'Nome Completo', tipo: 'texto', obrigatorio: true },
        { key: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto', padrao: 'brasileiro(a)' },
        { key: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
        { key: 'cpf', label: 'CPF', tipo: 'texto', obrigatorio: true },
        { key: 'endereco', label: 'Endereço', tipo: 'textarea' },
      ],
    },
    {
      key: 'compradores',
      label: 'Comprador(es)',
      labelSingular: 'Comprador',
      minimo: 1,
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
    const vendedores = pessoas(dados, 'vendedores')
    const compradores = pessoas(dados, 'compradores')
    const valor = numero(dados, 'valor_total')
    const tipoImovel = texto(dados, 'tipo_imovel', 'imóvel')
    const clausulas: string[] = []

    vendedores.forEach((p, i) => {
      clausulas.push(`${vendedores.length > 1 ? `VENDEDOR ${i + 1}` : 'VENDEDOR'}: ${qualificacaoPessoa(p)}.`)
    })
    compradores.forEach((p, i) => {
      clausulas.push(`${compradores.length > 1 ? `COMPRADOR ${i + 1}` : 'COMPRADOR'}: ${qualificacaoPessoa(p)}.`)
    })

    clausulas.push(
      `As partes qualificadas acima firmam entre si, de forma justa e acertada, o presente instrumento particular de Compra e Venda de Imóvel ${tipoImovel}, mediante as cláusulas e condições a seguir.`
    )
    clausulas.push(
      `CLÁUSULA PRIMEIRA - DO OBJETO: O(A/S) VENDEDOR(A/ES) é(são) legítimo(a/os) proprietário(a/os) do seguinte imóvel: ${texto(dados, 'imovel_descricao')}, localizado em ${texto(dados, 'imovel_endereco')}${texto(dados, 'matricula') ? `, matrícula nº ${texto(dados, 'matricula')}` : ''}.`
    )
    clausulas.push(
      `CLÁUSULA SEGUNDA - DO PREÇO: O(A/S) VENDEDOR(A/ES) resolve(m) vender o imóvel acima descrito, livre de qualquer ônus ou vício, pelo valor de ${formatMoeda(valor)}, que o(a/s) COMPRADOR(A/ES) paga(m) neste ato ou na forma estipulada na cláusula seguinte.`
    )

    const formaPagamento = texto(dados, 'forma_pagamento', 'À vista')
    let clausulaPagamento = `CLÁUSULA TERCEIRA - DO PAGAMENTO: O pagamento será realizado ${formaPagamento === 'À vista' ? 'à vista' : 'de forma parcelada'}`
    if (formaPagamento !== 'À vista' && texto(dados, 'condicoes_pagamento')) {
      clausulaPagamento += `, nas seguintes condições: ${texto(dados, 'condicoes_pagamento')}`
    }
    if (texto(dados, 'data_pagamento')) {
      clausulaPagamento += `. O(A/S) VENDEDOR(A/ES) declara(m) ter recebido o valor combinado em ${dataFmt(dados, 'data_pagamento')}`
    }
    clausulaPagamento += '.'
    clausulas.push(clausulaPagamento)

    clausulas.push(
      `CLÁUSULA QUARTA - DAS OBRIGAÇÕES: O(A/S) VENDEDOR(A/ES) obriga(m)-se a transferir o domínio pleno do imóvel ao(à/s) COMPRADOR(A/ES). Será de responsabilidade do(a/s) VENDEDOR(A/ES) o pagamento de impostos, taxas e despesas incidentes sobre o imóvel até a data da efetiva entrega, passando essa responsabilidade ao(à/s) COMPRADOR(A/ES) a partir de então. Correrão por conta do(a/s) COMPRADOR(A/ES) as despesas com escritura e registro do imóvel.`
    )
    clausulas.push(
      `CLÁUSULA QUINTA - DO FORO: As partes elegem o foro da comarca de ${texto(dados, 'foro_cidade')} para dirimir quaisquer controvérsias oriundas deste contrato.`
    )
    clausulas.push(
      `CLÁUSULA SEXTA - DAS CONDIÇÕES GERAIS: Este contrato passa a valer a partir da assinatura pelas partes, obrigando-se a ele os herdeiros e sucessores.`
    )
    clausulas.push(
      `Por estarem assim justos e contratados, assinam este documento em duas vias de igual teor, juntamente com duas testemunhas.`
    )

    return clausulas
  },
  gerarAssinaturas(dados) {
    return [...pessoas(dados, 'vendedores'), ...pessoas(dados, 'compradores')].map((p) => ({
      nome: String(p.nome || '').toUpperCase(),
      documento: p.cpf ? `CPF: ${p.cpf}` : undefined,
    }))
  },
}
