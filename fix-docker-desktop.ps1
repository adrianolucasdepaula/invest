# Fix Docker Desktop - Script Automático
# Resolve erro 500 API e componentsVersion.json missing
# Data: 2025-12-26

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  FIX DOCKER DESKTOP - TROUBLESHOOTING AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  ATENÇÃO: Execute como Administrador para melhor resultado" -ForegroundColor Yellow
    Write-Host "   Continuando mesmo assim..." -ForegroundColor Yellow
    Write-Host ""
}

# STEP 1: Parar Docker Desktop
Write-Host "[STEP 1] Parando Docker Desktop..." -ForegroundColor Yellow
try {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Docker Desktop parado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker Desktop já estava parado ou não encontrado" -ForegroundColor Yellow
}

Start-Sleep -Seconds 3

# STEP 2: Shutdown WSL completo
Write-Host "[STEP 2] Shutdown WSL completo..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5
Write-Host "✅ WSL shutdown completo" -ForegroundColor Green

# STEP 3: Iniciar Docker Desktop
Write-Host "[STEP 3] Iniciando Docker Desktop..." -ForegroundColor Yellow
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

if (Test-Path $dockerPath) {
    Start-Process $dockerPath
    Write-Host "✅ Docker Desktop iniciado" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Desktop não encontrado em: $dockerPath" -ForegroundColor Red
    Write-Host "   Por favor, instale Docker Desktop ou verifique o caminho" -ForegroundColor Red
    exit 1
}

# STEP 4: Aguardar Docker inicializar
Write-Host "[STEP 4] Aguardando Docker Desktop inicializar..." -ForegroundColor Yellow
Write-Host "   Isso pode levar 60-120 segundos..." -ForegroundColor Gray

for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 10
    Write-Host "   Aguardando... $($i * 10)s" -ForegroundColor Gray

    # Testar conectividade a cada 30s
    if ($i % 3 -eq 0) {
        $testResult = docker ps 2>&1
        if ($testResult -notmatch "error|Error|500") {
            Write-Host "✅ Docker respondendo!" -ForegroundColor Green
            break
        }
    }
}

# STEP 5: Validar Docker funcionando
Write-Host ""
Write-Host "[STEP 5] Validando Docker..." -ForegroundColor Yellow

$dockerTest = docker ps 2>&1 | Out-String

if ($dockerTest -match "error|Error|500") {
    Write-Host "❌ Docker ainda com erro após restart" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUÇÃO ALTERNATIVA NECESSÁRIA:" -ForegroundColor Yellow
    Write-Host "1. Abrir Docker Desktop GUI" -ForegroundColor White
    Write-Host "2. Settings → Troubleshoot → 'Reset to factory defaults'" -ForegroundColor White
    Write-Host "3. Confirmar reset" -ForegroundColor White
    Write-Host "4. Aguardar 2-3 minutos" -ForegroundColor White
    Write-Host "5. Executar novamente: docker ps" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Reset NÃO apaga volumes/containers, apenas settings" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Docker Desktop funcionando corretamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Containers ativos:" -ForegroundColor Cyan
    docker ps --format "{{.Names}}: {{.Status}}"
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  ✅ FIX COMPLETO" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "1. Verificar health: .\system-manager.ps1 health" -ForegroundColor Gray
Write-Host "2. Verificar status: .\system-manager.ps1 status" -ForegroundColor Gray
Write-Host "3. Continuar com FASE 143" -ForegroundColor Gray
