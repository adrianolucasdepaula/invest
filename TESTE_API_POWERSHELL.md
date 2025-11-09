# Guia de Testes da API - PowerShell

Este guia mostra como testar a API usando comandos nativos do PowerShell.

## 📋 Rotas Disponíveis

Todas as rotas da API têm o prefixo `/api/v1/`:

| Método | Rota | Descrição | Rate Limit |
|--------|------|-----------|------------|
| POST | `/api/v1/auth/register` | Registrar usuário | 3 req/hora |
| POST | `/api/v1/auth/login` | Login | 5 req/5min |
| GET | `/api/v1/auth/google` | OAuth Google | Padrão |
| GET | `/api/v1/auth/google/callback` | Callback Google | Padrão |
| GET | `/api/v1/auth/me` | Perfil (requer JWT) | Padrão |

## 🚀 Testando com PowerShell

### 1. Registrar Novo Usuário

```powershell
$registerBody = @{
    email = "seu.email@exemplo.com"
    password = "senhaSegura123"
    firstName = "Seu Nome"
    lastName = "Sobrenome"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $registerBody
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "uuid",
    "email": "seu.email@exemplo.com",
    "firstName": "Seu Nome",
    "lastName": "Sobrenome",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Fazer Login

```powershell
$loginBody = @{
    email = "seu.email@exemplo.com"
    password = "senhaSegura123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

# Salvar o token para usar depois
$token = $response.token
Write-Host "Token salvo: $token"
```

### 3. Obter Perfil do Usuário (Autenticado)

```powershell
# Usar o token do login anterior
Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/me" `
    -Method Get `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

### 4. Login com Google OAuth

Para usar o Google OAuth, abra no navegador:

```powershell
# Abrir no navegador padrão
Start-Process "http://localhost:3101/api/v1/auth/google"
```

Ou copie e cole no navegador:
```
http://localhost:3101/api/v1/auth/google
```

## 🔧 Comandos Úteis

### Testar se o Backend está Online

```powershell
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3101/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend está online!" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend não está respondendo" -ForegroundColor Red
}
```

### Ver Resposta Completa (com Headers)

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

# Ver status code
Write-Host "Status: $($response.StatusCode)"

# Ver headers
$response.Headers

# Ver body
$response.Content | ConvertFrom-Json
```

### Tratamento de Erros

```powershell
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    Write-Host "✓ Sucesso!" -ForegroundColor Green
    $response
} catch {
    Write-Host "✗ Erro:" -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json

        Write-Host "Status Code: $statusCode"
        Write-Host "Mensagem: $($errorBody.message)"
    } else {
        Write-Host $_.Exception.Message
    }
}
```

## 📝 Script de Teste Completo

Salve este script como `test-auth.ps1`:

```powershell
# test-auth.ps1
# Script de teste completo da autenticação

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Teste de Autenticação da API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Testar se backend está online
Write-Host "1. Testando conexão com backend..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3101/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✓ Backend está online!" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend não está respondendo. Certifique-se de que está rodando." -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Registrar usuário
Write-Host "2. Registrando novo usuário..." -ForegroundColor Yellow
$registerBody = @{
    email = "teste.$(Get-Random -Maximum 9999)@exemplo.com"
    password = "senha12345"
    firstName = "Usuário"
    lastName = "Teste"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    Write-Host "   ✓ Usuário registrado com sucesso!" -ForegroundColor Green
    Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
    $email = $registerResponse.user.email
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✗ Erro ao registrar: $($errorBody.message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Fazer login
Write-Host "3. Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = "senha12345"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    Write-Host "   ✓ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "   Token recebido (primeiros 50 chars): $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Gray
    $token = $loginResponse.token
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✗ Erro ao fazer login: $($errorBody.message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Obter perfil
Write-Host "4. Obtendo perfil do usuário..." -ForegroundColor Yellow
try {
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/me" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
        }

    Write-Host "   ✓ Perfil obtido com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($profileResponse.id)" -ForegroundColor Gray
    Write-Host "   Nome: $($profileResponse.firstName) $($profileResponse.lastName)" -ForegroundColor Gray
    Write-Host "   Email: $($profileResponse.email)" -ForegroundColor Gray
} catch {
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✗ Erro ao obter perfil: $($errorBody.message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Todos os testes passaram!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
```

Execute com:
```powershell
.\test-auth.ps1
```

## 🐛 Problemas Comuns

### Erro 404 - Not Found

**Problema:** Usando URL incorreta sem o prefixo `/api/v1/`

**Solução:**
- ❌ Errado: `http://localhost:3101/api/auth/register`
- ✅ Correto: `http://localhost:3101/api/v1/auth/register`

### Erro 500 - Internal Server Error

**Problema:** Banco de dados não configurado

**Solução:**
```powershell
# Rodar migrações do banco de dados
.\system-manager.ps1 migrate
```

### Erro 401 - Unauthorized

**Problema:** Token JWT inválido ou expirado

**Solução:** Faça login novamente para obter um novo token

### Backend não responde

**Problema:** Serviço não está rodando

**Solução:**
```powershell
# Verificar status
.\system-manager.ps1 status

# Ver logs
.\system-manager.ps1 logs backend

# Reiniciar
.\system-manager.ps1 restart
```

## 📚 Documentação Interativa

Acesse a documentação Swagger da API:

```
http://localhost:3101/api/docs
```

Esta interface permite testar todos os endpoints diretamente no navegador!
