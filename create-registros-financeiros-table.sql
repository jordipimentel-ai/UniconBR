-- Histórico financeiro mensal por cliente: faturamento, pagamento de
-- folha e notas de compra. Um registro por cliente por mês.
CREATE TABLE IF NOT EXISTS registros_financeiros_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL, -- sempre o dia 1 do mês, ex: 2026-07-01
  faturamento NUMERIC(14,2),
  folha_paga BOOLEAN DEFAULT false,
  folha_valor NUMERIC(14,2),
  notas_compra_quantidade INTEGER,
  notas_compra_valor NUMERIC(14,2),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cliente_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_registros_financeiros_cliente_id ON registros_financeiros_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_registros_financeiros_mes ON registros_financeiros_clientes(mes_referencia);
