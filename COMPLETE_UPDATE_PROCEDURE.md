# 🚀 Procedimento Completo - Atualização e Correção (Windows PowerShell)

**Objetivo:** Atualizar branch com correções de autenticação e iniciar sistema funcionando

**Branch:** `claude/continue-development-011CUw8hP5PSczzaKeJyY6KF`

**Últimas Correções Incluídas:**
- ✅ Google OAuth Login implementado
- ✅ Mapeamento de colunas User corrigido
- ✅ GoogleStrategy corrigida
- ✅ Registro e login com email/senha funcionando

---

## 📋 Pré-requisitos

Certifique-se de ter:
- ✅ Docker Desktop rodando no Windows
- ✅ PowerShell aberto como Administrador
- ✅ Git instalado

---

## 🔧 Procedimento Completo (Passo-a-Passo)

### **Passo 1: Abrir PowerShell como Administrador**

1. Pressione `Win + X`
2. Selecione **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
3. Clique em **"Sim"** na janela de confirmação

---

### **Passo 2: Navegar até o Diretório do Projeto**

```powershell
# Navegar para o diretório do projeto
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"

# Verificar se está no diretório correto
pwd
# Deve mostrar: C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web
```

---

### **Passo 3: Parar Containers Atuais (Se Estiverem Rodando)**

```powershell
# Parar todos os containers
.\system-manager.ps1 stop

# OU manualmente:
docker-compose down

# Aguarde mensagem: "✓ Todos os serviços foram parados"
```

---

### **Passo 4: Atualizar Código da Branch**

```powershell
# Verificar branch atual
git branch

# Deve mostrar: * claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# Atualizar código do repositório
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# Saída esperada:
# Updating 693e4f9..7980ca0
# Fast-forward
#  backend/src/api/auth/auth.module.ts         | 4 +---
#  backend/src/database/entities/user.entity.ts | 6 +++---
#  AUTH_FIX_TESTING_GUIDE.md                   | 300 +++++++++++++++++++++++++
#  BACKEND_CONTAINER_FIX.md                    | 235 +++++++++++++++++++
#  ...
```

**Se aparecer erro de conflito:**
```powershell
# Salvar mudanças locais (se houver)
git stash

# Atualizar novamente
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# Aplicar mudanças salvas (se necessário)
git stash pop
```

---

### **Passo 5: Verificar Commits Recebidos**

```powershell
# Ver últimos 5 commits
git log --oneline -5

# Deve mostrar:
# 7980ca0 docs: adicionar guia de correção para erro do container backend
# cf729a9 docs: adicionar guia de teste de correções de autenticação
# 78ba094 fix: corrigir mapeamento de colunas User e registro GoogleStrategy
# 693e4f9 docs: adicionar guia rápido de atualização Google OAuth
# dcf876b docs: atualizar procedimentos de setup com Google OAuth
```

---

### **Passo 6: Limpar Containers e Volumes Antigos (Recomendado)**

```powershell
# Remover containers e volumes antigos
docker-compose down -v

# ⚠️ Isso vai apagar dados do banco! Apenas para ambiente de desenvolvimento

# Saída esperada:
# Stopping invest_backend ... done
# Stopping invest_frontend ... done
# Stopping invest_postgres ... done
# Stopping invest_redis ... done
# Removing invest_backend ... done
# Removing invest_frontend ... done
# Removing invest_postgres ... done
# Removing invest_redis ... done
# Removing network invest_default
# Removing volume invest_postgres_data
# Removing volume invest_redis_data
```

---

### **Passo 7: Iniciar Sistema com System Manager**

```powershell
# Iniciar todos os serviços
.\system-manager.ps1 start
```

**O que vai acontecer:**

1. **Script detecta dependências:**
   ```
   📦 Verificando dependências...
   ⚠️  Detectado: node_modules desatualizado

   Deseja instalar/atualizar dependências? (y/n):
   ```
   **→ Digite: `y` e pressione Enter**

2. **Instalação de dependências:**
   ```
   📥 Instalando dependências do backend...
   npm install

   📥 Instalando dependências do frontend...
   npm install

   ✓ Dependências instaladas com sucesso!
   ```

3. **Build das imagens Docker:**
   ```
   🔨 Building Docker images...
   docker-compose build

   ✓ Build concluído!
   ```

4. **Iniciando serviços:**
   ```
   🚀 Iniciando serviços...
   Creating invest_postgres ... done
   Creating invest_redis    ... done
   Creating invest_backend  ... done
   Creating invest_frontend ... done

   ⏳ Aguardando serviços ficarem prontos...
   ✓ PostgreSQL ready
   ✓ Redis ready
   ✓ Backend ready (healthy)
   ✓ Frontend ready (healthy)
   ```

5. **Resultado final:**
   ```
   ====================================
   ✅ SISTEMA INICIADO COM SUCESSO!
   ====================================

   URLs de acesso:
     Frontend: http://localhost:3100
     Backend:  http://localhost:3101
     API Docs: http://localhost:3101/api/docs

   Status dos serviços:
     ✓ PostgreSQL: running (healthy)
     ✓ Redis:      running (healthy)
     ✓ Backend:    running (healthy)
     ✓ Frontend:   running (healthy)
   ```

---

### **Passo 8: Verificar se Tudo Está Funcionando**

#### **8.1 - Verificar Status dos Containers:**
```powershell
docker-compose ps
```

**Saída esperada:**
```
NAME                    STATUS
invest_backend          Up (healthy)
invest_frontend         Up (healthy)
invest_postgres         Up (healthy)
invest_redis            Up (healthy)
```

#### **8.2 - Testar Backend:**
```powershell
# Testar endpoint de health
curl http://localhost:3101/api/health

# OU usando PowerShell nativo:
Invoke-WebRequest -Uri http://localhost:3101/api/health | Select-Object -Expand Content
```

**Saída esperada:**
```json
{"status":"ok","timestamp":"2025-11-08T..."}
```

#### **8.3 - Testar Frontend:**
```powershell
# Abrir navegador
start http://localhost:3100/login
```

Deve abrir a página de login com:
- ✅ Campos de email e senha
- ✅ Botão "Entrar com Google"
- ✅ Sem erros no console do navegador

---

### **Passo 9: Testar Autenticação (Opcional)**

#### **9.1 - Testar Registro com Email/Senha:**

```powershell
# Criar usuário de teste
$body = @{
    email = "teste@example.com"
    password = "senha12345"
    firstName = "João"
    lastName = "Silva"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3101/api/auth/register `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Resposta esperada:** Status 201 Created com token JWT

#### **9.2 - Testar Login com Email/Senha:**

```powershell
# Login
$body = @{
    email = "teste@example.com"
    password = "senha12345"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3101/api/auth/login `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Resposta esperada:** Status 200 OK com token JWT

#### **9.3 - Testar Google OAuth:**

1. Acesse: http://localhost:3100/login
2. Clique em **"Entrar com Google"**
3. Complete o fluxo OAuth
4. Deve redirecionar para dashboard

---

## 📊 Verificar Logs (Se Houver Problemas)

### **Ver logs de todos os serviços:**
```powershell
docker-compose logs -f
```

### **Ver logs apenas do backend:**
```powershell
docker-compose logs -f backend
```

### **Ver logs apenas do frontend:**
```powershell
docker-compose logs -f frontend
```

### **Ver últimas 50 linhas do backend:**
```powershell
docker-compose logs backend --tail 50
```

**Pressione `Ctrl + C` para sair dos logs**

---

## ❌ Troubleshooting

### **Problema 1: "Dependências não instaladas"**

**Solução:**
```powershell
# Instalar manualmente
cd backend
npm install
cd ..\frontend
npm install
cd ..

# Reiniciar
.\system-manager.ps1 restart
```

---

### **Problema 2: "Backend container unhealthy"**

**Solução:**
```powershell
# Rebuild forçado
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

---

### **Problema 3: "Port 3100 or 3101 already in use"**

**Solução:**
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :3101

# Matar processo (substitua PID pelo número da última coluna)
taskkill /PID <PID> /F
```

---

### **Problema 4: "Docker não está rodando"**

**Solução:**
1. Abra **Docker Desktop**
2. Aguarde aparecer "Docker Desktop is running"
3. Execute novamente: `.\system-manager.ps1 start`

---

### **Problema 5: "Migration não executada"**

**Solução:**
```powershell
# Executar migration manualmente
docker-compose exec backend npm run migration:run
```

---

## 🔄 Comandos Úteis do System Manager

```powershell
# Iniciar sistema
.\system-manager.ps1 start

# Parar sistema
.\system-manager.ps1 stop

# Reiniciar sistema
.\system-manager.ps1 restart

# Ver status
.\system-manager.ps1 status

# Ver logs
.\system-manager.ps1 logs

# Limpar tudo (containers + volumes)
.\system-manager.ps1 clean
```

---

## 📚 Documentação de Referência

Após iniciar o sistema, consulte:

- **AUTH_FIX_TESTING_GUIDE.md** - Guia de testes de autenticação
- **BACKEND_CONTAINER_FIX.md** - Correção de problemas do backend
- **QUICK_UPDATE_GOOGLE_OAUTH.md** - Atualização rápida do Google OAuth
- **SETUP_GUIDE.md** - Guia completo de configuração

---

## ✅ Checklist Final

Marque conforme concluir:

- [ ] PowerShell aberto como Administrador
- [ ] Navegou até o diretório do projeto
- [ ] Parou containers antigos
- [ ] Executou `git pull` com sucesso
- [ ] Limpou containers e volumes (`docker-compose down -v`)
- [ ] Executou `.\system-manager.ps1 start`
- [ ] Respondeu `y` para instalar dependências
- [ ] Aguardou todos os serviços ficarem "healthy"
- [ ] Testou http://localhost:3100/login
- [ ] Testou http://localhost:3101/api/health
- [ ] Login com Google funciona
- [ ] Não há erros nos logs

---

## 🎯 Resumo do Procedimento

```powershell
# 1. Abrir PowerShell Admin e navegar
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"

# 2. Parar containers
.\system-manager.ps1 stop

# 3. Atualizar código
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# 4. Limpar tudo
docker-compose down -v

# 5. Iniciar sistema
.\system-manager.ps1 start
# → Digite 'y' quando perguntado sobre dependências

# 6. Aguardar e testar
start http://localhost:3100/login
```

---

**✅ Pronto! Seu ambiente está atualizado e rodando com todas as correções aplicadas!** 🎉

**Próximo passo:** Testar login com Google OAuth no navegador! 🚀
