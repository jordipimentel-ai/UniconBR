# Base de Conhecimento — UniConBR

Esta pasta é a documentação viva do sistema UniConBR (sistema de gestão do
escritório JR Contabilidade e Consultoria). A ideia é que ela sirva de
referência rápida — tanto para você quanto para mim (Claude) — sem precisar
reconstruir contexto do zero a cada conversa.

Pode ser aberta diretamente como um "vault" no Obsidian (ou qualquer editor
Markdown): `Abrir pasta como vault` → aponte para `sistema-contabilidade/docs`.

## Índice

- [01 - Visão Geral](01-visao-geral.md) — o que é o sistema, stack técnica, como está hospedado
- [02 - Módulos do Sistema](02-modulos.md) — o que cada tela faz
- [03 - Motor de Contratos](03-motor-de-contratos.md) — como o gerador de contratos funciona por dentro
- [04 - Integrações Fiscais](04-integracoes-fiscais.md) — o que é possível (e o que não é) integrar com SEFAZ/Receita Federal
- [05 - Decisões Técnicas e Armadilhas](05-decisoes-tecnicas.md) — bugs resolvidos e por quê, para não repetir

## Como manter atualizado

Sempre que fechar uma funcionalidade grande ou resolver um bug não-óbvio,
vale pedir: **"Claude, atualiza a documentação em docs/ com o que a gente
acabou de fazer"**. Eu edito o arquivo relevante em vez de duplicar conteúdo.
