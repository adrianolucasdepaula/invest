@echo off
:: Script de Verificação do Chocolatey (Arquivo BAT)
:: Clique duplo para executar

echo ===================================
echo   Verificacao do Chocolatey
echo ===================================
echo.

:: Verificar se choco.exe existe
if exist "C:\ProgramData\chocolatey\bin\choco.exe" (
    echo OK - Chocolatey instalado em: C:\ProgramData\chocolatey
    echo.

    echo Versao do Chocolatey:
    "C:\ProgramData\chocolatey\bin\choco.exe" --version
    echo.

    echo ===================================
    echo   Chocolatey esta funcionando!
    echo ===================================
    echo.

    echo Para usar o comando 'choco' diretamente:
    echo 1. Feche TODAS as janelas do PowerShell/CMD
    echo 2. Abra uma NOVA janela
    echo 3. Digite: choco --version
    echo.

    echo Deseja instalar o jq agora? (S/N)
    set /p install_jq="> "

    if /i "%install_jq%"=="S" (
        echo.
        echo Instalando jq...
        "C:\ProgramData\chocolatey\bin\choco.exe" install jq -y
        echo.
        echo jq instalado! Reinicie o terminal para usar.
    ) else if /i "%install_jq%"=="Y" (
        echo.
        echo Instalando jq...
        "C:\ProgramData\chocolatey\bin\choco.exe" install jq -y
        echo.
        echo jq instalado! Reinicie o terminal para usar.
    )

) else (
    echo ERRO - Chocolatey nao encontrado!
    echo.
    echo Execute o arquivo: install-chocolatey.ps1
    echo como Administrador primeiro.
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
