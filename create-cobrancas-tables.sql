-- Módulo de Cobranças: contratos ativos de honorários mensais por cliente
-- e as cobranças (uma por mês/competência) geradas a partir deles.

CREATE TABLE IF NOT EXISTS contratos_ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT 'Honorários Contábeis Mensais',
  valor_mensal NUMERIC(14,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 28),
  data_inicio DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_ativo_id UUID NOT NULL REFERENCES contratos_ativos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  competencia DATE NOT NULL, -- sempre dia 1 do mês a que a cobrança se refere
  valor NUMERIC(14,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (contrato_ativo_id, competencia)
);

CREATE INDEX IF NOT EXISTS idx_contratos_ativos_cliente_id ON contratos_ativos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente_id ON cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_contrato_ativo_id ON cobrancas(contrato_ativo_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_competencia ON cobrancas(competencia);
