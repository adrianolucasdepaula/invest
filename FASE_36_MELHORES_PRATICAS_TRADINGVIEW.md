# FASE 36 - Melhores Práticas TradingView Widgets (2025)

**Data:** 2025-11-20
**Pesquisa:** WebSearch + análise arquivos existentes
**Status:** ✅ Validado

---

## 📚 FONTES CONSULTADAS

### WebSearch (3 queries - 2025)
1. "TradingView widgets best practices 2025 production React"
2. "TradingView widgets Next.js implementation performance optimization 2025"
3. "TradingView lightweight charts vs widgets comparison 2025"

### Análise Interna
- `useTradingViewWidget.ts` (308 linhas) - Hook genérico
- `widgetConfigBuilder.ts` (305 linhas) - Fluent API
- `symbolFormatter.ts` (293 linhas) - B3 formatting
- `performanceMonitor.ts` (345 linhas) - Performance tracking

---

## ✅ DECISÃO TÉCNICA: Widgets (não Lightweight Charts)

### Lightweight Charts vs Widgets

| Critério | Lightweight Charts | **TradingView Widgets** ✅ |
|----------|-------------------|---------------------------|
| **Tamanho** | 45 KB (small) | ~200 KB (iframe embed) |
| **Data Source** | Self-hosted (custom) | TradingView servers (B3 incluído) |
| **Complexidade** | Alta (requer data feed) | Baixa (embed direto) |
| **Customização** | Máxima (código aberto) | Limitada (props configuráveis) |
| **Manutenção** | Alta (atualizar data) | Baixa (TradingView mantém) |
| **Custo** | Grátis + infra data feed | Grátis (hosted) |
| **B3 Data** | Precisa implementar | Incluído ✅ |

**Escolha Final:** **Widgets** - Dados B3 incluídos, menos complexidade, mais rápido implementar.

---

## 🏗️ ARQUITETURA VALIDADA (FASE 36.1)

Nossa infraestrutura atual **JÁ IMPLEMENTA** as melhores práticas do mercado:

### ✅ 1. Singleton Script Loading
```typescript
// useTradingViewWidget.ts (lines 40-69)
let scriptPromise: Promise<void> | null = null;

export function loadTradingViewScript(): Promise<void> {
  if (scriptPromise) {
    return scriptPromise; // Reuse promise
  }

  scriptPromise = new Promise((resolve, reject) => {
    if ((window as any).TradingView) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TradingView script'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}
```

**✅ Benefício:** Carrega script **apenas 1 vez**, múltiplos widgets reusam.

---

### ✅ 2. Memory Cleanup (useEffect)
```typescript
// useTradingViewWidget.ts (lines 182-188)
useEffect(() => {
  if (shouldLoad) {
    createWidget();
  }

  return () => {
    if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
      widgetRef.current.remove(); // Cleanup
      widgetRef.current = null;
    }
  };
}, [shouldLoad, createWidget]);
```

**✅ Benefício:** Previne memory leaks ao desmontar componente.

---

### ✅ 3. Lazy Loading (Intersection Observer)
```typescript
// useWidgetLazyLoad.ts (lines 85-112)
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasLoaded(true); // One-time load
        if (onVisibleRef.current) onVisibleRef.current();
      }
    });
  },
  { root, rootMargin, threshold }
);

observer.observe(element);
```

**✅ Benefício:** Widgets carregam **apenas quando visíveis** (performance).

---

### ✅ 4. Performance Monitoring
```typescript
// performanceMonitor.ts (lines 100-118)
recordWidget(metrics: WidgetPerformanceMetrics): void {
  this.metrics.get(widgetName)!.push(metrics);

  const level = this.getPerformanceLevel(metrics.loadDuration || 0);
  if (level === 'poor' || level === 'critical') {
    console.warn(
      `[PerformanceMonitor] ${widgetName} loaded slowly (${metrics.loadDuration}ms)`
    );
  }
}

getPerformanceLevel(loadDuration: number): PerformanceLevel {
  if (loadDuration < 1000) return 'good';       // < 1s
  else if (loadDuration < 2000) return 'moderate'; // 1-2s
  else if (loadDuration < 5000) return 'poor';    // 2-5s
  else return 'critical';                         // > 5s
}
```

**✅ Benefício:** Detecta widgets lentos automaticamente.

---

### ✅ 5. Type Safety (TypeScript Strict)
```typescript
// types.ts - 843 linhas
export interface BaseTradingViewProps {
  theme?: TradingViewTheme;
  locale?: TradingViewLocale;
  autosize?: boolean;
  width?: number | string;
  height?: number | string;
  container_id?: string;
  lazyLoad?: boolean;
}

// 33 widget-specific interfaces
export interface TickerTapeProps extends BaseTradingViewProps { /* ... */ }
export interface MarketOverviewProps extends BaseTradingViewProps { /* ... */ }
// ... 31 more
```

**✅ Benefício:** 100% type safety, autocomplete, zero runtime errors de tipos.

---

### ✅ 6. Fluent API (Config Builder)
```typescript
// widgetConfigBuilder.ts (lines 35-147)
const config = new WidgetConfigBuilder<TickerTapeProps>()
  .setTheme('dark')
  .setLocale('pt_BR')
  .setAutosize(true)
  .addCustomProp('showSymbolLogo', true)
  .build();
```

**✅ Benefício:** Configuração legível, imutável (clone), validável.

---

### ✅ 7. B3 Symbol Formatting
```typescript
// symbolFormatter.ts (lines 28-46)
formatB3ToTradingView('PETR4')
// → "BMFBOVESPA:PETR4"

parseTradingViewToB3('BMFBOVESPA:PETR4')
// → "PETR4"

isValidB3Ticker('PETR4') // → true
isValidB3Ticker('INVALID') // → false
```

**✅ Benefício:** Conversão automática, validação, normalização.

---

## 🚀 MELHORIAS IDENTIFICADAS (aplicar na FASE 36.2+)

### 1. Usar `next/script` Component (Next.js 14 otimizado)

**❌ Atual (createElement manual):**
```typescript
// useTradingViewWidget.ts (lines 56-60)
const script = document.createElement('script');
script.src = 'https://s3.tradingview.com/tv.js';
script.onload = () => resolve();
document.head.appendChild(script);
```

**✅ Melhor Prática (next/script):**
```typescript
// app/layout.tsx (global script)
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Script
          src="https://s3.tradingview.com/tv.js"
          strategy="beforeInteractive" // Carrega antes de hidration
          onLoad={() => console.log('[TradingView] Script loaded')}
          onError={() => console.error('[TradingView] Script failed')}
        />
        {children}
      </body>
    </html>
  );
}
```

**Benefícios:**
- ✅ Otimização automática do Next.js (preload, prefetch)
- ✅ Strategy: beforeInteractive/afterInteractive/lazyOnload
- ✅ Menos código (não precisa singleton manual)
- ✅ SSR-safe (Next.js gerencia)

**Aplicar em:** FASE 36.2 (antes de criar primeiro widget)

---

### 2. Error Boundary por Widget

**Problema Identificado:** Se 1 widget falhar, pode quebrar toda a página.

**Solução:**
```typescript
// components/tradingview/ErrorBoundary.tsx (criar)
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  widgetName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[TradingView] ${this.props.widgetName} crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500 rounded bg-red-50 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            Widget "{this.props.widgetName}" failed to load
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Uso:**
```tsx
<WidgetErrorBoundary widgetName="TickerTape">
  <TickerTape symbols={symbols} />
</WidgetErrorBoundary>
```

**Aplicar em:** FASE 36.2 (criar ErrorBoundary antes de widgets)

---

### 3. Memoização de Configs (evitar re-renders)

**Problema Identificado:** Pesquisa indicou re-rendering ao mudar símbolo.

**Solução:**
```typescript
// TickerTape.tsx (exemplo)
'use client';

import { useMemo } from 'react';
import { useTradingViewWidget } from '@/hooks/useTradingViewWidget';

export function TickerTape({ symbols }: { symbols: string[] }) {
  // ✅ Memoize config (só recria se symbols mudar)
  const config = useMemo(() => ({
    symbols: symbols.map(s => ({ proName: s, title: s })),
    showSymbolLogo: true,
    isTransparent: false, // Evita dark mode issue
    colorTheme: 'dark',
  }), [symbols]);

  const { containerId, status } = useTradingViewWidget({
    widgetName: 'TickerTape',
    widgetConfig: config,
  });

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'error') return <div>Error loading widget</div>;

  return <div id={containerId} />;
}

export default React.memo(TickerTape); // ✅ Memo no component
```

**Benefícios:**
- ✅ Config só recria se dependencies mudarem
- ✅ Component não re-renderiza se props não mudarem
- ✅ Previne re-mount desnecessário do widget

**Aplicar em:** Todos os widgets (FASE 36.2+)

---

### 4. isTransparent: false (evitar dark mode issue)

**Problema Identificado:** Pesquisa indicou que `isTransparent: true` causa background claro em dark mode.

**Solução:**
```typescript
// Sempre usar isTransparent: false
const config = {
  isTransparent: false, // ✅ Evita bug dark mode
  colorTheme: theme === 'dark' ? 'dark' : 'light',
};
```

**Aplicar em:** Todos os widgets (FASE 36.2+)

---

### 5. Key Prop Estável (evitar remounts)

**Problema Identificado:** Widgets podem remontar se key mudar desnecessariamente.

**Solução:**
```tsx
// ❌ ERRADO: Key baseado em data (muda sempre)
<TickerTape key={Date.now()} symbols={symbols} />

// ✅ CORRETO: Key baseado em símbolos (estável)
<TickerTape key={symbols.join('-')} symbols={symbols} />

// ✅ MELHOR: Sem key (se não há lista)
<TickerTape symbols={symbols} />
```

**Aplicar em:** Todos os widgets (FASE 36.2+)

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO (cada widget)

### Pré-Implementação
- [ ] Ler documentação oficial TradingView do widget
- [ ] Identificar props obrigatórias vs opcionais
- [ ] Definir símbolos B3 default (usar constants.ts)
- [ ] Planejar onde será usado (dashboard/screener/asset page)

### Implementação
- [ ] Criar interface TypeScript (já existe em types.ts)
- [ ] Envolver em `<WidgetErrorBoundary>`
- [ ] Usar `useTradingViewWidget` hook
- [ ] Memoizar config com `useMemo`
- [ ] Aplicar `React.memo` no component
- [ ] Usar `isTransparent: false`
- [ ] Integrar com `useTradingViewTheme` (dark/light)
- [ ] Adicionar lazy loading se fora do viewport inicial

### Validação
- [ ] TypeScript: 0 erros
- [ ] ESLint: 0 warnings
- [ ] Build: Success
- [ ] Teste visual: widget renderiza corretamente
- [ ] Teste dark/light mode toggle
- [ ] Teste lazy loading (scroll)
- [ ] Teste error boundary (simular falha)
- [ ] Performance: load time < 2s (moderate)

---

## 🎯 PRIORIZAÇÃO WIDGETS (FASE 36.2)

### Priority 1 (P1) - Widgets Essenciais
1. **TickerTape** (header global) - 2.5h
   - Símbolos: 10 blue chips B3 (constants.ts)
   - Posição: Header (sticky top)
   - Lazy: Não (always visible)

2. **MarketOverview** (dashboard tabs) - 2.5h
   - Abas: B3 Stocks, Cripto, Forex
   - Posição: Dashboard central
   - Lazy: Sim (intersection observer)

3. **Screener** (screener completo) - 2h
   - Filtros: Sector, Market Cap, P/E, Dividend Yield
   - Posição: Página /screener
   - Lazy: Não (página dedicada)

4. **TechnicalAnalysis** (Buy/Sell recomendações) - 2h
   - Símbolo: Asset page (PETR4, VALE3, etc)
   - Posição: Asset page sidebar
   - Lazy: Sim (below fold)

5. **EconomicCalendar** (calendário macroeconômico) - 1h
   - Posição: Dashboard bottom ou página /economy
   - Lazy: Sim (below fold)

**Total P1:** 10 horas

---

## 📚 REFERÊNCIAS

### Documentação Oficial
- https://www.tradingview.com/widget-docs/ (oficial)
- https://www.tradingview.com/widget/advanced-chart/ (Advanced Chart)
- https://www.tradingview.com/free-charting-libraries/ (overview)

### Stack Overflow (2024-2025)
- https://stackoverflow.com/questions/70387089/how-to-use-tradingview-widgets-in-a-react-component
- https://stackoverflow.com/questions/76709837/insert-tradingview-widget-into-nextjs
- https://stackoverflow.com/questions/72422015/nextjs-script-tradingview-widget-configuration

### NPM Packages (alternativas avaliadas, NÃO usadas)
- `react-ts-tradingview-widgets` (mantida, TypeScript)
- `react-tradingview-widget` (popular, re-render issues)
- `react-tradingview-embed` (TypeScript support)

**Decisão:** Implementação manual com hooks próprios (maior controle, zero-tolerance).

---

## ✅ CONCLUSÃO

**Infraestrutura FASE 36.1 está SÓLIDA:**
- ✅ Singleton script loading
- ✅ Memory cleanup
- ✅ Lazy loading (Intersection Observer)
- ✅ Performance monitoring
- ✅ Type safety 100%
- ✅ Fluent API (config builder)
- ✅ B3 symbol formatting

**Melhorias para FASE 36.2+:**
- ✅ Usar `next/script` (global loading)
- ✅ Error boundary por widget
- ✅ Memoização configs/components
- ✅ `isTransparent: false` sempre
- ✅ Keys estáveis

**Próximo passo:** Criar TodoWrite detalhado FASE 36.2.1 (TickerTape).

---

**Documento criado:** 2025-11-20
**Status:** ✅ Validado
**Aplicar em:** FASE 36.2 (P1 Widgets)
