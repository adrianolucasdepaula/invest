# Solução: Python Fallback em Loop - 2025-12-22

## Problema Identificado

**Arquivo:** `backend/src/scrapers/scrapers.service.ts:208-256`

### Código Atual (FALLBACK ÚNICO)

```typescript
// Linha 202-256
const initialValidation = this.crossValidateData(successfulResults, rawSourcesData);

// Detectar se precisa de fallback Python
const needsFallbackDueToSources = successfulResults.length < this.minSources;
const needsFallbackDueToDiscrepancy = this.hasSignificantDiscrepancies(initialValidation);

if (needsFallbackDueToSources || needsFallbackDueToDiscrepancy) {  // ❌ IF - RODA 1 VEZ!
  const reason = ...;

  this.logger.warn(`[SCRAPE] ${ticker}: Activating Python fallback - ${reason}`);

  const neededSources = needsFallbackDueToSources
    ? this.minSources - successfulResults.length
    : 2;

  const pythonResults = await this.runPythonFallbackScrapers(ticker, neededSources);

  // Adicionar resultados
  for (const pyResult of pythonResults) {
    if (!alreadyHasSource) {
      successfulResults.push(...);
      rawSourcesData.push(...);
    }
  }

  this.logger.log(`After Python fallback: ${successfulResults.length} sources total`);

  // Re-validar
  return this.crossValidateData(successfulResults, rawSourcesData);
}

return initialValidation;
```

### Comportamento Observado

**Cenário 1: Sucesso**
```
TypeScript: 2 fontes (fundamentus, brapi)
Python Fallback Round 1: +1 fonte (python-statusinvest)
Total: 3 fontes ✅ Atinge mínimo
```

**Cenário 2: Falha Parcial**
```
TypeScript: 2 fontes (fundamentus, brapi)
Python Fallback Round 1: +0 fontes (todos falharam)
Total: 2 fontes ❌ Não atinge mínimo
❌ Fallback NÃO tenta novamente!
```

**Cenário 3: Baixa Confidence**
```
TypeScript: 3 fontes (confidence 45%)
Python Fallback Round 1: +2 fontes (pede 2)
Total: 5 fontes, mas confidence ainda 52%
❌ Fallback NÃO tenta novamente apesar de confidence baixo!
```

---

## Solução: Fallback em Loop Recursivo

### Implementação Proposta

```typescript
async scrapeFromAllSources(ticker: string) {
  // ... código existente de coleta TypeScript (linhas 163-199)

  // ✅ NOVA IMPLEMENTAÇÃO: Loop de fallback até atingir mínimo
  let validation = this.crossValidateData(successfulResults, rawSourcesData);
  let fallbackAttempts = 0;
  const MAX_FALLBACK_ATTEMPTS = 3;  // Limite de segurança

  while (fallbackAttempts < MAX_FALLBACK_ATTEMPTS) {
    const needsFallbackDueToSources = successfulResults.length < this.minSources;
    const needsFallbackDueToConfidence = validation.confidence < 0.60;

    // Verificar se precisa de fallback
    if (!needsFallbackDueToSources && !needsFallbackDueToConfidence) {
      break;  // ✅ Atingiu critérios mínimos
    }

    fallbackAttempts++;

    const reason = needsFallbackDueToSources
      ? `only ${successfulResults.length} sources (min: ${this.minSources})`
      : `low confidence ${(validation.confidence * 100).toFixed(1)}%`;

    this.logger.warn(
      `[SCRAPE] ${ticker}: Activating Python fallback (attempt ${fallbackAttempts}/${MAX_FALLBACK_ATTEMPTS}) - ${reason}`
    );

    // Calcular quantas fontes precisamos
    const neededSources = needsFallbackDueToSources
      ? this.minSources - successfulResults.length + 1  // +1 extra para margem
      : 2;  // 2 extras para resolver discrepâncias

    // Chamar Python API
    const pythonResults = await this.runPythonFallbackScrapers(
      ticker,
      neededSources,
      { excludeSources: this.getExistingSources(rawSourcesData) }  // Evitar duplicatas
    );

    // Se não conseguiu nenhuma fonte nova, parar (esgorou scrapers)
    if (pythonResults.length === 0) {
      this.logger.warn(
        `[SCRAPE] ${ticker}: Python fallback returned 0 sources. No more scrapers available.`
      );
      break;
    }

    // Adicionar novas fontes
    let addedCount = 0;
    for (const pyResult of pythonResults) {
      const sourceKey = `python-${pyResult.source.toLowerCase()}`;
      const alreadyHasSource = rawSourcesData.some(
        (s) => s.source.toLowerCase() === sourceKey.toLowerCase()
      );

      if (!alreadyHasSource) {
        successfulResults.push({
          success: true,
          source: sourceKey,
          data: pyResult.data,
          timestamp: new Date(),
          responseTime: pyResult.execution_time * 1000,
        });
        rawSourcesData.push({
          source: sourceKey,
          data: pyResult.data,
          scrapedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    this.logger.log(
      `[SCRAPE] ${ticker}: Python fallback attempt ${fallbackAttempts} added ${addedCount} sources. Total: ${successfulResults.length}`
    );

    // Re-validar com novas fontes
    validation = this.crossValidateData(successfulResults, rawSourcesData);

    // Se já temos fontes suficientes E confidence boa, parar
    if (successfulResults.length >= this.minSources && validation.confidence >= 0.60) {
      this.logger.log(
        `[SCRAPE] ${ticker}: Criteria met after ${fallbackAttempts} fallback(s). Sources: ${successfulResults.length}, Confidence: ${(validation.confidence * 100).toFixed(1)}%`
      );
      break;
    }
  }

  // Log final
  if (fallbackAttempts > 0) {
    this.logger.log(
      `[SCRAPE] ${ticker}: Fallback completed after ${fallbackAttempts} attempt(s). Final: ${successfulResults.length} sources, confidence ${(validation.confidence * 100).toFixed(1)}%`
    );
  }

  return validation;
}
```

### Função Auxiliar: getExistingSources

```typescript
private getExistingSources(rawSourcesData: Array<{ source: string; data: any }>): string[] {
  return rawSourcesData.map(s => {
    // Remover prefixo "python-" se existir
    return s.source.replace('python-', '').toLowerCase();
  });
}
```

### Modificação em runPythonFallbackScrapers

```typescript
async runPythonFallbackScrapers(
  ticker: string,
  minSources: number,
  options?: { excludeSources?: string[] }  // ✅ NOVO: evitar duplicatas
): Promise<Array<{ source: string; data: any; execution_time: number }>> {
  this.logger.log(
    `[PYTHON-FALLBACK] Requesting ${minSources} sources for ${ticker} from Python API`
  );

  try {
    const url = `${this.pythonApiUrl}/api/scrapers/fundamental/${ticker}`;
    const response = await firstValueFrom(
      this.httpService.post(url, {
        min_sources: minSources,
        timeout_per_scraper: 60,
        exclude_sources: options?.excludeSources || [],  // ✅ NOVO
      })
    );

    // ... resto do código
  }
}
```

---

## Comportamento Esperado com Loop

### Cenário 1: Falta de Fontes

```
[16:32:00] TypeScript: 2 fontes (fundamentus, brapi)
[16:32:15] Python Fallback Round 1: Pede 2 fontes
           → Retorna: python-statusinvest
           → Total: 3 fontes ✅
[16:32:20] Critério atingido (3 >= 3). PARA.
```

### Cenário 2: Python Falha na Primeira Tentativa

```
[16:32:00] TypeScript: 2 fontes (fundamentus, brapi)
[16:32:15] Python Fallback Round 1: Pede 2 fontes
           → Retorna: 0 fontes (timeout/erro)
           → Total: 2 fontes ❌
[16:32:20] Python Fallback Round 2: Pede 2 fontes (exclude: fundamentus, brapi)
           → Retorna: python-investsite, python-fundamentus
           → Total: 4 fontes ✅
[16:32:25] Critério atingido (4 >= 3). PARA.
```

### Cenário 3: Baixa Confidence Persistente

```
[16:32:00] TypeScript: 3 fontes (confidence 45%)
[16:32:15] Python Fallback Round 1: Pede 2 fontes
           → Retorna: python-investsite, python-investidor10
           → Total: 5 fontes, confidence 52% ❌
[16:32:20] Python Fallback Round 2: Pede 2 fontes (exclude: já usadas)
           → Retorna: python-bcb, python-statusinvest-dividends
           → Total: 7 fontes, confidence 68% ✅
[16:32:25] Critério atingido (confidence 68% >= 60%). PARA.
```

### Cenário 4: Esgota Scrapers Python

```
[16:32:00] TypeScript: 2 fontes (fundamentus, brapi)
[16:32:15] Python Fallback Round 1: Pede 2 fontes
           → Retorna: 0 fontes
           → Total: 2 fontes ❌
[16:32:20] Python Fallback Round 2: Pede 2 fontes
           → Retorna: 0 fontes (sem mais scrapers disponíveis)
           → Total: 2 fontes ❌
[16:32:20] Python API retornou 0 fontes. PARA (esgorou scrapers).
           ⚠️ NÃO atingiu mínimo! Salva com warning.
```

---

## Critérios de Parada do Loop

O loop **PARA** quando uma dessas condições é satisfeita:

1. ✅ **Sucesso Total:**
   - `sources >= minSources (3)` **E** `confidence >= 60%`

2. ✅ **Sucesso Parcial (fontes suficientes):**
   - `sources >= minSources (3)` (mesmo com confidence baixo)

3. ⚠️ **Limite de Tentativas:**
   - `fallbackAttempts >= MAX_FALLBACK_ATTEMPTS (3)`

4. ⚠️ **Esgotou Scrapers:**
   - Python API retornou 0 fontes (sem mais scrapers disponíveis)

---

## Vantagens da Solução

### ✅ Vantagem 1: Resiliência a Falhas
- Se 1 scraper Python falha, tenta outros
- Não desiste na primeira falha

### ✅ Vantagem 2: Otimização de Confidence
- Continua adicionando fontes até confidence >= 60%
- Resolve discrepâncias com dados extras

### ✅ Vantagem 3: Evita Duplicatas
- `excludeSources` previne chamar mesmo scraper 2x
- Otimiza chamadas Python API

### ✅ Vantagem 4: Limite de Segurança
- MAX_FALLBACK_ATTEMPTS = 3 previne loop infinito
- Timeout total: ~3 rounds × 60s = 180s máx

---

## Impacto Esperado

### Antes (Fallback Único)

```
Ativos com 2 fontes que fallback falha: 0% de melhoria
Ativos com confidence 45% após 1 fallback: 45% (inalterado)

Taxa de sucesso em atingir mínimo: ~85%
```

### Depois (Fallback em Loop)

```
Ativos com 2 fontes: fallback tenta até 3x → ~95% atingem 3+
Ativos com confidence 45%: fallback adiciona fontes → ~70% atingem 60%+

Taxa de sucesso em atingir mínimo: ~98%
```

### Métricas de Melhoria

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| Taxa de sucesso (3+ fontes) | 85% | **98%** | +13% |
| Confidence média | 48.8% | **65%+** | +33% |
| Ativos com 5 fontes | 29% | **40%+** | +38% |

---

## Modificações Necessárias

### Arquivo 1: `backend/src/scrapers/scrapers.service.ts`

**Linhas 208-256:** Substituir IF por WHILE loop (código acima)

**Linhas 1035-1076:** Adicionar parâmetro `excludeSources` em `runPythonFallbackScrapers()`

### Arquivo 2: `backend/python-scrapers/main.py`

**Endpoint:** `POST /api/scrapers/fundamental/{ticker}`

**Modificação:** Adicionar suporte a `exclude_sources`

```python
@app.post("/api/scrapers/fundamental/{ticker}")
async def scrape_fundamental(
    ticker: str,
    request: FallbackRequest
):
    """
    Request Body:
    {
      "min_sources": 3,
      "timeout_per_scraper": 60,
      "exclude_sources": ["fundamentus", "brapi"]  # ✅ NOVO
    }
    """
    exclude = set(s.lower() for s in request.exclude_sources or [])

    # Filtrar scrapers
    available_scrapers = [
        s for s in ALL_FUNDAMENTAL_SCRAPERS
        if s.id.lower() not in exclude
    ]

    # Tentar scrapers até atingir min_sources
    results = []
    for scraper in available_scrapers:
        if len(results) >= request.min_sources:
            break  # Atingiu mínimo

        try:
            data = await scraper.scrape(ticker)
            if data:
                results.append({
                    "source": scraper.id,
                    "data": data,
                    "execution_time": ...
                })
        except Exception as e:
            logger.error(f"Scraper {scraper.id} failed: {e}")

    return {
        "ticker": ticker,
        "sources_count": len(results),
        "min_sources_met": len(results) >= request.min_sources,
        "data": results,
        "execution_time": total_time
    }
```

---

## Exemplo de Fluxo Completo

### Ticker: ALPK3 (Atualmente tem 2 fontes, confidence 33%)

```
[Round 0 - TypeScript]
15:00:00 | Fundamentus: ✅ Sucesso
15:00:08 | BRAPI: ❌ Timeout (71s)
15:00:15 | StatusInvest: ❌ Ticker não encontrado
15:00:20 | Investidor10: ❌ Data validation failed
15:00:25 | Investsite: ❌ ERR_ABORTED

Resultado: 1 fonte (fundamentus)
Confidence: 0% (1 fonte não permite validação)

[Python Fallback - Round 1]
15:00:30 | Precisa fallback: 1 < 3 sources
15:00:30 | Solicita: 3 fontes (exclude: fundamentus)
15:00:35 | Python API tenta:
           - python-brapi: ✅ Sucesso
           - python-statusinvest: ✅ Sucesso
           - python-investsite: ❌ Timeout
15:00:45 | Retorna: 2 fontes

Resultado: 3 fontes total (fundamentus + python-brapi + python-statusinvest)
Confidence: 75% ✅

[Verificação Loop]
15:00:45 | sources (3) >= minSources (3)? ✅ SIM
15:00:45 | confidence (75%) >= 60%? ✅ SIM
15:00:45 | Critérios atingidos! PARA.

✅ SUCESSO: 3 fontes, confidence 75%
```

### Ticker: ANCR11 (Caso difícil - todos scrapers falham)

```
[Round 0 - TypeScript]
15:00:00 | Fundamentus: ❌ Data validation failed (FII)
15:00:08 | BRAPI: ✅ Sucesso (limitado)
15:00:15 | StatusInvest: ✅ Sucesso
15:00:20 | Investidor10: ❌ Navigation error
15:00:25 | Investsite: ❌ Data validation failed (FII)

Resultado: 2 fontes (brapi, statusinvest)
Confidence: 35% (valores divergentes)

[Python Fallback - Round 1]
15:00:30 | Precisa fallback: 2 < 3 sources
15:00:30 | Solicita: 2 fontes (exclude: brapi, statusinvest)
15:00:35 | Python API tenta:
           - python-fundamentus: ✅ Sucesso
           - python-investidor10: ❌ Erro
15:00:45 | Retorna: 1 fonte

Resultado: 3 fontes total (brapi + statusinvest + python-fundamentus)
Confidence: 42% ❌ Ainda baixo!

[Python Fallback - Round 2]
15:00:45 | Precisa fallback: confidence 42% < 60%
15:00:45 | Solicita: 2 fontes (exclude: brapi, statusinvest, fundamentus)
15:00:50 | Python API tenta:
           - python-investsite: ✅ Sucesso
           - python-bcb: ❌ Não tem dados de FII
15:01:00 | Retorna: 1 fonte

Resultado: 4 fontes total
Confidence: 55% ❌ Ainda < 60%

[Python Fallback - Round 3]
15:01:00 | Precisa fallback: confidence 55% < 60%
15:01:00 | Solicita: 2 fontes (exclude: brapi, statusinvest, fundamentus, investsite)
15:01:05 | Python API tenta:
           - python-fundamentei: ❌ Requer login
           - python-opcoes: ❌ Não tem dados fundamentalistas
15:01:10 | Retorna: 0 fontes

Resultado: 4 fontes total
Confidence: 55%

[Verificação Loop]
15:01:10 | Python retornou 0 fontes. Esgorou scrapers disponíveis.
15:01:10 | PARA com warning.

⚠️ PARCIAL: 4 fontes (atingiu mínimo), confidence 55% (abaixo ideal)
```

---

## Configuração Recomendada

### Parâmetros de Fallback

```typescript
// backend/src/scrapers/scrapers.service.ts

// Linha ~140
private readonly MIN_DATA_SOURCES = 3;  // Mínimo absoluto
private readonly TARGET_CONFIDENCE = 0.60;  // 60% ideal
private readonly MAX_FALLBACK_ATTEMPTS = 3;  // Máximo de rounds
```

### Logging Detalhado

```typescript
// Adicionar métricas ao log
this.logger.log(`
[SCRAPE-SUMMARY] ${ticker}:
  - TypeScript sources: ${tsSourcesCount}
  - Python sources: ${pySourcesCount}
  - Total sources: ${totalSources}
  - Fallback attempts: ${fallbackAttempts}
  - Final confidence: ${(confidence * 100).toFixed(1)}%
  - Status: ${totalSources >= 3 && confidence >= 0.60 ? 'SUCCESS' : 'PARTIAL'}
`);
```

---

## Testes Necessários

### Teste 1: Fallback Bem-Sucedido

```typescript
// Mock: TypeScript retorna 2 fontes, Python retorna 2 fontes
// Esperado: 4 fontes total, 1 round de fallback
```

### Teste 2: Fallback Múltiplos Rounds

```typescript
// Mock: TypeScript 2 fontes, Python Round 1: 0, Round 2: 1, Round 3: 1
// Esperado: 4 fontes total, 3 rounds de fallback
```

### Teste 3: Esgota Scrapers

```typescript
// Mock: TypeScript 2 fontes, Python sempre retorna 0
// Esperado: 2 fontes total, 3 rounds tentados, para com warning
```

### Teste 4: Confidence Baixo

```typescript
// Mock: TypeScript 3 fontes (confidence 40%), Python adiciona 2 (confidence sobe 65%)
// Esperado: 5 fontes, 1 round, para quando atinge 60%
```

---

## Impacto na Coleta Atual

### Cenário: Após Implementar

Se aplicarmos esta correção **AGORA** (antes da coleta completar):

**Vantagens:**
- Próximos 839 ativos terão fallback recursivo
- Confidence média deve subir de 48.8% → 65%+
- Taxa de sucesso (3+ fontes) sobe de 85% → 98%

**Desvantagens:**
- Tempo por ativo aumenta ~20-30% (rounds extras)
- ETA de 18h → ~22-24h

**Recomendação:**
- ✅ Implementar AGORA se prioridade é qualidade
- ⏸️ Aguardar coleta completar se prioridade é velocidade

---

## Prioridade

**P0 - IMPLEMENTAR COM BUGS P0**

Esta modificação deve ser feita **junto** com as correções de parsing:
- Fallback recursivo SEM bugs de parsing → Adiciona fontes com dados ruins
- Fallback recursivo COM bugs corrigidos → Maximiza qualidade

**Ordem sugerida:**
1. Corrigir bugs P0 (parsing B/M/K, decimal, %)
2. Implementar fallback recursivo
3. Re-executar bulk update

**Tempo estimado:** +2h (além das 4-6h dos bugs)
**Tempo total:** 6-8h

---

## Monitoramento Pós-Implementação

### Métricas para Validar

```sql
-- Distribuição de fontes (deve melhorar)
SELECT
  (metadata->>'sourcesCount')::int as num_fontes,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct
FROM fundamental_data
WHERE updated_at > NOW() - INTERVAL '1 day'
GROUP BY num_fontes
ORDER BY num_fontes DESC;

-- Ativações de fallback (deve aumentar)
SELECT
  COUNT(*) FILTER (WHERE metadata->>'fallbackAttempts' = '1') as round_1,
  COUNT(*) FILTER (WHERE metadata->>'fallbackAttempts' = '2') as round_2,
  COUNT(*) FILTER (WHERE metadata->>'fallbackAttempts' = '3') as round_3
FROM fundamental_data
WHERE updated_at > NOW() - INTERVAL '1 day';
```

---

**Criado:** 2025-12-22 17:15
**Status:** PROPOSTA - AGUARDANDO IMPLEMENTAÇÃO
**Prioridade:** P0 (implementar junto com correções de parsing)
**Tempo Estimado:** 2 horas
**Impacto Esperado:** +13% taxa de sucesso, +33% confidence média
