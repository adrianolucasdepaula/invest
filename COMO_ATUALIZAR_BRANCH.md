# Como Atualizar Sua Branch Local

Este guia mostra o procedimento completo para atualizar sua branch local com todas as mudanças feitas.

## 📋 Procedimento Completo

### 1️⃣ Verificar Branch Atual

```powershell
# Verificar em qual branch você está
git branch

# Você deve estar em: claude/continue-development-011CUw8hP5PSczzaKeJyY6KF
```

### 2️⃣ Salvar Trabalho Local (se houver)

Se você tiver mudanças locais não commitadas:

```powershell
# Ver o status
git status

# Se houver mudanças, salve-as temporariamente
git stash save "Trabalho em progresso antes do pull"
```

### 3️⃣ Atualizar Branch Local

```powershell
# Buscar as últimas mudanças do repositório remoto
git fetch origin

# Atualizar sua branch local com as mudanças remotas
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF
```

**Resultado esperado:**
```
From http://...
 * branch            claude/continue-development-011CUw8hP5PSczzaKeJyY6KF -> FETCH_HEAD
Updating cc1f7f8..406cc01
Fast-forward
 TESTES_PLAYWRIGHT.md                     | 213 ++++++++++++++++++
 VERIFICACAO_AUTENTICACAO.md              | 354 ++++++++++++++++++++++++++++
 frontend/.env                            |  20 ++
 frontend/src/app/login/page.tsx          |   2 +-
 package-lock.json                        |  36 +++
 package.json                             |  15 ++
 playwright.config.js                     |  12 +
 test-frontend-auth.js                    | 142 +++++++++++
 tests/frontend-auth.spec.js              | 147 ++++++++++++
 9 files changed, 940 insertions(+), 1 deletion(-)
 create mode 100644 TESTES_PLAYWRIGHT.md
 create mode 100644 VERIFICACAO_AUTENTICACAO.md
 create mode 100644 frontend/.env
 create mode 100644 package-lock.json
 create mode 100644 package.json
 create mode 100644 playwright.config.js
 create mode 100644 test-frontend-auth.js
 create mode 100644 tests/frontend-auth.spec.js
```

### 4️⃣ Restaurar Trabalho Local (se aplicável)

Se você usou `git stash` no passo 2:

```powershell
# Ver o que foi salvo
git stash list

# Restaurar as mudanças
git stash pop
```

### 5️⃣ Verificar Arquivos Recebidos

```powershell
# Ver os arquivos que foram atualizados/criados
git log --oneline -5

# Ver as mudanças do último commit
git show HEAD

# Listar novos arquivos
ls
```

**Novos arquivos que você deve ter:**
- ✅ `VERIFICACAO_AUTENTICACAO.md` - Guia de verificação manual
- ✅ `TESTES_PLAYWRIGHT.md` - Guia de testes automatizados
- ✅ `frontend/.env` - Arquivo de configuração do frontend
- ✅ `playwright.config.js` - Configuração do Playwright
- ✅ `tests/frontend-auth.spec.js` - Testes automatizados
- ✅ `package.json` - Dependências do Playwright
- ✅ `package-lock.json` - Lock file

**Arquivo modificado:**
- ✅ `frontend/src/app/login/page.tsx` - Link de registro corrigido

---

## 🔧 Instalar Dependências

### Opção A: Usar NPM (se tiver NPM instalado localmente)

```powershell
# Instalar dependências do Playwright
npm install
```

### Opção B: Já está no Docker

Se você não tem NPM local e usa tudo via Docker, as dependências do Playwright são para executar testes localmente. Você pode ignorar por enquanto ou instalar dentro do container.

---

## 🔄 Reiniciar Ambiente (Aplicar Mudanças)

Após atualizar o código, você precisa reiniciar os serviços para aplicar as mudanças, especialmente o `frontend/.env` que foi criado.

### Método 1: Reiniciar Completo (Recomendado)

```powershell
# 1. Parar todos os serviços
.\system-manager.ps1 stop

# 2. Aguardar até todos os containers pararem
# (O script mostrará o progresso)

# 3. Iniciar todos os serviços novamente
.\system-manager.ps1 start

# 4. Aguardar até todos os serviços estarem saudáveis
# (Isso pode levar alguns minutos)
```

**Por que fazer isso?**
- O novo arquivo `frontend/.env` precisa ser carregado pelo container do frontend
- Garante que todas as configurações novas sejam aplicadas
- Limpa qualquer cache ou estado inconsistente

### Método 2: Reiniciar Apenas Frontend (Mais Rápido)

Se você só quer aplicar as mudanças do frontend:

```powershell
# Reiniciar apenas o container do frontend
docker-compose restart frontend

# Verificar logs
docker-compose logs -f frontend --tail=50
```

### Método 3: Rebuild Completo (Se Houver Problemas)

Se algo não estiver funcionando após o restart:

```powershell
# 1. Parar tudo
.\system-manager.ps1 stop

# 2. Remover containers e volumes (CUIDADO: isso apaga dados do banco!)
docker-compose down -v

# 3. Rebuild e start
docker-compose build --no-cache frontend
docker-compose build --no-cache backend
.\system-manager.ps1 start
```

⚠️ **ATENÇÃO:** O comando `docker-compose down -v` remove o banco de dados. Use apenas se tiver certeza!

### Verificar Serviços Após Restart

```powershell
# Ver status de todos os serviços
.\system-manager.ps1 status

# Ou usar docker-compose diretamente
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f backend frontend
```

**Saída esperada:**
```
NAME                         STATUS          PORTS
invest_backend               Up (healthy)    0.0.0.0:3101->3101/tcp
invest_frontend              Up              0.0.0.0:3100->3000/tcp
invest_postgres              Up (healthy)    0.0.0.0:5432->5432/tcp
invest_redis                 Up (healthy)    0.0.0.0:6379->6379/tcp
```

---

## 🧪 Testar as Mudanças

### Teste 1: Verificar Configuração do Frontend

```powershell
# Verificar se o frontend/.env foi criado
cat frontend/.env

# Deve mostrar:
# NEXT_PUBLIC_API_URL=http://localhost:3101/api
# NEXT_PUBLIC_WS_URL=http://localhost:3101
# NEXT_PUBLIC_OAUTH_URL=http://localhost:8000
# ...
```

### Teste 2: Verificar Sistema Rodando

```powershell
# Verificar status
.\system-manager.ps1 status

# Se não estiver rodando, iniciar
.\system-manager.ps1 start

# Aguardar até todos os serviços estarem saudáveis
```

### Teste 3: Testar Autenticação Manualmente

```powershell
# Abrir página de login no navegador
Start-Process "http://localhost:3100/login"

# Testar com usuário existente:
# Email: adriano.lucas.paula@gmail.com
# Senha: senha12345

# OU clicar em "Cadastre-se" para criar nova conta
```

**Verificar:**
- ✅ Link "Cadastre-se" agora leva para `/register` (estava como `#` antes)
- ✅ Login funciona e redireciona para dashboard
- ✅ Cookie `access_token` é criado (ver DevTools F12 > Application > Cookies)

### Teste 4: Executar Testes Automatizados (Opcional)

Se tiver instalado as dependências do Playwright:

```powershell
# Executar todos os testes
npx playwright test --reporter=list

# Ver os testes rodando (modo visual)
npx playwright test --headed

# Gerar relatório HTML
npx playwright test --reporter=html
npx playwright show-report
```

---

## 📊 O Que Foi Atualizado

### Commits Aplicados

#### Commit 1: `cc1f7f8`
**Título:** fix(frontend): corrigir link de registro e adicionar guia de verificação

**Mudanças:**
- Criado `frontend/.env` com URLs corretas
- Corrigido link "Cadastre-se" em `login/page.tsx`
- Criado `VERIFICACAO_AUTENTICACAO.md`

#### Commit 2: `406cc01`
**Título:** test: adicionar suite completa de testes Playwright para autenticação

**Mudanças:**
- Configuração do Playwright
- 7 testes automatizados de autenticação
- Documentação completa
- Dependências instaladas

### Correções Anteriores (já estavam na branch)

Estes commits já existiam na branch e já estão no seu repositório:
- `30845b2` - fix: corrigir endpoint de health check nos scripts PowerShell
- `81620cc` - fix(frontend): corrigir URLs de autenticação e integração com backend
- `3404a98` - feat: adicionar scripts de correção automática e testes completos
- `922fd50` - fix(auth): corrigir URLs do Google OAuth e adicionar guia de testes PowerShell

---

## 🚨 Possíveis Problemas

### Problema 1: Conflitos de Merge

Se aparecer conflitos ao fazer `git pull`:

```powershell
# Ver quais arquivos têm conflitos
git status

# Resolver manualmente cada arquivo
# Depois:
git add <arquivo-resolvido>
git commit -m "Resolve merge conflicts"
```

### Problema 2: Frontend/.env Sobrescrito

Se você já tinha um `frontend/.env` personalizado:

```powershell
# Fazer backup do seu .env atual ANTES do pull
cp frontend/.env frontend/.env.backup

# Depois do pull, comparar
diff frontend/.env frontend/.env.backup

# Mesclar as configurações necessárias manualmente
```

### Problema 3: Mudanças Locais Perdidas

Se você perdeu mudanças após o pull:

```powershell
# Ver o reflog
git reflog

# Recuperar estado anterior
git reset --hard HEAD@{1}

# Depois tente stash + pull novamente
```

---

## ✅ Checklist de Verificação

Após atualizar a branch, verifique:

- [ ] Branch está em `claude/continue-development-011CUw8hP5PSczzaKeJyY6KF`
- [ ] `git log` mostra commits `cc1f7f8` e `406cc01`
- [ ] Arquivo `frontend/.env` existe
- [ ] Arquivo `VERIFICACAO_AUTENTICACAO.md` existe
- [ ] Arquivo `TESTES_PLAYWRIGHT.md` existe
- [ ] Arquivo `playwright.config.js` existe
- [ ] Pasta `tests/` existe com `frontend-auth.spec.js`
- [ ] Sistema está rodando (`.\system-manager.ps1 status`)
- [ ] Login funciona no navegador (`http://localhost:3100/login`)
- [ ] Link "Cadastre-se" leva para `/register`

---

## 🎯 Comandos Rápidos - Resumo

```powershell
# 1. Verificar branch
git branch

# 2. Atualizar código
git fetch origin
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# 3. Verificar mudanças recebidas
git log --oneline -5
ls frontend/.env

# 4. REINICIAR AMBIENTE (IMPORTANTE!)
.\system-manager.ps1 stop
.\system-manager.ps1 start

# 5. Aguardar serviços ficarem saudáveis
.\system-manager.ps1 status

# 6. Testar no navegador
Start-Process "http://localhost:3100/login"

# 7. Executar testes automatizados (opcional)
npx playwright test
```

### Versão Completa Passo a Passo

```powershell
# Passo 1: Atualizar branch
git fetch origin
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# Passo 2: Parar ambiente atual
.\system-manager.ps1 stop

# Passo 3: Iniciar ambiente com novas configurações
.\system-manager.ps1 start

# Passo 4: Monitorar até ficar saudável
.\system-manager.ps1 status
# Aguarde até ver todos os serviços como "healthy"

# Passo 5: Testar autenticação
Start-Process "http://localhost:3100/login"
# Fazer login com: adriano.lucas.paula@gmail.com / senha12345
```

---

## 📞 Próximos Passos

Depois de atualizar a branch:

1. **Testar autenticação no navegador** seguindo o guia `VERIFICACAO_AUTENTICACAO.md`
2. **Executar testes Playwright** (opcional) seguindo o guia `TESTES_PLAYWRIGHT.md`
3. **Relatar problemas** se algo não funcionar conforme esperado
4. **Criar Pull Request** se tudo estiver funcionando e quiser mesclar com a branch principal

---

**Última atualização:** 2025-11-09
**Branch:** `claude/continue-development-011CUw8hP5PSczzaKeJyY6KF`
**Commits:** `cc1f7f8` → `406cc01`
