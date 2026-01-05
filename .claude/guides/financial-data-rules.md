# Financial Data Rules

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Regras NÃO-NEGOCIÁVEIS para manipulação de dados financeiros

---

## ⚠️ CRÍTICO - Leitura Obrigatória

Este guia contém **regras absolutas** que NUNCA devem ser violadas. Violação pode resultar em:

- Perda de dinheiro real dos usuários
- Cálculos incorretos de impostos
- Decisões de investimento baseadas em dados errados
- Problemas legais e de compliance

**Quando em dúvida, consultar:** `.gemini/context/financial-rules.md`

---

## Regras NÃO-NEGOCIÁVEIS

### 1. Decimal (NUNCA Float) para Valores Monetários

**Regra Absoluta:** SEMPRE usar `Decimal.js` para valores monetários.

**Por quê?**

```javascript
// ❌ Float tem imprecisão binária
0.1 + 0.2 === 0.3  // false (!)
0.1 + 0.2          // 0.30000000000000004

// Em valores monetários:
100.10 + 200.20    // 300.29999999999995 (ERRADO!)

// ✅ Decimal é preciso
import { Decimal } from 'decimal.js';
new Decimal('100.10').plus('200.20').toString()  // "300.30" (CORRETO)
```

**Implementação:**

```typescript
// ❌ ERRADO
const price: number = 123.45;  // Float
const total = price * quantity;

// ✅ CORRETO
import { Decimal } from 'decimal.js';
const price: Decimal = new Decimal('123.45');
const total: Decimal = price.times(quantity);
```

### 2. Cross-Validation de Múltiplas Fontes

**Regra:** Mínimo **3 fontes** concordando para considerar dado confiável.

**Por quê?**

- Fontes podem ter dados incorretos
- Outliers acontecem (bugs, scraping errado)
- Segurança contra manipulação de dados

**Implementação:**

```typescript
interface DataPoint {
  source: string;
  value: Decimal;
  timestamp: Date;
}

function crossValidate(dataPoints: DataPoint[]): Decimal | null {
  if (dataPoints.length < 3) {
    throw new Error('Mínimo 3 fontes requeridas');
  }

  // Calcular mediana (resistente a outliers)
  const sorted = dataPoints
    .map(d => d.value)
    .sort((a, b) => a.comparedTo(b));

  const median = sorted[Math.floor(sorted.length / 2)];

  // Verificar concordância (threshold 10%)
  const agreeing = dataPoints.filter(d => {
    const diff = d.value.minus(median).abs();
    const percentDiff = diff.div(median).times(100);
    return percentDiff.lessThan(10);
  });

  if (agreeing.length < 3) {
    // Menos de 3 fontes concordam
    logger.warn('Cross-validation failed', {
      dataPoints,
      median,
      agreeing: agreeing.length,
    });
    return null;
  }

  return median;
}
```

**Score de Confiança:**

| Fontes Concordando | Score | Ação |
|-------------------|-------|------|
| 5+ | 100% | Usar dado |
| 3-4 | 80% | Usar com aviso |
| 2 | 40% | Não usar, alertar |
| 0-1 | 0% | Rejeitar |

### 3. Timezone: America/Sao_Paulo (Sempre)

**Regra:** TODAS as datas relacionadas a mercado B3 DEVEM usar `America/Sao_Paulo`.

**Por quê?**

- B3 opera em horário de Brasília
- Pregões são 10h-17h BRT
- Dividendos têm datas-base em BRT
- Corporate actions são anunciados em BRT

**Implementação:**

```typescript
import { DateTime } from 'luxon';

// ❌ ERRADO: Usar timezone local ou UTC
const date = new Date(); // Timezone da máquina
const dateUTC = new Date().toISOString(); // UTC

// ✅ CORRETO: Forçar America/Sao_Paulo
const dateBRT = DateTime.now().setZone('America/Sao_Paulo');

// Para armazenar no DB
const dateForDB = dateBRT.toISO(); // ISO string com timezone

// Para exibir
const dateDisplay = dateBRT.toFormat('dd/MM/yyyy HH:mm'); // 21/12/2025 10:30
```

**Validação em Entity:**

```typescript
import { Entity, Column, BeforeInsert } from 'typeorm';
import { DateTime } from 'luxon';

@Entity()
export class AssetPrice {
  @Column({ type: 'timestamptz' }) // PostgreSQL timezone-aware
  tradingDate: Date;

  @BeforeInsert()
  validateTimezone() {
    const dt = DateTime.fromJSDate(this.tradingDate);
    if (dt.zoneName !== 'America/Sao_Paulo') {
      throw new Error('Trading date must be in America/Sao_Paulo timezone');
    }
  }
}
```

### 4. NUNCA Arredondar ou Manipular Dados

**Regra:** Dados financeiros são **imutáveis** após scraping.

**Proibido:**

- ❌ Arredondar para "parecer melhor"
- ❌ Ajustar outliers sem documentar
- ❌ Interpolar valores faltantes
- ❌ Modificar dados históricos
- ❌ "Corrigir" dados que parecem errados

**Exemplo:**

```typescript
// ❌ ERRADO
const price = new Decimal('123.456789');
const rounded = price.toDecimalPlaces(2); // 123.46 (perda de precisão)

// ✅ CORRETO: Armazenar precisão completa
const price = new Decimal('123.456789');
await repository.save({ price }); // Salvar como está

// Para exibição, arredondar apenas na UI
const displayPrice = price.toFixed(2); // "123.46" (string)
```

**Exceção:** Cálculos derivados (ex: médias) podem ser arredondados, mas origem DEVE ser preservada.

### 5. NUNCA Usar Dados Mock em Produção

**Regra:** Mock data APENAS em ambientes de teste.

**Implementação:**

```typescript
// backend/src/config/data.config.ts
export class DataConfig {
  static get useMockData(): boolean {
    const env = process.env.NODE_ENV;
    if (env === 'production' && process.env.USE_MOCK_DATA === 'true') {
      throw new Error('CRITICAL: Mock data enabled in production');
    }
    return env !== 'production' && process.env.USE_MOCK_DATA === 'true';
  }
}

// Uso
if (DataConfig.useMockData) {
  return this.mockDataService.getAssetPrices(ticker);
}
return this.realDataService.getAssetPrices(ticker);
```

**Validação no Startup:**

```typescript
// backend/src/main.ts
async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    const dangerousVars = ['USE_MOCK_DATA', 'SKIP_VALIDATION', 'BYPASS_AUTH'];
    for (const varName of dangerousVars) {
      if (process.env[varName] === 'true') {
        throw new Error(`CRITICAL: ${varName} enabled in production`);
      }
    }
  }
}
```

---

## Tipos de Dados Financeiros

### Preços (Prices)

```typescript
interface AssetPrice {
  ticker: string;
  date: Date; // America/Sao_Paulo
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: number; // Integer, não Decimal
  adjustedClose: Decimal; // Ajustado por splits
}
```

**Validações:**

- `high >= low`
- `high >= open && high >= close`
- `low <= open && low <= close`
- `volume >= 0`

### Dividendos (Dividends)

```typescript
interface Dividend {
  ticker: string;
  exDate: Date; // Data COM (America/Sao_Paulo)
  paymentDate: Date; // Data de pagamento
  amount: Decimal; // Valor bruto por ação
  type: 'JCP' | 'Dividendo' | 'Rendimento'; // FIIs têm "Rendimento"
  currency: 'BRL'; // B3 é sempre BRL
}
```

**Regras:**

- `amount > 0`
- `paymentDate >= exDate`
- Dividendos são brutos (antes de impostos)

### Fundamentals (Fundamentos)

```typescript
interface Fundamentals {
  ticker: string;
  quarter: string; // "2025-Q1"
  revenue: Decimal | null; // Pode ser null se não disponível
  netIncome: Decimal | null;
  ebitda: Decimal | null;
  pe: Decimal | null; // P/L (Price/Earnings)
  roe: Decimal | null; // ROE em decimal (0.15 = 15%)
  debtToEquity: Decimal | null;
}
```

**Regras:**

- Permitir `null` para valores indisponíveis
- NUNCA usar 0 para representar "não disponível"
- Ratios devem ser decimais (não percentuais)

---

## Operações Financeiras

### Cálculo de Dividend Yield

```typescript
function calculateDividendYield(
  dividends: Dividend[],
  currentPrice: Decimal,
): Decimal {
  // Soma dividendos dos últimos 12 meses
  const oneYearAgo = DateTime.now()
    .setZone('America/Sao_Paulo')
    .minus({ years: 1 });

  const totalDividends = dividends
    .filter(d => DateTime.fromJSDate(d.exDate) >= oneYearAgo)
    .reduce(
      (sum, d) => sum.plus(d.amount),
      new Decimal(0),
    );

  // Dividend Yield = (Dividendos Anuais / Preço Atual) * 100
  return totalDividends.div(currentPrice).times(100);
}
```

### Ajuste por Split

```typescript
function adjustForSplit(
  price: Decimal,
  splitRatio: string, // Ex: "1:2" (1 ação vira 2)
): Decimal {
  const [from, to] = splitRatio.split(':').map(Number);
  return price.times(from).div(to);
}

// Exemplo: Split 1:2
const priceBeforeSplit = new Decimal('100.00');
const priceAfterSplit = adjustForSplit(priceBeforeSplit, '1:2');
// Resultado: 50.00 (cada ação vale metade)
```

### Cálculo de Retorno (Return)

```typescript
function calculateReturn(
  initialPrice: Decimal,
  finalPrice: Decimal,
  dividends: Decimal = new Decimal(0),
): Decimal {
  // Retorno = ((Preço Final + Dividendos) / Preço Inicial - 1) * 100
  const total = finalPrice.plus(dividends);
  return total.div(initialPrice).minus(1).times(100);
}

// Exemplo
const ret = calculateReturn(
  new Decimal('100.00'), // Compra
  new Decimal('110.00'), // Venda
  new Decimal('5.00'),   // Dividendos recebidos
);
// Resultado: 15% de retorno
```

---

## Validação de Dados

### Schema Validation (TypeORM)

```typescript
import { Entity, Column, Check } from 'typeorm';
import { Decimal } from 'decimal.js';

@Entity()
@Check(`"high" >= "low"`)
@Check(`"high" >= "open" AND "high" >= "close"`)
@Check(`"low" <= "open" AND "low" <= "close"`)
@Check(`"volume" >= 0`)
export class AssetPrice {
  @Column({ type: 'decimal', precision: 18, scale: 8 })
  open: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  high: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  low: Decimal;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  close: Decimal;

  @Column({ type: 'bigint' })
  volume: number;
}
```

### Outlier Detection

```typescript
function detectOutlier(
  value: Decimal,
  historicalValues: Decimal[],
  threshold: number = 0.5, // 50% de variação
): boolean {
  if (historicalValues.length === 0) return false;

  // Calcular média móvel dos últimos 20 dias
  const recent = historicalValues.slice(-20);
  const avg = recent
    .reduce((sum, v) => sum.plus(v), new Decimal(0))
    .div(recent.length);

  // Verificar se valor está >50% diferente da média
  const diff = value.minus(avg).abs();
  const percentDiff = diff.div(avg);

  return percentDiff.greaterThan(threshold);
}

// Uso
const isOutlier = detectOutlier(currentPrice, historicalPrices);
if (isOutlier) {
  logger.warn('Outlier detected', {
    ticker,
    currentPrice,
    historicalAvg,
  });
  // NÃO rejeitar automaticamente, apenas alertar para análise manual
}
```

---

## Anti-Patterns (NUNCA FAZER)

### 1. Comparar Decimals com ===

```typescript
// ❌ ERRADO
const a = new Decimal('0.1');
const b = new Decimal('0.10');
if (a === b) { } // false! (objetos diferentes)

// ✅ CORRETO
if (a.equals(b)) { } // true
```

### 2. Converter Decimal para Number

```typescript
// ❌ ERRADO
const price = new Decimal('123.456789');
const priceNum = price.toNumber(); // Perde precisão

// ✅ CORRETO
const priceStr = price.toString(); // Mantém precisão
```

### 3. Usar Math.* com Decimals

```typescript
// ❌ ERRADO
const price = new Decimal('100.50');
const rounded = Math.round(price.toNumber()); // Converte para number (errado)

// ✅ CORRETO
const rounded = price.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
```

### 4. Interpolação de Dados Faltantes

```typescript
// ❌ ERRADO
const prices = [100, null, null, 104];
const interpolated = prices.map((p, i) => {
  if (p === null) {
    // Interpolar linearmente
    return (prices[i-1] + prices[i+1]) / 2;
  }
  return p;
});

// ✅ CORRETO
const prices = [100, null, null, 104];
// Manter nulls, NUNCA inventar dados
```

---

## Referências Críticas

- **`.gemini/context/financial-rules.md`** - Regras completas e detalhadas
- **[Financial Precision in JavaScript](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)** - Best practices
- **[Decimal.js Documentation](https://mikemcl.github.io/decimal.js/)** - API completa
- **[PostgreSQL NUMERIC Type](https://www.postgresql.org/docs/current/datatype-numeric.html)** - Storage otimizado

---

## Checklist de Compliance

Antes de fazer commit de código que manipula dados financeiros:

- [ ] Todos valores monetários usam `Decimal.js`
- [ ] Cross-validation de mínimo 3 fontes
- [ ] Timezone é `America/Sao_Paulo` para datas B3
- [ ] Dados não são arredondados/manipulados
- [ ] Mock data desabilitado em produção
- [ ] Validações de schema (OHLC, volume >= 0)
- [ ] Outlier detection implementado
- [ ] Logs estruturados para auditoria
- [ ] Testes cobrindo edge cases (splits, dividendos)

---

## Contato de Emergência

Se houver QUALQUER dúvida sobre manipulação de dados financeiros:

1. ❌ NÃO fazer "best guess"
2. ❌ NÃO implementar "quick fix"
3. ✅ Consultar `.gemini/context/financial-rules.md`
4. ✅ Criar issue no KNOWN-ISSUES.md
5. ✅ Marcar como bloqueante até esclarecer
