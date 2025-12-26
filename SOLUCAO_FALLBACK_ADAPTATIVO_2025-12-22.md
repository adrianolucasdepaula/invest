# Solução: Python Fallback Adaptativo - 2025-12-22

## Análise: Scrapers Python Disponíveis

**Total:** 27 scrapers
**Públicos:** 17 (sem login)
**Privados:** 10 (requerem OAuth/login)

### Fundamental Analysis (5 scrapers)
- ✅ FUNDAMENTUS (público)
- ✅ STATUSINVEST (público)
- ✅ INVESTSITE (público)
- ⚠️ INVESTIDOR10 (privado - requer login)
- ✅ GRIFFIN (público)

### Market Data (4 scrapers - podem ter fundamentals)
- ✅ GOOGLEFINANCE (público)
- ⚠️ YAHOOFINANCE (privado)
- ⚠️ OPLAB (privado)
- ⚠️ KINVO (privado)

### Official Data (1 scraper)
- ✅ BCB (Banco Central - macroeconômicos)

### Total Potencial para Fundamentals: ~9 scrapers

---

## Problema da Implementação Atual

### Limitações Identificadas

```typescript
// scrapers.service.ts:208-256

const MAX_FALLBACK_ATTEMPTS = 3;  // ❌ HARDCODED - Muito limitado!

if (needsFallback) {
  // Roda 1 vez
  const pythonResults = await this.runPythonFallbackScrapers(ticker, neededSources);
  // Adiciona fontes
  // PARA (não tenta de novo)
}
```

**Problemas:**
1. ❌ Roda apenas **1 vez** (não é nem loop!)
2. ❌ Se Python retorna 0 fontes → Desiste
3. ❌ Não tenta outros scrapers se primeiro falha
4. ❌ Não faz retry em erros temporários (timeout, network)
5. ❌ Desperdiça 26 scrapers disponíveis (usa só ~3-5)

---

## Solução Proposta: Fallback Adaptativo + Retry + Circuit Breaker

### Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCRAPE ORCHESTRATION                          │
├─────────────────────────────────────────────────────────────────┤
│ Round 0: TypeScript (5 scrapers)                                │
│   → fundamentus, brapi, statusinvest, investidor10, investsite  │
│   → Resultado: N fontes TypeScript                              │
├─────────────────────────────────────────────────────────────────┤
│ Validação Inicial:                                              │
│   → sources >= 3? confidence >= 60%?                            │
│   → ✅ SIM: PARA                                                │
│   → ❌ NÃO: Ativa Fallback Adaptativo                           │
├─────────────────────────────────────────────────────────────────┤
│ Fallback Loop (Dinâmico):                                       │
│                                                                  │
│ Round 1: Python Tier 1 (Scrapers Públicos de Alta Qualidade)   │
│   → griffin, fundamentus(py), statusinvest(py), investsite(py)  │
│   → Exclude: Já tentados no TypeScript                          │
│   → Retry: 2x para erros temporários (timeout, 503, network)    │
│   → Circuit Breaker: Skip se 3 falhas consecutivas              │
│   → Resultado: +M fontes                                        │
│                                                                  │
│ Validação Round 1:                                              │
│   → sources >= 3? confidence >= 60%?                            │
│   → ✅ SIM: PARA                                                │
│   → ❌ NÃO: Continua Round 2                                    │
│                                                                  │
│ Round 2: Python Tier 2 (Market Data Scrapers)                   │
│   → googlefinance, tradingview, bcb                             │
│   → Retry: 2x para erros temporários                            │
│   → Resultado: +K fontes                                        │
│                                                                  │
│ Validação Round 2:                                              │
│   → sources >= 3? confidence >= 60%?                            │
│   → ✅ SIM: PARA                                                │
│   → ❌ NÃO: Continua Round 3                                    │
│                                                                  │
│ Round 3: Python Tier 3 (Scrapers Privados - Se Autenticados)   │
│   → investidor10(py), yahoofinance, oplab, kinvo               │
│   → Apenas se OAuth tokens disponíveis                          │
│   → Retry: 2x                                                   │
│   → Resultado: +J fontes                                        │
│                                                                  │
│ Validação Round 3:                                              │
│   → sources >= 3? confidence >= 60%?                            │
│   → ✅ SIM: PARA                                                │
│   → ❌ NÃO: Continua Round 4 (Retry Agressivo)                  │
│                                                                  │
│ Round 4+: Retry de Scrapers que Falharam (Erros Temporários)   │
│   → Re-tenta scrapers com:                                      │
│     - Timeout (ERR_TIMEOUT)                                     │
│     - Network error (ERR_ABORTED, ECONNREFUSED)                 │
│     - HTTP 503 Service Unavailable                              │
│     - HTTP 429 Too Many Requests (com backoff)                  │
│   → Máximo: 2 retries por scraper                               │
│   → Exponential backoff: 5s, 10s, 20s                           │
│                                                                  │
│ Critério de Parada:                                             │
│   → ✅ sources >= 3 E confidence >= 60%                         │
│   → ⚠️ Esgotou TODOS scrapers + retries                         │
│   → ⚠️ Timeout total > 300s (5 min)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementação Completa

### Classe de Gerenciamento de Circuit Breaker

```typescript
// backend/src/scrapers/circuit-breaker.service.ts

export class ScraperCircuitBreaker {
  private failureCount: Map<string, number> = new Map();
  private lastFailure: Map<string, Date> = new Map();
  private readonly MAX_FAILURES = 3;
  private readonly RESET_TIMEOUT = 60000; // 1 minuto

  isOpen(scraperId: string): boolean {
    const failures = this.failureCount.get(scraperId) || 0;
    const lastFail = this.lastFailure.get(scraperId);

    // Reset se passou o timeout
    if (lastFail && Date.now() - lastFail.getTime() > this.RESET_TIMEOUT) {
      this.failureCount.set(scraperId, 0);
      return false;
    }

    return failures >= this.MAX_FAILURES;
  }

  recordFailure(scraperId: string, error: Error): void {
    const current = this.failureCount.get(scraperId) || 0;
    this.failureCount.set(scraperId, current + 1);
    this.lastFailure.set(scraperId, new Date());
  }

  recordSuccess(scraperId: string): void {
    this.failureCount.set(scraperId, 0);
  }

  isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /ETIMEDOUT/i,
      /ERR_ABORTED/i,
      /ECONNREFUSED/i,
      /503/,
      /429/,
      /network error/i,
      /Unable to retrieve content/i,  // Investidor10 navigation error
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }
}
```

---

### Fallback Adaptativo com Retry

```typescript
// backend/src/scrapers/scrapers.service.ts

async scrapeFromAllSources(ticker: string) {
  // ... Coleta TypeScript (linhas 163-199)

  // ✅ FALLBACK ADAPTATIVO
  const validation = await this.adaptivePythonFallback(
    ticker,
    successfulResults,
    rawSourcesData
  );

  return validation;
}

/**
 * Python Fallback Adaptativo com Retry e Circuit Breaker
 *
 * Estratégia:
 * 1. Tenta TODOS os scrapers disponíveis em tiers
 * 2. Retry automático para erros temporários
 * 3. Circuit breaker para scrapers permanentemente quebrados
 * 4. Para apenas quando: sources >= 3 E confidence >= 60% OU esgota opções
 */
private async adaptivePythonFallback(
  ticker: string,
  successfulResults: ScraperResult[],
  rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
): Promise<CrossValidationResult> {
  let validation = this.crossValidateData(successfulResults, rawSourcesData);

  // Verificar se já atende critérios
  if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
    return validation;  // ✅ Já está bom
  }

  this.logger.log(
    `[ADAPTIVE-FALLBACK] ${ticker}: Starting adaptive fallback. ` +
    `Current: ${successfulResults.length} sources, confidence ${(validation.confidence * 100).toFixed(1)}%`
  );

  // Obter scrapers Python disponíveis
  const pythonScrapers = await this.getPythonScrapersForFallback();

  // Organizar em tiers por prioridade
  const tiers = this.organizeScraper

sIntoTiers(pythonScrapers);

  // Rastrear scrapers já tentados (incluindo TypeScript)
  const attemptedScrapers = new Set<string>(
    rawSourcesData.map(s => s.source.toLowerCase().replace('python-', ''))
  );

  // Rastrear scrapers que falharam (para retry)
  const failedScrapers: Map<string, { error: Error; attempts: number }> = new Map();

  let totalAttempts = 0;
  const startTime = Date.now();
  const MAX_TOTAL_TIME = 300000; // 5 minutos

  // Loop por tiers
  for (const [tierName, tierScrapers] of Object.entries(tiers)) {
    // Timeout global
    if (Date.now() - startTime > MAX_TOTAL_TIME) {
      this.logger.warn(
        `[ADAPTIVE-FALLBACK] ${ticker}: Global timeout (5min) reached. Stopping.`
      );
      break;
    }

    // Verificar se já atingiu critérios
    if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
      this.logger.log(
        `[ADAPTIVE-FALLBACK] ${ticker}: Criteria met. Stopping at tier ${tierName}.`
      );
      break;
    }

    this.logger.log(
      `[ADAPTIVE-FALLBACK] ${ticker}: Starting tier ${tierName} (${tierScrapers.length} scrapers)`
    );

    // Tentar cada scraper do tier
    for (const scraperId of tierScrapers) {
      // Skip se já tentou
      if (attemptedScrapers.has(scraperId.toLowerCase())) {
        continue;
      }

      // Circuit breaker: skip se scraper está permanentemente quebrado
      if (this.circuitBreaker.isOpen(scraperId)) {
        this.logger.warn(
          `[ADAPTIVE-FALLBACK] ${ticker}: Circuit breaker OPEN for ${scraperId}. Skipping.`
        );
        continue;
      }

      // Tentar scraper com retry
      const result = await this.tryScraperWithRetry(
        ticker,
        scraperId,
        2  // Max 2 retries
      );

      attemptedScrapers.add(scraperId.toLowerCase());
      totalAttempts++;

      if (result.success) {
        // Adicionar fonte
        const sourceKey = `python-${scraperId.toLowerCase()}`;
        successfulResults.push({
          success: true,
          source: sourceKey,
          data: result.data,
          timestamp: new Date(),
          responseTime: result.responseTime,
        });
        rawSourcesData.push({
          source: sourceKey,
          data: result.data,
          scrapedAt: new Date().toISOString(),
        });

        this.circuitBreaker.recordSuccess(scraperId);

        this.logger.log(
          `[ADAPTIVE-FALLBACK] ${ticker}: ✅ ${scraperId} succeeded. Total: ${successfulResults.length} sources`
        );

        // Re-validar
        validation = this.crossValidateData(successfulResults, rawSourcesData);

        // Verificar se já é suficiente
        if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
          this.logger.log(
            `[ADAPTIVE-FALLBACK] ${ticker}: Criteria met after ${scraperId}. Stopping.`
          );
          break;  // Sai do tier
        }
      } else {
        this.circuitBreaker.recordFailure(scraperId, result.error);
        failedScrapers.set(scraperId, {
          error: result.error,
          attempts: 1,
        });

        this.logger.warn(
          `[ADAPTIVE-FALLBACK] ${ticker}: ❌ ${scraperId} failed: ${result.error.message}`
        );
      }
    }

    // Se atingiu critérios, não precisa ir para próximo tier
    if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
      break;
    }
  }

  // FASE FINAL: Retry de scrapers que falharam com erros temporários
  if (successfulResults.length < this.minSources || validation.confidence < 0.60) {
    this.logger.log(
      `[ADAPTIVE-FALLBACK] ${ticker}: Starting retry phase for temporary failures`
    );

    for (const [scraperId, failInfo] of failedScrapers.entries()) {
      // Retry apenas se erro é temporário
      if (!this.circuitBreaker.isRetryableError(failInfo.error)) {
        continue;
      }

      // Limite de retries
      if (failInfo.attempts >= 2) {
        continue;
      }

      this.logger.log(
        `[ADAPTIVE-FALLBACK] ${ticker}: Retrying ${scraperId} (attempt ${failInfo.attempts + 1}/2)`
      );

      // Exponential backoff
      await this.sleep(Math.pow(2, failInfo.attempts) * 5000);

      const result = await this.trySinglePythonScraper(ticker, scraperId);

      if (result.success) {
        const sourceKey = `python-${scraperId.toLowerCase()}`;
        successfulResults.push({
          success: true,
          source: sourceKey,
          data: result.data,
          timestamp: new Date(),
          responseTime: result.responseTime,
        });
        rawSourcesData.push({
          source: sourceKey,
          data: result.data,
          scrapedAt: new Date().toISOString(),
        });

        this.circuitBreaker.recordSuccess(scraperId);
        validation = this.crossValidateData(successfulResults, rawSourcesData);

        if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
          break;  // Atingiu critérios
        }
      } else {
        failInfo.attempts++;
      }
    }
  }

  // Log final
  this.logger.log(
    `[ADAPTIVE-FALLBACK] ${ticker}: Completed. ` +
    `Final: ${successfulResults.length} sources (${totalAttempts} total attempts), ` +
    `confidence ${(validation.confidence * 100).toFixed(1)}%`
  );

  return validation;
}
```

---

### Organização em Tiers

```typescript
private organizScrapersIntoTiers(
  pythonScrapers: PythonScraperInfo[]
): Record<string, string[]> {
  // Tier 1: Fundamentalistas públicos de alta qualidade
  const tier1 = pythonScrapers
    .filter(s =>
      s.category === 'fundamental_analysis' &&
      !s.requires_login &&
      !['FUNDAMENTUS', 'STATUSINVEST', 'INVESTSITE'].includes(s.id)  // Já tentados no TS
    )
    .map(s => s.id);

  // Tier 2: Market data públicos (podem ter fundamentals)
  const tier2 = pythonScrapers
    .filter(s =>
      s.category === 'market_data' &&
      !s.requires_login
    )
    .map(s => s.id);

  // Tier 3: Official data
  const tier3 = pythonScrapers
    .filter(s => s.category === 'official_data')
    .map(s => s.id);

  // Tier 4: Fundamentalistas privados (requer auth)
  const tier4 = pythonScrapers
    .filter(s =>
      s.category === 'fundamental_analysis' &&
      s.requires_login &&
      this.isScraperAuthenticated(s.id)  // Verificar se tem OAuth token
    )
    .map(s => s.id);

  // Tier 5: Market data privados (último recurso)
  const tier5 = pythonScrapers
    .filter(s =>
      s.category === 'market_data' &&
      s.requires_login &&
      this.isScraperAuthenticated(s.id)
    )
    .map(s => s.id);

  return { tier1, tier2, tier3, tier4, tier5 };
}
```

---

### Função de Retry Individual

```typescript
private async tryScraperWithRetry(
  ticker: string,
  scraperId: string,
  maxRetries: number = 2
): Promise<{ success: boolean; data?: any; error?: Error; responseTime: number }> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.pow(2, attempt - 1) * 5000;  // 5s, 10s, 20s
      this.logger.log(
        `[RETRY] ${ticker}/${scraperId}: Attempt ${attempt + 1}/${maxRetries + 1} after ${backoffMs}ms backoff`
      );
      await this.sleep(backoffMs);
    }

    try {
      const startTime = Date.now();
      const result = await this.trySinglePythonScraper(ticker, scraperId);
      const responseTime = Date.now() - startTime;

      if (result.success) {
        return { success: true, data: result.data, responseTime };
      }

      lastError = result.error;

      // Se erro NÃO é temporário, não vale a pena retry
      if (!this.circuitBreaker.isRetryableError(lastError)) {
        this.logger.warn(
          `[RETRY] ${ticker}/${scraperId}: Non-retryable error. Stopping retries.`
        );
        break;
      }

    } catch (error) {
      lastError = error;
    }
  }

  return { success: false, error: lastError, responseTime: 0 };
}
```

---

### Chamada Individual de Scraper Python

```typescript
private async trySinglePythonScraper(
  ticker: string,
  scraperId: string
): Promise<{ success: boolean; data?: any; error?: Error; execution_time: number }> {
  try {
    const url = `${this.pythonApiUrl}/api/scrapers/fundamental/${ticker}`;
    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          scraper_ids: [scraperId],  // Apenas 1 scraper específico
          timeout: 60,
        },
        { timeout: 65000 }  // Timeout HTTP ligeiramente maior
      )
    );

    const data = response.data;

    if (data.data && data.data.length > 0) {
      return {
        success: true,
        data: data.data[0].data,
        execution_time: data.data[0].execution_time,
      };
    }

    return {
      success: false,
      error: new Error('No data returned'),
      execution_time: data.execution_time || 0,
    };

  } catch (error) {
    return {
      success: false,
      error,
      execution_time: 0,
    };
  }
}
```

---

## Exemplo de Fluxo Completo

### Ticker: ALPK3 (Caso Extremo)

```
[Round 0 - TypeScript] (16:00:00)
✅ Fundamentus: Sucesso (8s)
❌ BRAPI: Timeout (71s)
❌ StatusInvest: 404 Not Found
❌ Investidor10: Navigation error
❌ Investsite: ERR_ABORTED

Resultado: 1 fonte
Confidence: N/A (1 fonte não permite validação)
Critério: ❌ 1 < 3 fontes → ATIVA FALLBACK

[Tier 1 - Fundamentalistas Públicos] (16:01:30)
Scrapers disponíveis: GRIFFIN
Exclude: FUNDAMENTUS (já tentado)

Tentando GRIFFIN:
  Attempt 1: ❌ Timeout (60s)
  → Retryable? ✅ SIM (timeout)
  Attempt 2 (após 5s): ❌ Timeout
  → Retryable? ✅ SIM
  Attempt 3 (após 10s): ❌ Timeout
  → Max retries atingido. Circuit breaker: 1 falha

Resultado Tier 1: 0 fontes adicionadas
Total: 1 fonte
Critério: ❌ 1 < 3 → Continua Tier 2

[Tier 2 - Market Data Públicos] (16:03:00)
Scrapers disponíveis: GOOGLEFINANCE, TRADINGVIEW
Circuit breaker: Nenhum aberto

Tentando GOOGLEFINANCE:
  Attempt 1: ✅ Sucesso! (12s)
  → Dados: P/L=7.5, DY=2.1%

Resultado: +1 fonte
Total: 2 fontes
Re-validação: Confidence 45% (valores divergentes)
Critério: ❌ 2 < 3 → Continua no tier

Tentando TRADINGVIEW:
  Attempt 1: ✅ Sucesso! (18s)
  → Dados: P/L=7.8, DY=2.0%

Resultado: +1 fonte
Total: 3 fontes ✅
Re-validação: Confidence 62% ✅
Critério: ✅ 3 >= 3 E 62% >= 60% → PARA!

[Resultado Final] (16:03:30)
✅ Fontes: 3 (fundamentus, python-googlefinance, python-tradingview)
✅ Confidence: 62%
✅ Tempo total: 3min 30s
✅ Fallback attempts: Tier 1 (1 scraper, 3 retries) + Tier 2 (2 scrapers)
```

---

## Configuração Dinâmica

### Baseada em Número de Scrapers Disponíveis

```typescript
// Não usar MAX_FALLBACK_ATTEMPTS fixo!
// Usar número de scrapers disponíveis

const availableScrapers = await this.getPythonScrapersForFallback();
const MAX_SCRAPERS_TO_TRY = Math.min(
  availableScrapers.length,
  15  // Limite razoável (não tentar 27 scrapers!)
);

// Critérios de parada dinâmicos:
// 1. sources >= minSources E confidence >= targetConfidence
// 2. Tentou >= MAX_SCRAPERS_TO_TRY
// 3. Timeout global (5 min)
```

### Priorização Inteligente

```typescript
// Ordem de prioridade:
1. Fundamental analysts públicos (GRIFFIN, etc.)
2. Market data públicos (GOOGLEFINANCE, TRADINGVIEW)
3. Official data (BCB - para dados macro)
4. Fundamental analysts privados (se autenticados)
5. Market data privados (último recurso)

// Dentro de cada tier: ordenar por:
// - Taxa de sucesso histórica
// - Tempo médio de resposta
// - Número de campos que fornece
```

---

## Vantagens da Solução Adaptativa

### ✅ 1. Maximiza Cobertura

```
ANTES: Máximo 3 rounds × 2 scrapers = 6 scrapers tentados
DEPOIS: Até 15+ scrapers tentados (todos disponíveis)

Cenário real:
- TypeScript: 5 scrapers
- Python Tier 1: 1 scraper (GRIFFIN)
- Python Tier 2: 2 scrapers (GOOGLEFINANCE, TRADINGVIEW)
- Python Tier 3: 1 scraper (BCB)
- TOTAL: 9 scrapers diferentes tentados!
```

### ✅ 2. Resiliente a Falhas Temporárias

```
Scraper com timeout → Retry após 5s → Retry após 10s
Se ainda falha → Circuit breaker (não tenta de novo em futuros ativos)
```

### ✅ 3. Otimiza Custos

```
Para assim que atinge critérios (não desperdiça requests)
Tier 1 antes de Tier 4 (públicos antes de privados = menos custo OAuth)
```

### ✅ 4. Observabilidade

```
Logs detalhados:
- Cada tier iniciado
- Cada scraper tentado
- Retries com backoff
- Circuit breaker ativações
- Tempo total e fontes adicionadas
```

---

## Modificações no Python API

### Endpoint: POST /api/scrapers/fundamental/{ticker}

```python
# backend/python-scrapers/main.py

class FallbackRequest(BaseModel):
    scraper_ids: Optional[List[str]] = None  # ✅ NOVO: scrapers específicos
    exclude_sources: Optional[List[str]] = []  # Evitar duplicatas
    min_sources: int = 3
    timeout_per_scraper: int = 60

@app.post("/api/scrapers/fundamental/{ticker}")
async def scrape_fundamental_fallback(
    ticker: str,
    request: FallbackRequest
):
    """
    Fallback inteligente com retry

    Comportamento:
    - Se scraper_ids fornecido: tenta APENAS esses scrapers
    - Se não: tenta TODOS (excluindo exclude_sources)
    - Para quando: min_sources atingido
    - Retry: Automático para erros temporários
    """
    exclude = set(s.lower() for s in request.exclude_sources)

    # Filtrar scrapers
    if request.scraper_ids:
        # Tentar scrapers específicos
        available = [
            s for s in ALL_FUNDAMENTAL_SCRAPERS
            if s.id in request.scraper_ids
        ]
    else:
        # Tentar todos (excluindo)
        available = [
            s for s in ALL_FUNDAMENTAL_SCRAPERS
            if s.id.lower() not in exclude
        ]

    results = []
    failed_scrapers = []

    # Fase 1: Tentar todos os scrapers
    for scraper in available:
        if len(results) >= request.min_sources:
            break  # Atingiu mínimo

        try:
            start_time = time.time()

            # Timeout por scraper
            data = await asyncio.wait_for(
                scraper.scrape(ticker),
                timeout=request.timeout_per_scraper
            )

            execution_time = time.time() - start_time

            if data:
                results.append({
                    "source": scraper.id,
                    "data": data,
                    "execution_time": execution_time,
                    "success": True
                })
                logger.info(f"✅ {scraper.id} succeeded for {ticker} in {execution_time:.2f}s")
            else:
                failed_scrapers.append({
                    "scraper": scraper,
                    "error": "No data returned",
                    "retryable": False
                })

        except asyncio.TimeoutError as e:
            logger.warning(f"⏱️ {scraper.id} timeout for {ticker}")
            failed_scrapers.append({
                "scraper": scraper,
                "error": "Timeout",
                "retryable": True  # ✅ Pode retry
            })

        except Exception as e:
            logger.error(f"❌ {scraper.id} error for {ticker}: {str(e)}")

            # Determinar se erro é retryável
            retryable = any([
                "timeout" in str(e).lower(),
                "network" in str(e).lower(),
                "503" in str(e),
                "429" in str(e),
                "ERR_ABORTED" in str(e),
            ])

            failed_scrapers.append({
                "scraper": scraper,
                "error": str(e),
                "retryable": retryable
            })

    # Fase 2: Retry de scrapers que falharam com erros temporários
    if len(results) < request.min_sources:
        logger.info(f"🔄 Starting retry phase for {ticker}. Current sources: {len(results)}")

        retryable_failures = [f for f in failed_scrapers if f["retryable"]]

        for fail_info in retryable_failures:
            if len(results) >= request.min_sources:
                break

            scraper = fail_info["scraper"]

            # Retry com backoff
            await asyncio.sleep(5)  # 5s backoff

            try:
                logger.info(f"🔄 Retrying {scraper.id} for {ticker}")

                start_time = time.time()
                data = await asyncio.wait_for(
                    scraper.scrape(ticker),
                    timeout=request.timeout_per_scraper
                )
                execution_time = time.time() - start_time

                if data:
                    results.append({
                        "source": scraper.id,
                        "data": data,
                        "execution_time": execution_time,
                        "success": True,
                        "retry": True  # Flag para tracking
                    })
                    logger.info(f"✅ {scraper.id} succeeded on retry for {ticker}")

            except Exception as e:
                logger.warning(f"❌ {scraper.id} failed again on retry: {str(e)}")

    return {
        "ticker": ticker,
        "sources_count": len(results),
        "min_sources_met": len(results) >= request.min_sources,
        "data": results,
        "execution_time": sum(r["execution_time"] for r in results),
        "scrapers_attempted": len(available),
        "scrapers_succeeded": len(results),
        "scrapers_failed": len(failed_scrapers),
        "retries_performed": sum(1 for r in results if r.get("retry", False))
    }
```

---

## Configuração Recomendada Final

```typescript
// backend/src/scrapers/scrapers.service.ts

export class ScrapersService {
  // Configurações dinâmicas
  private readonly MIN_DATA_SOURCES = 3;           // Mínimo absoluto
  private readonly TARGET_CONFIDENCE = 0.60;       // 60% ideal
  private readonly MAX_SCRAPERS_PER_TIER = 5;      // Limite por tier
  private readonly MAX_TOTAL_ATTEMPTS = 15;        // Total de scrapers a tentar
  private readonly MAX_TOTAL_TIME_MS = 300000;     // 5 minutos timeout global
  private readonly RETRY_PER_SCRAPER = 2;          // 2 retries por scraper
  private readonly EXPONENTIAL_BACKOFF_BASE = 5000; // 5s base

  // Circuit breaker
  private circuitBreaker: ScraperCircuitBreaker;

  constructor(...) {
    this.circuitBreaker = new ScraperCircuitBreaker();
  }
}
```

---

## Métricas de Sucesso (Pós-Implementação)

### Esperado para 861 Ativos

| Métrica | Antes (Atual) | Depois (Adaptativo) | Melhoria |
|---------|---------------|---------------------|----------|
| Taxa 3+ fontes | ~85% (730 ativos) | **98%** (844 ativos) | **+114 ativos** |
| Taxa 5 fontes | 29% (250 ativos) | **45%** (387 ativos) | **+137 ativos** |
| Confidence média | 48.8% | **68%** | **+40%** |
| Fontes médias | 4.09 | **4.5** | **+10%** |
| Tempo médio | 93s | **120s** | **+29%** |

**Trade-off:** +29% tempo para +40% confidence

---

## Impacto na Coleta Atual

### Cenário 1: Implementar Agora (Recomendado)

```
Ativos já coletados: 22 (com fallback simples)
Ativos restantes: 839

Ação:
1. Implementar fallback adaptativo
2. Continuar coleta dos 839 restantes
3. Re-coletar os 22 primeiros depois

Vantagem: 839 ativos (97%) usam sistema melhorado
Desvantagem: Tempo total +25% (18h → 22.5h)
```

### Cenário 2: Implementar Depois (Não Recomendado)

```
Ação:
1. Aguardar coleta completar (18h)
2. Implementar fallback
3. Re-coletar TODOS 861 ativos (22h)

Vantagem: Nenhuma
Desvantagem: +22h de tempo total
```

---

## Implementação Modular

### Arquivo 1: circuit-breaker.service.ts (NOVO)

```typescript
// backend/src/scrapers/circuit-breaker.service.ts
// Código completo acima (60 linhas)
```

### Arquivo 2: scrapers.service.ts (MODIFICAR)

**Mudanças:**
- Linha 208-256: Substituir IF por `adaptivePythonFallback()`
- Adicionar: `organizeScrapersIntoTiers()`
- Adicionar: `tryScraperWithRetry()`
- Adicionar: `trySinglePythonScraper()`
- Adicionar: `isScraperAuthenticated()` (verificar OAuth tokens)

**Total:** ~250 linhas novas

### Arquivo 3: main.py (MODIFICAR)

**Mudanças:**
- Endpoint `/api/scrapers/fundamental/{ticker}`: Adicionar `scraper_ids` filter
- Adicionar retry logic
- Adicionar tracking de retries

**Total:** ~80 linhas modificadas

---

## Prioridade e Ordem

**P0 - IMPLEMENTAR IMEDIATAMENTE**

**Ordem Sugerida:**
1. **[2h]** Implementar circuit-breaker.service.ts
2. **[3h]** Modificar scrapers.service.ts (adaptive fallback)
3. **[1h]** Modificar main.py (Python API)
4. **[1h]** Testes com 20 ativos
5. **[30min]** Deploy e validação

**Total:** ~7.5 horas

**Implementar ANTES de corrigir bugs de parsing:**
- Fallback adaptativo vai expor MAIS bugs (mais scrapers = mais dados ruins)
- Melhor: ver todos os bugs de uma vez, corrigir todos juntos

---

## Recomendação Final

✅ **IMPLEMENTAR FALLBACK ADAPTATIVO AGORA**

Razões:
1. Temos **27 scrapers** disponíveis (desperdício usar só 3!)
2. Coleta vai durar **18-22h** de qualquer forma
3. +3-4h de desenvolvimento vale a pena para +40% confidence
4. 839 ativos restantes (97%) se beneficiam

Quer que eu **implemente agora** ou prefere aguardar a coleta completar?

**Documentos prontos:**
- `SOLUCAO_FALLBACK_ADAPTATIVO_2025-12-22.md` - Implementação completa
- Código TypeScript pronto para copiar
- Código Python pronto para copiar