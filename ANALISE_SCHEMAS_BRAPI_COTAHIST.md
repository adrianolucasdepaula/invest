# ANÁLISE COMPARATIVA: Schemas BRAPI vs COTAHIST

**Data:** 2025-11-16
**Objetivo:** Garantir sincronização perfeita entre fontes de dados

---

## 📊 SCHEMAS ATUAIS

### 1. PriceDataPoint (TypeScript - Interface Sistema)

**Arquivo:** `backend/src/api/market-data/interfaces/price-data.interface.ts`

```typescript
export interface PriceDataPoint {
  date: string;    // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

**Campos:** 6
**Uso:** Interface padrão do sistema para preços históricos

---

### 2. BRAPI (historicalPrices)

**Arquivo:** `backend/src/scrapers/fundamental/brapi.scraper.ts:26-34`

```typescript
historicalPrices?: Array<{
  date: string;          // ISO format (timestamp convertido)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number; // ⚠️ EXCLUSIVO BRAPI
}>;
```

**Campos:** 7 (6 básicos + 1 exclusivo)
**Campos exclusivos:**
- `adjustedClose`: Preço ajustado por splits e dividendos

**Limitações:**
- `range` máximo: 3mo (Free plan)
- Apenas dados diários (interval=1d)
- Custo: FREE (até 10k requests/mês)

---

### 3. COTAHIST (Parser Atual - 9 campos)

**Arquivo:** `backend/python-service/app/services/cotahist_service.py:139-147`

```python
return {
    "ticker": codneg,      # ⚠️ Não está em PriceDataPoint
    "date": date_iso,      # ✅ Compatível
    "open": preabe,        # ✅ Compatível
    "high": premax,        # ✅ Compatível
    "low": premin,         # ✅ Compatível
    "close": preult,       # ✅ Compatível
    "volume": voltot,      # ✅ Compatível
}
```

**Campos:** 9 (6 básicos + ticker + 2 extras)
**Campos compatíveis com PriceDataPoint:** 6
**Campos extras atuais:** ticker, (mais 2 não implementados)

**Limitações:**
- Preços NÃO ajustados (raw data)
- Apenas dados diários
- Custo: 100% GRATUITO

---

## 🆚 COMPARAÇÃO DETALHADA

| Campo | PriceDataPoint | BRAPI | COTAHIST (atual) | COTAHIST (completo) |
|-------|----------------|-------|------------------|---------------------|
| **date** | ✅ string | ✅ string | ✅ string | ✅ string |
| **open** | ✅ number | ✅ number | ✅ float | ✅ float |
| **high** | ✅ number | ✅ number | ✅ float | ✅ float |
| **low** | ✅ number | ✅ number | ✅ float | ✅ float |
| **close** | ✅ number | ✅ number | ✅ float | ✅ float |
| **volume** | ✅ number | ✅ number | ✅ int | ✅ int |
| **adjustedClose** | ❌ | ✅ (exclusivo) | ❌ | ❌ |
| **ticker** | ❌ | ❌ | ✅ | ✅ |
| **company_name** | ❌ | ❌ | ❌ | ✅ (NOMRES) |
| **stock_type** | ❌ | ❌ | ❌ | ✅ (ESPECI) |
| **market_type** | ❌ | ❌ | ❌ | ✅ (TPMERC) |
| **bdi_code** | ❌ | ❌ | ❌ | ✅ (CODBDI) |
| **average_price** | ❌ | ❌ | ❌ | ✅ (PREMED) |
| **best_bid** | ❌ | ❌ | ❌ | ✅ (PREOFC) |
| **best_ask** | ❌ | ❌ | ❌ | ✅ (PREOFV) |
| **trades_count** | ❌ | ❌ | ❌ | ✅ (QUATOT) |

**Total de campos:**
- PriceDataPoint: 6
- BRAPI: 7 (6 + adjustedClose)
- COTAHIST (atual): 9 (6 + ticker + 2)
- COTAHIST (completo): 16 (6 + 10 exclusivos)

---

## 🎯 ESTRATÉGIA DE SINCRONIZAÇÃO

### Objetivo
Combinar BRAPI (recente, ajustado) + COTAHIST (histórico completo, não ajustado) sem perder dados.

### Regras de Merge

**1. Campos Obrigatórios (6 básicos):**
```
date, open, high, low, close, volume
```
- ✅ Presentes em AMBAS as fontes
- ✅ Compatíveis com `PriceDataPoint`
- ✅ NUNCA manipular valores (regra de ouro)

**2. Campos Opcionais:**

**adjustedClose (BRAPI):**
- ✅ Manter quando disponível
- ✅ Útil para análise de retornos reais
- ⚠️ Apenas últimos 3 meses

**Campos COTAHIST (10 exclusivos):**
- ✅ Manter quando disponível
- ✅ Útil para UX (company_name, stock_type)
- ✅ Útil para análise (avg_price, best_bid/ask)
- ⚠️ Apenas em dados históricos (pré 3 meses)

### Lógica de Merge (Pseudocódigo)

```typescript
function mergeHistoricalPrices(
  ticker: string,
  brapiData: BrapiHistoricalPrice[],  // Últimos 3 meses
  cotahistData: CotahistPrice[]       // 1986-2025
): ExtendedPriceDataPoint[] {

  // 1. Criar mapa por data
  const priceMap = new Map<string, ExtendedPriceDataPoint>();

  // 2. Adicionar COTAHIST (base histórica completa)
  for (const price of cotahistData) {
    priceMap.set(price.date, {
      // Campos básicos (compatível PriceDataPoint)
      date: price.date,
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,

      // Campos COTAHIST exclusivos
      source: 'cotahist',
      companyName: price.company_name,
      stockType: price.stock_type,
      averagePrice: price.average_price,
      bestBid: price.best_bid,
      bestAsk: price.best_ask,
      tradesCount: price.trades_count,
      marketType: price.market_type,
      bdiCode: price.bdi_code,

      // Campos BRAPI (ainda não disponíveis)
      adjustedClose: null,
    });
  }

  // 3. Sobrescrever/Adicionar BRAPI (últimos 3 meses, com adjusted)
  for (const price of brapiData) {
    const existing = priceMap.get(price.date);

    if (existing) {
      // Atualizar registro existente (manter campos COTAHIST)
      priceMap.set(price.date, {
        ...existing,
        // ⚠️ CRITICAL: Validar se valores são IDÊNTICOS
        // Se divergirem, logar warning e usar COTAHIST (oficial B3)
        open: validatePrice(price.open, existing.open, 'open'),
        high: validatePrice(price.high, existing.high, 'high'),
        low: validatePrice(price.low, existing.low, 'low'),
        close: validatePrice(price.close, existing.close, 'close'),
        volume: validateVolume(price.volume, existing.volume),

        // Adicionar campo exclusivo BRAPI
        adjustedClose: price.adjustedClose,
        source: 'brapi+cotahist',
      });
    } else {
      // Novo registro (apenas BRAPI, sem dados COTAHIST)
      priceMap.set(price.date, {
        date: price.date,
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume,
        adjustedClose: price.adjustedClose,
        source: 'brapi',

        // Campos COTAHIST ausentes
        companyName: null,
        stockType: null,
        // ... outros null
      });
    }
  }

  // 4. Converter para array ordenado por data
  return Array.from(priceMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Função de validação CRÍTICA
function validatePrice(
  brapiValue: number,
  cotahistValue: number,
  field: string,
  tolerance: number = 0.01  // 1% tolerância
): number {
  const diff = Math.abs(brapiValue - cotahistValue);
  const pctDiff = diff / cotahistValue;

  if (pctDiff > tolerance) {
    logger.warn(
      `Price divergence detected for ${field}: ` +
      `BRAPI=${brapiValue} vs COTAHIST=${cotahistValue} ` +
      `(${(pctDiff * 100).toFixed(2)}% diff). Using COTAHIST (official B3).`
    );
    return cotahistValue;  // ⚠️ COTAHIST tem prioridade (oficial B3)
  }

  // Valores próximos: usar COTAHIST (oficial)
  return cotahistValue;
}
```

---

## 🚨 DIVERGÊNCIAS ESPERADAS

### Por que BRAPI e COTAHIST podem divergir?

**1. Arredondamentos:**
- BRAPI: Pode arredondar casas decimais
- COTAHIST: Valores exatos (÷100)

**2. Fonte de dados:**
- BRAPI: Pode usar APIs Yahoo Finance (secundárias)
- COTAHIST: Fonte oficial B3

**3. Horário de fechamento:**
- BRAPI: Pode capturar preço intraday
- COTAHIST: Sempre pregão oficial encerrado

**4. Ajustes:**
- BRAPI: adjustedClose considera splits/dividendos
- COTAHIST: Preços brutos (não ajustados)

### Regra de Ouro

**EM CASO DE DIVERGÊNCIA > 1%:**
- ✅ USAR COTAHIST (oficial B3)
- ✅ LOGAR WARNING com valores
- ✅ NÃO manipular dados
- ✅ Investigar causa raiz

---

## 📋 SCHEMA FINAL - ExtendedPriceDataPoint

```typescript
export interface ExtendedPriceDataPoint extends PriceDataPoint {
  // Campos herdados de PriceDataPoint (6)
  // date: string;
  // open: number;
  // high: number;
  // low: number;
  // close: number;
  // volume: number;

  // Metadados
  source: 'brapi' | 'cotahist' | 'brapi+cotahist';

  // Campo exclusivo BRAPI
  adjustedClose?: number;  // Opcional (apenas últimos 3 meses)

  // Campos exclusivos COTAHIST (opcional - apenas histórico)
  companyName?: string;     // NOMRES (ex: "AMBEV S/A")
  stockType?: string;       // ESPECI (ex: "ON", "PN", "UNT")
  marketType?: number;      // TPMERC
  bdiCode?: number;         // CODBDI (02, 12, 96)
  averagePrice?: number;    // PREMED
  bestBid?: number;         // PREOFC
  bestAsk?: number;         // PREOFV
  tradesCount?: number;     // QUATOT
}
```

**Vantagens:**
- ✅ Compatível com `PriceDataPoint` (6 campos básicos)
- ✅ Adiciona `adjustedClose` do BRAPI
- ✅ Adiciona 8 campos extras do COTAHIST
- ✅ Campo `source` rastreia origem
- ✅ Campos opcionais (não quebra código existente)

---

## ✅ DECISÕES TÉCNICAS

### 1. Qual fonte tem prioridade?

**COTAHIST** (em caso de divergência > 1%)

**Justificativa:**
- Fonte oficial B3
- Dados brutos (não manipulados)
- Layout documentado publicamente

### 2. Manter adjustedClose?

**SIM**

**Justificativa:**
- Útil para análise de retornos reais
- Não altera dados brutos (campo separado)
- Apenas últimos 3 meses (BRAPI)

### 3. Manter campos extras COTAHIST?

**SIM**

**Justificativa:**
- `companyName`: Melhora UX frontend
- `stockType`: Permite filtros ON/PN/UNT
- `averagePrice`: Útil para análise técnica
- `bestBid/Ask`: Order book, spread

### 4. Estrutura de armazenamento no PostgreSQL?

**Opção A - Tabela única (RECOMENDADO):**
```sql
CREATE TABLE historical_prices (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  date DATE NOT NULL,

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

  -- Campos COTAHIST (nullable)
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

  UNIQUE (asset_id, date)
);
```

**Vantagens:**
- ✅ Consultas simples (sem JOIN)
- ✅ UPSERT fácil (ON CONFLICT)
- ✅ Campos nullable (compatibilidade)

**Opção B - Tabelas separadas:**
- ❌ Complexo (2 tabelas + JOIN)
- ❌ Duplicação de dados básicos
- ❌ Não recomendado

**DECISÃO:** Opção A (tabela única)

---

## 🔄 FLUXO DE SINCRONIZAÇÃO

```
1. Sincronizar COTAHIST (1986-2025)
   ├─ Download anos necessários
   ├─ Parse 16 campos
   ├─ Filtrar BDI (02, 12, 96)
   └─ UPSERT no PostgreSQL
       └─ ON CONFLICT (asset_id, date) DO UPDATE SET source='cotahist'

2. Sincronizar BRAPI (últimos 3 meses)
   ├─ Fetch range=3mo
   ├─ Parse 7 campos
   └─ UPSERT no PostgreSQL
       └─ ON CONFLICT (asset_id, date) DO UPDATE SET
           adjusted_close = EXCLUDED.adjusted_close,
           source = CASE
             WHEN source = 'cotahist' THEN 'brapi+cotahist'
             ELSE 'brapi'
           END

3. Validação Cross-Source
   ├─ Query registros com source='brapi+cotahist'
   ├─ Comparar: close vs adjustedClose
   ├─ Se diff > 1%: Logar warning
   └─ Manter COTAHIST como canonical (close)
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar `cotahist_service.py` com 16 campos
- [ ] Criar `ExtendedPriceDataPoint` interface (TypeScript)
- [ ] Atualizar migration: adicionar colunas nullable
- [ ] Implementar `syncHistoricalDataFromCotahist()` (NestJS)
- [ ] Implementar `validatePriceDivergence()` (NestJS)
- [ ] Implementar merge logic (COTAHIST + BRAPI)
- [ ] Testes unitários: merge scenarios
- [ ] Testes E2E: sincronização completa (ABEV3)
- [ ] Documentação: ARCHITECTURE.md

---

**Fim da análise - SCHEMAS BRAPI vs COTAHIST**
