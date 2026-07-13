const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lezwuwkrkpmzyooimqvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU'
)

const sqls = [
  'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);',
  'CREATE POLICY "Only admins can insert users" ON users FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = \'admin\');',
  'CREATE POLICY "Only admins can update users" ON users FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) = \'admin\');',
  'CREATE POLICY "Only admins can delete users" ON users FOR DELETE USING ((SELECT role FROM users WHERE id = auth.uid()) = \'admin\');'
]

async function setupRLS() {
  console.log('Executando políticas RLS...\n')

  for (let i = 0; i < sqls.length; i++) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: sqls[i] })

      if (error) {
        console.log(`⚠️  SQL ${i + 1}/5: ${error.message}`)
      } else {
        console.log(`✅ SQL ${i + 1}/5 executado`)
      }
    } catch (err) {
      console.log(`❌ SQL ${i + 1}/5 falhou: ${err.message}`)
    }
  }

  console.log('\n✅ Configuração concluída!')
  console.log('Recarregue o navegador e tente acessar Usuários novamente.')
}

setupRLS()
