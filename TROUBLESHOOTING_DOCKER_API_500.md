# TROUBLESHOOTING: Docker Desktop API 500 Error

**Data:** 2026-01-04
**Severidade:** BLOCKER CRÍTICO
**Impacto:** 100% dos serviços parados, impossível testar

---

## Sintoma

```
request returned 500 Internal Server Error for API route and version
http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/containers/json
http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.52/version
http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.52/info
```

**TODOS os comandos Docker** retornam 500:
- `docker ps`
- `docker version`
- `docker info`
- `docker-compose ps`
- `system-manager.ps1 status`

---

## Diagnóstico Executado

### Check 1: Docker Desktop Processos ✅
```powershell
Get-Process 'Docker Desktop'
```

**Resultado:** 4 processos rodando (IDs: 7984, 13964, 20176, 22304)

### Check 2: Docker Service ❌
```powershell
Get-Service '*docker*'
```

**Resultado:**
```
Name: com.docker.service
Status: Stopped  ❌
StartType: Manual
```

### Check 3: Docker Daemon API ❌
```powershell
docker version
docker info
```

**Resultado:** 500 Internal Server Error em TODAS as chamadas

---

## Root Cause Analysis

**Problema:** Docker Desktop está rodando (UI), mas o **Docker Engine (daemon)** não está respondendo.

**Causas Prováveis:**

1. **WSL2 Backend Crashed**
   - Docker Desktop no Windows usa WSL2 como backend
   - WSL2 pode ter travado ou crashed
   - Named pipe `dockerDesktopLinuxEngine` não responde

2. **API Version Mismatch**
   - Docker CLI tentando v1.51/v1.52
   - Docker daemon pode estar em versão incompatível

3. **Docker Desktop Precisa Restart**
   - Estado corrupto após update ou crash
   - UI rodando mas engine parado

4. **Permissões / Firewall**
   - Named pipe bloqueado
   - Menos provável (funcionou antes)

---

## Soluções (Ordem de Prioridade)

### Solução 1: Restart Docker Desktop (RECOMENDADO - 90% de chance)

**Via UI:**
```
1. Clicar no ícone Docker Desktop (system tray/bandeja)
2. Clicar "Restart"
3. Aguardar 30-60 segundos
4. Verificar se ícone fica verde
5. Testar: docker ps
```

**Via PowerShell (como Admin):**
```powershell
# Matar todos processos Docker Desktop
Get-Process 'Docker Desktop' | Stop-Process -Force
Start-Sleep -Seconds 5

# Abrir Docker Desktop novamente
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30

# Verificar
docker ps
```

### Solução 2: Restart WSL2 (se Solução 1 falhar)

```powershell
# Como Admin
wsl --shutdown
Start-Sleep -Seconds 5
wsl

# Restart Docker Desktop
Get-Process 'Docker Desktop' | Stop-Process -Force
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30

docker ps
```

### Solução 3: Reinstall Docker Desktop (último recurso)

Se ambas acima falharem:
1. Desinstalar Docker Desktop
2. Reboot Windows
3. Baixar versão mais recente: https://www.docker.com/products/docker-desktop/
4. Reinstalar
5. Reboot novamente

---

## Após Docker Funcionar

### Iniciar Serviços

```powershell
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"

# Opção 1: system-manager
.\system-manager.ps1 start

# Opção 2: docker-compose diretamente
docker-compose up -d

# Verificar
.\system-manager.ps1 status
# Esperado:
# [✓] postgres está rodando
# [✓] redis está rodando
# [✓] backend está rodando
# [✓] frontend está rodando
```

### Health Check

```powershell
.\system-manager.ps1 health

# Ou manual:
curl http://localhost:3101/api/v1/health
curl http://localhost:3100/api/health
```

---

## Status Atual do Projeto

### ✅ Completado (Sem Docker)

| Tarefa | Status | Arquivo |
|--------|--------|---------|
| Fix BUG-BE-001 | ✅ COMPLETO | `scraper-config.service.ts` |
| Import ConflictException | ✅ COMPLETO | `scraper-config.service.ts:6` |
| TypeScript Validation | ✅ 0 ERROS | Backend validado |
| Build Backend | ✅ SUCESSO | `dist/` gerado |
| Plano Detalhado | ✅ CRIADO | `whimsical-roaming-canyon.md` |
| Relatórios Técnicos | ✅ 3 DOCS | FASE_155_*.md |

### ❌ Bloqueado (Requer Docker)

| Tarefa | Status | Bloqueador |
|--------|--------|------------|
| Test Drag & Drop | ❌ BLOQUEADO | Docker API 500 |
| Test Advanced Parameters | ❌ BLOQUEADO | Docker API 500 |
| Massive Test Suite (24 cenários) | ❌ BLOQUEADO | Docker API 500 |
| MCP Triplo | ❌ BLOQUEADO | Docker API 500 |
| Integration Testing | ❌ BLOQUEADO | Docker API 500 |

---

## Workaround Temporário (Se Docker Não Resolver)

### Opção A: Rodar Serviços Localmente (Sem Docker)

```bash
# Terminal 1: PostgreSQL local
# (precisa PostgreSQL 16 instalado)

# Terminal 2: Redis local
# (precisa Redis instalado)

# Terminal 3: Backend
cd backend
npm run start:dev

# Terminal 4: Frontend
cd frontend
npm run dev

# Atualizar .env com portas locais
```

**Desvantagem:** Precisa instalar PostgreSQL + Redis manualmente

### Opção B: Validar Apenas Código (Sem Testes)

```bash
# TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build
cd frontend && npm run build

# Lint
cd frontend && npm run lint

# Unit Tests (sem DB)
cd backend && npm run test

# Análise de Código
# - Revisar updatePriority() manualmente
# - Code review de ScraperCard.tsx
```

**Desvantagem:** Não valida se fix realmente funciona em runtime

---

## Próximos Passos (PRIORITÁRIO)

### Passo 1: REINICIAR DOCKER DESKTOP (MANUAL)

**Via UI (MAIS FÁCIL):**
```
1. Clicar ícone Docker na bandeja (system tray)
2. Clicar "Restart"
3. Aguardar ícone ficar verde (~30-60s)
```

**Ou via PowerShell como Admin:**
```powershell
Get-Process 'Docker Desktop' | Stop-Process -Force
Start-Sleep -Seconds 5
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Passo 2: Verificar Docker Funcionando

```powershell
# Aguardar 30s após restart

# Testar comando simples
docker ps

# Esperado: Lista de containers (pode estar vazia)
# Se ainda der 500: Ir para Solução 2 (WSL2 restart)
```

### Passo 3: Iniciar Serviços

```powershell
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"
.\system-manager.ps1 start
```

### Passo 4: Continuar Testes

Após serviços rodando:
1. Testar Drag & Drop (verificar se 409 sumiu)
2. Testar Advanced Parameters (manual)
3. Suite massiva de 24 cenários
4. MCP Triplo
5. Integration testing

---

## Timeline Esperado

```
Restart Docker Desktop:  2 min
Aguardar inicialização:  1 min
Iniciar serviços:        2 min
Health check:            1 min
TOTAL para desbloqueio:  6 minutos

Após desbloqueio:
- Testes massivos:       60 min
- MCP Triplo:            20 min
- Integration:           15 min
- Relatório final:       10 min
TOTAL testes:            105 minutos
```

---

## Documentos Criados Durante Sessão

1. **FASE_155_BUG_PARAMETROS_AVANCADOS.md**
   - Deep dive Bug #1 (Advanced Parameters)
   - 3 tentativas de fix via MCP documentadas

2. **FASE_155_VALIDACAO_FRONTEND_COMPLETA.md**
   - Validação completa com 110 network requests
   - 18 console messages analisadas
   - Root causes identificados

3. **FASE_155_SUMARIO_EXECUTIVO.md**
   - Executive summary para stakeholders
   - 2 bugs críticos documentados

4. **whimsical-roaming-canyon.md** (Plano)
   - 24 cenários de teste detalhados
   - Fixes propostos com código completo

5. **TROUBLESHOOTING_DOCKER_API_500.md** (Este arquivo)
   - Diagnóstico completo do Docker
   - Soluções step-by-step

---

## Status Final

**Fix BUG-BE-001:** ✅ IMPLEMENTADO e pronto para testar
**Fix BUG-FE-001:** ⏳ INVESTIGAÇÃO completa, teste manual pendente
**Testes:** ❌ BLOQUEADOS por Docker API 500
**Código:** ✅ VALIDADO (0 TypeScript errors, build OK)

**AÇÃO MANUAL REQUERIDA:** Restart Docker Desktop → Iniciar serviços → Continuar testes

---

**Próximo:** Após Docker funcionar, execute `.\system-manager.ps1 start` e me avise para continuar os testes massivos.
