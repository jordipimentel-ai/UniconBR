#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'lezwuwkrkpmzyooimqvk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU';

const sqls = [
  "ALTER TABLE processos ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'media'",
  "ALTER TABLE processos ADD COLUMN IF NOT EXISTS status_tarefa VARCHAR(50) DEFAULT 'pendente'",
  "CREATE INDEX IF NOT EXISTS idx_processos_prioridade ON processos(prioridade)",
  "CREATE INDEX IF NOT EXISTS idx_processos_status_tarefa ON processos(status_tarefa)",
];

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function migrate() {
  console.log('🚀 Iniciando migração de colunas...\n');

  for (const sql of sqls) {
    console.log(`Executando: ${sql}`);
    try {
      const result = await executeSql(sql);
      if (result.status === 200 || result.status === 201) {
        console.log('✅ OK\n');
      } else {
        console.log(`⚠️ Status ${result.status}: ${result.data}\n`);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}\n`);
    }
  }

  console.log('✅ Migração concluída!');
}

migrate();
