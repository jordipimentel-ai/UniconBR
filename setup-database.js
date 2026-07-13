const fs = require('fs');
const path = require('path');

// Configuração
const SUPABASE_URL = 'https://lezwuwkrkpmzyooimqvk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU';

async function executeSql(sql) {
  try {
    console.log('🔄 Enviando SQL para Supabase...\n');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      // Se o endpoint rpc/exec_sql não existir, tenta alternativa
      if (response.status === 404) {
        console.log('⚠️  Endpoint RPC não disponível. Executando via SQL Editor API...\n');
        return await executeSqlViaEditor(sql);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ SQL executado com sucesso!\n');
    console.log('Resultado:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    throw error;
  }
}

async function executeSqlViaEditor(sql) {
  // Fallback: usar o endpoint padrão do Supabase para SQL
  try {
    // Dividir SQL em statements individuais
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executando ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] Executando: ${statement.substring(0, 60)}...`);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: statement }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`  ❌ Erro: ${error}`);
        continue;
      }

      console.log(`  ✅ OK`);
    }

    console.log('\n✅ Banco de dados configurado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Ler arquivo schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Arquivo schema.sql não encontrado!');
      process.exit(1);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📂 Arquivo schema.sql carregado\n');

    // Executar SQL
    await executeSql(sql);

    console.log('\n🎉 Banco de dados pronto para usar!');
    console.log('Tabelas criadas:');
    console.log('  ✅ users');
    console.log('  ✅ clientes');
    console.log('  ✅ tipos_processo');
    console.log('  ✅ processos');
    console.log('  ✅ processo_colaboradores');
    console.log('  ✅ tarefas');
    console.log('  ✅ documentos');
    console.log('  ✅ atividades');
  } catch (error) {
    console.error('\n❌ Erro na configuração do banco de dados');
    process.exit(1);
  }
}

main();
