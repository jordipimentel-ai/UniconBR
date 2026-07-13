# Guia de Teste - Sistema de Contabilidade

## 1. Primeiros Passos

### ✅ Setup Concluído
- ✅ Projeto Next.js criado
- ✅ Banco de dados Supabase configurado (8 tabelas)
- ✅ Autenticação integrada
- ✅ Páginas principais criadas

---

## 2. Criar Usuário de Teste

Para testar o login, você precisa criar um usuário no Supabase:

1. **Abra**: https://app.supabase.com
2. **Clique** no seu projeto
3. **Menu esquerdo** → **Authentication** → **Users**
4. **Clique em "Invite"**
5. **Preencha**:
   - Email: `test@example.com`
   - Password: `teste123456`
6. **Clique em "Send Invite"**

Ou acesse a seção **SQL Editor** e execute:

```sql
-- Inserir usuário de teste via SQL
INSERT INTO auth.users (email, password_hash, email_confirmed_at)
VALUES (
  'teste@example.com',
  crypt('teste123456', gen_salt('bf')),
  now()
);

-- Inserir dados do usuário na tabela users
INSERT INTO users (id, email, nome_completo, role, ativo)
SELECT
  id,
  email,
  'Usuário Teste',
  'admin',
  true
FROM auth.users
WHERE email = 'teste@example.com';
```

---

## 3. Adicionar Dados de Teste

No **SQL Editor do Supabase**, execute o conteúdo do arquivo `seed-data.sql` para adicionar:
- 6 tipos de processo
- 5 clientes
- 1 processo

---

## 4. Testar a Aplicação

### Iniciar o servidor (já deve estar rodando)
```powershell
npm run dev
```

### Acessar a aplicação
1. **Abra**: http://localhost:3000
2. Será redirecionado para `/auth` (login)
3. **Faça login com**:
   - Email: `teste@example.com`
   - Senha: `teste123456`

---

## 5. Funcionalidades Disponíveis

### ✅ Dashboard
- Estatísticas (clientes, processos, tarefas)
- Links rápidos para gerenciar

### ✅ Gestão de Clientes
- **Listar**: Ver todos os clientes
- **Criar**: Adicionar novo cliente
- **Editar**: (será criado no próximo passo)
- **Deletar**: Soft delete (marca como inativo)

### 📋 Próximos Passos (não criados ainda)
- ❌ Editar cliente
- ❌ Gestão de Processos (Kanban)
- ❌ Gestão de Tarefas
- ❌ Documentos
- ❌ Timeline de atividades

---

## 6. Estrutura de Pastas

```
sistema-contabilidade/
├── app/
│   ├── auth/                 # Página de login
│   ├── dashboard/            # Dashboard principal
│   ├── clientes/
│   │   ├── page.tsx         # Listar clientes
│   │   └── novo/            # Criar novo cliente
│   └── page.tsx             # Redirecionamento (auth ou dashboard)
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   └── auth.ts              # Funções de autenticação
├── schema.sql               # Schema do banco (já executado)
└── seed-data.sql            # Dados de teste (execute no SQL Editor)
```

---

## 7. Próximas Páginas a Criar

Você quer que eu crie:
1. **Página de editar cliente** (`/clientes/[id]`)
2. **Gestão de processos** (Kanban board)
3. **Gestão de tarefas**
4. **Upload de documentos**
5. **Timeline de atividades**

---

## 8. Troubleshooting

### Erro: "Could not find the user"
- Verifique se criou um usuário no Supabase Authentication

### Erro: "Missing environment variables"
- Verifique se `.env.local` tem as credenciais corretas

### Login não funciona
- Certifique-se de que a senha tem pelo menos 6 caracteres
- No Supabase, vá em **Settings > Auth** e verifique as configurações

---

## 9. Revogar Credenciais

Depois de terminar os testes, **revogue a service_role key**:
1. Supabase Dashboard > **Settings > API**
2. Procure pela chave que foi compartilhada
3. Clique no ícone de lixo para deletá-la

---

Aproveite os testes! 🚀
