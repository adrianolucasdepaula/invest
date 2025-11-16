# 🏗️ FRAMEWORK UNIVERSAL DE VALIDAÇÃO FRONTEND

**Versão:** 4.0 (Universal + Agentes Especializados)
**Criado:** 2025-11-16
**Objetivo:** Framework FLEXÍVEL para validar QUALQUER página frontend
**Arquitetura:** Sequential Thinking + Agentes Especializados + MCPs

---

## 🎯 VISÃO GERAL

Este framework permite validar **qualquer página frontend** usando:

1. **🧠 Sequential Thinking** - Orquestrador principal
2. **🤖 Agentes Especializados** - Expertise em domínios específicos
3. **🔧 MCPs** - Ferramentas de inspeção (Chrome DevTools, Playwright, A11y)

### Flexibilidade

**Suporta validação de:**
- ✅ Páginas de ativos (`/assets/[ticker]`)
- ✅ Dashboard (`/dashboard`)
- ✅ Análises (`/analysis`)
- ✅ Portfólio (`/portfolio`)
- ✅ Relatórios (`/reports`)
- ✅ **QUALQUER** página Next.js do projeto

**Adapta-se a:**
- ✅ Diferentes tipos de conteúdo (gráficos, tabelas, forms)
- ✅ Diferentes estados (loading, error, success)
- ✅ Diferentes funcionalidades (charts, OAuth, WebSocket)

---

## 🤖 AGENTES ESPECIALIZADOS

### Agente 1: Chart Validation Expert
**Responsabilidade:** Validar gráficos técnicos (TradingView, Recharts, lightweight-charts)

**Expertise:**
- Identificar gráficos na página (Candlestick, RSI, MACD)
- Verificar dados carregados (OHLC, indicadores)
- Validar renderização (canvas, SVG)
- Detectar problemas (dados insuficientes, erro de cálculo)

**Quando Invocar:**
- Páginas com gráficos (`/assets/[ticker]`, `/assets/[ticker]/technical`)

**Ferramentas:**
- Chrome DevTools (snapshot para identificar elementos canvas/svg)
- Playwright (screenshot para validação visual)

**Definição:**
```yaml
name: chart-validation-expert
description: Expert in validating financial charts (candlestick, technical indicators)
tools: [chrome-devtools, playwright]
specialization: Charts (TradingView, Recharts, lightweight-charts)
```

---

### Agente 2: Data Consistency Expert
**Responsabilidade:** Validar consistência de dados exibidos

**Expertise:**
- Comparar dados entre diferentes seções (ex: preço no card vs gráfico)
- Validar formatação (moeda, porcentagem, números)
- Detectar inconsistências (valor null, "N/A" inesperado)
- Verificar atualização de dados (timestamps, cache)

**Quando Invocar:**
- Páginas com múltiplas fontes de dados
- Páginas com dados financeiros

**Ferramentas:**
- Chrome DevTools (snapshot para extrair valores)
- Playwright (snapshot para cross-check)

**Definição:**
```yaml
name: data-consistency-expert
description: Expert in validating data consistency across UI components
tools: [chrome-devtools, playwright]
specialization: Data validation, formatting, consistency
```

---

### Agente 3: A11y Compliance Expert
**Responsabilidade:** Garantir acessibilidade WCAG 2.1 AA

**Expertise:**
- Auditar compliance WCAG
- Identificar violações críticas
- Propor correções
- Validar navegação por teclado
- Verificar contraste de cores

**Quando Invocar:**
- SEMPRE (todas as páginas)

**Ferramentas:**
- A11y MCP (audit_webpage, get_summary)

**Definição:**
```yaml
name: a11y-compliance-expert
description: Expert in WCAG 2.1 AA accessibility compliance
tools: [a11y]
specialization: Accessibility, WCAG, ARIA, keyboard navigation
```

---

### Agente 4: Performance Analysis Expert
**Responsabilidade:** Analisar performance de carregamento

**Expertise:**
- Medir tempos de navegação
- Identificar bottlenecks (network, rendering)
- Analisar console messages (warnings de performance)
- Verificar lazy loading
- Validar code splitting

**Quando Invocar:**
- Páginas complexas (muitos dados, gráficos)
- Quando performance é crítica

**Ferramentas:**
- Chrome DevTools (navigation timing, console)
- Playwright (wait times, loading states)

**Definição:**
```yaml
name: performance-analysis-expert
description: Expert in frontend performance analysis
tools: [chrome-devtools, playwright]
specialization: Performance, loading times, optimization
```

---

### Agente 5: Cross-Browser Validation Expert
**Responsabilidade:** Garantir consistência entre browsers

**Expertise:**
- Comparar Chrome vs Chromium (Playwright)
- Identificar divergências visuais
- Detectar incompatibilidades CSS/JS
- Validar comportamento de componentes

**Quando Invocar:**
- SEMPRE (após Chrome DevTools e Playwright)

**Ferramentas:**
- Chrome DevTools
- Playwright
- Sequential Thinking (para comparação)

**Definição:**
```yaml
name: cross-browser-validation-expert
description: Expert in cross-browser compatibility validation
tools: [chrome-devtools, playwright, sequential-thinking]
specialization: Browser compatibility, visual regression
```

---

### Agente 6: State Management Expert
**Responsabilidade:** Validar estados da aplicação (loading, error, success)

**Expertise:**
- Identificar estados presentes (loading skeleton, error boundary, success)
- Verificar transições de estado
- Validar mensagens de erro
- Testar edge cases (empty state, offline)

**Quando Invocar:**
- Páginas com estados dinâmicos
- Quando validar UX de loading/error

**Ferramentas:**
- Chrome DevTools (console, snapshot)
- Playwright (wait for states)

**Definição:**
```yaml
name: state-management-expert
description: Expert in validating application states and transitions
tools: [chrome-devtools, playwright]
specialization: State management, loading states, error handling
```

---

## 📋 FRAMEWORK DE EXECUÇÃO

### Fase 0: Planejamento (Sequential Thinking)

```javascript
// OBRIGATÓRIO: Iniciar com Sequential Thinking

mcp__sequential-thinking__sequentialthinking({
  thought: `
Iniciando validação universal de [PÁGINA].

Contexto:
- URL: [URL]
- Tipo: [dashboard/assets/analysis/etc]
- Feature: [descrição]

Objetivo:
- Validar funcionalidade completa
- Zero erros
- Máxima acessibilidade
- Performance aceitável

Estratégia:
1. Identificar tipo de página
2. Selecionar agentes especializados necessários
3. Planejar sequência de validação
4. Executar MCPs coordenados
5. Consolidar resultados
`,
  thoughtNumber: 1,
  totalThoughts: 30, // Estimativa inicial (pode ajustar)
  nextThoughtNeeded: true
})
```

**Output Esperado:**
- Tipo de página identificado
- Agentes especializados selecionados
- Sequência de validação definida
- Critérios de sucesso claros

---

### Fase 1: Seleção de Agentes (Sequential Thinking)

```javascript
// Thought 2: Identificar tipo de página

mcp__sequential-thinking__sequentialthinking({
  thought: `
Analisando [URL] para identificar tipo e selecionar agentes.

Tipos possíveis:
- assets/[ticker]: Chart Expert + Data Consistency Expert
- dashboard: Data Consistency Expert + Performance Expert
- analysis: Data Consistency Expert + State Management Expert
- portfolio: Data Consistency Expert
- reports: Chart Expert + Data Consistency Expert

[URL] identificado como: [TIPO]

Agentes selecionados:
1. [AGENTE 1] - [MOTIVO]
2. [AGENTE 2] - [MOTIVO]
3. A11y Expert - (sempre)
4. Cross-Browser Expert - (sempre)
`,
  thoughtNumber: 2,
  totalThoughts: 30,
  nextThoughtNeeded: true
})
```

**Output Esperado:**
- Lista de agentes especializados a invocar
- Justificativa para cada agente
- Ordem de execução definida

---

### Fase 2: Validação Básica (Chrome DevTools)

```javascript
// Thoughts 3-8: Navegação, Console, Snapshot

// Thought 3: Navegação
mcp__chrome-devtools__navigate_page({url: [URL]})
mcp__sequential-thinking__sequentialthinking({
  thought: "Navegação OK? Tempo? Problemas?",
  ...
})

// Thought 4: Console
mcp__chrome-devtools__list_console_messages({types: ["error", "warn"]})
mcp__sequential-thinking__sequentialthinking({
  thought: "Console limpo? Erros detectados? Invocar Data Consistency Expert se erros?",
  ...
})

// Thought 5: Snapshot
mcp__chrome-devtools__take_snapshot()
mcp__sequential-thinking__sequentialthinking({
  thought: "Elementos presentes? Estrutura correta? Dados carregados?",
  ...
})

// Thought 6: Screenshot
mcp__chrome-devtools__take_screenshot({fullPage: true})
```

---

### Fase 3: Invocar Agentes Especializados (Task Tool)

```javascript
// Thought 9-15: Invocar agentes conforme necessário

// Exemplo: Chart Validation Expert
if (tipoPagina === "assets") {
  mcp__sequential-thinking__sequentialthinking({
    thought: `
Página de ativo detectada. Preciso validar gráficos técnicos.
Invocando Chart Validation Expert para análise profunda.
`,
    ...
  })

  // Invocar agente via Task tool
  Task({
    subagent_type: "chart-analysis-expert", // Já existe!
    description: "Validar gráficos técnicos",
    prompt: `
Valide os gráficos técnicos em http://localhost:3100/assets/[TICKER].

Critérios:
1. Identificar todos os gráficos (Candlestick, RSI, MACD)
2. Verificar se dados carregaram (não vazio)
3. Validar renderização (canvas presentes, sem erros)
4. Screenshot para evidência

Retorne:
- Quantidade de gráficos encontrados
- Status de cada gráfico (OK/ERRO)
- Problemas identificados
- Screenshot path
`
  })

  // Analisar resultado do agente
  mcp__sequential-thinking__sequentialthinking({
    thought: `
Chart Expert retornou: [RESULTADO]

Análise:
- Gráficos: [X/3] carregados
- Problemas: [LISTA] ou Nenhum
- Decisão: [APROVADO/REPROVADO/PARCIAL]
`,
    ...
  })
}
```

---

### Fase 4: Cross-Check (Playwright)

```javascript
// Thoughts 16-20: Playwright para cross-check

mcp__playwright__browser_navigate({url: [URL]})
mcp__playwright__browser_snapshot()
mcp__playwright__browser_console_messages({onlyErrors: true})

mcp__sequential-thinking__sequentialthinking({
  thought: `
Comparando Chrome vs Playwright:

Chrome:
- Console: [X] erros
- Elementos: [LISTA]

Playwright:
- Console: [Y] erros
- Elementos: [LISTA]

Divergências: [SIM/NÃO]
Se SIM, invocar Cross-Browser Validation Expert.
`,
  ...
})
```

---

### Fase 5: Acessibilidade (A11y)

```javascript
// Thoughts 21-24: A11y audit

mcp__a11y__audit_webpage({
  url: [URL],
  tags: ["wcag2a", "wcag2aa", "wcag21a", "best-practice"]
})

mcp__sequential-thinking__sequentialthinking({
  thought: `
A11y audit completado:
- Violações críticas: [X]
- Violações sérias: [Y]
- Violações moderadas: [Z]

Se X > 0 ou Y > 0:
  Invocar A11y Compliance Expert para análise profunda e propor correções.

Se X == 0 && Y == 0:
  APROVADO (violações moderadas aceitáveis se < 5)
`,
  ...
})

// Se necessário, invocar agente
if (violationsCritical > 0) {
  Task({
    subagent_type: "general-purpose",
    description: "Analisar violações a11y",
    prompt: `
Analise as ${violationsCritical} violações críticas de acessibilidade em [URL].

Violações:
[LISTA DE VIOLAÇÕES]

Para cada violação:
1. Identificar elemento afetado
2. Explicar impacto (usuário com deficiência)
3. Propor correção (código)
4. Estimar esforço (horas)

Retorne um plano de ação completo.
`
  })
}
```

---

### Fase 6: Consolidação (Sequential Thinking)

```javascript
// Thoughts 25-30: Consolidar e decidir

mcp__sequential-thinking__sequentialthinking({
  thought: `
Consolidando TODAS as evidências de [PÁGINA]:

🔵 Chrome DevTools:
- Navegação: [OK/FALHA]
- Console: [X] erros
- Snapshot: [OK/FALHA]
- Screenshot: [PATH]
- Aprovação: [%]

🟣 Playwright:
- Consistência: [OK/DIVERGENTE]
- Console: [X] erros
- Screenshot: [PATH]
- Aprovação: [%]

🤖 Agentes Especializados:
${listaAgentesInvocados.map(a => `
- ${a.name}: ${a.result} (${a.approval}%)
`).join('\n')}

♿ A11y:
- WCAG 2.1 AA: [PASSED/FAILED]
- Violações: [LISTA]
- Aprovação: [%]

Média de Aprovação: [%]
`,
  thoughtNumber: 29,
  totalThoughts: 30,
  nextThoughtNeeded: true
})

// Decisão final
mcp__sequential-thinking__sequentialthinking({
  thought: `
DECISÃO FINAL para [PÁGINA]:

Aprovação: [%] (critério: >= 80%)

Se >= 80%:
  ✅ APROVADO - Deploy permitido
  📋 Documentar problemas menores (se houver)

Se < 80%:
  ❌ REPROVADO - Correção obrigatória
  📋 Lista de problemas críticos
  📋 Plano de ação para correção

Justificativa:
[ANÁLISE DETALHADA]

Próximos passos:
[AÇÕES RECOMENDADAS]
`,
  thoughtNumber: 30,
  totalThoughts: 30,
  nextThoughtNeeded: false
})
```

---

## 📊 ADAPTAÇÃO POR TIPO DE PÁGINA

### Tipo: Assets (`/assets/[ticker]`)

**Agentes Obrigatórios:**
1. ✅ Chart Validation Expert (gráficos técnicos)
2. ✅ Data Consistency Expert (preço, indicadores)
3. ✅ A11y Compliance Expert
4. ✅ Cross-Browser Validation Expert

**Critérios Específicos:**
- 3 gráficos TradingView carregados
- Indicadores com valores numéricos
- Preço e variação carregados
- Card de indicadores presente

**Thoughts Estimados:** 25-30

---

### Tipo: Dashboard (`/dashboard`)

**Agentes Obrigatórios:**
1. ✅ Data Consistency Expert (cards, widgets)
2. ✅ Performance Analysis Expert (muitos dados)
3. ✅ A11y Compliance Expert
4. ✅ Cross-Browser Validation Expert

**Critérios Específicos:**
- Todos os cards carregados
- Dados atualizados (timestamps)
- Performance aceitável (< 3s LCP)
- Widgets interativos funcionando

**Thoughts Estimados:** 20-25

---

### Tipo: Analysis (`/analysis`)

**Agentes Obrigatórios:**
1. ✅ Data Consistency Expert (análises listadas)
2. ✅ State Management Expert (loading, error, empty)
3. ✅ A11y Compliance Expert
4. ✅ Cross-Browser Validation Expert

**Critérios Específicos:**
- Tabela de análises carregada
- Filtros funcionando
- Estados tratados (loading skeleton, empty state)
- Botão "Solicitar Análise" visível

**Thoughts Estimados:** 20-25

---

### Tipo: Portfolio (`/portfolio`)

**Agentes Obrigatórios:**
1. ✅ Data Consistency Expert (ativos, valores)
2. ✅ Chart Validation Expert (gráfico de performance)
3. ✅ A11y Compliance Expert
4. ✅ Cross-Browser Validation Expert

**Critérios Específicos:**
- Ativos do portfólio listados
- Valores calculados corretamente
- Gráfico de performance presente
- Ações (comprar/vender) funcionando

**Thoughts Estimados:** 25-30

---

### Tipo: Reports (`/reports/[id]`)

**Agentes Obrigatórios:**
1. ✅ Data Consistency Expert (relatório completo)
2. ✅ Chart Validation Expert (gráficos no relatório)
3. ✅ A11y Compliance Expert
4. ✅ Cross-Browser Validation Expert

**Critérios Específicos:**
- Relatório PDF gerado
- Dados consistentes com análise
- Gráficos renderizados
- Download funcionando

**Thoughts Estimados:** 25-30

---

## 🚀 EXEMPLO DE USO

### Validar `/assets/PETR4`

```javascript
// 1. Planejamento
mcp__sequential-thinking__sequentialthinking({
  thought: "Validar /assets/PETR4. Tipo: assets. Agentes: Chart + Data Consistency + A11y + Cross-Browser",
  ...
})

// 2. Chrome DevTools
navigate → wait → console → snapshot → screenshot
(+ Sequential Thinking após cada passo)

// 3. Invocar Chart Validation Expert
Task({
  subagent_type: "chart-analysis-expert",
  prompt: "Validar gráficos em /assets/PETR4"
})

// 4. Invocar Data Consistency Expert (se necessário)
if (inconsistenciasDetectadas) {
  Task({
    subagent_type: "general-purpose",
    prompt: "Analisar inconsistências de dados em PETR4"
  })
}

// 5. Playwright (cross-check)
navigate → snapshot → console → screenshot
(+ Sequential Thinking comparando)

// 6. A11y
audit → analyze
(+ Sequential Thinking analisando violações)

// 7. Consolidação
mcp__sequential-thinking__sequentialthinking({
  thought: "Compilar TUDO. Decisão final: APROVADO/REPROVADO",
  nextThoughtNeeded: false
})
```

---

## 📈 MÉTRICAS DE SUCESSO

### Cobertura de Validação

**Objetivo:** 100% cobertura em todas as páginas

| Página | Chrome | Playwright | Agentes | A11y | Total |
|--------|--------|------------|---------|------|-------|
| /assets/[ticker] | ✅ | ✅ | ✅ | ✅ | 100% |
| /dashboard | ✅ | ✅ | ✅ | ✅ | 100% |
| /analysis | ✅ | ✅ | ✅ | ✅ | 100% |
| /portfolio | ✅ | ✅ | ✅ | ✅ | 100% |
| /reports/[id] | ✅ | ✅ | ✅ | ✅ | 100% |

### Taxa de Aprovação

**Meta:** >= 80% aprovação em todas as páginas

**Cálculo:**
```
Aprovação = (Chrome + Playwright + AgentesAvg + A11y) / 4

Onde:
- Chrome: 0-100% (baseado em erros, gráficos, dados)
- Playwright: 0-100% (baseado em consistência com Chrome)
- AgentesAvg: média de aprovação de todos agentes invocados
- A11y: 0-100% (baseado em violações)
```

---

## 🛠️ FERRAMENTAS DISPONÍVEIS

### MCPs

1. **Chrome DevTools** (`mcp__chrome-devtools__*`)
   - navigate_page
   - wait_for
   - list_console_messages
   - get_console_message
   - take_snapshot
   - take_screenshot

2. **Playwright** (`mcp__playwright__*`)
   - browser_navigate
   - browser_wait_for
   - browser_snapshot
   - browser_console_messages
   - browser_take_screenshot

3. **A11y** (`mcp__a11y__*`)
   - audit_webpage
   - get_summary

4. **Sequential Thinking** (`mcp__sequential-thinking__*`)
   - sequentialthinking

### Task Tool (Agentes)

- `chart-analysis-expert` (já existe)
- `frontend-components-expert` (já existe)
- `backend-api-expert` (já existe)
- `typescript-validation-expert` (já existe)
- `general-purpose` (para análises custom)

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-16
**Versão:** 4.0 (Universal + Agentes)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
