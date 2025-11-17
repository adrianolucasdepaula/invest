# 📋 TODO FASE 36 - Intraday Data Support (1H, 4H Intervals)

**Projeto:** B3 AI Analysis Platform
**Data Criação:** 2025-11-17
**Base:** FASE 35 - 100% COMPLETA ✅ (Candle Timeframes 1D/1W/1M)
**Complexidade:** 🔴 ALTA (Database migration + Breaking changes)
**Prioridade:** ⭐⭐⭐ MÉDIA-ALTA
**Duração Estimada:** 5-7 dias

---

## 🎯 OBJETIVO

Implementar suporte completo a dados intraday (1H, 4H) para análise de day trading e swing trading, incluindo:

1. **Database migration** - Adicionar coluna `timeframe` + mudar `date` → `timestamp`
2. **Backend adaptation** - Atualizar entities, DTOs, services para suportar timeframe
3. **Data fetching** - Integrar brapi intraday intervals (1h, 4h confirmado funcional)
4. **Frontend UI** - Adicionar seletor 1H/4H no timeframe-range-picker
5. **Validation** - Triple MCP validation (Backend + Playwright + Chrome DevTools)

---

## 📚 ANÁLISE DE ARQUIVOS REAIS

### 1. Database Schema (Backend)

**Arquivo:** `backend/src/database/entities/asset-price.entity.ts`

**Estado Atual:**
```typescript
@Entity('asset_prices')
@Index(['asset', 'date'])
@Index(['date'])
export class AssetPrice {
  @Column({ type: 'date', primary: true })
  date: Date;  // ❌ DATE - não suporta intraday (sem hora/minuto)

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  open: number;
  // ... OHLCV fields
}
```

**Mudanças Necessárias:**
```typescript
@Entity('asset_prices')
@Index(['asset', 'timestamp', 'timeframe'])  // ✅ Novo índice composto
export class AssetPrice {
  @Column({ type: 'varchar', length: 3, default: '1D' })
  timeframe: string;  // ✅ '1D', '1H', '4H', '1W', '1M'

  @Column({ type: 'timestamp with time zone', primary: true })
  timestamp: Date;  // ✅ TIMESTAMP - suporta minuto (ex: 2025-11-17 14:30:00)

  // ... OHLCV fields (sem mudança)
}
```

**Constraints:**
- UNIQUE: (asset_id, timestamp, timeframe)
- Permitir múltiplos registros na mesma data (1D vs 1H vs 4H)

---

### 2. DTOs (Backend)

**Arquivos Analisados:**
- `backend/src/api/market-data/dto/get-prices.dto.ts`
- `backend/src/api/market-data/dto/get-technical-data.dto.ts`

**Estado Atual (FASE 35):**
```typescript
export enum CandleTimeframe {
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
}
```

**Mudanças Necessárias:**
```typescript
export enum CandleTimeframe {
  ONE_DAY = '1D',
  ONE_HOUR = '1H',     // ✅ Novo
  FOUR_HOURS = '4H',   // ✅ Novo
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
}
```

**Impacto:**
- ✅ Validação `@IsEnum(CandleTimeframe)` automaticamente suporta novos valores
- ✅ Swagger API docs automaticamente atualizado
- ⚠️ Frontend precisa atualizar UI para mostrar 1H/4H

---

### 3. Services (Backend)

**Arquivo:** `backend/src/api/market-data/market-data.service.ts`

**Estado Atual:**
```typescript
async getAggregatedPrices(ticker: string, timeframe: string, range: string) {
  // DATE_TRUNC('week') para 1W
  // DATE_TRUNC('month') para 1M
  // Sem agregação para 1D
}
```

**Mudanças Necessárias:**
```typescript
async getAggregatedPrices(ticker: string, timeframe: string, range: string) {
  if (timeframe === '1H' || timeframe === '4H') {
    // ✅ Buscar direto do database (sem agregação)
    // WHERE timeframe = '1H' AND timestamp >= (NOW() - range)
    return this.assetPriceRepository.find({
      where: { asset: { ticker }, timeframe },
      // ...
    });
  }

  if (timeframe === '1W' || timeframe === '1M') {
    // ✅ Agregar dados 1D existentes (mantém lógica FASE 35)
    // DATE_TRUNC() continua funcionando
  }

  // 1D: Buscar direto WHERE timeframe = '1D'
}
```

**Nova Lógica:**
- 1H, 4H: Buscar direto (já gravados com timeframe correto)
- 1D: Buscar direto (dados COTAHIST)
- 1W, 1M: Agregar 1D dinamicamente (SQL DATE_TRUNC)

---

### 4. Frontend Components

**Arquivo:** `frontend/src/components/charts/timeframe-range-picker.tsx`

**Estado Atual (FASE 35):**
```tsx
const timeframes = [
  { value: '1D', label: '1D', title: 'Daily' },
  { value: '1W', label: '1W', title: 'Weekly' },
  { value: '1M', label: '1M', title: 'Monthly' },
];
```

**Mudanças Necessárias:**
```tsx
const timeframes = [
  { value: '1H', label: '1H', title: 'Hourly' },      // ✅ Novo
  { value: '4H', label: '4H', title: '4 Hours' },     // ✅ Novo
  { value: '1D', label: '1D', title: 'Daily' },
  { value: '1W', label: '1W', title: 'Weekly' },
  { value: '1M', label: '1M', title: 'Monthly' },
];
```

**Validações Necessárias:**
- ⚠️ 1H + 5Y = 43,800 candles (muito!) → Limitar range para 1H (máx 1 mês)
- ⚠️ 4H + 1Y = 2,190 candles → OK (< 10k limite razoável)
- Mostrar warning se combinação inviável

---

### 5. Python Service (Data Fetching)

**Arquivo:** `backend/python-service/services/market_data_service.py`

**Estado Atual:**
```python
def fetch_historical_data(ticker: str, start_date: str, end_date: str):
    # brapi v2: /quote/{ticker}?range=1y&interval=1d
```

**Mudanças Necessárias:**
```python
def fetch_intraday_data(ticker: str, interval: str, range: str):
    # brapi v2: /quote/{ticker}?range=1mo&interval=1h
    # Suporta: interval = "1h" | "4h" | "1d" | "1wk" | "1mo"

    # Exemplo: VALE3, 1H, últimos 7 dias
    # GET https://brapi.dev/api/quote/VALE3?range=7d&interval=1h

    # Retornar: List[OHLCV] com timestamp (não date)
```

**Validação BRAPI:**
- ✅ Confirmado funcional: intervals 1h, 4h
- ⚠️ Limite histórico: brapi retorna máx 30 dias para 1h
- ⚠️ Rate limit: Verificar se precisa implementar throttling

---

## ✅ CHECKLIST ULTRA-ROBUSTO (Template FASE 35)

### PRÉ-IMPLEMENTAÇÃO

- [ ] **P1.1**: Ler TODOS os arquivos relevantes
  - [ ] asset-price.entity.ts (schema atual)
  - [ ] get-prices.dto.ts (enums)
  - [ ] market-data.service.ts (agregação)
  - [ ] timeframe-range-picker.tsx (UI)
  - [ ] market_data_service.py (Python)
- [ ] **P1.2**: Criar documento técnico (FASE_36_TECHNICAL_SPEC.md)
  - [ ] Database migration plan (up + down)
  - [ ] Breaking changes documentation
  - [ ] Rollback strategy
- [ ] **P1.3**: Verificar dependências
  - [ ] TypeORM migration suporta ALTER TABLE
  - [ ] PostgreSQL 16 suporta TIMESTAMP WITH TIME ZONE
  - [ ] brapi API limits (rate limiting)
- [ ] **P1.4**: TodoWrite criado com 40+ etapas atômicas

---

### FASE 36.1: DATABASE MIGRATION (CRÍTICO)

- [ ] **36.1.1**: Criar migration file
  - [ ] `npm run migration:create AddTimeframeToAssetPrices`
  - [ ] Arquivo: `backend/src/database/migrations/XXXXXX-AddTimeframeToAssetPrices.ts`
- [ ] **36.1.2**: Implementar UP migration
  ```sql
  -- 1. Adicionar coluna timeframe (default '1D' para dados existentes)
  ALTER TABLE asset_prices ADD COLUMN timeframe VARCHAR(3) DEFAULT '1D';

  -- 2. Renomear date → timestamp_old (preservar dados)
  ALTER TABLE asset_prices RENAME COLUMN date TO timestamp_old;

  -- 3. Adicionar nova coluna timestamp
  ALTER TABLE asset_prices ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE;

  -- 4. Migrar dados: timestamp = timestamp_old (meia-noite UTC)
  UPDATE asset_prices SET timestamp = timestamp_old::timestamp AT TIME ZONE 'UTC';

  -- 5. Remover timestamp_old
  ALTER TABLE asset_prices DROP COLUMN timestamp_old;

  -- 6. Criar UNIQUE constraint
  ALTER TABLE asset_prices ADD CONSTRAINT unique_asset_timestamp_timeframe
    UNIQUE (asset_id, timestamp, timeframe);

  -- 7. Criar índices
  CREATE INDEX idx_asset_prices_timestamp ON asset_prices(timestamp);
  CREATE INDEX idx_asset_prices_timeframe ON asset_prices(timeframe);
  CREATE INDEX idx_asset_prices_composite ON asset_prices(asset_id, timestamp, timeframe);
  ```
- [ ] **36.1.3**: Implementar DOWN migration (rollback)
  ```sql
  -- Reverter todas as mudanças (ordem inversa)
  ```
- [ ] **36.1.4**: Testar migration local
  - [ ] `npm run migration:run` (UP)
  - [ ] Verificar dados: `SELECT * FROM asset_prices LIMIT 10;`
  - [ ] `npm run migration:revert` (DOWN)
  - [ ] Verificar rollback: dados preservados?
- [ ] **36.1.5**: Validar TypeScript 0 erros após migration
  - [ ] `cd backend && npx tsc --noEmit`
- [ ] **36.1.6**: Backup database antes de aplicar em produção
  - [ ] `pg_dump invest_claude_db > backup_pre_fase36.sql`

---

### FASE 36.2: BACKEND ENTITIES & DTOs

- [ ] **36.2.1**: Atualizar AssetPrice entity
  - [ ] Adicionar campo: `timeframe: string`
  - [ ] Mudar: `date: Date` → `timestamp: Date`
  - [ ] Atualizar índices: `@Index(['asset', 'timestamp', 'timeframe'])`
  - [ ] Atualizar constraint: UNIQUE (asset_id, timestamp, timeframe)
- [ ] **36.2.2**: Atualizar CandleTimeframe enum
  - [ ] Adicionar: `ONE_HOUR = '1H'`
  - [ ] Adicionar: `FOUR_HOURS = '4H'`
  - [ ] Manter: '1D', '1W', '1M'
- [ ] **36.2.3**: Validar Swagger API docs
  - [ ] Acessar: http://localhost:3101/api/docs
  - [ ] Verificar: Enum mostra 1H, 4H, 1D, 1W, 1M
- [ ] **36.2.4**: TypeScript validation
  - [ ] `cd backend && npx tsc --noEmit` → 0 erros
- [ ] **36.2.5**: Build validation
  - [ ] `cd backend && npm run build` → Success

---

### FASE 36.3: BACKEND SERVICES (LÓGICA)

- [ ] **36.3.1**: Atualizar `getAggregatedPrices()`
  - [ ] Adicionar lógica para 1H: Buscar WHERE timeframe = '1H'
  - [ ] Adicionar lógica para 4H: Buscar WHERE timeframe = '4H'
  - [ ] Manter lógica 1W/1M: Agregar 1D com DATE_TRUNC
  - [ ] Atualizar lógica 1D: Buscar WHERE timeframe = '1D'
- [ ] **36.3.2**: Atualizar `syncHistoricalDataFromCotahist()`
  - [ ] Garantir que COTAHIST sempre grava timeframe = '1D'
  - [ ] Manter lógica UPSERT: ON CONFLICT (asset_id, timestamp, timeframe)
- [ ] **36.3.3**: Criar novo service: `syncIntradayData()`
  - [ ] Endpoint: POST /market-data/sync-intraday
  - [ ] Body: { ticker, timeframe: '1H' | '4H', range }
  - [ ] Chamar Python Service: `/intraday/fetch`
  - [ ] UPSERT no database com timeframe correto
- [ ] **36.3.4**: TypeScript validation
  - [ ] `npx tsc --noEmit` → 0 erros
- [ ] **36.3.5**: Build validation
  - [ ] `npm run build` → Success

---

### FASE 36.4: PYTHON SERVICE (DATA FETCHING)

- [ ] **36.4.1**: Criar endpoint `/intraday/fetch`
  - [ ] Arquivo: `backend/python-service/routes/intraday.py`
  - [ ] Endpoint: POST /intraday/fetch
  - [ ] Body: { ticker, interval: '1h' | '4h', range }
- [ ] **36.4.2**: Implementar `fetch_intraday_data()`
  - [ ] Chamar brapi: `GET /quote/{ticker}?interval={interval}&range={range}`
  - [ ] Validar response: Verificar se tem timestamps
  - [ ] Transformar: brapi format → OHLCV format
  - [ ] Retornar: List[IntradayCandle]
- [ ] **36.4.3**: Adicionar error handling
  - [ ] brapi offline: Retry 3x com exponential backoff
  - [ ] Rate limit: 429 error → Wait 60s
  - [ ] Invalid ticker: 404 → Return clear error
- [ ] **36.4.4**: Testes locais (não mocks)
  ```bash
  # Cenário 1: VALE3, 1H, 7 dias
  curl -X POST http://localhost:3102/intraday/fetch \
    -H "Content-Type: application/json" \
    -d '{"ticker":"VALE3","interval":"1h","range":"7d"}'

  # Cenário 2: PETR4, 4H, 30 dias
  curl -X POST http://localhost:3102/intraday/fetch \
    -H "Content-Type: application/json" \
    -d '{"ticker":"PETR4","interval":"4h","range":"30d"}'
  ```
- [ ] **36.4.5**: Validar response
  - [ ] Timestamps corretos (ISO 8601 com hora)
  - [ ] OHLCV values sem manipulação (precisão 100%)
  - [ ] Quantidade esperada: 7d × 24h ÷ 1h ≈ 168 candles

---

### FASE 36.5: FRONTEND UI (TIMEFRAME PICKER)

- [ ] **36.5.1**: Atualizar TimeframeRangePicker component
  - [ ] Adicionar botões: 1H, 4H
  - [ ] Ordenar: [1H, 4H, 1D, 1W, 1M]
  - [ ] Manter design: 2 grupos (Candle + Range)
- [ ] **36.5.2**: Implementar validação de range
  ```typescript
  // ❌ Combinações inviáveis
  if (timeframe === '1H' && ['1y', '2y', '5y', 'max'].includes(range)) {
    toast.error('1H suporta máximo 1 mês de dados');
    return;
  }

  if (timeframe === '4H' && ['5y', 'max'].includes(range)) {
    toast.error('4H suporta máximo 2 anos de dados');
    return;
  }
  ```
- [ ] **36.5.3**: Atualizar useMarketDataPrices hook
  - [ ] React Query cache key: Include timeframe
  - [ ] Stale time: 1 minute para 1H/4H (dados frescos)
  - [ ] Stale time: 5 minutes para 1D/1W/1M (mantém FASE 35)
- [ ] **36.5.4**: TypeScript validation
  - [ ] `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] **36.5.5**: ESLint validation
  - [ ] `cd frontend && npm run lint` → 0 warnings
- [ ] **36.5.6**: Build validation
  - [ ] `npm run build` → Success (17 páginas)

---

### FASE 36.6: VALIDAÇÃO BACKEND (DADOS REAIS)

**Regra:** Testar com dados reais (NÃO mocks), mesma metodologia FASE 35.

#### Cenário 1: 1H Intraday (VALE3)
- [ ] **36.6.1**: Sincronizar dados intraday
  ```bash
  curl -X POST http://localhost:3101/api/v1/market-data/sync-intraday \
    -H "Content-Type: application/json" \
    -d '{"ticker":"VALE3","timeframe":"1H","range":"7d"}'
  ```
- [ ] **36.6.2**: Verificar database
  ```sql
  SELECT COUNT(*), MIN(timestamp), MAX(timestamp)
  FROM asset_prices
  WHERE asset_id = (SELECT id FROM assets WHERE ticker = 'VALE3')
    AND timeframe = '1H';
  -- Esperado: ~168 candles (7 dias × 24h), timestamps com hora
  ```
- [ ] **36.6.3**: Validar endpoint GET /prices
  ```bash
  curl "http://localhost:3101/api/v1/market-data/VALE3/prices?timeframe=1H&range=7d"
  ```
- [ ] **36.6.4**: Validar OHLC accuracy (manual)
  - Comparar 1 candle específico (ex: 2025-11-17 14:00:00)
  - Open: Primeiro negócio da hora
  - High: Máximo da hora
  - Low: Mínimo da hora
  - Close: Último negócio da hora
  - Volume: Soma da hora

#### Cenário 2: 4H Intraday (PETR4)
- [ ] **36.6.5**: Sincronizar 4H data
  ```bash
  curl -X POST http://localhost:3101/api/v1/market-data/sync-intraday \
    -d '{"ticker":"PETR4","timeframe":"4H","range":"30d"}'
  ```
- [ ] **36.6.6**: Verificar quantidade
  ```sql
  SELECT COUNT(*) FROM asset_prices
  WHERE ticker = 'PETR4' AND timeframe = '4H';
  -- Esperado: ~180 candles (30 dias × 6 candles/dia)
  ```

#### Cenário 3: Coexistência 1D + 1H
- [ ] **36.6.7**: Verificar múltiplos timeframes para mesmo ticker
  ```sql
  SELECT timeframe, COUNT(*)
  FROM asset_prices
  WHERE ticker = 'VALE3'
  GROUP BY timeframe;
  -- Esperado:
  -- 1D: ~1200 candles (dados históricos COTAHIST)
  -- 1H: ~168 candles (últimos 7 dias)
  ```
- [ ] **36.6.8**: Garantir UNIQUE constraint funciona
  ```sql
  -- Tentar inserir duplicata (deve falhar)
  INSERT INTO asset_prices (asset_id, timestamp, timeframe, open, high, low, close, volume)
  VALUES (...);
  -- Esperado: ERROR unique constraint violation
  ```

#### Validação Final Backend
- [ ] **36.6.9**: TypeScript: 0 erros
- [ ] **36.6.10**: Build: Success
- [ ] **36.6.11**: Endpoints: Todos 200 OK
- [ ] **36.6.12**: Data precision: 100% (sem manipulação)
- [ ] **36.6.13**: Performance: < 100ms (queries otimizadas)

---

### FASE 36.7: VALIDAÇÃO PLAYWRIGHT MCP (UI)

- [ ] **36.7.1**: Navegação
  ```typescript
  await mcp__playwright__browser_navigate({
    url: "http://localhost:3100/assets/VALE3"
  });
  ```
- [ ] **36.7.2**: UI Snapshot
  ```typescript
  await mcp__playwright__browser_snapshot();
  // Verificar: Botões 1H, 4H visíveis
  ```
- [ ] **36.7.3**: Interação 1H
  ```typescript
  await mcp__playwright__browser_click({
    element: "1H button",
    ref: "..."
  });
  // Aguardar loading
  await mcp__playwright__browser_wait_for({ text: "168 candles" });
  ```
- [ ] **36.7.4**: Verificar gráfico renderizado
  ```typescript
  await mcp__playwright__browser_snapshot();
  // Esperado: Gráfico mostra candlesticks 1H
  ```
- [ ] **36.7.5**: Interação 4H
  ```typescript
  await mcp__playwright__browser_click({
    element: "4H button",
    ref: "..."
  });
  // Verificar transição suave
  ```
- [ ] **36.7.6**: Screenshot evidência
  ```typescript
  await mcp__playwright__browser_take_screenshot({
    filename: "FASE_36_PLAYWRIGHT_INTRADAY_VALIDACAO.png",
    fullPage: true
  });
  ```
- [ ] **36.7.7**: Console validation
  - 0 erros JavaScript
  - 0 erros React
  - Apenas warnings esperados OK

---

### FASE 36.8: VALIDAÇÃO CHROME DEVTOOLS MCP (NETWORK)

- [ ] **36.8.1**: Navegação
  ```typescript
  await mcp__chrome-devtools__navigate_page({
    url: "http://localhost:3100/assets/VALE3"
  });
  ```
- [ ] **36.8.2**: Snapshot inicial
  ```typescript
  await mcp__chrome-devtools__take_snapshot();
  ```
- [ ] **36.8.3**: Clicar 1H e monitorar network
  ```typescript
  await mcp__chrome-devtools__click({ uid: "1H_button_uid" });
  ```
- [ ] **36.8.4**: Listar network requests
  ```typescript
  await mcp__chrome-devtools__list_network_requests({
    resourceTypes: ["xhr", "fetch"]
  });
  // Verificar: GET /api/v1/market-data/VALE3/prices?timeframe=1H&range=7d
  ```
- [ ] **36.8.5**: Validar request payload
  ```typescript
  await mcp__chrome-devtools__get_network_request({ reqid: X });
  // Verificar response:
  // - Status: 200 OK
  // - Data: Array com ~168 objetos
  // - Timestamps: ISO 8601 com hora (ex: "2025-11-17T14:00:00Z")
  // - OHLCV values: Sem manipulação (precisão 100%)
  ```
- [ ] **36.8.6**: Console messages
  ```typescript
  await mcp__chrome-devtools__list_console_messages({
    types: ["error"]
  });
  // Esperado: 0 erros
  ```
- [ ] **36.8.7**: Screenshot final
  ```typescript
  await mcp__chrome-devtools__take_screenshot({
    filePath: "FASE_36_CHROME_DEVTOOLS_INTRADAY.png"
  });
  ```

---

### FASE 36.9: DOCUMENTAÇÃO

- [ ] **36.9.1**: Atualizar ROADMAP.md
  - [ ] Adicionar entrada completa FASE 36
  - [ ] Incluir: Implementação, validação, métricas
  - [ ] Marcar: ✅ 100% COMPLETO E VALIDADO
- [ ] **36.9.2**: Atualizar DATABASE_SCHEMA.md
  - [ ] Documentar nova coluna `timeframe`
  - [ ] Documentar mudança `date` → `timestamp`
  - [ ] Documentar novo UNIQUE constraint
  - [ ] Adicionar exemplos de queries intraday
- [ ] **36.9.3**: Criar FASE_36_MIGRATION_GUIDE.md
  - [ ] Passos de migration
  - [ ] Rollback strategy
  - [ ] Breaking changes
  - [ ] Troubleshooting
- [ ] **36.9.4**: Atualizar API_DOCUMENTATION.md
  - [ ] Endpoint: POST /sync-intraday
  - [ ] Enum CandleTimeframe: Adicionar 1H, 4H
  - [ ] Exemplos de uso: 1H, 4H requests
- [ ] **36.9.5**: Screenshots organizados
  - FASE_36_PLAYWRIGHT_INTRADAY_VALIDACAO.png
  - FASE_36_CHROME_DEVTOOLS_INTRADAY.png
  - FASE_36_DATABASE_MIGRATION_BEFORE_AFTER.png

---

### FASE 36.10: GIT COMMIT

- [ ] **36.10.1**: Validação pré-commit
  ```bash
  # TypeScript
  cd backend && npx tsc --noEmit
  cd frontend && npx tsc --noEmit

  # ESLint
  cd frontend && npm run lint

  # Build
  cd backend && npm run build
  cd frontend && npm run build

  # Git status
  git status
  ```
- [ ] **36.10.2**: Adicionar arquivos
  ```bash
  git add backend/src/database/entities/asset-price.entity.ts
  git add backend/src/database/migrations/XXXXXX-AddTimeframeToAssetPrices.ts
  git add backend/src/api/market-data/dto/get-prices.dto.ts
  git add backend/src/api/market-data/market-data.service.ts
  git add backend/python-service/routes/intraday.py
  git add frontend/src/components/charts/timeframe-range-picker.tsx
  git add frontend/src/hooks/useMarketDataPrices.ts
  git add ROADMAP.md
  git add DATABASE_SCHEMA.md
  git add FASE_36_MIGRATION_GUIDE.md
  ```
- [ ] **36.10.3**: Criar commit detalhado
  ```bash
  git commit -m "feat: Adicionar suporte intraday (1H, 4H) com database migration

  **Problema:**
  Sistema suportava apenas EOD data (1D, 1W, 1M agregado).
  Day traders e swing traders precisam de dados intraday (1H, 4H).

  **Solução:**
  1. Database migration:
     - Adicionar coluna timeframe VARCHAR(3)
     - Mudar date (DATE) → timestamp (TIMESTAMP WITH TIME ZONE)
     - Novo UNIQUE constraint: (asset_id, timestamp, timeframe)

  2. Backend:
     - Atualizar AssetPrice entity (timeframe + timestamp)
     - Adicionar CandleTimeframe: 1H, 4H
     - Novo endpoint: POST /sync-intraday
     - Python Service: /intraday/fetch (brapi 1h, 4h intervals)

  3. Frontend:
     - TimeframeRangePicker: Adicionar botões 1H, 4H
     - Validação range: 1H máx 1mo, 4H máx 2y
     - React Query cache: Stale time 1 min (dados frescos)

  **Validação Tripla MCP:**
  ✅ Backend (3 cenários testados):
     - VALE3 1H 7d: ~168 candles, timestamps corretos
     - PETR4 4H 30d: ~180 candles, OHLC accuracy 100%
     - Coexistência 1D + 1H: UNIQUE constraint OK

  ✅ Playwright MCP:
     - UI: Botões 1H, 4H renderizados
     - Interação: Click 1H → Chart atualiza
     - Screenshot: FASE_36_PLAYWRIGHT_INTRADAY_VALIDACAO.png

  ✅ Chrome DevTools MCP:
     - Console: 0 erros
     - Network: 200 OK (GET /prices?timeframe=1H)
     - Payload: Timestamps ISO 8601, precisão 100%

  **Arquivos Modificados:**
  Backend (7 arquivos):
  - asset-price.entity.ts (+5/-2 linhas)
  - XXXXXX-AddTimeframeToAssetPrices.ts (+87 linhas - migration)
  - get-prices.dto.ts (+2 linhas - 1H, 4H enum)
  - market-data.service.ts (+45/-12 linhas - intraday logic)
  - market-data.controller.ts (+32 linhas - sync-intraday endpoint)
  - intraday.py (+78 linhas - Python service)

  Frontend (2 arquivos):
  - timeframe-range-picker.tsx (+18/-5 linhas)
  - useMarketDataPrices.ts (+12/-3 linhas)

  Documentação (4 arquivos):
  - ROADMAP.md (+112 linhas - FASE 36 entry)
  - DATABASE_SCHEMA.md (+67 linhas - migration docs)
  - FASE_36_MIGRATION_GUIDE.md (+156 linhas - novo)
  - API_DOCUMENTATION.md (+43 linhas - sync-intraday endpoint)

  **Métricas:**
  Performance:
  - 1H query: < 50ms (índice otimizado)
  - 4H query: < 30ms
  - Migration: < 2s (1200 registros)

  Qualidade:
  - TypeScript: 0 erros
  - ESLint: 0 warnings
  - Build: Success (backend + frontend)
  - Data precision: 100% (brapi sem manipulação)

  **Breaking Changes:**
  ⚠️ Database schema change (migration necessária)
  ⚠️ API response: 'date' → 'timestamp' (ISO 8601 com hora)
  ✅ Backward compatible: Dados 1D existentes preservados

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```
- [ ] **36.10.4**: Verificar commit
  ```bash
  git log -1 --stat
  ```
- [ ] **36.10.5**: Push to origin (se aprovado)
  ```bash
  git push origin main
  ```

---

## 📊 MÉTRICAS DE SUCESSO (Zero Tolerance)

**Qualidade:**
```
✅ TypeScript Errors: 0/0 (backend + frontend)
✅ ESLint Warnings: 0/0
✅ Build Status: Success (backend + frontend)
✅ Console Errors: 0/0 (páginas principais)
✅ HTTP Errors: 0/0 (todos requests 200 OK)
✅ Data Precision: 100% (brapi sem manipulação)
✅ Migration: Reversível (rollback testado)
```

**Performance:**
```
✅ 1H query: < 50ms (7 dias = ~168 candles)
✅ 4H query: < 30ms (30 dias = ~180 candles)
✅ Database migration: < 5s (1200+ registros existentes)
✅ Frontend render: < 500ms (lightweight-charts otimizado)
```

**Cobertura Validação:**
```
✅ Backend: 3+ cenários testados com dados reais
✅ Playwright MCP: UI + interação validada
✅ Chrome DevTools MCP: Console + network + payload
✅ Screenshots: 3 evidências capturadas
✅ Documentação: 4 arquivos atualizados
```

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Database Migration Falha
**Probabilidade:** Baixa (migration testada localmente)
**Impacto:** 🔴 CRÍTICO (sistema offline)
**Mitigação:**
- ✅ Backup completo antes migration: `pg_dump`
- ✅ Testar migration em staging primeiro
- ✅ Implementar DOWN migration reversível
- ✅ Monitoring: Verificar se migration < 10s
- ✅ Rollback plan: `npm run migration:revert` + restore backup

### Risco 2: brapi Rate Limit (429)
**Probabilidade:** Média (múltiplos requests intraday)
**Impacto:** ⚠️ MÉDIO (sync falha temporariamente)
**Mitigação:**
- ✅ Implementar retry com exponential backoff
- ✅ Cache Redis: Cachear responses brapi (5 min TTL)
- ✅ Throttling: Máx 1 request/segundo
- ✅ Erro handling: Mostrar mensagem clara ao usuário

### Risco 3: Performance Degradation (> 10k candles)
**Probabilidade:** Baixa (validação range implementada)
**Impacto:** ⚠️ MÉDIO (frontend lento)
**Mitigação:**
- ✅ Limitar range: 1H máx 1mo, 4H máx 2y
- ✅ Lazy loading: Carregar apenas candles visíveis
- ✅ Pagination: API retorna máx 5000 candles
- ✅ Virtual scrolling: lightweight-charts suporta nativamente

### Risco 4: Breaking Changes para Integrações Externas
**Probabilidade:** Baixa (API backward compatible)
**Impacto:** ⚠️ MÉDIO (clientes externos quebram)
**Mitigação:**
- ✅ API response: Incluir ambos `date` (deprecated) + `timestamp`
- ✅ Versioning: Criar /api/v2 se necessário
- ✅ Deprecation warning: Logs para clients usando `date`
- ✅ Documentação: Changelogs claros

---

## 🚀 PRÓXIMAS FASES (Pós-FASE 36)

### FASE 37: Monitoramento Prometheus + Grafana
- Métricas: sync_duration, cache_hit_rate, http_latency
- Dashboards: Performance, Cache efficiency
- Alertas: Sync failures, High latency

### FASE 38: Retry Logic + Circuit Breaker
- Exponential backoff: 3 retries (1s, 2s, 4s)
- Circuit breaker: 5 falhas → OPEN
- Resilience contra falhas brapi/B3

### FASE 39: Frontend Performance Optimizations
- Reduzir LCP: Defer CSS, inline critical
- Melhorar TTFB: HTTP/2, CDN, Brotli
- Code splitting: Dynamic imports

### FASE 40: Testes Automatizados
- Unit tests: MarketDataService, PythonServiceClient
- E2E tests: Playwright sync flow
- Coverage: > 80%

---

## 📚 REFERÊNCIAS

**Documentação Técnica:**
- DATABASE_SCHEMA.md - Schema atual + migration docs
- API_DOCUMENTATION.md - Endpoints + exemplos
- ARCHITECTURE.md - Arquitetura geral
- CLAUDE.md - Metodologia (checklist ultra-robusto)

**Arquivos Críticos:**
- `backend/src/database/entities/asset-price.entity.ts` - Schema
- `backend/src/api/market-data/market-data.service.ts` - Business logic
- `frontend/src/components/charts/timeframe-range-picker.tsx` - UI
- `backend/python-service/services/market_data_service.py` - Data fetching

**APIs Externas:**
- brapi.dev/docs - Documentação API
- brapi.dev/api/quote/{ticker}?interval=1h - Intraday endpoint

---

**FIM DO TODO_FASE_36.md**

> **Próximo passo:** Ler este checklist completamente → Implementar sequencialmente → Validar com tripla MCP → Documentar → Commit
