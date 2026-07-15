-- Adicionar coluna user_id à tabela processos se não existir
ALTER TABLE processos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_processos_user_id ON processos(user_id);

-- Se houver referências a colunas que não existem, isso ajudará a diagnosticar
-- Execute este comando para ver a estrutura atual:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'processos';
