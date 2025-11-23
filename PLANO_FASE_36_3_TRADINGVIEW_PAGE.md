# PLANO FASE 36.3 - TradingView Page Completa

**Data:** 2025-11-21
**Branch:** `feature/dashboard-financial-complete` (continuação da FASE 37)
**Status:** 📋 PLANEJAMENTO
**Duração Estimada:** 4-6 horas
**Complexidade:** MÉDIA

---

## 📋 ÍNDICE

1. [Problema a Resolver](#problema-a-resolver)
2. [Contexto Atual](#contexto-atual)
3. [Solução Proposta](#solução-proposta)
4. [Alternativas Consideradas](#alternativas-consideradas)
5. [Arquitetura](#arquitetura)
6. [Arquivos Afetados](#arquivos-afetados)
7. [Implementação Detalhada](#implementação-detalhada)
8. [Riscos e Mitigações](#riscos-e-mitigações)
9. [Validação](#validação)
10. [Critérios de Aceitação](#critérios-de-aceitação)

---

## 1. Problema a Resolver

### Situação Atual

**✅ Widgets TradingView Funcionais:**
- TickerTape: 100% funcional (sticky header em todas as páginas)
- AdvancedChart: 100% funcional (página `/assets/[ticker]`)

**❌ Problemas Identificados:**
1. **Falta de página dedicada para visualização TradingView**
   - Usuários não têm acesso centralizado aos widgets
   - AdvancedChart está apenas na página de ativos individuais
   - Não há documentação de uso para usuários finais

2. **Widgets removidos (não funcionais):**
   - MarketOverview (lazy load issue)
   - Screener (lazy load issue)
   - TechnicalAnalysis (lazy load issue)
   - SymbolOverview (lazy load issue)
   - **Total:** 67% dos widgets planejados foram removidos

3. **Falta de integração com sistema de favoritos:**
   - Usuários não podem salvar combinações de símbolos
   - Não há watchlist integrada

### Objetivo da FASE 36.3

Criar **página dedicada `/tradingview`** com:
- ✅ 2 widgets validados (TickerTape + AdvancedChart)
- ✅ Interface intuitiva para múltiplos gráficos
- ✅ Documentação de uso inline
- ✅ Integração com sistema de favoritos (futuro)

---

## 2. Contexto Atual

### Arquivos Existentes

**Componentes TradingView:**
- `frontend/src/components/tradingview/widgets/TickerTape.tsx` (162 linhas)
- `frontend/src/components/tradingview/widgets/AdvancedChart.tsx` (278 linhas)
- `frontend/src/components/tradingview/ErrorBoundary.tsx`
- `frontend/src/components/tradingview/hooks/useTradingViewWidget.ts`
- `frontend/src/components/tradingview/hooks/useTradingViewTheme.ts`
- `frontend/src/components/tradingview/constants.ts`
- `frontend/src/components/tradingview/types.ts`

**Páginas Existentes:**
- `frontend/src/app/(dashboard)/layout.tsx` - Sidebar com navegação
- `frontend/src/app/(dashboard)/dashboard/page.tsx` - Dashboard principal
- `frontend/src/app/(dashboard)/assets/[ticker]/page.tsx` - Detalhes de ativos (usa AdvancedChart)
- `frontend/src/app/(dashboard)/data-management/page.tsx` - Gerenciamento de dados (criada FASE 35)

**Status de Validação (FASE 36.2.2 - Playwright MCP):**
- ✅ TickerTape: 100% funcional (header sticky)
- ✅ AdvancedChart: 100% funcional (página de ativos)
- ❌ MarketOverview: Tabs carregavam mas dados não renderizavam
- ❌ Screener: Não carregava (lazy load issue)
- ❌ TechnicalAnalysis: Não carregava (lazy load issue)
- ❌ SymbolOverview: Não carregava (lazy load issue)

**Conclusão:** Manter apenas 2 widgets validados (33% success rate).

---

## 3. Solução Proposta

### Arquitetura da Página

```
/tradingview
├── Header Section
│   ├── Título: "Análise TradingView"
│   ├── Descrição: Ferramentas profissionais de análise técnica
│   └── Documentação inline (accordion)
│
├── TickerTape Section (sticky)
│   └── TickerTape widget (IBOV + 10 Blue Chips)
│
├── Multi-Chart Section
│   ├── Symbol Selector (dropdown com símbolos B3)
│   ├── Tabs: "Gráfico 1" | "Gráfico 2" | "Gráfico 3" | "Gráfico 4"
│   └── AdvancedChart widget (1 por tab)
│
└── Footer Section
    ├── Links úteis (TradingView docs)
    └── Disclaimer (dados são de fontes externas)
```

### Features Principais

**1. Multi-Chart View (4 gráficos simultâneos em tabs)**
- Permite comparar múltiplos ativos
- Estado persistente (cada tab mantém símbolo selecionado)
- Lazy loading (apenas tab ativa carrega widget)

**2. Symbol Selector Inteligente**
- Dropdown com símbolos B3 (IBOV + Blue Chips + mais 40 ativos)
- Search/filter functionality
- Sincronização com backend (lista dinâmica de ativos)

**3. Documentação Inline**
- Accordion expansível com guia de uso
- Exemplos de análise técnica
- Keyboard shortcuts
- Troubleshooting comum

**4. Responsividade**
- Desktop: 4 charts visíveis em grid 2x2
- Tablet: 2 charts em grid 1x2
- Mobile: 1 chart por vez (tabs)

---

## 4. Alternativas Consideradas

### Alternativa 1: Página Simples (1 Gráfico Apenas) ❌

**Prós:**
- Mais simples de implementar (~2 horas)
- Menor complexidade de estado

**Contras:**
- Não permite comparação de múltiplos ativos
- UX limitada (precisa navegar entre páginas para ver outros ativos)
- Não justifica criar página dedicada (já existe em `/assets/[ticker]`)

**Decisão:** REJEITADA - não agrega valor suficiente.

---

### Alternativa 2: Multi-Chart com Grid 2x2 (4 Gráficos Simultâneos) ⚠️

**Prós:**
- Visão completa simultânea de 4 ativos
- UX superior (análise comparativa)
- Paridade com TradingView.com

**Contras:**
- Performance crítica (4 widgets carregando simultaneamente)
- Consumo de memória elevado (~200MB por widget × 4 = 800MB)
- TradingView rate limiting (múltiplos requests simultâneos)
- Complexidade de responsividade

**Decisão:** REJEITADA - risco de performance alto.

---

### Alternativa 3: Multi-Chart com Tabs (4 Gráficos, 1 Ativo por Vez) ✅ ESCOLHIDA

**Prós:**
- Performance controlada (apenas 1 widget carregado por vez)
- UX boa (tabs familiares para usuários)
- Lazy loading nativo (React.lazy + Suspense)
- Responsividade simples (sempre 1 chart visível)
- Estado persistente (cada tab mantém símbolo escolhido)

**Contras:**
- Não permite comparação simultânea (precisa alternar tabs)
- Complexidade de gerenciamento de estado (4 símbolos independentes)

**Decisão:** ESCOLHIDA - melhor custo-benefício (UX vs Performance).

**Implementação:**
- Tabs com Shadcn/ui `<Tabs>` component
- Lazy loading com React `<Suspense>` + `React.lazy()`
- Estado em `useState` (4 símbolos independentes)
- Persistência opcional em localStorage (futuro)

---

## 5. Arquitetura

### Estrutura de Componentes

```typescript
// frontend/src/app/(dashboard)/tradingview/page.tsx
TradingViewPage
├── Header
│   ├── Title + Description
│   └── DocumentationAccordion
├── TickerTape (sticky)
├── SymbolSelectorSection
│   └── SymbolDropdown (4 dropdowns, 1 por tab)
└── ChartsSection
    └── Tabs (Shadcn/ui)
        ├── TabsList
        │   ├── TabsTrigger "Gráfico 1"
        │   ├── TabsTrigger "Gráfico 2"
        │   ├── TabsTrigger "Gráfico 3"
        │   └── TabsTrigger "Gráfico 4"
        └── TabsContent (4x)
            └── AdvancedChart (lazy loaded)
```

### Estado da Aplicação

```typescript
// Estado local (não precisa Zustand para isso)
const [symbols, setSymbols] = useState<[string, string, string, string]>([
  'BMFBOVESPA:IBOV',     // Chart 1: Índice
  'BMFBOVESPA:PETR4',    // Chart 2: Blue Chip
  'BMFBOVESPA:VALE3',    // Chart 3: Blue Chip
  'BMFBOVESPA:ITUB4',    // Chart 4: Blue Chip
]);

const [activeTab, setActiveTab] = useState<string>('chart-1');
```

### Fluxo de Dados

```
User selects symbol (dropdown chart 2)
    ↓
setSymbols([...symbols.slice(0, 1), newSymbol, ...symbols.slice(2)])
    ↓
State updates → AdvancedChart re-renders com novo symbol
    ↓
TradingView widget carrega novo símbolo
```

---

## 6. Arquivos Afetados

### Arquivos a Criar (2)

| Arquivo | Linhas (estimativa) | Descrição |
|---------|---------------------|-----------|
| `frontend/src/app/(dashboard)/tradingview/page.tsx` | ~300 | Página principal TradingView |
| `frontend/src/components/tradingview/SymbolSelector.tsx` | ~150 | Dropdown de símbolos B3 |

**Total:** ~450 linhas de código novo

---

### Arquivos a Modificar (2)

| Arquivo | Mudança | Linhas |
|---------|---------|--------|
| `frontend/src/components/layout/sidebar.tsx` | Adicionar rota `/tradingview` | +1 |
| `ROADMAP.md` | Documentar FASE 36.3 | +100 |

**Total:** ~101 linhas modificadas

---

### Arquivos de Documentação (3)

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `PLANO_FASE_36_3_TRADINGVIEW_PAGE.md` | ~600 | Este arquivo (planejamento) |
| `VALIDACAO_FASE_36_3.md` | ~400 | Validação tripla MCP (criado após implementação) |
| `FASE_36_3_CHECKLIST.md` | ~200 | Checklist ultra-robusto |

**Total:** ~1.200 linhas documentação

---

## 7. Implementação Detalhada

### Etapa 1: Criar SymbolSelector Component (~1h)

**Arquivo:** `frontend/src/components/tradingview/SymbolSelector.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { B3_SYMBOLS } from '../constants'; // Lista de ~50 símbolos B3

export interface SymbolSelectorProps {
  value: string; // Formato: "BMFBOVESPA:TICKER"
  onChange: (symbol: string) => void;
  label?: string;
  className?: string;
}

export function SymbolSelector({
  value,
  onChange,
  label = 'Selecionar Ativo',
  className,
}: SymbolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter symbols by search query
  const filteredSymbols = useMemo(() => {
    if (!searchQuery) return B3_SYMBOLS;
    const query = searchQuery.toLowerCase();
    return B3_SYMBOLS.filter(
      (s) =>
        s.ticker.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ticker ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Dropdown */}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um ativo..." />
          </SelectTrigger>
          <SelectContent>
            {filteredSymbols.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum ativo encontrado
              </div>
            ) : (
              filteredSymbols.map((symbol) => (
                <SelectItem key={symbol.proName} value={symbol.proName}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{symbol.ticker}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {symbol.description}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

**Validação:**
- ✅ TypeScript: strict mode compliant
- ✅ Shadcn/ui: usa Select component oficial
- ✅ Acessibilidade: label + aria-attributes
- ✅ Performance: useMemo para filter

---

### Etapa 2: Atualizar Constants com Símbolos B3 (~0.5h)

**Arquivo:** `frontend/src/components/tradingview/constants.ts`

```typescript
// Adicionar ao final do arquivo

/**
 * Lista completa de símbolos B3 para selector
 * (IBOV + Blue Chips + Mid Caps + Small Caps)
 */
export const B3_SYMBOLS = [
  // Índice
  { ticker: 'IBOV', proName: 'BMFBOVESPA:IBOV', description: 'Ibovespa' },

  // Blue Chips (Top 10 por market cap)
  { ticker: 'PETR4', proName: 'BMFBOVESPA:PETR4', description: 'Petrobras PN' },
  { ticker: 'VALE3', proName: 'BMFBOVESPA:VALE3', description: 'Vale ON' },
  { ticker: 'ITUB4', proName: 'BMFBOVESPA:ITUB4', description: 'Itaú Unibanco PN' },
  { ticker: 'BBDC4', proName: 'BMFBOVESPA:BBDC4', description: 'Bradesco PN' },
  { ticker: 'ABEV3', proName: 'BMFBOVESPA:ABEV3', description: 'Ambev ON' },
  { ticker: 'WEGE3', proName: 'BMFBOVESPA:WEGE3', description: 'WEG ON' },
  { ticker: 'B3SA3', proName: 'BMFBOVESPA:B3SA3', description: 'B3 ON' },
  { ticker: 'RENT3', proName: 'BMFBOVESPA:RENT3', description: 'Localiza ON' },
  { ticker: 'RAIL3', proName: 'BMFBOVESPA:RAIL3', description: 'Rumo ON' },
  { ticker: 'SUZB3', proName: 'BMFBOVESPA:SUZB3', description: 'Suzano ON' },

  // ... adicionar mais 40 símbolos (total ~50)
] as const;

export type B3Symbol = typeof B3_SYMBOLS[number];
```

**Fonte de Dados:**
- Backend: GET /api/v1/assets (55 ativos já cadastrados)
- Mapear para formato TradingView: `BMFBOVESPA:TICKER`

---

### Etapa 3: Criar Página TradingView (~2h)

**Arquivo:** `frontend/src/app/(dashboard)/tradingview/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TickerTape } from '@/components/tradingview/widgets/TickerTape';
import { AdvancedChart } from '@/components/tradingview/widgets/AdvancedChart';
import { SymbolSelector } from '@/components/tradingview/SymbolSelector';
import { TrendingUp, Info, ExternalLink } from 'lucide-react';

export default function TradingViewPage() {
  // State: 4 símbolos independentes (1 por chart)
  const [symbols, setSymbols] = useState<[string, string, string, string]>([
    'BMFBOVESPA:IBOV',   // Chart 1: Índice
    'BMFBOVESPA:PETR4',  // Chart 2: Petrobras
    'BMFBOVESPA:VALE3',  // Chart 3: Vale
    'BMFBOVESPA:ITUB4',  // Chart 4: Itaú
  ]);

  const [activeTab, setActiveTab] = useState('chart-1');

  // Helper: atualizar símbolo de um chart específico
  const updateSymbol = (chartIndex: 0 | 1 | 2 | 3, newSymbol: string) => {
    const newSymbols = [...symbols] as [string, string, string, string];
    newSymbols[chartIndex] = newSymbol;
    setSymbols(newSymbols);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <TrendingUp className="mr-3 h-8 w-8" />
            Análise TradingView
          </h1>
          <p className="text-muted-foreground mt-2">
            Ferramentas profissionais de análise técnica com dados em tempo real da B3
          </p>
        </div>

        {/* Documentation Accordion */}
        <Accordion type="single" collapsible className="w-[400px]">
          <AccordionItem value="docs">
            <AccordionTrigger>
              <div className="flex items-center">
                <Info className="mr-2 h-4 w-4" />
                Guia de Uso
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p><strong>TickerTape:</strong> Cotações em tempo real (header fixo)</p>
                <p><strong>Gráficos:</strong> 4 charts independentes com análise técnica completa</p>
                <p><strong>Indicadores:</strong> MA, RSI, MACD, Bollinger Bands e mais</p>
                <p><strong>Ferramentas:</strong> Desenho de linhas, Fibonacci, padrões gráficos</p>
                <a
                  href="https://br.tradingview.com/support/solutions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline mt-4"
                >
                  Documentação Oficial TradingView
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* TickerTape (sticky) */}
      <div className="sticky top-0 z-10">
        <TickerTape />
      </div>

      {/* Multi-Chart Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Tabs Header */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chart-1">Gráfico 1</TabsTrigger>
          <TabsTrigger value="chart-2">Gráfico 2</TabsTrigger>
          <TabsTrigger value="chart-3">Gráfico 3</TabsTrigger>
          <TabsTrigger value="chart-4">Gráfico 4</TabsTrigger>
        </TabsList>

        {/* Chart 1 */}
        <TabsContent value="chart-1" className="space-y-4">
          <SymbolSelector
            value={symbols[0]}
            onChange={(newSymbol) => updateSymbol(0, newSymbol)}
            label="Gráfico 1 - Selecionar Ativo"
          />
          <AdvancedChart symbol={symbols[0]} height={700} />
        </TabsContent>

        {/* Chart 2 */}
        <TabsContent value="chart-2" className="space-y-4">
          <SymbolSelector
            value={symbols[1]}
            onChange={(newSymbol) => updateSymbol(1, newSymbol)}
            label="Gráfico 2 - Selecionar Ativo"
          />
          <AdvancedChart symbol={symbols[1]} height={700} />
        </TabsContent>

        {/* Chart 3 */}
        <TabsContent value="chart-3" className="space-y-4">
          <SymbolSelector
            value={symbols[2]}
            onChange={(newSymbol) => updateSymbol(2, newSymbol)}
            label="Gráfico 3 - Selecionar Ativo"
          />
          <AdvancedChart symbol={symbols[2]} height={700} />
        </TabsContent>

        {/* Chart 4 */}
        <TabsContent value="chart-4" className="space-y-4">
          <SymbolSelector
            value={symbols[3]}
            onChange={(newSymbol) => updateSymbol(3, newSymbol)}
            label="Gráfico 4 - Selecionar Ativo"
          />
          <AdvancedChart symbol={symbols[3]} height={700} />
        </TabsContent>
      </Tabs>

      {/* Footer Disclaimer */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p>
          <strong>Disclaimer:</strong> Os dados exibidos são fornecidos por TradingView e podem
          apresentar atrasos. Esta ferramenta é apenas para análise técnica e não constitui
          recomendação de investimento.
        </p>
      </div>
    </div>
  );
}
```

**Validação:**
- ✅ TypeScript: strict mode compliant
- ✅ React: hooks corretos (useState, nenhum useEffect necessário)
- ✅ Shadcn/ui: Tabs + Accordion components
- ✅ Lazy loading: Apenas tab ativa renderiza AdvancedChart
- ✅ Estado: 4 símbolos independentes gerenciados corretamente

---

### Etapa 4: Adicionar Rota no Sidebar (~0.5h)

**Arquivo:** `frontend/src/components/layout/sidebar.tsx`

```typescript
// Adicionar após a linha de "Gerenciamento de Dados"

import { TrendingUp } from 'lucide-react';

const navigation = [
  // ... rotas existentes
  { name: 'Gerenciamento de Dados', href: '/data-management', icon: RefreshCw },
  { name: 'TradingView', href: '/tradingview', icon: TrendingUp },  // ✅ NOVO
  { name: 'OAuth Manager', href: '/oauth-manager', icon: Shield },
  // ... resto das rotas
];
```

---

## 8. Riscos e Mitigações

### Risco 1: Performance (TradingView Widget Loading)

**Descrição:** Widget TradingView é pesado (~50MB initial load, ~200MB memory footprint).

**Probabilidade:** ALTA (100%)
**Impacto:** MÉDIO (UX degradada se todos os 4 charts carregarem simultaneamente)

**Mitigação:**
- ✅ Lazy loading com Tabs (apenas 1 chart ativo por vez)
- ✅ React.lazy + Suspense para code splitting
- ✅ Evitar re-renders desnecessários (useMemo nos configs)
- ✅ Monitoramento de performance (Performance API)

**Teste de Validação:**
- Playwright: Alternar entre 4 tabs rapidamente (verificar memory leaks)
- Chrome DevTools: Performance panel (verificar FPS drop)

---

### Risco 2: Rate Limiting TradingView API

**Descrição:** TradingView pode bloquear requests se múltiplos widgets carregarem em < 1s.

**Probabilidade:** BAIXA (10%)
**Impacto:** CRÍTICO (widgets param de funcionar)

**Mitigação:**
- ✅ Tabs garantem 1 request por vez (usuário precisa clicar)
- ✅ Delay de 500ms entre mudanças de símbolo (debounce no onChange)
- ✅ Error boundary captura erros de rate limit
- ✅ Retry automático com exponential backoff (hook useTradingViewWidget)

**Teste de Validação:**
- Alternar símbolos 10x em < 5s
- Verificar console errors (403/429 HTTP)

---

### Risco 3: Conflito de Temas (Dark/Light Mode)

**Descrição:** TradingView widgets podem não sincronizar tema corretamente.

**Probabilidade:** MÉDIA (30%)
**Impacto:** BAIXO (UX ruim mas não quebra funcionalidade)

**Mitigação:**
- ✅ useTradingViewTheme hook já implementado (FASE 36.1)
- ✅ Listener de mudança de tema (`next-themes` integration)
- ✅ Forçar re-render de widget ao trocar tema (useEffect)

**Teste de Validação:**
- Playwright: Toggle dark/light mode 3x (verificar widget acompanha)

---

### Risco 4: TypeScript Errors (Type Safety)

**Descrição:** Novos componentes podem introduzir type errors.

**Probabilidade:** BAIXA (5%)
**Impacto:** BLOQUEANTE (build quebrado)

**Mitigação:**
- ✅ Strict mode habilitado (tsconfig.json)
- ✅ Validação após cada etapa (npx tsc --noEmit)
- ✅ Interfaces bem definidas (SymbolSelectorProps, B3Symbol)

**Teste de Validação:**
- `npx tsc --noEmit` (backend + frontend) - 0 erros obrigatório

---

## 9. Validação

### Validação Tripla MCP (Obrigatória)

**1. Playwright MCP - UI + Interação**
```typescript
// Test Cases
1. Abrir /tradingview → Snapshot UI (TickerTape + Tabs + Chart 1)
2. Clicar Tab "Gráfico 2" → Verifica troca de chart
3. Clicar SymbolSelector → Escolher PETR4 → Verifica widget atualiza
4. Toggle dark/light mode → Verifica tema sincroniza
5. Abrir accordion "Guia de Uso" → Verifica documentação inline
6. Screenshot de evidência (fullPage)
```

**2. Chrome DevTools MCP - Console + Network + Performance**
```typescript
// Validações
1. Console messages: 0 errors (warnings TradingView esperados OK)
2. Network requests:
   - TradingView script: 200 OK
   - Widget data requests: 200 OK
3. Performance:
   - FPS > 30 ao alternar tabs
   - Memory < 500MB com 4 charts carregados (1 por tab)
4. Payload validation:
   - Símbolos corretos sendo solicitados
```

**3. Sequential Thinking MCP - Análise Profunda**
```typescript
// Pontos de Análise
1. Lógica de estado (4 símbolos independentes)
2. Lazy loading (apenas tab ativa renderiza)
3. Performance bottlenecks (TradingView script load)
4. Validação de tipos (TypeScript strict)
5. Acessibilidade (ARIA labels, keyboard navigation)
6. Documentação inline (guia de uso completo)
```

---

### Critérios de Qualidade (Zero Tolerance)

```bash
✅ TypeScript Errors: 0/0 (backend + frontend)
✅ ESLint Warnings: 0/0
✅ Build Status: Success (18 páginas compiladas - +1 /tradingview)
✅ Console Errors: 0/0 (páginas principais)
✅ HTTP Errors: 0/0 (TradingView requests 200 OK)
✅ Performance: FPS > 30, Memory < 500MB
✅ Accessibility: WAVE 0 errors
```

---

## 10. Critérios de Aceitação

### Funcionalidades Essenciais ✅

- [ ] **Página `/tradingview` acessível via sidebar**
- [ ] **TickerTape visível no topo (sticky)**
- [ ] **4 Tabs funcionais** ("Gráfico 1" até "Gráfico 4")
- [ ] **SymbolSelector funcional** (dropdown com 50+ símbolos B3)
- [ ] **Search/Filter no selector** (busca por ticker ou nome)
- [ ] **AdvancedChart renderiza corretamente** em cada tab
- [ ] **Estado persistente** (cada tab mantém símbolo escolhido)
- [ ] **Lazy loading** (apenas tab ativa carrega widget)
- [ ] **Dark/Light mode sincronizado**
- [ ] **Documentação inline** (accordion com guia de uso)
- [ ] **Disclaimer no footer**

---

### Performance ✅

- [ ] **Initial load < 3s** (página completa com TickerTape)
- [ ] **Tab switch < 500ms** (troca entre charts)
- [ ] **Symbol change < 1s** (atualização de widget)
- [ ] **Memory < 500MB** (4 charts carregados via tabs)
- [ ] **FPS > 30** (alternar tabs rapidamente)

---

### Qualidade de Código ✅

- [ ] **TypeScript: 0 erros** (strict mode compliant)
- [ ] **ESLint: 0 warnings**
- [ ] **Build: Success** (18 páginas compiladas)
- [ ] **Console: 0 errors** (warnings TradingView esperados OK)
- [ ] **Acessibilidade: WAVE 0 errors**

---

### Documentação ✅

- [ ] **ROADMAP.md atualizado** (seção FASE 36.3)
- [ ] **VALIDACAO_FASE_36_3.md criado** (validação tripla MCP)
- [ ] **FASE_36_3_CHECKLIST.md criado** (checklist ultra-robusto)
- [ ] **Screenshots capturados** (2-3 evidências)
- [ ] **Commit message detalhado** (Conventional Commits)

---

### Git ✅

- [ ] **Commit criado** com mensagem detalhada
- [ ] **Push realizado** para branch `feature/dashboard-financial-complete`
- [ ] **Pull Request atualizado** (#4 com novas mudanças)

---

## 🎯 Cronograma de Implementação

| Etapa | Duração | Status |
|-------|---------|--------|
| **1. SymbolSelector Component** | 1h | ⏳ PENDENTE |
| **2. Atualizar Constants B3_SYMBOLS** | 0.5h | ⏳ PENDENTE |
| **3. Criar Página TradingView** | 2h | ⏳ PENDENTE |
| **4. Adicionar Rota no Sidebar** | 0.5h | ⏳ PENDENTE |
| **5. Validação TypeScript + Build** | 0.5h | ⏳ PENDENTE |
| **6. Validação Tripla MCP** | 1h | ⏳ PENDENTE |
| **7. Documentação** | 0.5h | ⏳ PENDENTE |
| **8. Commit + Push** | 0.5h | ⏳ PENDENTE |
| **TOTAL** | **6.5h** | ⏳ PENDENTE |

---

## 📋 Checklist Pré-Execução (OBRIGATÓRIO)

Antes de iniciar a implementação, validar:

- [ ] **FASE 37 está 100% completa e mergeada?** (NÃO - PR #4 aberta)
- [ ] **Branch está limpa?** (`git status` apenas arquivos intencionais)
- [ ] **Serviços rodando?** (frontend + backend healthy)
- [ ] **Aprovação do usuário obtida?** (confirmar se deve iniciar FASE 36.3)

---

## 🚀 Próximos Passos

**Após Aprovação do Usuário:**

1. ✅ Executar etapas 1-8 conforme cronograma
2. ✅ Validar cada etapa (TypeScript + Build)
3. ✅ Validação tripla MCP (Playwright + Chrome DevTools + Sequential Thinking)
4. ✅ Documentar resultados (VALIDACAO_FASE_36_3.md)
5. ✅ Commit + Push + Atualizar PR #4

**Decisão a Tomar:**
- Implementar FASE 36.3 agora OU
- Fazer merge de FASE 37 primeiro OU
- Priorizar outra fase (FASE 25, FASE 38, etc)

---

**Planejamento criado por:** Claude Code (Sonnet 4.5)
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP
**Data:** 2025-11-21

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
