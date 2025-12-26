# Inventário Completo de Scrapers - 2025-12-22

## Validação: UI vs API vs Código

### Fontes Confirmadas

**UI (http://localhost:3100/data-sources):** 30 scrapers
**Python API (http://localhost:8000/api/scrapers/list):** 27 scrapers
**Discrepância:** 3 scrapers (UI mostra mais que API)

---

## Lista Completa - 30 Scrapers (da UI)

### TypeScript Scrapers (7)

| # | Nome | URL | Categoria | Auth | Status Código |
|---|------|-----|-----------|------|---------------|
| 1 | **Fundamentus** | fundamentus.com.br | Fundamentalista | ❌ | ✅ ATIVO |
| 2 | **BRAPI** | brapi.dev | Fundamentalista | ⚠️ API Key | ✅ ATIVO |
| 3 | **Status Invest** | statusinvest.com.br | Fundamentalista | ❌ | ✅ ATIVO |
| 4 | **Investidor10** | investidor10.com.br | Fundamentalista | ❌ | ✅ ATIVO |
| 5 | **Fundamentei** | fundamentei.com | Fundamentalista | 🔒 OAuth | ❌ DESATIVADO |
| 6 | **Investsite** | investsite.com.br | Fundamentalista | ❌ | ✅ ATIVO |
| 7 | **Opções.net** | opcoes.net.br | Opções | ❌ | ✅ ATIVO (TS) |

### Python Scrapers (23)

#### Fundamental Analysis (5)

| # | Nome | URL | Auth | Uso Atual |
|---|------|-----|------|-----------|
| 8 | **Griffin** | griffin.com.br | ❌ | 🟡 Fallback |
| 9 | FUNDAMENTUS (Py) | fundamentus.com.br | ❌ | 🟢 Fallback Ativo |
| 10 | STATUSINVEST (Py) | statusinvest.com.br | ❌ | 🟢 Fallback Ativo |
| 11 | INVESTSITE (Py) | investsite.com.br | ❌ | 🟢 Fallback Ativo |
| 12 | INVESTIDOR10 (Py) | investidor10.com.br | 🔒 | 🟡 Fallback (se auth) |

#### Market Data (4)

| # | Nome | URL | Auth | Pode Ter Fundamentals? |
|---|------|-----|------|------------------------|
| 13 | **Google Finance** | google.com/finance | ❌ | ✅ SIM (P/L, DY, market cap) |
| 14 | **TradingView** | tradingview.com | ❌ | ⚠️ Limitado (preço, volume) |
| 15 | Yahoo Finance | finance.yahoo.com | 🔒 | ✅ SIM (P/E, EPS, dividend) |
| 16 | Oplab | oplab.com.br | 🔒 | ❌ Opções apenas |
| 17 | Kinvo | kinvo.com.br | 🔒 | ⚠️ Portfolio (limitado) |

#### Official Data (1)

| # | Nome | URL | Auth | Dados |
|---|------|-----|------|-------|
| 18 | **BCB** | bcb.gov.br | ❌ | Macro (SELIC, IPCA, CDI) |

#### Crypto (1)

| # | Nome | URL | Auth | Uso |
|---|------|-----|------|-----|
| 19 | CoinMarketCap | coinmarketcap.com | ❌ | ❌ N/A (crypto) |

#### Opções (1 - duplicado?)

| # | Nome | URL | Auth | Obs |
|---|------|-----|------|-----|
| 20 | **Opcoes.net (Py)** | opcoes.net.br | ❌ | ⚠️ DUPLICADO do #7? |

#### Market Indices (1)

| # | Nome | URL | Auth | Dados |
|---|------|-----|------|-------|
| 21 | **IDIV** | b3.com.br/idiv | ❌ | Composição índice IDIV |

#### News (7)

| # | Nome | URL | Auth | Uso |
|---|------|-----|------|-----|
| 22 | Bloomberg | bloomberg.com | ❌ | 🟢 News Analysis |
| 23 | Google News | news.google.com | ❌ | 🟢 News Analysis |
| 24 | Investing.com | investing.com | ❌ | 🟢 News Analysis |
| 25 | Valor Econômico | valor.globo.com | ❌ | 🟢 News Analysis |
| 26 | Exame | exame.com | ❌ | 🟢 News Analysis |
| 27 | InfoMoney | infomoney.com.br | ❌ | 🟢 News Analysis |
| 28 | Estadão | estadao.com.br | ❌ | 🟢 News Analysis |

#### AI Analysis (6 - todos requerem OAuth)

| # | Nome | URL | Auth | Status OAuth |
|---|------|-----|------|--------------|
| 29 | ChatGPT | chat.openai.com | 🔒 | ⚠️ Configurar |
| 30 | **Google Gemini** | gemini.google.com | 🔒 | ✅ Configurado |
| 31 | DeepSeek | chat.deepseek.com | 🔒 | ⚠️ Configurar |
| 32 | Claude | claude.ai | 🔒 | ⚠️ Configurar |
| 33 | Grok | grok.x.ai | 🔒 | ⚠️ Configurar |
| 34 | Perplexity | perplexity.ai | 🔒 | ⚠️ Configurar |

**TOTAL DA UI: 30 scrapers** (ignoring duplicates and counting actual unique entries shown)

---

## Discrepância: UI 30 vs API 27

### Análise da Diferença

**Possíveis 3 scrapers extras na UI:**

1. **Opções.net duplicado?**
   - #7: Opções.net (TypeScript)
   - #20: Opcoes.net (Python)
   - Se são o mesmo → 1 duplicata

2. **Scrapers TypeScript contados na UI mas não na API Python:**
   - Fundamentus TS (#1) vs Fundamentus Py (#9)
   - Status Invest TS (#3) vs STATUSINVEST Py (#10)
   - Investsite TS (#6) vs INVESTSITE Py (#11)
   - **Hipótese:** UI conta ambos, API Python conta apenas Python

### Validação Necessária

```
UI Total: 30
  - TypeScript: 7
  - Python: 23

API Python Total: 27
  - Não inclui TypeScript (correto)

Diferença: 30 - 27 = 3
  → Provável: UI está contando 3 scrapers TypeScript que também têm versão Python
  → OU: UI tem 3 scrapers ainda não registrados na API Python
```

---

## Scrapers ÚTEIS para Fundamentals (Priorizados)

### Tier 1: Alta Qualidade + Públicos (8 scrapers)

| Scraper | Tipo | Campos | Tempo | Status |
|---------|------|--------|-------|--------|
| **Fundamentus** | TS | 33 | 8s | ✅ Ativo |
| **BRAPI** | TS | 23 | 12s | ✅ Ativo |
| **StatusInvest** | TS | 28 | 7.7s | ✅ Ativo |
| **Investidor10** | TS | 54 | 35.9s | ✅ Ativo |
| **Investsite** | TS | 23+ | 13.3s | ✅ Ativo |
| **Griffin** | Py | ? | ? | 🟡 Disponível |
| **Google Finance** | Py | ~15 | ? | 🟡 Disponível |
| **TradingView** | Py | ~10 | ? | 🟡 Disponível |

### Tier 2: Market Data + Índices (2 scrapers)

| Scraper | Tipo | Dados | Auth |
|---------|------|-------|------|
| **BCB** | Py | Macro (SELIC, IPCA) | ❌ |
| **IDIV** | Py | Composição índice | ❌ |

### Tier 3: Privados (Se OAuth Disponível) (4 scrapers)

| Scraper | Tipo | Dados | Auth | OAuth Status |
|---------|------|-------|------|--------------|
| Fundamentei | TS | 11 | 🔒 | ⚠️ Precisa config |
| Yahoo Finance | Py | Fundamentals | 🔒 | ⚠️ Precisa config |
| Investidor10 (Py) | Py | 54 | 🔒 | ⚠️ Precisa config |
| Oplab | Py | Opções | 🔒 | ⚠️ Precisa config |

### Total para Fallback: **14 scrapers úteis**

- Tier 1 (públicos): 8 (3 já usados em TS, 5 disponíveis para fallback)
- Tier 2 (índices): 2
- Tier 3 (privados): 4 (se OAuth)

---

## Recomendação: Fallback em Loop SEM Circuit Breaker

### Concordância com o Usuário

**Você tem razão!** Circuit Breaker deve ser **DESATIVADO** durante desenvolvimento:

1. ✅ **Precisamos identificar e corrigir bugs**, não escondê-los
2. ✅ Se scraper falha 3x → Deve ser **debugado**, não desativado
3. ✅ Scrapers em desenvolvimento precisam de **todas as tentativas** para validar fixes

### Solução Modificada: Fallback Exaustivo

```typescript
async adaptivePythonFallback(
  ticker: string,
  successfulResults: ScraperResult[],
  rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
): Promise<CrossValidationResult> {
  let validation = this.crossValidateData(successfulResults, rawSourcesData);

  // Obter TODOS os scrapers Python
  const pythonScrapers = await this.getPythonScrapersForFallback();

  // Filtrar apenas úteis para fundamentals
  const usefulScrapers = pythonScrapers.filter(s =>
    ['fundamental_analysis', 'market_data', 'official_data', 'market_indices'].includes(s.category)
  );

  this.logger.log(
    `[FALLBACK] ${ticker}: ${usefulScrapers.length} Python scrapers available for fallback`
  );

  // Rastrear já tentados
  const attempted = new Set(
    rawSourcesData.map(s => s.source.toLowerCase().replace('python-', ''))
  );

  let round = 0;
  const MAX_ROUNDS = usefulScrapers.length;  // ✅ ADAPTATIVO!
  const startTime = Date.now();
  const MAX_TOTAL_TIME = 600000;  // 10 min (mais generoso em dev)

  while (round < MAX_ROUNDS) {
    // Timeout global
    if (Date.now() - startTime > MAX_TOTAL_TIME) {
      this.logger.warn(`[FALLBACK] ${ticker}: Global timeout (10min). Stopping.`);
      break;
    }

    // Verificar critérios
    if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
      this.logger.log(
        `[FALLBACK] ${ticker}: ✅ Criteria met after ${round} rounds. ` +
        `Sources: ${successfulResults.length}, Confidence: ${(validation.confidence * 100).toFixed(1)}%`
      );
      break;
    }

    // Pegar próximo scraper não tentado
    const nextScraper = usefulScrapers.find(s =>
      !attempted.has(s.id.toLowerCase())
    );

    if (!nextScraper) {
      this.logger.warn(
        `[FALLBACK] ${ticker}: ⚠️ All ${usefulScrapers.length} scrapers exhausted. ` +
        `Final: ${successfulResults.length} sources, confidence ${(validation.confidence * 100).toFixed(1)}%`
      );
      break;
    }

    round++;
    attempted.add(nextScraper.id.toLowerCase());

    this.logger.log(
      `[FALLBACK] ${ticker}: Round ${round}/${usefulScrapers.length} - Trying ${nextScraper.id} ` +
      `(${nextScraper.category})`
    );

    // ✅ SEM CIRCUIT BREAKER - Sempre tenta!
    // ✅ Retry automático para erros temporários
    const result = await this.tryScraperWithRetry(
      ticker,
      nextScraper.id,
      2  // 2 retries
    );

    if (result.success) {
      const sourceKey = `python-${nextScraper.id.toLowerCase()}`;
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
        `[FALLBACK] ${ticker}: ✅ ${nextScraper.id} succeeded in ${result.responseTime}ms. ` +
        `Total: ${successfulResults.length} sources, confidence: ${(validation.confidence * 100).toFixed(1)}%`
      );
    } else {
      // ❌ NÃO marca circuit breaker - apenas loga erro
      this.logger.error(
        `[FALLBACK] ${ticker}: ❌ ${nextScraper.id} failed: ${result.error.message}. ` +
        `Continuing to next scraper...`
      );

      // ✅ DESENVOLVIMENTO: Salvar erro para análise
      await this.saveScraperErrorForAnalysis(ticker, nextScraper.id, result.error);
    }
  }

  this.logger.log(
    `[FALLBACK] ${ticker}: Completed ${round} rounds. ` +
    `Final: ${successfulResults.length} sources (${successfulResults.length - 5} from Python), ` +
    `confidence ${(validation.confidence * 100).toFixed(1)}%`
  );

  return validation;
}
```

---

## Função: Salvar Erros para Análise

```typescript
// backend/src/scrapers/scrapers.service.ts

private async saveScraperErrorForAnalysis(
  ticker: string,
  scraperId: string,
  error: Error
): Promise<void> {
  // Salvar em tabela de erros para análise posterior
  try {
    await this.connection.query(
      `INSERT INTO scraper_errors (ticker, scraper_id, error_message, error_stack, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [ticker, scraperId, error.message, error.stack]
    );
  } catch (e) {
    this.logger.error(`Failed to save error log: ${e.message}`);
  }
}
```

### Nova Tabela: scraper_errors

```sql
-- backend/src/database/migrations/XXXXXX-CreateScraperErrors.ts

CREATE TABLE scraper_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL,
  scraper_id VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type VARCHAR(50),  -- 'timeout', 'network', 'validation', 'parsing'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_scraper_errors_scraper (scraper_id, created_at),
  INDEX idx_scraper_errors_ticker (ticker),
  INDEX idx_scraper_errors_type (error_type)
);

-- Query para análise:
SELECT
  scraper_id,
  error_type,
  COUNT(*) as occurrences,
  ARRAY_AGG(DISTINCT ticker) FILTER (WHERE ticker IS NOT NULL) as affected_tickers,
  MAX(created_at) as last_occurrence
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY scraper_id, error_type
ORDER BY occurrences DESC;
```

---

## Comportamento Esperado: Loop Exaustivo

### Cenário 1: Ativo com Poucos Dados (ALPK3)

```
[TypeScript Round - 5 scrapers]
✅ Fundamentus: 1 campo (pl=707.19)
❌ BRAPI: Timeout
❌ StatusInvest: 404
❌ Investidor10: Navigation error
❌ Investsite: ERR_ABORTED

Total: 1 fonte ❌ (precisa 3)

[Python Fallback - Até 14 scrapers disponíveis]

Round 1: GRIFFIN
  Attempt 1: ❌ Timeout
  Attempt 2 (5s backoff): ❌ Timeout
  Attempt 3 (10s backoff): ❌ Timeout
  → Salva erro em scraper_errors
  → Total: 1 fonte ❌ → Continua

Round 2: GOOGLE FINANCE
  Attempt 1: ✅ Sucesso! (pl=708, dy=2.1%)
  → Total: 2 fontes ❌ → Continua

Round 3: FUNDAMENTUS (Py)
  Attempt 1: ✅ Sucesso! (pl=707.5, vpa=12.5)
  → Total: 3 fontes ✅ (confidence 75%)
  → Atingiu mínimo! PARA.

✅ Resultado: 3 fontes em 3 rounds (2 sucessos, 1 falha)
```

### Cenário 2: Todos Scrapers Falharam (Edge Case)

```
[TypeScript Round]
❌ Todos 5 falharam → 0 fontes

[Python Fallback - Tenta TODOS os 14]

Round 1-14: Todos falharam
  → Griffin: Timeout (3 attempts)
  → Google Finance: 404
  → TradingView: Navigation error
  → FUNDAMENTUS (Py): Data validation failed
  → ... (10 mais scrapers)

Total após 14 rounds: 0 fontes ❌

⚠️ RESULTADO: Salva com warning "insufficient_sources"
⚠️ 14 erros salvos em scraper_errors para debug
```

---

## Modificação: Sem Circuit Breaker

### ANTES (com Circuit Breaker)

```typescript
// Após 3 falhas consecutivas
if (this.circuitBreaker.isOpen(scraperId)) {
  this.logger.warn(`Circuit breaker OPEN for ${scraperId}. Skipping.`);
  continue;  // ❌ Pula scraper
}
```

### DEPOIS (sem Circuit Breaker - Dev Mode)

```typescript
// ✅ SEMPRE tenta, mesmo se falhou antes
this.logger.log(
  `[FALLBACK] ${ticker}: Round ${round} - Trying ${scraperId} ` +
  `(${previousFailures > 0 ? `⚠️ failed ${previousFailures}x before` : 'first attempt'})`
);

const result = await this.tryScraperWithRetry(ticker, scraperId, 2);

if (result.success) {
  // Sucesso
} else {
  // ❌ Falha: Salva erro para análise
  await this.saveScraperErrorForAnalysis(ticker, scraperId, result.error);

  // ✅ MAS NÃO desativa scraper - continua no próximo round
}
```

---

## Query para Debug de Scrapers

### Identificar Scrapers Mais Problemáticos

```sql
-- Top scrapers com mais erros
SELECT
  scraper_id,
  COUNT(*) as total_errors,
  COUNT(DISTINCT ticker) as affected_tickers,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM scraper_errors), 1) as pct_of_total,
  ARRAY_AGG(DISTINCT
    CASE
      WHEN error_message LIKE '%timeout%' THEN 'Timeout'
      WHEN error_message LIKE '%404%' THEN 'Not Found'
      WHEN error_message LIKE '%validation%' THEN 'Validation Failed'
      WHEN error_message LIKE '%navigation%' THEN 'Navigation Error'
      ELSE 'Other'
    END
  ) as error_types
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY scraper_id
ORDER BY total_errors DESC
LIMIT 10;
```

### Identificar Padrões de Erro por Ticker

```sql
-- Tickers que causam mais erros (problemáticos)
SELECT
  ticker,
  COUNT(*) as total_errors,
  COUNT(DISTINCT scraper_id) as scrapers_failed,
  ARRAY_AGG(DISTINCT scraper_id) as failed_scrapers
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ticker
HAVING COUNT(*) >= 5  -- Pelo menos 5 erros
ORDER BY total_errors DESC;
```

---

## Estimativa de Tempo com Fallback Exaustivo

### Cenário Médio (5 TypeScript + 5 Python)

```
TypeScript (5 scrapers):
  - Fundamentus: 8s
  - BRAPI: 12s
  - StatusInvest: 7.7s
  - Investidor10: 35.9s (paralelo)
  - Investsite: 13.3s

  Total TS: ~35.9s (gargalo: Investidor10)

Python Fallback (média 3 rounds para atingir mínimo):
  - Round 1: Griffin - 15s
  - Round 2: Google Finance - 12s
  - Round 3: TradingView - 18s

  Total Py: ~45s

TOTAL POR ATIVO: ~81s (vs 93s atual - mais rápido!)
```

### Para 861 Ativos

```
Tempo médio: 81s/ativo
Concurrency: 6 jobs

Tempo total: (861 ativos × 81s) / 6 = ~11.600s = 3.2 horas

❌ ATUAL: ~18-20 horas
✅ COM FALLBACK OTIMIZADO: ~3-4 horas!

Melhoria: 80% mais rápido (se paralelizar TypeScript scrapers)
```

---

## Otimização Extra: Paralelizar TypeScript Scrapers

### ATUAL (Serial)

```typescript
for (const { name, scraper } of scrapers) {
  const result = await scraper.scrape(ticker);  // ❌ 1 por vez
  successfulResults.push(result);
}
// Tempo: 8s + 12s + 7.7s + 35.9s + 13.3s = 76.9s
```

### OTIMIZADO (Paralelo)

```typescript
const scraperPromises = scrapers.map(({ name, scraper }) =>
  scraper.scrape(ticker)
    .then(result => ({ name, result, success: true }))
    .catch(error => ({ name, error, success: false }))
);

const results = await Promise.all(scraperPromises);  // ✅ Paralelo!

// Tempo: MAX(8s, 12s, 7.7s, 35.9s, 13.3s) = 35.9s (gargalo)
```

**Ganho:** 76.9s → 35.9s (53% mais rápido!)

---

## Implementação Final Recomendada

### Estratégia de 3 Fases

```
FASE 1: Paralelizar TypeScript (todos 5 ao mesmo tempo)
  → Tempo: ~36s (gargalo: Investidor10)
  → Ganho: 50% vs atual

FASE 2: Fallback Python Loop Exaustivo (sem circuit breaker)
  → Tenta TODOS scrapers disponíveis (até 14)
  → Para quando: sources >= 3 E confidence >= 60%
  → Tempo: ~30-60s (3-5 rounds médios)

FASE 3: Retry Agressivo de Erros Temporários
  → Re-tenta scrapers com timeout/network error
  → Backoff: 5s, 10s
  → Tempo: +10-20s se necessário

TOTAL: 36s + 45s + 15s = ~96s/ativo (similar ao atual)
MAS: Taxa de sucesso 98% vs 85% atual (+15%)
```

---

## Resumo de Modificações

### Arquivo 1: scrapers.service.ts

**Mudanças:**
1. ❌ **REMOVER** circuit breaker (desenvolvimento)
2. ✅ **ADICIONAR** loop exaustivo (até 14 scrapers)
3. ✅ **ADICIONAR** retry com backoff
4. ✅ **ADICIONAR** `saveScraperErrorForAnalysis()`
5. ✅ **MODIFICAR** TypeScript para paralelo (`Promise.all`)

### Arquivo 2: Nova Migration - scraper_errors

```sql
CREATE TABLE scraper_errors (...);
```

### Arquivo 3: main.py (Python API)

**Mudanças:**
1. ✅ Suportar `scraper_ids` específicos
2. ✅ Suportar `exclude_sources`
3. ✅ Retry interno para timeouts

---

## Validação da Discrepância (30 vs 27)

Vou investigar quais são os 3 scrapers extras na UI:

**Hipótese 1:** UI conta TypeScript + Python (duplicados)
- Opções.net TS (#7) + Opcoes.net Py (#20) = 1 duplicata

**Hipótese 2:** UI tem scrapers ainda não no Python API
- Scrapers novos em desenvolvimento

**Próximo passo:** Extrair lista completa do frontend e comparar ID por ID.

---

**Documento atualizado:** `INVENTARIO_SCRAPERS_COMPLETO_2025-12-22.md`
**Próxima ação:** Implementar fallback exaustivo SEM circuit breaker?
