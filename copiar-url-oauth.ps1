# Script para copiar URL de callback OAuth
# Facilita a configuração no Google Cloud Console

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  URL DE CALLBACK PARA CONFIGURAR NO GOOGLE CLOUD CONSOLE" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# URL que deve ser configurada
$callbackUrl = "http://localhost:3101/api/v1/auth/google/callback"

Write-Host "Cole esta URL EXATAMENTE no Google Cloud Console:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $callbackUrl" -ForegroundColor Green -BackgroundColor Black
Write-Host ""

# Copiar para clipboard
try {
    Set-Clipboard -Value $callbackUrl
    Write-Host "✓ URL copiada para a área de transferência!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora você pode:" -ForegroundColor White
    Write-Host "1. Ir para: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
    Write-Host "2. Editar suas credenciais OAuth 2.0" -ForegroundColor White
    Write-Host "3. Em 'URIs de redirecionamento autorizados', clicar em + ADICIONAR URI" -ForegroundColor White
    Write-Host "4. Pressionar Ctrl+V para colar a URL" -ForegroundColor White
    Write-Host "5. Clicar em SALVAR" -ForegroundColor White
} catch {
    Write-Host "⚠ Não foi possível copiar automaticamente" -ForegroundColor Yellow
    Write-Host "Copie manualmente a URL acima" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar também as origens JavaScript
Write-Host "Também adicione estas Origens JavaScript autorizadas:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  http://localhost:3100" -ForegroundColor Green
Write-Host "  http://localhost:3101" -ForegroundColor Green
Write-Host ""

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se já está configurado no backend/.env
if (Test-Path "backend/.env") {
    $envContent = Get-Content "backend/.env"
    $configuredUrl = ($envContent | Select-String "^GOOGLE_CALLBACK_URL=" | Select-Object -First 1) -replace "^GOOGLE_CALLBACK_URL=", ""

    if ($configuredUrl -eq $callbackUrl) {
        Write-Host "✓ backend/.env já está configurado corretamente!" -ForegroundColor Green
    } elseif ([string]::IsNullOrWhiteSpace($configuredUrl)) {
        Write-Host "⚠ backend/.env existe mas GOOGLE_CALLBACK_URL está vazio" -ForegroundColor Yellow
        Write-Host "  Verifique se GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET também estão configurados" -ForegroundColor Yellow
    } else {
        Write-Host "⚠ backend/.env tem URL diferente: $configuredUrl" -ForegroundColor Yellow
        Write-Host "  Use a URL mostrada acima: $callbackUrl" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ backend/.env não encontrado!" -ForegroundColor Red
    Write-Host "  Execute: Copy-Item backend/.env.example backend/.env" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Após configurar no Google Console:" -ForegroundColor Cyan
Write-Host "  1. Aguarde 1-2 minutos" -ForegroundColor White
Write-Host "  2. Execute: docker-compose restart backend" -ForegroundColor White
Write-Host "  3. Teste: Start-Process 'http://localhost:3100/login'" -ForegroundColor White
Write-Host ""
Write-Host "Consulte SOLUCAO_GOOGLE_OAUTH_ERRO.md para instruções detalhadas" -ForegroundColor Cyan
Write-Host ""
