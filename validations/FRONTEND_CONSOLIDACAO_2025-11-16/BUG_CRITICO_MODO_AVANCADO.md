# BUG CRÍTICO - Modo Avançado VALE3 (MultiPaneChart)

**Data:** 2025-11-16
**Severidade:** CRÍTICA 🚨
**Status:** BLOQUEADOR (Modo Avançado completamente inoperante)

---

## 📊 Resumo Executivo

A página `/assets/VALE3` possui **1 BUG CRÍTICO** no Modo Avançado:

**BUG ÚNICO:** Modo Avançado exibe erro fatal ao tentar renderizar gráficos técnicos. Root cause: **incompatibilidade de formato de dados** entre backend e frontend.

**Comportamento Atual (Correto):**
- ✅ **Modo Básico:** Exibe mensagem "Habilite o Modo Avançado..." (comportamento esperado)
- ❌ **Modo Avançado:** Modal de erro vermelho (rsiValues.map is not a function)

**Impacto:**
- ❌ Modo Avançado 100% quebrado
- ❌ MultiPaneChart não renderiza
- ❌ RSI Chart não funciona
- ❌ MACD Chart não funciona
- ❌ Stochastic Chart não funciona

---

## 🐛 Erro Detectado

**Error Modal (Next.js):**
```
Unhandled Runtime Error
TypeError: rsiValues.map is not a function
```

**Localização:**
- `src/components/charts/rsi-chart.tsx:69:45`
- `src/components/charts/macd-chart.tsx` (erro similar)

**Stack Trace:**
```typescript
// rsi-chart.tsx linha 69
const rsiData: LineData[] = rsiValues.map((value, index) => ({
  time: sortedData[index].date as Time,
  value,
})).filter((d) => d.value !== null && !isNaN(d.value));
```

---

## 🔍 Root Cause Analysis

### Backend Response (ATUAL - ERRADO)

**Endpoint:** `POST /api/v1/market-data/VALE3/technical?timeframe=1Y`

```json
{
  "ticker": "VALE3",
  "prices": [ /* 251 OHLCV data points */ ],
  "indicators": {
    "sma_20": 64.228,                    // ← Número único ❌
    "sma_50": 60.822,                    // ← Número único ❌
    "sma_200": 56.118,                   // ← Número único ❌
    "ema_9": 65.094,                     // ← Número único ❌
    "ema_21": 63.962,                    // ← Número único ❌
    "rsi": 65.999868175583,              // ← Número único ❌
    "macd": {
      "macd": 1.406,                     // ← Número único ❌
      "signal": 1.555,                   // ← Número único ❌
      "histogram": -0.148                // ← Número único ❌
    },
    "stochastic": {
      "k": 69.205,                       // ← Número único ❌
      "d": 74.841                        // ← Número único ❌
    },
    "bollinger_bands": {
      "upper": 67.207,                   // ← Número único ❌
      "middle": 64.228,                  // ← Número único ❌
      "lower": 61.248,                   // ← Número único ❌
      "bandwidth": 9.278                 // ← Número único ❌
    }
  }
}
```

### Frontend Expectation (CORRETO)

```typescript
// MultiPaneChart espera:
interface TechnicalData {
  prices: OHLCVData[];  // ✅ Array OK
  indicators: {
    sma20?: number[];       // ← ARRAY de valores históricos ✅
    sma50?: number[];       // ← ARRAY de valores históricos ✅
    sma200?: number[];      // ← ARRAY de valores históricos ✅
    ema9?: number[];        // ← ARRAY de valores históricos ✅
    ema21?: number[];       // ← ARRAY de valores históricos ✅
    rsi?: number[];         // ← ARRAY de valores históricos ✅
    macd?: {
      macd: number[];       // ← ARRAY de valores históricos ✅
      signal: number[];     // ← ARRAY de valores históricos ✅
      histogram: number[];  // ← ARRAY de valores históricos ✅
    };
    stochastic?: {
      k: number[];          // ← ARRAY de valores históricos ✅
      d: number[];          // ← ARRAY de valores históricos ✅
    };
    bollingerBands?: {
      upper: number[];      // ← ARRAY de valores históricos ✅
      middle: number[];     // ← ARRAY de valores históricos ✅
      lower: number[];      // ← ARRAY de valores históricos ✅
    };
  };
}
```

---

## 📸 Screenshots

**1. Error Modal:**
`4_playwright_vale3_error_modal.png` - Modal vermelho com stack trace

**2. Console Errors (20+ repetições):**
```
TypeError: rsiValues.map is not a function
TypeError: macdValues.histogram.map is not a function
```

---

## 🔧 Solução Necessária

### Backend Fix (CRÍTICO)

**Arquivo:** `backend/src/api/market-data/market-data.service.ts` (ou Python Service)

**Mudança Necessária:**

```typescript
// ANTES (ERRADO):
return {
  ticker,
  prices: ohlcvData,
  indicators: {
    rsi: 65.999,  // ← Último valor apenas
    macd: {
      histogram: -0.148  // ← Último valor apenas
    }
  }
};

// DEPOIS (CORRETO):
return {
  ticker,
  prices: ohlcvData,  // Array de 251 elementos
  indicators: {
    rsi: [50.2, 51.3, ..., 65.999],  // ← Array de 251 elementos
    macd: {
      macd: [1.2, 1.3, ..., 1.406],
      signal: [1.4, 1.5, ..., 1.555],
      histogram: [-0.5, -0.3, ..., -0.148]  // ← Array de 251 elementos
    },
    sma20: [58.5, 59.2, ..., 64.228],  // ← Array completo
    // ... todos os outros indicadores
  }
};
```

**Observação:** Cada array deve ter o **mesmo comprimento** que `prices` (251 elementos no caso de 1Y).

---

## 🧪 Validação MCP Triplo

**Método:** Playwright + Chrome DevTools + a11y

**Resultados:**
- ✅ **Modo Básico:** Funciona perfeitamente (0 erros)
- ❌ **Modo Avançado:** Crash imediato ao clicar "Ativar Modo Avançado"

**Console Logs:**
```
[LOG] Technical data metadata: {data_points: 251, cached: true, duration: 4}
[ERROR] TypeError: rsiValues.map is not a function (×20 repetições)
[ERROR] The above error occurred in the <NotFoundErrorBoundary> component
```

**Network Requests:**
- Request: `POST /api/v1/market-data/VALE3/technical?timeframe=1Y`
- Response: 200 OK (23.5 KB)
- Cache: Hit (duration: 4ms)
- Problema: Resposta com formato errado

---

## 📋 Arquivos Afetados

### Frontend (3 arquivos - leitura dos dados)
1. `src/components/charts/rsi-chart.tsx:69` - `.map()` em `rsiValues`
2. `src/components/charts/macd-chart.tsx` - `.map()` em `macd.histogram`
3. `src/components/charts/stochastic-chart.tsx` - `.map()` em `stochastic.k/d`

### Backend (2 arquivos - geração dos dados)
1. `backend/src/api/market-data/market-data.service.ts` - Controller que chama Python Service
2. **Python Service** (provável culpado) - Calcula indicadores e retorna apenas último valor

---

## 🎯 Próximos Passos

### Opção 1: Fix Imediato (Recomendado)
1. Identificar onde Python Service calcula indicadores
2. Modificar para retornar array completo ao invés de último valor
3. Validar TypeScript (0 erros)
4. Testar Modo Avançado em VALE3
5. Testar generalização em PETR4
6. Commit fix

### Opção 2: Documentar e Fix Depois
1. Finalizar validação MCP Triplo com bug report
2. Criar issue no GitHub
3. Marcar como blocker para FASE 31
4. Priorizar fix na próxima sessão

---

## 📊 Impacto Estimado

**Tempo para Fix:** 30-60 minutos
**Complexidade:** Média (mudança em Python Service + validação)
**Risco:** Baixo (apenas retornar mais dados, sem quebrar lógica)

**Benefícios do Fix:**
- ✅ Modo Avançado 100% funcional
- ✅ Gráficos multi-pane sincronizados
- ✅ RSI, MACD, Stochastic renderizando
- ✅ Feature FASE 29 completamente operacional

---

## 🏷️ Tags

`#bug-critico` `#modo-avancado` `#multipane-chart` `#backend-integration` `#fase-29` `#blocker`

---

**Validado por:** Claude Code (Sonnet 4.5) - MCP Triplo (Playwright + Chrome DevTools + a11y)
**Co-Authored-By:** Claude <noreply@anthropic.com>
