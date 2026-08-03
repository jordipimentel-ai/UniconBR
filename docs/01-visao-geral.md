# 01 — Visão Geral

## O que é

UniConBR é o sistema de gestão interno da **JR Contabilidade e Consultoria**
(sociedade com 2 contadores responsáveis). Centraliza:

- Cadastro de clientes
- Processos e tarefas do escritório
- Calendário de prazos
- Geração de relatórios (PGDAS/Recibo, Declaração de Faturamento, folha)
- Geração de contratos (imóveis, prestação de serviços, alterações JUCEAL,
  contrato de prestação de serviços contábeis com clientes)
- Perfil do escritório ("Meu Escritório": dados, logo, contadores responsáveis)

## Stack técnica

- **Frontend/Backend**: Next.js 16 (App Router), React, Tailwind CSS v4
- **Banco de dados / Auth**: Supabase (Postgres + Auth + Storage)
- **PDF**: `html2canvas-pro` + `jsPDF` (`lib/pdf-export.ts`)
- **Leitura de PDF** (PGDAS, folha): `pdfjs-dist` + regex custom (`lib/pdf-processor.ts`)
- **Deploy**: Vercel, auto-deploy a cada push na branch `main`
- **Repositório**: `jordipimentel-ai/UniconBR` no GitHub

## Como o trabalho acontece

- Claude não tem login no app publicado nem acesso ao painel do Vercel/Supabase
  — mudanças de schema (SQL) precisam ser rodadas manualmente por você no
  SQL Editor do Supabase, e o status do deploy no Vercel precisa ser
  confirmado por você.
- Antes de qualquer commit, o padrão é: `rm -rf .next && npm run build` +
  `npx tsc --noEmit -p .` para garantir que nada quebrou.
- Verificação visual de funcionalidades novas é feita com uma rota temporária
  (`app/preview-temp-*/page.tsx`, sempre apagada antes do commit) + o preview
  do navegador embutido.
