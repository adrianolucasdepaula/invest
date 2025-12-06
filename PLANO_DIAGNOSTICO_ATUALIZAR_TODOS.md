# Plano de Diagnóstico: Botão "Atualizar Todos" - Página /assets

**Data:** 2025-12-05
**Problema:** O botão "Atualizar todos" na página /assets não estava funcionando corretamente
**Status:** ✅ RESOLVIDO

---

## RESUMO DA RESOLUÇÃO

### Causa Raiz Identificada
**Ponto de Falha B5:** Queue BullMQ estava **PAUSADA** no Redis.

### Diagnóstico
```powershell
# Comando que revelou o problema:
curl http://localhost:3101/api/v1/assets/bulk-update-status

# Resposta mostrava:
{"counts":{"waiting":0,"active":0,"completed":100,"failed":0,"delayed":0,"paused":1}}
#                                                                          ^^^^^^^^
#                                                                    Queue PAUSADA!
```

### Correção Aplicada
```powershell
# Remover chaves de pausa do Redis:
docker exec invest_redis redis-cli DEL "bull:asset-updates:meta-paused"
docker exec invest_redis redis-cli DEL "bull:asset-updates:paused"
```

### Validação Final (Chrome DevTools MCP)
- ✅ WebSocket conectado: `[ASSET BULK WS] Conectado ao WebSocket`
- ✅ Botão clicado com sucesso
- ✅ Batch iniciado: `[ASSET BULK WS] Batch update started`
- ✅ Assets sendo processados: `AALR3, ABEV3, AERI3, ABCP11, ABCB4, ADMF3...`
- ✅ Queue stats: `{"waiting":855,"active":6,"completed":100,"failed":0,"delayed":0,"paused":0}`

### Lição Aprendida
Adicionar verificação de queue pausada no endpoint `/bulk-update-status` com alerta visual no frontend.

---

## 1. FLUXO MAPEADO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO "ATUALIZAR TODOS"                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1] FRONTEND (page.tsx)                                                        │
│      │                                                                          │
│      ├─► handleSyncAll()                                                        │
│      │   ├─► Verifica bulkUpdateState.isRunning                                 │
│      │   ├─► api.getBulkUpdateStatus() - checa jobs pendentes                   │
│      │   └─► api.bulkUpdateAllAssetsFundamentals()                              │
│      │                                                                          │
│  [2] API CLIENT (api.ts)                                                        │
│      │                                                                          │
│      └─► POST /assets/updates/bulk-all                                          │
│                                                                                 │
│  [3] BACKEND CONTROLLER (assets-update.controller.ts)                           │
│      │                                                                          │
│      ├─► updateAllAssetsFundamentals()                                          │
│      │   ├─► assetsUpdateService.getAllActiveAssets()                           │
│      │   └─► assetUpdateJobsService.queueMultipleAssets(tickers)                │
│      │                                                                          │
│  [4] JOB SERVICE (asset-update-jobs.service.ts)                                 │
│      │                                                                          │
│      ├─► queueMultipleAssets()                                                  │
│      │   ├─► webSocketGateway.emitBatchUpdateStarted()                          │
│      │   ├─► LOOP: assetUpdatesQueue.add('update-single-asset', {ticker})       │
│      │   └─► monitorBatchCompletion() - background monitoring                   │
│      │                                                                          │
│  [5] BULLMQ QUEUE (Redis)                                                       │
│      │                                                                          │
│      └─► Jobs enfileirados (concurrency: 1)                                     │
│                                                                                 │
│  [6] PROCESSOR (asset-update.processor.ts)                                      │
│      │                                                                          │
│      ├─► handleSingleAsset()                                                    │
│      │   └─► assetsUpdateService.updateSingleAsset(ticker)                      │
│      │                                                                          │
│  [7] UPDATE SERVICE (assets-update.service.ts)                                  │
│      │                                                                          │
│      ├─► updateSingleAsset()                                                    │
│      │   ├─► scrapersService.scrapeFundamentalData(ticker)                      │
│      │   ├─► Save FundamentalData to DB                                         │
│      │   └─► webSocketGateway.emitAssetUpdate*()                                │
│      │                                                                          │
│  [8] SCRAPERS SERVICE (scrapers.service.ts)                                     │
│      │                                                                          │
│      ├─► scrapeFundamentalData()                                                │
│      │   ├─► Run 6 TypeScript scrapers                                          │
│      │   ├─► crossValidateResults()                                             │
│      │   ├─► IF discrepancy OR < 3 sources:                                     │
│      │   │   └─► runPythonFallbackScrapers() (FASE 72)                          │
│      │   └─► Return validated data                                              │
│      │                                                                          │
│  [9] WEBSOCKET (websocket.gateway.ts)                                           │
│      │                                                                          │
│      ├─► emitBatchUpdateStarted()                                               │
│      ├─► emitBatchUpdateProgress()                                              │
│      ├─► emitAssetUpdateStarted()                                               │
│      ├─► emitAssetUpdateCompleted()                                             │
│      ├─► emitAssetUpdateFailed()                                                │
│      └─► emitBatchUpdateCompleted()                                             │
│                                                                                 │
│ [10] FRONTEND HOOK (useAssetBulkUpdate.ts)                                      │
│      │                                                                          │
│      ├─► Conecta ao WebSocket                                                   │
│      ├─► Escuta eventos batch_update_*                                          │
│      ├─► Escuta eventos asset_update_*                                          │
│      ├─► Atualiza state (isRunning, progress, logs)                             │
│      └─► Poll getBulkUpdateStatus() a cada 10s                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ARQUIVOS CRÍTICOS

| Camada | Arquivo | Função |
|--------|---------|--------|
| Frontend | `frontend/src/app/(dashboard)/assets/page.tsx` | handleSyncAll(), UI do botão |
| Frontend | `frontend/src/lib/hooks/useAssetBulkUpdate.ts` | WebSocket hook, state management |
| Frontend | `frontend/src/lib/api.ts` | bulkUpdateAllAssetsFundamentals() |
| Backend | `backend/src/api/assets/assets-update.controller.ts` | POST /assets/updates/bulk-all |
| Backend | `backend/src/queue/jobs/asset-update-jobs.service.ts` | queueMultipleAssets(), monitoring |
| Backend | `backend/src/queue/processors/asset-update.processor.ts` | handleSingleAsset() |
| Backend | `backend/src/api/assets/assets-update.service.ts` | updateSingleAsset() |
| Backend | `backend/src/scrapers/scrapers.service.ts` | scrapeFundamentalData() |
| Backend | `backend/src/websocket/websocket.gateway.ts` | emitBatchUpdate*() |

---

## 3. PONTOS DE FALHA POTENCIAIS

### 3.1 Frontend

| # | Ponto | Verificação | Log Esperado |
|---|-------|-------------|--------------|
| F1 | handleSyncAll não dispara | Click event não conectado | Console: "handleSyncAll triggered" |
| F2 | bulkUpdateState.isRunning | Estado incorreto bloqueia | Console: "[ASSET BULK WS] state:" |
| F3 | getBulkUpdateStatus falha | API indisponível | Console: "Could not check queue status" |
| F4 | WebSocket desconectado | socket.io não conecta | Console: "[ASSET BULK WS] Desconectado" |
| F5 | api.bulkUpdateAllAssetsFundamentals falha | 4xx/5xx | Console: "Erro ao iniciar atualização" |

### 3.2 Backend

| # | Ponto | Verificação | Log Esperado |
|---|-------|-------------|--------------|
| B1 | Controller não recebe request | Rota incorreta | docker logs: "POST /assets/updates/bulk-all" |
| B2 | getAllActiveAssets() vazio | Query SQL falha | docker logs: "Found 0 active assets" |
| B3 | queueMultipleAssets() falha | Redis indisponível | docker logs: "Error queueing assets" |
| B4 | WebSocket emit falha | Gateway injection falha | docker logs: "[ERROR] Failed to emit" |
| B5 | Job processor não executa | Queue paused ou sem consumer | docker logs: "[JOB X] Started processing" |

### 3.3 Scrapers

| # | Ponto | Verificação | Log Esperado |
|---|-------|-------------|--------------|
| S1 | scrapeFundamentalData timeout | Scrapers lentos (>120s) | docker logs: "Scraper timeout" |
| S2 | Cross-validation falha | <3 fontes disponíveis | docker logs: "Low source count" |
| S3 | Python fallback falha | PYTHON_API_URL incorreto | docker logs: "Python fallback failed" |

### 3.4 Infraestrutura

| # | Ponto | Verificação | Log Esperado |
|---|-------|-------------|--------------|
| I1 | Redis offline | BullMQ não funciona | docker logs: "Redis connection refused" |
| I2 | PostgreSQL offline | Assets não carregam | docker logs: "Database error" |
| I3 | Backend unhealthy | Container crashado | docker ps: unhealthy |

---

## 4. PLANO DE LOGS DE DIAGNÓSTICO

### 4.1 Logs a Adicionar no Frontend

```typescript
// assets/page.tsx - handleSyncAll
const handleSyncAll = async () => {
  console.log('[DEBUG-SYNC] handleSyncAll triggered');
  console.log('[DEBUG-SYNC] bulkUpdateState:', bulkUpdateState);

  if (bulkUpdateState.isRunning) {
    console.log('[DEBUG-SYNC] BLOCKED: already running');
    // ...
  }

  try {
    console.log('[DEBUG-SYNC] Checking queue status...');
    const queueStatus = await api.getBulkUpdateStatus();
    console.log('[DEBUG-SYNC] Queue status:', queueStatus);

    console.log('[DEBUG-SYNC] Calling bulkUpdateAllAssetsFundamentals...');
    const result = await api.bulkUpdateAllAssetsFundamentals();
    console.log('[DEBUG-SYNC] API Response:', result);
  } catch (error: any) {
    console.error('[DEBUG-SYNC] ERROR:', error);
    // ...
  }
};
```

### 4.2 Logs a Adicionar no Backend

```typescript
// assets-update.controller.ts
async updateAllAssetsFundamentals(@Body('userId') userId?: string) {
  this.logger.log('[DEBUG-BULK] Endpoint hit: POST /assets/updates/bulk-all');

  const assets = await this.assetsUpdateService.getAllActiveAssets();
  this.logger.log(`[DEBUG-BULK] Active assets count: ${assets.length}`);

  const tickers = assets.map((asset) => asset.ticker);
  this.logger.log(`[DEBUG-BULK] First 5 tickers: ${tickers.slice(0, 5).join(', ')}`);

  const jobId = await this.assetUpdateJobsService.queueMultipleAssets(
    tickers,
    userId,
    UpdateTrigger.MANUAL,
  );
  this.logger.log(`[DEBUG-BULK] Queued with jobId: ${jobId}`);

  return { jobId, totalAssets: tickers.length, /* ... */ };
}
```

---

## 5. PROCEDIMENTO DE DIAGNÓSTICO

### Fase 1: Verificar Infraestrutura

```powershell
# 1. Status de todos containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Health do Redis
docker exec invest_redis redis-cli ping

# 3. Health do PostgreSQL
docker exec invest_postgres pg_isready

# 4. Logs do backend (últimas 50 linhas)
docker logs invest_backend --tail 50
```

### Fase 2: Testar API Diretamente

```powershell
# 1. Verificar status da queue
curl http://localhost:3101/api/v1/assets/bulk-update-status

# 2. Disparar bulk update manualmente
curl -X POST http://localhost:3101/api/v1/assets/updates/bulk-all \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Verificar jobs na queue após disparo
curl http://localhost:3101/api/v1/assets/bulk-update-status
```

### Fase 3: Validar Frontend

1. Abrir Chrome DevTools (F12)
2. Ir para aba Console
3. Filtrar por "DEBUG-SYNC" ou "ASSET BULK"
4. Clicar no botão "Atualizar Todos"
5. Observar logs

### Fase 4: Validar WebSocket

1. Chrome DevTools → Network → WS
2. Verificar conexão ao `ws://localhost:3101`
3. Clicar em "Atualizar Todos"
4. Observar mensagens WebSocket

---

## 6. CHECKLIST DE VALIDAÇÃO

- [x] Container backend está "healthy"
- [x] Redis responde "PONG"
- [x] PostgreSQL está pronto
- [x] GET /bulk-update-status retorna JSON válido
- [x] POST /bulk-all retorna 202 com jobId
- [x] Jobs aparecem na fila (waiting > 0 ou active > 0) - **855 waiting, 6 active**
- [x] WebSocket conectado (Console: "Conectado ao WebSocket")
- [x] Eventos WebSocket chegam (batch_update_started)
- [x] Progress bar aparece na UI
- [x] Logs de assets individuais aparecem

---

## 7. PRÓXIMOS PASSOS

1. **Executar Fase 1** - Verificar infraestrutura
2. **Executar Fase 2** - Testar API diretamente (sem frontend)
3. **Se API OK** → Problema está no frontend/WebSocket
4. **Se API FAIL** → Investigar backend/queue/scrapers
5. **Adicionar logs de diagnóstico** se necessário
6. **Documentar causa raiz** e correção

---

**Responsável:** Claude Code (Opus 4.5)
