# 🐛 BUG CRÍTICO: Docker /dist Cache Problem (FASE 40)

**Data:** 2025-11-22 00:35 BRT
**Severidade:** 🔴 CRÍTICA
**Impacto:** Código modificado no source **NÃO é aplicado** no Docker
**Tempo Perdido:** ~2 horas de debugging
**Recorrência:** Problema crônico (ocorreu em fases anteriores)

---

## 📋 SINTOMAS

1. **Modificações no código TypeScript** (`*.ts`) **NÃO são aplicadas** no Docker
2. Erros persistem **mesmo após correções** aplicadas
3. `npm run build` **local** gera `/dist` mas Docker **NÃO recarrega**
4. `docker restart backend` **NÃO resolve** o problema
5. Stacktrace aponta para **linha antiga** do código compilado

---

## 🔍 CAUSA RAIZ

### Arquitetura do Problema

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE COMPILAÇÃO                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Desenvolvedor modifica: backend/src/market-data.service.ts
│ 2. Executa LOCAL:          cd backend && npm run build
│ 3. Código compilado para:  backend/dist/main.js (LOCAL)
│ 4. Docker volume mount:    ./backend:/app (COMPARTILHADO)
│ 5. Docker executa:         npm run start:dev → nest start --watch
│ 6. NestJS watch monitora:  /app/src/**/*.ts (detecta mudanças)
│ 7. NestJS recompila para:  /app/dist/main.js (DENTRO do Docker)
│                                                               │
│ ❌ PROBLEMA:                                                  │
│   - Build LOCAL gera: backend/dist/main.js (v1)             │
│   - Build DOCKER gera: /app/dist/main.js (v2)               │
│   - Volume mount SOBRESCREVE v2 com v1 (código antigo!)     │
└─────────────────────────────────────────────────────────────┘
```

### Por que acontece?

1. **Volume mount** compartilha **TODO** o diretório `./backend:/app`
2. Build **local** cria `backend/dist/` com código antigo
3. Restart do Docker **não limpa** o `/dist` montado
4. NestJS `--watch` **não recompila** porque detecta que `/dist` já existe

---

## ✅ SOLUÇÃO DEFINITIVA

### Opção 1: Rebuild DENTRO do Docker (Recomendado)

```powershell
# 1. Limpar dist DENTRO do container Docker
docker exec invest_backend rm -rf /app/dist

# 2. Rebuildar código DENTRO do container
docker exec invest_backend npm run build

# 3. Restart do container para aplicar mudanças
docker restart invest_backend

# 4. Aguardar 15-20s para inicialização completa
sleep 20

# 5. Testar novamente
curl -X POST http://localhost:3101/api/v1/market-data/sync-cotahist ...
```

### Opção 2: Rebuild Local + Remover Dist Docker

```powershell
# 1. Limpar dist local
cd backend && rm -rf dist

# 2. Rebuildar localmente
npm run build

# 3. Limpar dist do Docker
docker exec invest_backend rm -rf /app/dist

# 4. Copiar novo dist para Docker
docker cp ./backend/dist invest_backend:/app/dist

# 5. Restart
docker restart invest_backend
```

### Opção 3: Excluir /dist do Volume Mount (Arquitetural)

**ATENÇÃO:** Requer modificação do `docker-compose.yml`

```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./backend:/app
      - backend_node_modules:/app/node_modules  # ✅ Já existe
      - /app/dist  # ✅ ADICIONAR: Exclui /dist do volume mount
```

**Vantagens:**
- `/dist` será gerado APENAS dentro do Docker
- Evita conflito entre build local e Docker

**Desvantagens:**
- Perda de build local (não pode rodar `npm run build` localmente)
- Debug mais difícil (não consegue ver `/dist` localmente)

---

## 🛠️ SOLUÇÃO APLICADA (FASE 40)

**Problema:**
Erro `data.close.toFixed is not a function` em MGLU3 persistiu mesmo após:
- ✅ Adicionar validação `data.close != null`
- ✅ `npm run build` local (6x)
- ✅ `docker restart invest_backend` (7x)
- ✅ Limpar cache TypeScript (`rm tsconfig.tsbuildinfo`)
- ✅ Rebuildar container completo (`docker-compose build backend`)

**Solução que funcionou:**
```powershell
# Rebuild DENTRO do Docker
docker exec invest_backend rm -rf /app/dist
docker exec invest_backend npm run build
docker restart invest_backend
sleep 20
# ✅ Teste passou!
```

---

## 📝 EVIDÊNCIA DO PROBLEMA

### Stacktrace ANTES da correção

```log
[ERROR] Stack trace: TypeError: data.close.toFixed is not a function
    at MarketDataService.mergeCotahistBrapi (/app/dist/main.js:7078:98)
```

### Código Source APÓS correção

```typescript
// backend/src/api/market-data/market-data.service.ts:600
if (cotahistRecord && data.close != null && cotahistRecord.close != null) {
  const divergence = Math.abs((cotahistRecord.close - data.close) / cotahistRecord.close);

  if (divergence > 0.01) {
    this.logger.warn(
      `⚠️ Divergência ${(divergence * 100).toFixed(2)}% em ${date} (${ticker}): ` +
        `COTAHIST=${cotahistRecord.close.toFixed(2)}, BRAPI=${data.close.toFixed(2)}`,
    );
  }
}
```

### Código Compilado Docker (PERMANECEU ANTIGO)

```javascript
// /app/dist/main.js:7078 (ANTES do rebuild Docker)
// ❌ Não tinha validação data.close != null
data.close.toFixed(2)  // Causava erro quando data.close era null
```

---

## 🔄 WORKFLOW CORRETO (Metodologia Atualizada)

### Para TODA modificação de código TypeScript:

```powershell
# 1. Modificar código source
Edit-File backend/src/**/*.ts

# 2. Validar TypeScript localmente (0 erros obrigatório)
cd backend && npx tsc --noEmit

# 3. NÃO executar npm run build localmente (evita conflito)

# 4. Rebuild DENTRO do Docker
docker exec invest_backend rm -rf /app/dist
docker exec invest_backend npm run build

# 5. Restart do container
docker restart invest_backend

# 6. Aguardar inicialização (15-20s)
sleep 20

# 7. Testar endpoint/feature
curl -X POST http://localhost:3101/api/v1/...

# 8. Validar logs
docker logs invest_backend --tail 100
```

---

## 📊 CHECKLIST PRÉ-COMMIT (ATUALIZADO)

Adicionar ao `CHECKLIST_TODO_MASTER.md`:

```markdown
### Validação Docker /dist (OBRIGATÓRIO)

- [ ] **Limpar dist Docker:**
  ```powershell
  docker exec invest_backend rm -rf /app/dist
  ```

- [ ] **Rebuild DENTRO do Docker:**
  ```powershell
  docker exec invest_backend npm run build
  ```

- [ ] **Restart do container:**
  ```powershell
  docker restart invest_backend && sleep 20
  ```

- [ ] **Validar que código NOVO está sendo executado:**
  ```powershell
  # Adicionar log temporário com timestamp único
  # Verificar se log aparece após restart
  docker logs invest_backend --tail 50 | grep "UNIQUE_LOG_MARKER"
  ```

- [ ] **Testar feature/endpoint modificado:**
  ```powershell
  # Executar teste manual ou automatizado
  # Verificar que erro antigo NÃO aparece mais
  ```
```

---

## 📚 HISTÓRICO DE OCORRÊNCIAS

| Data       | Fase   | Sintoma                                   | Tempo Perdido | Solução Aplicada        |
|------------|--------|-------------------------------------------|---------------|-------------------------|
| 2025-11-22 | FASE 40 | `data.close.toFixed is not a function`   | ~2h           | Rebuild Docker /dist    |
| 2025-11-17 | FASE 35 | (Verificar ROADMAP.md)                    | ?             | (Verificar commits)     |
| 2025-11-15 | FASE 11 | (Verificar ROADMAP.md)                    | ?             | (Verificar commits)     |

**Ação:** Revisar histórico do Git para identificar TODAS as ocorrências:

```powershell
git log --all --grep="dist" --oneline
git log --all --grep="build" --grep="docker" --oneline
git log --all --grep="cache" --grep="restart" --oneline
```

---

## 🚀 MELHORIAS FUTURAS

### 1. Automatizar Rebuild Docker

Criar script `system-manager.ps1` atualizado:

```powershell
# system-manager.ps1 (ADICIONAR)

function Rebuild-DockerDist {
    Write-Host "🔄 Rebuilding Docker /dist..." -ForegroundColor Cyan

    docker exec invest_backend rm -rf /app/dist
    docker exec invest_backend npm run build
    docker restart invest_backend

    Write-Host "⏳ Aguardando inicialização (20s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20

    Write-Host "✅ Docker /dist rebuilt successfully!" -ForegroundColor Green
}

function Rebuild-Backend {
    Write-Host "🏗️  Full Backend Rebuild (Docker + Frontend)" -ForegroundColor Cyan

    # Backend
    Rebuild-DockerDist

    # Frontend (se necessário)
    cd frontend
    npm run build
    docker restart invest_frontend
    cd ..

    Write-Host "✅ Full rebuild completed!" -ForegroundColor Green
}
```

### 2. Adicionar Health Check no Docker

```yaml
# docker-compose.yml
services:
  backend:
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3101/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s  # Aguardar 20s antes de iniciar health checks
```

### 3. Adicionar Log de Versão no Startup

```typescript
// backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ ADICIONAR: Log de versão do build
  const buildTime = process.env.BUILD_TIME || 'unknown';
  const gitCommit = process.env.GIT_COMMIT || 'unknown';

  Logger.log(
    `🚀 Backend started - Build: ${buildTime}, Commit: ${gitCommit}`,
    'Bootstrap',
  );

  // ... resto do código
}
```

**Como configurar:**

```dockerfile
# Dockerfile (adicionar ARGs)
ARG BUILD_TIME
ARG GIT_COMMIT

ENV BUILD_TIME=${BUILD_TIME}
ENV GIT_COMMIT=${GIT_COMMIT}
```

```powershell
# docker-compose build com build args
docker-compose build --build-arg BUILD_TIME=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) backend
```

---

## 🎯 AÇÕES IMEDIATAS (FASE 40)

- [x] Documentar problema em `BUG_CRITICO_DOCKER_DIST_CACHE.md`
- [ ] Atualizar `CHECKLIST_TODO_MASTER.md` com validação /dist
- [ ] Atualizar `system-manager.ps1` com função `Rebuild-DockerDist`
- [ ] Testar MGLU3, WEGE3, RENT3 com solução aplicada
- [ ] Git commit documentação + correção

---

**✅ Este documento deve ser consultado SEMPRE que:**
1. Modificar código TypeScript backend
2. Erros persistirem após correções aplicadas
3. Stacktrace apontar para linha antiga do código
4. `docker restart` não resolver o problema

**🔗 Referências:**
- `CHECKLIST_TODO_MASTER.md` - Checklist completo pré-commit
- `CONTRIBUTING.md` - Convenções de código e Git workflow
- `TROUBLESHOOTING.md` - Problemas comuns (adicionar este bug)
