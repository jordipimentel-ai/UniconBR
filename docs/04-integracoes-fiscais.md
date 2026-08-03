# 04 — Integrações Fiscais: o que é possível e o que não é

Pergunta recorrente: "dá pra automatizar a busca de dados fiscais dos
clientes?". Resposta curta: depende da fonte.

## ❌ Portal do Contribuinte SEFAZ-AL (scraping com login/senha do cliente)

**Não deve ser feito.** Mesmo tendo login e senha de cada cliente:

- O portal não expõe uma API pública/documentada — seria automação de login
  (scraping autenticado) num site de terceiro.
- Esbarra em: termos de uso do próprio portal, LGPD (armazenar/processar
  credenciais de terceiros exige base legal e segurança que um scraper não
  garante), e no princípio de nunca inserir credenciais em fluxos
  automatizados.
- Frágil na prática: qualquer mudança no site (captcha, 2FA, layout) quebra
  a automação sem aviso.

Se a necessidade é só **consultar informação pontual**, o caminho é acessar o
portal manualmente ou usar os webservices oficiais de SPED/NFe da SEFAZ, que
existem para contadores credenciados.

## ✅ Integra Contador (Receita Federal) — caminho correto

A Receita Federal disponibiliza **APIs oficiais e homologadas**, o
**Integra Contador**, pensadas exatamente para escritórios de contabilidade:

- Autenticação via **certificado digital A1** do contador/escritório (ou
  procuração eletrônica do cliente registrada no e-CAC)
- Consultas possíveis: apuração do Simples Nacional (PGDAS-D), extratos,
  parcelamentos, situação fiscal, caixa postal, entre outros
- Uso legítimo, dentro da LGPD e dos termos da Receita — sem scraping,
  sem manuseio bruto de senha

### Pré-requisitos para integrar (a levantar quando formos implementar)

1. Certificado digital A1 do escritório instalado em formato que a API aceite
   (arquivo `.pfx`/`.p12` + senha, geralmente com armazenamento seguro tipo
   HSM ou serviço de assinatura em nuvem)
2. Credenciamento no **Integra Contador** via Portal do Desenvolvedor da
   Receita Federal (`https://apinf.receita.economia.gov.br` ou sucessor)
3. Procuração eletrônica de cada cliente autorizando o escritório a consultar
   os dados dele
4. Definir escopo inicial: só consulta de PGDAS/parcelamentos, ou também
   emissão de guias/declarações?

Quando o usuário quiser avançar nisso, o próximo passo é pesquisar a
documentação atual do Integra Contador (a API muda de tempos em tempos) antes
de desenhar a integração.
