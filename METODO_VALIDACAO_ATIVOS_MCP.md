# 📋 MÉTODO DE VALIDAÇÃO DE ATIVOS COM MCP TRIPLO

**Criado:** 2025-11-16
**Versão:** 1.1 (MCP Triplo Obrigatório)
**MCPs Utilizados:** Playwright + Chrome DevTools + Selenium
**Objetivo:** Validar sistematicamente que todos os ativos exibem gráficos técnicos corretamente

---

## 🎯 OBJETIVO

Validar que a mudança "Modo Avançado como Padrão" funciona corretamente para **pelo menos 15 ativos diferentes** da B3, identificando:
- ✅ Ativos que exibem gráficos corretamente
- ❌ Ativos que NÃO exibem gráficos (e por quê)
- 🐛 Erros de console encontrados
- 📊 Taxa de sucesso geral

**⚠️ OBRIGATÓRIO: Validação MCP Triplo**
Conforme metodologia do projeto (CLAUDE.md), TODOS os 3 MCPs devem ser usados:
1. ✅ **Chrome DevTools** - Console, snapshot, screenshots
2. ✅ **Playwright** - Navegação, wait, take screenshot
3. ✅ **Selenium** - Cross-browser validation (Firefox)

---

## 📝 MÉTODO DE VALIDAÇÃO MCP TRIPLO (SISTEMÁTICO)

### 🔵 MCP 1: Chrome DevTools (Console + Snapshot)

#### Etapa 1.1: Navegação (Chrome)
```javascript
mcp__chrome-devtools__navigate_page({
  type: "url",
  url: "http://localhost:3100/assets/[TICKER]",
  timeout: 15000
})
```

**Critério de Sucesso:**
- ✅ `Successfully navigated to http://localhost:3100/assets/[TICKER]`
- ⏱️ Navegação completa em < 15 segundos

#### Etapa 1.2: Aguardar Renderização (Chrome)
```javascript
mcp__chrome-devtools__wait_for({
  text: "Análise Técnica Avançada",
  timeout: 10000
})
```

**Critério de Sucesso:**
- ✅ `Element with text "Análise Técnica Avançada" found`

#### Etapa 1.3: Verificar Console (Chrome)
```javascript
mcp__chrome-devtools__list_console_messages({
  types: ["error", "warn"]
})
```

**Critérios:**
- ✅ **Ideal:** `<no console messages found>`
- ⚠️ **Aceitável:** Apenas warnings
- ❌ **Problema:** Erros presentes

#### Etapa 1.4: Snapshot (Chrome)
```javascript
mcp__chrome-devtools__take_snapshot()
```

#### Etapa 1.5: Screenshot (Chrome)
```javascript
mcp__chrome-devtools__take_screenshot({
  filePath: "CHROME_[TICKER].png",
  fullPage: true
})
```

---

### 🟣 MCP 2: Playwright (Cross-Check + Screenshot)

#### Etapa 2.1: Navegar (Playwright)
```javascript
mcp__playwright__browser_navigate({
  url: "http://localhost:3100/assets/[TICKER]"
})
```

#### Etapa 2.2: Aguardar Renderização (Playwright)
```javascript
mcp__playwright__browser_wait_for({
  text: "Análise Técnica Avançada",
  textGone: null,
  time: null
})
```

#### Etapa 2.3: Capturar Snapshot (Playwright)
```javascript
mcp__playwright__browser_snapshot()
```

**Verificar elementos:**
- Heading "Análise Técnica Avançada"
- Checkboxes de indicadores (SMA20, RSI, MACD)
- Links TradingView (se gráficos carregados)

#### Etapa 2.4: Verificar Console (Playwright)
```javascript
mcp__playwright__browser_console_messages({
  onlyErrors: true
})
```

#### Etapa 2.5: Screenshot (Playwright)
```javascript
mcp__playwright__browser_take_screenshot({
  filename: "PLAYWRIGHT_[TICKER].png",
  fullPage: true
})
```

---

### 🟠 MCP 3: Selenium (Firefox Validation)

#### Etapa 3.1: Iniciar Browser (Selenium - Firefox)
```javascript
mcp__selenium__start_browser({
  browser: "firefox",
  options: {
    headless: true,
    arguments: ["--width=1920", "--height=1080"]
  }
})
```

#### Etapa 3.2: Navegar (Selenium)
```javascript
mcp__selenium__navigate({
  url: "http://localhost:3100/assets/[TICKER]"
})
```

#### Etapa 3.3: Aguardar Elemento (Selenium)
```javascript
mcp__selenium__find_element({
  by: "xpath",
  value: "//h3[contains(text(), 'Análise Técnica Avançada')]",
  timeout: 10000
})
```

#### Etapa 3.4: Screenshot (Selenium)
```javascript
mcp__selenium__take_screenshot({
  outputPath: "SELENIUM_[TICKER].png"
})
```

#### Etapa 3.5: Fechar Browser (Selenium)
```javascript
mcp__selenium__close_session()
```

---

### ✅ VALIDAÇÃO CRUZADA (MCP Triplo)

Após executar os 3 MCPs, comparar resultados:

| Aspecto | Chrome DevTools | Playwright | Selenium |
|---------|----------------|------------|----------|
| **Navegação** | ✅ | ✅ | ✅ |
| **Console Errors** | 0 | 0 | N/A |
| **Gráficos Visíveis** | ✅ | ✅ | ✅ |
| **Screenshot Salvo** | ✅ | ✅ | ✅ |

**Critério de Aprovação:**
- ✅ **100% Aprovado:** Todos os 3 MCPs = Sucesso
- ⚠️ **Parcial:** 2/3 MCPs = Sucesso (investigar divergência)
- ❌ **Reprovado:** < 2/3 MCPs = Sucesso

---

### Etapa 2: Aguardar Renderização
```javascript
mcp__chrome-devtools__wait_for({
  text: "Análise Técnica Avançada",
  timeout: 10000
})
```

**Critério de Sucesso:**
- ✅ `Element with text "Análise Técnica Avançada" found`
- ✅ Página renderizada completamente

---

### Etapa 3: Verificar Console
```javascript
mcp__chrome-devtools__list_console_messages({
  types: ["error", "warn"]
})
```

**Critérios de Avaliação:**
- ✅ **Ideal:** `<no console messages found>` (0 erros, 0 warnings)
- ⚠️ **Aceitável:** Apenas warnings (não bloqueantes)
- ❌ **Problema:** Erros de console presentes

**Se erros encontrados:**
```javascript
mcp__chrome-devtools__get_console_message({ msgid: X })
```

---

### Etapa 4: Capturar Snapshot (Estrutura da Página)
```javascript
mcp__chrome-devtools__take_snapshot()
```

**Elementos a Verificar no Snapshot:**

#### A. Informações Básicas
- `uid=X: heading "[TICKER]" level="1"` → Ticker correto
- `uid=X: StaticText "[Nome do Ativo]"` → Nome correto
- `uid=X: StaticText "R$ X,XX"` → Preço carregado
- `uid=X: StaticText "+X.XX%"` → Variação carregada

#### B. Card de Indicadores
- `uid=X: heading "Indicadores Técnicos" level="3"` → Card presente
- `uid=X: checkbox "S M A20" checked` → SMA20 habilitado
- `uid=X: checkbox "S M A50" checked` → SMA50 habilitado
- `uid=X: checkbox "R S I" checked` → RSI habilitado
- `uid=X: checkbox "M A C D" checked` → MACD habilitado

#### C. Card de Gráfico
- `uid=X: heading "Análise Técnica Avançada" level="3"` → Título correto

**Verificação Crítica - Gráficos:**

**✅ CASO 1: Gráficos Carregados**
```
uid=X: link "Charting by TradingView" url="https://www.tradingview.com/..." (3x)
```
- Presença de **3 links TradingView** = 3 painéis (Candlestick, RSI, MACD)
- ✅ **SUCESSO**

**❌ CASO 2: Gráficos NÃO Carregados**
```
uid=X: StaticText "Dados insuficientes para gráfico avançado. Tente um período maior."
```
- Mensagem de fallback exibida
- ❌ **FALHA** - Investigar causa

#### D. Card de Resumo de Indicadores

**✅ CASO 1: Indicadores Carregados**
```
uid=X: StaticText "RSI (14)"
uid=X: StaticText "XX.X"  ← Valor numérico
uid=X: StaticText "MACD"
uid=X: StaticText "Compra" ou "Venda"
uid=X: StaticText "SMA 20"
uid=X: StaticText "R$ XX.XX"
```
- ✅ **SUCESSO**

**❌ CASO 2: Indicadores NÃO Carregados**
```
uid=X: StaticText "Dados insuficientes para indicadores técnicos"
```
- ❌ **FALHA**

---

### Etapa 5: Screenshot (Evidência Visual)
```javascript
mcp__chrome-devtools__take_screenshot({
  filePath: "VALIDACAO_[TICKER]_[DATA].png",
  fullPage: true
})
```

**Critério de Sucesso:**
- ✅ Screenshot salvo com sucesso
- ✅ Arquivo PNG criado no diretório raiz

---

## 📊 CRITÉRIOS DE CLASSIFICAÇÃO

Após executar o método acima, classificar o resultado:

### ✅ SUCESSO TOTAL
- 0 erros de console
- 0 warnings de console
- 3 links TradingView presentes (gráficos carregados)
- Resumo de indicadores com valores numéricos

### ⚠️ SUCESSO PARCIAL
- 0 erros de console (ou erros NÃO relacionados a gráficos)
- Warnings presentes (aceitável)
- Gráficos carregados OU indicadores carregados (mas não ambos)

### ❌ FALHA
- Erros de console relacionados a "Error fetching technical data"
- Mensagem "Dados insuficientes" exibida
- Nenhum gráfico carregado
- Nenhum indicador carregado

---

## 🔍 INVESTIGAÇÃO DE FALHAS

Quando um ativo **FALHAR**, investigar:

### 1. Verificar Logs do Backend
```bash
docker-compose logs backend | grep -i [TICKER]
```

### 2. Verificar Dados no Banco
```bash
docker exec -it invest_postgres psql -U postgres -d b3_analysis -c "
SELECT ticker, COUNT(*) as price_count
FROM asset_prices
WHERE ticker = '[TICKER]'
  AND date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY ticker;
"
```

**Critério:**
- ✅ **Mínimo 200 pontos** necessários para gráfico anual (252 dias úteis)
- ❌ **< 200 pontos** = "Dados insuficientes"

### 3. Testar Endpoint Backend Diretamente
```bash
curl -X POST "http://localhost:3101/api/v1/market-data/[TICKER]/technical?timeframe=1Y" \
  -H "Content-Type: application/json"
```

**Verificar resposta:**
- ✅ Status 200 + JSON com `prices` e `indicators`
- ❌ Status 500 ou erro = problema no backend

### 4. Verificar Cache Redis
```bash
docker exec -it invest_redis redis-cli KEYS "*[TICKER]*"
```

**Se cache presente:**
```bash
docker exec -it invest_redis redis-cli GET "technical:[TICKER]:1Y"
```

**Se cache corrupto:**
```bash
docker exec -it invest_redis redis-cli DEL "technical:[TICKER]:1Y"
```

---

## 📋 TEMPLATE DE DOCUMENTAÇÃO

Para cada ativo testado, documentar:

```markdown
### [TICKER] - [Nome do Ativo]

**Status:** ✅ SUCESSO | ⚠️ PARCIAL | ❌ FALHA

**Console:**
- Erros: X
- Warnings: X

**Gráficos:**
- Candlestick: ✅ | ❌
- RSI: ✅ | ❌
- MACD: ✅ | ❌

**Indicadores (Resumo):**
- RSI: XX.X | N/A
- MACD: Compra/Venda | N/A
- SMA 20: R$ XX.XX | N/A
- SMA 50: R$ XX.XX | N/A
- SMA 200: R$ XX.XX | N/A

**Observações:**
- [Qualquer problema ou anomalia encontrado]

**Screenshot:** `VALIDACAO_[TICKER]_[DATA].png`
```

---

## 🎯 META DE VALIDAÇÃO

**Objetivo:** Validar **15 ativos** com taxa de sucesso mínima de **80%**

**Cálculo:**
```
Taxa de Sucesso = (Sucessos Totais / 15) * 100%
Mínimo Aceitável: 12/15 = 80%
```

**Se taxa < 80%:**
1. Identificar padrão de falhas (dados insuficientes? erro de código?)
2. Corrigir causa raiz
3. Re-validar ativos que falharam
4. Repetir até atingir 80%+

---

## 📚 ATIVOS PLANEJADOS PARA TESTE

**Grupo 1: Blue Chips (Alta Liquidez)**
1. VALE3 - Vale ON
2. PETR4 - Petrobras PN
3. BBDC4 - Bradesco PN
4. ITUB4 - Itaú PN
5. ABEV3 - Ambev ON

**Grupo 2: Large Caps**
6. MGLU3 - Magazine Luiza ON
7. B3SA3 - B3 ON
8. WEGE3 - WEG ON
9. RENT3 - Localiza ON
10. ELET3 - Eletrobras ON

**Grupo 3: Mid Caps**
11. BBAS3 - Banco do Brasil ON
12. LREN3 - Lojas Renner ON
13. RADL3 - RaiaDrogasil ON
14. JBSS3 - JBS ON
15. SUZB3 - Suzano ON

---

## 🔄 APRIMORAMENTOS DO MÉTODO

Conforme testes são realizados, documentar melhorias:

### Versão 1.0 (2025-11-16)
- Método inicial criado
- 5 etapas: Navigate → Wait → Console → Snapshot → Screenshot
- Critérios de sucesso definidos
- Template de documentação criado

### Versão 1.1 (próxima)
- [Melhorias a serem adicionadas conforme necessário]

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-16
**MCP:** Chrome DevTools

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
