# 🔧 FASE 26: Manutenção de Scrapers - Correção de Problemas Não-Bloqueantes

**Data:** 2025-11-14 18:45
**Versão:** 1.0
**Tipo:** Manutenção/Correções
**Prioridade:** ALTA (Resolver não-bloqueantes antes de novas features)
**Executor:** Claude Code (Sonnet 4.5)

---

## 🎯 OBJETIVO

Corrigir **3 problemas não-bloqueantes** identificados na Validação MCP Triplo (2025-11-14) para garantir que o sistema de scrapers esteja 100% funcional e confiável antes de implementar novas features.

---

## 📋 PROBLEMAS IDENTIFICADOS

### ⚠️ Problema 1: Fundamentei Scraper - 0% Taxa de Sucesso

**Descrição:**
- Scraper "Fundamentei" (https://fundamentei.com) retorna 0.0% de taxa de sucesso
- **Dados do banco:** 5 tentativas, 5 falhas, 0ms tempo médio
- **Último teste:** 14/11/2025, 16:18:28

**Impacto:**
- 🟡 MÉDIO - Cross-validation reduzida de 6 para 5 fontes (83.3%)
- Confiança das análises ainda aceitável (mínimo 3 fontes atingido)

**Causa Provável:**
1. ❓ Autenticação OAuth Google falhando (cookies expirados/inválidos)
2. ❓ Estrutura HTML do site alterada (seletores CSS quebrados)
3. ❓ Timeout de navegação Playwright (site lento)
4. ❓ Bloqueio de bot (CloudFlare, Imperva, etc)

**Solução Proposta:**
1. ✅ **Investigar logs do scraper** - Analisar erro exato retornado
2. ✅ **Testar manualmente** - Navegar no site e verificar estrutura HTML atual
3. ✅ **Validar OAuth** - Verificar se cookies de autenticação estão válidos
4. ✅ **Atualizar seletores CSS** - Se estrutura HTML mudou
5. ✅ **Aumentar timeout** - De 30s para 60s se necessário
6. ✅ **Adicionar retry com backoff** - 3 tentativas com delay exponencial

---

### ⚠️ Problema 2: Fundamentus - Tempo Médio Elevado (21 minutos)

**Descrição:**
- Scraper "Fundamentus" (https://fundamentus.com.br) retorna tempo médio de **1.263.123ms** (21 minutos)
- **Dados do banco:** 3 tentativas, 100% sucesso
- **Último teste:** 14/11/2025, 12:37:42

**Impacto:**
- 🟡 MÉDIO - Performance ruim, mas não afeta funcionalidade
- Análises em massa ficam lentas
- Métricas exibidas na UI ficam confusas (21min é anormal)

**Causa Provável:**
1. ❓ **Cálculo de média incorreto** - Outliers não tratados (timeout de 30s gera valores negativos ou muito altos)
2. ❓ **Timeout de navegação** - Scraper aguardou 21min por timeout
3. ❓ **Site externo lento** - Fundamentus.com.br pode ter tido lentidão pontual

**Solução Proposta:**
1. ✅ **Analisar dados brutos** - SELECT * FROM scraper_metrics WHERE scraper_id='fundamentus'
2. ✅ **Validar cálculo de avgResponseTime** - Verificar lógica no ScraperMetricsService
3. ✅ **Adicionar mediana ao invés de média** - Menos sensível a outliers
4. ✅ **Filtrar outliers** - Ignorar valores > 60s (timeout máximo)
5. ✅ **Adicionar campo `median_response_time`** - Métrica mais confiável

**Análise do Código Atual:**

```typescript
// backend/src/scrapers/scraper-metrics.service.ts (linhas 60-95)
async getMetricsSummary(scraperId: string): Promise<MetricsSummary | null> {
  const metrics = await this.scraperMetricRepository.find({
    where: { scraperId },
    order: { createdAt: 'DESC' },
    take: 100, // Últimos 100 registros (aprox. 30 dias)
  });

  if (metrics.length === 0) {
    return null;
  }

  const totalRequests = metrics.length;
  const failedRequests = metrics.filter(m => !m.success).length;
  const successRate = ((totalRequests - failedRequests) / totalRequests) * 100;

  // PROBLEMA: Cálculo de média simples (não trata outliers)
  const avgResponseTime = Math.round(
    metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  );

  // ...
}
```

**Correção:**
```typescript
// Adicionar cálculo de mediana e filtrar outliers
const responseTimes = metrics
  .map(m => m.responseTime)
  .filter(time => time > 0 && time < 60000) // Filtrar outliers (< 60s)
  .sort((a, b) => a - b);

const avgResponseTime = responseTimes.length > 0
  ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
  : 0;

const medianResponseTime = responseTimes.length > 0
  ? responseTimes[Math.floor(responseTimes.length / 2)]
  : 0;
```

---

### ⚠️ Problema 3: Investsite - Taxa de Sucesso 61.5%

**Descrição:**
- Scraper "Investsite" (https://www.investsite.com.br) retorna **61.5%** de taxa de sucesso
- **Dados do banco:** 13 tentativas, 5 falhas (38.5%)
- **Último teste:** 14/11/2025, 17:00:25

**Impacto:**
- 🟡 BAIXO - Taxa aceitável, mas instável
- Cross-validation ainda funcional (5/6 fontes ativas)
- Intermitência pode indicar problema do site externo

**Causa Provável:**
1. ❓ **Intermitência do site externo** - Investsite.com.br pode ter instabilidade
2. ❓ **Mudanças esporádicas no HTML** - Site pode ter A/B testing ou deploy incremental
3. ❓ **Bloqueio de bot ocasional** - Pode estar detectando scraper algumas vezes

**Solução Proposta:**
1. ✅ **Monitorar métricas por 7 dias** - Coletar mais dados antes de agir
2. ✅ **Adicionar retry automático** - 3 tentativas com delay de 2s entre elas
3. ✅ **Adicionar logging detalhado** - Capturar erro exato quando falha
4. ✅ **Criar alerta automático** - Se taxa < 50% por 24h, notificar

**Implementação de Retry:**
```typescript
// backend/src/scrapers/investsite.scraper.ts
async scrape(ticker: string): Promise<ScraperResult> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2s

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await this.scrapeInternal(ticker);
      return result;
    } catch (error) {
      this.logger.warn(
        `Investsite scraper failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`
      );

      if (attempt < MAX_RETRIES) {
        await this.delay(RETRY_DELAY * attempt); // Backoff exponencial
      } else {
        throw error; // Última tentativa falhou
      }
    }
  }
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Investigação (Ultra-Thinking) ⏱️ 30 minutos

**1.1. Analisar Logs do Backend**
```bash
docker logs invest_backend | grep -i "fundamentei\|investsite" | tail -50
```

**1.2. Analisar Dados do Banco**
```sql
-- Fundamentei (problema 1)
SELECT * FROM scraper_metrics
WHERE scraper_id = 'fundamentei'
ORDER BY created_at DESC
LIMIT 10;

-- Fundamentus (problema 2)
SELECT
  scraper_id,
  response_time,
  success,
  error_message,
  created_at
FROM scraper_metrics
WHERE scraper_id = 'fundamentus'
ORDER BY created_at DESC;

-- Investsite (problema 3)
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successes,
  SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failures,
  ROUND(AVG(response_time)) as avg_time
FROM scraper_metrics
WHERE scraper_id = 'investsite';
```

**1.3. Testar Scrapers Manualmente**
```bash
# Via endpoint REST
curl -X POST http://localhost:3101/api/v1/scrapers/test/fundamentei \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}' | jq

curl -X POST http://localhost:3101/api/v1/scrapers/test/fundamentus \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}' | jq

curl -X POST http://localhost:3101/api/v1/scrapers/test/investsite \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}' | jq
```

---

### Fase 2: Correção Problema 1 - Fundamentei Scraper ⏱️ 1-2 horas

**2.1. Ler Código do Scraper**
```bash
# Identificar arquivo do scraper
find . -name "*fundamentei*" -type f
```

**2.2. Analisar Estrutura HTML do Site**
- Navegar manualmente em https://fundamentei.com
- Verificar se requer autenticação
- Inspecionar elementos (DevTools)
- Verificar se seletores CSS mudaram

**2.3. Implementar Correções**
- [ ] Atualizar seletores CSS (se mudou estrutura HTML)
- [ ] Validar/Renovar cookies OAuth (se auth falhou)
- [ ] Aumentar timeout de 30s para 60s
- [ ] Adicionar retry com backoff (3 tentativas, delay 2s/4s/8s)
- [ ] Adicionar logging detalhado de erros

**2.4. Testar Correção**
```bash
# Teste unitário do scraper
curl -X POST http://localhost:3101/api/v1/scrapers/test/fundamentei \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}' | jq

# Verificar métrica salva no banco
docker exec -it invest_postgres psql -U invest_user -d invest_db \
  -c "SELECT * FROM scraper_metrics WHERE scraper_id = 'fundamentei' ORDER BY created_at DESC LIMIT 1;"
```

---

### Fase 3: Correção Problema 2 - Fundamentus Tempo Médio ⏱️ 30 minutos

**3.1. Ler Código do ScraperMetricsService**
```typescript
// backend/src/scrapers/scraper-metrics.service.ts
```

**3.2. Implementar Correções**

**Arquivo:** `backend/src/scrapers/scraper-metrics.service.ts`

**Mudanças:**
```typescript
// ANTES (linha 85-88)
const avgResponseTime = Math.round(
  metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
);

// DEPOIS
const responseTimes = metrics
  .map(m => m.responseTime)
  .filter(time => time > 0 && time < 60000) // Filtrar outliers (0ms e > 60s)
  .sort((a, b) => a - b);

const avgResponseTime = responseTimes.length > 0
  ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
  : 0;

const medianResponseTime = responseTimes.length > 0
  ? responseTimes[Math.floor(responseTimes.length / 2)]
  : 0;
```

**3.3. Atualizar DTO (Opcional)**

**Arquivo:** `backend/src/scrapers/scrapers.controller.ts`

Adicionar campo `medianResponseTime` ao DTO se quiser expor na API.

**3.4. Testar Correção**
```bash
# Buscar métricas via API
curl http://localhost:3101/api/v1/scrapers/status | jq '.[] | select(.id == "fundamentus")'

# Verificar se avgResponseTime está razoável (< 30s)
```

---

### Fase 4: Correção Problema 3 - Investsite Retry Logic ⏱️ 1 hora

**4.1. Ler Código do Scraper**
```bash
find . -name "*investsite*" -type f
```

**4.2. Implementar Retry com Backoff**

**Arquivo:** `backend/src/scrapers/fundamental/investsite.scraper.ts` (ou similar)

```typescript
export class InvestsiteScraper {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 2000; // 2s

  async scrape(ticker: string): Promise<ScraperResult> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.log(`Investsite scraper attempt ${attempt}/${this.MAX_RETRIES} for ${ticker}`);

        const result = await this.scrapeInternal(ticker);

        this.logger.log(`Investsite scraper succeeded for ${ticker} (attempt ${attempt})`);
        return result;

      } catch (error) {
        this.logger.warn(
          `Investsite scraper failed for ${ticker} (attempt ${attempt}/${this.MAX_RETRIES}): ${error.message}`
        );

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_BASE * attempt; // Backoff: 2s, 4s, 6s
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        } else {
          this.logger.error(`Investsite scraper failed after ${this.MAX_RETRIES} attempts for ${ticker}`);
          throw error;
        }
      }
    }
  }

  private async scrapeInternal(ticker: string): Promise<ScraperResult> {
    // Lógica atual do scraper (renomear método existente)
    // ...
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**4.3. Testar Correção**
```bash
# Testar retry (deve tentar 3x se falhar)
curl -X POST http://localhost:3101/api/v1/scrapers/test/investsite \
  -H "Content-Type: application/json" \
  -d '{"ticker": "TICKER_INVALIDO"}' | jq

# Verificar logs (deve mostrar 3 tentativas)
docker logs invest_backend | grep -i "investsite.*attempt" | tail -10
```

---

### Fase 5: Validação com MCP Triplo ⏱️ 30 minutos

**5.1. Reiniciar Backend**
```bash
docker restart invest_backend
# Aguardar 30s para backend ficar healthy
docker ps --filter "name=invest_backend" --format "{{.Status}}"
```

**5.2. Testar Todos os Scrapers**
```bash
# Testar cada scraper com PETR4
for scraper in fundamentus brapi statusinvest investidor10 fundamentei investsite; do
  echo "Testing $scraper..."
  curl -X POST http://localhost:3101/api/v1/scrapers/test/$scraper \
    -H "Content-Type: application/json" \
    -d '{"ticker": "PETR4"}' | jq '.success'
  sleep 2
done
```

**5.3. Validar Métricas no Banco**
```sql
SELECT
  scraper_id,
  COUNT(*) as total_tests,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successes,
  ROUND(AVG(CASE WHEN response_time > 0 AND response_time < 60000 THEN response_time END)) as avg_time_filtered
FROM scraper_metrics
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY scraper_id
ORDER BY scraper_id;
```

**5.4. Validação Frontend com MCP Triplo**

**Playwright MCP:**
```javascript
// Navegar para /data-sources
await page.goto('http://localhost:3100/data-sources');
await page.waitForSelector('text=Fontes de Dados');

// Screenshot
await page.screenshot({ path: 'validation-screenshots/data-sources-after-fixes.png', fullPage: true });

// Console errors
const errors = await page.evaluate(() => {
  return window.console.errors || [];
});
console.log('Console Errors:', errors.length);
```

**Chrome DevTools MCP:**
```javascript
// Navegar e verificar métricas atualizadas
await navigate('http://localhost:3100/data-sources');
await waitFor('Fundamentei'); // Deve aparecer com taxa > 0%

// Verificar console
const consoleMessages = await listConsoleMessages({ types: ['error', 'warn'] });
console.log('Console Messages:', consoleMessages);
```

**Sequential Thinking MCP:**
- Analisar se taxas de sucesso melhoraram
- Verificar se tempo médio do Fundamentus está razoável (< 30s)
- Confirmar se Fundamentei e Investsite têm taxa > 70%

---

### Fase 6: Atualizar Documentação ⏱️ 15 minutos

**6.1. Atualizar CLAUDE.md**

Adicionar seção:

```markdown
### FASE 26: Manutenção de Scrapers ✅ 100% COMPLETO (2025-11-14)
Correção de 3 problemas não-bloqueantes identificados na Validação MCP Triplo.

**Problemas Corrigidos:**
1. ✅ **Fundamentei Scraper - 0% → X%**
   - Causa: [DESCREVER CAUSA IDENTIFICADA]
   - Solução: [DESCREVER SOLUÇÃO APLICADA]
   - Resultado: Taxa de sucesso agora em X%

2. ✅ **Fundamentus - Tempo Médio 21min → Xs**
   - Causa: Cálculo de média sem filtrar outliers
   - Solução: Filtrar response_time < 60s + usar mediana
   - Resultado: Tempo médio agora em Xs (razoável)

3. ✅ **Investsite - Taxa 61.5% → X%**
   - Causa: Intermitência do site externo
   - Solução: Retry automático (3 tentativas, backoff exponencial)
   - Resultado: Taxa de sucesso agora em X%

**Arquivos Modificados:**
- `backend/src/scrapers/fundamental/fundamentei.scraper.ts` (+XX linhas)
- `backend/src/scrapers/scraper-metrics.service.ts` (+XX linhas)
- `backend/src/scrapers/fundamental/investsite.scraper.ts` (+XX linhas)

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success
- ✅ MCP Triplo: 0 console errors
- ✅ Métricas: 6/6 fontes com taxa > 70%

**Commits:**
- [HASH] - fix: Corrigir Fundamentei scraper (atualizar seletores CSS)
- [HASH] - fix: Corrigir cálculo de avgResponseTime (filtrar outliers)
- [HASH] - feat: Adicionar retry logic em Investsite scraper

**Tempo:** X horas
**Status:** ✅ 100% COMPLETO
```

**6.2. Marcar FASE 25 como Completa**

Atualizar seção FASE 25 no CLAUDE.md:

```markdown
### FASE 25: Refatoração Botão "Solicitar Análises" ✅ 100% COMPLETO (2025-11-XX)
- [x] Remover botão de /assets ✅ (já removido)
- [x] Adicionar botão em /analysis ✅ (já implementado - linha 364)
- [x] Adicionar Tooltip sobre coleta multi-fonte ✅ (já implementado - linha 373-379)
- [x] Validar backend coleta de TODAS as fontes ✅
- [x] Testes de funcionalidade ✅

**Status:** ✅ Implementado anteriormente, documentação atualizada em 2025-11-14
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Técnica
- [ ] TypeScript: 0 erros (backend + frontend)
- [ ] Build: Success (backend + frontend)
- [ ] Console: 0 erros, 0 warnings
- [ ] Testes de scrapers: 6/6 fontes com sucesso
- [ ] Métricas no banco: avgResponseTime razoável (< 30s)
- [ ] Taxa de sucesso: Todas as fontes > 70%

### Funcional
- [ ] Fundamentei: Taxa de sucesso > 70%
- [ ] Fundamentus: Tempo médio < 30s
- [ ] Investsite: Taxa de sucesso > 70%
- [ ] Retry logic: Logs mostram 3 tentativas em caso de falha
- [ ] UI /data-sources: Métricas atualizadas corretamente

### MCP Triplo
- [ ] Playwright: 0 console errors na página /data-sources
- [ ] Chrome DevTools: 0 warnings na página /data-sources
- [ ] Sequential Thinking: Análise lógica confirmando correções

### Documentação
- [ ] CLAUDE.md: Seção FASE 26 adicionada
- [ ] CLAUDE.md: Seção FASE 25 marcada como completa
- [ ] FASE_26_MANUTENCAO_SCRAPERS.md: Completo com resultados
- [ ] Commits: 3 commits com mensagens detalhadas + Co-Authored-By

### Git
- [ ] Git status: Limpo
- [ ] Branch main: Atualizada
- [ ] Push: Realizado com sucesso

---

## 🎯 CRITÉRIOS DE SUCESSO

✅ **APROVADO** se:
1. Fundamentei: Taxa de sucesso ≥ 70%
2. Fundamentus: Tempo médio ≤ 30s
3. Investsite: Taxa de sucesso ≥ 70%
4. TypeScript: 0 erros
5. Console: 0 erros, 0 warnings
6. Git: Limpo e atualizado

❌ **REPROVAR** se:
- Qualquer scraper com taxa < 50%
- Erros de TypeScript
- Console errors não resolvidos
- Git com arquivos não commitados

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-14 18:45
**Estimativa:** 3-4 horas
**Prioridade:** ALTA (Resolver não-bloqueantes antes de novas features)
