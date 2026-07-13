-- Adicionar coluna de avatar se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criar tabela de permissões
CREATE TABLE IF NOT EXISTS permissoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de user_permissoes
CREATE TABLE IF NOT EXISTS user_permissoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permissao_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissoes_user_id ON user_permissoes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissoes_permissao_id ON user_permissoes(permissao_id);

-- Inserir permissões padrão
INSERT INTO permissoes (nome, descricao) VALUES
  ('gerenciar_clientes', 'Pode criar, editar e deletar clientes'),
  ('gerenciar_processos', 'Pode criar, editar e deletar processos'),
  ('gerenciar_tarefas', 'Pode criar, editar e deletar tarefas'),
  ('gerenciar_usuarios', 'Pode criar, editar e deletar usuários'),
  ('gerenciar_permissoes', 'Pode gerenciar permissões de usuários'),
  ('visualizar_relatorios', 'Pode visualizar relatórios'),
  ('gerenciar_documentos', 'Pode fazer upload e deletar documentos')
ON CONFLICT (nome) DO NOTHING;
