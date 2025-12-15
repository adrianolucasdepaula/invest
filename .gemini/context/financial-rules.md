# Regras de Dados Financeiros - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-12-15
**Versão:** 1.12.3
**Criticidade:** 🔥 **CRÍTICO** - Não-negociável

---

## ⚠️ AVISO CRÍTICO

**Dados financeiros NÃO podem ter:**

- ❌ Imprecisão
- ❌ Arredondamento incorreto
- ❌ Inconsistências entre fontes
- ❌ Manipulação de valores
- ❌ Perda de precisão

**Violação destas regras pode causar:**

- 💰 Perdas financeiras reais para usuários
- ⚖️ Problemas legais/regulatórios
- 🏢 Perda de confiança na plataforma
- 📉 Decisões de investimento incorretas

---

## 📑 ÍNDICE

1. [Tipos de Dados](#tipos-de-dados)
   2 [Precisão](#precisão)
2. [Arredondamento](#arredondamento)
3. [Timezone](#timezone)
4. [Cross-Validation](#cross-validation)
5. [Outlier Detection](#outlier-detection)
6. [Re-Validação](#re-validação)
7. [Corporate Actions](#corporate-actions)

---

## 🔷 1. TIPOS DE DADOS

### Regra Fundamental: NUNCA usar Float para valores monetários

```typescript
// ❌ ERRADO - Float tem imprecisão
price: number = 123.45;
percentage: number = 5.6789;

// ✅ CORRETO - Usar Decimal
import { Decimal } from "decimal.js";

price: Decimal = new Decimal("123.45");
percentage: Decimal = new Decimal("5.6789");
```

### Biblioteca Recomendada

```bash
# Instalar decimal.js (backend)
npm install decimal.js

# Instalar types
npm install --save-dev @types/decimal.js
```

### Declaração em Entities (TypeORM)

```typescript
import { Column } from "typeorm";

@Entity("asset_prices")
export class AssetPrice {
  // ✅ CORRETO
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number; // TypeORM retorna como string, converter para Decimal

  @Column({ type: "decimal", precision: 10, scale: 4 })
  changePercent: number;

  // ❌ ERRADO
  @Column({ type: "float" }) // ❌ Não usar float
  price: number;
}
```

### Conversão Segura

```typescript
import { Decimal } from "decimal.js";

// ✅ String para Decimal (SEMPRE preferir)
const price = new Decimal("123.45");

// ⚠️ Number para Decimal (usar só se necessário)
const price = new Decimal(123.45);

// ✅ Decimal para String (exibição)
const priceStr = price.toFixed(2); // "123.45"

// ✅ Decimal para Number (cálculos seguros)
const priceNum = price.toNumber();
```

---

## 🔢 2. PRECISÃO

### Tabela de Precisão Obrigatória

| Tipo de Dado            | Casas Decimais | Exemplo   | Tipo DB         |
| ----------------------- | -------------- | --------- | --------------- |
| **BRL (Reais)**         | 2              | R$ 123.45 | `DECIMAL(10,2)` |
| **USD (Dólares)**       | 2              | $ 123.45  | `DECIMAL(10,2)` |
| **Percentuais**         | 4              | 5.6789%   | `DECIMAL(10,4)` |
| **Quantidades (Ações)** | 0 (integer)    | 100 ações | `INTEGER`       |
| **Quantidades (FII)**   | 0 (integer)    | 50 cotas  | `INTEGER`       |
| **Preço/Quota**         | 2              | R$ 98.76  | `DECIMAL(10,2)` |
| **P/L, ROE, etc**       | 2              | 12.34     | `DECIMAL(10,2)` |
| **Dividend Yield**      | 4              | 5.6789%   | `DECIMAL(10,4)` |

### Implementação

```typescript
// ✅ CORRETO
function formatPrice(price: Decimal): string {
  return `R$ ${price.toFixed(2)}`;
}

function formatPercent(percent: Decimal): string {
  return `${percent.toFixed(4)}%`;
}

// ❌ ERRADO
function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2)}`; // Float impreciso
}
```

---

## 🔄 3. ARREDONDAMENTO

### Métodos de Arredondamento

```typescript
import { Decimal } from "decimal.js";

// Configurar modo de arredondamento globalmente
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

// ✅ ROUND_HALF_UP (padrão para BRL)
// 1.5 → 2, 2.5 → 3, 1.4 → 1, 1.6 → 2
const price = new Decimal("123.456");
const rounded = price.toDecimalPlaces(2); // 123.46

// Outros modos (quando necessário)
Decimal.ROUND_DOWN; // Sempre para baixo
Decimal.ROUND_UP; // Sempre para cima
Decimal.ROUND_HALF_EVEN; // Banker's rounding
```

### NUNCA usar Math.round()

```typescript
// ❌ ERRADO
const price = 123.456;
const rounded = Math.round(price * 100) / 100; // Impreciso!

// ✅ CORRETO
const price = new Decimal("123.456");
const rounded = price.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
```

### Arredondamento em Cálculos

```typescript
// ✅ CORRETO - Arredondar apenas no final
const price1 = new Decimal("123.45");
const price2 = new Decimal("67.89");
const quantity = new Decimal("100");

// Calcular com precisão máxima
const subtotal = price1.plus(price2).times(quantity);
// 19134.000...

// Arredondar apenas para exibição
const display = subtotal.toFixed(2); // "19134.00"

// ❌ ERRADO - Arredondar intermediários
const price1 = 123.45;
const price2 = 67.89;
const sum = Math.round((price1 + price2) * 100) / 100; // Perde precisão
const total = Math.round(sum * 100 * 100) / 100; // Erro acumulado
```

---

## 🕐 4. TIMEZONE

### Regra: SEMPRE America/Sao_Paulo

```typescript
import { zonedTimeToUtc, utcToZonedTime, format } from "date-fns-tz";
import { parseISO } from "date-fns";

const BRAZIL_TZ = "America/Sao_Paulo";

// ✅ CORRETO - Converter para timezone B3
const utcDate = new Date("2024-11-24T13:00:00Z");
const brasiliaDate = utcToZonedTime(utcDate, BRAZIL_TZ);

// Formatar com timezone
const formatted = format(brasiliaDate, "yyyy-MM-dd HH:mm:ss zzz", {
  timeZone: BRAZIL_TZ,
}); // "2024-11-24 10:00:00 BRT"

// ❌ ERRADO - Usar UTC diretamente
const date = new Date(); // Timezone local (pode não ser Brasília)
```

### Horário de Pregão B3

```typescript
const TRADING_HOURS = {
  preOpen: { hour: 9, minute: 45 }, // 09:45 BRT
  open: { hour: 10, minute: 0 }, // 10:00 BRT
  close: { hour: 17, minute: 0 }, // 17:00 BRT
  afterMarket: { hour: 17, minute: 30 }, // 17:30 BRT
};

function isTradingTime(date: Date): boolean {
  const brasiliaTime = utcToZonedTime(date, BRAZIL_TZ);
  const hour = brasiliaTime.getHours();
  const minute = brasiliaTime.getMinutes();

  // Entre 10:00 e 17:00 (horário de pregão)
  if (hour < 10 || hour > 17) return false;
  if (hour === 17 && minute > 0) return false;

  return true;
}
```

### Feriados B3

```typescript
// Manter lista de feriados B3
const B3_HOLIDAYS_2024 = [
  "2024-01-01", // Ano Novo
  "2024-02-12", // Carnaval (não oficial, mas sem pregão)
  "2024-02-13", // Carnaval
  "2024-03-29", // Sexta-feira Santa
  "2024-04-21", // Tiradentes
  "2024-05-01", // Dia do Trabalho
  "2024-05-30", // Corpus Christi
  "2024-09-07", // Independência
  "2024-10-12", // Nossa Senhora Aparecida
  "2024-11-02", // Finados
  "2024-11-15", // Proclamação da República
  "2024-11-20", // Consciência Negra
  "2024-12-24", // Véspera de Natal (meio período)
  "2024-12-25", // Natal
  "2024-12-31", // Véspera de Ano Novo (meio período)
];

function isTradingDay(date: Date): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

  // Fins de semana
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Feriados
  if (B3_HOLIDAYS_2024.includes(dateStr)) return false;

  return true;
}
```

---

## ✅ 5. CROSS-VALIDATION

### Regra: Mínimo 3 Fontes Concordando

```typescript
interface DataSource {
  source: string;
  value: Decimal;
  timestamp: Date;
}

function crossValidate(
  sources: DataSource[],
  field: string
): { value: Decimal; confidence: number } {
  // Filtrar valores null/undefined
  const validSources = sources.filter((s) => s.value !== null);

  if (validSources.length < 3) {
    throw new Error(
      `Insufficient sources for ${field}: ${validSources.length}/3 minimum`
    );
  }

  // Calcular média
  const sum = validSources.reduce(
    (acc, s) => acc.plus(s.value),
    new Decimal(0)
  );
  const mean = sum.dividedBy(validSources.length);

  // Outlier detection (threshold 10%)
  const threshold = 0.1;
  const inliers = validSources.filter((s) => {
    const diff = s.value.minus(mean).abs();
    const percentDiff = diff.dividedBy(mean);
    return percentDiff.lessThanOrEqualTo(threshold);
  });

  if (inliers.length < 3) {
    throw new Error(
      `Too many outliers for ${field}: ${inliers.length}/3 minimum`
    );
  }

  // Calcular valor final (média dos inliers)
  const finalSum = inliers.reduce(
    (acc, s) => acc.plus(s.value),
    new Decimal(0)
  );
  const finalValue = finalSum.dividedBy(inliers.length);

  // Confidence score
  const confidence = inliers.length / validSources.length;

  return { value: finalValue, confidence };
}

// Uso
const plSources: DataSource[] = [
  { source: "Fundamentei", value: new Decimal("8.5"), timestamp: new Date() },
  { source: "Status Invest", value: new Decimal("8.3"), timestamp: new Date() },
  { source: "Investing.com", value: new Decimal("8.6"), timestamp: new Date() },
  { source: "Yahoo Finance", value: new Decimal("8.4"), timestamp: new Date() },
];

const { value, confidence } = crossValidate(plSources, "P/L");
// value: 8.45 (média dos 4), confidence: 1.0 (100%)
```

---

## 🎯 6. OUTLIER DETECTION

### Threshold: 10% de Desvio

```typescript
function detectOutliers(
  values: Decimal[],
  threshold: number = 0.1
): { inliers: Decimal[]; outliers: Decimal[] } {
  const mean = values
    .reduce((sum, v) => sum.plus(v), new Decimal(0))
    .dividedBy(values.length);

  const inliers: Decimal[] = [];
  const outliers: Decimal[] = [];

  values.forEach((value) => {
    const diff = value.minus(mean).abs();
    const percentDiff = diff.dividedBy(mean);

    if (percentDiff.lessThanOrEqualTo(threshold)) {
      inliers.push(value);
    } else {
      outliers.push(value);
    }
  });

  return { inliers, outliers };
}

// Exemplo
const prices = [
  new Decimal("123.45"),
  new Decimal("123.50"),
  new Decimal("123.40"),
  new Decimal("150.00"), // Outlier (> 10% da média)
];

const { inliers, outliers } = detectOutliers(prices);
// inliers: [123.45, 123.50, 123.40]
// outliers: [150.00]
```

---

## 🔄 7. RE-VALIDAÇÃO

### Quando Re-Validar

- ✅ Antes de exibir dados ao usuário
- ✅ Após 24 horas (dados fundamentalistas)
- ✅ Após 1 hora (preços em tempo real)
- ✅ Após corporate action (split, dividendo, etc)

```typescript
interface CachedData {
  value: Decimal;
  timestamp: Date;
  sources: DataSource[];
}

function needsRevalidation(
  cache: CachedData,
  type: "price" | "fundamental"
): boolean {
  const now = new Date();
  const age = now.getTime() - cache.timestamp.getTime();

  // Preços: 1 hora
  if (type === "price" && age > 60 * 60 * 1000) return true;

  // Fundamentalistas: 24 horas
  if (type === "fundamental" && age > 24 * 60 * 60 * 1000) return true;

  return false;
}
```

---

## 🏢 8. CORPORATE ACTIONS

### Tipos de Eventos

```typescript
enum CorporateActionType {
  SPLIT = "SPLIT", // Desdobramento
  REVERSE_SPLIT = "REVERSE_SPLIT", // Grupamento
  DIVIDEND = "DIVIDEND", // Dividendo
  JCP = "JCP", // Juros sobre Capital Próprio
  BONUS = "BONUS", // Bonificação
  SUBSCRIPTION = "SUBSCRIPTION", // Subscrição
  TICKER_CHANGE = "TICKER_CHANGE", // Mudança de ticker
}

interface CorporateAction {
  type: CorporateActionType;
  date: Date;
  ratio?: Decimal; // Para splits (ex: 2.0 = 1:2)
  value?: Decimal; // Para dividendos (ex: R$ 0.50)
  oldTicker?: string; // Para mudança de ticker
  newTicker?: string;
}
```

### Ajuste de Preços Históricos

```typescript
function adjustPriceForSplit(price: Decimal, splitRatio: Decimal): Decimal {
  // Split 1:2 (splitRatio = 2.0)
  // Preço antes: R$ 100.00
  // Preço após: R$ 100.00 / 2.0 = R$ 50.00
  return price.dividedBy(splitRatio);
}

function adjustHistoricalPrices(
  prices: AssetPrice[],
  corporateAction: CorporateAction
): AssetPrice[] {
  if (corporateAction.type !== CorporateActionType.SPLIT) {
    return prices;
  }

  return prices.map((p) => {
    // Ajustar apenas preços anteriores ao split
    if (p.date.getTime() < corporateAction.date.getTime()) {
      p.price = adjustPriceForSplit(
        new Decimal(p.price),
        corporateAction.ratio!
      ).toNumber();
    }
    return p;
  });
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Antes de commitar código que lida com dados financeiros:

- [ ] Usei `Decimal` instead of `number` para valores monetários?
- [ ] Precisão correta (2 casas BRL, 4 casas percentuais)?
- [ ] Arredondamento com `ROUND_HALF_UP`?
- [ ] Timezone `America/Sao_Paulo` para datas?
- [ ] Cross-validation com mínimo 3 fontes?
- [ ] Outlier detection com threshold 10%?
- [ ] Re-validação implementada?
- [ ] Corporate actions tratados?
- [ ] Testes com dados reais (não mocks)?
- [ ] Documentação das fontes de dados?

---

## 🔗 REFERÊNCIAS

- **Decimal.js Docs:** https://mikemcl.github.io/decimal.js/
- **date-fns-tz:** https://date-fns.org/docs/Time-Zones
- **B3 Horários:** https://www.b3.com.br/pt_br/solucoes/plataformas/puma-trading-system/para-participantes-e-traders/horario-de-negociacao/
- **Feriados B3:** https://www.b3.com.br/pt_br/solucoes/plataformas/puma-trading-system/para-participantes-e-traders/feriados/

---

**Última Atualização:** 2025-12-15
**Criticidade:** 🔥 CRÍTICO
**Mantenedor:** Claude Code (Opus 4.5) + Google Gemini 3 Pro
