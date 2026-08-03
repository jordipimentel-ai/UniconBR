# 02 — Módulos do Sistema

## Dashboard
Visão geral do escritório.

## Clientes (`app/clientes`)
Cadastro de clientes (pessoa física/jurídica), usado como fonte de dados para
preencher automaticamente contratos (Contratante) e tarefas.

## Tarefas (`app/tarefas`)
Lista de tarefas vinculadas a um processo, com responsável, prazo, prioridade
e status. Campo **Cliente** é opcional e aceita tanto selecionar um cliente já
cadastrado quanto digitar um nome novo (`cliente_nome`, texto livre com
datalist de sugestão) — não existe FK para `clientes`, é só um texto.

## Calendário (`app/calendario`)
Mostra tarefas e eventos recorrentes por dia. Datas são tratadas com
`lib/date-utils.ts` para evitar bug de fuso horário (ver 05).

## Relatórios (`app/relatorios`)
Dois tipos:
- **PGDAS/Recibo do Simples Nacional e Folha de Pagamento**: extração
  automática de dados a partir do PDF que o cliente/contador já tem,
  via `lib/pdf-processor.ts`.
- **Declaração de Faturamento**: modelada no papel timbrado do escritório,
  com tabelas por ano e opção de período (1 ano, 2 anos, últimos 12 meses).

## Meu Escritório (`app/escritorio`)
Perfil do escritório: nome, CNPJ, endereço, cidade, logo e lista de
**Contadores Responsáveis** (múltiplos, pois é sociedade). Esses dados
alimentam relatórios e o contrato de Prestação de Serviços Contábeis via
botão explícito "Usar dados do escritório" — nunca preenchido silenciosamente.

## Contratos (`app/contratos`)
Motor genérico de geração de contratos a partir de modelos de campo
(ver [03 - Motor de Contratos](03-motor-de-contratos.md)). Categorias, nesta ordem:

1. **Imóveis** — Compra e Venda, Locação
2. **Prestação de Serviços** — modelo genérico PJ
3. **Alterações JUCEAL** — Alteração de Empresário Individual (cláusulas
   dinâmicas combináveis), Transformação EI → Sociedade Limitada Unipessoal
   (1 titular), Transformação EI → Sociedade Empresária Limitada (2+ sócios)
4. **Contratos com Clientes** — Prestação de Serviços Contábeis (Contratada
   fixa = Meu Escritório com os 2 contadores na assinatura; Contratante
   selecionável da lista de Clientes)
