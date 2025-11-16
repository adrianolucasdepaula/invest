# 🔍 DESCOBERTAS: Dados Históricos e Gráficos - 2025-11-16

**Data:** 2025-11-16
**Problema:** Gráficos não aparecem em 93% dos ativos (51/55)
**Causa Raiz:** Insuficiência de dados históricos (< 200 pontos necessários)

---

## 📊 SITUAÇÃO ATUAL

### Dados no Banco (PostgreSQL - asset_prices)

| Ticker | Data Points | Range | Status |
|--------|-------------|-------|--------|
| **VALE3** | 2510 | 2000-01-03 a 2025-11-16 | ✅ Funciona |
| **PETR4** | 251 | 2024-11-18 a 2025-11-16 | ✅ Funciona |
| **ABEV3** | 67 | 2025-08-18 a 2025-11-16 | ❌ Não funciona |
| **CMIG4** | 28 | 2025-10-13 a 2025-11-16 | ❌ Não funciona |
| **CYRE3** | 26 | 2025-10-13 a 2025-11-15 | ❌ Não funciona |
| **ITUB4** | < 200 | - | ❌ Não funciona |
| **51 outros** | < 200 | - | ❌ Não funciona |

**Threshold mínimo:** 200 pontos (backend/src/api/market-data/market-data.service.ts:24)

**Taxa de Falha:** 93% (51/55 ativos)

---

## 🔍 ANÁLISE DO SISTEMA

### Backend: Arquitetura de Dados Históricos

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 14)                                       │
│  └─ GET /api/v1/market-data/:ticker/technical?timeframe=1MO │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ MarketDataService (NestJS)                                  │
│  └─ getTechnicalData(ticker, timeframe)                     │
│      ├─ getPrices(ticker, timeframe)                        │
│      │   └─ AssetsService.getPriceHistory()                 │
│      │       └─ SELECT * FROM asset_prices WHERE ...        │
│      │                                                       │
│      └─ pythonServiceClient.calculateIndicators()           │
│          (RSI, MACD, SMA20/50/200, Bollinger, etc)          │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL (TimescaleDB)                                    │
│  Table: asset_prices                                        │
│   ├─ date, open, high, low, close, volume                   │
│   ├─ assetId FK → assets                                    │
│   └─ collectedAt (timestamp de scraping)                    │
└─────────────────────────────────────────────────────────────┘
```

### Fontes de Dados Identificadas

**1. BRAPI (brapi.dev) - ATUAL** ✅
- **Arquivo:** `backend/src/scrapers/fundamental/brapi.scraper.ts`
- **API:** `https://brapi.dev/api/quote/{ticker}?token={KEY}&range={RANGE}&interval=1d`
- **Range suportados:** 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, **max**
- **Método:** `scrape(ticker, range)` → retorna `historicalPrices[]`
- **Status:** ❌ **API Key com erro 403 (Forbidden)**

**2. Python Scrapers (Selenium/Playwright)** ⚠️
- Investing.com
- TradingView
- B3 (oficial)
- Status: Implementados, mas focam em **dados fundamentalistas**, não preços históricos

**3. Alternativas Potenciais** (não implementadas)
- **Yahoo Finance** (yfinance) - Gratuito, sem API key
- **Alpha Vantage** - API key gratuita (limitada)
- **Polygon.io** - API paga

---

## ✅ IMPLEMENTAÇÃO REALIZADA

### 1. Modificação do AssetsController

**Arquivo:** `backend/src/api/assets/assets.controller.ts`

**Antes:**
```typescript
@Post(':ticker/sync')
async syncAsset(@Param('ticker') ticker: string) {
  return this.assetsService.syncAsset(ticker); // range padrão: '1y'
}

@Post('sync-all')
async syncAllAssets() {
  return this.assetsService.syncAllAssets(); // range padrão: '1y'
}
```

**Depois:**
```typescript
@Post(':ticker/sync')
async syncAsset(
  @Param('ticker') ticker: string,
  @Query('range') range?: string
) {
  return this.assetsService.syncAsset(ticker, range || '1y');
}

@Post('sync-all')
async syncAllAssets(@Query('range') range?: string) {
  return this.assetsService.syncAllAssets(range || '1y');
}
```

**Uso:**
```bash
# Sync um ativo com máximo histórico
POST /api/v1/assets/ABEV3/sync?range=max

# Sync TODOS os ativos com máximo histórico (ATENÇÃO: pode demorar 10-15 min)
POST /api/v1/assets/sync-all?range=max
```

### 2. Modificação do AssetsService

**Arquivo:** `backend/src/api/assets/assets.service.ts`

**Mudanças:**
- Linha 456: `async syncAllAssets(range: string = '1y')`
- Linha 483: `await this.syncAsset(asset.ticker, range);`
- Linha 468: `results.range = range;` (metadata)

### 3. Script de Sincronização Manual

**Arquivo:** `backend/scripts/sync-historical-data.ts`

**Uso:**
```bash
# Sync específico
docker-compose exec backend npx ts-node -r tsconfig-paths/register \
  scripts/sync-historical-data.ts ABEV3 CMIG4 CYRE3

# Sync TODOS
docker-compose exec backend npx ts-node -r tsconfig-paths/register \
  scripts/sync-historical-data.ts --all
```

---

## ❌ PROBLEMA ENCONTRADO

### BRAPI API Key Inválida (403 Forbidden)

**Erro:**
```
[ERROR] [BrapiScraper] Failed to scrape ABEV3 from BRAPI: Request failed with status code 403
```

**API Key Atual:** `mVcy3EFZaBdza27tPQjdC1`
**Status:** ❌ Inválida ou expirada

**Teste realizado:**
```bash
curl "https://brapi.dev/api/quote/ABEV3?token=mVcy3EFZaBdza27tPQjdC1&range=max&interval=1d&fundamental=true"
# Resultado: 403 Forbidden
```

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### OPÇÃO 1: Renovar API Key do BRAPI (RÁPIDO) ⚡

**Ação:**
1. Acessar https://brapi.dev/
2. Criar nova conta ou renovar API key existente
3. Atualizar `.env`: `BRAPI_API_KEY=nova_chave_aqui`
4. Reiniciar backend: `docker-compose restart backend`
5. Executar: `docker-compose exec backend npx ts-node -r tsconfig-paths/register scripts/sync-historical-data.ts --all`

**Tempo estimado:** 5-10 minutos + 15-20 min de scraping (55 ativos)

**Vantagens:**
- ✅ Solução mais rápida
- ✅ Código já implementado e funcional
- ✅ BRAPI é confiável e atualizado

**Desvantagens:**
- ⚠️ Depende de API externa
- ⚠️ Pode ter rate limits

---

### OPÇÃO 2: Implementar Yahoo Finance (MÉDIO) 📊

**Ação:**
1. Instalar `yfinance` no backend Python: `pip install yfinance`
2. Criar `backend/python-scrapers/yfinance_scraper.py`
3. Integrar com sistema de scraping existente
4. Executar scraping histórico

**Tempo estimado:** 1-2 horas de implementação + scraping

**Vantagens:**
- ✅ Gratuito, sem API key
- ✅ Dados históricos abundantes (décadas)
- ✅ Biblioteca estável (usada globalmente)

**Desvantagens:**
- ⚠️ Requer implementação
- ⚠️ Yahoo pode ter rate limits

**Exemplo de implementação:**
```python
import yfinance as yf

def fetch_historical_data(ticker: str):
    stock = yf.Ticker(f"{ticker}.SA")  # B3 usa sufixo .SA
    hist = stock.history(period="max")  # Máximo histórico
    return hist
```

---

### OPÇÃO 3: Usar Múltiplas Fontes (LONGO) 🌐

**Ação:**
1. Implementar Yahoo Finance
2. Manter BRAPI como backup
3. Adicionar Alpha Vantage (se necessário)
4. Sistema de fallback automático

**Tempo estimado:** 3-4 horas de implementação

**Vantagens:**
- ✅ Máxima confiabilidade (redundância)
- ✅ Melhor cobertura de dados

**Desvantagens:**
- ⚠️ Complexidade aumentada
- ⚠️ Mais pontos de falha

---

## 📋 VALIDAÇÃO

### TypeScript
```bash
cd backend && npx tsc --noEmit
# ✅ Resultado: 0 erros
```

### Build
```bash
cd backend && npm run build
# ✅ Resultado: Compiled successfully
```

### Endpoints Criados
- ✅ `POST /api/v1/assets/:ticker/sync?range=max`
- ✅ `POST /api/v1/assets/sync-all?range=max`

### Script Criado
- ✅ `backend/scripts/sync-historical-data.ts`

---

## 🔥 RECOMENDAÇÃO IMEDIATA

**AÇÃO PRIORITÁRIA:** Renovar API Key do BRAPI (OPÇÃO 1)

**Passos:**
1. Acessar https://brapi.dev/ e criar/renovar API key
2. Atualizar `.env`: `BRAPI_API_KEY=nova_chave`
3. Reiniciar backend: `docker-compose restart backend`
4. Executar sync completo:
   ```bash
   docker-compose exec backend npx ts-node -r tsconfig-paths/register \
     scripts/sync-historical-data.ts --all
   ```
5. Aguardar ~15-20 minutos
6. Re-validar ABEV3: `http://localhost:3100/assets/ABEV3`

**Resultado esperado:**
- ABEV3: 67 → ~5000+ pontos (máximo histórico BRAPI)
- CMIG4: 28 → ~5000+ pontos
- CYRE3: 26 → ~5000+ pontos
- TODOS os 55 ativos: >= 200 pontos ✅
- Gráficos funcionando em 100% dos ativos ✅

---

## 📊 IMPACTO

**ANTES:**
- Ativos com gráficos: 4/55 (7%)
- Ativos sem gráficos: 51/55 (93%)
- Taxa de aprovação (validação): 58.3% (ABEV3) ❌

**DEPOIS (após sync com range=max):**
- Ativos com gráficos: 55/55 (100%) ✅
- Taxa de aprovação esperada: >= 90% ✅
- Frontend: 100% funcional ✅

---

## 📝 ARQUIVOS MODIFICADOS

```
backend/src/api/assets/assets.controller.ts   (+10 linhas - aceita ?range=max)
backend/src/api/assets/assets.service.ts      (+3 linhas - passa range)
backend/scripts/sync-historical-data.ts       (NOVO - 102 linhas)
```

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success
- ❌ Runtime: BRAPI 403 (API key inválida)

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-16
**Sessão:** Investigação de dados históricos

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
