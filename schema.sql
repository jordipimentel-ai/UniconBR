-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela: users (admin e colaboradores)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'colaborador')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Tabela: clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_razao_social TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE NOT NULL,
  email TEXT,
  telefone TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('PF', 'PJ')),
  regime_tributario TEXT CHECK (regime_tributario IN ('Simples', 'Lucro Presumido', 'Lucro Real')),
  segmento TEXT,
  em_funcionamento BOOLEAN DEFAULT true,
  representante TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_tipo ON clientes(tipo);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);

-- 3. Tabela: tipos_processo
CREATE TABLE tipos_processo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela: processos
CREATE TABLE processos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_processo_id UUID NOT NULL REFERENCES tipos_processo(id),
  status TEXT NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Recebido', 'Em andamento', 'Aguardando documentação', 'Aguardando órgão externo', 'Em revisão', 'Concluído', 'Cancelado')),
  prazo DATE,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_processos_cliente_id ON processos(cliente_id);
CREATE INDEX idx_processos_tipo_processo_id ON processos(tipo_processo_id);
CREATE INDEX idx_processos_status ON processos(status);
CREATE INDEX idx_processos_prazo ON processos(prazo);

-- 5. Tabela: processo_colaboradores (víncula múltiplos colaboradores a um processo)
CREATE TABLE processo_colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(processo_id, user_id)
);

CREATE INDEX idx_processo_colaboradores_processo_id ON processo_colaboradores(processo_id);
CREATE INDEX idx_processo_colaboradores_user_id ON processo_colaboradores(user_id);

-- 6. Tabela: tarefas
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em andamento', 'concluida')),
  prazo DATE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tarefas_processo_id ON tarefas(processo_id);
CREATE INDEX idx_tarefas_user_id ON tarefas(user_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);

-- 7. Tabela: documentos
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documentos_processo_id ON documentos(processo_id);

-- 8. Tabela: atividades
CREATE TABLE atividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  descricao TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_atividades_processo_id ON atividades(processo_id);
CREATE INDEX idx_atividades_user_id ON atividades(user_id);

-- Triggers para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_clientes_updated_at BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_processos_updated_at BEFORE UPDATE ON processos
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_tarefas_updated_at BEFORE UPDATE ON tarefas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
