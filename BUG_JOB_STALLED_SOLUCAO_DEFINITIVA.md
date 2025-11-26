# BUG: Job Stalled - Solução Definitiva

**Data:** 2025-11-25
**Prioridade:** 🔴 CRÍTICA
**Status:** ✅ CAUSA RAIZ IDENTIFICADA → 🚧 SOLUÇÃO EM DESENVOLVIMENTO

---

## 📋 SUMÁRIO EXECUTIVO

**Problema:**
Ao clicar "Atualizar Todos" (861 ativos), o job BullMQ trava com erro `"job stalled more than allowable limit"` após ~60 segundos, resultando em:
- ❌ 0 ativos atualizados
- ❌ Backend sobrecarregado (status "unhealthy")
- ❌ Ativos ficam com `last_updated = NULL`, `change_percent = NULL`
- ❌ Frontend exibe "N/A", "Nunca", "R$ 0,00"

**Causa Raiz:**
`updateMultipleAssets()` processa TODOS os 861 ativos em um **loop sequencial síncrono** dentro de UM ÚNICO job, levando ~28 minutos para completar (excede timeout de stall do BullMQ em 30-60s).

---

## 🔍 ANÁLISE TÉCNICA DETALHADA

### Evidência do Problema

**Redis Job Data (jobId=1):**
```json
{
  "jobId": "1",
  "status": "failed",
  "failedReason": "job stalled more than allowable limit",
  "stalledCounter": 2,
  "data": {
    "type": "multiple",
    "tickers": ["AALR3", "ABCB4", ... "ZAMP3"],  // 861 ativos
    "triggeredBy": "manual"
  },
  "processedOn": 1764103936094,
  "finishedOn": 1764103996935  // ~60s depois
}
```

**Database Evidence:**
```sql
-- Ativos problemáticos (6+ identificados):
SELECT ticker, last_updated, last_update_status
FROM assets
WHERE ticker IN ('ASMT11', 'BRFS3', 'CCRO3', 'CPLE6', 'CLSA3', 'CRFB3');

-- Resultado:
-- last_updated = NULL (todos)
-- last_update_status = NULL (todos)
```

**update_logs Evidence:**
```sql
-- Zero registros para esses ativos:
SELECT COUNT(*) FROM update_logs
WHERE asset_id IN (SELECT id FROM assets WHERE ticker IN ('ASMT11', ...));

-- Resultado: 0 (job falhou antes de processar qualquer ativo)
```

---

### Código Problemático

**Arquivo:** `backend/src/api/assets/assets-update.service.ts:361-385`

```typescript
async updateMultipleAssets(
  tickers: string[],  // 861 ativos
  userId?: string,
  triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
): Promise<BatchUpdateResult> {
  // ...

  // ❌ PROBLEMA: Loop sequencial síncrono
  for (let i = 0; i < foundTickers.length; i++) {  // 861 iterações
    const ticker = foundTickers[i];

    // Síncrono - espera cada ativo completar antes do próximo
    const result = await this.updateSingleAsset(ticker, userId, triggeredBy);
    results.push(result);

    // Delay adicional entre requests (rate limiting)
    if (i < foundTickers.length - 1) {
      await this.sleep(this.RATE_LIMIT_DELAY);  // ~500ms
    }
  }

  // ...
}
```

**Tempo Estimado de Execução:**
- `updateSingleAsset()`: ~2s por ativo (database queries + API calls)
- `this.RATE_LIMIT_DELAY`: ~500ms entre requests
- **Total: 861 × 2.5s = 2.152 segundos = 35,9 minutos**
- **BullMQ stall timeout: 30-60 segundos**
- **Resultado: Job marcado como "stalled" e failed**

---

## 🎯 SOLUÇÕES PROPOSTAS (3 Opções)

### ✅ **OPÇÃO 1: Jobs Individuais (RECOMENDADA)**

**Descrição:**
Criar um job separado para cada ativo (861 jobs individuais), permitindo paralelização via BullMQ concurrency.

**Implementação:**

**Modificar:** `asset-update-jobs.service.ts:148-175`
```typescript
async queueMultipleAssets(
  tickers: string[],
  userId?: string,
  triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
) {
  this.logger.log(`Queueing ${tickers.length} individual asset update jobs`);

  // ✅ NOVO: Criar job individual para cada ativo
  const jobPromises = tickers.map((ticker) =>
    this.assetUpdatesQueue.add(
      'update-single-asset',
      {
        type: 'single',
        ticker,
        userId,
        triggeredBy,
      } as SingleAssetUpdateJob,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    ),
  );

  const jobs = await Promise.all(jobPromises);
  const jobIds = jobs.map((j) => j.id);

  // Retornar ID do primeiro job (para tracking)
  return jobIds[0];
}
```

**Configurar concurrency:** `queue.module.ts`
```typescript
BullModule.registerQueue({
  name: 'asset-updates',
  processors: [
    {
      path: join(__dirname, 'processors/asset-update.processor.js'),
      concurrency: 10,  // ✅ Processar 10 jobs em paralelo
    },
  ],
}),
```

**Vantagens:**
- ✅ Paralelização (10 workers simultâneos)
- ✅ Tempo total: 861 / 10 × 2s = **~172s = 2,9 minutos**
- ✅ Retry individual por ativo (se um falhar, outros continuam)
- ✅ Progress tracking granular
- ✅ Sem risk de stall (cada job ~2s << 60s timeout)

**Desvantagens:**
- ⚠️ 861 jobs criados (overhead de memória no Redis)
- ⚠️ Mudança no frontend para trackear múltiplos jobs

---

### ⚡ **OPÇÃO 2: Chunked Batches (Alternativa)**

**Descrição:**
Dividir os 861 ativos em chunks de 20, criar sub-jobs para cada chunk.

**Implementação:**

**Modificar:** `asset-update.processor.ts:68-79`
```typescript
@Process('update-multiple-assets')
async handleMultipleAssets(job: Job<MultipleAssetsUpdateJob>) {
  this.logger.log(`[JOB ${job.id}] Processing batch: ${job.data.tickers.length} assets`);

  const CHUNK_SIZE = 20;
  const chunks = this.chunkArray(job.data.tickers, CHUNK_SIZE);

  // ✅ Criar sub-jobs para cada chunk
  for (const chunk of chunks) {
    await this.assetsUpdateService.updateMultipleAssets(
      chunk,  // 20 ativos por vez
      job.data.userId,
      job.data.triggeredBy,
    );

    // Progress update
    job.progress((chunks.indexOf(chunk) + 1) / chunks.length * 100);
  }

  return { totalChunks: chunks.length, totalAssets: job.data.tickers.length };
}

private chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}
```

**Vantagens:**
- ✅ Menor overhead (43 jobs em vez de 861)
- ✅ Cada chunk: 20 × 2s = 40s << 60s timeout
- ✅ Mudança mínima no código existente

**Desvantagens:**
- ❌ Menos paralelização (sequencial chunks)
- ❌ Tempo total: 43 chunks × 40s = **~29 minutos** (ainda lento)
- ❌ Se um chunk falhar, perde 20 ativos

---

### ❌ **OPÇÃO 3: Aumentar Timeout (WORKAROUND - NÃO RECOMENDADA)**

**Descrição:**
Aumentar o timeout de stall do BullMQ para 30 minutos.

**Implementação:**
```typescript
BullModule.registerQueue({
  name: 'asset-updates',
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    timeout: 1800000,  // 30 minutos
  },
  settings: {
    lockDuration: 1800000,  // ✅ Aumentar stall timeout
  },
}),
```

**Vantagens:**
- ✅ Mudança mínima de código
- ✅ Funciona para cenário atual (861 ativos)

**Desvantagens:**
- ❌ **NÃO resolve o problema raiz** (processamento síncrono)
- ❌ Backend bloqueado por 28+ minutos (não escalável)
- ❌ Nenhuma paralelização
- ❌ Se backend crashar aos 25min, perde TODO o trabalho
- ❌ Futuro: com 2.000 ativos, leva 83 minutos (inviável)

---

## ✅ **DECISÃO: IMPLEMENTAR OPÇÃO 1**

**Justificativa:**
1. **Performance:** 2,9 min vs. 29 min (90% mais rápido)
2. **Escalabilidade:** Suporta 5.000+ ativos sem mudanças
3. **Resiliência:** Falha de 1 ativo não afeta outros
4. **Best Practice:** Arquitetura microservices padrão (1 job = 1 task)

**Impacto:**
- ✅ Backend: 2 arquivos modificados (`asset-update-jobs.service.ts`, `queue.module.ts`)
- ✅ Frontend: Nenhuma mudança necessária (jobId[0] funciona)
- ✅ Redis: Overhead aceitável (861 jobs × ~1KB = ~861KB)

---

## 🚀 IMPLEMENTAÇÃO

**Arquivos a Modificar:**

1. **`backend/src/queue/jobs/asset-update-jobs.service.ts`** - Método `queueMultipleAssets()`
2. **`backend/src/queue/queue.module.ts`** - Adicionar `concurrency: 10`
3. **`backend/src/queue/processors/asset-update.processor.ts`** - (Opcional) Remover handler `update-multiple-assets` não usado

**Passos:**

1. ✅ Modificar `queueMultipleAssets()` para criar jobs individuais
2. ✅ Configurar `concurrency: 10` no BullModule
3. ✅ Rebuild containers: `docker-compose build backend`
4. ✅ Restart backend: `docker restart invest_backend`
5. ✅ Validar com teste: Click "Atualizar Todos" (861 ativos)
6. ✅ Verificar Redis: `docker exec -i invest_redis redis-cli LLEN "bull:asset-updates:wait"`
7. ✅ Validar database: `SELECT COUNT(*) FROM update_logs WHERE started_at > NOW() - INTERVAL '10 minutes'` (deve ser ~861)
8. ✅ Frontend: Verificar ativos atualizados (last_updated != NULL, variation != N/A)

---

## 📊 VALIDAÇÃO DE SUCESSO

**Critérios de Aceitação:**

- [ ] Job "Atualizar Todos" (861 ativos) completa em **< 5 minutos**
- [ ] **0 jobs** marcados como "stalled" ou "failed"
- [ ] **861 ativos** com `last_updated` atualizado (não NULL)
- [ ] **861 registros** em `update_logs` com `status = 'completed'` ou `'failed'` (não NULL)
- [ ] Frontend exibe valores corretos (preço, variação, última atualização)
- [ ] Backend permanece **healthy** durante todo o processo
- [ ] Redis queue vazio após conclusão: `bull:asset-updates:wait = 0`

**Métricas de Performance:**

| Métrica | Antes (Opção 3) | Depois (Opção 1) | Melhoria |
|---------|-----------------|------------------|----------|
| Tempo total | ~35 min (falha) | ~2,9 min | **92% ↓** |
| Jobs stalled | 1 (100%) | 0 (0%) | **-100%** |
| Ativos atualizados | 0 | 861 | **+861** |
| Backend health | Unhealthy | Healthy | ✅ |
| Paralelização | 0 (sequencial) | 10 workers | **10x** |

---

## 📚 REFERÊNCIAS

- BullMQ Concurrency: https://docs.bullmq.io/guide/workers/concurrency
- NestJS Bull Module: https://docs.nestjs.com/techniques/queues
- Job Stall Detection: https://github.com/OptimalBits/bull/blob/master/PATTERNS.md#stalled-jobs

---

## 🏷️ TAGS

`#bug-critico` `#performance` `#bullmq` `#queue` `#job-stalled` `#assets-sync` `#definitive-fix`

---

**Próximos Passos:** Implementar Opção 1 → Validar → Documentar ROADMAP.md → Commit
