# Script para iniciar o servidor WhatsApp em background
Write-Host "🚀 Iniciando servidor WhatsApp..." -ForegroundColor Green
Write-Host "📱 Porta: 3001" -ForegroundColor Cyan
Write-Host "🧪 Teste: http://localhost:3001/api/test" -ForegroundColor Yellow
Write-Host ""

# Iniciar o servidor em background
Start-Process -FilePath "node" -ArgumentList "test-server.js" -WindowStyle Hidden

# Aguardar um pouco para o servidor inicializar
Start-Sleep -Seconds 3

# Testar se o servidor está rodando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -TimeoutSec 5
    Write-Host "✅ Servidor iniciado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao iniciar servidor: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "⚠️  Para parar o servidor, use: Get-Process node | Stop-Process" -ForegroundColor Yellow
