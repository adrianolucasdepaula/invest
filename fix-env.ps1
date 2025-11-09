# ====================================================================
# Script de Correção do .env - B3 AI Analysis Platform
# ====================================================================
# Este script verifica e corrige automaticamente as URLs no backend/.env

$ESC = [char]27
$RED = "$ESC[31m"
$GREEN = "$ESC[32m"
$YELLOW = "$ESC[33m"
$CYAN = "$ESC[36m"
$RESET = "$ESC[0m"

function Print-Success {
    param([string]$Message)
    Write-Host "${GREEN}✓${RESET} $Message"
}

function Print-Error {
    param([string]$Message)
    Write-Host "${RED}✗${RESET} $Message"
}

function Print-Info {
    param([string]$Message)
    Write-Host "${CYAN}ℹ${RESET} $Message"
}

function Print-Warning {
    param([string]$Message)
    Write-Host "${YELLOW}⚠${RESET} $Message"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Correção Automática do .env" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# 1. VERIFICAR SE backend/.env EXISTE
# ====================================================================
Write-Host "1. Verificando backend/.env..." -ForegroundColor Yellow

if (-not (Test-Path "backend/.env")) {
    Print-Warning "Arquivo backend/.env não encontrado"

    if (Test-Path "backend/.env.example") {
        Print-Info "Criando backend/.env a partir do .env.example..."
        Copy-Item "backend/.env.example" "backend/.env"
        Print-Success "Arquivo backend/.env criado!"
    } else {
        Print-Error "Arquivo backend/.env.example também não encontrado!"
        exit 1
    }
} else {
    Print-Success "Arquivo backend/.env existe"
}

Write-Host ""

# ====================================================================
# 2. VERIFICAR GOOGLE_CALLBACK_URL
# ====================================================================
Write-Host "2. Verificando GOOGLE_CALLBACK_URL..." -ForegroundColor Yellow

$envContent = Get-Content "backend/.env" -Raw
$needsFix = $false
$changes = @()

# Verificar se tem a URL antiga (sem /v1/)
if ($envContent -match 'GOOGLE_CALLBACK_URL=http://localhost:3101/api/auth/google/callback') {
    Print-Warning "URL antiga encontrada (sem /v1/)"
    $envContent = $envContent -replace 'GOOGLE_CALLBACK_URL=http://localhost:3101/api/auth/google/callback', 'GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/auth/google/callback'
    $needsFix = $true
    $changes += "GOOGLE_CALLBACK_URL corrigida"
}

# Verificar se tem porta errada (3001)
if ($envContent -match 'GOOGLE_CALLBACK_URL=http://localhost:3001/') {
    Print-Warning "Porta incorreta encontrada (3001 em vez de 3101)"
    $envContent = $envContent -replace 'GOOGLE_CALLBACK_URL=http://localhost:3001/', 'GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/'
    $needsFix = $true
    $changes += "Porta corrigida de 3001 para 3101"
}

if ($needsFix) {
    # Criar backup
    $backupFile = "backend/.env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item "backend/.env" $backupFile
    Print-Info "Backup criado: $backupFile"

    # Salvar correções
    Set-Content "backend/.env" $envContent -NoNewline
    Print-Success "Arquivo backend/.env corrigido!"

    Write-Host ""
    Write-Host "Mudanças aplicadas:" -ForegroundColor Yellow
    foreach ($change in $changes) {
        Write-Host "  • $change" -ForegroundColor Gray
    }
} else {
    Print-Success "GOOGLE_CALLBACK_URL já está correta"
}

Write-Host ""

# ====================================================================
# 3. MOSTRAR CONFIGURAÇÃO ATUAL
# ====================================================================
Write-Host "3. Configuração atual do Google OAuth:" -ForegroundColor Yellow

$googleConfig = Get-Content "backend/.env" | Select-String -Pattern "GOOGLE_"

foreach ($line in $googleConfig) {
    if ($line -match "GOOGLE_CLIENT_ID=(.+)") {
        $clientId = $matches[1]
        if ([string]::IsNullOrEmpty($clientId)) {
            Print-Warning "GOOGLE_CLIENT_ID está vazio"
        } else {
            Print-Success "GOOGLE_CLIENT_ID configurado"
        }
    }

    if ($line -match "GOOGLE_CLIENT_SECRET=(.+)") {
        $clientSecret = $matches[1]
        if ([string]::IsNullOrEmpty($clientSecret)) {
            Print-Warning "GOOGLE_CLIENT_SECRET está vazio"
        } else {
            Print-Success "GOOGLE_CLIENT_SECRET configurado"
        }
    }

    if ($line -match "GOOGLE_CALLBACK_URL=(.+)") {
        $callbackUrl = $matches[1]
        Write-Host "  URL de callback: " -NoNewline -ForegroundColor Gray
        Write-Host "$callbackUrl" -ForegroundColor Cyan
    }
}

Write-Host ""

# ====================================================================
# 4. VERIFICAR SE BACKEND PRECISA SER REINICIADO
# ====================================================================
Write-Host "4. Verificando se backend está rodando..." -ForegroundColor Yellow

$backendRunning = docker ps --filter "name=invest_backend" --format "{{.Names}}" 2>$null

if ($backendRunning) {
    Print-Info "Backend está rodando"

    if ($needsFix) {
        Write-Host ""
        Print-Warning "O arquivo .env foi modificado"
        Print-Info "É necessário reiniciar o backend para aplicar as mudanças"
        Write-Host ""

        $restart = Read-Host "Deseja reiniciar o backend agora? (y/n)"
        if ($restart -eq "y") {
            Write-Host ""
            Print-Info "Reiniciando backend..."
            docker-compose restart backend

            Write-Host ""
            Print-Info "Aguardando backend iniciar (10 segundos)..."
            Start-Sleep -Seconds 10

            # Verificar se está respondendo
            try {
                $health = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/health" -TimeoutSec 5 -UseBasicParsing
                Print-Success "Backend reiniciado com sucesso!"
            } catch {
                Print-Warning "Backend pode ainda estar iniciando. Aguarde mais alguns segundos."
            }
        } else {
            Print-Info "Lembre-se de reiniciar o backend manualmente:"
            Write-Host "  docker-compose restart backend" -ForegroundColor Cyan
        }
    }
} else {
    Print-Info "Backend não está rodando"
}

Write-Host ""

# ====================================================================
# 5. RESUMO E PRÓXIMOS PASSOS
# ====================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Verificação Concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Testar autenticação:" -ForegroundColor Cyan
Write-Host "   .\test-auth.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Testar Google OAuth (no navegador):" -ForegroundColor Cyan
Write-Host "   Start-Process 'http://localhost:3101/api/v1/auth/google'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Ver documentação da API:" -ForegroundColor Cyan
Write-Host "   Start-Process 'http://localhost:3101/api/docs'" -ForegroundColor Gray
Write-Host ""

Write-Host "URLs corretas para uso:" -ForegroundColor Yellow
Write-Host "  POST /api/v1/auth/register" -ForegroundColor Gray
Write-Host "  POST /api/v1/auth/login" -ForegroundColor Gray
Write-Host "  GET  /api/v1/auth/google" -ForegroundColor Gray
Write-Host "  GET  /api/v1/auth/me" -ForegroundColor Gray
Write-Host ""
