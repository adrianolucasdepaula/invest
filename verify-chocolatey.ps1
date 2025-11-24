# Script de Verificação e Correção do Chocolatey
# Deve ser executado como Administrador

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Verificação do Chocolatey" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "AVISO: Recomendado executar como Administrador!" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar instalação do Chocolatey
Write-Host "1. Verificando diretório do Chocolatey..." -ForegroundColor Yellow

$chocoPath = "C:\ProgramData\chocolatey"
$chocoExe = "$chocoPath\bin\choco.exe"

if (Test-Path $chocoPath) {
    Write-Host "   OK - Diretório encontrado: $chocoPath" -ForegroundColor Green
} else {
    Write-Host "   ERRO - Diretório não encontrado: $chocoPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Chocolatey não está instalado corretamente." -ForegroundColor Red
    Write-Host "Execute o script install-chocolatey.ps1 novamente como Administrador." -ForegroundColor Yellow
    pause
    exit 1
}

if (Test-Path $chocoExe) {
    Write-Host "   OK - Executável encontrado: $chocoExe" -ForegroundColor Green
} else {
    Write-Host "   ERRO - Executável não encontrado: $chocoExe" -ForegroundColor Red
    Write-Host ""
    Write-Host "Chocolatey não está instalado corretamente." -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "2. Verificando PATH atual..." -ForegroundColor Yellow

$machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$currentPath = $env:Path

if ($currentPath -like "*chocolatey\bin*") {
    Write-Host "   OK - Chocolatey está no PATH da sessão atual" -ForegroundColor Green
} else {
    Write-Host "   AVISO - Chocolatey NÃO está no PATH da sessão atual" -ForegroundColor Yellow
    Write-Host "   Atualizando PATH da sessão..." -ForegroundColor Yellow

    $env:Path = $machinePath + ";" + $userPath

    if ($env:Path -like "*chocolatey\bin*") {
        Write-Host "   OK - PATH atualizado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "   Adicionando Chocolatey ao PATH manualmente..." -ForegroundColor Yellow
        $env:Path = $env:Path + ";$chocoPath\bin"
        Write-Host "   OK - PATH atualizado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "3. Testando comando choco..." -ForegroundColor Yellow

try {
    $chocoVersion = & $chocoExe --version 2>&1
    Write-Host "   OK - Chocolatey está funcionando!" -ForegroundColor Green
    Write-Host "   Versão: $chocoVersion" -ForegroundColor White

    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "  Chocolatey está pronto para uso!" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Comandos disponíveis:" -ForegroundColor Cyan
    Write-Host "  choco search <pacote>     - Buscar pacotes" -ForegroundColor White
    Write-Host "  choco install <pacote>    - Instalar pacote" -ForegroundColor White
    Write-Host "  choco list --local-only   - Listar pacotes instalados" -ForegroundColor White
    Write-Host "  choco upgrade all         - Atualizar todos os pacotes" -ForegroundColor White
    Write-Host ""

    Write-Host "Exemplo - Instalar jq:" -ForegroundColor Cyan
    Write-Host "  choco install jq -y" -ForegroundColor White
    Write-Host ""

    # Perguntar se deseja instalar jq
    Write-Host "Deseja instalar o jq agora? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host

    if ($response -eq 'S' -or $response -eq 's' -or $response -eq 'Y' -or $response -eq 'y') {
        Write-Host ""
        Write-Host "Instalando jq..." -ForegroundColor Yellow
        & $chocoExe install jq -y

        Write-Host ""
        Write-Host "Verificando instalação do jq..." -ForegroundColor Yellow

        # Atualizar PATH novamente
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

        try {
            $jqVersion = jq --version 2>&1
            Write-Host "OK - jq instalado: $jqVersion" -ForegroundColor Green
        } catch {
            Write-Host "AVISO - jq instalado mas precisa reiniciar o PowerShell" -ForegroundColor Yellow
        }
    }

} catch {
    Write-Host "   ERRO ao executar choco" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar diretamente:" -ForegroundColor Yellow
    Write-Host "  $chocoExe --version" -ForegroundColor White
}

Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Cyan
Write-Host "Para usar 'choco' em novas janelas do PowerShell, você precisa:" -ForegroundColor White
Write-Host "1. Fechar TODAS as janelas do PowerShell" -ForegroundColor White
Write-Host "2. Abrir uma NOVA janela do PowerShell (como Administrador se necessário)" -ForegroundColor White
Write-Host "3. O comando 'choco' estará disponível automaticamente" -ForegroundColor White
Write-Host ""

Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
pause
