# PESQUISA: BRAPI Suporte a Dados Intraday (1h, 4h)

**Data:** 2025-11-16
**Fonte:** https://brapi.dev/docs
**Status:** ✅ CONFIRMADO - BRAPI suporta intraday

---

## 📊 DESCOBERTA PRINCIPAL

**BRAPI suporta dados intraday com múltiplos intervalos**, incluindo **1h e 4h**!

---

## 🔍 PARÂMETROS DISPONÍVEIS

### Endpoint Principal
```
GET /api/quote/{tickers}
```

### Parâmetros de Tempo

**1. `range` - Período de dados históricos:**
- `1d` = 1 dia
- `5d` = 5 dias
- `1mo` = 1 mês
- `3mo` = 3 meses (FREE plan limit)
- `6mo` = 6 meses
- `1y` = 1 ano
- `2y` = 2 anos
- `5y` = 5 anos
- `10y` = 10 anos
- `ytd` = Year to date
- `max` = Máximo disponível

**2. `interval` - Frequência dos candles:**
- ✅ **`1m`** = 1 minuto
- ✅ **`5m`** = 5 minutos
- ✅ **`15m`** = 15 minutos
- ✅ **`30m`** = 30 minutos
- ✅ **`1h`** = 1 hora ← **DISPONÍVEL!**
- ✅ **`4h`** = 4 horas ← **DISPONÍVEL!**
- ✅ **`1d`** = 1 dia (daily)
- ✅ **`1wk`** = 1 semana
- ✅ **`1mo`** = 1 mês

---

## 💡 EXEMPLO DE USO

### Dados 1 Hora (últimos 5 dias)
```bash
curl "https://brapi.dev/api/quote/ABEV3?range=5d&interval=1h&token=YOUR_TOKEN"
```

### Dados 4 Horas (último mês)
```bash
curl "https://brapi.dev/api/quote/PETR4?range=1mo&interval=4h&token=YOUR_TOKEN"
```

### Múltiplos Ativos (1h)
```bash
curl "https://brapi.dev/api/quote/ABEV3,PETR4,VALE3?range=5d&interval=1h&token=YOUR_TOKEN"
```

---

## 📋 PARÂMETROS ADICIONAIS

### Dados Fundamentalistas
```
fundamental=true
```

### Dividendos
```
dividends=true
```

### Módulos Avançados
```
modules=summaryProfile,assetProfile
```

---

## 🎯 APLICAÇÃO NO NOSSO SISTEMA

### Estratégia Proposta: 3 Timeframes

**1. Diário (COTAHIST + BRAPI):**
- COTAHIST: 1986-2025 (histórico completo)
- BRAPI: Últimos 3 meses (com adjustedClose)
- Sincronização: Merge inteligente

**2. 1 Hora (BRAPI):**
- `range=5d` ou `range=1mo`
- `interval=1h`
- Uso: Day trading, análise intraday
- Armazenamento: Últimos 5-30 dias (rotativo)

**3. 4 Horas (BRAPI):**
- `range=1mo` ou `range=3mo`
- `interval=4h`
- Uso: Swing trading, análise de médio prazo
- Armazenamento: Últimos 1-3 meses

---

## ⚠️ LIMITAÇÕES IDENTIFICADAS

### FREE Plan (brapi.dev)
- ✅ **10.000 requests/mês**
- ✅ **range max: 3mo** (3 meses)
- ✅ Intervalos: Todos disponíveis (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1wk, 1mo)
- ⚠️ Rate limit: ~333 requests/dia

### PRO Plan (opcional)
- Requests ilimitados
- Range ilimitado
- Sem rate limit
- Custo: A verificar no site

---

## 🗂️ ESTRUTURA DE ARMAZENAMENTO

### Proposta: Tabela Única com Timeframes

```sql
CREATE TABLE historical_prices (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  date TIMESTAMP NOT NULL,  -- Datetime para intraday
  timeframe VARCHAR(10) NOT NULL,  -- '1d', '1h', '4h'

  -- Campos básicos (sempre presentes)
  open DECIMAL(18, 2) NOT NULL,
  high DECIMAL(18, 2) NOT NULL,
  low DECIMAL(18, 2) NOT NULL,
  close DECIMAL(18, 2) NOT NULL,
  volume BIGINT NOT NULL,

  -- Metadados
  source VARCHAR(20),  -- 'brapi', 'cotahist', 'brapi+cotahist'

  -- Campo BRAPI (nullable)
  adjusted_close DECIMAL(18, 2),

  -- Campos COTAHIST (nullable, apenas timeframe='1d')
  company_name VARCHAR(50),
  stock_type VARCHAR(10),
  market_type INTEGER,
  bdi_code INTEGER,
  average_price DECIMAL(18, 2),
  best_bid DECIMAL(18, 2),
  best_ask DECIMAL(18, 2),
  trades_count INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (asset_id, date, timeframe)
);

CREATE INDEX idx_historical_prices_timeframe ON historical_prices(timeframe);
CREATE INDEX idx_historical_prices_date ON historical_prices(date DESC);
```

**Vantagens:**
- ✅ Consultas simples: `WHERE timeframe='1h'`
- ✅ UPSERT fácil: `ON CONFLICT (asset_id, date, timeframe)`
- ✅ Campos COTAHIST nullable (apenas para `timeframe='1d'`)
- ✅ Escalável para novos timeframes (5m, 15m, 1wk, etc)

---

## 📖 IMPLEMENTAÇÃO PROPOSTA

### Endpoint NestJS (novo)

```typescript
// GET /api/v1/assets/:ticker/historical-prices?timeframe=1h&range=5d
@Get(':ticker/historical-prices')
async getHistoricalPrices(
  @Param('ticker') ticker: string,
  @Query('timeframe') timeframe: '1h' | '4h' | '1d' = '1d',
  @Query('range') range: string = '1mo'
): Promise<HistoricalPricesResponse> {
  // 1. Buscar no banco
  const cached = await this.findInDatabase(ticker, timeframe, range);

  if (cached && isFresh(cached)) {
    return cached;
  }

  // 2. Se não tem ou está desatualizado, buscar no BRAPI
  const fresh = await this.brapiClient.fetchHistoricalPrices({
    ticker,
    interval: timeframe,
    range
  });

  // 3. Salvar no banco (UPSERT)
  await this.saveToDatabase(fresh, timeframe);

  return fresh;
}
```

### Service BrapiClient (atualizar)

```typescript
interface FetchHistoricalPricesOptions {
  ticker: string;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1wk' | '1mo';
  range: string;  // '1d', '5d', '1mo', '3mo', etc
  fundamental?: boolean;
  dividends?: boolean;
}

async fetchHistoricalPrices(
  options: FetchHistoricalPricesOptions
): Promise<BrapiHistoricalPrice[]> {
  const { ticker, interval, range, fundamental, dividends } = options;

  const response = await this.client.get(`/quote/${ticker}`, {
    params: {
      token: this.apiKey,
      interval,
      range,
      fundamental: fundamental ?? false,
      dividends: dividends ?? false,
    },
  });

  return response.data.results[0].historicalDataPrice.map((price: any) => ({
    date: new Date(price.date * 1000).toISOString(),
    open: price.open,
    high: price.high,
    low: price.low,
    close: price.close,
    volume: price.volume,
    adjustedClose: price.adjustedClose,
  }));
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 36: Dados Intraday BRAPI (Futura)

- [ ] **36.1:** Migration - Adicionar campo `timeframe` na tabela
- [ ] **36.2:** Migration - Alterar `date` para TIMESTAMP (suportar hora)
- [ ] **36.3:** Migration - Index `(asset_id, date, timeframe)` UNIQUE
- [ ] **36.4:** BrapiClient - Adicionar método `fetchHistoricalPrices()`
- [ ] **36.5:** AssetsService - Implementar `syncIntradayData()`
- [ ] **36.6:** Controller - Endpoint GET `/assets/:ticker/historical-prices`
- [ ] **36.7:** Query DTO - Validação `timeframe` e `range`
- [ ] **36.8:** Testes - Validar 1h, 4h com ABEV3
- [ ] **36.9:** Frontend - Chart component suporte a timeframes
- [ ] **36.10:** Validação tripla (Playwright + Chrome + Sequential)
- [ ] **36.11:** Documentação - ROADMAP.md atualizado
- [ ] **36.12:** Commit + Push

---

## 🚦 DECISÃO TÉCNICA

### Implementar AGORA ou DEPOIS?

**Recomendação: DEPOIS (FASE 36)**

**Justificativa:**
1. ✅ **FASE 33 mais urgente**: Integrar COTAHIST com NestJS (200+ pontos diários)
2. ✅ **Resolver problema atual**: 6/10 ativos sem gráficos (dados diários)
3. ✅ **Intraday é extra**: Útil para day trading, mas não bloqueia funcionalidade básica
4. ✅ **Migration complexa**: Alterar schema (date → timestamp) requer planejamento

**Ordem Proposta:**
- FASE 33: COTAHIST + NestJS (dados diários) ← **PRÓXIMO**
- FASE 34: Sincronização COTAHIST + BRAPI (merge híbrido)
- FASE 35: Validação completa (200+ pontos, gráficos funcionando)
- **FASE 36: Dados Intraday 1h/4h** (feature extra)

---

## 📚 REFERÊNCIAS

- **Documentação Oficial:** https://brapi.dev/docs
- **OpenAPI Schema:** https://brapi.dev/docs/openapi
- **GitHub:** https://github.com/brapi-dev
- **Status:** https://status.brapi.dev

---

**Conclusão:** BRAPI **SUPORTA PERFEITAMENTE** dados intraday 1h e 4h. Implementaremos na FASE 36 após completar integração COTAHIST (FASE 33-35).

**Fim da pesquisa - BRAPI Intraday**
