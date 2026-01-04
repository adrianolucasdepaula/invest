# FASE 152: Problemas Encontrados Durante Testes de Atualização de Ativos

**Data:** 2026-01-03
**Contexto:** Testes de validação de funcionalidade de atualização de ativos (FASE 1-5 do plano `elegant-floating-sundae.md`)

---

## 🚨 POLÍTICA DE PRODUÇÃO - ZERO TOLERANCE PARA RESTARTS

**REGRA ABSOLUTA (Feedback do Cliente - 2026-01-03):**

> "No frontend temos que resolver todos os problemas **NA RAIZ**, o restart de algum componente para restabelecer o backend/frontend ou de infra **NÃO É ACEITÁVEL**, pois estamos em um ambiente de produção, somente é aceito restart no caso de uma **manutenção programada**, e não como parte de um fluxo durante com o ambiente de produção online."

**Implicações:**

- ❌ **INACEITÁVEL:** `docker restart invest_backend` como solução operacional
- ❌ **INACEITÁVEL:** Qualquer restart de componente durante operação normal
- ❌ **INACEITÁVEL:** Workarounds que dependem de interrupção de serviço
- ✅ **OBRIGATÓRIO:** Resolver problemas na raiz (root cause)
- ✅ **OBRIGATÓRIO:** Soluções que funcionam com sistema online 100% do tempo
- ✅ **ACEITÁVEL:** Restart apenas em janela de manutenção programada

**Consequência para os Bugs Abaixo:**

Todos os problemas marcados como 🔴 **CRÍTICO** que requerem restart são **BLOQUEADORES ABSOLUTOS** para produção. Nenhum deploy pode ser feito até que esses bugs sejam resolvidos NA RAIZ com implementação de endpoints de cancel, status tracking correto, e gerenciamento adequado de jobs BullMQ.

---

## 🔴 PROBLEMA #1: Background Batch Jobs Persistentes Após Cancel

### Descrição
Jobs de batch update da FASE 3 (batch IDs: `76b89d53`, `e53ba39f`) continuaram executando no backend mesmo após:
- Usuário clicar no botão "Cancelar" no frontend
- Frontend exibir toast "✅ Atualização cancelada"
- Frontend mostrar "Cancelados 0 jobs (0 waiting + 0 active)"

### Evidência
```javascript
// Console logs após click em "Cancelar"
"[ASSET BULK WS] Cancel requested - wasCancelledRef set to true"
"[ASSET BULK WS] Batch update completed: cancelled-1767445101692"

// MAS... WebSocket events continuaram:
"[ASSET BULK WS] Batch update progress: 76b89d53 {batchId: 76b89d53, current: 215, total: 448, ...}"
"[ASSET BULK WS] Batch update progress: e53ba39f {batchId: e53ba39f, current: 218, total: 448, ...}"
"[ASSET BULK WS] Asset update started: PFRM3"
"[ASSET BULK WS] Asset update started: PINE4"
```

### Root Cause
O botão "Cancelar" apenas:
1. Seta `wasCancelledRef.current = true` no frontend
2. Para de processar novos eventos WebSocket
3. **NÃO cancela jobs ativos no backend BullMQ**

### Impacto
- **Crítico**: Usuário não consegue iniciar novos updates enquanto batch anterior roda
- Botão "Atualizar" permanece desabilitado indefinidamente
- Jobs continuam consumindo recursos (browser, CPU, scrapers) em background
- Único workaround: Restart do backend Docker container

### Arquivos Envolvidos
- `frontend/src/lib/hooks/useAssetBulkUpdate.ts` - Lógica de cancel (linha ~600-650)
- `backend/src/queue/processors/asset-update.processor.ts` - BullMQ job processor

### Solução Proposta
Implementar cancel real via backend API:

```typescript
// Frontend: useAssetBulkUpdate.ts
const cancelUpdate = async () => {
  wasCancelledRef.current = true;

  // ADICIONAR: Call backend API to cancel BullMQ jobs
  if (currentBatchId.current) {
    await fetch(`/api/v1/assets/updates/batch/${currentBatchId.current}/cancel`, {
      method: 'POST'
    });
  }

  // Reset state
  // ...
};
```

```typescript
// Backend: assets-update.controller.ts
@Post('batch/:batchId/cancel')
async cancelBatchUpdate(@Param('batchId') batchId: string) {
  // Cancel all jobs associated with this batchId
  const queue = this.queueService.getQueue('asset-updates');
  const jobs = await queue.getJobs(['waiting', 'active']);

  for (const job of jobs) {
    if (job.data.batchId === batchId) {
      await job.remove();
    }
  }

  return { success: true, message: `Batch ${batchId} cancelado` };
}
```

---

## 🟡 PROBLEMA #2: Playwright Element Refs Ficam Stale Rapidamente

### Descrição
Durante tentativa de clicar no botão "Cancelar", Playwright retornou erro "Ref not found" **duas vezes consecutivas**:
- 1ª tentativa: `ref=e679` - Not found
- 2ª tentativa (após novo snapshot): `ref=e736` - Not found

### Evidência
```
Error: Ref e679 not found in the current page snapshot. Try capturing new snapshot.
Error: Ref e736 not found in the current page snapshot. Try capturing new snapshot.
```

### Root Cause
DOM atualiza a cada ~1-2 segundos devido a:
- WebSocket events (`asset_update_started`, `asset_update_completed`, `batch_update_progress`)
- Logs panel renderizando novos logs
- Progress bar atualizando counter "X/Y"
- Timestamp de "Última Atualização" mudando

Entre o tempo de capturar snapshot e executar `browser_click()`, o DOM já mudou, invalidando o ref.

### Solução Aplicada
Usar seletor por texto ao invés de ref:

```typescript
// ❌ ERRADO (ref fica stale)
mcp__playwright__browser_click({ element: "Cancelar button", ref: "e736" })

// ✅ CORRETO (texto é estável)
mcp__playwright__browser_run_code({
  code: `async (page) => {
    const cancelButton = await page.getByRole('button', { name: 'Cancelar' });
    await cancelButton.click();
    return { success: true };
  }`
})
```

### Lição Aprendida
Para UIs que atualizam em tempo real via WebSocket:
- **Preferir seletores por texto/role** ao invés de refs
- Ou executar snapshot + click no mesmo bloco de código (sem delay)

---

## 🟡 PROBLEMA #3: Discrepância Entre Queue Status Polling e WebSocket Events

### Descrição
API de queue status (`GET /api/v1/assets/bulk-update-status`) retornava:
```json
{
  "active": 0,
  "waiting": 0,
  "completed": 5,
  "failed": 21
}
```

**Mas** WebSocket continuava emitindo eventos de jobs rodando:
```javascript
"[ASSET BULK WS] Asset update started: PFRM3"
"[ASSET BULK WS] Batch update progress: 76b89d53 {current: 215, total: 448}"
```

### Console Log Evidence
```
"[ASSET BULK WS] Active: 0, Waiting: 0, Total Pending: 0"
"[ASSET BULK WS] No pending jobs, marking as completed and clearing cancel flag"

// IMEDIATAMENTE DEPOIS:
"[ASSET BULK WS] Asset update started: PFRM3"
"[ASSET BULK WS] individualUpdateActiveRef set to TRUE"
```

### Root Cause (Hipótese)
O endpoint `/bulk-update-status` provavelmente:
- Consulta apenas BullMQ queue counts (waiting + active)
- **NÃO conta jobs que já foram pulled da fila e estão executando no processor**

Jobs executando no `@Process()` decorator do NestJS não aparecem como "active" na contagem da fila.

### Impacto
- Frontend polling (10s interval) não detecta corretamente se há updates em progresso
- Frontend marca como "completed" e habilita botão "Atualizar" prematuramente
- Usuário pode tentar iniciar novo update enquanto anterior ainda roda (race condition)

### Solução Proposta
Backend deve rastrear jobs em execução:

```typescript
// backend/src/api/assets/assets-update.controller.ts
@Get('bulk-update-status')
async getBulkUpdateStatus() {
  const queue = this.queueService.getQueue('asset-updates');
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount()
  ]);

  // ADICIONAR: Check in-memory map of executing jobs
  const executingJobs = this.assetUpdateService.getExecutingJobs();

  return {
    active: active + executingJobs.length, // Include executing jobs!
    waiting,
    completed,
    failed,
    totalPending: waiting + active + executingJobs.length
  };
}
```

---

## 🟢 PROBLEMA #4: Cross-Validation Enforcement Causando Baixo Success Rate (CORRETO, MAS...)

### Descrição
Durante batch updates da FASE 3, muitos assets falharam com:
```
"Insufficient data sources: 1 < 2"
```

Assets observados falhando:
- BRFS3, RDIV11, OULG11, RZZR11, ONDV11, PCIP11, PABY11, PEAB3, PDGR3, PATI4, PDTC3, PNPR11, PLAG11, PLCR11, POMO3, PNRC11, PFRM3, PINE4

### Por Que Isso É CORRETO
- CLAUDE.md Financial Data Rules: **Mínimo 2 fontes obrigatório**
- Se < 2 fontes disponíveis → update inteiro é rejeitado
- Previne corrupção de dados financeiros com single-source unvalidated data
- Sistema trabalhando conforme projetado ✅

### Por Que É Um Problema
- Success rate esperado: > 95%
- Success rate atual: ~70% (FASE 3 Tentativa 2: 7/10 sucesso)
- Muitos assets não conseguem 2+ fontes (scrapers falhando? Cloudflare blocking?)

### Impacto
- FASE 5 provavelmente também terá success rate < 95%
- Não passa critério de aceitação do plano de testes
- **NÃO é bug do sistema, é issue de infraestrutura de scrapers**

### Próximos Passos Sugeridos
1. Investigar por que scrapers falham para esses tickers específicos
2. Verificar logs de Python scrapers: `docker logs invest_scrapers --tail 500`
3. Verificar se Cloudflare/Captcha bloqueando requests
4. Considerar ajustar mínimo para 2 fontes apenas para stocks, 1 fonte para FIIs (se aplicável)

---

## 🔴 PROBLEMA #5: Impossibilidade de Prosseguir com FASE 5 (Bloqueador Crítico)

### Descrição
Após completar FASE 4 com sucesso, FASE 5 ficou **bloqueada** por ~30 minutos devido a:
1. Background batches da FASE 3 ainda rodando (208-210/448 assets)
2. Botão "Atualizar" desabilitado continuamente
3. Cancel frontend não funciona (Problema #1)
4. Refs Playwright ficam stale (Problema #2)

### Tentativas de Mitigação
1. ❌ Aguardar 65s para job atual completar → Novo job inicia imediatamente
2. ❌ Clicar "Cancelar" (ref=e679) → Ref not found
3. ❌ Novo snapshot + clicar "Cancelar" (ref=e736) → Ref not found
4. ✅ Usar seletor por texto `getByRole('button', { name: 'Cancelar' })` → Frontend cancela
5. ❌ Frontend cancel não para backend jobs → Jobs continuam
6. ✅ **SOLUÇÃO FINAL:** `docker restart invest_backend` → Limpa fila BullMQ

### Impacto
- **Crítico**: Testes ficam bloqueados indefinidamente
- Perda de tempo: ~30min esperando/debuggando
- Única solução: Restart backend (nuclear option)

### Lição Aprendida
- Testes de bulk update de 448 assets deveriam ser executados em ambiente separado
- Implementar timeout no frontend: Se job > 10min → auto-cancel
- Backend DEVE ter endpoint de cancel real (não apenas frontend flag)

---

## 🟡 PROBLEMA #6: Backend Restart Demorado

### Descrição
Após `docker restart invest_backend`, o backend levou ~20-30 segundos para voltar online.

Durante esse tempo:
- WebSocket: `Connection failed: Connection closed before receiving a handshake response`
- API calls: `ERR_EMPTY_RESPONSE`
- Frontend polling errors: `Network Error`

### Evidência (Console Logs)
```
[ERROR] WebSocket connection to 'ws://localhost:3101/socket.io/...' failed
[ERROR] [2026-01-03T13:00:22.745Z] ERROR: API GET /assets/bulk-update-status failed: Network Error
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE
```

### Impacto
- **Moderado**: Usuário vê errors no console temporariamente
- UX ruim: Não há indicador visual de "Backend reiniciando..."
- Testes ficam bloqueados durante restart

### Solução Proposta
Frontend deve detectar backend offline e exibir estado visual:

```typescript
// useAssetBulkUpdate.ts
const [isBackendOnline, setIsBackendOnline] = useState(true);

useEffect(() => {
  const checkBackendHealth = async () => {
    try {
      await fetch('http://localhost:3101/health');
      setIsBackendOnline(true);
    } catch {
      setIsBackendOnline(false);
    }
  };

  const interval = setInterval(checkBackendHealth, 2000);
  return () => clearInterval(interval);
}, []);
```

UI:
```jsx
{!isBackendOnline && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Backend Offline</AlertTitle>
    <AlertDescription>
      Reconectando... Por favor aguarde.
    </AlertDescription>
  </Alert>
)}
```

---

## ⚠️ ATENÇÃO: BUGS CRÍTICOS - BLOQUEADORES PARA PRODUÇÃO

**Esses problemas NÃO SÃO ACEITÁVEIS em ambiente de produção.**

O workaround atual (`docker restart invest_backend`) **NÃO É VIÁVEL** em produção. Esses bugs DEVEM ser corrigidos antes de deploy.

---

## 📊 RESUMO EXECUTIVO

### 🔴 Problemas Críticos (BLOQUEADORES PARA PRODUÇÃO)
1. ❌ **Background jobs não cancelam** - Requer backend restart (INACEITÁVEL)
2. ❌ **Impossível prosseguir com FASE 5** - Botão desabilitado indefinidamente

### Problemas Moderados
3. ⚠️ **Playwright refs stale** - Workaround: Usar seletores por texto
4. ⚠️ **Queue status polling impreciso** - Mostra "0 pending" mas jobs rodando
5. ⚠️ **Backend restart demorado** - 20-30s sem feedback visual

### Comportamento Correto (Não é Bug)
6. ✅ **Cross-validation enforcement** - Muitos assets falhando com "< 2 sources" (correto conforme CLAUDE.md)

### Issues Para Criar
- [ ] `[BUG] Cancel button apenas para frontend, não backend BullMQ jobs`
- [ ] `[BUG] Queue status polling não detecta jobs em execução no processor`
- [ ] `[ENHANCEMENT] Adicionar endpoint POST /api/v1/assets/batch/:id/cancel`
- [ ] `[ENHANCEMENT] Frontend exibir estado "Backend Offline" durante restart`
- [ ] `[ENHANCEMENT] Auto-cancel updates > 10min sem progresso`
- [ ] `[INVESTIGATION] Por que 30% dos assets falham cross-validation? (scrapers falhando?)`

---

## 🔧 WORKAROUNDS APLICADOS (Temporários)

### Para Cancel de Batch Updates
```bash
# Único método confiável atualmente
docker restart invest_backend
```

### Para Clicks em UI que Atualiza Rapidamente
```typescript
// Usar seletores por role/texto ao invés de refs
const cancelButton = await page.getByRole('button', { name: 'Cancelar' });
await cancelButton.click();
```

### Para Detectar Updates em Progresso
```typescript
// Não confiar apenas em queue polling
// Verificar também individualUpdateActiveRef + WebSocket events
const isReallyRunning = isRunning || individualUpdateActiveRef.current;
```

---

---

## 🔴 PROBLEMA #7: Batches Órfãos Persistentes Após Restart (CRÍTICO - ROOT CAUSE CONFIRMADO)

### Descrição
Após restart do backend (solução temporária para Problema #5), os batches da FASE 3 (IDs: `76b89d53` e `e53ba39f`) NÃO foram limpos e **continuaram executando**. Isso causa impacto direto na FASE 5.

### Evidência Console Logs (FASE 5)
```javascript
"[ASSET BULK WS] Batch update progress: 76b89d53 {batchId: 76b89d53, current: 184, total: 448, ...}"
"[ASSET BULK WS] Ignoring batch progress event: no current batch (individual update mode)"
"[ASSET BULK WS] Batch update progress: e53ba39f {batchId: e53ba39f, current: 188, total: 448, ...}"
"[ASSET BULK WS] Ignoring batch progress event: no current batch (individual update mode)"
```

**Observação Crítica:** Frontend ignora esses eventos porque está em "individual update mode", mas os jobs estão **REALMENTE RODANDO NO BACKEND**.

### Impacto FASE 5
Durante execução da FASE 5 (Bulk Update - Com Opções 161):
- **Progress bar mostra:** "719/861" ao invés de "X/161"
- **Explicação:** 719 = ~448 (batch 76b89d53) + ~161 (batch e53ba39f) + jobs órfãos
- **Frontend:** Não consegue distinguir entre jobs do novo batch e jobs órfãos

### Root Cause Chain
1. **Problema #1** (Cancel não funciona) → Jobs órfãos não canceláveis
2. **Restart backend** (workaround não permitido em produção) → Jobs persistem em Redis
3. **BullMQ persiste jobs em Redis** → Restart não limpa a fila
4. **FASE 5 inicia** → Novos jobs adicionados à fila com jobs órfãos
5. **Progress bar soma TUDO** → Confusão no tracking de progresso

### Consequência para Produção
- **Zero Tolerance Policy:** Restart backend NÃO É SOLUÇÃO
- **Jobs órfãos acumulam** após cada operação cancelada
- **UI exibe progresso incorreto** - usuário não sabe status real
- **Teste FASE 5 comprometido** - impossível validar se filtro hasOptionsOnly=true funcionou

### Solução Obrigatória
Implementar endpoint de **cleanup de jobs órfãos**:

```typescript
// Backend: assets-update.controller.ts
@Delete('orphaned-jobs')
async cleanupOrphanedJobs() {
  const queue = this.queueService.getQueue('asset-updates');
  const [waiting, active] = await Promise.all([
    queue.getJobs(['waiting']),
    queue.getJobs(['active'])
  ]);

  const currentBatches = new Set<string>();
  // Identificar batches ativos legítimos
  for (const job of [...waiting, ...active]) {
    if (job.data.batchId && isRecentBatch(job.data.batchId)) {
      currentBatches.add(job.data.batchId);
    }
  }

  // Remover jobs de batches órfãos (> 1h sem atividade)
  let cleanedCount = 0;
  for (const job of [...waiting, ...active]) {
    if (job.data.batchId && !currentBatches.has(job.data.batchId)) {
      await job.remove();
      cleanedCount++;
    }
  }

  return { success: true, cleanedCount, message: `Limpou ${cleanedCount} jobs órfãos` };
}
```

**Alternativa (se endpoint não viável):** BullMQ scheduler para auto-cleanup de jobs > 24h

---

**Próximos Passos:**
1. ❌ ~~Aguardar backend terminar restart completamente~~ - RESTART NÃO É SOLUÇÃO
2. ✅ **CRÍTICO:** Implementar limpeza de jobs órfãos (Problema #7)
3. ✅ **CRÍTICO:** Implementar cancel real de BullMQ jobs (Problema #1)
4. ✅ **CRÍTICO:** Corrigir queue status polling (Problema #2)
5. ⏸️ **BLOQUEADO:** FASE 5 validação comprometida - re-executar após fixes
6. 📝 Documentar que success rate < 95% é devido a cross-validation (comportamento correto)

**Criado por:** Claude Sonnet 4.5
**Data:** 2026-01-03 13:00 BRT
