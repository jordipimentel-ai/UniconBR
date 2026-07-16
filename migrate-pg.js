#!/usr/bin/env node

// Get database URL from Supabase
// Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
// We need to construct it from the API URL and service role key

const https = require('https');

const SUPABASE_URL = 'https://lezwuwkrkpmzyooimqvk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU';

async function getConnectionString() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lezwuwkrkpmzyooimqvk.supabase.co',
      path: '/rest/v1/rpc/get_postgres_connection_string',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Could not get connection string'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Try to use environment approach
async function migrate() {
  try {
    console.log('🚀 Iniciando migração...\n');

    // Try to load pg module
    let pg;
    try {
      pg = require('pg');
    } catch (e) {
      console.log('❌ Módulo pg não está instalado');
      console.log('Execute: npm install pg');
      console.log('\nAlternativa: Execute o SQL manualmente no Supabase Dashboard\n');
      showManualInstructions();
      process.exit(1);
    }

    const { Client } = pg;

    // Get connection from env or construct it
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.log('❌ DATABASE_URL não encontrada em .env.local');
      console.log('\nExecute o SQL manualmente no Supabase Dashboard\n');
      showManualInstructions();
      process.exit(1);
    }

    const client = new Client({
      connectionString,
    });

    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const sql = `
      ALTER TABLE processos
      ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media',
      ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';

      CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);
      CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);
    `;

    console.log('Executando migração...\n');
    const result = await client.query(sql);
    console.log('✅ Migração executada com sucesso!');

    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n\nExecute o SQL manualmente no Supabase Dashboard:\n');
    showManualInstructions();
    process.exit(1);
  }
}

function showManualInstructions() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  COMO EXECUTAR MANUALMENTE NO SUPABASE DASHBOARD              ║
╚═══════════════════════════════════════════════════════════════╝

1. Acesse: https://supabase.com/dashboard

2. Selecione o projeto "UniconBR"

3. Clique em "SQL Editor" no menu esquerdo

4. Coloque esse SQL em uma nova query:

  ALTER TABLE processos
  ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente';

  CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade);
  CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa);

5. Clique em "Run"

6. Você deve ver "✅ Migração bem-sucedida"

7. Recarregue o aplicativo

  `);
}

migrate();
