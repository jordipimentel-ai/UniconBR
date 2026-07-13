#!/bin/bash

# Configuração
SUPABASE_URL="https://lezwuwkrkpmzyooimqvk.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU"

echo "🔄 Enviando SQL para Supabase..."

# Ler o arquivo schema.sql
SQL=$(cat schema.sql)

# Enviar SQL para Supabase
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$SQL" | jq -Rs .)}" \
  2>/dev/null

echo -e "\n✅ Processo concluído!"
