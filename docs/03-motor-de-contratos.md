# 03 — Motor de Contratos

Local: `lib/contratos/` (lógica) + `components/ContratoForm.tsx` (formulário
genérico) + `components/ContratoPreview.tsx` (renderização/impressão em PDF).

## Ideia central

Cada tipo de contrato é um `ContratoTemplate` (`lib/contratos/types.ts`) que
descreve **o que perguntar** e **como gerar o texto**. O formulário e a
pré-visualização são genéricos — não sabem nada sobre "Compra e Venda" ou
"JUCEAL" especificamente, só sabem renderizar a estrutura do template.

```ts
interface ContratoTemplate {
  id: string
  categoria: string
  nome: string
  titulo: string
  campos: CampoSchema[]              // campos únicos do contrato
  partes?: GrupoRepetivel[]          // grupos de pessoas repetíveis (vendedor, comprador...)
  clausulasDinamicas?: GrupoClausulasDinamicas[]  // cláusulas que o usuário adiciona uma a uma
  gerarClausulas: (dados) => string[]
  gerarAssinaturas: (dados) => { nome; documento? }[]
}
```

## Peças do sistema

- **`campos`**: campos soltos do contrato (valor, datas, endereço do imóvel,
  etc.). Suportam `icone` (emoji exibido antes do label) e tipo `moeda`
  (campo com máscara de R$ em tempo real, ver `ContratoForm.tsx`).
- **`partes` (GrupoRepetivel)**: grupos de pessoas que se repetem (ex.:
  Vendedor(es), Comprador(es), Sócios). Tem `minimo`/`maximo` de itens.
- **`clausulasDinamicas`**: para contratos onde o usuário vai adicionando
  cláusulas de tipos diferentes livremente (ex.: Alteração de Empresário
  Individual — pode combinar alteração de razão social + endereço + capital
  num único instrumento, cada uma com seus próprios campos).

## Concordância singular/plural

Contratos com múltiplas partes (ex.: 2 vendedores) precisam concordar o texto
no plural. Use o helper `concordar(qtd, singular, plural)` de
`lib/contratos/types.ts` em vez de notação tipo `(A/S)` — deixa o texto
juridicamente mais limpo e profissional. Ver `compraVenda.ts` como referência.

## Dados do escritório / cliente

- `ContratoForm` carrega `getEscritorio()` e mostra um botão "Usar dados do
  escritório" para o grupo de partes com `key === 'contratada'` — nunca
  preenche sozinho.
- Recebe `clientesDisponiveis` como prop; para o grupo `key === 'contratante'`
  mostra um seletor de cliente cadastrado que preenche nome/CNPJ.
- No contrato de Prestação de Serviços Contábeis, a Contratada nem aparece no
  formulário genérico: é injetada programaticamente em `app/contratos/page.tsx`
  a partir de `getEscritorio()` (bloqueando com erro se não houver perfil/
  contador cadastrado).

## Adicionando um novo tipo de contrato

1. Criar `lib/contratos/nomeDoContrato.ts` exportando um `ContratoTemplate`.
2. Registrar em `lib/contratos/index.ts` dentro da categoria certa em `CATEGORIAS`.
3. Nada mais precisa mudar em `ContratoForm`/`ContratoPreview` — eles já
   sabem renderizar qualquer combinação de `campos`/`partes`/`clausulasDinamicas`.
