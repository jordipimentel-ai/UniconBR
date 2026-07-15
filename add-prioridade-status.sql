-- Adicionar colunas prioridade e status_tarefa à tabela processos
ALTER TABLE processos
ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media',
ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);
CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);
