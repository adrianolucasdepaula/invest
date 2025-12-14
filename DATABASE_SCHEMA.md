# 🗄️ DATABASE SCHEMA - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform
**Banco de Dados:** PostgreSQL 16.x
**ORM:** TypeORM 0.3.x
**Última Atualização:** 2025-12-13

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Entidades Principais](#entidades-principais)
3. [Relacionamentos](#relacionamentos)
4. [Indexes e Performance](#indexes-e-performance)
5. [Migrations](#migrations)
6. [Queries Comuns](#queries-comuns)
7. [Diagrama ER](#diagrama-er)

---

## 🎯 VISÃO GERAL

O banco de dados PostgreSQL armazena dados de ativos financeiros da B3, análises fundamentalistas/técnicas realizadas por IA, portfólios de usuários e métricas de scrapers.

### Estatísticas Gerais

- **Total de Tabelas:** 15
- **Total de Registros (aprox.):** 1.418+
  - Assets: 55
  - AssetPrices: 1.298
  - Analyses: 11
  - Users: 7
  - Portfolios: 4
  - PortfolioPositions: 6
  - ScraperMetrics: 24
  - UpdateLogs: 22
  - WheelStrategies: 0+ (FASE 101-108)
  - WheelTrades: 0+ (FASE 101-108)
  - OptionPrices: 0+ (FASE 107)

### Convenções

- **Primary Keys:** UUID (gerado automaticamente)
- **Foreign Keys:** Relacionamentos explícitos com CASCADE/RESTRICT
- **Timestamps:** `createdAt`, `updatedAt` (automáticos via TypeORM)
- **Soft Delete:** Campo `isActive` (não usar DELETE físico)
- **Decimal:** Precision adequada (18,2 para valores monetários, 10,4 para percentuais)

---

## 📊 ENTIDADES PRINCIPAIS

### 1. Assets (Ativos)

Armazena ativos financeiros da B3 (ações, FIIs, ETFs, criptomoedas).

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  ticker: string(UNIQUE); // Ex: PETR4, VALE3, ITUB4
  name: string; // Nome completo (ex: "Petróleo Brasileiro S.A.")
  type: AssetType; // ENUM: stock, fii, etf, crypto
  sector: string; // Setor econômico (ex: "Petróleo e Gás")
  subsector: string; // Subsetor (ex: "Exploração e Produção")
  isActive: boolean; // Soft delete (true = ativo, false = inativo)
  metadata: JSON; // Dados extras flexíveis
  createdAt: timestamp; // Data de criação (automático)
  updatedAt: timestamp; // Data de atualização (automático)
}
```

**Constraints:**

- `ticker` UNIQUE NOT NULL
- `name` NOT NULL
- `type` NOT NULL
- `isActive` DEFAULT true

**Exemplo:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ticker": "PETR4",
  "name": "Petróleo Brasileiro S.A.",
  "type": "stock",
  "sector": "Petróleo e Gás",
  "subsector": "Exploração e Produção",
  "isActive": true,
  "metadata": {
    "isin": "BRPETRACNPR6",
    "exchange": "B3",
    "listingSegment": "Novo Mercado"
  },
  "createdAt": "2025-11-10T10:00:00Z",
  "updatedAt": "2025-11-14T15:30:00Z"
}
```

---

### 2. AssetPrices (Preços)

Armazena histórico de preços diários de ativos (OHLCV + variação).

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  assetId: UUID; // Foreign Key -> Assets.id
  date: date; // Data de referência (ex: 2025-11-14)
  open: decimal(18, 2); // Preço de abertura
  high: decimal(18, 2); // Preço máximo do dia
  low: decimal(18, 2); // Preço mínimo do dia
  close: decimal(18, 2); // Preço de fechamento
  adjustedClose: decimal(18, 2); // Preço ajustado (splits, dividendos)
  volume: bigint; // Volume negociado
  marketCap: decimal(18, 2); // Valor de mercado
  change: decimal(18, 2); // Variação absoluta (R$)
  changePercent: decimal(10, 4); // Variação percentual (%)
  collectedAt: timestamp; // Quando foi coletado dos scrapers
  createdAt: timestamp; // Data de criação (automático)
}
```

**Constraints:**

- `assetId` FOREIGN KEY REFERENCES assets(id) ON DELETE CASCADE
- `date` NOT NULL
- `close` NOT NULL
- UNIQUE (assetId, date) - Um preço por ativo por dia

**Exemplo:**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "assetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-11-14",
  "open": 39.5,
  "high": 40.2,
  "low": 39.3,
  "close": 40.0,
  "adjustedClose": 40.0,
  "volume": 25000000,
  "marketCap": 534000000000.0,
  "change": 0.5,
  "changePercent": 1.2658,
  "collectedAt": "2025-11-14T18:00:00Z",
  "createdAt": "2025-11-14T18:05:00Z"
}
```

---

### 3. TickerChanges (Mudanças de Ticker)

Armazena histórico de mudanças de códigos de negociação (ex: ELET3 → AXIA3).

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  oldTicker: string; // Ticker antigo (ex: "ELET3")
  newTicker: string; // Novo ticker (ex: "AXIA3")
  changeDate: date; // Data da mudança
  reason: string; // Motivo (ex: "REBRANDING", "MERGER")
  ratio: decimal(10, 6); // Fator de conversão (default: 1.0)
  createdAt: timestamp; // Data de criação
  updatedAt: timestamp; // Data de atualização
}
```

**Constraints:**

- `oldTicker` NOT NULL
- `newTicker` NOT NULL
- UNIQUE (oldTicker, newTicker)
- Indexes em `oldTicker` e `newTicker` para busca rápida

**Exemplo:**

```json
{
  "id": "c4d5e6f7-g8h9-0123-ijkl-456789012345",
  "oldTicker": "ELET3",
  "newTicker": "AXIA3",
  "changeDate": "2024-08-01",
  "reason": "REBRANDING",
  "ratio": 1.0,
  "createdAt": "2025-11-24T10:00:00Z"
}
```

---

### 4. FundamentalData (Dados Fundamentalistas)

Armazena indicadores fundamentalistas coletados de múltiplas fontes com cross-validation.

**Schema (campos novos FASE 85):**

```typescript
{
  id: UUID;                        // Primary Key
  assetId: UUID;                   // FK para Asset
  referenceDate: date;             // Data de referência

  // Valuation Indicators
  pl: decimal(18, 2);              // Preço/Lucro
  pvp: decimal(18, 2);             // Preço/Valor Patrimonial
  psr: decimal(18, 2);             // Price/Sales Ratio
  evEbitda: decimal(18, 2);        // EV/EBITDA

  // Profitability Indicators
  roe: decimal(10, 4);             // Return on Equity
  roic: decimal(10, 4);            // Return on Invested Capital
  roa: decimal(10, 4);             // Return on Assets
  margemLiquida: decimal(10, 4);   // Margem Líquida

  // Per Share Indicators (FASE 85)
  lpa: decimal(18, 2);             // Lucro por Ação
  vpa: decimal(18, 2);             // Valor Patrimonial por Ação

  // Liquidity Indicators (FASE 85)
  liquidezCorrente: decimal(18, 2); // Liquidez Corrente

  // Metadata
  fieldSources: JSON;              // Cross-validation de fontes
  metadata: JSON;                  // Dados extras

  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Colunas Adicionadas (FASE 85):**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `lpa` | DECIMAL(18,2) | Lucro por Ação |
| `vpa` | DECIMAL(18,2) | Valor Patrimonial por Ação |
| `liquidez_corrente` | DECIMAL(18,2) | Liquidez Corrente |

**Migration:** `1765100000000-AddLpaVpaLiquidezCorrente.ts`

---

### 5. Analyses (Análises)

Armazena análises fundamentalistas/técnicas realizadas por IA com cross-validation de múltiplas fontes.

**Schema:**

```typescript
{
  id: UUID                         // Primary Key
  assetId: UUID                    // Foreign Key -> Assets.id
  userId: UUID                     // Foreign Key -> Users.id
  type: AnalysisType               // ENUM: fundamental, technical, complete
  status: AnalysisStatus           // ENUM: pending, processing, completed, failed
  analysis: JSON                   // Dados da análise (estrutura flexível)
  dataSources: string[]            // Fontes utilizadas (ex: ["Fundamentus", "BRAPI"])
  sourcesCount: number             // Quantidade de fontes (ex: 6)
  confidenceScore: decimal(5,4)    // Score de confiança (0.0000 - 1.0000)
  recommendation: Recommendation   // ENUM: buy, hold, sell
  targetPrice: decimal(18,2)       // Preço-alvo estimado
  errorMessage: string             // Mensagem de erro (se status=failed)
  completedAt: timestamp           // Data de conclusão
  createdAt: timestamp             // Data de criação (automático)
}
```

**Constraints:**

- `assetId` FOREIGN KEY REFERENCES assets(id) ON DELETE CASCADE
- `userId` FOREIGN KEY REFERENCES users(id) ON DELETE SET NULL
- `type` NOT NULL
- `status` NOT NULL DEFAULT 'pending'

**Exemplo:**

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "assetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "d4e5f6a7-b8c9-0123-def4-56789012345",
  "type": "complete",
  "status": "completed",
  "analysis": {
    "fundamentals": { "pl": 8.5, "pvp": 1.2, "roe": 15.3 },
    "technicals": { "sma20": 39.5, "sma50": 38.2, "rsi": 62 }
  },
  "dataSources": [
    "Fundamentus",
    "BRAPI",
    "StatusInvest",
    "Investidor10",
    "Fundamentei",
    "Investsite"
  ],
  "sourcesCount": 6,
  "confidenceScore": 0.9167,
  "recommendation": "buy",
  "targetPrice": 45.0,
  "errorMessage": null,
  "completedAt": "2025-11-14T16:30:00Z",
  "createdAt": "2025-11-14T16:25:00Z"
}
```

---

### 4. Portfolios (Portfólios)

Armazena portfólios de investimento dos usuários.

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  userId: UUID; // Foreign Key -> Users.id
  name: string; // Nome do portfólio (ex: "Carteira Conservadora")
  description: string; // Descrição opcional
  totalValue: decimal(18, 2); // Valor total atual (calculado)
  totalCost: decimal(18, 2); // Custo total investido (calculado)
  totalProfitLoss: decimal(18, 2); // Lucro/prejuízo total (calculado)
  isActive: boolean; // Soft delete
  createdAt: timestamp; // Data de criação (automático)
  updatedAt: timestamp; // Data de atualização (automático)
}
```

**Constraints:**

- `userId` FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE
- `name` NOT NULL
- `isActive` DEFAULT true

---

### 5. PortfolioPositions (Posições)

Armazena posições (ativos) dentro de cada portfólio.

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  portfolioId: UUID; // Foreign Key -> Portfolios.id
  assetId: UUID; // Foreign Key -> Assets.id
  quantity: decimal(18, 8); // Quantidade de ações/cotas
  averagePrice: decimal(18, 2); // Preço médio de compra
  currentPrice: decimal(18, 2); // Preço atual (atualizado periodicamente)
  totalCost: decimal(18, 2); // Custo total (quantity * averagePrice)
  totalValue: decimal(18, 2); // Valor total (quantity * currentPrice)
  profitLoss: decimal(18, 2); // Lucro/prejuízo (totalValue - totalCost)
  profitLossPercent: decimal(10, 4); // Lucro/prejuízo percentual
  createdAt: timestamp; // Data de criação (automático)
  updatedAt: timestamp; // Data de atualização (automático)
}
```

**Constraints:**

- `portfolioId` FOREIGN KEY REFERENCES portfolios(id) ON DELETE CASCADE
- `assetId` FOREIGN KEY REFERENCES assets(id) ON DELETE RESTRICT
- `quantity` > 0
- UNIQUE (portfolioId, assetId) - Um ativo por portfólio

---

### 6. WheelStrategies (Estratégias WHEEL) - FASE 101-108

Armazena estratégias WHEEL (venda de PUTs e CALLs cobertas) dos usuários.

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  userId: UUID; // Foreign Key -> Users.id
  assetId: UUID; // Foreign Key -> Assets.id
  name: string; // Nome da estratégia
  description: string; // Descrição opcional
  status: WheelStrategyStatus; // ENUM: active, paused, closed
  phase: WheelPhase; // ENUM: selling_puts, holding_shares, selling_calls
  notional: decimal(18, 2); // Capital total alocado
  allocatedCapital: decimal(18, 2); // Capital em uso
  availableCapital: decimal(18, 2); // Capital disponível
  sharesHeld: integer; // Ações em carteira
  averagePrice: decimal(18, 8); // Preço médio das ações
  realizedPnL: decimal(18, 2); // P&L realizado
  unrealizedPnL: decimal(18, 2); // P&L não realizado
  config: JSONB; // Configurações (targetDelta, minROE, etc.)
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Constraints:**

- `userId` FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE
- `assetId` FOREIGN KEY REFERENCES assets(id) ON DELETE CASCADE
- INDEX (userId, status)
- INDEX (assetId, status)

---

### 7. WheelTrades (Trades WHEEL) - FASE 101-108

Armazena operações de opções realizadas dentro de uma estratégia WHEEL.

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  strategyId: UUID; // Foreign Key -> WheelStrategies.id
  tradeType: WheelTradeType; // ENUM: sell_put, sell_call, buy_put, buy_call, exercise_put, exercise_call
  status: WheelTradeStatus; // ENUM: open, closed, exercised, expired
  optionSymbol: string; // Código da opção (ex: PETRH25)
  underlyingTicker: string; // Ticker do ativo base
  optionType: string; // PUT ou CALL
  strike: decimal(18, 8); // Preço de exercício
  expiration: date; // Data de vencimento
  contracts: integer; // Quantidade de contratos
  entryPrice: decimal(18, 8); // Prêmio de entrada
  exitPrice: decimal(18, 8); // Prêmio de saída
  underlyingPriceAtEntry: decimal(18, 8); // Preço do ativo na entrada
  underlyingPriceAtExit: decimal(18, 8); // Preço do ativo na saída
  premiumReceived: decimal(18, 2); // Prêmio recebido total
  realizedPnL: decimal(18, 2); // P&L realizado do trade
  delta: decimal(10, 8); // Greek: Delta
  gamma: decimal(10, 8); // Greek: Gamma
  theta: decimal(10, 8); // Greek: Theta
  vega: decimal(10, 8); // Greek: Vega
  ivAtEntry: decimal(10, 6); // IV na entrada
  ivRankAtEntry: decimal(10, 4); // IV Rank na entrada
  openedAt: timestamp; // Data de abertura
  closedAt: timestamp; // Data de fechamento
  notes: text; // Observações
  metadata: JSONB; // Dados extras
}
```

**Constraints:**

- `strategyId` FOREIGN KEY REFERENCES wheel_strategies(id) ON DELETE CASCADE
- INDEX (strategyId, status)
- INDEX (optionSymbol)
- INDEX (expiration)

---

### 8. OptionPrices (Preços de Opções) - FASE 107

Armazena cotações de opções da B3 para análise e recomendações.

**Schema:**

```typescript
{
  id: UUID; // Primary Key
  ticker: string; // Código da opção (ex: PETRD25)
  underlyingAssetId: UUID; // Foreign Key -> Assets.id
  type: OptionType; // ENUM: call, put
  style: OptionStyle; // ENUM: american, european
  status: OptionStatus; // ENUM: active, expired, exercised
  strike: decimal(18, 8); // Preço de exercício
  expirationDate: date; // Data de vencimento
  lastPrice: decimal(18, 8); // Último preço negociado
  bid: decimal(18, 8); // Melhor oferta de compra
  ask: decimal(18, 8); // Melhor oferta de venda
  volume: bigint; // Volume negociado
  openInterest: bigint; // Contratos em aberto
  impliedVolatility: decimal(10, 6); // Volatilidade implícita
  delta: decimal(10, 8); // Greek: Delta
  gamma: decimal(10, 8); // Greek: Gamma
  theta: decimal(10, 8); // Greek: Theta
  vega: decimal(10, 8); // Greek: Vega
  rho: decimal(10, 8); // Greek: Rho
  underlyingPrice: decimal(18, 8); // Preço do ativo base
  intrinsicValue: decimal(18, 8); // Valor intrínseco
  extrinsicValue: decimal(18, 8); // Valor extrínseco
  daysToExpiration: integer; // Dias até o vencimento
  inTheMoney: boolean; // Se está ITM
  source: string; // Fonte do dado (scraper)
  quoteTime: timestamp; // Hora da cotação
  metadata: JSONB; // Dados extras
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Constraints:**

- `underlyingAssetId` FOREIGN KEY REFERENCES assets(id) ON DELETE CASCADE
- INDEX (underlyingAssetId, expirationDate, type)
- INDEX (ticker)
- INDEX (expirationDate)
- INDEX (strike, type)

---

## 🔗 RELACIONAMENTOS

```mermaid
erDiagram
    USERS ||--o{ PORTFOLIOS : "possui"
    USERS ||--o{ ANALYSES : "solicita"
    ASSETS ||--o{ ASSET_PRICES : "tem"
    ASSETS ||--o{ ANALYSES : "analisado em"
    ASSETS ||--o{ PORTFOLIO_POSITIONS : "compõe"
    PORTFOLIOS ||--o{ PORTFOLIO_POSITIONS : "contém"

    USERS {
        UUID id PK
        string email
        string name
    }

    ASSETS {
        UUID id PK
        string ticker UK
        string name
        AssetType type
    }

    ASSET_PRICES {
        UUID id PK
        UUID assetId FK
        date date
        decimal close
    }

    ANALYSES {
        UUID id PK
        UUID assetId FK
        UUID userId FK
        AnalysisType type
    }

    PORTFOLIOS {
        UUID id PK
        UUID userId FK
        string name
    }

    PORTFOLIO_POSITIONS {
        UUID id PK
        UUID portfolioId FK
        UUID assetId FK
        decimal quantity
    }
```

---

## ⚡ INDEXES E PERFORMANCE

### Indexes Críticos

```sql
-- Performance crítica para queries frequentes
CREATE INDEX idx_asset_prices_date ON asset_prices(date);
CREATE INDEX idx_asset_prices_asset_date ON asset_prices(asset_id, date);
CREATE INDEX idx_analyses_asset_type ON analyses(asset_id, type);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at);
CREATE INDEX idx_portfolio_positions_portfolio ON portfolio_positions(portfolio_id);
CREATE INDEX idx_assets_ticker ON assets(ticker);
```

### Queries Otimizadas

**1. Buscar preço mais recente de um ativo:**

```sql
SELECT * FROM asset_prices
WHERE asset_id = 'uuid-do-ativo'
ORDER BY date DESC
LIMIT 1;
-- Usa: idx_asset_prices_asset_date
```

**2. Buscar análises de um usuário (mais recentes primeiro):**

```sql
SELECT * FROM analyses
WHERE user_id = 'uuid-do-usuario'
ORDER BY created_at DESC;
-- Usa: idx_analyses_user_created
```

**3. Buscar posições de um portfólio com dados do ativo:**

```sql
SELECT pp.*, a.ticker, a.name, ap.close as current_price
FROM portfolio_positions pp
JOIN assets a ON pp.asset_id = a.id
JOIN LATERAL (
  SELECT close FROM asset_prices
  WHERE asset_id = pp.asset_id
  ORDER BY date DESC LIMIT 1
) ap ON true
WHERE pp.portfolio_id = 'uuid-do-portfolio';
-- Usa: idx_portfolio_positions_portfolio + idx_asset_prices_asset_date
```

---

## 🔄 MIGRATIONS

**Localização:** `backend/src/database/migrations/`

**Migrations Aplicadas:**

1. `1762906000000-CreateScraperMetrics.ts` - Sistema de métricas de scrapers
2. `1762905000000-CreateUpdateLogs.ts` - Sistema de atualização de ativos
3. `1762904000000-InitialSchema.ts` - Schema inicial (Assets, Prices, Analyses, etc)

**Comandos:**

```bash
# Criar nova migration
npm run migration:create -- src/database/migrations/NomeDaMigration

# Executar migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert
```

---

## 📚 QUERIES COMUNS

### Análise de Performance de Ativos

```sql
-- Top 10 ativos com maior variação nos últimos 30 dias
SELECT
  a.ticker,
  a.name,
  ap1.close as current_price,
  ap30.close as price_30d_ago,
  ((ap1.close - ap30.close) / ap30.close * 100) as variation_30d
FROM assets a
JOIN asset_prices ap1 ON a.id = ap1.asset_id AND ap1.date = CURRENT_DATE
JOIN asset_prices ap30 ON a.id = ap30.asset_id AND ap30.date = CURRENT_DATE - INTERVAL '30 days'
WHERE a.is_active = true
ORDER BY variation_30d DESC
LIMIT 10;
```

### Cross-Validation de Análises

```sql
-- Análises com alta confiança (>= 90%)
SELECT
  a.ticker,
  an.type,
  an.recommendation,
  an.confidence_score,
  an.sources_count,
  an.completed_at
FROM analyses an
JOIN assets a ON an.asset_id = a.id
WHERE an.status = 'completed'
  AND an.confidence_score >= 0.9
ORDER BY an.completed_at DESC;
```

### Performance de Portfólios

```sql
-- Resumo de portfólio com lucro/prejuízo
SELECT
  p.name,
  COUNT(pp.id) as total_positions,
  SUM(pp.total_cost) as total_invested,
  SUM(pp.total_value) as total_current_value,
  SUM(pp.profit_loss) as total_profit_loss,
  (SUM(pp.profit_loss) / SUM(pp.total_cost) * 100) as profit_loss_percent
FROM portfolios p
LEFT JOIN portfolio_positions pp ON p.id = pp.portfolio_id
WHERE p.is_active = true
GROUP BY p.id, p.name;
```

---

**Documentação complementar:**

- Ver `ARCHITECTURE.md` para fluxos de dados
- Ver `claude.md` para convenções de código TypeORM
- Ver `TROUBLESHOOTING.md` para problemas comuns de banco de dados
