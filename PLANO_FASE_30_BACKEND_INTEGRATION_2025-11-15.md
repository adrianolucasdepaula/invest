# PLANO FASE 30 - Backend Integration + Redis Cache (2025-11-15)

**Data:** 2025-11-15
**Autor:** Claude Code (Sonnet 4.5)
**Fase:** 30 - Backend Integration + Redis Cache
**Objetivo:** Criar endpoint backend para proxy de Python Service + implementar cache Redis
**Estimativa:** 97 itens, ~4-6 horas de implementação

---

## 📋 ÍNDICE

1. [Sumário Executivo](#sumário-executivo)
2. [Problemas Identificados](#problemas-identificados)
3. [Solução Proposta](#solução-proposta)
4. [Decisões Técnicas](#decisões-técnicas)
5. [Arquitetura Detalhada](#arquitetura-detalhada)
6. [Implementação Passo-a-Passo](#implementação-passo-a-passo)
7. [Código Completo](#código-completo)
8. [Validação e Testes](#validação-e-testes)
9. [Métricas de Sucesso](#métricas-de-sucesso)
10. [Rollback Plan](#rollback-plan)
11. [Próximos Passos](#próximos-passos)

---

## 📊 SUMÁRIO EXECUTIVO

### Contexto

Durante validação da FASE 29 (Gráficos Avançados), identifiquei **2 bugs críticos** que impedem o funcionamento da página de análise técnica:

1. ❌ Frontend chama endpoint backend inexistente: `GET /api/v1/market-data/${ticker}/prices`
2. ❌ Frontend chama Python Service endpoint incorreto: `POST /technical-analysis/indicators` (deveria ser `/indicators`)

**Status Atual:** Página `/assets/VALE3/technical` retorna **404** em produção.

### Objetivo da FASE 30

Resolver os bugs identificados **E** implementar melhorias de arquitetura:

1. ✅ Criar **MarketDataModule** (novo módulo backend)
2. ✅ Criar endpoint **GET /market-data/:ticker/prices** (proxy para AssetsService)
3. ✅ Criar endpoint **POST /market-data/:ticker/technical** (proxy para Python Service)
4. ✅ Implementar **Cache Redis** (TTL 5min, ~70-85% hit rate esperado)
5. ✅ Atualizar **Frontend** (remover chamada direta ao Python Service)
6. ✅ **Validar** com MCP Triplo (Playwright + Chrome DevTools + Sequential Thinking)
7. ✅ **Documentar** (ARCHITECTURE.md, ROADMAP.md, etc)

### Benefícios Esperados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Response Time (P50) | 300-600ms | <100ms | **3-6x faster** |
| Response Time (P95) | 600-1000ms | <500ms | **2-3x faster** |
| Cache Hit Rate | 0% (sem cache) | 70-85% | **N/A** |
| CORS Errors | Sim (chamada direta Python) | Não | **100% redução** |
| URL Exposure | Sim (localhost:8001) | Não | **Segurança** |

---

## 🔍 PROBLEMAS IDENTIFICADOS

### Problema 1: Endpoint Backend Inexistente

**Arquivo:** `frontend/src/app/(dashboard)/assets/[ticker]/technical/page.tsx:56-58`

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/prices?days=${days}`
);
```

**URL completa:** `http://localhost:3101/api/v1/market-data/${ticker}/prices?days=30`

**Erro:** `404 Not Found`

**Causa:** Endpoint `/market-data/:ticker/prices` **NÃO EXISTE** no backend.

**Endpoint correto existente:** `GET /api/v1/assets/:ticker/price-history`

**Divergência:** Rota e nome diferentes, frontend espera `/market-data/`, backend tem `/assets/`

---

### Problema 2: Python Service Endpoint Incorreto

**Arquivo:** `frontend/src/app/(dashboard)/assets/[ticker]/technical/page.tsx:90`

```typescript
const response = await fetch('http://localhost:8001/technical-analysis/indicators', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prices: [...],
    indicators: {...}
  }),
});
```

**Problemas identificados:**

1. ❌ **Endpoint incorreto:** `/technical-analysis/indicators` (deveria ser `/indicators`)
   - Validado via OpenAPI: `curl http://localhost:8001/openapi.json`
   - Endpoint real: `POST /indicators`

2. ❌ **Chamada direta ao Python Service:**
   - CORS issues (cross-origin request)
   - URL exposta (http://localhost:8001)
   - Sem cache (recalcula toda vez)
   - Sem error handling (se Python Service cair, frontend quebra)

3. ❌ **Sem validação de dados mínimos:**
   - Python Service requer **mínimo 200 data points**
   - Frontend não valida antes de enviar

---

### Problema 3: Arquitetura Atual (Vulnerabilidades)

```
┌─────────────┐
│  Frontend   │
│  Next.js    │
└──────┬──────┘
       │
       ├──────────────────────> ❌ Chamada direta CORS
       │                         http://localhost:8001
       ▼
┌──────────────┐
│ Python Svc   │
│  FastAPI     │
└──────────────┘
```

**Problemas:**
- ❌ CORS (frontend chama backend diferente)
- ❌ URL exposta (localhost:8001 visível no código)
- ❌ Sem cache (performance ruim)
- ❌ Sem retry logic (se Python Service cair, erro imediato)
- ❌ Sem rate limiting (frontend pode sobrecarregar Python Service)

---

## 💡 SOLUÇÃO PROPOSTA

### Arquitetura Nova (Backend Proxy + Cache)

```
┌─────────────┐         ┌─────────────────────────────────┐
│  Frontend   │────────>│  Backend (NestJS)               │
│  Next.js    │  HTTPS  │  /api/v1/market-data/:ticker    │
└─────────────┘         └────────┬────────────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   Redis Cache    │
                        │   TTL: 5min      │
                        │   Hit Rate: 70%+ │
                        └──────────────────┘
                                 │
                   ┌─────────────┴──────────────┐
                   │                            │
                   ▼                            ▼
          ┌─────────────────┐         ┌─────────────────┐
          │  PostgreSQL     │         │ Python Service  │
          │  Prices (DB)    │         │  /indicators    │
          └─────────────────┘         └─────────────────┘
```

**Fluxo de Request:**
1. Frontend → Backend `/market-data/:ticker/technical`
2. Backend → Verifica cache Redis
3. **Cache HIT** → Retorna dados (10-50ms) ✅
4. **Cache MISS** → Fetch prices DB + Call Python Service → Store cache → Return (300-600ms)

**Benefícios:**
- ✅ Sem CORS (tudo via backend)
- ✅ URL interna (Python Service não exposto)
- ✅ Cache inteligente (70-85% hit rate)
- ✅ Error handling (fallback se Python Service cair)
- ✅ Rate limiting (NestJS Throttler)
- ✅ Logging/Metrics (observabilidade)

---

## 🎯 DECISÕES TÉCNICAS

### 1. Cache Pattern: Cache-Aside (Lazy Loading)

**Escolhido:** Cache-Aside com TTL fixo

**Alternativas consideradas:**
- Read-Through: Requer biblioteca avançada
- Write-Through: Não aplicável (writes raros)
- Write-Behind: Risco de perda de dados

**Justificativa:**
- Leituras frequentes (usuário vendo gráficos)
- Writes raros (1x/dia atualização de preços)
- Dados computacionalmente caros (200-500ms Python Service)
- Tolerância a dados levemente desatualizados (5min OK para análise técnica)

**Implementação:**
```typescript
async getTechnicalData(ticker: string, timeframe: string) {
  const cacheKey = this.generateCacheKey(ticker, timeframe);

  // Try cache first
  const cached = await this.cacheService.get(cacheKey);
  if (cached) {
    return { ...cached, metadata: { ...cached.metadata, cached: true } };
  }

  // Cache miss: fetch fresh data
  const data = await this.fetchFreshData(ticker, timeframe);

  // Store in cache
  await this.cacheService.set(cacheKey, data, 300); // TTL 5min

  return { ...data, metadata: { cached: false } };
}
```

---

### 2. Cache Key Strategy: Simplificada

**Escolhido:** `market-data:technical:{ticker}:{timeframe}:all`

**Alternativas consideradas:**
- `{ticker}` apenas → Não diferencia timeframe ❌
- `{ticker}:{timeframe}:{indicators-hash}` → Muitas cache keys, baixo hit rate ❌
- Cache separado prices/indicators → Complexidade desnecessária ❌

**Justificativa:**
- Sempre retornar TODOS os indicadores (SMA, EMA, RSI, MACD, Bollinger, Stochastic, Pivot Points)
- Frontend decide quais exibir (já implementado em FASE 29)
- Reduz número de cache keys → Mais cache hits
- Custo de calcular indicadores extras é mínimo (Python é rápido)

**Exemplos:**
```
market-data:technical:VALE3:1D:all   → Intraday
market-data:technical:VALE3:1MO:all  → 1 mês
market-data:technical:PETR4:1Y:all   → 1 ano
```

**Código:**
```typescript
generateCacheKey(ticker: string, timeframe: string): string {
  return this.cacheService.generateKey('market-data', 'technical', ticker, timeframe, 'all');
}
```

---

### 3. TTL Strategy: Fixo 5 Minutos (MVP)

**Escolhido:** TTL fixo 300s (5min)

**Alternativas consideradas:**
- TTL dinâmico por timeframe (1D=1min, 1Y=1h) → Complexidade ❌
- TTL baseado em horário de pregão (pregão=1min, fora=1h) → Requer scheduler ❌

**Justificativa:**
- **Simplicidade** (KISS principle)
- **Performance gain:** 300-600ms → 10-50ms (6-60x faster)
- **Razoável para todos timeframes** (usuário aceita 5min de delay)
- **Pode evoluir** para TTL dinâmico em FASEs futuras

**Benchmarks de mercado:**
- TradingView: 1-5min
- Yahoo Finance: 15min
- Investing.com: 5min

**Código:**
```typescript
const CACHE_TTL = {
  TECHNICAL_DATA: 300, // 5 minutes (seconds)
};

await this.cacheService.set(cacheKey, data, CACHE_TTL.TECHNICAL_DATA);
```

---

### 4. Invalidation Strategy: TTL Apenas (MVP)

**Escolhido:** TTL passivo (auto-expira após 5min)

**Alternativas consideradas:**
- Manual invalidation (após update) → Complexidade ❌
- SCAN-based pattern invalidation → Para FASE futura ✅
- Set tracking → Overhead de manter sets ❌

**Justificativa:**
- Updates de preços são raros (1x/dia após fechamento)
- TTL 5min já garante dados razoavelmente frescos
- Evita complexidade prematura
- Implementar invalidação manual quando tiver feature de update manual (FASE 31+)

**Para futuro (FASE 31):**
```typescript
async invalidateTicker(ticker: string) {
  const pattern = `market-data:technical:${ticker}:*`;
  let cursor = '0';

  do {
    const [newCursor, keys] = await this.redisClient.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = newCursor;

    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  } while (cursor !== '0');
}
```

---

### 5. Error Handling: Multi-Layer Fallback

**Estratégia:** Graceful degradation em todas as camadas

#### 5.1 Redis Cache Error

```typescript
async getTechnicalData(ticker, timeframe) {
  try {
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;
  } catch (error) {
    // Log warning, continue without cache
    this.logger.warn(`Cache error: ${error.message}`);
  }

  // Fetch fresh data
  const data = await this.fetchFreshData(ticker, timeframe);

  try {
    await this.cacheService.set(cacheKey, data, ttl);
  } catch (error) {
    // Log, but don't fail request
    this.logger.warn(`Cache set error: ${error.message}`);
  }

  return data;
}
```

**Strategy:** Continuar sem cache (degradação de performance, não de funcionalidade)

#### 5.2 Python Service Down/Timeout

```typescript
async callPythonService(ticker, prices) {
  try {
    const response = await this.httpService.post('/indicators', {
      ticker,
      prices,
    }, {
      timeout: 30000, // 30s
      maxRedirects: 0,
    }).toPromise();

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      this.logger.error('Python Service unavailable');
      return null; // Return null, frontend shows prices only
    }

    if (error.code === 'ETIMEDOUT') {
      this.logger.error('Python Service timeout');
      return null;
    }

    throw error; // Re-throw other errors
  }
}
```

**Strategy:** Retornar preços sem indicadores (partial response)

#### 5.3 Database Query Error

```typescript
async getPrices(ticker, timeframe) {
  try {
    const days = this.timeframeToDays(timeframe);

    return await this.assetPriceRepository.find({
      where: { ticker },
      order: { date: 'DESC' },
      take: days,
    });
  } catch (error) {
    this.logger.error(`Database error: ${error.message}`);
    throw new InternalServerErrorException('Failed to fetch price data');
  }
}
```

**Strategy:** Fail fast (throw error, frontend mostra mensagem)

#### 5.4 Insufficient Data Points

```typescript
async getTechnicalData(ticker, timeframe) {
  const prices = await this.getPrices(ticker, timeframe);

  if (prices.length < 200) {
    this.logger.warn(`Insufficient data for ${ticker}: ${prices.length} points`);

    return {
      prices,
      indicators: null,
      metadata: {
        error: 'INSUFFICIENT_DATA',
        message: 'Minimum 200 data points required for technical analysis',
        available: prices.length,
        required: 200,
      },
    };
  }

  // Continue with indicators calculation
  const indicators = await this.pythonServiceClient.callIndicators(ticker, prices);

  return {
    prices,
    indicators,
    metadata: {
      data_points: prices.length,
      cached: false,
    },
  };
}
```

**Strategy:** Partial response (prices + error message)

---

### 6. Performance Targets

**Métricas sem cache (baseline):**
- Database query: ~50-100ms
- Python Service calculation: ~200-500ms
- **Total: ~300-600ms** por request

**Métricas com cache (target):**
- Cache hit: ~5-20ms
- Cache miss: ~300-600ms (igual baseline) + set cache (~5ms)
- **Total com cache hit: ~10-50ms** (6-60x faster!)

**Cache hit rate esperado:**
- Warm-up period: 0-20% (primeiros requests)
- After warm-up: **70-85%** (baseado em padrões de uso)
- Peak hours: 85-95% (múltiplos usuários, mesmos ativos)

**Target SLAs:**
- P50 latency: **<100ms** (50% dos requests)
- P95 latency: **<500ms** (95% dos requests)
- P99 latency: <1000ms (99% dos requests)
- Cache hit rate: **>70%** (após warm-up)
- Error rate: **<1%**

**Logging de métricas:**
```typescript
async getTechnicalData(ticker, timeframe) {
  const startTime = Date.now();
  let cacheHit = false;

  try {
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      cacheHit = true;
      const duration = Date.now() - startTime;
      this.logger.log(`✅ Cache HIT: ${ticker}:${timeframe} (${duration}ms)`);
      return { ...cached, metadata: { ...cached.metadata, cached: true, duration } };
    }
  } catch (error) {
    this.logger.warn(`⚠️ Cache error: ${error.message}`);
  }

  // Fetch fresh data
  const data = await this.fetchFreshData(ticker, timeframe);
  const duration = Date.now() - startTime;
  this.logger.log(`❌ Cache MISS: ${ticker}:${timeframe} (${duration}ms)`);

  return { ...data, metadata: { cached: false, duration } };
}
```

---

### 7. Module Structure: MarketDataModule

**Escolhido:** Criar módulo separado `MarketDataModule`

**Alternativas consideradas:**
- Adicionar ao AssetsModule → Mistura responsabilidades ❌
- Criar TechnicalAnalysisModule → Confunde com AnalysisModule existente ❌

**Justificativa:**
1. **Separation of Concerns:**
   - `AssetsModule`: CRUD de ativos, sync, fundamental data
   - `MarketDataModule`: Preços, indicadores técnicos, dados de mercado real-time
   - `AnalysisModule`: Análises geradas, relatórios, AI insights

2. **Escalabilidade futura:**
   - FASE 31: WebSocket real-time quotes
   - FASE 32: Market depth, order book
   - FASE 33: Economic calendar, market events

3. **API RESTful limpa:**
   - `GET /market-data/:ticker/prices` - Preços históricos
   - `POST /market-data/:ticker/technical` - Análise técnica completa
   - Future: `GET /market-data/:ticker/realtime` - Quote real-time

**Estrutura:**
```
backend/src/api/market-data/
├── market-data.module.ts
├── market-data.controller.ts
├── market-data.service.ts
├── clients/
│   └── python-service.client.ts
├── dto/
│   ├── get-prices.dto.ts
│   ├── get-technical-data.dto.ts
│   └── technical-data-response.dto.ts
└── interfaces/
    ├── price-data.interface.ts
    └── technical-indicators.interface.ts
```

---

## 🏗️ ARQUITETURA DETALHADA

### Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/(dashboard)/assets/[ticker]/technical/page.tsx  │  │
│  │                                                      │  │
│  │  useTechnicalData() hook                            │  │
│  │  ↓                                                   │  │
│  │  POST /api/v1/market-data/:ticker/technical         │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌────────────────────────────────────────────────────────────┐
│              Backend (NestJS) - Port 3101                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MarketDataController                                │  │
│  │  @Post(':ticker/technical')                          │  │
│  │  ↓                                                   │  │
│  │  MarketDataService                                   │  │
│  │  ├─> CacheService (Redis)                           │  │
│  │  ├─> AssetsService (PostgreSQL)                     │  │
│  │  └─> PythonServiceClient (FastAPI)                  │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │ Redis  │  │PostgreSQL│ │ Python   │
    │ Cache  │  │ Prices  │  │ Service  │
    │:6479   │  │ :5532   │  │ :8001    │
    └────────┘  └─────────┘  └──────────┘
```

### Fluxo de Request Detalhado

```
┌─────────┐
│ Frontend│
└────┬────┘
     │ 1. POST /market-data/VALE3/technical?timeframe=1MO
     ▼
┌──────────────────┐
│ MarketData       │
│ Controller       │ 2. Validate DTO (ticker, timeframe)
└────┬─────────────┘
     │ 3. Call service.getTechnicalData('VALE3', '1MO')
     ▼
┌──────────────────┐
│ MarketData       │
│ Service          │
└────┬─────────────┘
     │ 4. Generate cache key: "market-data:technical:VALE3:1MO:all"
     │
     ▼
┌──────────────────┐
│ CacheService     │ 5. Try GET cache key
│ (Redis)          │
└────┬─────────────┘
     │
     ├─> Cache HIT ✅
     │   └─> Return cached data (10-50ms)
     │
     └─> Cache MISS ❌
         │ 6. Fetch prices from PostgreSQL
         ▼
    ┌──────────────────┐
    │ AssetsService    │ 7. Query AssetPrice table
    │ (PostgreSQL)     │    WHERE ticker='VALE3'
    └────┬─────────────┘    ORDER BY date DESC
         │                  TAKE 30 (1MO)
         │ 8. Return 30 price points
         ▼
    ┌──────────────────┐
    │ MarketData       │ 9. Validate ≥200 points?
    │ Service          │    NO → Return {prices, indicators: null, error}
    └────┬─────────────┘    YES → Continue
         │
         │ 10. Call Python Service
         ▼
    ┌──────────────────┐
    │ PythonService    │ 11. POST /indicators
    │ Client           │     Body: {ticker, prices[]}
    └────┬─────────────┘
         │ 12. Python calculates all indicators (200-500ms)
         ▼
    ┌──────────────────┐
    │ Python Service   │ 13. Return indicators JSON
    │ (FastAPI)        │     {sma, ema, rsi, macd, bollinger, etc}
    └────┬─────────────┘
         │
         ▼
    ┌──────────────────┐
    │ MarketData       │ 14. Combine prices + indicators
    │ Service          │
    └────┬─────────────┘
         │ 15. Store in cache (TTL 5min)
         ▼
    ┌──────────────────┐
    │ CacheService     │ 16. SET cache key (300s TTL)
    │ (Redis)          │
    └──────────────────┘
         │ 17. Return to controller
         ▼
    ┌──────────────────┐
    │ MarketData       │ 18. Return response
    │ Controller       │
    └────┬─────────────┘
         │ 19. HTTP 200 OK
         │     {prices: [...], indicators: {...}, metadata: {cached: false}}
         ▼
    ┌─────────┐
    │ Frontend│ 20. Render chart
    └─────────┘
```

**Timing Breakdown:**

**Cache HIT (70-85% dos casos):**
```
1-3.  Controller validation:   5ms
4-5.  Cache lookup (Redis):   10ms
Total:                        15ms ✅
```

**Cache MISS (15-30% dos casos):**
```
1-3.  Controller validation:    5ms
4-5.  Cache lookup (Redis):    10ms (miss)
6-8.  Database query (PG):     80ms
9.    Validation:               5ms
10-13. Python Service call:   400ms
14.   Combine data:            10ms
15-16. Cache store (Redis):    10ms
Total:                        520ms
```

**Performance gain com 70% hit rate:**
```
Average = (0.70 × 15ms) + (0.30 × 520ms)
        = 10.5ms + 156ms
        = 166.5ms

Sem cache: 520ms
Com cache: 166.5ms
Ganho: 3.1x faster! 🚀
```

---

## 🛠️ IMPLEMENTAÇÃO PASSO-A-PASSO

### FASE 2: Criar MarketDataModule

#### 2.1 Criar Estrutura de Diretórios

```bash
mkdir -p backend/src/api/market-data/clients
mkdir -p backend/src/api/market-data/dto
mkdir -p backend/src/api/market-data/interfaces
```

#### 2.2 Criar market-data.module.ts

**Arquivo:** `backend/src/api/market-data/market-data.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PythonServiceClient } from './clients/python-service.client';
import { AssetsModule } from '../assets/assets.module';
import { AssetPrice } from '../../database/entities';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30s timeout
      maxRedirects: 0,
    }),
    TypeOrmModule.forFeature([AssetPrice]),
    ConfigModule,
    AssetsModule, // Para reutilizar AssetsService
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, PythonServiceClient],
  exports: [MarketDataService],
})
export class MarketDataModule {}
```

**Justificativa:**
- `HttpModule`: Para chamar Python Service
- `TypeOrmModule`: Para consultar AssetPrice diretamente (se necessário)
- `AssetsModule`: Reutilizar `AssetsService.getPriceHistory()`
- `exports`: Permite outros módulos usarem MarketDataService

---

#### 2.3 Criar Interfaces

**Arquivo:** `backend/src/api/market-data/interfaces/price-data.interface.ts`

```typescript
export interface PriceDataPoint {
  date: string; // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

**Arquivo:** `backend/src/api/market-data/interfaces/technical-indicators.interface.ts`

```typescript
export interface SmaIndicator {
  [period: string]: number[]; // { "20": [...], "50": [...], "200": [...] }
}

export interface EmaIndicator {
  [period: string]: number[]; // { "9": [...], "21": [...] }
}

export interface RsiIndicator {
  values: number[];
  period: number; // 14
}

export interface MacdIndicator {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerIndicator {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface StochasticIndicator {
  k: number[];
  d: number[];
}

export interface PivotPointsIndicator {
  r2: number[];
  r1: number[];
  pivot: number[];
  s1: number[];
  s2: number[];
}

export interface TechnicalIndicators {
  sma?: SmaIndicator;
  ema?: EmaIndicator;
  rsi?: RsiIndicator;
  macd?: MacdIndicator;
  bollinger?: BollingerIndicator;
  stochastic?: StochasticIndicator;
  pivot_points?: PivotPointsIndicator;
}
```

---

#### 2.4 Criar DTOs

**Arquivo:** `backend/src/api/market-data/dto/get-prices.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum Timeframe {
  ONE_DAY = '1D',
  ONE_MONTH = '1MO',
  THREE_MONTHS = '3MO',
  SIX_MONTHS = '6MO',
  ONE_YEAR = '1Y',
  TWO_YEARS = '2Y',
  FIVE_YEARS = '5Y',
  MAX = 'MAX',
}

export class GetPricesDto {
  @ApiProperty({
    description: 'Timeframe for price data',
    enum: Timeframe,
    example: '1MO',
    required: false,
  })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe;

  @ApiProperty({
    description: 'Number of days (alternative to timeframe)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650) // Max 10 years
  @Type(() => Number)
  days?: number;
}
```

**Arquivo:** `backend/src/api/market-data/dto/get-technical-data.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

enum Timeframe {
  ONE_DAY = '1D',
  ONE_MONTH = '1MO',
  THREE_MONTHS = '3MO',
  SIX_MONTHS = '6MO',
  ONE_YEAR = '1Y',
  TWO_YEARS = '2Y',
  FIVE_YEARS = '5Y',
  MAX = 'MAX',
}

export class GetTechnicalDataDto {
  @ApiProperty({
    description: 'Timeframe for technical analysis',
    enum: Timeframe,
    example: '1MO',
    default: '1MO',
  })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe = Timeframe.ONE_MONTH;
}
```

**Arquivo:** `backend/src/api/market-data/dto/technical-data-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { PriceDataPoint, TechnicalIndicators } from '../interfaces';

class MetadataDto {
  @ApiProperty({ description: 'Number of data points', example: 250 })
  data_points: number;

  @ApiProperty({ description: 'Whether data was served from cache', example: true })
  cached: boolean;

  @ApiProperty({ description: 'Response time in milliseconds', example: 15 })
  duration: number;

  @ApiProperty({ description: 'Error code (if any)', required: false })
  error?: string;

  @ApiProperty({ description: 'Error message (if any)', required: false })
  message?: string;

  @ApiProperty({ description: 'Data points available (if insufficient)', required: false })
  available?: number;

  @ApiProperty({ description: 'Data points required (if insufficient)', required: false })
  required?: number;
}

export class TechnicalDataResponseDto {
  @ApiProperty({
    description: 'Ticker symbol',
    example: 'VALE3',
  })
  ticker: string;

  @ApiProperty({
    description: 'Price data (OHLCV)',
    type: [Object],
  })
  prices: PriceDataPoint[];

  @ApiProperty({
    description: 'Technical indicators (null if insufficient data)',
    type: Object,
    nullable: true,
  })
  indicators: TechnicalIndicators | null;

  @ApiProperty({
    description: 'Metadata about the response',
    type: MetadataDto,
  })
  metadata: MetadataDto;
}
```

---

#### 2.5 Criar PythonServiceClient

**Arquivo:** `backend/src/api/market-data/clients/python-service.client.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, retry } from 'rxjs';
import { PriceDataPoint, TechnicalIndicators } from '../interfaces';

@Injectable()
export class PythonServiceClient {
  private readonly logger = new Logger(PythonServiceClient.name);
  private readonly pythonServiceUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pythonServiceUrl = this.configService.get<string>(
      'PYTHON_SERVICE_URL',
      'http://localhost:8001',
    );
    this.requestTimeout = this.configService.get<number>(
      'PYTHON_SERVICE_TIMEOUT',
      30000, // 30s
    );
  }

  /**
   * Call Python Service to calculate technical indicators
   *
   * @param ticker Ticker symbol
   * @param prices Array of price data points (min 200 required)
   * @returns Technical indicators or null if error
   */
  async calculateIndicators(
    ticker: string,
    prices: PriceDataPoint[],
  ): Promise<TechnicalIndicators | null> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Calling Python Service for ${ticker} (${prices.length} points)`,
      );

      const response = await firstValueFrom(
        this.httpService
          .post<{ indicators: TechnicalIndicators }>(
            `${this.pythonServiceUrl}/indicators`,
            {
              ticker,
              prices,
            },
          )
          .pipe(
            timeout(this.requestTimeout),
            retry({
              count: 3,
              delay: (error, retryCount) => {
                this.logger.warn(
                  `Python Service retry ${retryCount}/3: ${error.message}`,
                );
                return retryCount * 1000; // 1s, 2s, 3s
              },
            }),
          ),
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `Python Service success: ${ticker} (${duration}ms)`,
      );

      return response.data.indicators;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED') {
        this.logger.error(
          `Python Service unavailable (${duration}ms): ${error.message}`,
        );
      } else if (error.name === 'TimeoutError') {
        this.logger.error(
          `Python Service timeout (${duration}ms): ${error.message}`,
        );
      } else {
        this.logger.error(
          `Python Service error (${duration}ms): ${error.message}`,
        );
      }

      // Return null instead of throwing (graceful degradation)
      return null;
    }
  }

  /**
   * Health check for Python Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.pythonServiceUrl}/health`)
          .pipe(timeout(5000)),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Python Service health check failed: ${error.message}`);
      return false;
    }
  }
}
```

---

### FASE 3: Implementar MarketDataService

**Arquivo:** `backend/src/api/market-data/market-data.service.ts`

```typescript
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { CacheService } from '../../common/services/cache.service';
import { AssetsService } from '../assets/assets.service';
import { PythonServiceClient } from './clients/python-service.client';
import { PriceDataPoint, TechnicalIndicators } from './interfaces';
import { TechnicalDataResponseDto } from './dto/technical-data-response.dto';

const CACHE_TTL = {
  TECHNICAL_DATA: 300, // 5 minutes (seconds)
};

const TIMEFRAME_TO_DAYS = {
  '1D': 1,
  '1MO': 30,
  '3MO': 90,
  '6MO': 180,
  '1Y': 365,
  '2Y': 730,
  '5Y': 1825,
  'MAX': 3650,
};

const MIN_DATA_POINTS_FOR_INDICATORS = 200;

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly assetsService: AssetsService,
    private readonly pythonServiceClient: PythonServiceClient,
  ) {}

  /**
   * Get price data for a ticker
   *
   * @param ticker Ticker symbol
   * @param timeframe Timeframe (1D, 1MO, 1Y, etc)
   * @returns Array of price data points
   */
  async getPrices(ticker: string, timeframe: string = '1MO'): Promise<PriceDataPoint[]> {
    const days = TIMEFRAME_TO_DAYS[timeframe] || 30;

    try {
      // Use AssetsService.getPriceHistory (já implementado)
      const prices = await this.assetsService.getPriceHistory(ticker, {
        range: timeframe,
      });

      // Convert to PriceDataPoint format
      return prices.map((p) => ({
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch prices for ${ticker}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch price data');
    }
  }

  /**
   * Get technical analysis data (prices + indicators) with caching
   *
   * @param ticker Ticker symbol
   * @param timeframe Timeframe (1D, 1MO, 1Y, etc)
   * @returns Technical data response with prices, indicators, and metadata
   */
  async getTechnicalData(
    ticker: string,
    timeframe: string = '1MO',
  ): Promise<TechnicalDataResponseDto> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(ticker, timeframe);

    // Try cache first
    try {
      const cached = await this.cacheService.get<TechnicalDataResponseDto>(cacheKey);

      if (cached) {
        const duration = Date.now() - startTime;
        this.logger.log(`✅ Cache HIT: ${ticker}:${timeframe} (${duration}ms)`);

        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
            duration,
          },
        };
      }
    } catch (error) {
      this.logger.warn(`⚠️ Cache error: ${error.message}`);
    }

    // Cache miss: fetch fresh data
    this.logger.debug(`Cache MISS: ${ticker}:${timeframe}, fetching fresh data`);

    const prices = await this.getPrices(ticker, timeframe);

    // Validate minimum data points
    if (prices.length < MIN_DATA_POINTS_FOR_INDICATORS) {
      this.logger.warn(
        `Insufficient data for ${ticker}: ${prices.length}/${MIN_DATA_POINTS_FOR_INDICATORS}`,
      );

      const response: TechnicalDataResponseDto = {
        ticker,
        prices,
        indicators: null,
        metadata: {
          data_points: prices.length,
          cached: false,
          duration: Date.now() - startTime,
          error: 'INSUFFICIENT_DATA',
          message: 'Minimum 200 data points required for technical analysis',
          available: prices.length,
          required: MIN_DATA_POINTS_FOR_INDICATORS,
        },
      };

      return response;
    }

    // Calculate indicators via Python Service
    const indicators = await this.pythonServiceClient.calculateIndicators(ticker, prices);

    const duration = Date.now() - startTime;

    const response: TechnicalDataResponseDto = {
      ticker,
      prices,
      indicators,
      metadata: {
        data_points: prices.length,
        cached: false,
        duration,
        ...(indicators === null && {
          error: 'PYTHON_SERVICE_ERROR',
          message: 'Failed to calculate indicators (Python Service unavailable)',
        }),
      },
    };

    // Store in cache (only if indicators calculated successfully)
    if (indicators !== null) {
      try {
        await this.cacheService.set(cacheKey, response, CACHE_TTL.TECHNICAL_DATA);
        this.logger.debug(`Cached: ${cacheKey} (TTL: ${CACHE_TTL.TECHNICAL_DATA}s)`);
      } catch (error) {
        this.logger.warn(`Cache set error: ${error.message}`);
      }
    }

    this.logger.log(`❌ Cache MISS: ${ticker}:${timeframe} (${duration}ms)`);

    return response;
  }

  /**
   * Generate cache key for technical data
   */
  private generateCacheKey(ticker: string, timeframe: string): string {
    return this.cacheService.generateKey('market-data', 'technical', ticker, timeframe, 'all');
  }

  /**
   * Invalidate cache for a specific ticker (all timeframes)
   * For future use (FASE 31)
   */
  async invalidateTickerCache(ticker: string): Promise<void> {
    this.logger.log(`Invalidating cache for ticker: ${ticker}`);
    // TODO: Implement SCAN-based pattern invalidation
    // For now, just log (TTL will handle expiration)
  }
}
```

---

### FASE 4: Criar MarketDataController

**Arquivo:** `backend/src/api/market-data/market-data.controller.ts`

```typescript
import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import { GetPricesDto, GetTechnicalDataDto, TechnicalDataResponseDto } from './dto';

@ApiTags('market-data')
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get(':ticker/prices')
  @ApiOperation({
    summary: 'Get historical price data for a ticker',
    description: 'Fetches OHLCV price data from database. Supports timeframe or days parameter.',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['1D', '1MO', '3MO', '6MO', '1Y', '2Y', '5Y', 'MAX'] })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiResponse({ status: 200, description: 'Price data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPrices(
    @Param('ticker') ticker: string,
    @Query() query: GetPricesDto,
  ) {
    const timeframe = query.timeframe || '1MO';
    return this.marketDataService.getPrices(ticker, timeframe);
  }

  @Post(':ticker/technical')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get technical analysis data (prices + indicators) with caching',
    description: 'Fetches price data and calculates technical indicators via Python Service. Results are cached for 5 minutes. Returns partial data if Python Service is unavailable or insufficient data points (<200).',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['1D', '1MO', '3MO', '6MO', '1Y', '2Y', '5Y', 'MAX'], example: '1MO' })
  @ApiResponse({
    status: 200,
    description: 'Technical data retrieved successfully',
    type: TechnicalDataResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTechnicalData(
    @Param('ticker') ticker: string,
    @Query() query: GetTechnicalDataDto,
  ): Promise<TechnicalDataResponseDto> {
    const timeframe = query.timeframe || '1MO';
    return this.marketDataService.getTechnicalData(ticker, timeframe);
  }
}
```

---

### FASE 5: Registrar MarketDataModule

**Arquivo:** `backend/src/app.module.ts`

**Adicionar import:**
```typescript
import { MarketDataModule } from './api/market-data/market-data.module';
```

**Adicionar ao imports array:**
```typescript
imports: [
  // ... outros imports
  MarketDataModule, // ← ADICIONAR AQUI
  WebSocketModule,
],
```

---

### FASE 6: Atualizar Frontend

**Arquivo:** `frontend/src/app/(dashboard)/assets/[ticker]/technical/page.tsx`

**Mudanças:**

1. **Remover chamada direta ao Python Service** (linha 88-123)
2. **Criar nova função fetchTechnicalData** que chama backend

**Código atualizado:**

```typescript
// ANTES (linha 88-123):
const fetchIndicators = async (prices: any[]) => {
  try {
    const response = await fetch('http://localhost:8001/technical-analysis/indicators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prices: prices.map((p) => ({
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        })),
        indicators: {
          sma: [20, 50, 200],
          ema: [9, 21],
          rsi: { period: 14 },
          macd: { fast: 12, slow: 26, signal: 9 },
          bollinger: { period: 20, std: 2 },
          stochastic: { k_period: 14, d_period: 3 },
          pivot_points: { type: 'standard' },
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch indicators');

    const data = await response.json();
    setIndicators(data);
  } catch (error) {
    console.error('Error fetching indicators:', error);
  }
};

// DEPOIS:
const fetchTechnicalData = async (timeframe: string) => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/technical?timeframe=${timeframe}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch technical data');

    const data = await response.json();

    // Set prices
    setPriceData(data.prices);

    // Set current price and change
    if (data.prices.length > 0) {
      const latest = data.prices[data.prices.length - 1];
      const previous = data.prices[data.prices.length - 2];
      setCurrentPrice(latest.close);
      if (previous) {
        const change = ((latest.close - previous.close) / previous.close) * 100;
        setPriceChange(change);
      }
    }

    // Set indicators (may be null if insufficient data or Python Service error)
    setIndicators(data.indicators);

    // Log metadata (cache hit/miss, duration, errors)
    console.log('Technical data metadata:', data.metadata);

    // Show error message if insufficient data
    if (data.metadata.error === 'INSUFFICIENT_DATA') {
      console.warn(
        `Insufficient data: ${data.metadata.available}/${data.metadata.required} points`
      );
      // TODO: Show toast notification
    }

    // Show error message if Python Service error
    if (data.metadata.error === 'PYTHON_SERVICE_ERROR') {
      console.warn('Indicators unavailable (Python Service error)');
      // TODO: Show toast notification
    }
  } catch (error) {
    console.error('Error fetching technical data:', error);
    // TODO: Show toast notification
  } finally {
    setIsLoading(false);
  }
};
```

**Atualizar useEffect** (linha 37-86):

```typescript
// ANTES:
useEffect(() => {
  const fetchPriceData = async () => {
    setIsLoading(true);
    try {
      const days = periodMap[timeframe] || 30;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/market-data/${ticker}/prices?days=${days}`
      );
      if (!response.ok) throw new Error('Failed to fetch price data');
      const data = await response.json();
      setPriceData(data);
      // ... set current price and change
      await fetchIndicators(data);
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  fetchPriceData();
}, [ticker, timeframe]);

// DEPOIS:
useEffect(() => {
  fetchTechnicalData(timeframe);
}, [ticker, timeframe]);
```

**Remover:**
- Mapa `periodMap` (linha 43-52) - não mais necessário
- Função `fetchIndicators` (linha 88-123) - substituída por `fetchTechnicalData`

---

### FASE 7: Adicionar Variáveis de Ambiente

**Arquivo:** `backend/.env`

**Adicionar:**
```bash
# Python Service
PYTHON_SERVICE_URL=http://python-service:8001
PYTHON_SERVICE_TIMEOUT=30000

# Cache TTL (seconds)
CACHE_TTL_TECHNICAL_DATA=300
```

**Arquivo:** `backend/.env.example`

**Adicionar:**
```bash
# Python Service Configuration
PYTHON_SERVICE_URL=http://python-service:8001
PYTHON_SERVICE_TIMEOUT=30000  # 30 seconds

# Cache TTL (seconds)
CACHE_TTL_TECHNICAL_DATA=300  # 5 minutes
```

---

## ✅ VALIDAÇÃO E TESTES

### Validação TypeScript

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

**Expectativa:** 0 erros

### Validação Build

```bash
cd backend && npm run build
cd frontend && npm run build
```

**Expectativa:**
- Backend: "Compiled successfully"
- Frontend: "17 routes compiled successfully"

### Teste Manual (Playwright)

**Arquivo:** `frontend/tests/technical-analysis-fase-30.spec.ts` (criar novo)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Technical Analysis Page - FASE 30 (Backend Integration)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3100/login');
    await page.fill('input[type="email"]', 'admin@invest.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should load technical data from backend (cache miss)', async ({ page }) => {
    // Intercept network request
    await page.route('**/market-data/VALE3/technical*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('ticker');
      expect(data).toHaveProperty('prices');
      expect(data).toHaveProperty('indicators');
      expect(data).toHaveProperty('metadata');

      // Validate metadata
      expect(data.metadata.cached).toBe(false); // First request = cache miss
      expect(data.metadata.data_points).toBeGreaterThan(0);
      expect(data.metadata.duration).toBeDefined();

      route.fulfill({ response });
    });

    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await page.waitForTimeout(2000); // Wait for request
  });

  test('should load technical data from cache (cache hit)', async ({ page }) => {
    // First request (prime cache)
    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await page.waitForTimeout(2000);

    // Second request (should hit cache)
    await page.reload();

    await page.route('**/market-data/VALE3/technical*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();

      // Validate cache hit
      expect(data.metadata.cached).toBe(true);
      expect(data.metadata.duration).toBeLessThan(100); // <100ms for cache hit

      route.fulfill({ response });
    });

    await page.waitForTimeout(2000);
  });

  test('should handle insufficient data gracefully', async ({ page }) => {
    // Mock response with insufficient data
    await page.route('**/market-data/TEST1/technical*', async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ticker: 'TEST1',
          prices: new Array(50).fill({ date: '2025-01-01', open: 10, high: 11, low: 9, close: 10, volume: 1000 }),
          indicators: null,
          metadata: {
            data_points: 50,
            cached: false,
            duration: 100,
            error: 'INSUFFICIENT_DATA',
            message: 'Minimum 200 data points required for technical analysis',
            available: 50,
            required: 200,
          },
        }),
      });
    });

    await page.goto('http://localhost:3100/assets/TEST1/technical');
    await page.waitForTimeout(2000);

    // Validate console warning (verificar no console do navegador)
    const consoleMessages = [];
    page.on('console', (msg) => consoleMessages.push(msg.text()));

    expect(consoleMessages.some(msg => msg.includes('Insufficient data'))).toBe(true);
  });

  test('should display chart even without indicators', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await page.waitForTimeout(3000);

    // Check candlestick chart (should render even if indicators = null)
    await expect(page.locator('canvas').first()).toBeVisible();

    // Check price is displayed
    await expect(page.locator('text=/R\\$ \\d+\\.\\d{2}/')).toBeVisible();
  });

  test('should log cache metadata in console', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', (msg) => {
      if (msg.text().includes('Technical data metadata')) {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await page.waitForTimeout(2000);

    // Validate metadata logged
    expect(consoleMessages.length).toBeGreaterThan(0);
  });
});
```

**Executar:**
```bash
cd frontend
npx playwright test technical-analysis-fase-30.spec.ts --headed
```

---

### Teste de Performance (Manual)

**Script:** `backend/scripts/test-cache-performance.ts`

```typescript
// Test cache performance

import fetch from 'node-fetch';

async function testCachePerformance() {
  const ticker = 'VALE3';
  const timeframe = '1MO';
  const url = `http://localhost:3101/api/v1/market-data/${ticker}/technical?timeframe=${timeframe}`;
  const iterations = 10;

  console.log(`Testing cache performance: ${iterations} requests\n`);

  const timings = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();

    const duration = Date.now() - start;
    timings.push(duration);

    console.log(
      `Request ${i + 1}/${iterations}: ${duration}ms (cached: ${data.metadata.cached}, backend duration: ${data.metadata.duration}ms)`,
    );

    // Wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const avg = timings.reduce((sum, t) => sum + t, 0) / timings.length;
  const min = Math.min(...timings);
  const max = Math.max(...timings);
  const p50 = timings.sort((a, b) => a - b)[Math.floor(timings.length * 0.5)];
  const p95 = timings.sort((a, b) => a - b)[Math.floor(timings.length * 0.95)];

  console.log(`\n📊 Statistics:`);
  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min}ms`);
  console.log(`   Max: ${max}ms`);
  console.log(`   P50 (median): ${p50}ms`);
  console.log(`   P95: ${p95}ms`);

  // Check SLA compliance
  console.log(`\n✅ SLA Compliance:`);
  console.log(`   P50 < 100ms: ${p50 < 100 ? '✅ PASS' : '❌ FAIL'} (${p50}ms)`);
  console.log(`   P95 < 500ms: ${p95 < 500 ? '✅ PASS' : '❌ FAIL'} (${p95}ms)`);
}

testCachePerformance().catch(console.error);
```

**Executar:**
```bash
cd backend
npx ts-node scripts/test-cache-performance.ts
```

**Expectativa:**
```
Testing cache performance: 10 requests

Request 1/10: 523ms (cached: false, backend duration: 520ms)  ← Cache MISS
Request 2/10: 18ms (cached: true, backend duration: 15ms)     ← Cache HIT
Request 3/10: 20ms (cached: true, backend duration: 17ms)     ← Cache HIT
Request 4/10: 19ms (cached: true, backend duration: 16ms)     ← Cache HIT
Request 5/10: 21ms (cached: true, backend duration: 18ms)     ← Cache HIT
Request 6/10: 17ms (cached: true, backend duration: 14ms)     ← Cache HIT
Request 7/10: 19ms (cached: true, backend duration: 16ms)     ← Cache HIT
Request 8/10: 18ms (cached: true, backend duration: 15ms)     ← Cache HIT
Request 9/10: 20ms (cached: true, backend duration: 17ms)     ← Cache HIT
Request 10/10: 19ms (cached: true, backend duration: 16ms)    ← Cache HIT

📊 Statistics:
   Average: 69.40ms
   Min: 17ms
   Max: 523ms
   P50 (median): 19ms
   P95: 523ms

✅ SLA Compliance:
   P50 < 100ms: ✅ PASS (19ms)
   P95 < 500ms: ❌ FAIL (523ms)  ← Primeira request é MISS

Cache hit rate: 90% (9/10 requests)
```

---

## 📈 MÉTRICAS DE SUCESSO

| Métrica | Target | Como Medir | Status |
|---------|--------|------------|--------|
| **Response Time P50** | <100ms | Playwright + console.log metadata.duration | ⏳ |
| **Response Time P95** | <500ms | Script test-cache-performance.ts | ⏳ |
| **Cache Hit Rate** | >70% | Backend logs `Cache HIT` vs `Cache MISS` | ⏳ |
| **Error Rate** | <1% | Backend error logs | ⏳ |
| **TypeScript Errors** | 0 | `npx tsc --noEmit` | ⏳ |
| **Build Errors** | 0 | `npm run build` | ⏳ |
| **Playwright Tests** | 100% pass | `npx playwright test` | ⏳ |

---

## 🔄 ROLLBACK PLAN

Se algo der errado:

### Rollback Git

```bash
git revert HEAD  # Reverter último commit
git push origin main
```

### Rollback Manual

1. **Remover MarketDataModule:**
   ```bash
   rm -rf backend/src/api/market-data
   ```

2. **Restaurar app.module.ts:**
   ```bash
   git checkout HEAD~ -- backend/src/app.module.ts
   ```

3. **Restaurar frontend:**
   ```bash
   git checkout HEAD~ -- frontend/src/app/(dashboard)/assets/[ticker]/technical/page.tsx
   ```

4. **Rebuild:**
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```

---

## 🚀 PRÓXIMOS PASSOS (FASE 31+)

### FASE 31: Melhorias de Cache
- Invalidação manual de cache (SCAN-based)
- TTL dinâmico por timeframe
- Cache warming (pré-carregar ativos populares)
- Distributed locking (prevenir cache stampede)

### FASE 32: Real-Time Data
- WebSocket connection para quotes real-time
- Server-Sent Events (SSE) para updates
- Market depth / Order book

### FASE 33: Observabilidade
- Prometheus metrics (cache hit rate, latency, etc)
- Grafana dashboards
- Distributed tracing (OpenTelemetry)

---

**Fim do PLANO_FASE_30.md**

**Total de linhas:** 1,700+ ✅ (meta: 500+)

**Próximo:** Implementação FASE 2-8 (97 itens)
