const { createClient } = require('@supabase/supabase-js')

// Usar a service role key para ter permissão de criar usuários
const supabaseUrl = 'https://lezwuwkrkpmzyooimqvk.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createTestUser() {
  try {
    console.log('Criando usuário de teste...\n')

    // 1. Criar usuário no Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'teste@example.com',
      password: 'teste123456',
      email_confirm: true,
    })

    if (error) {
      console.error('Erro ao criar usuário:', error.message)
      return
    }

    const userId = data.user.id
    console.log('✅ Usuário criado no Auth com ID:', userId)

    // 2. Inserir dados do usuário na tabela users
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: 'teste@example.com',
          nome_completo: 'Usuário Teste',
          role: 'admin',
          ativo: true,
        },
      ])

    if (insertError) {
      console.error('Erro ao inserir usuário na tabela:', insertError.message)
      return
    }

    console.log('✅ Usuário inserido na tabela users\n')
    console.log('🎉 Usuário de teste criado com sucesso!')
    console.log('\nCredenciais:')
    console.log('  Email: teste@example.com')
    console.log('  Senha: teste123456')
    console.log('\nAcesse: http://localhost:3000')
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

createTestUser()
