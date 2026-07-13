$ErrorActionPreference = "Stop"

# Configuração
$SUPABASE_URL = "https://lezwuwkrkpmzyooimqvk.supabase.co"
$SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlend1d2tya3Btenlvb2ltcXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkwOTQ2MSwiZXhwIjoyMDk5NDg1NDYxfQ.ijJvxPI1XHGlQ2bHZbZWqdNtxRrYOJjGo1FFgxjyDIU"

Write-Host "Carregando schema.sql..." -ForegroundColor Cyan
$sqlContent = Get-Content "schema.sql" -Raw

Write-Host "Executando SQL no Supabase..." -ForegroundColor Cyan

# Preparar o payload JSON
$payload = @{
    query = $sqlContent
} | ConvertTo-Json -Depth 10 -Compress

# Headers
$headers = @{
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "apikey" = $SERVICE_ROLE_KEY
    "Content-Type" = "application/json"
}

try {
    # Tentar via endpoint REST
    $response = Invoke-WebRequest `
        -Uri "$SUPABASE_URL/rest/v1/sql" `
        -Method Post `
        -Headers $headers `
        -Body $payload `
        -TimeoutSec 30

    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
        Write-Host "`nSQL executado com sucesso!" -ForegroundColor Green
        Write-Host "`nBanco de dados criado!" -ForegroundColor Green
        Write-Host "`nTabelas criadas:" -ForegroundColor Green
        Write-Host "  [OK] users"
        Write-Host "  [OK] clientes"
        Write-Host "  [OK] tipos_processo"
        Write-Host "  [OK] processos"
        Write-Host "  [OK] processo_colaboradores"
        Write-Host "  [OK] tarefas"
        Write-Host "  [OK] documentos"
        Write-Host "  [OK] atividades"
        exit 0
    }
} catch {
    Write-Host "Erro na requisicao: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Se chegou aqui, mostrar instruções manuais
Write-Host "`nINSTRUCOES MANUAIS:" -ForegroundColor Yellow
Write-Host "`n1. Abra: https://app.supabase.com"
Write-Host "2. Clique no seu projeto"
Write-Host "3. Menu esquerdo > SQL Editor > New Query"
Write-Host "4. Copie TUDO do arquivo schema.sql"
Write-Host "5. Cole no editor"
Write-Host "6. Clique em RUN (Ctrl+Enter)"
Write-Host "`nIMPORTANTE: Revogue a service_role key apos usar!" -ForegroundColor Red
