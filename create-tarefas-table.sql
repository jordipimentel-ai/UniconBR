-- Criar tabela tarefas (se não existir)
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES tipos_processo(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  prazo DATE NOT NULL,
  prioridade VARCHAR(50) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  responsavel_id UUID REFERENCES users(id) ON DELETE SET NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tarefas_processo_id ON tarefas(processo_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente_id ON tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel_id ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON tarefas(prazo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins e o responsável podem ver
CREATE POLICY "tarefas_view" ON tarefas FOR SELECT
  USING (auth.uid() = responsavel_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Política: Apenas admins podem inserir
CREATE POLICY "tarefas_insert" ON tarefas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Política: Apenas admins e o responsável podem atualizar
CREATE POLICY "tarefas_update" ON tarefas FOR UPDATE
  USING (auth.uid() = responsavel_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = responsavel_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Política: Apenas admins podem deletar
CREATE POLICY "tarefas_delete" ON tarefas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
