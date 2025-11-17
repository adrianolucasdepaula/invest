# 🔍 VALIDAÇÃO ULTRA-ROBUSTA: Timeframes & Ranges vs Investing.com

**Projeto:** B3 AI Analysis Platform
**Data:** 2025-11-17
**Ticker:** ABEV3 (Ambev S.A.)
**Referência:** https://br.investing.com/charts/stocks-charts
**Status:** 🚧 EM EXECUÇÃO

---

## 🎯 OBJETIVO

Validar **100% de precisão** de TODOS os timeframes (1D, 1W, 1M) combinados com TODOS os períodos (1mo, 3mo, 6mo, 1y, 2y, 5y, max) comparando nossa API com investing.com como fonte de referência.

**Critério de Aprovação:**
- ✅ Divergência < 1% em OHLCV values
- ✅ Quantidade de candles correta (±2 candles tolerância)
- ✅ Datas alinhadas (mesmo período)
- ✅ Performance < 100ms por request

---

## 📊 MATRIZ DE VALIDAÇÃO (21 Combinações)

| # | Timeframe | Range | Candles Esperados | Status | Divergência | Performance |
|---|-----------|-------|-------------------|--------|-------------|-------------|
| 1 | 1D | 1mo | ~21 | ⏳ PENDING | - | - |
| 2 | 1D | 3mo | ~63 | ⏳ PENDING | - | - |
| 3 | 1D | 6mo | ~126 | ⏳ PENDING | - | - |
| 4 | 1D | 1y | ~252 | ⏳ PENDING | - | - |
| 5 | 1D | 2y | ~504 | ⏳ PENDING | - | - |
| 6 | 1D | 5y | ~1260 | ⏳ PENDING | - | - |
| 7 | 1D | max | ~1200+ | ⏳ PENDING | - | - |
| 8 | 1W | 1mo | ~4 | ⏳ PENDING | - | - |
| 9 | 1W | 3mo | ~13 | ⏳ PENDING | - | - |
| 10 | 1W | 6mo | ~26 | ⏳ PENDING | - | - |
| 11 | 1W | 1y | ~52 | ⏳ PENDING | - | - |
| 12 | 1W | 2y | ~104 | ⏳ PENDING | - | - |
| 13 | 1W | 5y | ~260 | ⏳ PENDING | - | - |
| 14 | 1W | max | ~260+ | ⏳ PENDING | - | - |
| 15 | 1M | 1mo | ~1 | ⏳ PENDING | - | - |
| 16 | 1M | 3mo | ~3 | ⏳ PENDING | - | - |
| 17 | 1M | 6mo | ~6 | ⏳ PENDING | - | - |
| 18 | 1M | 1y | ~12 | ⏳ PENDING | - | - |
| 19 | 1M | 2y | ~24 | ⏳ PENDING | - | - |
| 20 | 1M | 5y | ~60 | ⏳ PENDING | - | - |
| 21 | 1M | max | ~60+ | ⏳ PENDING | - | - |

---

## 📋 METODOLOGIA DE VALIDAÇÃO

### 1. Setup Inicial

**Endpoints:**
- Nossa API: `http://localhost:3101/api/v1/market-data/ABEV3/prices?timeframe={TF}&range={RANGE}`
- Investing.com: `https://br.investing.com/equities/ambev-sa-historical-data`

**Tools:**
- Playwright MCP (navegação + screenshots)
- Chrome DevTools MCP (network + payload validation)
- Selenium MCP com VNC (se precisar interação complexa)

### 2. Processo de Validação (Por Combinação)

**Step 1: Buscar dados da nossa API**
```bash
curl "http://localhost:3101/api/v1/market-data/ABEV3/prices?timeframe=1D&range=1mo"
```

**Step 2: Navegar investing.com via Playwright**
```typescript
// 1. Navegar para ABEV3
await mcp__playwright__browser_navigate({
  url: "https://br.investing.com/equities/ambev-sa-historical-data"
});

// 2. Selecionar timeframe (Diário/Semanal/Mensal)
await mcp__playwright__browser_click({
  element: "Timeframe selector",
  ref: "..."
});

// 3. Selecionar período (1 mês, 3 meses, etc)
await mcp__playwright__browser_click({
  element: "Date range selector",
  ref: "..."
});

// 4. Capturar screenshot
await mcp__playwright__browser_take_screenshot({
  filename: "investing_ABEV3_1D_1mo.png"
});

// 5. Extrair dados (scraping)
await mcp__playwright__browser_evaluate({
  function: `() => {
    const rows = document.querySelectorAll('table tbody tr');
    return Array.from(rows).map(row => ({
      date: row.cells[0].textContent,
      close: parseFloat(row.cells[1].textContent.replace(',', '.')),
      open: parseFloat(row.cells[2].textContent.replace(',', '.')),
      high: parseFloat(row.cells[3].textContent.replace(',', '.')),
      low: parseFloat(row.cells[4].textContent.replace(',', '.')),
      volume: parseInt(row.cells[5].textContent.replace(/\D/g, ''))
    }));
  }`
});
```

**Step 3: Comparar dados (Amostra de 5 candles)**
- Selecionar 5 candles aleatórios
- Comparar OHLCV values
- Calcular divergência percentual: `Math.abs((nossa - investing) / investing) * 100`
- Tolerância: < 1%

**Step 4: Validar quantidade de candles**
- Contar candles: Nossa API vs Investing.com
- Tolerância: ±2 candles (diferença aceitável devido a feriados/pregões)

**Step 5: Documentar resultado**
- Atualizar tabela acima
- Salvar screenshots
- Registrar divergências (se houver)

---

## 🔍 VALIDAÇÃO DETALHADA

### VALIDAÇÃO 1: 1D + 1mo (ABEV3)

**Início:** 2025-11-17 10:00:00
**Status:** ⏳ EXECUTANDO...

#### 1.1 Nossa API

**Request:**
```bash
curl "http://localhost:3101/api/v1/market-data/ABEV3/prices?timeframe=1D&range=1mo"
```

**Response:** (será preenchido)
```json
{
  "ticker": "ABEV3",
  "timeframe": "1D",
  "range": "1mo",
  "data": [
    // ... candles
  ]
}
```

**Quantidade:** X candles
**Período:** YYYY-MM-DD a YYYY-MM-DD

#### 1.2 Investing.com

**URL:** https://br.investing.com/equities/ambev-sa-historical-data
**Timeframe:** Diário
**Período:** Últimos 30 dias

**Dados Extraídos:** (será preenchido via Playwright)

**Quantidade:** Y candles
**Período:** YYYY-MM-DD a YYYY-MM-DD

#### 1.3 Comparação (Amostra 5 Candles)

| Data | Campo | Nossa API | Investing.com | Divergência | Status |
|------|-------|-----------|---------------|-------------|--------|
| 2025-11-15 | Open | - | - | - | ⏳ |
| 2025-11-15 | High | - | - | - | ⏳ |
| 2025-11-15 | Low | - | - | - | ⏳ |
| 2025-11-15 | Close | - | - | - | ⏳ |
| 2025-11-15 | Volume | - | - | - | ⏳ |

**Divergência Média:** - %
**Resultado:** ⏳ PENDING

---

### VALIDAÇÃO 2: 1D + 3mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 3: 1D + 6mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 4: 1D + 1y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 5: 1D + 2y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 6: 1D + 5y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 7: 1D + max (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 8: 1W + 1mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 9: 1W + 3mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 10: 1W + 6mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 11: 1W + 1y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 12: 1W + 2y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 13: 1W + 5y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 14: 1W + max (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 15: 1M + 1mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 16: 1M + 3mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 17: 1M + 6mo (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 18: 1M + 1y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 19: 1M + 2y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 20: 1M + 5y (ABEV3)

**Status:** ⏳ PENDING

---

### VALIDAÇÃO 21: 1M + max (ABEV3)

**Status:** ⏳ PENDING

---

## 🎯 EDGE CASES

### EC1: Dados Insuficientes (1M + 1mo)
**Cenário:** Timeframe mensal com range de 1 mês = apenas 1 candle
**Validação:** Sistema deve retornar 1 candle válido (não erro)
**Status:** ⏳ PENDING

### EC2: Range MAX (Limite de Dados)
**Cenário:** Range 'max' deve retornar TODOS os dados disponíveis COTAHIST (1986+)
**Validação:** Verificar data mais antiga vs investing.com
**Status:** ⏳ PENDING

### EC3: Performance com Muitos Candles (1D + max)
**Cenário:** ~1200+ candles podem degradar performance
**Validação:** Response time < 500ms
**Status:** ⏳ PENDING

### EC4: Agregação Correta (1W vs 1D)
**Cenário:** Candle semanal deve agregar corretamente 5 candles diários
**Validação:** Comparar semana específica (ex: 20-24 Out 2025)
**Status:** ⏳ PENDING

### EC5: Feriados e Pregões (Gaps)
**Cenário:** Dias sem pregão (feriados) não devem ter candles
**Validação:** Verificar continuidade de datas
**Status:** ⏳ PENDING

---

## 📊 PERFORMANCE BENCHMARK

| Timeframe | Range | Candles | Tempo Esperado | Tempo Real | Status |
|-----------|-------|---------|----------------|------------|--------|
| 1D | 1mo | ~21 | < 50ms | - | ⏳ |
| 1D | 3mo | ~63 | < 80ms | - | ⏳ |
| 1D | 6mo | ~126 | < 100ms | - | ⏳ |
| 1D | 1y | ~252 | < 150ms | - | ⏳ |
| 1D | 2y | ~504 | < 200ms | - | ⏳ |
| 1D | 5y | ~1260 | < 300ms | - | ⏳ |
| 1D | max | ~1200+ | < 500ms | - | ⏳ |
| 1W | 1y | ~52 | < 80ms | - | ⏳ |
| 1W | 5y | ~260 | < 150ms | - | ⏳ |
| 1M | 1y | ~12 | < 50ms | - | ⏳ |
| 1M | 5y | ~60 | < 80ms | - | ⏳ |

---

## 📸 SCREENSHOTS

### Nossa Aplicação
- `VALIDACAO_ABEV3_1D_1mo_NOSSA_APP.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_1D_1y_NOSSA_APP.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_1W_1y_NOSSA_APP.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_1M_1y_NOSSA_APP.png` - ⏳ PENDING

### Investing.com (Referência)
- `VALIDACAO_ABEV3_1D_1mo_INVESTING.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_1D_1y_INVESTING.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_1W_1y_INVESTING.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_1M_1y_INVESTING.png` - ⏳ PENDING

### Comparativos (Side-by-Side)
- `VALIDACAO_ABEV3_COMPARATIVO_1D.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_COMPARATIVO_1W.png` - ⏳ PENDING
- `VALIDACAO_ABEV3_COMPARATIVO_1M.png` - ⏳ PENDING

---

## ✅ CRITÉRIOS DE APROVAÇÃO

**Para cada combinação (21 total):**
- [ ] Quantidade de candles: ±2 de diferença máxima
- [ ] Divergência OHLCV: < 1% média
- [ ] Período alinhado: Mesmas datas início/fim
- [ ] Performance: < 100ms (ou conforme benchmark)
- [ ] Console: 0 erros JavaScript
- [ ] Network: 200 OK

**Aprovação Geral:**
- [ ] 21/21 combinações aprovadas
- [ ] 5/5 edge cases validados
- [ ] Performance benchmark atingido
- [ ] Screenshots capturados (12 mínimo)
- [ ] Documentação completa

---

## 🚀 RESULTADO FINAL

**Status:** ⏳ EM EXECUÇÃO
**Aprovadas:** 0/21
**Reprovadas:** 0/21
**Divergência Média:** - %
**Performance Média:** - ms

**Conclusão:** (será preenchida após validação completa)

---

**FIM DA VALIDAÇÃO**
