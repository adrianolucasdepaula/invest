# FASE 36.2.1 - TickerTape Widget: Decisões Técnicas

**Data:** 2025-11-20
**Widget:** TickerTape (primeiro P1)
**Status:** ✅ PRÉ-IMPLEMENTAÇÃO COMPLETO

---

## 📋 DOCUMENTAÇÃO OFICIAL ANALISADA

### Fonte
- **URL:** https://www.tradingview.com/widget-docs/widgets/tickers/ticker-tape/
- **Pesquisa:** WebSearch + WebFetch (2025-11-20)

### Props Oficiais

| Property | Type | Default | Descrição |
|----------|------|---------|-----------|
| **symbols** | Array | 5 símbolos | Array de objetos `{proName, title}` |
| **showSymbolLogo** | Boolean | `true` | Toggle logo do símbolo |
| **isTransparent** | Boolean | `false` | ⚠️ USAR FALSE (bug dark mode) |
| **displayMode** | String | `"adaptive"` | Modo de layout |
| **colorTheme** | String | `"light"` | Theme ("light" ou "dark") |
| **locale** | String | `"en"` | Idioma (24+ suportados) |

### Container Sizing
- **Height padrão:** 100px (fixo)
- **Width padrão:** 100% (responsivo)

---

## ✅ DECISÃO 1: Símbolos Default (11 símbolos)

### Composição
1. **IBOV** (índice principal B3) - SEMPRE PRIMEIRO
2. **10 Blue Chips** (ações mais líquidas)

### Lista Final

```typescript
[
  // 1. ÍNDICE
  {
    proName: 'BMFBOVESPA:IBOV',
    title: 'IBOV'
  },

  // 2-11. BLUE CHIPS (10 ações)
  {
    proName: 'BMFBOVESPA:PETR4',
    title: 'Petrobras PN'
  },
  {
    proName: 'BMFBOVESPA:VALE3',
    title: 'Vale ON'
  },
  {
    proName: 'BMFBOVESPA:ITUB4',
    title: 'Itaú PN'
  },
  {
    proName: 'BMFBOVESPA:BBDC4',
    title: 'Bradesco PN'
  },
  {
    proName: 'BMFBOVESPA:ABEV3',
    title: 'Ambev ON'
  },
  {
    proName: 'BMFBOVESPA:BBAS3',
    title: 'BB ON'
  },
  {
    proName: 'BMFBOVESPA:WEGE3',
    title: 'WEG ON'
  },
  {
    proName: 'BMFBOVESPA:RENT3',
    title: 'Localiza ON'
  },
  {
    proName: 'BMFBOVESPA:B3SA3',
    title: 'B3 ON'
  },
  {
    proName: 'BMFBOVESPA:MGLU3',
    title: 'Magazine Luiza ON'
  }
]
```

### Justificativa
- ✅ **IBOV primeiro:** Padrão do mercado (contexto geral B3)
- ✅ **10 blue chips:** Alta liquidez, representatividade setorial
- ✅ **Diversificação:** Financeiro, Petróleo, Mineração, Consumo, Tecnologia
- ✅ **Dados disponíveis:** Todos existem em `constants.ts` (B3_INDICES + B3_BLUE_CHIPS)

### Código (helper function)

```typescript
// frontend/src/components/tradingview/constants.ts (adicionar)

/**
 * Default symbols for TickerTape widget (IBOV + 10 Blue Chips)
 */
export const TICKERTAPE_DEFAULT_SYMBOLS: TradingViewSymbol[] = [
  // Index first
  { proName: B3_INDICES[0].proName, title: B3_INDICES[0].title },

  // Blue chips (10)
  ...B3_BLUE_CHIPS.map(symbol => ({
    proName: symbol.proName,
    title: symbol.title,
  })),
];
```

---

## ✅ DECISÃO 2: Posicionamento no Layout

### Localização
**Header Global Sticky (sempre visível)**

### Justificativa
- ✅ **Visibilidade máxima:** Usuário sempre vê cotações em tempo real
- ✅ **Padrão do mercado:** Bloomberg, Investing.com, TradingView usam header ticker
- ✅ **Não intrusivo:** Ocupa apenas 100px de altura (fixo)
- ✅ **Scroll independente:** Widget tem scroll horizontal automático

### Implementação

```tsx
// frontend/src/app/layout.tsx (modificar)

import { TickerTape } from '@/components/tradingview/widgets/TickerTape';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* TradingView Script (global) */}
        <Script
          src="https://s3.tradingview.com/tv.js"
          strategy="beforeInteractive"
        />

        {/* TickerTape - Header Sticky */}
        <div className="sticky top-0 z-50 w-full">
          <TickerTape />
        </div>

        {/* Resto do layout */}
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

### CSS (Tailwind)

```tsx
// TickerTape.tsx
<div className="sticky top-0 z-50 w-full h-[100px] bg-white dark:bg-gray-900">
  <div id={containerId} />
</div>
```

**Classes:**
- `sticky top-0`: Sempre no topo ao scrollar
- `z-50`: Acima de outros elementos (header normal é z-40)
- `w-full`: 100% da largura
- `h-[100px]`: Altura fixa TradingView (padrão)
- `bg-white dark:bg-gray-900`: Background para transição suave

---

## ✅ DECISÃO 3: Configuração do Widget

### Props Escolhidos

```typescript
{
  symbols: TICKERTAPE_DEFAULT_SYMBOLS, // 11 símbolos (IBOV + 10 blue chips)
  showSymbolLogo: true,                // ✅ Mostrar logos das empresas
  isTransparent: false,                // ✅ CRÍTICO: evita bug dark mode
  displayMode: 'adaptive',             // Adaptive (padrão TradingView)
  colorTheme: theme,                   // 'dark' ou 'light' (via useTradingViewTheme)
  locale: 'pt_BR',                     // Português Brasil
}
```

### Justificativa Props
- ✅ **showSymbolLogo: true** - Visual mais rico (logos empresas)
- ✅ **isTransparent: false** - Melhores práticas (evita bug dark mode confirmado em pesquisa)
- ✅ **displayMode: adaptive** - Responsivo automático (TradingView gerencia)
- ✅ **colorTheme: dynamic** - Integra com next-themes (useTradingViewTheme hook)
- ✅ **locale: pt_BR** - Plataforma brasileira (B3 AI Analysis)

---

## ✅ DECISÃO 4: Lazy Loading

### Estratégia
**NÃO usar lazy loading** (widget sempre visível)

### Justificativa
- ✅ **Sticky top:** Widget SEMPRE visível (não há "scroll até aparecer")
- ✅ **Performance OK:** TickerTape é leve (~200KB iframe)
- ✅ **Prioridade alta:** Usuário espera ver cotações imediatamente
- ✅ **Script global:** TradingView script já carregado via `next/script` (beforeInteractive)

### Código

```tsx
// TickerTape.tsx (NÃO usar useWidgetLazyLoad)
const { containerId, status } = useTradingViewWidget({
  widgetName: 'TickerTape',
  widgetConfig: config,
  lazyLoad: false, // ✅ Sempre carregar
});
```

---

## ✅ DECISÃO 5: Error Boundary

### Implementação
**Envolver em WidgetErrorBoundary** (OBRIGATÓRIO)

### Justificativa
- ✅ **Resiliência:** Se TickerTape falhar, não quebra toda a aplicação
- ✅ **UX:** Mostrar mensagem amigável de erro
- ✅ **Logging:** Capturar erro para debugging (console.error)
- ✅ **Melhores práticas:** Toda biblioteca externa deve ter error boundary

### Código

```tsx
// layout.tsx
import { WidgetErrorBoundary } from '@/components/tradingview/ErrorBoundary';

<WidgetErrorBoundary widgetName="TickerTape">
  <TickerTape />
</WidgetErrorBoundary>
```

---

## ✅ DECISÃO 6: Memoização

### Estratégia
**useMemo para config + React.memo para component**

### Justificativa
- ✅ **Performance:** Config só recria se theme mudar
- ✅ **Previne re-mount:** Widget não recria desnecessariamente
- ✅ **Melhores práticas:** Pesquisa indicou problema de re-rendering em outros projetos

### Código

```tsx
// TickerTape.tsx
'use client';

import { useMemo } from 'react';

export function TickerTape() {
  const { theme } = useTradingViewTheme();

  // ✅ Memoize config (só recria se theme mudar)
  const config = useMemo(() => ({
    symbols: TICKERTAPE_DEFAULT_SYMBOLS,
    showSymbolLogo: true,
    isTransparent: false,
    displayMode: 'adaptive',
    colorTheme: theme,
    locale: 'pt_BR',
  }), [theme]); // ✅ Apenas theme é dependência

  // ... resto do código
}

// ✅ Memo no component (não re-renderiza se props não mudarem)
export default React.memo(TickerTape);
```

---

## 📊 RESUMO DECISÕES

| # | Decisão | Valor Escolhido | Justificativa |
|---|---------|----------------|---------------|
| 1 | **Símbolos** | IBOV + 10 Blue Chips (11 total) | Alta liquidez, representatividade |
| 2 | **Posicionamento** | Header sticky top (z-50) | Visibilidade máxima, padrão mercado |
| 3 | **showSymbolLogo** | `true` | Visual mais rico |
| 4 | **isTransparent** | `false` | ⚠️ CRÍTICO: evita bug dark mode |
| 5 | **colorTheme** | `dynamic (theme)` | Integração next-themes |
| 6 | **locale** | `pt_BR` | Plataforma brasileira |
| 7 | **Lazy Loading** | `false` | Sempre visível (sticky top) |
| 8 | **Error Boundary** | `sim` | Resiliência obrigatória |
| 9 | **Memoização** | `useMemo + React.memo` | Performance + previne re-mount |
| 10 | **Script Loading** | `next/script beforeInteractive` | Otimização Next.js 14 |

---

## 🎯 ARQUIVOS A CRIAR/MODIFICAR

### 1. Criar (SETUP)
- [ ] `frontend/src/components/tradingview/ErrorBoundary.tsx` (novo)
- [ ] `frontend/src/components/tradingview/widgets/TickerTape.tsx` (novo)

### 2. Modificar (SETUP)
- [ ] `frontend/src/app/layout.tsx` (adicionar next/script + TickerTape)
- [ ] `frontend/src/components/tradingview/constants.ts` (adicionar TICKERTAPE_DEFAULT_SYMBOLS)

### 3. Validar
- [ ] TypeScript: 0 erros
- [ ] ESLint: 0 warnings
- [ ] Build: Success
- [ ] Teste visual: Playwright MCP
- [ ] Teste dark/light toggle: Chrome DevTools MCP
- [ ] Performance: < 2s load time

---

## ✅ PRÓXIMOS PASSOS

1. **SETUP:** Migrar script loading para `next/script` (app/layout.tsx)
2. **SETUP:** Criar `WidgetErrorBoundary` component
3. **IMPL:** Criar `TickerTape.tsx` com todas as decisões acima
4. **INT:** Integrar no layout sticky top
5. **VAL:** Validação completa (TypeScript + ESLint + Build + 3 MCPs)
6. **DOCS:** Atualizar ROADMAP.md
7. **GIT:** Commit + Push

---

**Documento criado:** 2025-11-20
**Status:** ✅ PRÉ-IMPLEMENTAÇÃO COMPLETO
**Próxima tarefa:** FASE 2.1 - SETUP (next/script migration)
