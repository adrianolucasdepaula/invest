# 🔧 Guia de Correção Rápida - Problemas Resolvidos

Este guia resolve **todos os problemas** identificados no sistema.

## 📋 Problemas Identificados e Soluções

### ❌ Problema 1: Arquivo `backend/.env` não existe
**Causa:** Arquivos `.env` não são commitados no git (contêm informações sensíveis)

**✅ Solução Automática:**
```powershell
.\system-manager.ps1 start
# O script agora cria automaticamente o .env se não existir
```

**✅ Solução Manual:**
```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env  # Configurar credenciais se necessário
```

---

### ❌ Problema 2: Erro 500 ao registrar usuário
**Causa:** Tabelas do banco de dados não foram criadas

**✅ Solução Automática:**
```powershell
.\system-manager.ps1 start
# Agora executa migrações automaticamente após iniciar
```

**✅ Solução Manual:**
```powershell
.\system-manager.ps1 migrate
```

---

### ❌ Problema 3: Erro 404 no Google OAuth
**Causa:** URL incorreta sem o prefixo `/v1/`

**✅ URLs Corretas:**
```
❌ Errado:  http://localhost:3101/api/auth/google
✅ Correto: http://localhost:3101/api/v1/auth/google
```

**✅ Solução Automática:**
```powershell
.\fix-env.ps1
# Corrige automaticamente as URLs no backend/.env
```

---

### ❌ Problema 4: Comando `curl` não funciona no PowerShell
**Causa:** PowerShell tem sintaxe diferente do Unix

**✅ Solução:** Use `Invoke-RestMethod` (comandos nativos do PowerShell)

```powershell
# ❌ Não use curl com sintaxe Unix
curl -X POST http://localhost:3101/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com"}'

# ✅ Use Invoke-RestMethod
$body = @{
    email = "teste@exemplo.com"
    password = "senha123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

## 🚀 Solução Completa em 3 Passos

### Passo 1: Puxar as atualizações do repositório

```powershell
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF
```

### Passo 2: Corrigir configurações automaticamente

```powershell
# Corrigir backend/.env
.\fix-env.ps1
```

### Passo 3: Reiniciar o sistema

```powershell
# Parar tudo
.\system-manager.ps1 stop

# Limpar containers antigos (OPCIONAL - só se tiver problemas)
docker-compose down -v

# Iniciar novamente
.\system-manager.ps1 start
```

---

## 🧪 Testar Tudo

### Teste Automatizado Completo

```powershell
# Executa todos os testes de autenticação
.\test-auth.ps1
```

Este script testa:
- ✅ Conexão com backend
- ✅ Registro de usuário
- ✅ Login
- ✅ Obtenção de perfil

### Testes Manuais

#### 1. Registrar Usuário

```powershell
$registerBody = @{
    email = "seu.email@exemplo.com"
    password = "senha12345"
    firstName = "Seu Nome"
    lastName = "Sobrenome"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $registerBody

# Resultado esperado: user + token
$response
```

#### 2. Fazer Login

```powershell
$loginBody = @{
    email = "seu.email@exemplo.com"
    password = "senha12345"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

# Salvar token
$token = $loginResponse.token
Write-Host "Token: $token"
```

#### 3. Obter Perfil

```powershell
Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/me" `
    -Method Get `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

#### 4. Google OAuth

```powershell
# Abrir no navegador
Start-Process "http://localhost:3101/api/v1/auth/google"
```

---

## 📚 Documentação e Recursos

### Swagger UI (Documentação Interativa)

```powershell
Start-Process "http://localhost:3101/api/docs"
```

### Verificar Status do Sistema

```powershell
.\system-manager.ps1 status
```

### Ver Logs

```powershell
# Logs do backend
.\system-manager.ps1 logs backend

# Logs de todos os serviços
.\system-manager.ps1 logs
```

### Health Check

```powershell
.\system-manager.ps1 health
```

---

## 🔍 Resolução de Problemas

### Backend não responde

```powershell
# Ver logs
docker logs invest_backend --tail 50

# Reiniciar
docker-compose restart backend

# Ou usar o system-manager
.\system-manager.ps1 restart
```

### Erro "relation already exists" nas migrações

**Isso é normal!** Significa que as tabelas já foram criadas.

### Erro 401 - Unauthorized

Token expirado ou inválido. Faça login novamente.

### Erro 500 - Internal Server Error

```powershell
# Ver logs detalhados
docker logs invest_backend --tail 100

# Verificar se migrações rodaram
.\system-manager.ps1 migrate
```

---

## 📋 Todos os Endpoints Disponíveis

| Método | Rota | Descrição | Rate Limit |
|--------|------|-----------|------------|
| POST | `/api/v1/auth/register` | Registrar usuário | 3 req/hora |
| POST | `/api/v1/auth/login` | Login | 5 req/5min |
| GET | `/api/v1/auth/google` | Iniciar OAuth Google | Padrão |
| GET | `/api/v1/auth/google/callback` | Callback Google | Padrão |
| GET | `/api/v1/auth/me` | Perfil (requer JWT) | Padrão |

---

## ✅ Checklist Final

Após executar todos os passos, verifique:

- [ ] `backend/.env` existe e tem as URLs corretas
- [ ] Backend está rodando: `docker ps | findstr invest_backend`
- [ ] Migrações executadas com sucesso
- [ ] Registro de usuário funciona: `.\test-auth.ps1`
- [ ] Login funciona
- [ ] Obter perfil funciona
- [ ] Google OAuth abre a tela de login (se configurado)

---

## 🆘 Precisa de Ajuda?

### Scripts Disponíveis

```powershell
# Corrigir .env automaticamente
.\fix-env.ps1

# Testar autenticação
.\test-auth.ps1

# Gerenciar sistema
.\system-manager.ps1 start|stop|restart|status|health|migrate|logs
```

### Arquivos de Documentação

- `TESTE_API_POWERSHELL.md` - Guia completo de testes
- `CORRECAO_RAPIDA.md` - Este arquivo
- `README.md` - Documentação geral do projeto

### URLs Importantes

- **Frontend:** http://localhost:3100
- **Backend:** http://localhost:3101
- **API Docs:** http://localhost:3101/api/docs
- **PgAdmin:** http://localhost:5150 (perfil dev)
- **Redis UI:** http://localhost:8181 (perfil dev)

---

## 🎉 Tudo Funcionando?

Se todos os testes passaram, você está pronto para usar o sistema!

**Próximos passos:**

1. Explorar a documentação Swagger
2. Criar seu primeiro portfólio
3. Experimentar as análises de ativos
4. Configurar Google OAuth (opcional)

Bom desenvolvimento! 🚀
