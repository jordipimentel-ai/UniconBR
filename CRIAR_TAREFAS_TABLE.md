# 📋 Criar Tabela TAREFAS no Supabase

## ⚠️ Situação Atual
- Tabela `tarefas` existe, mas **está vazia** (sem colunas)
- Precisa ser criada com a estrutura correta

## ✅ Passo a Passo

### 1️⃣ Acessar Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione projeto **"UniconBR"**
3. Clique em **"SQL Editor"** (menu esquerdo)

### 2️⃣ Executar o SQL abaixo
Cole este SQL **completo** em uma nova query:

```sql
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
```

### 3️⃣ Clicar em "Run"
Você deve ver: ✅ **Migração bem-sucedida**

---

## 📊 Estrutura da Tabela TAREFAS

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **id** | UUID | ✅ | ID único (gerado automaticamente) |
| **processo_id** | UUID | ✅ | Relação com tipos_processo |
| **cliente_id** | UUID | ✅ | Relação com clientes |
| **descricao** | TEXT | ✅ | Descrição da tarefa |
| **prazo** | DATE | ✅ | Data limite |
| **prioridade** | VARCHAR | ✅ | baixa / media / alta |
| **status** | VARCHAR | ✅ | pendente / em_andamento / concluida |
| **responsavel_id** | UUID | ❌ | User responsável |
| **criado_em** | TIMESTAMP | ✅ | Data criação (automático) |
| **atualizado_em** | TIMESTAMP | ✅ | Data atualização (automático) |

---

## 📋 Valores Válidos

### Prioridade
- `baixa` 🟢
- `media` 🟡
- `alta` 🔴

### Status
- `pendente` ⚪
- `em_andamento` 🔵
- `concluida` ✅

---

## 🚀 Após Executar o SQL

1. Recarregue a página do aplicativo (Ctrl+Shift+R)
2. A página `/tarefas` será atualizada
3. Crie uma nova tarefa
4. Os campos de Prioridade e Status funcionarão! ✨

---

## ❓ Dúvidas?

Se houver erro ao executar:
1. Verifique se as tabelas `tipos_processo`, `clientes` e `users` existem
2. Se não existirem, crie elas primeiro
3. Tente novamente
