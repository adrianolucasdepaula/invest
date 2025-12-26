# Inventário COMPLETO: 35 Scrapers - 2025-12-22

## Validação Multi-Fonte

| Fonte | Total | Observação |
|-------|-------|------------|
| **UI** (http://localhost:3100/data-sources) | **30** | Visualização frontend |
| **Python API** (http://localhost:8000/api/scrapers/list) | **27** | Scrapers registrados |
| **Código Python** (\_\_init\_\_.py) | **35** | Scrapers implementados |

**Discrepância:** 35 (código) vs 27 (API) vs 30 (UI)

**Razão:** 8 scrapers novos **em desenvolvimento** (Fases 95-101) ainda não registrados na API.

---

## LISTA COMPLETA - 35 Scrapers

### 🟦 FUNDAMENTAL DATA (10 scrapers)

| # | Scraper | Tipo | Auth | URL | Campos | Status |
|---|---------|------|------|-----|--------|--------|
| 1 | **Fundamentus** | TS | ❌ | fundamentus.com.br | 33 | ✅ ATIVO (TS) |
| 2 | FUNDAMENTUS | Py | ❌ | fundamentus.com.br | 38 | 🟢 Fallback |
| 3 | **BRAPI** | TS | ⚠️ Key | brapi.dev | 23 | ✅ ATIVO (TS) |
| 4 | **StatusInvest** | TS | ❌ | statusinvest.com.br | 28 | ✅ ATIVO (TS) |
| 5 | STATUSINVEST | Py | ❌ | statusinvest.com.br | 17 | 🟢 Fallback |
| 6 | **Investidor10** | TS | ❌ | investidor10.com.br | 54 | ✅ ATIVO (TS) |
| 7 | INVESTIDOR10 | Py | 🔒 | investidor10.com.br | 54 | 🟡 Fallback (auth) |
| 8 | **Investsite** | TS | ❌ | investsite.com.br | 23+ | ✅ ATIVO (TS) |
| 9 | INVESTSITE | Py | ❌ | investsite.com.br | 39 | 🟢 Fallback |
| 10 | **Griffin** | Py | ❌ | griffin.com.br | ? | 🟢 Fallback |

### 🔒 OAUTH REQUIRED (2 scrapers - FASE 97)

| # | Scraper | Tipo | Auth | Status |
|---|---------|------|------|--------|
| 11 | **Fundamentei** | TS | 🔒 | ❌ DESATIVADO |
| 12 | **MaisRetorno** | Py | 🔒 | 🆕 FASE 97 (não na API) |

### 🔑 CREDENTIALS OPTIONAL (1 scraper - FASE 98)

| # | Scraper | Tipo | Auth | Status |
|---|---------|------|------|--------|
| 13 | **ADVFN** | Py | ⚠️ | 🆕 FASE 98 (não na API) |

### 📊 MARKET DATA (6 scrapers)

| # | Scraper | Tipo | Auth | Fundamentals? | Status |
|---|---------|------|------|---------------|--------|
| 14 | **Google Finance** | Py | ❌ | ✅ SIM | 🟢 Fallback |
| 15 | **TradingView** | Py | ❌ | ⚠️ Limitado | 🟢 Fallback |
| 16 | Yahoo Finance | Py | 🔒 | ✅ SIM | 🟡 Fallback (auth) |
| 17 | Oplab | Py | 🔒 | ❌ Opções | 🟡 Fallback (auth) |
| 18 | Kinvo | Py | 🔒 | ⚠️ Limitado | 🟡 Fallback (auth) |
| 19 | **Investing.com** | Py | ❌ | ✅ SIM | 🆕 FASE 95 (não na API) |

### 📰 MARKET INDICES (2 scrapers)

| # | Scraper | Tipo | Auth | Dados | Status |
|---|---------|------|------|-------|--------|
| 20 | **IDIV** | Py | ❌ | Composição IDIV | ✅ API |
| 21 | **B3** | Py | ❌ | CVM codes | 🆕 FASE 96 (não na API) |

### 📈 OPTIONS DATA (2 scrapers)

| # | Scraper | Tipo | Auth | Status |
|---|---------|------|------|--------|
| 22 | **Opções.net** | TS | ❌ | ✅ ATIVO (TS) |
| 23 | **OPCOESNET** | Py | ❌ | ✅ API |

### 💰 CRYPTO (1 scraper)

| # | Scraper | Tipo | Status |
|---|---------|------|--------|
| 24 | CoinMarketCap | Py | ✅ API |

### 🏛️ OFFICIAL DATA (1 + 3 novos = 4 scrapers)

| # | Scraper | Tipo | Auth | Dados | Status |
|---|---------|------|------|-------|--------|
| 25 | **BCB** | Py | ❌ | SELIC, IPCA, CDI | ✅ API |
| 26 | **ANBIMA** | Py | ❌ | Tesouro Direto | 🆕 FASE 100 |
| 27 | **FRED** | Py | ⚠️ Key | US Economic Data | 🆕 FASE 100 |
| 28 | **IPEADATA** | Py | ❌ | BR Economic Data | 🆕 FASE 100 |

### 📰 NEWS (7 scrapers)

| # | Scraper | Tipo | Status |
|---|---------|------|--------|
| 29 | Bloomberg | Py | ✅ API |
| 30 | Google News | Py | ✅ API |
| 31 | Investing.com News | Py | ✅ API |
| 32 | Valor Econômico | Py | ✅ API |
| 33 | Exame | Py | ✅ API |
| 34 | InfoMoney | Py | ✅ API |
| 35 | Estadão | Py | ✅ API |

### 🤖 AI ANALYSIS (6 scrapers)

| # | Scraper | Tipo | Auth | Status |
|---|---------|------|------|--------|
| 36 | ChatGPT | Py | 🔒 | ✅ API |
| 37 | **Gemini** | Py | 🔒 | ✅ API + Configurado |
| 38 | DeepSeek | Py | 🔒 | ✅ API |
| 39 | Claude | Py | 🔒 | ✅ API |
| 40 | Grok | Py | 🔒 | ✅ API |
| 41 | Perplexity | Py | 🔒 | ✅ API |

### 📊 WHEEL STRATEGY - FASE 101 (2 scrapers novos)

| # | Scraper | Tipo | Auth | Dados | Status |
|---|---------|------|------|-------|--------|
| 42 | **StatusInvest Dividends** | Py | ❌ | Histórico dividendos | 🆕 FASE 101.2 |
| 43 | **Stock Lending (BTC)** | Py | ❌ | Taxas aluguel | 🆕 FASE 101.3 |

---

## TOTAL CONSOLIDADO: 43 Scrapers!

**Breakdown:**
- TypeScript: **7** (6 ativos + 1 desativado)
- Python na API: **27** (registrados e funcionais)
- Python em desenvolvimento: **8** (código existe, API não lista)
- **Total único:** 35 scrapers únicos (alguns duplicados TS+Py)
- **Total contando duplicatas:** 43 scrapers

---

## Scrapers ÚTEIS para Fundamentals

### 🟢 Tier 1: Alta Qualidade + Públicos (13 scrapers)

**TypeScript (5):**
- Fundamentus (33 campos, 8s)
- BRAPI (23 campos, 12s)
- StatusInvest (28 campos, 7.7s)
- Investidor10 (54 campos, 35.9s) ⚠️ Lento
- Investsite (23+ campos, 13.3s)

**Python (8):**
- FUNDAMENTUS (38 campos) - Versão Python do TS
- STATUSINVEST (17 campos)
- INVESTSITE (39 campos)
- **Griffin** (? campos) - **NOVO!**
- **Google Finance** (~15 campos P/L, DY, EPS)
- **TradingView** (~10 campos preço, volume)
- **Investing.com** (? campos) - **FASE 95**
- **B3** (CVM codes) - **FASE 96**

### 🟡 Tier 2: Dados Complementares (4 scrapers)

| Scraper | Tipo | Dados | Uso |
|---------|------|-------|-----|
| **BCB** | Py | SELIC, IPCA, CDI | Macro context |
| **IDIV** | Py | Composição índice | Membership check |
| **ANBIMA** | Py | Tesouro Direto | 🆕 Benchmark |
| **IPEADATA** | Py | Econômicos BR | 🆕 Macro |

### 🔒 Tier 3: Privados (Se OAuth) (6 scrapers)

| Scraper | Tipo | Dados | OAuth Status |
|---------|------|-------|--------------|
| Fundamentei | TS | 11 campos | ⚠️ Precisa config |
| INVESTIDOR10 (Py) | Py | 54 campos | ⚠️ Precisa config |
| **MaisRetorno** | Py | ? | 🆕 FASE 97 |
| Yahoo Finance | Py | Fundamentals | ⚠️ Precisa config |
| Oplab | Py | Opções | ⚠️ Precisa config |
| Kinvo | Py | Portfolio | ⚠️ Precisa config |

### 🆕 Tier 4: Novos - Wheel Turbinada (2 scrapers)

| Scraper | Dados | Prioridade |
|---------|-------|------------|
| **StatusInvest Dividends** | Histórico dividendos | 🎯 WHEEL |
| **Stock Lending (BTC)** | Taxas aluguel | 🎯 WHEEL |

---

## Total ÚTIL para Fundamentals

**Públicos (sem auth):** 21 scrapers
- 5 TypeScript
- 16 Python

**Privados (com OAuth):** 6 scrapers

**TOTAL MÁXIMO:** 27 scrapers úteis para dados fundamentalistas

---

## Estratégia de Fallback Exaustivo (SEM Circuit Breaker)

### Configuração Adaptativa

```typescript
// backend/src/scrapers/scrapers.service.ts

export class ScrapersService {
  // ✅ Configuração DINÂMICA baseada em scrapers disponíveis
  private readonly MIN_DATA_SOURCES = 3;
  private readonly TARGET_CONFIDENCE = 0.60;
  private readonly MAX_TOTAL_TIME_MS = 600000;  // 10 min em desenvolvimento
  private readonly RETRY_PER_SCRAPER = 2;
  private readonly ENABLE_CIRCUIT_BREAKER = false;  // ❌ DESATIVADO em dev

  // ✅ SEM limite de rounds - tenta TODOS os disponíveis
  private readonly MAX_SCRAPERS_TO_TRY = Infinity;  // Sem limite!
}
```

### Loop Exaustivo

```typescript
async adaptivePythonFallback(
  ticker: string,
  successfulResults: ScraperResult[],
  rawSourcesData: any[],
): Promise<CrossValidationResult> {
  // Obter TODOS scrapers Python disponíveis
  const allPythonScrapers = await this.getPythonScrapersForFallback();

  // Filtrar por categoria útil
  const usefulScrapers = allPythonScrapers.filter(s =>
    ['fundamental_analysis', 'market_data', 'official_data', 'market_indices'].includes(s.category)
  );

  this.logger.log(
    `[FALLBACK] ${ticker}: ${usefulScrapers.length} Python scrapers available ` +
    `(${allPythonScrapers.length} total, filtered to useful categories)`
  );

  // Rastrear tentados
  const attempted = new Set(
    rawSourcesData.map(s => s.source.toLowerCase().replace('python-', ''))
  );

  let round = 0;
  let validation = this.crossValidateData(successfulResults, rawSourcesData);

  // ✅ Loop EXAUSTIVO - tenta TODOS os scrapers
  for (const scraper of usefulScrapers) {
    // Skip se já tentou (versão TS)
    if (attempted.has(scraper.id.toLowerCase())) {
      continue;
    }

    round++;
    const startTime = Date.now();

    // Verificar critérios a cada round
    if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
      this.logger.log(
        `[FALLBACK] ${ticker}: ✅ Criteria met after ${round} rounds. Stopping.`
      );
      break;
    }

    this.logger.log(
      `[FALLBACK] ${ticker}: Round ${round}/${usefulScrapers.length} - ` +
      `Trying ${scraper.id} (${scraper.category})`
    );

    // ✅ Retry automático (SEM circuit breaker!)
    const result = await this.tryScraperWithRetry(
      ticker,
      scraper.id,
      this.RETRY_PER_SCRAPER
    );

    attempted.add(scraper.id.toLowerCase());

    if (result.success) {
      // ✅ Sucesso
      const sourceKey = `python-${scraper.id.toLowerCase()}`;
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

      validation = this.crossValidateData(successfulResults, rawSourcesData);

      this.logger.log(
        `[FALLBACK] ${ticker}: ✅ ${scraper.id} OK in ${result.responseTime}ms. ` +
        `Total: ${successfulResults.length} sources, confidence: ${(validation.confidence * 100).toFixed(1)}%`
      );

    } else {
      // ❌ Falha
      this.logger.error(
        `[FALLBACK] ${ticker}: ❌ ${scraper.id} failed after ${this.RETRY_PER_SCRAPER} retries: ` +
        `${result.error.message}`
      );

      // ✅ DESENVOLVIMENTO: Salvar erro para análise
      // ❌ NÃO ativa circuit breaker - continua tentando próximo scraper
      await this.saveScraperErrorForDev(ticker, scraper.id, result.error, result.attempts);
    }
  }

  this.logger.log(
    `[FALLBACK] ${ticker}: Exhausted ${round} scrapers. ` +
    `Final: ${successfulResults.length} sources (${successfulResults.length - 5} from Python), ` +
    `confidence ${(validation.confidence * 100).toFixed(1)}%`
  );

  return validation;
}
```

---

## Função: Retry com Logging Detalhado

```typescript
private async tryScraperWithRetry(
  ticker: string,
  scraperId: string,
  maxRetries: number,
): Promise<{
  success: boolean;
  data?: any;
  error?: Error;
  responseTime: number;
  attempts: number;
}> {
  let lastError: Error;
  let totalAttempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    totalAttempts++;

    if (attempt > 0) {
      const backoffMs = Math.pow(2, attempt - 1) * 5000;  // 5s, 10s, 20s
      this.logger.log(
        `[RETRY] ${ticker}/${scraperId}: Retry ${attempt}/${maxRetries} after ${backoffMs}ms`
      );
      await this.sleep(backoffMs);
    }

    try {
      const startTime = Date.now();

      // Chamar Python API para scraper específico
      const result = await this.callPythonSingleScraper(ticker, scraperId);
      const responseTime = Date.now() - startTime;

      if (result.success && result.data) {
        this.logger.log(
          `[RETRY] ${ticker}/${scraperId}: ✅ Success on attempt ${attempt + 1}`
        );
        return {
          success: true,
          data: result.data,
          responseTime,
          attempts: totalAttempts,
        };
      }

      lastError = new Error(result.error || 'No data returned');

    } catch (error) {
      lastError = error;
      this.logger.warn(
        `[RETRY] ${ticker}/${scraperId}: Attempt ${attempt + 1} error: ${error.message}`
      );

      // ✅ DESENVOLVIMENTO: Log detalhado do erro
      this.logger.debug(
        `[RETRY] ${ticker}/${scraperId}: Error details - ` +
        `Type: ${error.constructor.name}, ` +
        `Stack: ${error.stack?.substring(0, 200)}`
      );

      // Continua tentando (não verifica se é retryable - tenta sempre!)
    }
  }

  // Todas as tentativas falharam
  this.logger.error(
    `[RETRY] ${ticker}/${scraperId}: ❌ Failed after ${totalAttempts} attempts. ` +
    `Last error: ${lastError.message}`
  );

  return {
    success: false,
    error: lastError,
    responseTime: 0,
    attempts: totalAttempts,
  };
}
```

---

## Função: Salvar Erros para Debug

```typescript
private async saveScraperErrorForDev(
  ticker: string,
  scraperId: string,
  error: Error,
  attempts: number,
): Promise<void> {
  // Classificar tipo de erro
  const errorType = this.classifyError(error);

  try {
    // Usar repository ou query builder
    await this.connection.query(
      `INSERT INTO scraper_errors
       (ticker, scraper_id, error_message, error_stack, error_type, attempts, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,  // Evitar duplicatas exatas
      [
        ticker,
        scraperId,
        error.message,
        error.stack,
        errorType,
        attempts,
      ]
    );

    this.logger.debug(
      `[ERROR-TRACKING] Saved error for ${ticker}/${scraperId}: ${errorType}`
    );

  } catch (e) {
    // Se falhar ao salvar, apenas loga (não bloqueia)
    this.logger.error(`Failed to save error log: ${e.message}`);
  }
}

private classifyError(error: Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('timeout') || msg.includes('etimedout')) return 'timeout';
  if (msg.includes('404') || msg.includes('not found')) return 'not_found';
  if (msg.includes('503')) return 'service_unavailable';
  if (msg.includes('429')) return 'rate_limit';
  if (msg.includes('network') || msg.includes('econnrefused')) return 'network_error';
  if (msg.includes('validation') || msg.includes('schema')) return 'validation_failed';
  if (msg.includes('navigation') || msg.includes('unable to retrieve')) return 'navigation_error';
  if (msg.includes('auth') || msg.includes('401') || msg.includes('403')) return 'authentication_error';

  return 'unknown_error';
}
```

---

## Nova Migration: scraper_errors

```typescript
// backend/src/database/migrations/XXXXXX-CreateScraperErrors.ts

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateScraperErrors1734900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scraper_errors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'ticker',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'scraper_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'error_stack',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'timeout, network_error, validation_failed, etc.',
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 1,
            comment: 'Number of retry attempts before final failure',
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional context (request params, response, etc.)',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Índices para queries de análise
    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_scraper_date',
        columnNames: ['scraper_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_ticker',
        columnNames: ['ticker'],
      }),
    );

    await queryRunner.createIndex(
      'scraper_errors',
      new TableIndex({
        name: 'idx_scraper_errors_type',
        columnNames: ['error_type', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scraper_errors');
  }
}
```

---

## Queries de Análise para Debug

### 1. Top Scrapers com Mais Erros

```sql
SELECT
  scraper_id,
  error_type,
  COUNT(*) as occurrences,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct_of_total,
  COUNT(DISTINCT ticker) as affected_tickers,
  MAX(created_at) as last_occurrence,
  MIN(created_at) as first_occurrence
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY scraper_id, error_type
ORDER BY occurrences DESC
LIMIT 20;
```

**Exemplo de resultado:**
```
scraper_id       | error_type         | occurrences | pct  | affected_tickers | last_occurrence
-----------------|--------------------|-----------|----|------------------|-------------------
INVESTIDOR10    | navigation_error   | 45        | 25.7 | 45               | 2025-12-22 17:00
FUNDAMENTUS     | validation_failed  | 38        | 21.7 | 38               | 2025-12-22 16:58
GRIFFIN         | timeout            | 28        | 16.0 | 28               | 2025-12-22 16:55
INVESTSITE      | validation_failed  | 15        | 8.6  | 15               | 2025-12-22 16:50
```

**Ação:**
- INVESTIDOR10 navigation_error (45 casos) → **Prioridade P0** para fix
- FUNDAMENTUS validation_failed (38 FIIs) → **Prioridade P0** relaxar validação

### 2. Tickers Mais Problemáticos

```sql
SELECT
  ticker,
  COUNT(*) as total_errors,
  COUNT(DISTINCT scraper_id) as scrapers_failed,
  ROUND(COUNT(DISTINCT scraper_id) * 100.0 /
    (SELECT COUNT(DISTINCT id) FROM scrapers WHERE category IN ('fundamental_analysis', 'market_data')),
    1) as failure_rate_pct,
  ARRAY_AGG(DISTINCT scraper_id ORDER BY scraper_id) as failed_scrapers,
  ARRAY_AGG(DISTINCT error_type ORDER BY error_type) as error_types
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ticker
HAVING COUNT(*) >= 5
ORDER BY total_errors DESC
LIMIT 10;
```

**Exemplo:**
```
ticker | total_errors | scrapers_failed | failure_rate_pct | failed_scrapers
-------|--------------|-----------------|------------------|------------------
ALPK3  | 12           | 8               | 57.1%            | {FUNDAMENTUS,BRAPI,STATUSINVEST,...}
ANCR11 | 10           | 7               | 50.0%            | {GRIFFIN,INVESTSITE,FUNDAMENTUS,...}
```

**Ação:**
- ALPK3 com 57% failure rate → Ticker problemático, investigar HTML structure
- Pode ser ticker inválido ou dados não disponíveis em nenhuma fonte

### 3. Taxa de Sucesso por Scraper (Últimas 24h)

```sql
SELECT
  s.id as scraper_id,
  s.category,
  COALESCE(success_count, 0) as successes,
  COALESCE(error_count, 0) as failures,
  ROUND(
    COALESCE(success_count, 0) * 100.0 /
    NULLIF(COALESCE(success_count, 0) + COALESCE(error_count, 0), 0),
    1
  ) as success_rate_pct
FROM
  (SELECT DISTINCT scraper_id as id, category FROM ...) s
LEFT JOIN
  (SELECT scraper_id, COUNT(*) as success_count
   FROM scraper_successes WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY scraper_id) succ ON succ.scraper_id = s.id
LEFT JOIN
  (SELECT scraper_id, COUNT(*) as error_count
   FROM scraper_errors WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY scraper_id) err ON err.scraper_id = s.id
WHERE s.category IN ('fundamental_analysis', 'market_data')
ORDER BY success_rate_pct DESC NULLS LAST;
```

---

## Comportamento Esperado com 14+ Scrapers

### Caso Típico: ASAI3

```
[TypeScript - 5 scrapers parallel]
16:00:00 | ✅ Fundamentus: 8s → pl=15.2, roe=12.5%
16:00:00 | ✅ BRAPI: 12s → pl=15.3, dy=2.1%
16:00:00 | ✅ StatusInvest: 7.7s → pl=15.1, roe=12.6%
16:00:00 | ✅ Investidor10: 35.9s → pl=15.25, roe=12.55%, receita=500M
16:00:00 | ✅ Investsite: 13.3s → pl=15.2, receita=498M

Resultado TypeScript: 5 fontes ✅
Confidence inicial: 85% ✅

Critério: 5 >= 3 E 85% >= 60% → ✅ PARA (não precisa fallback)
```

### Caso Difícil: ALPK3

```
[TypeScript - 5 scrapers]
16:00:00 | ✅ Fundamentus: pl=707.19
16:00:00 | ❌ BRAPI: Timeout
16:00:00 | ❌ StatusInvest: 404
16:00:00 | ❌ Investidor10: Navigation
16:00:00 | ❌ Investsite: ERR_ABORTED

Resultado: 1 fonte ❌
Confidence: N/A

[Python Fallback - 14 scrapers]

Round 1: GRIFFIN
  Attempt 1: ❌ Timeout (60s)
  Attempt 2 (backoff 5s): ❌ Timeout
  Attempt 3 (backoff 10s): ❌ Timeout
  → Salva erro: ticker=ALPK3, scraper=GRIFFIN, type=timeout, attempts=3
  → Total: 1 fonte ❌ → Continua

Round 2: GOOGLE FINANCE
  Attempt 1: ✅ Sucesso! pl=708
  → Total: 2 fontes ❌ → Continua

Round 3: TRADINGVIEW
  Attempt 1: ❌ 404 Not Found
  → Salva erro
  → Total: 2 fontes ❌ → Continua

Round 4: FUNDAMENTUS (Py)
  Attempt 1: ✅ Sucesso! pl=707.5, vpa=12.5
  → Total: 3 fontes ✅
  → Confidence: 75% ✅
  → Atingiu critério! PARA.

✅ Resultado Final:
  - Fontes: 3 (fundamentus-ts, python-googlefinance, python-fundamentus)
  - Confidence: 75%
  - Rounds: 4 de 14 possíveis
  - Tempo: ~2min
  - Erros salvos: 2 (GRIFFIN timeout, TRADINGVIEW 404)
```

### Caso Extremo: Todos Falham

```
[TypeScript]
Todos 5 falharam → 0 fontes

[Python Fallback - Tenta TODOS os 14]

Round 1-14: Todos falharam
  → 14 erros salvos em scraper_errors

Resultado: 0 fontes ❌

⚠️ Sistema salva registro com:
  - metadata.insufficient_sources = true
  - metadata.attempted_scrapers = 19 (5 TS + 14 Py)
  - metadata.all_failed = true

⚠️ Dashboard mostra alerta: "Ticker XXXX - 0 fontes disponíveis (19 tentativas)"

🔍 Ação Necessária:
  - Verificar se ticker é válido
  - Analisar padrão de erros (todos timeout? todos 404?)
  - Pode ser ativo deslistado ou ticker incorreto
```

---

## Dashboard de Scrapers: Análise de Erros

### Endpoint Novo: GET /api/v1/scrapers/errors/summary

```typescript
// backend/src/api/scrapers/scrapers.controller.ts

@Get('errors/summary')
async getErrorsSummary(
  @Query('hours') hours: number = 24
): Promise<ScraperErrorsSummary> {
  const errors = await this.connection.query(`
    SELECT
      scraper_id,
      error_type,
      COUNT(*) as count,
      ARRAY_AGG(DISTINCT ticker) as sample_tickers
    FROM scraper_errors
    WHERE created_at > NOW() - INTERVAL '${hours} hours'
    GROUP BY scraper_id, error_type
    ORDER BY count DESC
  `);

  return {
    period_hours: hours,
    total_errors: errors.reduce((sum, e) => sum + e.count, 0),
    by_scraper: errors,
    actionable_items: this.generateActionableItems(errors),
  };
}

private generateActionableItems(errors: any[]): string[] {
  const items = [];

  // Detectar padrões e sugerir ações
  for (const error of errors) {
    if (error.count > 50 && error.error_type === 'timeout') {
      items.push(
        `🔴 ${error.scraper_id}: ${error.count} timeouts. ` +
        `AÇÃO: Aumentar timeout ou otimizar scraper.`
      );
    }

    if (error.count > 30 && error.error_type === 'validation_failed') {
      items.push(
        `🔴 ${error.scraper_id}: ${error.count} validation failures. ` +
        `AÇÃO: Revisar schema validation (pode ser FIIs).`
      );
    }

    if (error.count > 20 && error.error_type === 'navigation_error') {
      items.push(
        `🟡 ${error.scraper_id}: ${error.count} navigation errors. ` +
        `AÇÃO: Adicionar wait_for_load_state('networkidle').`
      );
    }
  }

  return items;
}
```

---

## Exemplo de Output: Dashboard de Erros

```json
{
  "period_hours": 24,
  "total_errors": 175,
  "by_scraper": [
    {
      "scraper_id": "INVESTIDOR10",
      "error_type": "navigation_error",
      "count": 45,
      "sample_tickers": ["ADMF3", "AERI3", "ALPK3", ...]
    },
    {
      "scraper_id": "FUNDAMENTUS",
      "error_type": "validation_failed",
      "count": 38,
      "sample_tickers": ["BBFO11", "BBIG11", "BBRC11", ...]  // Todos FIIs!
    },
    {
      "scraper_id": "GRIFFIN",
      "error_type": "timeout",
      "count": 28,
      "sample_tickers": ["ALPK3", "ANCR11", ...]
    }
  ],
  "actionable_items": [
    "🔴 INVESTIDOR10: 45 navigation errors. AÇÃO: Adicionar wait_for_load_state('networkidle').",
    "🔴 FUNDAMENTUS: 38 validation failures. AÇÃO: Revisar schema validation (pode ser FIIs).",
    "🟡 GRIFFIN: 28 timeouts. AÇÃO: Aumentar timeout ou otimizar scraper."
  ]
}
```

---

## Resumo: Fallback SEM Circuit Breaker

### ✅ Vantagens

1. **Máxima Cobertura:** Tenta TODOS os 14+ scrapers disponíveis
2. **Debug Completo:** Salva TODOS os erros para análise
3. **Sem Falsos Negativos:** Não desativa scrapers prematuramente
4. **Desenvolvimento Ágil:** Erros expõem bugs para correção

### ⚠️ Desvantagens

1. **Mais Lento:** Tenta scrapers quebrados repetidamente
2. **Mais Logs:** Volume maior de erros
3. **Mais Requests:** Scrapers quebrados consomem recursos

### 🎯 Quando Ativar Circuit Breaker

**Produção:** Ativar após scrapers estabilizarem
**Desenvolvimento:** Manter desativado (como você sugeriu)

**Critério:**
```typescript
const ENABLE_CIRCUIT_BREAKER = process.env.NODE_ENV === 'production';
```

---

## Próximos Passos

**Implementação Sugerida:**

1. **[2h]** Criar migration `scraper_errors`
2. **[3h]** Implementar loop exaustivo sem circuit breaker
3. **[1h]** Adicionar `saveScraperErrorForDev()`
4. **[1h]** Endpoint `/api/v1/scrapers/errors/summary`
5. **[1h]** Paralelizar TypeScript scrapers
6. **[1h]** Testes com 50 ativos

**Total:** 9 horas

**Benefício:**
- Taxa de sucesso: 85% → 98%
- Confidence: 48.8% → 68%+
- Debug visibility: 100% (todos erros rastreados)

---

**Documento criado:** `INVENTARIO_COMPLETO_35_SCRAPERS_2025-12-22.md`

Quer que eu implemente agora ou aguarda a coleta completar?
