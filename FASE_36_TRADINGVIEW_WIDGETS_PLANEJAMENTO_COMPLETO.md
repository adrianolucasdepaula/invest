# FASE 36 - INTEGRAÇÃO COMPLETA TRADINGVIEW WIDGETS

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Data Início:** 2025-11-20
**Responsável:** Claude Code (Sonnet 4.5)
**Status:** 📋 PLANEJAMENTO COMPLETO
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP

---

## 📑 ÍNDICE

1. [Visão Executiva](#1-visão-executiva)
2. [Análise de Arquivos Reais](#2-análise-de-arquivos-reais)
3. [Inventário Completo TradingView](#3-inventário-completo-tradingview)
4. [Arquitetura e Estrutura](#4-arquitetura-e-estrutura)
5. [Planejamento Detalhado (8 Fases)](#5-planejamento-detalhado-8-fases)
6. [Checklist Ultra-Robusto](#6-checklist-ultra-robusto)
7. [Validação Tripla MCP](#7-validação-tripla-mcp)
8. [Critérios de Aprovação 100%](#8-critérios-de-aprovação-100)
9. [Problemas Crônicos a Corrigir](#9-problemas-crônicos-a-corrigir)
10. [Cronograma e Estimativas](#10-cronograma-e-estimativas)

---

## 1. VISÃO EXECUTIVA

### 1.1 Objetivo

Transformar o sistema em uma **plataforma profissional de nível institucional** integrando **TODOS os 22 widgets gratuitos do TradingView** + **3 soluções completas** (Stocks, Crypto, Forex) adaptadas para B3.

### 1.2 Princípios Obrigatórios

✅ **Zero Tolerance:**
- TypeScript: 0 erros
- ESLint: 0 warnings
- Build: 100% success
- Console: 0 erros
- Dados: 0 manipulação (sistema financeiro)

✅ **Metodologia Claude (CLAUDE.md):**
1. Ultra-Thinking (análise profunda)
2. TodoWrite (organização etapas)
3. Implementação (com validação contínua)
4. Documentação (registro completo)

✅ **Validação Tripla MCP (Obrigatório):**
1. Playwright MCP (UI + Interação)
2. Chrome DevTools MCP (Console + Network + Payload)
3. Sequential Thinking MCP (Análise lógica)

✅ **Regras de Ouro:**
- Revisar 100% fase anterior antes de avançar
- Git sempre atualizado (branch mergeada)
- Documentação atualizada (CLAUDE.md, ROADMAP.md, ARCHITECTURE.md)
- Usar system-manager.ps1 para ambiente
- Dados reais (scrapers), nunca mocks
- Corrigir problemas definitivamente (não workarounds)
- Verificar dependências/integrações antes de mudanças
- Screenshots validação (MCPs janelas separadas)

### 1.3 Resultado Esperado

**Sistema ANTES:**
- ✅ lightweight-charts (controle total dados B3)
- ✅ Python Service (200+ indicadores)
- ❌ Sem overview macro mercado
- ❌ Sem screener avançado
- ❌ Sem calendário econômico
- ❌ Sem heatmaps
- ❌ Sem recomendações técnicas

**Sistema DEPOIS (FASE 36):**
- ✅ 22 widgets TradingView integrados
- ✅ 3 soluções completas (Stocks, Crypto, Forex)
- ✅ 16 páginas (4 modificadas + 12 novas)
- ✅ Performance otimizada (LCP < 2.5s)
- ✅ 100% responsivo + dark/light mode
- ✅ Validação tripla MCP (22+ cenários)

---

## 2. ANÁLISE DE ARQUIVOS REAIS

### 2.1 Sistema Atual (Analisado em 2025-11-20)

**✅ VERIFICADO:**

```bash
# Frontend
frontend/package.json - lightweight-charts: ^4.1.3 ✅ INSTALADO
frontend/src/components/charts/multi-pane-chart.tsx ✅ EXISTE
frontend/src/components/charts/candlestick-chart-with-overlays.tsx ✅ EXISTE
frontend/src/app/(dashboard)/assets/[ticker]/page.tsx ✅ EXISTE

# Backend
backend/src/market-data/ ✅ EXISTE
backend/src/technical-analysis/ ✅ EXISTE (Python Service integrado)

# Scripts
system-manager.ps1 ✅ EXISTE (Gerenciamento ambiente)

# Documentação
CLAUDE.md ✅ ATUALIZADO (2025-11-17, FASE 35 exemplo)
ROADMAP.md ✅ ATUALIZADO (98.1% completo)
ARCHITECTURE.md ✅ EXISTE
```

### 2.2 Páginas Existentes (Não Duplicar)

**Dashboard:**
- `/dashboard` - ✅ EXISTE (modificar, não recriar)

**Assets:**
- `/assets` - ✅ EXISTE (lista ativos)
- `/assets/[ticker]` - ✅ EXISTE (página ativo com MultiPaneChart)

**Outras:**
- `/portfolio` ✅
- `/analysis` ✅
- `/reports` ✅
- `/settings` ✅
- `/data-sources` ✅
- `/oauth-manager` ✅

### 2.3 Componentes Existentes (Não Duplicar)

```typescript
// Charts (já existem)
frontend/src/components/charts/
├── multi-pane-chart.tsx ✅
├── candlestick-chart-with-overlays.tsx ✅
├── rsi-chart.tsx ✅
├── macd-chart.tsx ✅
├── stochastic-chart.tsx ✅
└── timeframe-range-picker.tsx ✅

// Hooks (já existem)
frontend/src/lib/hooks/
├── use-assets.ts ✅
├── use-analysis.ts ✅
└── use-user.ts ✅
```

**DECISÃO:** Criar pasta separada `tradingview/` para não conflitar.

### 2.4 Dependências Atuais

```json
// frontend/package.json (VERIFICADO)
{
  "lightweight-charts": "^4.1.3", ✅
  "next": "^14.2.33", ✅
  "react": "^18.2.0", ✅
  "next-themes": "^X.X.X", ✅ (verificar se existe)
  // ... outras
}
```

**AÇÃO NECESSÁRIA:** Verificar se `next-themes` está instalado (para dark/light mode).

---

## 3. INVENTÁRIO COMPLETO TRADINGVIEW

### 3.1 Widgets Gratuitos (22 Total)

**Fonte:** https://www.tradingview.com/widget-docs/widgets/

#### Categoria 1: Charts (3)
1. **Advanced Chart** - Gráfico profissional 200+ indicadores
2. **Symbol Overview** - Overview + mini-gráfico
3. **Mini Chart** - Gráfico compacto para cards

#### Categoria 2: Watchlists (3)
4. **Market Overview** - Visão macro com tabs
5. **Stock Market** - Top gainers/losers/actives
6. **Market Data (Market Quotes)** - Cotações multi-símbolos

#### Categoria 3: Tickers (3)
7. **Ticker Tape** - Faixa rolante estilo bolsa
8. **Ticker** - Horizontal multi-símbolos
9. **Single Ticker** - Ticker individual

#### Categoria 4: Heatmaps (5)
10. **Stock Heatmap** - Mapa calor ações
11. **Crypto Coins Heatmap** - Crypto por market cap
12. **ETF Heatmap** - ETFs por AUM
13. **Forex Cross Rates** - Matriz moedas
14. **Forex Heatmap** - Força moedas

#### Categoria 5: Screeners (2)
15. **Screener** - Filtros fundamentalistas + técnicos
16. **Cryptocurrency Market** - Screener crypto

#### Categoria 6: Symbol Details (4)
17. **Symbol Info** - Informações ativo
18. **Technical Analysis** - Recomendação Buy/Sell
19. **Fundamental Data** - P/L, P/B, ROE, etc.
20. **Company Profile** - Perfil empresa

#### Categoria 7: News (1)
21. **Top Stories** - Notícias ativo

#### Categoria 8: Calendars (1)
22. **Economic Calendar** - 300k+ eventos, 190 países

### 3.2 Soluções Completas (3)

**Fonte:** https://www.tradingview.com/widget-docs/solutions/

1. **Stocks Dashboard** - 7 widgets integrados
2. **Crypto Dashboard** - 7 widgets integrados
3. **Forex Dashboard** - 7 widgets integrados

### 3.3 Limitações Gratuitas

✅ **INCLUÍDO (Gratuito):**
- Todos os 22 widgets
- Todos os indicadores técnicos (200+)
- Todos os timeframes (1m até Monthly)
- Dados históricos completos
- Múltiplos símbolos (sem limite)

⚠️ **LIMITAÇÕES:**
- Logo TradingView obrigatório (não pode remover)
- Iframe externo (não controle total dados)
- Delay 15min dados intraday (tempo real = pago)
- Customização UI limitada (via props)

**DECISÃO:** Limitações aceitáveis para MVP. Widgets são complementares ao lightweight-charts (dados próprios B3).

---

## 4. ARQUITETURA E ESTRUTURA

### 4.1 Princípios Arquiteturais

✅ **Separação de Responsabilidades:**
- `lightweight-charts`: Gráficos principais (controle total dados B3)
- `TradingView Widgets`: Features complementares (overview, screener, calendar)

✅ **Não Substituir, Complementar:**
- Manter gráficos existentes (MultiPaneChart)
- Adicionar widgets TradingView em páginas específicas

✅ **Organização Modular:**
```
frontend/src/components/tradingview/
├── charts/         # 3 widgets
├── watchlists/     # 3 widgets
├── tickers/        # 3 widgets
├── heatmaps/       # 5 widgets
├── screeners/      # 2 widgets
├── symbol-details/ # 4 widgets
├── news/           # 1 widget
├── calendars/      # 1 widget
├── solutions/      # 3 soluções completas
├── hooks/          # Custom hooks
├── utils/          # Utilitários
├── types.ts        # TypeScript interfaces
└── constants.ts    # Constantes (símbolos B3, temas)
```

### 4.2 Estrutura de Arquivos (60+ Novos)

```
frontend/src/
├── components/tradingview/              # 🔥 NOVA PASTA
│   ├── README.md                        # Documentação uso
│   ├── types.ts                         # 22+ interfaces
│   ├── constants.ts                     # Símbolos B3, temas, estudos
│   │
│   ├── hooks/                           # 🔥 NOVA PASTA
│   │   ├── useTradingViewWidget.ts     # Hook genérico carregamento
│   │   ├── useTradingViewTheme.ts      # Integração next-themes
│   │   ├── useSymbolNavigation.ts      # Navegação dinâmica
│   │   └── useWidgetLazyLoad.ts        # Intersection Observer
│   │
│   ├── utils/                           # 🔥 NOVA PASTA
│   │   ├── symbolFormatter.ts          # "PETR4" → "BMFBOVESPA:PETR4"
│   │   ├── widgetConfigBuilder.ts      # Builder pattern configs
│   │   └── performanceMonitor.ts       # Monitor performance
│   │
│   ├── charts/                          # 🔥 NOVA PASTA (3 widgets)
│   │   ├── AdvancedChart.tsx
│   │   ├── SymbolOverview.tsx
│   │   └── MiniChart.tsx
│   │
│   ├── watchlists/                      # 🔥 NOVA PASTA (3 widgets)
│   │   ├── MarketOverview.tsx
│   │   ├── StockMarket.tsx
│   │   └── MarketQuotes.tsx
│   │
│   ├── tickers/                         # 🔥 NOVA PASTA (3 widgets)
│   │   ├── TickerTape.tsx
│   │   ├── Ticker.tsx
│   │   └── SingleTicker.tsx
│   │
│   ├── heatmaps/                        # 🔥 NOVA PASTA (5 widgets)
│   │   ├── StockHeatmap.tsx
│   │   ├── CryptoHeatmap.tsx
│   │   ├── ETFHeatmap.tsx
│   │   ├── ForexCrossRates.tsx
│   │   └── ForexHeatmap.tsx
│   │
│   ├── screeners/                       # 🔥 NOVA PASTA (2 widgets)
│   │   ├── Screener.tsx
│   │   └── CryptoMarketScreener.tsx
│   │
│   ├── symbol-details/                  # 🔥 NOVA PASTA (4 widgets)
│   │   ├── SymbolInfo.tsx
│   │   ├── TechnicalAnalysis.tsx
│   │   ├── FundamentalData.tsx
│   │   └── CompanyProfile.tsx
│   │
│   ├── news/                            # 🔥 NOVA PASTA (1 widget)
│   │   └── TopStories.tsx
│   │
│   ├── calendars/                       # 🔥 NOVA PASTA (1 widget)
│   │   └── EconomicCalendar.tsx
│   │
│   └── solutions/                       # 🔥 NOVA PASTA (3 soluções)
│       ├── StocksDashboard.tsx
│       ├── CryptoDashboard.tsx
│       └── ForexDashboard.tsx
│
├── app/(dashboard)/
│   ├── layout.tsx                       # ✅ MODIFICAR (Ticker Tape header)
│   ├── page.tsx                         # ✅ MODIFICAR (Market Overview)
│   │
│   ├── assets/
│   │   ├── [ticker]/
│   │   │   └── page.tsx                 # ✅ MODIFICAR (7 widgets solução)
│   │   └── page.tsx                     # ✅ MODIFICAR (+ Heatmap)
│   │
│   ├── screener/                        # 🔥 NOVA PASTA
│   │   └── page.tsx
│   │
│   ├── market/                          # 🔥 NOVA PASTA
│   │   ├── page.tsx                     # Overview geral
│   │   ├── heatmap/
│   │   │   └── page.tsx                 # Heatmap fullscreen
│   │   └── movers/
│   │       └── page.tsx                 # Top gainers/losers
│   │
│   ├── macro/                           # 🔥 NOVA PASTA
│   │   ├── page.tsx                     # Calendar + Forex
│   │   ├── calendar/
│   │   │   └── page.tsx                 # Calendar fullscreen
│   │   └── forex/
│   │       └── page.tsx                 # Forex Cross Rates
│   │
│   ├── crypto/                          # 🔥 NOVA PASTA
│   │   ├── page.tsx                     # Crypto Dashboard
│   │   └── heatmap/
│   │       └── page.tsx                 # Crypto Heatmap
│   │
│   └── solutions/                       # 🔥 NOVA PASTA
│       ├── stocks/
│       │   └── page.tsx                 # Solução Stocks
│       ├── crypto/
│       │   └── page.tsx                 # Solução Crypto
│       └── forex/
│           └── page.tsx                 # Solução Forex
│
├── config/
│   ├── tradingview.config.ts            # 🔥 NOVO (Config centralizada)
│   └── csp.config.ts                    # 🔥 NOVO (CSP rules)
│
└── tests/
    └── tradingview-widgets.spec.ts      # 🔥 NOVO (22+ testes E2E)

# Root
next.config.js                            # ✅ MODIFICAR (CSP headers)
```

**TOTAL:**
- 🔥 60+ arquivos novos
- ✅ 5 arquivos modificados
- 📁 15 pastas novas

---

## 5. PLANEJAMENTO DETALHADO (8 FASES)

### FASE 0: PRÉ-REQUISITOS E VALIDAÇÃO INICIAL ⏱️ 3h

**Objetivo:** Garantir ambiente 100% funcional antes de iniciar.

#### 0.1 Verificar Ambiente (1h)

```powershell
# Usar system-manager.ps1
.\system-manager.ps1 status

# Verificar serviços
- PostgreSQL: Running ✅
- Redis: Running ✅
- Backend: Running (port 3101) ✅
- Frontend: Running (port 3100) ✅
```

**Checklist:**
- [ ] Docker containers running (4/4)
- [ ] Backend accessible (http://localhost:3101/api/v1/health)
- [ ] Frontend accessible (http://localhost:3100)
- [ ] PostgreSQL com dados (assets, prices)
- [ ] Redis funcional

#### 0.2 Análise Completa Sistema (1h)

```bash
# Verificar arquivos críticos
- frontend/package.json ✅
- frontend/tsconfig.json ✅
- frontend/src/app/(dashboard)/layout.tsx ✅
- frontend/src/app/(dashboard)/page.tsx ✅
- frontend/src/components/charts/ ✅
- frontend/src/lib/hooks/ ✅
```

**Checklist:**
- [ ] Ler 10+ arquivos relacionados
- [ ] Identificar padrões de código
- [ ] Verificar imports existentes
- [ ] Confirmar estrutura pastas
- [ ] Verificar convenções nomes

#### 0.3 Validar Build Atual (30min)

```bash
cd frontend
npm run type-check  # TypeScript 0 erros ✅
npm run lint        # ESLint 0 warnings ✅
npm run build       # Build success ✅
```

**Checklist:**
- [ ] TypeScript: 0 erros
- [ ] ESLint: 0 warnings
- [ ] Build: Success (17 páginas)
- [ ] Console: 0 erros (testar 3 páginas principais)

#### 0.4 Git Status e Branch (30min)

```bash
git status  # Verificar arquivos não commitados
git log -3  # Ver últimos commits
git branch  # Confirmar branch main
```

**Checklist:**
- [ ] Git status clean (ou commitar pendências)
- [ ] Branch main atualizada
- [ ] Último commit validado

#### 0.5 Criar TodoWrite Inicial (30min)

**Checklist:**
- [ ] Criar TodoWrite com 50+ etapas
- [ ] Organizar por fases (0-7)
- [ ] Definir critérios aprovação cada etapa
- [ ] Apenas 1 etapa `in_progress` por vez

**CRITÉRIO APROVAÇÃO FASE 0:**
- ✅ Ambiente 100% funcional
- ✅ Build atual sem erros
- ✅ Git limpo e atualizado
- ✅ TodoWrite criado
- ✅ Análise arquivos completa

---

### FASE 1: INFRAESTRUTURA BASE ⏱️ 6h

**Objetivo:** Criar fundação sólida (types, constants, hooks, utils).

#### 1.1 Instalar Dependências (30min)

```bash
# Verificar se next-themes está instalado
cd frontend
npm list next-themes

# Se NÃO estiver instalado:
npm install next-themes@latest
```

**Checklist:**
- [ ] Verificar next-themes instalado
- [ ] Se não, instalar via npm
- [ ] Testar import em arquivo teste
- [ ] Build success após instalação

#### 1.2 TypeScript Types (2h)

**Arquivo:** `frontend/src/components/tradingview/types.ts`

**Conteúdo:** 22+ interfaces (uma por widget)

```typescript
// Exemplo estrutura
export type ColorTheme = 'light' | 'dark';
export type Locale = 'br' | 'en' | 'es' | 'pt';
export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D' | '1W' | '1M';

export interface TradingViewSymbol {
  proName: string;  // "BMFBOVESPA:PETR4"
  title?: string;   // "PETR4"
  description?: string;
}

export interface BaseWidgetProps {
  colorTheme?: ColorTheme;
  isTransparent?: boolean;
  locale?: Locale;
  width?: number | string;
  height?: number | string;
}

// ... 22+ interfaces específicas
```

**Checklist:**
- [ ] Criar arquivo types.ts
- [ ] Definir 22+ interfaces
- [ ] TypeScript 0 erros
- [ ] Exports corretos
- [ ] Comentários JSDoc

#### 1.3 Constants (1h)

**Arquivo:** `frontend/src/components/tradingview/constants.ts`

**Conteúdo:**
- TOP_10_B3_STOCKS (símbolos)
- B3_INDICES (IBOV, IFIX, SMLL, IDIV)
- TRADINGVIEW_THEME_COLORS (dark/light)
- AVAILABLE_STUDIES (indicadores)

**Checklist:**
- [ ] Criar arquivo constants.ts
- [ ] Definir 4 constantes principais
- [ ] Valores reais B3 (não mocks)
- [ ] TypeScript 0 erros
- [ ] Exports corretos

#### 1.4 Custom Hooks (2h)

**Arquivos:**
1. `hooks/useTradingViewWidget.ts` (genérico)
2. `hooks/useTradingViewTheme.ts` (next-themes)
3. `hooks/useWidgetLazyLoad.ts` (Intersection Observer)
4. `hooks/useSymbolNavigation.ts` (navegação)

**Checklist:**
- [ ] Criar 4 hooks
- [ ] TypeScript 0 erros
- [ ] Testar cada hook isoladamente
- [ ] JSDoc comments

#### 1.5 Utils (30min)

**Arquivos:**
1. `utils/symbolFormatter.ts`
2. `utils/widgetConfigBuilder.ts`
3. `utils/performanceMonitor.ts`

**Checklist:**
- [ ] Criar 3 utils
- [ ] TypeScript 0 erros
- [ ] Testes unitários (opcional)

#### 1.6 README Inicial (30min)

**Arquivo:** `frontend/src/components/tradingview/README.md`

**Checklist:**
- [ ] Criar README básico
- [ ] Listar widgets disponíveis
- [ ] Exemplo de uso simples
- [ ] Referências TradingView

#### 1.7 Validação Fase 1 (30min)

```bash
cd frontend
npm run type-check  # 0 erros ✅
npm run lint        # 0 warnings ✅
npm run build       # Success ✅
```

**Checklist:**
- [ ] TypeScript: 0 erros
- [ ] ESLint: 0 warnings
- [ ] Build: Success
- [ ] Arquivos criados: 10+
- [ ] Git add (não commitar ainda)

**CRITÉRIO APROVAÇÃO FASE 1:**
- ✅ 10+ arquivos criados (types, constants, hooks, utils)
- ✅ TypeScript 0 erros
- ✅ Build Success
- ✅ Nenhuma duplicação código existente
- ✅ Documentação README inicial

---

### FASE 2: WIDGETS PRIORITÁRIOS (P1) ⏱️ 8h

**Objetivo:** Implementar 5 widgets mais importantes primeiro.

**Widgets P1:**
1. Ticker Tape (header global)
2. Market Overview (dashboard)
3. Screener (nova página)
4. Technical Analysis (sidebar asset)
5. Economic Calendar (macro)

#### 2.1 Ticker Tape (2h)

**Arquivo:** `frontend/src/components/tradingview/tickers/TickerTape.tsx`

**Implementação:**
```typescript
'use client';
import { useId, useEffect } from 'react';
import { useTradingViewTheme } from '../hooks/useTradingViewTheme';
import { useWidgetLazyLoad } from '../hooks/useWidgetLazyLoad';
// ... implementação completa
```

**Checklist:**
- [ ] Criar componente TickerTape
- [ ] Implementar lazy loading
- [ ] Integrar next-themes
- [ ] Props TypeScript
- [ ] JSDoc comments
- [ ] TypeScript 0 erros
- [ ] Testar isoladamente (criar página teste temporária)

#### 2.2 Market Overview (2h)

**Arquivo:** `frontend/src/components/tradingview/watchlists/MarketOverview.tsx`

**Checklist:**
- [ ] Criar componente MarketOverview
- [ ] Suporte tabs customizáveis
- [ ] Lazy loading
- [ ] TypeScript 0 erros
- [ ] Teste isolado

#### 2.3 Screener (2h)

**Arquivo:** `frontend/src/components/tradingview/screeners/Screener.tsx`

**Checklist:**
- [ ] Criar componente Screener
- [ ] Props: market="brazil"
- [ ] Lazy loading
- [ ] TypeScript 0 erros
- [ ] Teste isolado

#### 2.4 Technical Analysis (1h)

**Arquivo:** `frontend/src/components/tradingview/symbol-details/TechnicalAnalysis.tsx`

**Checklist:**
- [ ] Criar componente TechnicalAnalysis
- [ ] Props: symbol, interval, showIntervalTabs
- [ ] Lazy loading
- [ ] TypeScript 0 erros
- [ ] Teste isolado

#### 2.5 Economic Calendar (1h)

**Arquivo:** `frontend/src/components/tradingview/calendars/EconomicCalendar.tsx`

**Checklist:**
- [ ] Criar componente EconomicCalendar
- [ ] Props: countryFilter, importanceFilter
- [ ] Lazy loading
- [ ] TypeScript 0 erros
- [ ] Teste isolado

#### 2.6 Validação Fase 2 (1h)

```bash
# TypeScript
cd frontend && npm run type-check

# Build
npm run build

# Teste visual (página temporária)
# Criar: frontend/src/app/(dashboard)/test-widgets/page.tsx
# Testar cada widget isoladamente
```

**Checklist Validação:**
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] 5 widgets funcionando isoladamente
- [ ] Dark/Light mode funcionando
- [ ] Lazy loading funcionando
- [ ] Screenshots (5 widgets)

**CRITÉRIO APROVAÇÃO FASE 2:**
- ✅ 5 widgets P1 implementados
- ✅ TypeScript 0 erros
- ✅ Build Success
- ✅ Widgets funcionando isoladamente (screenshots)
- ✅ Lazy loading validado
- ✅ Dark/Light mode validado

---

### FASE 3: WIDGETS RESTANTES (P2) ⏱️ 10h

**Objetivo:** Implementar 17 widgets restantes.

**Estrutura:** Multiplicar padrão FASE 2 para cada widget.

#### 3.1 Charts (3 widgets) - 3h

- [ ] AdvancedChart.tsx
- [ ] SymbolOverview.tsx
- [ ] MiniChart.tsx

#### 3.2 Watchlists Restantes (1 widget) - 1h

- [ ] StockMarket.tsx
- [ ] MarketQuotes.tsx

#### 3.3 Tickers Restantes (2 widgets) - 2h

- [ ] Ticker.tsx
- [ ] SingleTicker.tsx

#### 3.4 Heatmaps (5 widgets) - 3h

- [ ] StockHeatmap.tsx
- [ ] CryptoHeatmap.tsx
- [ ] ETFHeatmap.tsx
- [ ] ForexCrossRates.tsx
- [ ] ForexHeatmap.tsx

#### 3.5 Symbol Details Restantes (3 widgets) - 2h

- [ ] SymbolInfo.tsx
- [ ] FundamentalData.tsx
- [ ] CompanyProfile.tsx

#### 3.6 News (1 widget) - 1h

- [ ] TopStories.tsx

#### 3.7 Screeners Restantes (1 widget) - 1h

- [ ] CryptoMarketScreener.tsx

#### 3.8 Validação Fase 3 (1h)

**Checklist:**
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] 17 widgets funcionando
- [ ] Screenshots (17 widgets)
- [ ] Documentar cada widget (README)

**CRITÉRIO APROVAÇÃO FASE 3:**
- ✅ TODOS 22 widgets implementados
- ✅ TypeScript 0 erros
- ✅ Build Success
- ✅ Screenshots individuais (22)
- ✅ README atualizado (lista completa)

---

### FASE 4: SOLUÇÕES COMPLETAS ⏱️ 8h

**Objetivo:** Implementar 3 soluções prontas (7 widgets cada).

#### 4.1 Stocks Dashboard (3h)

**Arquivo:** `frontend/src/components/tradingview/solutions/StocksDashboard.tsx`

**Widgets Integrados:**
1. Ticker Tape (navegação)
2. Symbol Info
3. Advanced Chart
4. Company Profile
5. Fundamental Data
6. Technical Analysis
7. Top Stories

**Checklist:**
- [ ] Criar componente StocksDashboard
- [ ] Integrar 7 widgets
- [ ] Layout responsivo (2 cols desktop, 1 col mobile)
- [ ] Navegação dinâmica (query params)
- [ ] TypeScript 0 erros
- [ ] Screenshot fullscreen

#### 4.2 Crypto Dashboard (2h)

**Arquivo:** `frontend/src/components/tradingview/solutions/CryptoDashboard.tsx`

**Checklist:**
- [ ] Criar componente CryptoDashboard
- [ ] Integrar 7 widgets
- [ ] Layout responsivo
- [ ] TypeScript 0 erros
- [ ] Screenshot

#### 4.3 Forex Dashboard (2h)

**Arquivo:** `frontend/src/components/tradingview/solutions/ForexDashboard.tsx`

**Checklist:**
- [ ] Criar componente ForexDashboard
- [ ] Integrar 7 widgets
- [ ] Layout responsivo
- [ ] TypeScript 0 erros
- [ ] Screenshot

#### 4.4 Validação Fase 4 (1h)

**Checklist:**
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] 3 soluções funcionando
- [ ] Screenshots (3 fullscreen)
- [ ] Testar navegação dinâmica

**CRITÉRIO APROVAÇÃO FASE 4:**
- ✅ 3 soluções completas implementadas
- ✅ 21 widgets integrados (7x3)
- ✅ TypeScript 0 erros
- ✅ Build Success
- ✅ Navegação dinâmica funcionando
- ✅ Screenshots validação (3)

---

### FASE 5: INTEGRAÇÃO PÁGINAS EXISTENTES ⏱️ 6h

**Objetivo:** Modificar 4 páginas existentes sem quebrar nada.

#### 5.1 Layout Global - Ticker Tape Header (1h)

**Arquivo:** `frontend/src/app/(dashboard)/layout.tsx` ✅ MODIFICAR

**Mudanças:**
```typescript
import { TickerTape } from '@/components/tradingview/tickers/TickerTape';
import { TOP_10_B3_STOCKS } from '@/components/tradingview/constants';

// Adicionar antes de {children}:
<div className="sticky top-0 z-50 bg-background border-b">
  <TickerTape symbols={TOP_10_B3_STOCKS} />
</div>
```

**Checklist:**
- [ ] Ler arquivo atual completo
- [ ] Adicionar import TickerTape
- [ ] Adicionar componente no layout
- [ ] TypeScript 0 erros
- [ ] Build Success
- [ ] Testar navegação entre páginas (Ticker Tape visível)

#### 5.2 Dashboard - Market Overview + Calendar (2h)

**Arquivo:** `frontend/src/app/(dashboard)/page.tsx` ✅ MODIFICAR

**Mudanças:**
- Adicionar MarketOverview (tabs: Índices, Ações, FIIs)
- Adicionar EconomicCalendar (sidebar)

**Checklist:**
- [ ] Ler arquivo atual completo
- [ ] Adicionar imports
- [ ] Adicionar componentes sem quebrar existentes
- [ ] Layout responsivo
- [ ] TypeScript 0 erros
- [ ] Build Success
- [ ] Screenshot dashboard completo

#### 5.3 Assets Lista - Adicionar Heatmap (1h)

**Arquivo:** `frontend/src/app/(dashboard)/assets/page.tsx` ✅ MODIFICAR

**Mudanças:**
- Adicionar StockHeatmap ao final da página

**Checklist:**
- [ ] Ler arquivo atual
- [ ] Adicionar import StockHeatmap
- [ ] Adicionar componente (final página)
- [ ] TypeScript 0 erros
- [ ] Build Success
- [ ] Screenshot

#### 5.4 Asset Individual - Integrar Solução Stocks (2h)

**Arquivo:** `frontend/src/app/(dashboard)/assets/[ticker]/page.tsx` ✅ MODIFICAR

**Mudanças:**
- Manter MultiPaneChart existente (lightweight-charts)
- Adicionar Technical Analysis (sidebar)
- Adicionar Symbol Info (header)
- Adicionar Company Profile (abaixo do chart)

**IMPORTANTE:** NÃO substituir MultiPaneChart existente!

**Checklist:**
- [ ] Ler arquivo atual completo (438 linhas)
- [ ] Adicionar imports (3 widgets)
- [ ] Integrar sem quebrar MultiPaneChart
- [ ] Layout: Chart principal + sidebar TechnicalAnalysis
- [ ] TypeScript 0 erros
- [ ] Build Success
- [ ] Screenshot (PETR4, VALE3)

#### 5.5 Validação Fase 5 (1h)

**Checklist Validação:**
- [ ] TypeScript: 0 erros
- [ ] Build: Success (17 páginas)
- [ ] 4 páginas modificadas funcionando
- [ ] Nenhuma regressão (testar páginas não modificadas)
- [ ] Screenshots (4 páginas)

**CRITÉRIO APROVAÇÃO FASE 5:**
- ✅ 4 páginas modificadas sem quebrar
- ✅ TypeScript 0 erros
- ✅ Build Success
- ✅ MultiPaneChart mantido (lightweight-charts)
- ✅ Nenhuma regressão
- ✅ Screenshots validação (4)

---

### FASE 6: NOVAS PÁGINAS ⏱️ 10h

**Objetivo:** Criar 12 páginas novas com widgets TradingView.

#### 6.1 Screener Completo (1h)

**Arquivo:** `frontend/src/app/(dashboard)/screener/page.tsx` 🔥 NOVO

**Checklist:**
- [ ] Criar pasta + page.tsx
- [ ] Screener widget fullscreen
- [ ] TypeScript 0 erros
- [ ] Screenshot

#### 6.2 Market (3 páginas) - 3h

**Arquivos:**
- `market/page.tsx` - Overview geral
- `market/heatmap/page.tsx` - Heatmap fullscreen
- `market/movers/page.tsx` - Top gainers/losers

**Checklist:**
- [ ] Criar 3 páginas
- [ ] TypeScript 0 erros
- [ ] Screenshots (3)

#### 6.3 Macro (3 páginas) - 3h

**Arquivos:**
- `macro/page.tsx` - Calendar + Forex overview
- `macro/calendar/page.tsx` - Calendar fullscreen
- `macro/forex/page.tsx` - Forex Cross Rates + Heatmap

**Checklist:**
- [ ] Criar 3 páginas
- [ ] TypeScript 0 erros
- [ ] Screenshots (3)

#### 6.4 Crypto (2 páginas) - 2h

**Arquivos:**
- `crypto/page.tsx` - Crypto Dashboard
- `crypto/heatmap/page.tsx` - Crypto Heatmap fullscreen

**Checklist:**
- [ ] Criar 2 páginas
- [ ] TypeScript 0 erros
- [ ] Screenshots (2)

#### 6.5 Solutions (3 páginas) - 3h

**Arquivos:**
- `solutions/stocks/page.tsx` - Stocks Dashboard
- `solutions/crypto/page.tsx` - Crypto Dashboard
- `solutions/forex/page.tsx` - Forex Dashboard

**Checklist:**
- [ ] Criar 3 páginas
- [ ] Query params: ?symbol=PETR4
- [ ] TypeScript 0 erros
- [ ] Screenshots (3)

#### 6.6 Validação Fase 6 (1h)

**Checklist:**
- [ ] TypeScript: 0 erros
- [ ] Build: Success (29 páginas = 17 antigas + 12 novas)
- [ ] 12 páginas novas funcionando
- [ ] Navegação entre páginas OK
- [ ] Screenshots (12)

**CRITÉRIO APROVAÇÃO FASE 6:**
- ✅ 12 páginas novas criadas
- ✅ TypeScript 0 erros
- ✅ Build Success (29 páginas)
- ✅ Navegação funcionando
- ✅ Screenshots validação (12)

---

### FASE 7: PERFORMANCE & CSP ⏱️ 6h

**Objetivo:** Otimizar performance e configurar CSP.

#### 7.1 Content Security Policy (2h)

**Arquivo:** `next.config.js` ✅ MODIFICAR

**Mudanças:**
```javascript
async headers() {
  return [{
    source: '/:path*',
    headers: [{
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://s3.tradingview.com",
        "frame-src https://s.tradingview.com https://www.tradingview.com",
        // ... completo
      ].join('; '),
    }],
  }];
}
```

**Checklist:**
- [ ] Ler next.config.js atual
- [ ] Adicionar headers() function
- [ ] CSP permitindo TradingView
- [ ] Build Success
- [ ] Testar widgets carregam (não bloqueados)

#### 7.2 Dynamic Imports (2h)

**Criar:** `frontend/src/components/tradingview/index.ts` (barrel export)

```typescript
// Lazy loading via dynamic imports
export { TickerTape } from './tickers/TickerTape';
export { MarketOverview } from './watchlists/MarketOverview';
// ... todos widgets
```

**Usar em páginas:**
```typescript
import dynamic from 'next/dynamic';

const MarketOverview = dynamic(
  () => import('@/components/tradingview').then(mod => mod.MarketOverview),
  { ssr: false, loading: () => <Skeleton /> }
);
```

**Checklist:**
- [ ] Criar index.ts (barrel export)
- [ ] Atualizar imports em 16 páginas
- [ ] TypeScript 0 erros
- [ ] Build Success
- [ ] Testar lazy loading funciona

#### 7.3 Performance Monitoring (1h)

**Arquivo:** `frontend/src/components/tradingview/utils/performanceMonitor.ts`

**Checklist:**
- [ ] Implementar monitor performance
- [ ] Adicionar logs em widgets críticos
- [ ] Testar em dev (console.log visível)

#### 7.4 Validação Performance (2h)

**Lighthouse Audit:**
```bash
# Testar 5 páginas principais:
1. /dashboard
2. /assets/PETR4
3. /screener
4. /solutions/stocks
5. /macro/calendar
```

**Checklist:**
- [ ] Lighthouse: Score 95+ (5 páginas)
- [ ] LCP < 2.5s (5 páginas)
- [ ] CLS < 0.1 (5 páginas)
- [ ] INP < 200ms (5 páginas)
- [ ] Screenshots Lighthouse (5)

**CRITÉRIO APROVAÇÃO FASE 7:**
- ✅ CSP configurado corretamente
- ✅ Dynamic imports implementados
- ✅ Lighthouse Score 95+ (5 páginas)
- ✅ LCP < 2.5s validado
- ✅ Performance otimizada

---

### FASE 8: VALIDAÇÃO TRIPLA MCP ⏱️ 12h

**Objetivo:** Validação completa com 3 MCPs (Playwright, Chrome DevTools, Sequential Thinking).

#### 8.1 Playwright MCP - Testes E2E (4h)

**Arquivo:** `frontend/tests/tradingview-widgets.spec.ts` 🔥 NOVO

**22 Cenários de Teste:**

```typescript
test.describe('TradingView Widgets - Validação Completa', () => {
  // 1. Ticker Tape
  test('1. Ticker Tape renders and displays B3 symbols', async ({ page }) => {
    await page.goto('/dashboard');
    const tickerTape = page.locator('.tradingview-widget-container').first();
    await expect(tickerTape).toBeVisible({ timeout: 10000 });
    await expect(tickerTape).toContainText('PETR4');
  });

  // 2. Market Overview
  test('2. Market Overview shows tabs correctly', async ({ page }) => {
    await page.goto('/dashboard');
    // ... validação completa
  });

  // ... 20 testes adicionais (1 por widget)

  // 22. Dark/Light Toggle
  test('22. Theme toggle updates all widgets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-theme-toggle]');
    // Verificar widgets atualizaram tema
  });
});
```

**Checklist:**
- [ ] Criar arquivo .spec.ts
- [ ] Implementar 22 testes (1 por widget)
- [ ] Executar: `npx playwright test tradingview-widgets.spec.ts`
- [ ] Resultado: 22/22 passing ✅
- [ ] Screenshots falhas (se houver)

#### 8.2 Chrome DevTools MCP - Console & Network (4h)

**Validar 16 páginas (4 modificadas + 12 novas):**

**Para CADA página:**
1. Abrir página
2. Verificar console (0 erros)
3. Verificar network (requests TradingView = 200 OK)
4. Verificar payload (dados corretos)
5. Screenshot

**Checklist:**
- [ ] /dashboard - Console 0 erros ✅
- [ ] /dashboard - Network 100% 200 OK ✅
- [ ] /assets/PETR4 - Console 0 erros ✅
- [ ] /assets/PETR4 - Network 100% 200 OK ✅
- [ ] /screener - Console 0 erros ✅
- [ ] /screener - Network 100% 200 OK ✅
- [ ] ... repetir para 13 páginas restantes
- [ ] Screenshots (16 páginas x 2 = 32 screenshots)

#### 8.3 Sequential Thinking MCP - Análise Lógica (2h)

**Usar Sequential Thinking para:**
1. Analisar arquitetura completa
2. Identificar possíveis problemas lógicos
3. Validar integração entre widgets
4. Verificar consistência código
5. Sugerir melhorias (se aplicável)

**Checklist:**
- [ ] Invocar Sequential Thinking MCP
- [ ] Prompt: "Analise arquitetura TradingView widgets, identifique problemas lógicos e inconsistências"
- [ ] Revisar output
- [ ] Corrigir problemas identificados (se houver)

#### 8.4 Screenshots Validação (1h)

**Organizar screenshots em pasta:**
```
frontend/screenshots/FASE_36_VALIDACAO/
├── playwright/
│   ├── test_01_ticker_tape.png
│   ├── test_02_market_overview.png
│   └── ... (22 screenshots)
├── chrome-devtools/
│   ├── dashboard_console.png
│   ├── dashboard_network.png
│   └── ... (32 screenshots)
└── manual/
    ├── dashboard_fullscreen.png
    ├── assets_petr4_fullscreen.png
    └── ... (16 screenshots)
```

**Checklist:**
- [ ] Criar pasta screenshots
- [ ] Organizar 70+ screenshots
- [ ] Nomes descritivos
- [ ] Readme.md na pasta (índice screenshots)

#### 8.5 Validação Final Build & TypeScript (1h)

```bash
# Frontend
cd frontend
npm run type-check  # 0 erros ✅
npm run lint        # 0 warnings ✅
npm run build       # Success (29 páginas) ✅

# Git status
cd ..
git status  # Verificar arquivos criados/modificados
```

**Checklist:**
- [ ] TypeScript: 0 erros (absoluto)
- [ ] ESLint: 0 warnings (absoluto)
- [ ] Build: Success (29 páginas)
- [ ] Console: 0 erros (16 páginas testadas)
- [ ] Network: 100% 200 OK (16 páginas)
- [ ] Lighthouse: Score 95+ (5 páginas)

**CRITÉRIO APROVAÇÃO FASE 8:**
- ✅ 22/22 testes Playwright passing
- ✅ 16/16 páginas Chrome DevTools validadas
- ✅ Sequential Thinking análise completa
- ✅ 70+ screenshots organizados
- ✅ TypeScript 0 erros
- ✅ Build Success (29 páginas)
- ✅ **FASE 36 100% VALIDADA**

---

## 6. CHECKLIST ULTRA-ROBUSTO

### 📋 Checklist Geral (Obrigatório Toda Fase)

**Antes de Iniciar Fase:**
- [ ] Fase anterior 100% aprovada
- [ ] Git status limpo
- [ ] Branch main atualizada
- [ ] Ambiente rodando (system-manager.ps1 status)
- [ ] TodoWrite atualizado (marcar fase anterior completed)

**Durante Fase:**
- [ ] Apenas 1 etapa `in_progress` por vez
- [ ] TypeScript 0 erros (validar continuamente)
- [ ] Build Success (testar após mudanças significativas)
- [ ] Não manipular dados (sistema financeiro)
- [ ] Não criar duplicados (verificar existentes)
- [ ] Seguir arquitetura definida

**Após Fase:**
- [ ] TypeScript 0 erros ✅
- [ ] ESLint 0 warnings ✅
- [ ] Build Success ✅
- [ ] Console 0 erros (páginas testadas) ✅
- [ ] Screenshots validação ✅
- [ ] TodoWrite atualizado (marcar completed) ✅
- [ ] Git add (não commitar ainda, esperar FASE 8)

---

## 7. VALIDAÇÃO TRIPLA MCP

### 7.1 Playwright MCP

**Quando Usar:**
- Após criar/modificar componente visual
- Após integrar widget em página
- Validação E2E completa (FASE 8)

**Como Usar:**
```typescript
// Exemplo
test('Widget X renders correctly', async ({ page }) => {
  await page.goto('/page-url');
  const widget = page.locator('.tradingview-widget-container');
  await expect(widget).toBeVisible({ timeout: 10000 });
});
```

**Checklist:**
- [ ] Widget visível
- [ ] Props corretas
- [ ] Interações funcionais
- [ ] Screenshot capturado

### 7.2 Chrome DevTools MCP

**Quando Usar:**
- Após integrar widget em página
- Validar console 0 erros
- Validar network requests 200 OK
- Validação completa (FASE 8)

**Como Usar:**
1. Abrir página no Chrome
2. F12 (DevTools)
3. Tab Console: verificar 0 erros
4. Tab Network: filtrar "tradingview", verificar 200 OK
5. Screenshot

**Checklist:**
- [ ] Console: 0 erros (nenhum vermelho)
- [ ] Network: 100% 200 OK (nenhum 404/500)
- [ ] Payload: dados corretos (se aplicável)
- [ ] Screenshot evidência

### 7.3 Sequential Thinking MCP

**Quando Usar:**
- Análise lógica complexa
- Identificar problemas arquiteturais
- Validação consistência código
- Análise final (FASE 8)

**Como Usar:**
1. Invocar MCP Sequential Thinking
2. Prompt detalhado: "Analise arquitetura X, identifique Y, verifique Z"
3. Revisar output (chain of thought)
4. Aplicar correções sugeridas

**Checklist:**
- [ ] Prompt claro e específico
- [ ] Output revisado completamente
- [ ] Problemas identificados corrigidos
- [ ] Documentar insights importantes

---

## 8. CRITÉRIOS DE APROVAÇÃO 100%

### 8.1 Por Fase

**FASE 0 - Pré-requisitos:** ✅
- Ambiente 100% funcional
- Build atual sem erros
- Git limpo
- TodoWrite criado
- Análise arquivos completa

**FASE 1 - Infraestrutura:** ✅
- 10+ arquivos criados
- TypeScript 0 erros
- Build Success
- Nenhuma duplicação
- README inicial

**FASE 2 - Widgets P1:** ✅
- 5 widgets implementados
- TypeScript 0 erros
- Build Success
- Widgets funcionando (screenshots)
- Lazy loading validado

**FASE 3 - Widgets Restantes:** ✅
- TODOS 22 widgets implementados
- TypeScript 0 erros
- Build Success
- Screenshots (22)
- README completo

**FASE 4 - Soluções:** ✅
- 3 soluções implementadas
- 21 widgets integrados
- TypeScript 0 erros
- Build Success
- Navegação dinâmica OK

**FASE 5 - Integração Páginas:** ✅
- 4 páginas modificadas sem quebrar
- TypeScript 0 erros
- Build Success
- Nenhuma regressão
- MultiPaneChart mantido

**FASE 6 - Novas Páginas:** ✅
- 12 páginas criadas
- TypeScript 0 erros
- Build Success (29 páginas)
- Navegação OK
- Screenshots (12)

**FASE 7 - Performance:** ✅
- CSP configurado
- Dynamic imports OK
- Lighthouse 95+
- LCP < 2.5s
- Performance otimizada

**FASE 8 - Validação Tripla:** ✅
- 22/22 testes Playwright
- 16/16 páginas Chrome DevTools
- Sequential Thinking análise
- 70+ screenshots organizados
- **FASE 36 100% COMPLETA**

### 8.2 Critério Final (FASE 36 Completa)

**✅ APROVAÇÃO FINAL REQUER:**

**TypeScript & Build:**
- [ ] TypeScript: 0 erros (frontend completo)
- [ ] ESLint: 0 warnings (frontend completo)
- [ ] Build: Success (29 páginas compiladas)

**Funcionalidades:**
- [ ] 22 widgets funcionando
- [ ] 3 soluções completas funcionando
- [ ] 16 páginas funcionando (4 mod + 12 novas)
- [ ] Ticker Tape header global OK
- [ ] Navegação dinâmica OK
- [ ] Dark/Light mode sincronizado

**Performance:**
- [ ] Lighthouse Score 95+ (5 páginas)
- [ ] LCP < 2.5s (5 páginas)
- [ ] Lazy loading funcionando
- [ ] CSP configurado corretamente

**Validação Tripla MCP:**
- [ ] Playwright: 22/22 testes passing
- [ ] Chrome DevTools: 16/16 páginas validadas
- [ ] Sequential Thinking: análise completa

**Documentação:**
- [ ] README.md tradingview/ completo
- [ ] ROADMAP.md atualizado (FASE 36 entry)
- [ ] CLAUDE.md atualizado (se metodologia nova)
- [ ] Screenshots organizados (70+)

**Git:**
- [ ] Git status: apenas arquivos FASE 36
- [ ] Branch main
- [ ] Commit message preparado (Conventional Commits)
- [ ] Co-Authored-By: Claude incluído

**SEM:**
- [ ] Erros TypeScript
- [ ] Warnings ESLint
- [ ] Erros Console
- [ ] Regressões
- [ ] Duplicação código
- [ ] Dados manipulados
- [ ] Workarounds (problemas corrigidos definitivamente)

---

## 9. PROBLEMAS CRÔNICOS A CORRIGIR

### 9.1 Identificar Durante Implementação

**Se encontrar problemas crônicos:**
1. **DOCUMENTAR** imediatamente
2. **CORRIGIR DEFINITIVAMENTE** (não workaround)
3. **VALIDAR CORREÇÃO** (não deve reaparecer)
4. **ADICIONAR TESTE** (prevenir regressão)

**Exemplos (baseado em FASE 35):**
- Enum antigo incompatível → Substituir definitivamente
- ESLint warning → Corrigir com comentário justificado
- HTTP 400 crônico → Refatorar DTO na raiz

### 9.2 Checklist Correção Definitiva

**Para CADA problema identificado:**
- [ ] Documentar problema (causa raiz)
- [ ] Analisar impacto (arquivos afetados)
- [ ] Implementar correção definitiva
- [ ] Validar com tripla MCP
- [ ] Adicionar teste (se aplicável)
- [ ] Documentar solução (FASE_36_...md)

---

## 10. CRONOGRAMA E ESTIMATIVAS

### 10.1 Cronograma Detalhado

| Fase | Descrição | Horas | Dias | Acumulado |
|------|-----------|-------|------|-----------|
| **FASE 0** | Pré-requisitos e Validação Inicial | 3h | 0.5 | 3h |
| **FASE 1** | Infraestrutura Base (types, hooks, utils) | 6h | 1 | 9h |
| **FASE 2** | Widgets Prioritários P1 (5 widgets) | 8h | 1 | 17h |
| **FASE 3** | Widgets Restantes (17 widgets) | 10h | 1.5 | 27h |
| **FASE 4** | Soluções Completas (3 dashboards) | 8h | 1 | 35h |
| **FASE 5** | Integração Páginas Existentes (4 páginas) | 6h | 1 | 41h |
| **FASE 6** | Novas Páginas (12 páginas) | 10h | 1.5 | 51h |
| **FASE 7** | Performance & CSP | 6h | 1 | 57h |
| **FASE 8** | Validação Tripla MCP | 12h | 1.5 | 69h |
| **EXTRA** | Buffer (imprevistos) | 6h | 1 | 75h |
| **DOCS** | Documentação Final + Commit | 3h | 0.5 | 78h |

**TOTAL ESTIMADO:** 78 horas (10 dias úteis @ 8h/dia)

### 10.2 Milestones

**Dia 1-2:** FASE 0 + FASE 1 + FASE 2 (17h)
- ✅ Infraestrutura completa
- ✅ 5 widgets P1 funcionando

**Dia 3-4:** FASE 3 + FASE 4 (18h)
- ✅ TODOS 22 widgets implementados
- ✅ 3 soluções completas

**Dia 5-7:** FASE 5 + FASE 6 (16h)
- ✅ 4 páginas modificadas
- ✅ 12 páginas novas

**Dia 8-9:** FASE 7 + FASE 8 (18h)
- ✅ Performance otimizada
- ✅ Validação tripla MCP completa

**Dia 10:** Documentação + Commit (9h)
- ✅ ROADMAP.md atualizado
- ✅ Commit detalhado
- ✅ **FASE 36 100% COMPLETA**

### 10.3 Riscos e Mitigações

**Risco 1:** Widgets não carregam (CSP bloqueio)
- **Mitigação:** Configurar CSP corretamente (FASE 7)
- **Contingência:** Testar em página isolada primeiro

**Risco 2:** Performance degrada (muitos iframes)
- **Mitigação:** Lazy loading obrigatório
- **Contingência:** Limitar widgets simultâneos (máx 4 por página)

**Risco 3:** Conflito com lightweight-charts
- **Mitigação:** Pastas separadas, não modificar existentes
- **Contingência:** Testar isoladamente antes de integrar

**Risco 4:** TypeScript erros complexos
- **Mitigação:** Definir types completos (FASE 1)
- **Contingência:** Usar `any` temporário, refatorar depois

**Risco 5:** Build quebra inesperadamente
- **Mitigação:** Validar build continuamente
- **Contingência:** Git revert última mudança, analisar

---

## 11. COMANDOS ÚTEIS

### 11.1 Ambiente (system-manager.ps1)

```powershell
# Status completo
.\system-manager.ps1 status

# Parar tudo
.\system-manager.ps1 stop

# Iniciar tudo
.\system-manager.ps1 start

# Logs (se disponível)
.\system-manager.ps1 logs backend
.\system-manager.ps1 logs frontend
```

### 11.2 Frontend

```bash
cd frontend

# TypeScript check
npm run type-check

# ESLint
npm run lint

# Build
npm run build

# Dev server
npm run dev

# Playwright tests
npx playwright test tradingview-widgets.spec.ts

# Lighthouse audit
npx lighthouse http://localhost:3100/dashboard --view
```

### 11.3 Git

```bash
# Status
git status

# Add (não commitar até FASE 8)
git add frontend/src/components/tradingview/
git add frontend/src/app/(dashboard)/

# Commit (apenas após FASE 8 100% aprovada)
git commit -m "feat(FASE 36): Integração completa TradingView (22 widgets + 3 soluções)

Implementação:
- 22 widgets TradingView integrados
- 3 soluções completas (Stocks, Crypto, Forex)
- 16 páginas (4 modificadas + 12 novas)
- Infraestrutura: types, hooks, utils
- Performance: CSP, lazy loading, Lighthouse 95+

Arquivos:
- 60+ arquivos criados (tradingview/)
- 5 arquivos modificados (layout, pages)
- 12 páginas novas criadas

Validação:
- ✅ TypeScript: 0 erros
- ✅ Build: Success (29 páginas)
- ✅ Playwright: 22/22 testes passing
- ✅ Chrome DevTools: 16/16 páginas validadas
- ✅ Lighthouse: Score 95+
- ✅ LCP < 2.5s

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 12. REFERÊNCIAS

### 12.1 TradingView Oficial

- Widgets: https://www.tradingview.com/widget/
- Documentação: https://www.tradingview.com/widget-docs/widgets/
- Soluções: https://www.tradingview.com/widget-docs/solutions/
- Tutoriais: https://www.tradingview.com/widget-docs/tutorials/

### 12.2 Documentação Sistema

- CLAUDE.md (Metodologia)
- ROADMAP.md (Progresso)
- ARCHITECTURE.md (Arquitetura)
- FASE 35 exemplo (PLANO_FASE_29_GRAFICOS_AVANCADOS.md)

### 12.3 Exemplos Reais Sistema

- FASE 35 (Validação Tripla MCP)
- OAuth Manager (2025-11-15, 5 features)
- FASE 24 (lightweight-charts implementação)

---

## 13. PRÓXIMOS PASSOS

### 13.1 Após Aprovação Planejamento

1. **Criar TodoWrite Completo** (50+ etapas)
2. **Iniciar FASE 0** (Pré-requisitos)
3. **Seguir metodologia Claude** (Ultra-Thinking + TodoWrite + Validação)
4. **Nunca pular fase** sem aprovação 100%
5. **Documentar problemas** crônicos e corrigir definitivamente
6. **Validação tripla MCP** em cada fase crítica
7. **Commit apenas ao final** (FASE 8 100% aprovada)

### 13.2 Após FASE 36 Completa

1. **Atualizar ROADMAP.md** (entrada completa FASE 36)
2. **Atualizar CLAUDE.md** (se metodologia nova)
3. **Criar README.md** (guia uso widgets)
4. **Screenshots organizados** (70+ evidências)
5. **Git commit detalhado** (Conventional Commits)
6. **Branch mergeada** (pronto para deploy)
7. **Planejamento FASE 37** (próximas features)

---

**FIM DO PLANEJAMENTO COMPLETO FASE 36**

*Criado em: 2025-11-20*
*Versão: 1.0.0*
*Status: 📋 PRONTO PARA EXECUÇÃO*
*Metodologia: Ultra-Thinking + TodoWrite + Validação Tripla MCP*
