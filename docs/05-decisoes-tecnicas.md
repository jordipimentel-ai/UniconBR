# 05 — Decisões Técnicas e Armadilhas (não repetir)

Bugs resolvidos e o motivo real, para evitar cair nos mesmos de novo.

## Regex com flag `g` mata os grupos de captura
`String.match()` com regex global (`/.../g`) só retorna os textos completos
que bateram, nunca os grupos `(...)`. Isso causava relatórios de PGDAS
"zerados" (`match[1]` sempre `undefined`). Corrigido removendo o `g` antes de
montar o regex combinado (`lib/pdf-processor.ts`).

## Espaços irregulares no texto extraído de PDF
`pdfjs-dist` extrai texto com múltiplos espaços entre palavras de forma
inconsistente. Labels de busca precisam usar `\s+` em vez de espaço literal
(`labelToRegexSource()` em `lib/pdf-processor.ts`).

## `html2canvas` + `position: sticky` gera PDFs de 180+ páginas em branco
Quando a página tem um elemento `sticky` (o header do app), `html2canvas`
mede a altura errado. Corrigido passando `width`/`height`/`windowWidth`/
`windowHeight` explícitos para o html2canvas, mais um teto de segurança de
6 páginas (`lib/pdf-export.ts`).

## Tailwind v4 usa `oklch` por padrão — quebra o jsPDF/html2canvas clássico
Troca de `html2canvas` para `html2canvas-pro`, que suporta `oklch`.

## RLS do Supabase: tabela e bucket de storage são políticas separadas
Ter a chave de service-role nos meus scripts de diagnóstico sempre bypassa
RLS — ou seja, um teste meu "funcionando" não prova que o app funciona para
o usuário autenticado real. Sempre validar com a mesma chave `anon` que o
navegador usa. Precisou de políticas separadas para `storage.objects` (bucket
de logo) e para a tabela `escritorio` (chegou a ser mais simples desabilitar
RLS nela).

## `id` sem `DEFAULT gen_random_uuid()` aplicado de fato
Erro "null value in column id" na tabela `escritorio` mesmo com
`CREATE TABLE ... DEFAULT gen_random_uuid()` no schema — o `IF NOT EXISTS`
pode ter preservado uma definição antiga da tabela. Corrigido com
`ALTER TABLE escritorio ALTER COLUMN id SET DEFAULT gen_random_uuid();` +
defensivamente destruturar `id` fora do payload antes do insert
(`const { id, ...resto } = dados`) em `lib/escritorio.ts`.

## Datas: sempre usar `lib/date-utils.ts`
`new Date('2026-01-31')` em JS interpreta como UTC meia-noite, o que em
fusos negativos (Brasil) volta um dia — causava eventos recorrentes
sumirem no dia 1 e no dia 31. Todo parsing/formatação de data do sistema
passa por `parseDataLocal`/`formatDataLocal`/`formatDataPorExtenso`.

## `tarefas.cliente_id` nunca existiu de verdade
O formulário de Nova Tarefa exigia selecionar um cliente (`cliente_id`), mas
a coluna nunca foi criada no banco nem a tela de edição mostrava esse campo —
era validação para um campo que nunca persistia. Substituído por
`cliente_nome` (texto livre + datalist de sugestão, opcional), com fallback
de insert sem a coluna caso a migração ainda não tenha sido rodada.

## Nenhum acesso direto a Postgres / `exec_sql`
Toda alteração de schema (novas colunas, políticas RLS) precisa ser rodada
manualmente pelo usuário no SQL Editor do Supabase — não existe RPC de
execução livre de SQL nem connection string disponível para Claude.
