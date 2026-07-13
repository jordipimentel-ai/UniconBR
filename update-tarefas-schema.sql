-- Adicionar colunas à tabela tarefas
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta'));
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS status_tarefa TEXT DEFAULT 'pendente' CHECK (status_tarefa IN ('pendente', 'em_andamento', 'concluida'));

-- Renomear coluna status para status_processo (se existir conflito)
-- A tabela processos tem status, tarefas precisa de status_tarefa para não confundir
