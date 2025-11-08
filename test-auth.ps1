# ====================================================================
# Script de Teste de Autenticação - B3 AI Analysis Platform
# ====================================================================
# Este script testa todos os endpoints de autenticação da API

param(
    [string]$Email = "",
    [string]$Password = "senha12345"
)

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
Write-Host "  Teste de Autenticação da API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# 1. TESTAR CONEXÃO COM BACKEND
# ====================================================================
Write-Host "1. Testando conexão com backend..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/health" -TimeoutSec 5 -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Print-Success "Backend está online!"
    }
} catch {
    Print-Error "Backend não está respondendo!"
    Print-Info "Execute: .\system-manager.ps1 start"
    exit 1
}

Write-Host ""

# ====================================================================
# 2. REGISTRAR NOVO USUÁRIO
# ====================================================================
Write-Host "2. Testando registro de usuário..." -ForegroundColor Yellow

# Gerar email aleatório se não foi fornecido
if ([string]::IsNullOrEmpty($Email)) {
    $randomNum = Get-Random -Maximum 9999
    $Email = "teste.$randomNum@exemplo.com"
}

$registerBody = @{
    email = $Email
    password = $Password
    firstName = "Usuário"
    lastName = "Teste"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    Print-Success "Usuário registrado com sucesso!"
    Print-Info "Email: $($registerResponse.user.email)"
    Print-Info "ID: $($registerResponse.user.id)"
    Print-Info "Token recebido: $($registerResponse.token.Substring(0, 50))..."

    $registeredEmail = $registerResponse.user.email
    $firstToken = $registerResponse.token
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__

    if ($statusCode -eq 401) {
        Print-Warning "Usuário já existe, tentando login..."
        $registeredEmail = $Email
    } else {
        Print-Error "Erro ao registrar usuário (HTTP $statusCode)"

        if ($_.ErrorDetails.Message) {
            try {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
                Print-Error "Mensagem: $($errorBody.message)"
            } catch {
                Print-Error $_.ErrorDetails.Message
            }
        }
        exit 1
    }
}

Write-Host ""

# ====================================================================
# 3. FAZER LOGIN
# ====================================================================
Write-Host "3. Testando login..." -ForegroundColor Yellow

$loginBody = @{
    email = $registeredEmail
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    Print-Success "Login realizado com sucesso!"
    Print-Info "Token recebido: $($loginResponse.token.Substring(0, 50))..."

    $token = $loginResponse.token
} catch {
    Print-Error "Erro ao fazer login"

    if ($_.ErrorDetails.Message) {
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Print-Error "Mensagem: $($errorBody.message)"
        } catch {
            Print-Error $_.ErrorDetails.Message
        }
    }
    exit 1
}

Write-Host ""

# ====================================================================
# 4. OBTER PERFIL DO USUÁRIO
# ====================================================================
Write-Host "4. Testando obtenção de perfil..." -ForegroundColor Yellow

try {
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/me" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
        }

    Print-Success "Perfil obtido com sucesso!"
    Print-Info "ID: $($profileResponse.id)"
    Print-Info "Nome: $($profileResponse.firstName) $($profileResponse.lastName)"
    Print-Info "Email: $($profileResponse.email)"
    Print-Info "Ativo: $($profileResponse.isActive)"
    Print-Info "Criado em: $($profileResponse.createdAt)"
} catch {
    Print-Error "Erro ao obter perfil"

    if ($_.ErrorDetails.Message) {
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Print-Error "Mensagem: $($errorBody.message)"
        } catch {
            Print-Error $_.ErrorDetails.Message
        }
    }
    exit 1
}

Write-Host ""

# ====================================================================
# 5. INFORMAÇÕES ADICIONAIS
# ====================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Todos os testes passaram!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Endpoints testados:" -ForegroundColor Yellow
Write-Host "  ${GREEN}✓${RESET} POST /api/v1/auth/register"
Write-Host "  ${GREEN}✓${RESET} POST /api/v1/auth/login"
Write-Host "  ${GREEN}✓${RESET} GET  /api/v1/auth/me"
Write-Host ""

Write-Host "Outros endpoints disponíveis:" -ForegroundColor Yellow
Write-Host "  ${CYAN}Google OAuth:${RESET}"
Write-Host "    GET  http://localhost:3101/api/v1/auth/google"
Write-Host "    GET  http://localhost:3101/api/v1/auth/google/callback"
Write-Host ""

Write-Host "Documentação interativa:" -ForegroundColor Yellow
Write-Host "  ${CYAN}Swagger UI:${RESET} http://localhost:3101/api/docs"
Write-Host ""

Write-Host "Token JWT salvo na variável:" -ForegroundColor Yellow
Write-Host "  `$token = '$token'"
Write-Host ""

Write-Host "Para testar Google OAuth, execute:" -ForegroundColor Yellow
Write-Host "  Start-Process 'http://localhost:3101/api/v1/auth/google'"
Write-Host ""
