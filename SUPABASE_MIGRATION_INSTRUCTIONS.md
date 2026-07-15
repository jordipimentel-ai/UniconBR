# 📋 Instruções para Adicionar Coluna user_id à Tabela processos

## ❌ Erro Encontrado
```
"Could not find the 'user_id' column of 'processos' in the schema cache"
```

## ✅ Solução

A tabela `processos` não possui a coluna `user_id` que permite atribuir um responsável (usuário) a cada processo/tarefa.

### Passo 1: Acessar o Supabase

1. Vá para https://supabase.com
2. Faça login com suas credenciais
3. Acesse o projeto "UniconBR" ou seu banco de dados
4. Clique em "SQL Editor" no menu esquerdo

### Passo 2: Executar o SQL

Cole o SQL abaixo no editor e clique em "Run":

```sql
-- Adicionar coluna user_id à tabela processos se não existir
ALTER TABLE processos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_processos_user_id ON processos(user_id);
```

### Passo 3: Verificar a Coluna

Após executar, você deve ver uma mensagem de sucesso. Para verificar:

```sql
-- Verificar a estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'processos'
ORDER BY column_name;
```

## 🧪 Testando

Após executar o SQL:

1. Vá para https://uniconbr.vercel.app
2. Faça login
3. Acesse o menu "Tarefas"
4. Clique em "+ Nova Tarefa"
5. O formulário deve carregar SEM erros
6. Tente criar uma tarefa teste com um responsável atribuído

## 📝 O que mudou no código

1. **app/tarefas/page.tsx** - Agora tenta atualizar user_id após criação se a coluna existir
2. **lib/process-management.ts** - Removido user_id da inserção inicial (será adicionado depois)
3. **add-user-id-to-processos.sql** - Script SQL para adicionar a coluna
4. **app/api/migrations/add-user-id-to-processos/route.ts** - Endpoint (para uso futuro)

## 🔍 Erros que foram corrigidos

| Erro | Causa | Solução |
|------|-------|---------|
| "Could not find the 'user_id' column of 'processos'" | Coluna não existe no banco | Adicionar via SQL acima |
| Formulário não carrega | Erro ao inserir user_id | Remover de inserção inicial |
| Responsável não é salvo | user_id não atualizado | Agora tenta atualizar após criação |

## ✨ Após a migração

- ✅ Criar nova tarefa com responsável funcionará perfeitamente
- ✅ Tarefas aparecerão no calendário com o responsável correto
- ✅ Editar permissões do usuário afetará acesso aos menus
- ✅ Sistema de permissões estará 100% funcional
