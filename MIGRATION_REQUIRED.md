# ⚠️ MIGRAÇÃO NECESSÁRIA

## Problema Identificado
A tabela `processos` no Supabase não possui as colunas `prioridade` e `status_tarefa`.

## ✅ Solução

### Passo 1: Acessar o Supabase SQL Editor
1. Acesse https://supabase.com
2. Faça login com suas credenciais
3. Selecione o projeto "UniconBR"
4. Clique em **SQL Editor** no menu esquerdo

### Passo 2: Executar o SQL abaixo
```sql
-- Adicionar colunas prioridade e status_tarefa
ALTER TABLE processos
ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media',
ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);
CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);
```

### Passo 3: Clicar em "Run"
A migração deve executar em segundos.

### Passo 4: Verificar
Você deve ver uma mensagem: "✅ Migração bem-sucedida"

## 🔍 Diagnóstico Técnico
- Tabela: `processos`
- Colunas faltando: `prioridade`, `status_tarefa`
- Tipo: VARCHAR(50)
- Valores padrão: 'media' e 'pendente'

## 🚀 Após a Migração
Depois de executar o SQL acima:
1. Recarregue a página (Ctrl+Shift+R)
2. Crie uma nova tarefa
3. Preencha os campos de Prioridade e Status
4. A tarefa será salva corretamente
5. Os campos aparecerão na tabela com cores

## 📋 Campos de Prioridade
- 🟢 Baixa
- 🟡 Média (padrão)
- 🔴 Alta

## 📋 Campos de Status Tarefa
- ⚪ Pendente (padrão)
- 🔵 Em andamento
- ✅ Concluída
