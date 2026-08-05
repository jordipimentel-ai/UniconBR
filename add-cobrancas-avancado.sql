-- Catálogo de Serviços (submenu "Serviços" dentro de Cobranças)
CREATE TABLE IF NOT EXISTS servicos_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor_padrao NUMERIC(14,2),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contas de recebimento (submenu "Contas" dentro de Cobranças) — caixa, bancos, etc.
CREATE TABLE IF NOT EXISTS contas_recebimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Banco' CHECK (tipo IN ('Caixa', 'Banco')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campos novos do contrato ativo de cobrança, para acompanhar o formulário
-- completo (número do contrato, recorrência, item/serviço, desconto, etc.)
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS numero_contrato TEXT;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS dia_geracao INTEGER NOT NULL DEFAULT 1 CHECK (dia_geracao BETWEEN 1 AND 28);
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS categoria_financeira TEXT;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES servicos_cobranca(id) ON DELETE SET NULL;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS itens_valor NUMERIC(14,2);
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS desconto_tipo TEXT DEFAULT 'valor' CHECK (desconto_tipo IN ('valor', 'percentual'));
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(14,2) DEFAULT 0;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS conta_recebimento_id UUID REFERENCES contas_recebimento(id) ON DELETE SET NULL;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS recorrencia_intervalo INTEGER NOT NULL DEFAULT 1;
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS recorrencia_unidade TEXT NOT NULL DEFAULT 'mes' CHECK (recorrencia_unidade IN ('mes', 'ano'));
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS termino_tipo TEXT NOT NULL DEFAULT 'indeterminado' CHECK (termino_tipo IN ('periodo', 'indeterminado'));
ALTER TABLE contratos_ativos ADD COLUMN IF NOT EXISTS data_termino DATE;

CREATE INDEX IF NOT EXISTS idx_contratos_ativos_servico_id ON contratos_ativos(servico_id);
CREATE INDEX IF NOT EXISTS idx_contratos_ativos_conta_recebimento_id ON contratos_ativos(conta_recebimento_id);
