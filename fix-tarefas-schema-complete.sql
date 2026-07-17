-- ============================================
-- SCRIPT COMPLETO PARA CORRIGIR TABELA TAREFAS
-- ============================================

-- 1. Dropar tabela antiga se existir (CUIDADO!)
DROP TABLE IF EXISTS tarefas CASCADE;

-- 2. Criar tabela tarefas com a estrutura CORRETA
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES tipos_processo(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  prazo DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  prioridade VARCHAR(50) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_tarefas_processo_id ON tarefas(processo_id);
CREATE INDEX idx_tarefas_user_id ON tarefas(user_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX idx_tarefas_prazo ON tarefas(prazo);

-- 4. Habilitar RLS
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY "tarefas_view" ON tarefas FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "tarefas_insert" ON tarefas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "tarefas_update" ON tarefas FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "tarefas_delete" ON tarefas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
