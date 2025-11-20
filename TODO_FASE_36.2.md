# 📝 TODO DETALHADO - FASE 36.2: TradingView Widgets P1

**Data:** 2025-11-20
**Fase:** FASE 36.2 - Widgets Prioritários (5 widgets essenciais)
**Duração Estimada:** 10 horas
**Status:** 🚧 PLANEJADO (0% completo)

---

## 🎯 OBJETIVO

Implementar **5 widgets essenciais** do TradingView para dashboard e páginas de análise:
1. ✅ **TickerTape** (já implementado)
2. ⏳ **MarketOverview** (tabs Brasil/Ações/Crypto)
3. ⏳ **Screener** (screener B3 completo)
4. ⏳ **TechnicalAnalysis** (Buy/Sell recomendações)
5. ⏳ **EconomicCalendar** (eventos macroeconômicos)

---

## ✅ WIDGET 1: TICKERTAPE (JÁ COMPLETO)

**Status:** ✅ 100% IMPLEMENTADO
**Arquivo:** `frontend/src/components/tradingview/widgets/TickerTape.tsx`
**Validação Pendente:** Testes E2E completos

### Checklist
- [x] Componente React criado
- [x] Script embed implementado
- [x] Locale 'br' configurado
- [x] 11 símbolos B3 funcionando
- [x] Dark/light theme suportado
- [ ] Testes E2E Playwright (FASE 36.8)

---

## ⏳ WIDGET 2: MARKETOVERVIEW (2.5 HORAS)

**Descrição:** Dashboard com tabs (Brasil, Ações, Crypto) mostrando visão geral do mercado

### 2.1 Pesquisa (30min)
- [ ] Ler doc oficial: https://www.tradingview.com/widget/market-overview/
- [ ] Analisar parâmetros: `tabs`, `symbols`, `showSymbolLogo`, `colorTheme`
- [ ] Testar exemplos no browser
- [ ] Validar approach: script embed vs constructor

### 2.2 Types e Constants (30min)
- [ ] Adicionar `MarketOverviewConfig` interface em `types.ts`
  ```typescript
  export interface MarketOverviewConfig extends BaseWidgetConfig {
    tabs: MarketOverviewTab[];
    showSymbolLogo?: boolean;
    isTransparent?: boolean;
    displayMode?: 'regular' | 'compact';
    width?: string | number;
    height?: string | number;
  }

  export interface MarketOverviewTab {
    title: string;
    symbols: TradingViewSymbol[];
    originalTitle?: string;
  }
  ```

- [ ] Adicionar constantes em `constants.ts`
  ```typescript
  export const MARKET_OVERVIEW_TABS_DEFAULT: MarketOverviewTab[] = [
    {
      title: 'Brasil',
      symbols: [
        { proName: 'BMFBOVESPA:IBOV', description: 'Ibovespa' },
        { proName: 'BMFBOVESPA:PETR4', description: 'Petrobras PN' },
        { proName: 'BMFBOVESPA:VALE3', description: 'Vale ON' },
        // ... 10 símbolos B3
      ]
    },
    {
      title: 'Ações',
      symbols: [
        { proName: 'NASDAQ:AAPL', description: 'Apple Inc.' },
        { proName: 'NASDAQ:MSFT', description: 'Microsoft' },
        // ... 10 ações internacionais
      ]
    },
    {
      title: 'Crypto',
      symbols: [
        { proName: 'BINANCE:BTCUSDT', description: 'Bitcoin' },
        { proName: 'BINANCE:ETHUSDT', description: 'Ethereum' },
        // ... 10 criptomoedas
      ]
    }
  ];
  ```

### 2.3 Componente React (1h)
- [ ] Criar `frontend/src/components/tradingview/widgets/MarketOverview.tsx`
- [ ] Estrutura básica:
  ```typescript
  'use client';

  import { useEffect, useRef } from 'react';
  import { useTradingViewWidget } from '../hooks/useTradingViewWidget';
  import { MarketOverviewConfig } from '../types';
  import { MARKET_OVERVIEW_TABS_DEFAULT } from '../constants';

  export interface MarketOverviewProps {
    tabs?: MarketOverviewTab[];
    colorTheme?: 'light' | 'dark';
    isTransparent?: boolean;
    displayMode?: 'regular' | 'compact';
    height?: string | number;
    className?: string;
  }

  export function MarketOverview({
    tabs = MARKET_OVERVIEW_TABS_DEFAULT,
    colorTheme,
    isTransparent = true,
    displayMode = 'regular',
    height = 400,
    className
  }: MarketOverviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const config: MarketOverviewConfig = {
      tabs,
      showSymbolLogo: true,
      colorTheme: colorTheme || 'dark',
      isTransparent,
      displayMode,
      width: '100%',
      height,
      locale: 'br',
    };

    const { status, error } = useTradingViewWidget<MarketOverviewConfig>(
      'MarketOverview',
      config,
      containerRef
    );

    return (
      <div className={className}>
        <div ref={containerRef} style={{ height }} />
        {status === 'error' && error && (
          <div className="text-red-500">Error: {error.message}</div>
        )}
      </div>
    );
  }
  ```

- [ ] Implementar script embed approach (similar ao TickerTape)
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Suportar dark/light theme (integrar com useTradingViewTheme)

### 2.4 Validação (30min)
- [ ] TypeScript: `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] Build: `cd frontend && npm run build` → Success
- [ ] Teste browser: http://localhost:3100 (adicionar widget em página teste)
- [ ] Console: 0 erros
- [ ] Performance: < 2s carregamento

---

## ⏳ WIDGET 3: SCREENER (2 HORAS)

**Descrição:** Screener completo de ativos B3 com filtros técnicos e fundamentalistas

### 3.1 Pesquisa (20min)
- [ ] Ler doc oficial: https://www.tradingview.com/widget/screener/
- [ ] Analisar parâmetros: `market`, `showToolbar`, `defaultColumn`, `defaultScreen`
- [ ] Identificar preset filters (top gainers, most active, top losers)
- [ ] Testar exemplos no browser

### 3.2 Types e Constants (20min)
- [ ] Adicionar `ScreenerConfig` interface em `types.ts`
  ```typescript
  export interface ScreenerConfig extends BaseWidgetConfig {
    market?: 'brazil' | 'america' | 'forex' | 'crypto';
    showToolbar?: boolean;
    defaultColumn?: string;
    defaultScreen?: string;
    isTransparent?: boolean;
    width?: string | number;
    height?: string | number;
  }
  ```

- [ ] Adicionar constantes em `constants.ts`
  ```typescript
  export const SCREENER_MARKETS = {
    BRAZIL: 'brazil',
    AMERICA: 'america',
    FOREX: 'forex',
    CRYPTO: 'crypto',
  } as const;

  export const SCREENER_PRESETS = {
    TOP_GAINERS: 'most_capitalized',
    MOST_ACTIVE: 'volume_leaders',
    TOP_LOSERS: 'top_losers',
  } as const;
  ```

### 3.3 Componente React (1h)
- [ ] Criar `frontend/src/components/tradingview/widgets/Screener.tsx`
- [ ] Props: `market`, `showToolbar`, `defaultScreen`, `height`, `className`
- [ ] Configurar market default: 'brazil' (B3)
- [ ] Implementar script embed
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Suportar dark/light theme

### 3.4 Validação (20min)
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Teste browser: Screener B3 funcionando
- [ ] Console: 0 erros
- [ ] Performance: < 3s carregamento (widget mais pesado)

---

## ⏳ WIDGET 4: TECHNICALANALYSIS (2 HORAS)

**Descrição:** Painel de análise técnica com recomendações Buy/Sell/Neutral baseadas em indicadores

### 4.1 Pesquisa (20min)
- [ ] Ler doc oficial: https://www.tradingview.com/widget/technical-analysis/
- [ ] Analisar parâmetros: `symbol`, `interval`, `width`, `height`
- [ ] Verificar intervals suportados: 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1D, 1W, 1M
- [ ] Testar exemplos no browser

### 4.2 Types e Constants (20min)
- [ ] Adicionar `TechnicalAnalysisConfig` interface em `types.ts`
  ```typescript
  export interface TechnicalAnalysisConfig extends BaseWidgetConfig {
    symbol: string; // Ex: 'BMFBOVESPA:PETR4'
    interval?: TradingViewInterval;
    width?: string | number;
    height?: string | number;
    isTransparent?: boolean;
    showIntervalTabs?: boolean;
  }
  ```

- [ ] Adicionar constantes em `constants.ts`
  ```typescript
  export const TECHNICAL_ANALYSIS_INTERVALS = [
    '5m', '15m', '1h', '4h', '1D', '1W', '1M'
  ] as const;
  ```

### 4.3 Componente React (1h)
- [ ] Criar `frontend/src/components/tradingview/widgets/TechnicalAnalysis.tsx`
- [ ] Props obrigatórias: `symbol` (ex: 'BMFBOVESPA:PETR4')
- [ ] Props opcionais: `interval`, `showIntervalTabs`, `height`, `className`
- [ ] Implementar script embed
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Suportar dark/light theme
- [ ] **Importante:** Não usar lazy loading (exibir imediatamente para análise)

### 4.4 Validação (20min)
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Teste browser: PETR4 mostrando Buy/Sell/Neutral
- [ ] Console: 0 erros
- [ ] Performance: < 1.5s carregamento
- [ ] Validar recomendações: Buy/Sell/Neutral exibidos corretamente

---

## ⏳ WIDGET 5: ECONOMICCALENDAR (1 HORA)

**Descrição:** Calendário de eventos econômicos (Fed, Copom, PIB, inflação)

### 5.1 Pesquisa (15min)
- [ ] Ler doc oficial: https://www.tradingview.com/widget/events/
- [ ] Analisar parâmetros: `countries`, `importanceFilter`, `currencyFilter`
- [ ] Testar exemplos no browser

### 5.2 Types e Constants (15min)
- [ ] Adicionar `EconomicCalendarConfig` interface em `types.ts`
  ```typescript
  export interface EconomicCalendarConfig extends BaseWidgetConfig {
    countries?: string[]; // Ex: ['BR', 'US', 'EU']
    importanceFilter?: '0,1' | '1' | '0'; // 0=Low, 1=High
    currencyFilter?: string; // Ex: 'BRL,USD,EUR'
    isTransparent?: boolean;
    width?: string | number;
    height?: string | number;
  }
  ```

- [ ] Adicionar constantes em `constants.ts`
  ```typescript
  export const ECONOMIC_CALENDAR_COUNTRIES = ['BR', 'US', 'EU', 'CN'] as const;
  export const ECONOMIC_CALENDAR_IMPORTANCE_HIGH = '1';
  ```

### 5.3 Componente React (20min)
- [ ] Criar `frontend/src/components/tradingview/widgets/EconomicCalendar.tsx`
- [ ] Props: `countries`, `importanceFilter`, `height`, `className`
- [ ] Default: countries=['BR'], importanceFilter='1' (apenas High importance)
- [ ] Implementar script embed
- [ ] Adicionar ErrorBoundary wrapper
- [ ] Suportar dark/light theme
- [ ] Lazy loading (useWidgetLazyLoad)

### 5.4 Validação (10min)
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Teste browser: Eventos Brazil High importance exibidos
- [ ] Console: 0 erros
- [ ] Performance: < 2s carregamento

---

## 📚 DOCUMENTAÇÃO (2 HORAS)

### README.md TradingView (1h)
- [ ] Adicionar seção **Widgets P1**
- [ ] Exemplo de uso MarketOverview
  ```tsx
  import { MarketOverview } from '@/components/tradingview/widgets/MarketOverview';

  export default function DashboardPage() {
    return (
      <div>
        <h1>Dashboard</h1>
        <MarketOverview height={500} />
      </div>
    );
  }
  ```

- [ ] Exemplo de uso Screener
- [ ] Exemplo de uso TechnicalAnalysis
- [ ] Exemplo de uso EconomicCalendar
- [ ] Screenshots de cada widget (5 PNGs)
- [ ] Troubleshooting atualizado

### VALIDACAO_FASE_36.2.md (30min)
- [ ] Criar documento completo (10+ seções)
- [ ] Resumo Executivo
- [ ] Widgets Implementados (detalhes)
- [ ] Validações MCP (Playwright + Chrome DevTools)
- [ ] Testes de Performance
- [ ] Screenshots (5+ evidências)
- [ ] Métricas de Qualidade
- [ ] Próximos Passos

### ROADMAP.md (15min)
- [ ] Adicionar entrada **FASE 36.2**
- [ ] Status: ✅ 100% COMPLETO
- [ ] Data: 2025-11-20
- [ ] Widgets implementados: 5/5
- [ ] Commits: hash + mensagem
- [ ] Próximos passos: FASE 36.3

### ARCHITECTURE.md (15min)
- [ ] Atualizar seção **Frontend - TradingView Widgets**
- [ ] Adicionar widgets P1 implementados
- [ ] Diagrama de componentes (se necessário)

---

## 🧪 TESTES E VALIDAÇÃO (2 HORAS)

### Playwright MCP (1h)
- [ ] Navegação: http://localhost:3100/dashboard
- [ ] Snapshot: MarketOverview renderizado
- [ ] Interação: Trocar tabs (Brasil → Ações → Crypto)
- [ ] Screenshot: `FASE_36.2_MARKET_OVERVIEW.png`
- [ ] Screener: Clicar headers para ordenar
- [ ] Screenshot: `FASE_36.2_SCREENER.png`
- [ ] TechnicalAnalysis: Mudar símbolo (PETR4 → VALE3)
- [ ] Screenshot: `FASE_36.2_TECHNICAL_ANALYSIS.png`
- [ ] EconomicCalendar: Scroll eventos
- [ ] Screenshot: `FASE_36.2_ECONOMIC_CALENDAR.png`
- [ ] Console: 0 erros

### Chrome DevTools MCP (30min)
- [ ] Console messages: 0 errors
- [ ] Network requests: Todos 200 OK
  - [ ] GET https://s3.tradingview.com/... → 200
  - [ ] GET https://s.tradingview.com/... → 200
- [ ] Performance: Timeline < 3s
- [ ] Screenshot: `FASE_36.2_CHROME_DEVTOOLS_VALIDACAO.png`

### Lighthouse (30min)
- [ ] Performance Score: > 90
- [ ] First Contentful Paint: < 1.5s
- [ ] Time to Interactive: < 3.5s
- [ ] Cumulative Layout Shift: < 0.1

---

## 🔄 GIT E DEPLOY

### Pre-Commit
- [ ] TypeScript backend: `cd backend && npx tsc --noEmit` → 0 erros
- [ ] TypeScript frontend: `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] Build backend: `cd backend && npm run build` → Success
- [ ] Build frontend: `cd frontend && npm run build` → Success
- [ ] ESLint: `cd frontend && npm run lint` → 0 warnings
- [ ] Git status: Apenas arquivos intencionais

### Commit
```bash
git add frontend/src/components/tradingview/widgets/*.tsx \
        frontend/src/components/tradingview/types.ts \
        frontend/src/components/tradingview/constants.ts \
        VALIDACAO_FASE_36.2.md \
        ROADMAP.md \
        README.md

git commit -m "$(cat <<'EOF'
feat(tradingview): FASE 36.2 - Implementar 5 Widgets P1

**Widgets Implementados:**
- ✅ TickerTape (validado)
- ✅ MarketOverview (tabs Brasil/Ações/Crypto)
- ✅ Screener (screener B3 completo)
- ✅ TechnicalAnalysis (Buy/Sell recomendações)
- ✅ EconomicCalendar (eventos macroeconômicos)

**Arquivos Criados:**
- widgets/MarketOverview.tsx (+XXX linhas)
- widgets/Screener.tsx (+XXX linhas)
- widgets/TechnicalAnalysis.tsx (+XXX linhas)
- widgets/EconomicCalendar.tsx (+XXX linhas)
- types.ts (+XX linhas)
- constants.ts (+XX linhas)

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success
- ✅ Playwright MCP: 15 testes aprovados
- ✅ Chrome DevTools MCP: 0 erros console
- ✅ Lighthouse: > 90 performance

**Documentação:**
- VALIDACAO_FASE_36.2.md (criado)
- ROADMAP.md (atualizado)
- README.md (atualizado)

🎉 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Push
- [ ] `git push origin main`
- [ ] Verificar remote atualizado
- [ ] Testar Claude Code Web (acesso ao projeto)

---

## 📊 MÉTRICAS DE SUCESSO

**Critérios de Aceitação (100% ou 0%):**
```
✅ Widgets Implementados: 5/5 (100%)
✅ TypeScript Errors: 0
✅ Build Errors: 0
✅ Console Errors: 0 (críticos)
✅ Lighthouse Performance: > 90
✅ Playwright Testes: ≥ 15 aprovados
✅ Chrome DevTools: 100% OK
✅ Documentação: 4 arquivos atualizados
✅ Git: Commits convencionais + push
```

---

## 🚀 PRÓXIMOS PASSOS (PÓS FASE 36.2)

1. **FASE 36.3:** Widgets P2 (17 widgets restantes) - 10h
2. **FASE 36.4:** Soluções Completas (Stocks/Crypto/Forex dashboards) - 8h
3. **FASE 36.5:** Integração Páginas Existentes - 6h
4. **FASE 36.6:** Páginas Novas (12 páginas) - 12h
5. **FASE 36.7:** Performance + CSP - 6h
6. **FASE 36.8:** Testes E2E + Validação Tripla MCP - 20h

**Total FASE 36:** 78 horas (10 semanas @ 8h/semana)

---

**FIM DO TODO - FASE 36.2**

**Criado:** 2025-11-20
**Atualizado:** 2025-11-20
**Responsável:** Claude Code (Sonnet 4.5)
