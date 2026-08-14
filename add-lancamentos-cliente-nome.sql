-- Permite lançar receita para um cliente digitado livremente (que ainda
-- não está cadastrado), sem depender só do cliente_id vinculado.
ALTER TABLE lancamentos_receita ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
