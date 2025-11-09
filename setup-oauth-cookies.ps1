#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script helper para configurar OAuth cookies no Windows

.DESCRIPTION
    Este script instala Python (se necessário), dependências, e executa save_google_cookies.py
    no Windows onde pode abrir Chrome visualmente para login manual.

.NOTES
    Requer Windows 10+ com PowerShell 5.1+
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OAuth Cookies Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "[1/5] Verificando instalação do Python..." -ForegroundColor Yellow

$pythonCmd = $null
$pythonCommands = @("python", "python3", "py")

foreach ($cmd in $pythonCommands) {
    try {
        $version = & $cmd --version 2>&1
        if ($version -match "Python 3\.([0-9]+)") {
            $minorVersion = [int]$Matches[1]
            if ($minorVersion -ge 8) {
                $pythonCmd = $cmd
                Write-Host "  ✓ Python encontrado: $version" -ForegroundColor Green
                break
            }
        }
    } catch {
        continue
    }
}

if (-not $pythonCmd) {
    Write-Host "  ✗ Python 3.8+ não encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPÇÕES DE INSTALAÇÃO:" -ForegroundColor Yellow
    Write-Host "  1. Microsoft Store (RECOMENDADO):" -ForegroundColor Cyan
    Write-Host "     - Abra Microsoft Store" -ForegroundColor Gray
    Write-Host "     - Busque por 'Python 3.11'" -ForegroundColor Gray
    Write-Host "     - Clique em 'Obter' para instalar" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. python.org (ALTERNATIVO):" -ForegroundColor Cyan
    Write-Host "     - Acesse: https://www.python.org/downloads/" -ForegroundColor Gray
    Write-Host "     - Baixe Python 3.11 ou superior" -ForegroundColor Gray
    Write-Host "     - IMPORTANTE: Marque 'Add Python to PATH' durante instalação" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. winget (PARA USUÁRIOS AVANÇADOS):" -ForegroundColor Cyan
    Write-Host "     winget install Python.Python.3.11" -ForegroundColor Gray
    Write-Host ""

    $choice = Read-Host "Deseja abrir Microsoft Store agora? (s/N)"
    if ($choice -eq "s" -or $choice -eq "S") {
        Start-Process "ms-windows-store://pdp/?ProductId=9NRWMJP3717K"
        Write-Host ""
        Write-Host "Após instalar Python, execute este script novamente." -ForegroundColor Yellow
    }

    exit 1
}

# Verificar se pip está instalado
Write-Host ""
Write-Host "[2/5] Verificando pip..." -ForegroundColor Yellow

try {
    & $pythonCmd -m pip --version | Out-Null
    Write-Host "  ✓ pip está instalado" -ForegroundColor Green
} catch {
    Write-Host "  ✗ pip não encontrado. Instalando..." -ForegroundColor Yellow
    & $pythonCmd -m ensurepip --upgrade
}

# Verificar/instalar dependências
Write-Host ""
Write-Host "[3/5] Verificando dependências..." -ForegroundColor Yellow

$dependencies = @(
    "selenium==4.15.2",
    "loguru==0.7.2",
    "webdriver-manager==4.0.1"
)

foreach ($dep in $dependencies) {
    $depName = $dep.Split("==")[0]
    Write-Host "  Instalando $depName..." -ForegroundColor Gray
}

& $pythonCmd -m pip install --quiet $dependencies

Write-Host "  ✓ Todas as dependências instaladas" -ForegroundColor Green

# Verificar Chrome
Write-Host ""
Write-Host "[4/5] Verificando Google Chrome..." -ForegroundColor Yellow

$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$chromeInstalled = $false
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromeInstalled = $true
        Write-Host "  ✓ Chrome encontrado: $path" -ForegroundColor Green
        break
    }
}

if (-not $chromeInstalled) {
    Write-Host "  ⚠ Google Chrome não encontrado" -ForegroundColor Yellow
    Write-Host "  Instale Chrome em: https://www.google.com/chrome/" -ForegroundColor Gray

    $choice = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($choice -ne "s" -and $choice -ne "S") {
        exit 1
    }
}

# Criar diretório para cookies
Write-Host ""
Write-Host "[5/5] Preparando ambiente..." -ForegroundColor Yellow

$cookiesDir = Join-Path $PSScriptRoot "backend\python-scrapers\browser-profiles"
if (-not (Test-Path $cookiesDir)) {
    New-Item -ItemType Directory -Path $cookiesDir -Force | Out-Null
}
Write-Host "  ✓ Diretório preparado: $cookiesDir" -ForegroundColor Green

# Executar script
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PRONTO PARA EXECUTAR!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "O script abrirá um navegador Chrome." -ForegroundColor Yellow
Write-Host "Você precisará fazer login manualmente em 19 sites." -ForegroundColor Yellow
Write-Host "Tempo estimado: 1-2 horas" -ForegroundColor Yellow
Write-Host ""
Write-Host "INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "  1. Chrome abrirá automaticamente" -ForegroundColor Gray
Write-Host "  2. Faça login manualmente em cada site quando solicitado" -ForegroundColor Gray
Write-Host "  3. Pressione ENTER no terminal após cada login" -ForegroundColor Gray
Write-Host "  4. Repita para todos os 19 sites" -ForegroundColor Gray
Write-Host "  5. Os cookies serão salvos automaticamente" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Deseja continuar? (s/N)"
if ($continue -ne "s" -and $continue -ne "S") {
    Write-Host ""
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executando save_google_cookies.py..." -ForegroundColor Green
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "backend\python-scrapers\save_google_cookies.py"
Set-Location (Join-Path $PSScriptRoot "backend\python-scrapers")

& $pythonCmd $scriptPath

# Verificar se cookies foram criados
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICAÇÃO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$cookiesFile = Join-Path $cookiesDir "google_cookies.pkl"

if (Test-Path $cookiesFile) {
    $fileSize = (Get-Item $cookiesFile).Length
    Write-Host "  ✓ Cookies salvos com sucesso!" -ForegroundColor Green
    Write-Host "  Arquivo: $cookiesFile" -ForegroundColor Gray
    Write-Host "  Tamanho: $fileSize bytes" -ForegroundColor Gray
    Write-Host ""

    # Copiar para container
    Write-Host "Copiando cookies para container Docker..." -ForegroundColor Yellow
    docker cp $cookiesFile invest_scrapers:/app/browser-profiles/google_cookies.pkl

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Cookies copiados para container!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SETUP COMPLETO! ✓" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Falha ao copiar para container" -ForegroundColor Yellow
        Write-Host "  Execute manualmente:" -ForegroundColor Gray
        Write-Host "  docker cp `"$cookiesFile`" invest_scrapers:/app/browser-profiles/" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ Arquivo de cookies não encontrado" -ForegroundColor Red
    Write-Host "  O processo pode ter sido interrompido ou falhado" -ForegroundColor Yellow
}

Write-Host ""
