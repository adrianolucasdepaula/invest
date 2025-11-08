# 🔄 Instalação Limpa - B3 AI Analysis Platform

**Última atualização:** 2025-11-06
**Versão:** 1.0
**Sistema:** Windows 10/11 com PowerShell

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Limpeza Completa](#limpeza-completa-opcional)
3. [Instalação do Zero](#instalação-do-zero)
4. [Primeiro Start](#primeiro-start)
5. [Verificação](#verificação)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Pré-requisitos

### Softwares Necessários

| Software | Versão Mínima | Download |
|----------|---------------|----------|
| **Docker Desktop** | 20.10+ | https://docs.docker.com/desktop/install/windows-install/ |
| **Node.js** | 20.x | https://nodejs.org/ |
| **Git** | 2.30+ | https://git-scm.com/download/win |
| **VS Code** (opcional) | Latest | https://code.visualstudio.com/ |

### Verificar Instalações

Abra o PowerShell e execute:

```powershell
# Docker
docker --version
docker-compose --version

# Node.js
node --version
npm --version

# Git
git --version
```

**Resultado esperado:**
```
Docker version 28.5.1, build e180ab8
Docker Compose version v2.40.0-desktop.1
v22.18.0
11.4.2
git version 2.43.0.windows.1
```

### Configurar Git (se necessário)

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"
```

---

## 🧹 Limpeza Completa (Opcional)

**⚠️ ATENÇÃO:** Este passo remove TUDO relacionado ao projeto. Use apenas se quiser começar do absoluto zero.

### Passo 1: Parar Containers Docker

```powershell
# Navegar para a pasta do projeto (se existir)
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"

# Parar todos os containers
docker-compose down -v

# OU se não estiver na pasta do projeto
docker stop invest_postgres invest_redis invest_backend invest_frontend invest_scrapers
docker rm invest_postgres invest_redis invest_backend invest_frontend invest_scrapers
```

### Passo 2: Remover Imagens Docker

```powershell
# Remover imagens do projeto
docker rmi invest_backend invest_frontend invest_scrapers

# Verificar
docker images | Select-String "invest"
# Não deve retornar nada
```

### Passo 3: Remover Volumes Docker (CUIDADO!)

```powershell
# Listar volumes
docker volume ls | Select-String "invest"

# Remover volumes (perde TODOS os dados!)
docker volume rm invest-claude-web_postgres_data
docker volume rm invest-claude-web_redis_data
docker volume rm invest-claude-web_pgadmin_data
```

### Passo 4: Remover Pasta do Projeto

```powershell
# Voltar para a pasta pai
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos"

# Remover pasta do projeto
Remove-Item -Path "invest-claude-web" -Recurse -Force

# Verificar que foi removida
Test-Path "invest-claude-web"
# Deve retornar: False
```

---

## 🚀 Instalação do Zero

### Passo 1: Navegar para a Pasta de Projetos

```powershell
# Criar pasta se não existir
New-Item -ItemType Directory -Force -Path "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos"

# Navegar
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos"

# Confirmar localização
pwd
```

**Resultado esperado:**
```
Path
----
C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos
```

### Passo 2: Clonar Repositório

```powershell
# Clonar (cria a pasta automaticamente)
git clone https://github.com/adrianolucasdepaula/invest.git invest-claude-web

# Verificar que foi criada
Test-Path "invest-claude-web"
# Deve retornar: True
```

**Saída esperada:**
```
Cloning into 'invest-claude-web'...
remote: Enumerating objects: 1543, done.
remote: Counting objects: 100% (1543/1543), done.
remote: Compressing objects: 100% (856/856), done.
remote: Total 1543 (delta 678), reused 1543 (delta 678)
Receiving objects: 100% (1543/1543), 2.45 MiB | 5.23 MiB/s, done.
Resolving deltas: 100% (678/678), done.
```

### Passo 3: Entrar na Pasta

```powershell
cd invest-claude-web

# Verificar que é um repositório Git
git status
```

**Resultado esperado:**
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

### Passo 4: Fazer Checkout do Branch de Desenvolvimento

```powershell
# Checkout no branch correto
git checkout claude/b3-ai-analysis-platform-011CUqhhHmDLCpG3Za3ppFeU

# Verificar branch
git branch --show-current
```

**Resultado esperado:**
```
branch 'claude/b3-ai-analysis-platform-011CUqhhHmDLCpG3Za3ppFeU' set up to track 'origin/claude/b3-ai-analysis-platform-011CUqhhHmDLCpG3Za3ppFeU'.
Switched to a new branch 'claude/b3-ai-analysis-platform-011CUqhhHmDLCpG3Za3ppFeU'
```

### Passo 5: Verificar Arquivos

```powershell
# Listar estrutura principal
ls

# Verificar que o script PowerShell existe
Test-Path "system-manager.ps1"
# Deve retornar: True

# Verificar Python scrapers
Test-Path "backend/python-scrapers/Dockerfile"
# Deve retornar: True
```

**Estrutura esperada:**
```
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        11/06/2025   3:45 PM                backend
d-----        11/06/2025   3:45 PM                database
d-----        11/06/2025   3:45 PM                docker
d-----        11/06/2025   3:45 PM                frontend
-a----        11/06/2025   3:45 PM           5432 .env.example
-a----        11/06/2025   3:45 PM           2847 .gitignore
-a----        11/06/2025   3:45 PM           8562 docker-compose.yml
-a----        11/06/2025   3:45 PM          18432 system-manager.ps1
-a----        11/06/2025   3:45 PM          15678 system-manager.sh
-a----        11/06/2025   3:45 PM          23456 README.md
```

---

## 🎯 Primeiro Start

### Passo 1: Executar System Manager

```powershell
# Executar script (pela primeira vez)
.\system-manager.ps1 start
```

### Passo 2: Responder às Perguntas

O script vai fazer perguntas interativas. Aqui está o que esperar:

#### 2.1 Verificação de Pré-requisitos
```
============================================
  Verificando Pré-requisitos
============================================

✓ Docker instalado: Docker version 28.5.1, build e180ab8
✓ Docker Compose instalado: Docker Compose version v2.40.0-desktop.1
✓ Docker daemon está rodando
✓ Node.js instalado: v22.18.0
✓ npm instalado: v11.4.2
```

#### 2.2 Verificação de Atualizações
```
============================================
  Verificando Atualizações
============================================

ℹ Branch atual: claude/b3-ai-analysis-platform-011CUqhhHmDLCpG3Za3ppFeU
ℹ Buscando atualizações do repositório remoto...
✓ Código já está atualizado
ℹ Commit atual: d64eea2 - feat: melhorar detecção de atualizações nos scripts
```

#### 2.3 Instalação de Dependências
```
============================================
  Verificando Dependências
============================================

⚠ Dependências do backend não estão instaladas
Deseja instalar as dependências agora? (y/n): y
```

**Responda:** `y` (sim)

**O que acontece:**
```
ℹ Instalando dependências...

Backend:
added 845 packages, and audited 846 packages in 1m
✓ Dependências do backend instaladas!

Frontend:
added 412 packages, and audited 413 packages in 45s
✓ Dependências do frontend instaladas!
```

**Tempo estimado:** 2-3 minutos (dependendo da internet)

#### 2.4 Build das Imagens Docker
```
============================================
  Verificando Imagens Docker
============================================

⚠ Imagem do backend não encontrada
⚠ Imagem do frontend não encontrada
⚠ Imagem dos scrapers não encontrada
Deseja fazer o build das imagens Docker agora? (y/n): y
```

**Responda:** `y` (sim)

**O que acontece:**
```
ℹ Pulling base images...
[+] Pulling...
 ✔ postgres Pulled
 ✔ redis Pulled

ℹ Building custom images...
[+] Building...
 => [backend] Building...                    45.2s
 => [frontend] Building...                   38.5s
 => [scrapers] Downloading Chrome...         15.3s
 => [scrapers] Installing ChromeDriver...    8.7s
 => [scrapers] Installing Python packages... 62.4s

✓ Imagens Docker criadas com sucesso!
```

**Tempo estimado:** 5-10 minutos (primeira vez)

#### 2.5 Iniciando Serviços
```
============================================
  Iniciando Serviços Docker
============================================

ℹ Iniciando containers (isso pode levar alguns minutos)...
[+] Running 5/5
 ✔ Container invest_postgres  Started
 ✔ Container invest_redis     Started
 ✔ Container invest_backend   Started
 ✔ Container invest_frontend  Started
 ✔ Container invest_scrapers  Started
```

#### 2.6 Health Checks
```
✓ PostgreSQL está saudável
✓ Redis está saudável
✓ Backend está saudável
✓ Frontend está saudável
ℹ Scrapers está rodando (sem health check)
```

#### 2.7 Sistema Pronto!
```
============================================
  Sistema Iniciado!
============================================

✓ Sistema iniciado com sucesso!

URLs de acesso:
  Frontend:  http://localhost:3100
  Backend:   http://localhost:3101
  API Docs:  http://localhost:3101/api/docs
  PgAdmin:   http://localhost:5150 (dev profile)
  Redis UI:  http://localhost:8181 (dev profile)
```

---

## ✅ Verificação

### Verificar Containers em Execução

```powershell
docker ps
```

**Resultado esperado:**
```
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
abc123def456   invest_frontend    Up 2 minutes   0.0.0.0:3100->3000/tcp   invest_frontend
def456ghi789   invest_backend     Up 2 minutes   0.0.0.0:3101->3101/tcp   invest_backend
ghi789jkl012   invest_scrapers    Up 2 minutes                            invest_scrapers
jkl012mno345   redis:7-alpine     Up 2 minutes   0.0.0.0:6479->6379/tcp   invest_redis
mno345pqr678   timescale/...      Up 2 minutes   0.0.0.0:5532->5432/tcp   invest_postgres
```

### Testar Endpoints

```powershell
# Backend Health
curl http://localhost:3101/health

# Frontend
curl http://localhost:3100
```

### Abrir no Navegador

Abra o navegador e acesse:

1. **Frontend:** http://localhost:3100
2. **API Docs:** http://localhost:3101/api/docs
3. **Backend Health:** http://localhost:3101/health

---

## 🔧 Troubleshooting

### Erro: "Execution Policy"

```
.\system-manager.ps1 : File cannot be loaded because running scripts is disabled on this system.
```

**Solução:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\system-manager.ps1 start
```

### Erro: "Docker daemon is not running"

```
✗ Docker daemon não está rodando
```

**Solução:**
1. Abra o Docker Desktop
2. Aguarde iniciar completamente
3. Execute novamente: `.\system-manager.ps1 start`

### Erro: "Port already in use"

```
Error: bind: address already in use
```

**Solução:**
```powershell
# Ver quem está usando a porta
netstat -ano | findstr :3100

# Matar o processo (substitua PID)
taskkill /PID 12345 /F

# Ou mudar a porta no docker-compose.yml
```

### Erro: "apt-key: not found" (Dockerfile)

```
/bin/sh: 1: apt-key: not found
```

**Solução:** Já corrigido! Faça `git pull` para obter a versão atualizada.

### Containers não ficam "healthy"

```
✗ Backend: DOWN
```

**Solução:**
```powershell
# Ver logs
.\system-manager.ps1 logs backend

# Ver logs em tempo real
docker-compose logs -f backend
```

### Build muito lento

**Causas comuns:**
- Internet lenta
- Antivírus escaneando arquivos
- Pouco espaço em disco

**Solução:**
```powershell
# Liberar espaço
docker system prune -a

# Build com mais verbosidade
docker-compose build --progress=plain
```

---

## 📊 Tempo Total Estimado

| Etapa | Tempo |
|-------|-------|
| Clone do repositório | 1-2 min |
| Instalação de dependências (npm) | 2-3 min |
| Build imagens Docker (primeira vez) | 5-10 min |
| Start dos containers | 1-2 min |
| **TOTAL** | **~10-17 min** |

---

## 🎯 Próximos Passos

Após instalação bem-sucedida:

1. **Desenvolvimento Diário:**
   ```powershell
   # Manhã
   .\system-manager.ps1 start

   # Noite
   .\system-manager.ps1 stop
   ```

2. **Ver Status:**
   ```powershell
   .\system-manager.ps1 status
   .\system-manager.ps1 health
   ```

3. **Ver Logs:**
   ```powershell
   .\system-manager.ps1 logs backend
   .\system-manager.ps1 logs frontend
   ```

4. **Atualizar Sistema:**
   ```powershell
   # Script detecta automaticamente e pergunta
   .\system-manager.ps1 start
   ```

5. **Rebuild após mudanças:**
   ```powershell
   .\system-manager.ps1 build
   .\system-manager.ps1 restart
   ```

---

## 📚 Documentação Adicional

- **Guia Completo:** `VSCODE_CLAUDE_CODE_GUIDE.md`
- **Scrapers Python:** `backend/python-scrapers/README.md`
- **README Principal:** `README.md`
- **Validação de Requisitos:** `REQUIREMENTS_VALIDATION_FINAL.md`

---

## 🆘 Suporte

Se encontrar problemas:

1. Consulte a seção [Troubleshooting](#troubleshooting) acima
2. Verifique logs: `.\system-manager.ps1 logs <service>`
3. Leia `VSCODE_CLAUDE_CODE_GUIDE.md` - seção 9 (Troubleshooting)
4. Verifique issues no GitHub

---

## ✅ Checklist Final

Antes de começar a desenvolver:

- [ ] Docker Desktop rodando
- [ ] Containers todos "Up" (`docker ps`)
- [ ] Frontend acessível: http://localhost:3100
- [ ] Backend health OK: http://localhost:3101/health
- [ ] API Docs carregando: http://localhost:3101/api/docs
- [ ] Nenhum erro nos logs (`.\system-manager.ps1 logs`)
- [ ] Git no branch correto (`git branch --show-current`)

**Se todos ✅ OK:** Sistema está pronto para uso! 🎉

---

**Última atualização:** 2025-11-06
**Versão do Documento:** 1.0
**Testado em:** Windows 11, Docker Desktop 28.5.1, Node.js 22.18.0
