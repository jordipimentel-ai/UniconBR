-- Lançamentos de receitas avulsas (serviços extra-contratuais, fora dos
-- contratos recorrentes de honorários), para compor o Financeiro junto
-- com as Cobranças.
CREATE TABLE IF NOT EXISTS lancamentos_receita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor NUMERIC(14,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_receita_status ON lancamentos_receita(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_receita_vencimento ON lancamentos_receita(vencimento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_receita_cliente_id ON lancamentos_receita(cliente_id);
