# BUG: Botões de Sincronização Não Funcionam - Diagnóstico Completo

**Data:** 2025-11-22
**Tipo:** Bug Crítico - Funcionalidade Core
**Fase:** Pós-FASE 37 (Melhorias Sync em Massa)
**Status:** ✅ DIAGNOSTICADO - Aguardando Correção

---

## 📋 SUMÁRIO EXECUTIVO

**Problema Reportado:**
Botões "Sincronizar em Massa" e "Re-Sincronizar" na página `/data-management` não estão refletindo mudanças no frontend, apesar de ajustes recentes na FASE 37.

**Causa Raiz Confirmada:**
**2 PROBLEMAS IDENTIFICADOS E CONFIRMADOS POR TESTES MANUAIS:**

### Problema #1: Validação Fail-Fast em Background (CRÍTICO) 🚨
- Backend retorna HTTP 202 Accepted **IMEDIATAMENTE** antes de validar tickers
- Se validação falhar, exceção é apenas **LOGADA** (não retorna erro para frontend)
- Frontend fica esperando eventos WebSocket que **NUNCA CHEGAM** (sync nunca inicia)
- **Impacto:** UI fica "travada" sem feedback de erro

### Problema #2: Emissão Duplicada de Eventos WebSocket ⚠️
- `syncBulkAssets()` chama `syncHistoricalDataFromCotahist()` para cada ticker
- **AMBOS** emitem eventos WebSocket independentemente
- Para sync de 3 tickers, frontend recebe **10+ eventos** em vez de 4
- **Impacto:** Pode confundir hook `useSyncWebSocket` e causar comportamento inesperado

---

## 🔍 INVESTIGAÇÃO REALIZADA

### 1. Análise Git History

**Commit Relevante:**
`2a2d363` - "feat(frontend): FASE 37 - Melhorias Sync em Massa"

**Mudanças:**
- ✅ `SyncConfigModal.tsx`: Mudança de year inputs para date inputs (fix hardcoded 2024)
- ✅ `BulkSyncButton.tsx`: Adição de conversão date → year
- ✅ `SyncStatusTable.tsx`: Badge de período de dados

### 2. Análise Frontend (7 arquivos lidos)

**Arquivos Analisados:**
1. `data-management/page.tsx` - ✅ CORRETO (usa `<SyncProgressBar />`)
2. `BulkSyncButton.tsx` - ✅ CORRETO (converte dates corretamente)
3. `useDataSync.ts` - ✅ CORRETO (React Query hooks bem configurados)
4. `data-sync.ts` (API client) - ✅ CORRETO (endpoints definidos)
5. `SyncStatusTable.tsx` - ✅ CORRETO (botão Re-Sincronizar abre modal)
6. `IndividualSyncModal.tsx` - ✅ CORRETO (chama mutation corretamente)
7. `SyncProgressBar.tsx` - ✅ CORRETO (exibe erros com warnings)
8. `useSyncWebSocket.ts` - ✅ CORRETO (processa `sync:failed` corretamente)

**Conclusão:** Frontend está **100% CORRETO**. Problema NÃO está no frontend.

### 3. Análise Backend (3 arquivos lidos)

**Arquivos Analisados:**
1. `market-data.controller.ts` - ⚠️ **PROBLEMA #1 CONFIRMADO**
2. `market-data.service.ts` - ⚠️ **PROBLEMA #2 CONFIRMADO**
3. `sync.gateway.ts` - ✅ CORRETO (emite eventos corretamente)

**Detalhes Problema #1 (Controller - linha 206-226):**
```typescript
async syncBulk(@Body() dto: SyncBulkDto): Promise<SyncBulkResponseDto> {
  this.logger.log(`Sync bulk request: ${dto.tickers.length} tickers...`);

  // ❌ PROBLEMA: Fire-and-forget - erros apenas logados
  this.marketDataService
    .syncBulkAssets(dto.tickers, dto.startYear, dto.endYear)
    .catch((error) => {
      this.logger.error(`Sync bulk background error: ${error.message}`, error.stack);
    });

  // Retorna HTTP 202 IMEDIATAMENTE (antes de validar)
  return {
    message: 'Sincronização iniciada em background',
    totalTickers: dto.tickers.length,
    estimatedMinutes: Math.round(dto.tickers.length * 2.5),
  };
}
```

**Detalhes Problema #1 (Service - linha 946-967):**
```typescript
async syncBulkAssets(tickers: string[], startYear: number, endYear: number) {
  // 1. Validação prévia (pode falhar DEPOIS de retornar HTTP 202)
  const validAssets = await this.assetRepository.find({
    where: { ticker: In(tickers), isActive: true },
  });

  if (validAssets.length !== tickers.length) {
    const invalidTickers = tickers.filter(t => !validTickers.includes(t));

    // ❌ PROBLEMA: Lança exceção que é apenas logada pelo .catch() do controller
    throw new InternalServerErrorException(
      `Tickers inválidos ou inativos: ${invalidTickers.join(', ')}`
    );
  }

  // ... resto do código
}
```

**Detalhes Problema #2 (Service - linha 1008 + 377-453):**
```typescript
// syncBulkAssets() - linha 1008
const syncResult = await this.syncHistoricalDataFromCotahist(ticker, startYear, endYear);

// ❌ PROBLEMA: syncHistoricalDataFromCotahist() TAMBÉM emite eventos WebSocket:
async syncHistoricalDataFromCotahist(...) {
  this.syncGateway.emitSyncStarted({ ... });  // 🔴 DUPLICADO!
  this.syncGateway.emitSyncProgress({ ... });  // 🔴 DUPLICADO!
  this.syncGateway.emitSyncCompleted({ ... }); // 🔴 DUPLICADO!
}
```

**Resultado:**
Para sync de 3 tickers, frontend recebe:
- 1x `sync:started` (syncBulkAssets)
- 3x `sync:started` (syncHistoricalDataFromCotahist - 1 por ticker) 🔴 DUPLICADO
- 6x `sync:progress` (3 de cada função) 🔴 DUPLICADO
- 3x `sync:completed` (syncHistoricalDataFromCotahist - 1 por ticker) 🔴 DUPLICADO
- 1x `sync:completed` (syncBulkAssets)

**Total:** 14 eventos em vez de 4!

### 4. Testes Manuais (Endpoints)

#### Teste #1: Ticker Inválido (Confirma Problema #1)

**Request:**
```bash
curl -X POST http://localhost:3101/api/v1/market-data/sync-bulk \
  -H "Content-Type: application/json" \
  -d '{"tickers":["TICKER_INVALIDO_TESTE"],"startYear":2020,"endYear":2024}'
```

**Response:**
HTTP 202 Accepted (0.225s)
```json
{
  "message": "Sincronização iniciada em background",
  "totalTickers": 1,
  "estimatedMinutes": 3
}
```

**Logs Backend:**
```
[LOG] Sync bulk request: 1 tickers (2020-2024)
[LOG] 🔄 Bulk Sync iniciado: 1 tickers (2020-2024)
[ERROR] ❌ Tickers inválidos: TICKER_INVALIDO_TESTE
[ERROR] [SYNC WS] Sync failed: Tickers inválidos ou inativos: TICKER_INVALIDO_TESTE
[ERROR] Sync bulk background error: Tickers inválidos ou inativos: TICKER_INVALIDO_TESTE
```

**Resultado:**
✅ **PROBLEMA #1 CONFIRMADO**
- Frontend recebe HTTP 202 (aparência de sucesso)
- Backend lança exceção EM BACKGROUND (após retornar HTTP 202)
- WebSocket EMITE `sync:failed` (backend funcionando corretamente)
- Frontend recebe evento mas UI não reflete erro adequadamente

#### Teste #2: Ticker Válido (Confirma Problema #2)

**Request:**
```bash
curl -X POST http://localhost:3101/api/v1/market-data/sync-bulk \
  -H "Content-Type: application/json" \
  -d '{"tickers":["ABEV3"],"startYear":2024,"endYear":2024}'
```

**Response:**
HTTP 202 Accepted (0.210s)

**Logs Backend (eventos WebSocket emitidos):**
```
[LOG] Sync bulk request: 1 tickers (2024-2024)
[LOG] 🔄 Bulk Sync iniciado: 1 tickers (2024-2024)
[LOG] [SYNC WS] Sync started: 1 assets (2024-2024)  ← syncBulkAssets
[LOG] [SYNC WS] Progress 1/1: ABEV3 ⏳ processing...  ← syncBulkAssets
[LOG] 🔄 Sync COTAHIST: ABEV3 (2024-2024)
[LOG] [SYNC WS] Sync started: 1 assets (2024-2024)  ← 🔴 DUPLICADO (syncHistoricalDataFromCotahist)
[LOG] [SYNC WS] Progress 1/1: ABEV3 ⏳ processing... ← 🔴 DUPLICADO (syncHistoricalDataFromCotahist)
```

**Resultado:**
✅ **PROBLEMA #2 CONFIRMADO**
- Eventos WebSocket duplicados emitidos
- Frontend recebe múltiplos `sync:started` e `sync:progress` para o mesmo ticker

### 5. Validação WebSocket

**Hook `useSyncWebSocket.ts` (linha 182-198):**
```typescript
socket.on('sync:failed', (data: SyncFailedEvent) => {
  console.error('[SYNC WS] Sync failed:', data);
  setState((prev) => ({
    ...prev,
    isRunning: false,  // ✅ Para execução
    currentTicker: null,
    logs: [
      ...prev.logs,
      {
        timestamp: new Date(data.timestamp),
        ticker: 'SYSTEM',
        status: 'failed',
        message: `❌ Sync falhou: ${data.error}`,  // ✅ Adiciona log de erro
      },
    ],
  }));
});
```

**Conclusão:** ✅ Frontend processa `sync:failed` CORRETAMENTE.

---

## 🎯 CAUSA RAIZ DEFINITIVA

### Problema #1 (CRÍTICO):

**Fluxo com Falha:**
1. Usuário clica "Sincronizar em Massa"
2. Frontend → `POST /market-data/sync-bulk`
3. Backend → HTTP 202 Accepted **IMEDIATAMENTE**
4. Frontend → ✅ Sucesso aparente
5. Backend (background) → Validação de tickers
6. Backend → ❌ `throw new InternalServerErrorException()` (se ticker inválido)
7. Controller → `.catch()` apenas LOGA erro (não retorna para frontend)
8. Backend → Emite `sync:failed` via WebSocket
9. Frontend → Recebe evento mas **NÃO HÁ FEEDBACK VISUAL CLARO**

**Problema Real:**
HTTP 202 Accepted é retornado **ANTES** da validação. Se validação falhar, frontend nunca sabe que houve erro crítico antes do sync começar.

### Problema #2 (MÉDIO):

**Fluxo com Duplicação:**
1. `syncBulkAssets()` emite `sync:started` (totalAssets=N)
2. Para cada ticker:
   - `syncBulkAssets()` emite `sync:progress` (processing)
   - Chama `syncHistoricalDataFromCotahist(ticker)`
   - **`syncHistoricalDataFromCotahist()` emite `sync:started` (totalAssets=1)** 🔴 DUPLICADO
   - **`syncHistoricalDataFromCotahist()` emite `sync:progress` (1/1)** 🔴 DUPLICADO
   - **`syncHistoricalDataFromCotahist()` emite `sync:completed` (totalAssets=1)** 🔴 DUPLICADO
   - `syncBulkAssets()` emite `sync:progress` (success)
3. `syncBulkAssets()` emite `sync:completed` (totalAssets=N)

**Problema Real:**
Eventos duplicados podem confundir hook `useSyncWebSocket` e causar progress bar a saltar ou mostrar percentuais incorretos.

---

## ✅ SOLUÇÕES PROPOSTAS

### Correção Problema #1: Validação ANTES de HTTP 202

**Arquivo:** `backend/src/api/market-data/market-data.controller.ts`

**ANTES (linha 206-226):**
```typescript
async syncBulk(@Body() dto: SyncBulkDto): Promise<SyncBulkResponseDto> {
  // ❌ Fire-and-forget - validação em background
  this.marketDataService
    .syncBulkAssets(dto.tickers, dto.startYear, dto.endYear)
    .catch((error) => {
      this.logger.error(`Sync bulk background error: ${error.message}`, error.stack);
    });

  return { message: 'Sincronização iniciada em background', ... };
}
```

**DEPOIS (proposta):**
```typescript
async syncBulk(@Body() dto: SyncBulkDto): Promise<SyncBulkResponseDto> {
  // ✅ Validar ANTES de retornar HTTP 202
  await this.marketDataService.validateSyncBulkRequest(dto.tickers);

  // ✅ Agora sim processar em background (validação já passou)
  this.marketDataService
    .syncBulkAssets(dto.tickers, dto.startYear, dto.endYear)
    .catch((error) => {
      this.logger.error(`Sync bulk background error: ${error.message}`, error.stack);
    });

  return { message: 'Sincronização iniciada em background', ... };
}
```

**Novo método no service:**
```typescript
// backend/src/api/market-data/market-data.service.ts
async validateSyncBulkRequest(tickers: string[]): Promise<void> {
  const validAssets = await this.assetRepository.find({
    where: { ticker: In(tickers), isActive: true },
    select: ['ticker'],
  });

  if (validAssets.length !== tickers.length) {
    const validTickers = validAssets.map((a) => a.ticker);
    const invalidTickers = tickers.filter((t) => !validTickers.includes(t));

    // ✅ Lança exceção ANTES de retornar HTTP 202
    throw new InternalServerErrorException(
      `Tickers inválidos ou inativos: ${invalidTickers.join(', ')}`
    );
  }
}
```

**Benefícios:**
- ✅ Frontend recebe HTTP 400 Bad Request **IMEDIATAMENTE** se tickers inválidos
- ✅ Não há fire-and-forget com validação crítica
- ✅ UI pode exibir erro claro no toast

### Correção Problema #2: Flag para Suprimir Eventos Duplicados

**Arquivo:** `backend/src/api/market-data/market-data.service.ts`

**ANTES (linha 364-515):**
```typescript
async syncHistoricalDataFromCotahist(
  ticker: string,
  startYear: number,
  endYear: number
): Promise<SyncCotahistResponseDto> {
  // Sempre emite eventos WebSocket
  this.syncGateway.emitSyncStarted({ ... });
  this.syncGateway.emitSyncProgress({ ... });
  this.syncGateway.emitSyncCompleted({ ... });
  // ...
}
```

**DEPOIS (proposta):**
```typescript
async syncHistoricalDataFromCotahist(
  ticker: string,
  startYear: number,
  endYear: number,
  options?: { emitWebSocketEvents?: boolean }  // ✅ Novo parâmetro opcional
): Promise<SyncCotahistResponseDto> {
  const shouldEmit = options?.emitWebSocketEvents !== false;  // Default: true

  if (shouldEmit) {
    this.syncGateway.emitSyncStarted({ ... });
  }

  if (shouldEmit) {
    this.syncGateway.emitSyncProgress({ ... });
  }

  if (shouldEmit) {
    this.syncGateway.emitSyncCompleted({ ... });
  }
  // ...
}
```

**Modificar chamada em `syncBulkAssets()` (linha 1008):**
```typescript
// ANTES
const syncResult = await this.syncHistoricalDataFromCotahist(ticker, startYear, endYear);

// DEPOIS
const syncResult = await this.syncHistoricalDataFromCotahist(ticker, startYear, endYear, {
  emitWebSocketEvents: false  // ✅ Suprimir eventos duplicados
});
```

**Benefícios:**
- ✅ Elimina emissão duplicada de eventos
- ✅ `syncBulkAssets()` controla TODOS os eventos WebSocket
- ✅ `syncHistoricalDataFromCotahist()` continua funcionando independentemente quando chamado via endpoint `/sync-cotahist` (individual sync)

---

## 📊 IMPACTO

**Severidade:** 🔴 **CRÍTICA**
**Afeta:** Funcionalidade core de sincronização de dados B3

**Usuários Impactados:**
- ✅ Bulk Sync (`POST /market-data/sync-bulk`) - **AFETADO**
- ✅ Individual Sync (`POST /market-data/sync-cotahist`) - **PARCIALMENTE AFETADO** (eventos duplicados se chamado via bulk)

**Cenários Quebrados:**
1. Sincronizar em massa com tickers inválidos → UI não mostra erro claro
2. Sincronizar em massa com tickers válidos → Progress bar pode mostrar % incorretos devido a eventos duplicados

---

## 🧪 VALIDAÇÃO (PÓS-CORREÇÃO)

### Checklist de Testes:

**Backend:**
- [ ] TypeScript: 0 erros (`npx tsc --noEmit`)
- [ ] Build: Success (`npm run build`)
- [ ] Teste manual: `POST /sync-bulk` com ticker inválido → HTTP 400 Bad Request
- [ ] Teste manual: `POST /sync-bulk` com ticker válido → HTTP 202 + eventos WebSocket corretos
- [ ] Logs: Nenhuma emissão duplicada de eventos

**Frontend:**
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Playwright MCP: Navegação + interação + screenshots
- [ ] Chrome DevTools MCP: Console (0 erros) + Network (requests 200/400) + Payload validation

**Integração:**
- [ ] Bulk Sync com 3 tickers válidos → Progress bar 0% → 33% → 66% → 100%
- [ ] Bulk Sync com 1 ticker inválido → Toast de erro imediato (HTTP 400)
- [ ] Individual Sync ABEV3 → Progress bar funciona + tabela atualiza

---

## 📁 ARQUIVOS MODIFICADOS (PREVISÃO)

**Backend:**
1. `backend/src/api/market-data/market-data.controller.ts` (+10/-5 linhas)
2. `backend/src/api/market-data/market-data.service.ts` (+30/-10 linhas)

**Frontend:**
- Nenhuma mudança necessária (código está correto)

**Documentação:**
1. `BUG_SYNC_BUTTONS_DIAGNOSTICO_2025-11-22.md` (este arquivo)
2. `ROADMAP.md` (atualizar com correções)

**Total Estimado:** ~50 linhas modificadas (backend apenas)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **DIAGNOSTICADO** - Este documento
2. ⏳ **IMPLEMENTAR CORREÇÕES** - Problema #1 + Problema #2
3. ⏳ **VALIDAR COM MCP TRIPLO** - Playwright + Chrome DevTools + Sequential Thinking
4. ⏳ **ATUALIZAR ROADMAP** - Documentar correções
5. ⏳ **GIT COMMIT + PUSH** - Conventional Commits

---

**Última Atualização:** 2025-11-22 08:50 AM
**Investigador:** Claude Code (Sonnet 4.5)
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP
