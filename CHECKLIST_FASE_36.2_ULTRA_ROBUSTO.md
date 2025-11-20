# ✅ CHECKLIST ULTRA-ROBUSTO - FASE 36.2: TradingView Widgets P1

**Data Criação:** 2025-11-20
**Fase:** FASE 36.2 - TradingView Widgets Prioritários (5 widgets essenciais)
**Duração Estimada:** 10 horas
**Responsável:** Claude Code (Sonnet 4.5)
**Versão Checklist:** 2.0 (Ultra-Robusto - Zero Tolerance)

---

## 📋 ÍNDICE

1. [PRÉ-REQUISITOS OBRIGATÓRIOS](#pré-requisitos-obrigatórios)
2. [VALIDAÇÃO FASE ANTERIOR](#validação-fase-anterior)
3. [PESQUISA E PLANEJAMENTO](#pesquisa-e-planejamento)
4. [IMPLEMENTAÇÃO](#implementação)
5. [VALIDAÇÃO TRIPLA MCP](#validação-tripla-mcp)
6. [TESTES ROBUSTOS](#testes-robustos)
7. [DOCUMENTAÇÃO](#documentação)
8. [GIT E DEPLOY](#git-e-deploy)
9. [CRITÉRIOS DE ACEITAÇÃO](#critérios-de-aceitação)

---

## 🎯 PRÉ-REQUISITOS OBRIGATÓRIOS

### Sistema e Ambiente

- [ ] **Docker:** Todos os 8 containers healthy (PostgreSQL, Redis, Backend, Frontend, etc)
- [ ] **Node.js:** v20+ instalado
- [ ] **NPM:** Dependências atualizadas (backend + frontend)
- [ ] **Git:** Branch `main` atualizada e limpa
- [ ] **VSCode:** TypeScript Server ativo e sem errors
- [ ] **Ports:** 3100 (frontend), 3101 (backend), 5532 (postgres), 6479 (redis) disponíveis

**Comando Validação:**
```bash
./system-manager.ps1 status
git status
docker ps
```

**Resultado Esperado:**
```
✅ 8/8 containers healthy
✅ Git: clean working directory
✅ All ports available
```

---

## 🔍 VALIDAÇÃO FASE ANTERIOR

**OBRIGATÓRIO:** Não avançar enquanto fase anterior não estiver 100% sem erros.

### FASE 35: Sistema Gerenciamento Sync B3 ✅

- [ ] **Backend:** 100% completo (DTOs, Service, Controller, WebSocket Gateway)
- [ ] **Frontend:** 6 componentes funcionais (SyncStatusTable, SyncConfigModal, BulkSyncButton, SyncProgressBar, AuditTrailPanel, page.tsx)
- [ ] **Validação MCP:** 9/9 validações passaram (Playwright + Chrome DevTools)
- [ ] **Documentação:** VALIDACAO_FASE_35.md criado
- [ ] **Git:** Commit `9dcf8a8` aplicado

### FASE 36.1: TradingView Widgets - Infraestrutura Base ✅

- [ ] **Types:** types.ts (843 linhas, 49 tipos definidos)
- [ ] **Constants:** constants.ts (700 linhas, 40 símbolos B3)
- [ ] **Hooks:** 4 hooks criados (useTradingViewWidget, useTradingViewTheme, useWidgetLazyLoad, useSymbolNavigation)
- [ ] **Utils:** 3 utils criados (symbolFormatter, widgetConfigBuilder, performanceMonitor)
- [ ] **Documentação:** README.md (15.000 linhas)
- [ ] **Widget Base:** TickerTape.tsx implementado

### Validações Técnicas Obrigatórias

- [ ] **TypeScript Backend:** `cd backend && npx tsc --noEmit` → 0 erros
- [ ] **TypeScript Frontend:** `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] **Build Backend:** `cd backend && npm run build` → Success
- [ ] **Build Frontend:** `cd frontend && npm run build` → Success (18 páginas)
- [ ] **ESLint:** 0 warnings (não apenas 0 errors)
- [ ] **Console:** 0 erros críticos no navegador
- [ ] **Git Status:** Apenas arquivos intencionais não commitados

**Comando Validação Completa:**
```bash
# TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build
cd frontend && npm run build

# Git
git status

# Resultado esperado:
# ✅ TypeScript: 0 errors (backend + frontend)
# ✅ Build: Success (backend + frontend)
# ✅ Git: Only intended files modified
```

---

## 🔬 PESQUISA E PLANEJAMENTO

**Obrigatório ANTES de implementar qualquer widget.**

### Melhores Práticas Mercado (2025)

- [ ] **WebSearch:** "tradingview widgets best practices 2025"
- [ ] **WebSearch:** "tradingview embed widgets production ready"
- [ ] **Context7:** `/tradingview/docs` (documentação oficial widgets)
- [ ] **GitHub:** Buscar repositórios populares usando TradingView widgets (>1k stars)
- [ ] **Stack Overflow:** Buscar soluções para problemas comuns de embedding

**Critérios de Validação:**
- ✅ Fonte: Publicada nos últimos 2 anos (2023+)
- ✅ Confiabilidade: Blog oficial TradingView ou Medium top authors
- ✅ Exemplos funcionais com código
- ✅ Comentários/upvotes positivos (>100 se Stack Overflow)

### Análise de Código Existente

- [ ] Ler `frontend/src/components/tradingview/widgets/TickerTape.tsx` (widget base)
- [ ] Ler `frontend/src/components/tradingview/hooks/useTradingViewWidget.ts` (lógica core)
- [ ] Ler `frontend/src/components/tradingview/README.md` (seções relevantes)
- [ ] Verificar approach atual:
  - ✅ Script embed (usado em TickerTape)
  - ⚠️ Constructor approach (alternativa)
  - ✅ Qual usar para cada widget?

### Decisões Arquiteturais

- [ ] **Abordagem de Carregamento:** Script embed vs Constructor (documentar escolha)
- [ ] **Lazy Loading:** Usar `useWidgetLazyLoad` para widgets off-screen?
- [ ] **Performance Threshold:** Definir limite aceitável (< 2s carregamento)
- [ ] **Error Handling:** Strategy para widgets que falham (ErrorBoundary + retry)
- [ ] **Locale:** Confirmar 'br' funciona para todos os widgets
- [ ] **Theme:** Dark/light mode integrado com next-themes

---

## 🛠️ IMPLEMENTAÇÃO

**5 Widgets P1 (Ordem Priorizada):**

### Widget 1: TickerTape ✅ (JÁ IMPLEMENTADO)

**Status:** ✅ 100% COMPLETO
- [x] Componente `TickerTape.tsx` criado
- [x] Script embed approach implementado
- [x] Locale 'br' configurado
- [x] 11 símbolos B3 configurados
- [x] Dark/light theme suportado

**Validação Pendente:**
- [ ] Testes E2E com Playwright MCP
- [ ] Validação Chrome DevTools MCP
- [ ] Screenshot de evidência

---

### Widget 2: MarketOverview (Dashboard Tabs)

**Descrição:** Visão geral do mercado com tabs (Forex, Crypto, Stocks)

**Checklist Implementação:**

#### 2.1. Pesquisa Específica
- [ ] Ler documentação oficial: https://www.tradingview.com/widget/market-overview/
- [ ] Verificar parâmetros obrigatórios (symbols, tabs, colorTheme)
- [ ] Identificar limitações conhecidas (max symbols, performance)
- [ ] Buscar exemplos de prod: "tradingview market overview widget production"

#### 2.2. Types e Constants
- [ ] Adicionar `MarketOverviewConfig` em `types.ts`
- [ ] Definir `MARKET_OVERVIEW_TABS` em `constants.ts` (Brazil, Stocks, Crypto)
- [ ] Definir símbolos default por tab (min 10 por tab)

#### 2.3. Componente React
- [ ] Criar `frontend/src/components/tradingview/widgets/MarketOverview.tsx`
- [ ] Usar `useTradingViewWidget<MarketOverviewConfig>`
- [ ] Implementar tabs (Brasil, Ações, Crypto)
- [ ] Suportar dark/light theme
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Lazy loading (useWidgetLazyLoad)

#### 2.4. Validações
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Renderização: Widget carrega < 2s
- [ ] Console: 0 erros
- [ ] Performance: monitorar com performanceMonitor.ts

---

### Widget 3: Screener (Screener Completo)

**Descrição:** Screener completo de ativos com filtros técnicos e fundamentalistas

**Checklist Implementação:**

#### 3.1. Pesquisa Específica
- [ ] Ler documentação oficial: https://www.tradingview.com/widget/screener/
- [ ] Verificar filtros disponíveis (performance, volume, volatilidade)
- [ ] Identificar preset filters (top gainers, most active)
- [ ] Buscar exemplos: "tradingview screener widget b3"

#### 3.2. Types e Constants
- [ ] Adicionar `ScreenerConfig` em `types.ts`
- [ ] Definir `SCREENER_FILTERS` em `constants.ts`
- [ ] Configurar colunas default (Ticker, Preço, Variação %, Volume)

#### 3.3. Componente React
- [ ] Criar `frontend/src/components/tradingview/widgets/Screener.tsx`
- [ ] Usar `useTradingViewWidget<ScreenerConfig>`
- [ ] Configurar market: "brazil" (B3)
- [ ] Suportar customização de colunas
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Lazy loading (useWidgetLazyLoad)

#### 3.4. Validações
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Renderização: Widget carrega < 3s (mais pesado)
- [ ] Console: 0 erros
- [ ] Performance: < 200ms initial render

---

### Widget 4: TechnicalAnalysis (Buy/Sell Recomendações)

**Descrição:** Painel de análise técnica com recomendações de compra/venda

**Checklist Implementação:**

#### 4.1. Pesquisa Específica
- [ ] Ler documentação oficial: https://www.tradingview.com/widget/technical-analysis/
- [ ] Verificar indicadores suportados (RSI, MACD, Moving Averages)
- [ ] Identificar timeframes suportados (1m, 5m, 15m, 1h, 1D, 1W, 1M)
- [ ] Buscar exemplos: "tradingview technical analysis widget"

#### 4.2. Types e Constants
- [ ] Adicionar `TechnicalAnalysisConfig` em `types.ts`
- [ ] Definir `TECHNICAL_INTERVALS` em `constants.ts` (5m, 15m, 1h, 4h, 1D, 1W, 1M)
- [ ] Configurar símbolos B3 default

#### 4.3. Componente React
- [ ] Criar `frontend/src/components/tradingview/widgets/TechnicalAnalysis.tsx`
- [ ] Usar `useTradingViewWidget<TechnicalAnalysisConfig>`
- [ ] Prop `symbol` obrigatória (BMFBOVESPA:PETR4)
- [ ] Suportar multiple intervals (array)
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Sem lazy loading (exibir imediatamente)

#### 4.4. Validações
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Renderização: Widget carrega < 1.5s
- [ ] Console: 0 erros
- [ ] Recomendações: Validar Buy/Sell/Neutral exibidos corretamente

---

### Widget 5: EconomicCalendar (Calendário Macroeconômico)

**Descrição:** Calendário de eventos econômicos (Fed, Copom, PIB, inflação)

**Checklist Implementação:**

#### 5.1. Pesquisa Específica
- [ ] Ler documentação oficial: https://www.tradingview.com/widget/events/
- [ ] Verificar filtros de países (Brazil, USA, EU)
- [ ] Verificar filtros de importância (High, Medium, Low)
- [ ] Buscar exemplos: "tradingview economic calendar widget"

#### 5.2. Types e Constants
- [ ] Adicionar `EconomicCalendarConfig` em `types.ts`
- [ ] Definir `ECONOMIC_CALENDAR_COUNTRIES` em `constants.ts` (BR, US, EU, CN)
- [ ] Configurar `importanceFilter` (apenas High)

#### 5.3. Componente React
- [ ] Criar `frontend/src/components/tradingview/widgets/EconomicCalendar.tsx`
- [ ] Usar `useTradingViewWidget<EconomicCalendarConfig>`
- [ ] Filtrar eventos: Brazil + High importance
- [ ] Suportar dark/light theme
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Lazy loading (useWidgetLazyLoad)

#### 5.4. Validações
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Renderização: Widget carrega < 2s
- [ ] Console: 0 erros
- [ ] Eventos: Validar apenas eventos relevantes exibidos

---

## 🧪 VALIDAÇÃO TRIPLA MCP

**OBRIGATÓRIO:** Usar TODOS os 3 MCPs para validação completa.

### MCP 1: Playwright

- [ ] **Instalação:** Verificar Playwright MCP disponível
- [ ] **Navegação:** Abrir página com widgets (ex: `/dashboard`)
- [ ] **Snapshot:** Capturar snapshot UI completa
- [ ] **Interações:**
  - [ ] Clicar em tabs do MarketOverview
  - [ ] Testar filtros do Screener
  - [ ] Mudar timeframe no TechnicalAnalysis
  - [ ] Verificar scroll do EconomicCalendar
- [ ] **Screenshots:** Capturar evidências (1 por widget)
- [ ] **Console:** Verificar 0 erros

**Comandos:**
```typescript
// Navegação
await mcp__playwright__browser_navigate({ url: "http://localhost:3100/dashboard" });

// Snapshot
await mcp__playwright__browser_snapshot();

// Interação (exemplo)
await mcp__playwright__browser_click({ element: "Brazil tab", ref: "..." });

// Screenshot
await mcp__playwright__browser_take_screenshot({
  filename: "FASE_36.2_MARKET_OVERVIEW.png",
  fullPage: true
});
```

### MCP 2: Chrome DevTools

- [ ] **Console Messages:** Verificar 0 errors, apenas warnings esperados
- [ ] **Network Requests:** Validar carregamento de scripts TradingView
  - [ ] GET https://s3.tradingview.com/... → HTTP 200
  - [ ] GET https://s.tradingview.com/... → HTTP 200
- [ ] **Performance:** Timeline de carregamento (< 3s para todos widgets)
- [ ] **Screenshot:** Evidência visual final
- [ ] **Payload:** Verificar configs enviadas para widgets

**Comandos:**
```typescript
// Console
await mcp__chrome-devtools__list_console_messages({ types: ["error"] });

// Network
await mcp__chrome-devtools__list_network_requests({ resourceTypes: ["script"] });

// Screenshot
await mcp__chrome-devtools__take_screenshot({
  filePath: "FASE_36.2_CHROME_DEVTOOLS_VALIDACAO.png"
});
```

### MCP 3: Sequential Thinking

- [ ] **Análise Profunda:** Usar para debugging de problemas complexos
- [ ] **Decisões Arquiteturais:** Documentar reasoning de escolhas críticas
- [ ] **Validação de Hipóteses:** Testar diferentes approaches

**Exemplo de Uso:**
```typescript
// Quando encontrar problema complexo
mcp__sequential-thinking__sequentialthinking({
  thought: "Analisando por que MarketOverview não carrega...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
});
```

---

## 🧪 TESTES ROBUSTOS

**Não utilizar mocks. Apenas dados reais.**

### Testes Manuais (Navegador)

- [ ] **Carregamento Inicial:**
  - [ ] Todos os 5 widgets carregam < 3s
  - [ ] Não há "flash of unstyled content"
  - [ ] Loading states corretos

- [ ] **Interatividade:**
  - [ ] MarketOverview: Trocar entre tabs (Brasil, Ações, Crypto)
  - [ ] Screener: Clicar em headers para ordenar
  - [ ] TechnicalAnalysis: Mudar símbolo (PETR4 → VALE3)
  - [ ] EconomicCalendar: Scroll de eventos

- [ ] **Responsividade:**
  - [ ] Mobile (375px): Widgets adaptam corretamente
  - [ ] Tablet (768px): Layout responsivo
  - [ ] Desktop (1920px): Aproveitamento total de espaço

- [ ] **Dark/Light Mode:**
  - [ ] Toggle theme muda TODOS os widgets
  - [ ] Cores consistentes com sistema
  - [ ] Sem atrasos perceptíveis

### Testes de Performance

- [ ] **Lighthouse:**
  - [ ] Performance Score: > 90
  - [ ] First Contentful Paint: < 1.5s
  - [ ] Time to Interactive: < 3.5s
  - [ ] Cumulative Layout Shift: < 0.1

- [ ] **Network:**
  - [ ] Total size < 2MB (todos widgets carregados)
  - [ ] Requests < 50 (otimizado)
  - [ ] Cache headers corretos

### Testes de Erros

- [ ] **Offline:** Widgets exibem error state amigável
- [ ] **Network Slow (3G):** Loading states adequados
- [ ] **Invalid Symbol:** TechnicalAnalysis exibe erro claro
- [ ] **Widget Script Block (CSP):** Mensagem de erro útil

---

## 📚 DOCUMENTAÇÃO

**Atualizar TODAS as documentações.**

### README.md (TradingView)

- [ ] Seção **Widgets P1** criada
- [ ] Exemplos de uso para cada widget (5 code blocks)
- [ ] Screenshots atualizados (1 por widget)
- [ ] Troubleshooting atualizado (problemas comuns)

### ROADMAP.md

- [ ] FASE 35: Atualizar para **100% COMPLETO** (era 85%)
- [ ] FASE 36.1: Manter **100% COMPLETO**
- [ ] **FASE 36.2: Criar entrada completa**
  - Data implementação
  - Widgets implementados (5)
  - Linhas de código adicionadas
  - Screenshots de evidência
  - Commits (hash + mensagem)
  - Próximos passos (FASE 36.3)

### VALIDACAO_FASE_36.2.md (Novo)

- [ ] Criar documento de validação completo
- [ ] 10+ seções:
  1. Resumo Executivo
  2. Widgets Implementados (detalhes de cada)
  3. Validações MCP (Playwright + Chrome DevTools + Sequential Thinking)
  4. Testes de Performance (Lighthouse scores)
  5. Testes de Responsividade
  6. Testes de Interatividade
  7. Screenshots (5+ evidências)
  8. Métricas de Qualidade (Zero Tolerance)
  9. Problemas Encontrados e Soluções
  10. Próximos Passos

### ARCHITECTURE.md

- [ ] Seção **Frontend - TradingView Widgets** atualizada
- [ ] Diagrama de componentes (se necessário)
- [ ] Fluxo de carregamento de widgets documentado

### CLAUDE.md

- [ ] Adicionar exemplo prático FASE 36.2 (se aplicável)
- [ ] Atualizar métricas do projeto (total linhas, widgets)

---

## 🔄 GIT E DEPLOY

**Git deve estar SEMPRE atualizado.**

### Pre-Commit Checks

- [ ] **TypeScript:** `cd backend && npx tsc --noEmit` → 0 erros
- [ ] **TypeScript:** `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] **Build Backend:** `npm run build` → Success
- [ ] **Build Frontend:** `npm run build` → Success (18 páginas)
- [ ] **ESLint:** `npm run lint` → 0 warnings
- [ ] **Git Status:** Apenas arquivos intencionais

### Commit (Conventional Commits)

**Template:**
```bash
git add <arquivos>

git commit -m "$(cat <<'EOF'
feat(tradingview): FASE 36.2 - Implementar 5 Widgets P1

**Widgets Implementados:**
- ✅ TickerTape (já existente, validado)
- ✅ MarketOverview (tabs Brasil/Ações/Crypto)
- ✅ Screener (screener B3 completo)
- ✅ TechnicalAnalysis (Buy/Sell recomendações)
- ✅ EconomicCalendar (eventos macroeconômicos)

**Arquivos Criados/Modificados:**
- widgets/MarketOverview.tsx (+XXX linhas)
- widgets/Screener.tsx (+XXX linhas)
- widgets/TechnicalAnalysis.tsx (+XXX linhas)
- widgets/EconomicCalendar.tsx (+XXX linhas)
- types.ts (+XX linhas)
- constants.ts (+XX linhas)

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success (18 páginas)
- ✅ Playwright MCP: 15 testes aprovados
- ✅ Chrome DevTools MCP: 0 erros console + network OK
- ✅ Performance: Lighthouse > 90

**Documentação:**
- VALIDACAO_FASE_36.2.md (criado)
- ROADMAP.md (atualizado)
- README.md TradingView (atualizado)

🎉 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Push e Deploy

- [ ] **Git Push:** `git push origin main`
- [ ] **Verificar Remote:** Branch atualizada no GitHub
- [ ] **CI/CD:** Verificar pipeline (se existir)
- [ ] **Claude Code Web:** Testar acesso ao projeto atualizado

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

**FASE 36.2 só será considerada 100% COMPLETA quando TODOS os critérios forem atendidos:**

### Funcionalidade

- [ ] ✅ **5 widgets implementados e funcionais** (TickerTape, MarketOverview, Screener, TechnicalAnalysis, EconomicCalendar)
- [ ] ✅ **Todos os widgets carregam < 3s** (performance aceitável)
- [ ] ✅ **Dark/light mode funciona** em todos os widgets
- [ ] ✅ **Responsivo** (mobile, tablet, desktop)
- [ ] ✅ **Interações funcionam** (tabs, filtros, símbolos)

### Qualidade (Zero Tolerance)

- [ ] ✅ **TypeScript: 0 erros** (backend + frontend)
- [ ] ✅ **Build: Success** (backend + frontend)
- [ ] ✅ **ESLint: 0 warnings**
- [ ] ✅ **Console: 0 erros críticos** (apenas warnings esperados OK)
- [ ] ✅ **Network: Todos requests 200 OK**
- [ ] ✅ **Lighthouse Performance: > 90**

### Validação

- [ ] ✅ **Playwright MCP: ≥ 15 testes aprovados**
- [ ] ✅ **Chrome DevTools MCP: Console + Network validados**
- [ ] ✅ **Sequential Thinking MCP: Usado para decisões críticas**
- [ ] ✅ **Screenshots: ≥ 5 evidências capturadas**

### Documentação

- [ ] ✅ **ROADMAP.md atualizado** (FASE 35 100%, FASE 36.2 100%)
- [ ] ✅ **VALIDACAO_FASE_36.2.md criado** (10+ seções)
- [ ] ✅ **README.md TradingView atualizado** (exemplos widgets)
- [ ] ✅ **ARCHITECTURE.md atualizado** (se necessário)

### Git

- [ ] ✅ **Branch main atualizada**
- [ ] ✅ **Commits: Conventional Commits com co-autoria Claude**
- [ ] ✅ **Push realizado** (remote sincronizado)
- [ ] ✅ **Git status limpo** (não há uncommitted changes críticos)

---

## 🚀 PRÓXIMOS PASSOS (PÓS FASE 36.2)

Após **100% de completude** desta fase:

1. **FASE 36.3:** Widgets P2 (17 widgets restantes) - 10 horas
2. **FASE 36.4:** Soluções Completas (Stocks/Crypto/Forex dashboards) - 8 horas
3. **FASE 36.5:** Integração Páginas Existentes (Dashboard, Assets, Analysis, Portfolio) - 6 horas
4. **FASE 36.6:** Páginas Novas (12 páginas dedicadas a widgets) - 12 horas
5. **FASE 36.7:** Performance + CSP (otimizações avançadas) - 6 horas
6. **FASE 36.8:** Testes E2E + Validação Tripla MCP (todos widgets) - 20 horas

**Total FASE 36:** 78 horas (10 semanas @ 8h/semana)

---

## 📊 MÉTRICAS DE SUCESSO

**KPIs da FASE 36.2:**
```
Widgets Implementados: 5/5 (100%)
TypeScript Errors: 0
Build Errors: 0
Console Errors: 0 (críticos)
Lighthouse Performance: > 90
Playwright Testes: ≥ 15 aprovados
Chrome DevTools Validações: 100% OK
Documentação: 4 arquivos atualizados/criados
Git Commits: 1-2 commits bem estruturados
Tempo Estimado: 10 horas
Tempo Real: [a preencher]
Desvio: [a preencher]
```

---

**FIM DO CHECKLIST ULTRA-ROBUSTO - FASE 36.2**

**Responsável pela Validação:** Claude Code (Sonnet 4.5)
**Data de Criação:** 2025-11-20
**Versão:** 2.0 (Zero Tolerance - 100% ou 0%)

**Lembrete Final:**
- ❌ **NÃO MENTIR** sobre status de tarefas
- ❌ **NÃO TER PRESSA** - qualidade > velocidade
- ✅ **SEMPRE GARANTIR** não quebrar nada existente
- ✅ **SEMPRE VERIFICAR** dependências e integrações
- ✅ **SEMPRE USAR** dados reais (não mocks)
- ✅ **SEMPRE CORRIGIR** problemas crônicos definitivamente (não workarounds)
