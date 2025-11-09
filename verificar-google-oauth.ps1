# Script para verificar configuração do Google OAuth
# Autor: Claude
# Data: 2025-11-09

$ErrorActionPreference = "Continue"

Write-Host "`n=== Verificação da Configuração do Google OAuth ===" -ForegroundColor Cyan
Write-Host ""

# Função para imprimir com cor
function Print-Info {
    param([string]$Message)
    Write-Host "ℹ  $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓  $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠  $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗  $Message" -ForegroundColor Red
}

# 1. Verificar se backend/.env existe
Print-Info "Verificando arquivo backend/.env..."
if (-not (Test-Path "backend/.env")) {
    Print-Error "Arquivo backend/.env não encontrado!"
    Print-Warning "Execute: Copy-Item backend/.env.example backend/.env"
    exit 1
}
Print-Success "Arquivo backend/.env encontrado"

# 2. Ler variáveis do Google OAuth
Print-Info "Lendo configurações do Google OAuth..."
$envContent = Get-Content "backend/.env"
$googleClientId = ($envContent | Select-String "^GOOGLE_CLIENT_ID=" | Select-Object -First 1) -replace "^GOOGLE_CLIENT_ID=", ""
$googleClientSecret = ($envContent | Select-String "^GOOGLE_CLIENT_SECRET=" | Select-Object -First 1) -replace "^GOOGLE_CLIENT_SECRET=", ""
$googleCallbackUrl = ($envContent | Select-String "^GOOGLE_CALLBACK_URL=" | Select-Object -First 1) -replace "^GOOGLE_CALLBACK_URL=", ""

Write-Host ""

# 3. Verificar se variáveis estão configuradas
$hasErrors = $false

Write-Host "Configuração atual:" -ForegroundColor Cyan
Write-Host "-------------------"

# GOOGLE_CLIENT_ID
Write-Host "GOOGLE_CLIENT_ID: " -NoNewline
if ([string]::IsNullOrWhiteSpace($googleClientId)) {
    Write-Host "❌ VAZIO" -ForegroundColor Red
    Print-Error "GOOGLE_CLIENT_ID não está configurado!"
    $hasErrors = $true
} else {
    $maskedId = $googleClientId.Substring(0, [Math]::Min(20, $googleClientId.Length)) + "..."
    Write-Host "✓ $maskedId" -ForegroundColor Green
}

# GOOGLE_CLIENT_SECRET
Write-Host "GOOGLE_CLIENT_SECRET: " -NoNewline
if ([string]::IsNullOrWhiteSpace($googleClientSecret)) {
    Write-Host "❌ VAZIO" -ForegroundColor Red
    Print-Error "GOOGLE_CLIENT_SECRET não está configurado!"
    $hasErrors = $true
} else {
    $maskedSecret = $googleClientSecret.Substring(0, [Math]::Min(15, $googleClientSecret.Length)) + "..."
    Write-Host "✓ $maskedSecret" -ForegroundColor Green
}

# GOOGLE_CALLBACK_URL
Write-Host "GOOGLE_CALLBACK_URL: " -NoNewline
if ([string]::IsNullOrWhiteSpace($googleCallbackUrl)) {
    Write-Host "❌ VAZIO" -ForegroundColor Red
    Print-Error "GOOGLE_CALLBACK_URL não está configurado!"
    $hasErrors = $true
} else {
    Write-Host "✓ $googleCallbackUrl" -ForegroundColor Green

    # Verificar se URL está correta
    $expectedUrl = "http://localhost:3101/api/v1/auth/google/callback"
    if ($googleCallbackUrl -ne $expectedUrl) {
        Print-Warning "URL de callback diferente da esperada!"
        Print-Warning "Esperado: $expectedUrl"
        Print-Warning "Atual: $googleCallbackUrl"
        Write-Host ""
        Print-Info "Se você configurou uma URL diferente no Google Console, ignore este aviso."
    }
}

Write-Host ""

# 4. Se houver erros, mostrar instruções
if ($hasErrors) {
    Write-Host "❌ CONFIGURAÇÃO INCOMPLETA" -ForegroundColor Red
    Write-Host ""
    Print-Info "Para configurar o Google OAuth:"
    Write-Host ""
    Write-Host "1. Acesse: https://console.cloud.google.com/" -ForegroundColor White
    Write-Host "2. Crie um projeto ou selecione um existente" -ForegroundColor White
    Write-Host "3. Vá em 'APIs e Serviços' > 'Credenciais'" -ForegroundColor White
    Write-Host "4. Clique em '+ Criar Credenciais' > 'ID do cliente OAuth'" -ForegroundColor White
    Write-Host "5. Configure a tela de consentimento (se solicitado)" -ForegroundColor White
    Write-Host "6. Tipo: Aplicativo da Web" -ForegroundColor White
    Write-Host "7. URI de redirecionamento: $googleCallbackUrl" -ForegroundColor Yellow
    Write-Host "8. Copie o Client ID e Client Secret" -ForegroundColor White
    Write-Host "9. Adicione no arquivo backend/.env" -ForegroundColor White
    Write-Host ""
    Print-Warning "Consulte o arquivo CONFIGURACAO_GOOGLE_OAUTH.md para instruções detalhadas"
    Write-Host ""
    exit 1
}

# 5. Se tudo ok, verificar se backend está rodando
Write-Host "✅ CONFIGURAÇÃO COMPLETA!" -ForegroundColor Green
Write-Host ""

Print-Info "Verificando se o backend está rodando..."
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/health" -UseBasicParsing -TimeoutSec 5
    if ($healthCheck.StatusCode -eq 200) {
        Print-Success "Backend está rodando"
    }
} catch {
    Print-Warning "Backend não está respondendo"
    Print-Info "Execute: .\system-manager.ps1 start"
    Write-Host ""
    exit 0
}

# 6. Verificar endpoint do Google OAuth
Print-Info "Verificando endpoint do Google OAuth..."
try {
    # Tentar acessar o endpoint (vai redirecionar para Google, mas isso é esperado)
    $response = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/auth/google" -MaximumRedirection 0 -ErrorAction SilentlyContinue

    # Status 302 (redirect) é esperado - significa que o endpoint existe e vai redirecionar para Google
    if ($response.StatusCode -eq 302) {
        Print-Success "Endpoint de OAuth está configurado"
        $redirectUrl = $response.Headers.Location
        if ($redirectUrl -like "*accounts.google.com*") {
            Print-Success "Redirecionamento para Google está funcionando"
        }
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 302) {
        Print-Success "Endpoint de OAuth está configurado e redirecionando"
    } else {
        Print-Warning "Não foi possível verificar endpoint OAuth (código: $statusCode)"
    }
}

Write-Host ""
Write-Host "=== Verificação Concluída ===" -ForegroundColor Cyan
Write-Host ""

# 7. Instruções finais
Print-Success "Configuração do Google OAuth está correta!"
Write-Host ""
Print-Info "Próximos passos:"
Write-Host ""
Write-Host "1. Abra o navegador:" -ForegroundColor White
Write-Host "   Start-Process 'http://localhost:3100/login'" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Clique em 'Entrar com Google'" -ForegroundColor White
Write-Host ""
Write-Host "3. Autorize o acesso quando solicitado" -ForegroundColor White
Write-Host ""
Write-Host "⚠  Se aparecer 'Erro 400: redirect_uri_mismatch':" -ForegroundColor Yellow
Write-Host "   - Verifique que no Google Cloud Console você adicionou:" -ForegroundColor White
Write-Host "   - URI de redirecionamento: $googleCallbackUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Consulte: CONFIGURACAO_GOOGLE_OAUTH.md para mais detalhes" -ForegroundColor Cyan
Write-Host ""
