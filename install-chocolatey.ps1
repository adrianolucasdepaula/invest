# Script de Instalação do Chocolatey
# Deve ser executado como Administrador

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Instalação do Chocolatey" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Passos para executar como Administrador:" -ForegroundColor Yellow
    Write-Host "1. Clique com botão direito no ícone do PowerShell" -ForegroundColor Yellow
    Write-Host "2. Selecione 'Executar como Administrador'" -ForegroundColor Yellow
    Write-Host "3. Execute este script novamente" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "Executando como Administrador... OK" -ForegroundColor Green
Write-Host ""

# Configurar política de execução
Write-Host "Configurando política de execução..." -ForegroundColor Yellow
Set-ExecutionPolicy Bypass -Scope Process -Force

# Configurar protocolo de segurança
Write-Host "Configurando protocolo de segurança TLS 1.2..." -ForegroundColor Yellow
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072

# Baixar e executar instalador do Chocolatey
Write-Host "Baixando e instalando Chocolatey..." -ForegroundColor Yellow
Write-Host ""

try {
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "  Chocolatey instalado com sucesso!" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    Write-Host ""

    # Atualizar variável de ambiente PATH na sessão atual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Verificar instalação
    Write-Host "Verificando instalação..." -ForegroundColor Yellow
    choco --version

    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Feche e reabra o PowerShell (como Administrador se necessário)" -ForegroundColor White
    Write-Host "2. Execute: choco install jq -y" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "ERRO na instalação:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
pause
