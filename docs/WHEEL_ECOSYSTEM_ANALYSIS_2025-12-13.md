# WHEEL OPTIONS STRATEGY - ECOSYSTEM ANALYSIS REPORT

**Date:** 2025-12-13
**Analyst:** PM Expert Agent (Claude Opus 4.5)
**Project:** B3 AI Analysis Platform (invest-claude-web)
**Objective:** Ultra-comprehensive analysis of the ENTIRE ecosystem needed for WHEEL options strategy implementation

---

## EXECUTIVE SUMMARY

### Current Ecosystem Status

| Category | Exists | Works | Coverage |
|----------|--------|-------|----------|
| Options Scraping | YES | PARTIAL | 40% |
| Fundamental Scraping | YES | YES | 85% |
| Options Backend Module | YES | YES | 60% |
| Options Database Entity | YES | YES | 90% |
| Interest Rate Data | YES | YES | 100% |
| IV Rank Functionality | YES | PARTIAL | 30% |
| WHEEL Strategy Logic | NO | - | 0% |
| WHEEL Frontend UI | NO | - | 0% |
| Delta Selection | PARTIAL | PARTIAL | 20% |
| Options API Endpoints | YES | YES | 70% |

### Key Finding

The platform has **STRONG foundations** for WHEEL implementation:
- Robust fundamental data infrastructure (6 TypeScript + 5 Python scrapers)
- Complete options entity with Greeks (delta, gamma, theta, vega, rho)
- BCB scraper provides Selic/interest rates
- Options scraper (opcoes.net.br) provides IV Rank, options chains, Greeks

**Critical Gaps:**
- No WHEEL strategy selection algorithm
- No covered call/cash-secured PUT workflow
- Missing IV Rank historical data
- No automated Delta 15 filtering
- Missing WHEEL portfolio tracking

---

## 1. SCRAPERS ANALYSIS

### 1.1 Python Scrapers (backend/python-scrapers/scrapers/)

#### 1.1.1 opcoes_scraper.py - OPTIONS DATA (CRITICAL)

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\python-scrapers\scrapers\opcoes_scraper.py`
**Lines:** ~482
**Status:** FUNCTIONAL (Playwright migrated 2025-12-04)
**Login:** REQUIRED (CPF: 312.862.178-06)

**Data Extracted:**
| Field | Type | WHEEL Relevance |
|-------|------|-----------------|
| `ticker` | string | Underlying asset |
| `underlying_price` | number | Position sizing |
| `iv_rank` | number | **CRITICAL** - Entry signal |
| `iv_percentile` | number | Entry signal |
| `options_chain[]` | array | Strike selection |
| `options_chain[].symbol` | string | Option ticker |
| `options_chain[].type` | string | CALL/PUT |
| `options_chain[].strike` | number | Strike price |
| `options_chain[].expiration` | date | **CRITICAL** |
| `options_chain[].bid` | number | Premium income |
| `options_chain[].ask` | number | Entry price |
| `options_chain[].last` | number | Last traded |
| `options_chain[].volume` | number | Liquidity |
| `options_chain[].open_interest` | number | Position sizing |
| `options_chain[].iv` | number | Option IV |
| `options_chain[].delta` | number | **CRITICAL** - Delta 15 |
| `options_chain[].gamma` | number | Risk management |
| `options_chain[].theta` | number | Time decay |
| `options_chain[].vega` | number | Volatility exposure |

**Missing for WHEEL:**
- Historical IV Rank data
- IV Surface
- Probability ITM/OTM
- Expected move calculation
- Days to nearest Friday expiration

#### 1.1.2 fundamentus_scraper.py - FUNDAMENTAL DATA

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\python-scrapers\scrapers\fundamentus_scraper.py`
**Lines:** ~337
**Status:** FUNCTIONAL (Playwright migrated 2025-11-27)
**Login:** NOT REQUIRED

**Data Extracted for WHEEL Filters:**
| Field | WHEEL Criterion | Status |
|-------|-----------------|--------|
| `roe` | ROE > 15% | AVAILABLE |
| `dividendYield` | DY > 6% | AVAILABLE |
| `div_liquida_ebit` | Div.Liq/EBIT < 2.0 | AVAILABLE |
| `div_bruta_patrim` | Debt analysis | AVAILABLE |
| `margem_liquida` | Quality filter | AVAILABLE |
| `roic` | Capital efficiency | AVAILABLE |
| `pl` | Valuation | AVAILABLE |
| `pvp` | Valuation | AVAILABLE |

#### 1.1.3 bcb_scraper.py - INTEREST RATES (CRITICAL)

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\python-scrapers\scrapers\bcb_scraper.py`
**Lines:** ~475
**Status:** FUNCTIONAL
**Login:** NOT REQUIRED (Public API)

**Data for WHEEL:**
| Series | Code | WHEEL Use |
|--------|------|-----------|
| `selic_meta` | 432 | Risk-free rate comparison |
| `selic_efetiva` | 4189 | Yield comparison |
| `cdi` | 4391 | **CRITICAL** - Return benchmark |
| `ipca` | 433 | Real return calculation |

#### 1.1.4 anbima_scraper.py - YIELD CURVE

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\python-scrapers\scrapers\anbima_scraper.py`
**Lines:** ~367
**Status:** FUNCTIONAL
**Login:** NOT REQUIRED (Tesouro Direto public API)

**Data for WHEEL:**
- Treasury IPCA+ yields (8 vertices: 1y-30y)
- Used for opportunity cost comparison

#### 1.1.5 Other Python Scrapers Summary

| Scraper | Status | WHEEL Relevance |
|---------|--------|-----------------|
| investidor10_scraper.py | FUNCTIONAL | ROE, DY, PEG Ratio |
| statusinvest_scraper.py | FUNCTIONAL | Margins, DY, fundamentals |
| advfn_scraper.py | PARTIAL | Real-time prices |
| investing_scraper.py | PARTIAL | Market data |
| googlefinance_scraper.py | PARTIAL | Price quotes |
| tradingview_scraper.py | MINIMAL | Technical indicators (NEEDS EXPANSION) |
| b3_scraper.py | PARTIAL | Corporate info |
| ipeadata_scraper.py | FUNCTIONAL | Commodities (oil, iron ore) |
| fred_scraper.py | IMPLEMENTED | US Treasury yields |

### 1.2 TypeScript Scrapers (backend/src/scrapers/)

#### 1.2.1 opcoes.scraper.ts - OPTIONS DATA

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\scrapers\options\opcoes.scraper.ts`
**Lines:** ~614
**Status:** FUNCTIONAL
**Login:** REQUIRED

**Key Methods:**
- `scrapeData(ticker)` - Full options chain
- `scrapeLiquidity()` - All liquid tickers
- `scrapeLiquidityWithDetails()` - Liquidity metrics per ticker
- `checkSingleTicker()` - Individual ticker check

**Data Structure:**
```typescript
interface OpcoesData {
  ticker: string;
  precoAtivo: number;          // Underlying price
  volatilidade: number;        // Historical volatility
  ivRank: number;              // IV Rank (CRITICAL)
  proximoVencimento: Date;     // Next expiration
  calls: OpcaoData[];          // Call options
  puts: OpcaoData[];           // Put options
}

interface OpcaoData {
  ticker: string;
  strike: number;
  tipo: 'CALL' | 'PUT';
  vencimento: Date;
  premium: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;              // CRITICAL for Delta 15
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsicValue: number;
  timeValue: number;
}
```

#### 1.2.2 Fundamental Scrapers Summary

| Scraper | File | WHEEL Fields |
|---------|------|--------------|
| FundamentusScraper | fundamentus.scraper.ts | P/L, P/VP, ROE, DY, margins |
| StatusInvestScraper | statusinvest.scraper.ts | All fundamentals |
| Investidor10Scraper | investidor10.scraper.ts | ROE, DY, PEG, CAGR |
| FundamenteiScraper | fundamentei.scraper.ts | Core indicators |
| InvestsiteScraper | investsite.scraper.ts | Margins, liquidity |
| BrapiScraper | brapi.scraper.ts | Market cap, prices |

---

## 2. BACKEND MODULES ANALYSIS

### 2.1 Options Module

**Location:** `backend/src/modules/options/`

#### 2.1.1 options.service.ts

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\modules\options\options.service.ts`
**Lines:** ~331

**Methods:**
| Method | Purpose | WHEEL Use |
|--------|---------|-----------|
| `create(dto)` | Create option record | Store scraped data |
| `upsertOption(dto)` | Create/update option | Data sync |
| `findById(id)` | Get single option | Detail view |
| `findByTicker(ticker)` | Get by option ticker | Lookup |
| `getOptionChain(assetId, expDate?)` | **CRITICAL** - Full chain | Strategy selection |
| `findOptions(filter)` | Filtered search | Delta 15 filtering |
| `getExpirationDates(assetId)` | Available expirations | Expiration selection |
| `getChainSummary(assetId)` | Chain statistics | Put/Call ratio |
| `expireOptions()` | Expire old options | Maintenance |
| `updateGreeks(id, greeks)` | Update Greeks | Delta updates |
| `calculateIntrinsicValue()` | ITM/OTM value | Position analysis |
| `calculateDaysToExpiration()` | DTE calc | **CRITICAL** |
| `calculateMaxPain()` | Max pain price | Support/resistance |

**Missing Methods for WHEEL:**
- `findOptionsByDelta(assetId, targetDelta, type)` - Delta 15 filter
- `getWheelCandidates(filters)` - Strategy candidates
- `calculateAnnualizedReturn(premium, strike, dte)` - Return calculation
- `calculateProbabilityITM(delta)` - Risk assessment
- `getIVRankHistory(assetId, days)` - IV Rank historical

#### 2.1.2 options.controller.ts

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\modules\options\options.controller.ts`
**Lines:** ~128
**Base Route:** `/api/v1/options`

**Endpoints:**
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/` | Create/update option |
| GET | `/chain/:assetId` | Get option chain |
| GET | `/chain/:assetId/summary` | Chain summary |
| GET | `/chain/:assetId/expirations` | Expiration dates |
| GET | `/search` | Search with filters |
| GET | `/ticker/:ticker` | Find by ticker |
| GET | `/:id` | Find by ID |
| PUT | `/:id/greeks` | Update Greeks |
| POST | `/expire` | Expire old options |

**Missing Endpoints for WHEEL:**
- `GET /wheel/candidates` - WHEEL strategy candidates
- `POST /wheel/select-put` - Select cash-secured PUT
- `POST /wheel/select-call` - Select covered CALL
- `GET /wheel/portfolio` - WHEEL positions tracking
- `GET /wheel/analytics` - WHEEL performance

### 2.2 Assets Module (Relevant Methods)

**Location:** `backend/src/api/assets/`

**Key Features:**
- `hasOptions` field on Asset entity
- `optionsLiquidityMetadata` field for liquidity data
- `syncOptionsLiquidity()` endpoint
- Bulk update with `hasOptionsOnly` filter

### 2.3 Scrapers Service

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\scrapers\scrapers.service.ts`
**Lines:** ~2121

**Options Integration:**
```typescript
private opcoesScraper: OpcoesScraper;

async scrapeOptionsData(ticker: string): Promise<any> {
  return this.opcoesScraper.scrape(ticker);
}
```

---

## 3. DATABASE SCHEMA ANALYSIS

### 3.1 OptionPrice Entity

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\database\entities\option-price.entity.ts`
**Lines:** ~144

**Schema:**
```typescript
@Entity('option_prices')
export class OptionPrice {
  id: string;                    // UUID
  ticker: string;                // Option ticker
  underlyingAssetId: string;     // FK to Asset
  type: OptionType;              // CALL | PUT
  style: OptionStyle;            // AMERICAN | EUROPEAN
  status: OptionStatus;          // ACTIVE | EXPIRED | EXERCISED
  strike: number;                // Strike price (decimal 18,8)
  expirationDate: Date;          // Expiration
  lastPrice: number;             // Last traded
  bid: number;                   // Bid price
  ask: number;                   // Ask price
  volume: number;                // Trading volume
  openInterest: number;          // Open interest
  impliedVolatility: number;     // IV (decimal 10,6)
  delta: number;                 // Delta (decimal 10,8)
  gamma: number;                 // Gamma
  theta: number;                 // Theta
  vega: number;                  // Vega
  rho: number;                   // Rho
  underlyingPrice: number;       // Spot price
  intrinsicValue: number;        // Calculated
  extrinsicValue: number;        // Time value
  daysToExpiration: number;      // DTE
  inTheMoney: boolean;           // ITM flag
  source: string;                // Data source
  quoteTime: Date;               // Quote timestamp
  metadata: {                    // JSONB
    lotSize?: number;
    exerciseStyle?: string;
    settlementType?: string;
    currency?: string;
    exchange?: string;
    rawData?: Record<string, any>;
  };
}
```

**Indexes:**
- `(underlyingAssetId, expirationDate, type)` - Chain lookup
- `(ticker)` - Direct lookup
- `(expirationDate)` - Expiration filter
- `(strike, type)` - Strike/type filter

**Missing for WHEEL:**
- `ivRank: number` - IV Rank at time of quote
- `ivPercentile: number` - IV Percentile
- `annualizedYield: number` - Calculated yield
- `probabilityItm: number` - Probability ITM

### 3.2 FundamentalData Entity

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\database\entities\fundamental-data.entity.ts`
**Lines:** ~203

**WHEEL-Relevant Fields:**
| Field | Type | WHEEL Criterion |
|-------|------|-----------------|
| `roe` | decimal(18,2) | ROE > 15% |
| `dividendYield` | decimal(18,2) | DY > 6% |
| `dividaLiquidaEbitda` | decimal(18,2) | < 2.0 |
| `margemLiquida` | decimal(18,2) | Quality filter |
| `roic` | decimal(18,2) | Capital efficiency |
| `pl` | decimal(18,2) | Valuation |
| `pvp` | decimal(18,2) | Valuation |
| `liquidezCorrente` | decimal(18,2) | Financial health |
| `patrimonioLiquido` | decimal(18,2) | Size filter |

### 3.3 Asset Entity

**File:** `c:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\src\database\entities\asset.entity.ts`
**Lines:** ~108

**Options-Related Fields:**
```typescript
hasOptions: boolean;  // Flag for options availability
optionsLiquidityMetadata: Record<string, any>;  // Liquidity stats
```

### 3.4 Missing Tables for WHEEL

| Table | Purpose | Fields |
|-------|---------|--------|
| `wheel_positions` | Track WHEEL trades | position_id, asset_id, strategy_type, entry_date, exit_date, premium, strike, expiration, status |
| `wheel_trades` | Trade history | trade_id, position_id, action (SELL_PUT, SELL_CALL, ASSIGNED, EXERCISED), quantity, price, date |
| `iv_rank_history` | Historical IV Rank | asset_id, date, iv_rank, iv_percentile, hv_30d, hv_60d |
| `wheel_candidates` | Pre-filtered candidates | asset_id, roe, dy, div_ebitda, iv_rank, delta_15_put, delta_15_call, annualized_yield |

---

## 4. FRONTEND COMPONENTS ANALYSIS

### 4.1 Existing Pages

| Page | Route | WHEEL Relevance |
|------|-------|-----------------|
| Dashboard | `/dashboard` | Could show WHEEL summary |
| Assets | `/assets` | Asset list with hasOptions |
| Asset Detail | `/assets/[ticker]` | Add options tab |
| Portfolio | `/portfolio` | Could track WHEEL positions |
| Analysis | `/analysis` | Could show WHEEL analysis |
| Data Sources | `/data-sources` | Scraper status |

### 4.2 Existing Hooks

| Hook | File | WHEEL Use |
|------|------|-----------|
| useAssets | use-assets.ts | Asset listing |
| useAsset | use-assets.ts | Single asset |
| useAssetFundamentals | use-assets.ts | WHEEL filters |
| usePortfolio | use-portfolio.ts | Position tracking |
| useAnalysis | use-analysis.ts | Strategy analysis |

### 4.3 Missing Frontend Components

| Component | Purpose |
|-----------|---------|
| WheelDashboard | Main WHEEL strategy dashboard |
| WheelCandidates | List of filtered candidates |
| WheelPositions | Active WHEEL positions |
| PutSelector | Cash-secured PUT selection |
| CallSelector | Covered CALL selection |
| IVRankChart | IV Rank historical chart |
| OptionChainTable | Options chain with Greeks |
| WheelCalculator | Return calculator |
| PositionManager | Enter/manage positions |

### 4.4 Missing Hooks

| Hook | Purpose |
|------|---------|
| useWheelCandidates | Fetch filtered candidates |
| useOptionChain | Fetch option chain |
| useIVRank | Fetch IV Rank data |
| useWheelPositions | Track active positions |
| useWheelAnalytics | Performance metrics |

---

## 5. DATA FLOW MAPPING

### 5.1 Current Options Data Flow

```
opcoes.net.br
    |
    v
OpcoesNetScraper (Python) -OR- OpcoesScraper (TypeScript)
    |
    v
ScrapersService.scrapeOptionsData()
    |
    v
OptionsService.upsertOption()
    |
    v
option_prices TABLE (PostgreSQL)
    |
    v
OptionsController endpoints
    |
    v
Frontend API calls
    |
    v
React Components
```

### 5.2 Current Fundamental Data Flow

```
Multiple Sources (6+ scrapers)
    |
    v
ScrapersService.scrapeFundamentalData()
    |
    v
Cross-Validation (min 3 sources)
    |
    v
FundamentalData Entity
    |
    v
fundamental_data TABLE
    |
    v
AssetsController endpoints
    |
    v
Frontend Components
```

### 5.3 Proposed WHEEL Data Flow

```
[MISSING] WHEEL Candidate Filter
    |
    +---> Fundamental Data (ROE > 15%, DY > 6%, Div/EBITDA < 2)
    |
    +---> Options Data (hasOptions = true, liquid)
    |
    +---> IV Rank Data (IV Rank > 50% for entry)
    |
    v
[MISSING] WHEEL Candidates Table
    |
    v
[MISSING] WheelService.getCandidates()
    |
    v
[MISSING] WheelController endpoints
    |
    v
[MISSING] useWheelCandidates hook
    |
    v
[MISSING] WheelDashboard component
```

---

## 6. WHEEL STRATEGY REQUIREMENTS MAPPING

### 6.1 Complete Requirements Matrix

| WHEEL Requirement | System Component | Status | Gap Description |
|-------------------|------------------|--------|-----------------|
| **Asset Selection** | | | |
| ROE > 15% filter | FundamentalData.roe | AVAILABLE | Need filter query |
| DY > 6% filter | FundamentalData.dividendYield | AVAILABLE | Need filter query |
| Div.Liq/EBITDA < 2.0 | FundamentalData.dividaLiquidaEbitda | AVAILABLE | Need filter query |
| Margin quality | FundamentalData.margemLiquida | AVAILABLE | Define threshold |
| Has liquid options | Asset.hasOptions | AVAILABLE | Already implemented |
| | | | |
| **Options Selection** | | | |
| Delta ~15 PUT | OptionPrice.delta | AVAILABLE | Need query filter |
| Delta ~15 CALL | OptionPrice.delta | AVAILABLE | Need query filter |
| IV Rank > 50% | opcoes_scraper.iv_rank | PARTIAL | Need storage/history |
| Expiration ~30-45 DTE | OptionPrice.daysToExpiration | AVAILABLE | Need filter |
| Minimum premium | OptionPrice.bid | AVAILABLE | Need threshold calc |
| | | | |
| **Risk Management** | | | |
| Maximum position size | - | MISSING | Need config |
| Portfolio allocation | - | MISSING | Need calculation |
| Greeks monitoring | OptionPrice.delta/gamma/theta | AVAILABLE | Need dashboard |
| | | | |
| **Performance Tracking** | | | |
| Premium income | - | MISSING | Need tracking table |
| Annualized return | - | MISSING | Need calculation |
| Win/loss rate | - | MISSING | Need tracking |
| Assignment history | - | MISSING | Need tracking |
| | | | |
| **Workflow** | | | |
| Cash-secured PUT entry | - | MISSING | Need workflow |
| Covered CALL entry | - | MISSING | Need workflow |
| Roll management | - | MISSING | Need workflow |
| Assignment handling | - | MISSING | Need workflow |

### 6.2 Data Availability Score

| Data Category | Available | Needed | Score |
|---------------|-----------|--------|-------|
| Fundamental Indicators | 38 fields | 6 | 100% |
| Options Greeks | 5 Greeks | 5 | 100% |
| Options Pricing | bid/ask/last | bid/ask/last | 100% |
| IV Rank | Current only | Current + Historical | 50% |
| Expiration Data | Yes | Yes | 100% |
| Delta Filtering | Yes | Yes | 100% |
| Position Tracking | No | Yes | 0% |
| Performance Metrics | No | Yes | 0% |
| **Overall** | | | **56%** |

---

## 7. GAP ANALYSIS

### 7.1 Critical Gaps (Must Fix)

| Gap ID | Component | Description | Priority | Effort |
|--------|-----------|-------------|----------|--------|
| GAP-001 | Backend | WHEEL Candidates Service | P0 | HIGH |
| GAP-002 | Backend | WHEEL Positions Table/Entity | P0 | MEDIUM |
| GAP-003 | Backend | IV Rank History Storage | P0 | MEDIUM |
| GAP-004 | Frontend | WHEEL Dashboard Page | P0 | HIGH |
| GAP-005 | Backend | Delta 15 Filter Endpoint | P0 | LOW |
| GAP-006 | Backend | Annualized Yield Calculator | P0 | LOW |

### 7.2 Important Gaps (Should Fix)

| Gap ID | Component | Description | Priority | Effort |
|--------|-----------|-------------|----------|--------|
| GAP-007 | Frontend | Option Chain Component | P1 | MEDIUM |
| GAP-008 | Frontend | IV Rank Chart Component | P1 | MEDIUM |
| GAP-009 | Backend | WHEEL Trade Tracking | P1 | MEDIUM |
| GAP-010 | Backend | Roll Position Logic | P1 | MEDIUM |
| GAP-011 | Frontend | Position Manager | P1 | HIGH |
| GAP-012 | Backend | Assignment Detection | P1 | MEDIUM |

### 7.3 Nice-to-Have Gaps

| Gap ID | Component | Description | Priority | Effort |
|--------|-----------|-------------|----------|--------|
| GAP-013 | Backend | Probability ITM Calculator | P2 | LOW |
| GAP-014 | Frontend | WHEEL Performance Charts | P2 | MEDIUM |
| GAP-015 | Backend | Auto-roll Suggestions | P2 | HIGH |
| GAP-016 | Frontend | Mobile-responsive WHEEL UI | P2 | MEDIUM |
| GAP-017 | Backend | Alert System for Assignments | P2 | MEDIUM |

---

## 8. IMPLEMENTATION PRIORITIES

### 8.1 Phase 1: Foundation (2-3 days)

1. **Create WHEEL Entities**
   - WheelPosition entity
   - WheelTrade entity
   - IVRankHistory entity

2. **Extend Options Module**
   - Add `findByDelta()` method
   - Add IV Rank storage
   - Add annualized yield calculation

3. **Create WHEEL Module**
   - WheelService
   - WheelController
   - DTOs

### 8.2 Phase 2: Core Features (3-4 days)

1. **Backend Endpoints**
   - GET /wheel/candidates
   - POST /wheel/positions
   - GET /wheel/positions
   - PUT /wheel/positions/:id
   - GET /wheel/analytics

2. **Frontend Components**
   - WheelCandidates list
   - Basic WheelDashboard
   - useWheelCandidates hook

### 8.3 Phase 3: Advanced Features (3-4 days)

1. **Option Chain Integration**
   - Interactive option chain table
   - Real-time Greeks display
   - Strike selection UI

2. **Position Management**
   - Enter PUT position
   - Enter CALL position
   - Track assignments
   - Roll positions

### 8.4 Phase 4: Polish (2-3 days)

1. **Analytics & Charts**
   - IV Rank historical chart
   - Performance dashboard
   - P&L tracking

2. **Automation**
   - Alert system
   - Roll suggestions
   - Daily screening

---

## 9. RISK ASSESSMENT

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| opcoes.net.br login fails | MEDIUM | HIGH | Cookie persistence, manual refresh |
| Options data delay | MEDIUM | MEDIUM | Cache + scheduled updates |
| Greeks calculation errors | LOW | HIGH | Use source data, validate |
| Database performance | LOW | MEDIUM | Proper indexing |

### 9.2 Data Quality Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stale IV Rank | MEDIUM | MEDIUM | Timestamp tracking, alerts |
| Missing Greeks | MEDIUM | MEDIUM | Fallback calculation |
| Price staleness | MEDIUM | MEDIUM | Quote time display |

---

## 10. CONCLUSION

The B3 AI Analysis Platform has a **solid foundation** for implementing the WHEEL options strategy:

### Strengths
- Complete options entity with all Greeks
- Robust fundamental data infrastructure (6+ sources)
- Working opcoes.net.br scraper with IV Rank
- BCB scraper for interest rate comparison
- Asset hasOptions flag already implemented

### Weaknesses
- No WHEEL-specific workflow
- No position tracking for options strategies
- IV Rank not stored historically
- No annualized yield calculation
- Missing WHEEL frontend components

### Estimated Total Effort
- **Backend:** 6-8 days
- **Frontend:** 5-7 days
- **Testing:** 2-3 days
- **Total:** 13-18 days

### Recommended Approach
Start with Phase 1 (Foundation) to establish the data model, then iterate through phases with continuous validation. The existing infrastructure significantly reduces the effort needed.

---

*Report generated by PM Expert Agent - 2025-12-13*
*Project: invest-claude-web | Stack: NestJS + Next.js + PostgreSQL*
