import { ContratoTemplate, texto, numero, dataFmt, formatMoeda, pessoas, qualificacaoPessoa, concordar } from './types'

export const compraVendaTemplate: ContratoTemplate = {
  id: 'compra_venda',
  categoria: 'compra_venda',
  nome: 'Contrato de Compra e Venda de Imóvel',
  titulo: 'CONTRATO DE COMPRA E VENDA DE IMÓVEL',
  campos: [
    { key: 'tipo_imovel', label: 'Tipo de Imóvel', icone: '🏠', tipo: 'select', opcoes: ['Casa (Urbano)', 'Terreno (Urbano)', 'Comercial (Urbano)', 'Rural'], obrigatorio: true },
    { key: 'medida_frente', label: 'Medida de Frente', icone: '↔️', tipo: 'texto', placeholder: 'Ex.: 6m' },
    { key: 'medida_fundo', label: 'Medida de Fundo', icone: '↕️', tipo: 'texto', placeholder: 'Ex.: 6m' },
    { key: 'medida_lateral_esquerda', label: 'Lateral Esquerda', icone: '⬅️', tipo: 'texto', placeholder: 'Ex.: 20m' },
    { key: 'medida_lateral_direita', label: 'Lateral Direita', icone: '➡️', tipo: 'texto', placeholder: 'Ex.: 20m' },
    { key: 'area_total', label: 'Área Total (m² ou hectares)', icone: '📐', tipo: 'texto', placeholder: 'Ex.: 120m²' },
    { key: 'imovel_caracteristicas', label: 'Características do Imóvel', icone: '📝', tipo: 'textarea', obrigatorio: true, placeholder: 'Ex.: casa de alvenaria, 3 quartos, garagem para 2 carros...' },
    { key: 'imovel_endereco', label: 'Endereço / Localização do Imóvel', icone: '📍', tipo: 'textarea', obrigatorio: true, placeholder: 'Bairro/zona rural, município, endereço, CEP' },
    { key: 'matricula', label: 'Matrícula do Imóvel (opcional)', icone: '📄', tipo: 'texto' },
    { key: 'valor_total', label: 'Valor Total', icone: '💰', tipo: 'moeda', obrigatorio: true },
    { key: 'forma_pagamento', label: 'Forma de Pagamento', icone: '💳', tipo: 'select', opcoes: ['À vista', 'Parcelado'], padrao: 'À vista' },
    { key: 'condicoes_pagamento', label: 'Condições de Pagamento (se parcelado)', icone: '📋', tipo: 'textarea' },
    { key: 'clausula_extra', label: 'Condição Especial / Parágrafo Único (opcional)', icone: '📌', tipo: 'textarea', placeholder: 'Descreva alguma condição adicional específica deste negócio, se houver' },
    { key: 'data_pagamento', label: 'Data do Pagamento/Quitação', icone: '📅', tipo: 'data' },
    { key: 'foro_cidade', label: 'Foro (Cidade/Comarca)', icone: '⚖️', tipo: 'texto', obrigatorio: true },
    { key: 'cidade', label: 'Cidade (assinatura)', icone: '🏙️', tipo: 'texto', obrigatorio: true },
    { key: 'data_assinatura', label: 'Data de Assinatura', icone: '📅', tipo: 'data', obrigatorio: true },
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

    // Referências com concordância correta de número (singular x plural)
    const vRef = concordar(vendedores.length, 'O(A) VENDEDOR(A)', 'OS(AS) VENDEDORES(AS)')
    const cRef = concordar(compradores.length, 'O(A) COMPRADOR(A)', 'OS(AS) COMPRADORES(AS)')
    const vSer = concordar(vendedores.length, 'é', 'são')
    const vProprietario = concordar(vendedores.length, 'legítimo(a) proprietário(a)', 'legítimos(as) proprietários(as)')
    const vResolve = concordar(vendedores.length, 'resolve', 'resolvem')
    const cPaga = concordar(compradores.length, 'paga', 'pagam')
    const vDeclara = concordar(vendedores.length, 'declara', 'declaram')
    const vObriga = concordar(vendedores.length, 'obriga-se', 'obrigam-se')
    const vDo = concordar(vendedores.length, 'do(a) VENDEDOR(A)', 'dos(as) VENDEDORES(AS)')
    const cAo = concordar(compradores.length, 'ao(à) COMPRADOR(A)', 'aos(às) COMPRADORES(AS)')

    vendedores.forEach((p, i) => {
      clausulas.push(`${vendedores.length > 1 ? `VENDEDOR ${i + 1}` : 'VENDEDOR'}: ${qualificacaoPessoa(p)}.`)
    })
    compradores.forEach((p, i) => {
      clausulas.push(`${compradores.length > 1 ? `COMPRADOR ${i + 1}` : 'COMPRADOR'}: ${qualificacaoPessoa(p)}.`)
    })

    clausulas.push(
      `As partes qualificadas acima firmam entre si, de forma justa e acertada, o presente instrumento particular de Compra e Venda de Imóvel ${tipoImovel}, mediante as cláusulas e condições a seguir.`
    )

    // Monta a descrição do imóvel combinando medidas, área e características
    const medidas: string[] = []
    if (texto(dados, 'medida_frente')) medidas.push(`${texto(dados, 'medida_frente')} de frente`)
    if (texto(dados, 'medida_fundo')) medidas.push(`${texto(dados, 'medida_fundo')} de fundo`)
    if (texto(dados, 'medida_lateral_esquerda')) medidas.push(`${texto(dados, 'medida_lateral_esquerda')} no lado esquerdo`)
    if (texto(dados, 'medida_lateral_direita')) medidas.push(`${texto(dados, 'medida_lateral_direita')} no lado direito`)

    let descricaoImovel = ''
    if (medidas.length > 0) descricaoImovel += `medindo ${medidas.join(', ')}`
    if (texto(dados, 'area_total')) descricaoImovel += `${descricaoImovel ? ', perfazendo' : 'com'} área total de ${texto(dados, 'area_total')}`
    if (descricaoImovel) descricaoImovel += ', '
    descricaoImovel += `apresentando as seguintes características: ${texto(dados, 'imovel_caracteristicas')}`

    clausulas.push(
      `CLÁUSULA PRIMEIRA - DO OBJETO: ${vRef} ${vSer} ${vProprietario} do seguinte imóvel: ${descricaoImovel}, localizado em ${texto(dados, 'imovel_endereco')}${texto(dados, 'matricula') ? `, matrícula nº ${texto(dados, 'matricula')}` : ''}.`
    )
    clausulas.push(
      `CLÁUSULA SEGUNDA - DO PREÇO: ${vRef} ${vResolve} vender o imóvel acima descrito, livre de qualquer ônus, dívida ou vício, pelo valor certo e ajustado de ${formatMoeda(valor)}, que ${cRef} ${cPaga} nesta data ou na forma estipulada na cláusula seguinte.`
    )

    const formaPagamento = texto(dados, 'forma_pagamento', 'À vista')
    let clausulaPagamento = `CLÁUSULA TERCEIRA - DO PAGAMENTO: O pagamento será realizado ${formaPagamento === 'À vista' ? 'à vista' : 'de forma parcelada'}`
    if (formaPagamento !== 'À vista' && texto(dados, 'condicoes_pagamento')) {
      clausulaPagamento += `, nas seguintes condições: ${texto(dados, 'condicoes_pagamento')}`
    }
    if (texto(dados, 'data_pagamento')) {
      clausulaPagamento += `. ${vRef} ${vDeclara} ter recebido o valor combinado em ${dataFmt(dados, 'data_pagamento')}`
    }
    clausulaPagamento += '.'
    clausulas.push(clausulaPagamento)

    if (texto(dados, 'clausula_extra')) {
      clausulas.push(`PARÁGRAFO ÚNICO: ${texto(dados, 'clausula_extra')}`)
    }

    clausulas.push(
      `CLÁUSULA QUARTA - DAS OBRIGAÇÕES: ${vRef} ${vObriga} a transferir o domínio pleno do imóvel ${cAo}. Será de responsabilidade ${vDo} o pagamento de impostos, taxas e despesas incidentes sobre o imóvel até a data da efetiva entrega, passando essa responsabilidade ${cAo} a partir de então. As despesas com escritura e registro do imóvel correrão por conta ${cAo.replace('ao(à)', 'do(a)').replace('aos(às)', 'dos(as)')}.`
    )
    clausulas.push(
      `CLÁUSULA QUINTA - DO FORO: As partes elegem o foro da comarca de ${texto(dados, 'foro_cidade')} para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`
    )
    clausulas.push(
      `CLÁUSULA SEXTA - DAS CONDIÇÕES GERAIS: Este contrato passa a valer a partir da assinatura pelas partes, obrigando a ele os herdeiros e sucessores de ambas.`
    )
    clausulas.push(
      `E, por estarem assim justos e contratados, assinam este instrumento em duas vias de igual teor e forma, juntamente com duas testemunhas.`
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
