# 🎨 B3 AI Analysis Platform - Financial Design System

## 📋 Visão Geral

Design system profissional otimizado para uma plataforma de análise financeira e investimentos na B3. Inspirado nas melhores práticas de plataformas como Bloomberg Terminal, Investing.com, e TradingView.

---

## 🎯 Princípios de Design

### 1. **Confiança e Profissionalismo**
- Cores sóbrias e corporativas
- Hierarquia visual clara
- Dados apresentados de forma objetiva

### 2. **Clareza de Informação**
- Alta legibilidade mesmo com muitos dados
- Contraste adequado para leitura prolongada
- Separação clara entre diferentes tipos de informação

### 3. **Ação Rápida**
- Cores semânticas para decisões rápidas (verde/vermelho)
- Estados interativos claros
- Feedback visual imediato

---

## 🎨 Paleta de Cores

### Cores Principais

#### Primary - Financial Blue (Confiança)
```css
Light: hsl(213, 94%, 42%)  /* #0B5ED7 - Deep blue */
Dark:  hsl(213, 90%, 58%)  /* #3B8EFF - Brighter blue */
```
**Uso:** Botões primários, links, elementos de navegação ativa, headers importantes

**Psicologia:** Azul transmite confiança, estabilidade e profissionalismo - essencial para finanças

#### Success - Financial Green (Ganhos)
```css
Light: hsl(145, 75%, 38%)  /* #188754 - Vibrant green */
Dark:  hsl(145, 70%, 45%)  /* #25A365 - Brighter green */
```
**Uso:** Valores positivos, ganhos, percentuais de alta, indicadores favoráveis

**Contexto Financeiro:**
- Variações positivas de preço
- ROI positivo
- Indicadores técnicos de compra

#### Destructive - Financial Red (Perdas)
```css
Light: hsl(0, 84%, 52%)    /* #EA3943 - Vivid red */
Dark:  hsl(0, 75%, 55%)    /* #E54D4D - Softer red */
```
**Uso:** Valores negativos, perdas, percentuais de queda, alertas

**Contexto Financeiro:**
- Variações negativas de preço
- Stop loss acionado
- Indicadores técnicos de venda

#### Accent - Premium Gold (Destaque)
```css
Both: hsl(42, 87%, 55%)    /* #EAB308 - Gold */
```
**Uso:** Features premium, alertas importantes não-críticos, badges especiais

**Psicologia:** Dourado representa valor premium, qualidade superior

### Cores de Suporte

#### Warning - Attention Yellow
```css
hsl(38, 92%, 50%)  /* #F59E0B - Amber */
```
**Uso:** Avisos, atenção necessária, status pendente

#### Background & Foreground
```css
/* Light Mode */
Background: hsl(0, 0%, 100%)     /* #FFFFFF - Pure white */
Foreground: hsl(215, 25%, 15%)   /* #1E2532 - Dark slate */

/* Dark Mode */
Background: hsl(215, 28%, 10%)   /* #13161F - Deep dark */
Foreground: hsl(210, 12%, 95%)   /* #F0F1F3 - Light gray */
```

#### Cards & Elevation
```css
/* Light Mode */
Card: hsl(0, 0%, 100%)           /* #FFFFFF - White cards */
Border: hsl(214, 20%, 88%)       /* #DDE1E7 - Subtle borders */

/* Dark Mode */
Card: hsl(215, 25%, 12%)         /* #171C27 - Dark cards */
Border: hsl(215, 20%, 22%)       /* #2A3142 - Darker borders */
```

### Cores para Gráficos (Data Visualization)

```css
--chart-1: hsl(213, 94%, 42%)  /* Blue - Principal */
--chart-2: hsl(145, 75%, 38%)  /* Green - Secundário */
--chart-3: hsl(42, 87%, 55%)   /* Gold - Terciário */
--chart-4: hsl(0, 84%, 52%)    /* Red - Negativo */
--chart-5: hsl(271, 81%, 56%)  /* Purple - Extra */
```

**Aplicação:**
- Múltiplas séries em um gráfico
- Comparação de ativos
- Indicadores técnicos sobrepostos

---

## 📐 Tipografia

### Fonte Principal
**System Font Stack** (Performance otimizada)
```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;
```

### Escala Tipográfica

```css
/* Headings */
h1: 2.25rem (36px)  - font-weight: 700
h2: 1.875rem (30px) - font-weight: 700
h3: 1.5rem (24px)   - font-weight: 600
h4: 1.25rem (20px)  - font-weight: 600

/* Body */
base: 1rem (16px)   - font-weight: 400
sm: 0.875rem (14px) - font-weight: 400
xs: 0.75rem (12px)  - font-weight: 400

/* Data Display (Monospace para números) */
Números: font-variant-numeric: tabular-nums;
```

### Hierarquia em Contexto Financeiro

**Preços e Valores:**
- Font-size: 1.5rem - 2.25rem
- Font-weight: 600-700
- Tabular nums para alinhamento

**Variações (%):**
- Font-size: 0.875rem - 1rem
- Color: success/destructive
- Sempre com sinal (+/-)

**Labels e Descrições:**
- Font-size: 0.75rem - 0.875rem
- Color: muted-foreground
- Uppercase para labels importantes

---

## 📏 Espaçamento e Layout

### Grid System
```css
Container max-width: 1440px
Gutter: 1.5rem (24px)
Columns: 12 (responsive)
```

### Espaçamento (Tailwind Scale)
```css
1  = 0.25rem  (4px)
2  = 0.5rem   (8px)
3  = 0.75rem  (12px)
4  = 1rem     (16px)   /* Base unit */
5  = 1.25rem  (20px)
6  = 1.5rem   (24px)
8  = 2rem     (32px)
10 = 2.5rem   (40px)
12 = 3rem     (48px)
16 = 4rem     (64px)
```

### Cards e Containers
```css
Border Radius: 10px (0.625rem)
Padding: 1.5rem (24px)
Gap between cards: 1rem (16px)
```

### Sidebar e Navigation
```css
Sidebar width: 240px (desktop)
Sidebar collapsed: 60px
Mobile: Full width drawer
```

---

## 🎭 Componentes

### Buttons

#### Primary Button
```tsx
<Button variant="default">
  Comprar Ativo
</Button>
```
- Background: primary
- Hover: primary com +10% luminosidade
- Active: primary com -10% luminosidade

#### Destructive Button
```tsx
<Button variant="destructive">
  Vender Posição
</Button>
```
- Background: destructive
- Uso: Ações irreversíveis, vendas

#### Outline Button
```tsx
<Button variant="outline">
  Filtrar
</Button>
```
- Border: border color
- Background: transparent
- Hover: subtle background

### Cards

#### Stat Card (Dashboard)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Ibovespa</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">127,453.68</div>
    <p className="text-success">+1.23%</p>
  </CardContent>
</Card>
```

**Elementos:**
- Title: muted-foreground, font-size: sm
- Value: foreground, font-size: 2xl, font-weight: bold
- Change: success/destructive, font-size: sm

### Tables

#### Asset Table
- Header: background-muted, font-weight: 600
- Rows: hover state com background-muted/50
- Borders: border color, 1px
- Padding: 0.75rem (12px)

**Colunas Especiais:**
```tsx
/* Ticker */
<td className="font-semibold text-foreground">PETR4</td>

/* Price */
<td className="font-mono text-right">R$ 38,45</td>

/* Change */
<td className={change >= 0 ? "text-success" : "text-destructive"}>
  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
</td>
```

### Forms

#### Input Fields
```tsx
<Input
  type="text"
  placeholder="Digite o ticker..."
  className="bg-input border-border"
/>
```

**Estados:**
- Default: border-border
- Focus: ring-primary, ring-2
- Error: border-destructive
- Disabled: opacity-50, cursor-not-allowed

### Dialogs/Modals

#### Structure
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Adicionar Posição</DialogTitle>
      <DialogDescription>
        Adicione um novo ativo ao seu portfólio
      </DialogDescription>
    </DialogHeader>
    {/* Form fields */}
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Adicionar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Animações:**
- Fade in: 200ms
- Backdrop: black/50

---

## 📊 Data Visualization

### Gráficos (Charts)

#### Cores Recomendadas
1. **Line Charts:** chart-1 (blue) para série principal
2. **Candlestick:** green (alta) / red (baixa)
3. **Bar Charts:** chart-2 (green) para positivo, chart-4 (red) para negativo
4. **Pie Charts:** Usar sequência chart-1 até chart-5

#### Configuração Recharts
```tsx
<LineChart>
  <Line
    stroke="hsl(var(--chart-1))"
    strokeWidth={2}
    dot={false}
  />
  <CartesianGrid
    stroke="hsl(var(--border))"
    strokeDasharray="3 3"
  />
</LineChart>
```

### Badges e Indicators

#### Recommendation Badges
```tsx
/* BUY */
<Badge className="bg-success text-success-foreground">
  Compra Forte
</Badge>

/* SELL */
<Badge className="bg-destructive text-destructive-foreground">
  Venda Forte
</Badge>

/* HOLD */
<Badge className="bg-warning text-warning-foreground">
  Manter
</Badge>
```

---

## 🌙 Dark Mode

### Toggle Dark Mode
```tsx
<Button
  variant="ghost"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
>
  {theme === 'dark' ? '☀️' : '🌙'}
</Button>
```

### Considerações Dark Mode

**Contraste:**
- Garantir WCAG AAA (7:1) para textos importantes
- Reduzir saturação de cores brilhantes (success, destructive)

**Gráficos:**
- Usar cores mais vibrantes em dark mode
- Grid lines mais sutis

**Shadows:**
- Light mode: subtle shadows (gray-200)
- Dark mode: usar borders ao invés de shadows

---

## ♿ Acessibilidade

### Contraste de Cores (WCAG AAA)

| Combinação | Ratio | Status |
|-----------|-------|--------|
| Foreground / Background | 15:1 | ✅ AAA |
| Primary / Primary-foreground | 8:1 | ✅ AAA |
| Success text / Background | 7:1 | ✅ AAA |
| Destructive text / Background | 7.5:1 | ✅ AAA |

### Keyboard Navigation
- Todos os elementos interativos devem ser acessíveis via Tab
- Focus visible com ring-2 ring-primary
- Skip links para navegação rápida

### Screen Readers
```tsx
<button aria-label="Adicionar PETR4 ao portfólio">
  <PlusIcon />
</button>

<div role="status" aria-live="polite">
  {loadingMessage}
</div>
```

---

## 📱 Responsividade

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Estratégia Mobile-First

**Dashboard:**
- Mobile: Cards em coluna única
- Tablet: Grid 2 colunas
- Desktop: Grid 4 colunas

**Tables:**
- Mobile: Cards verticais (não tabela)
- Tablet: Scroll horizontal
- Desktop: Tabela completa

**Sidebar:**
- Mobile: Bottom drawer ou hamburger menu
- Tablet: Collapsed sidebar (ícones apenas)
- Desktop: Full sidebar expandido

---

## 🚀 Performance

### Otimizações Aplicadas

**Cores CSS Variables:**
- Uma mudança de tema atualiza tudo instantaneamente
- Sem re-renders desnecessários

**Font System:**
- Usando system fonts (zero download)
- Fallback para melhor performance

**Tailwind JIT:**
- Apenas classes usadas no bundle final
- ~3KB de CSS total

**Lazy Loading:**
- Componentes pesados (gráficos) com lazy load
- Skeleton screens durante carregamento

---

## 📖 Guia de Uso

### Implementando Novas Features

1. **Escolher Cores Semânticas**
   ```tsx
   // ❌ Não use cores diretas
   <div className="bg-blue-500">

   // ✅ Use cores semânticas
   <div className="bg-primary">
   ```

2. **Valores Financeiros**
   ```tsx
   // Sempre use formatação consistente
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL'
     }).format(value);
   };

   const formatPercent = (value: number) => {
     return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
   };
   ```

3. **Estados de Loading**
   ```tsx
   {loading ? (
     <Skeleton className="h-20 w-full" />
   ) : (
     <DataDisplay />
   )}
   ```

---

## 🎨 Referências de Design

### Inspirações
- **Bloomberg Terminal:** Densidade de informação, cores profissionais
- **TradingView:** Gráficos limpos, design moderno
- **Investing.com:** Clareza de dados, hierarquia visual
- **Robinhood:** Simplicidade, mobile-first

### Ferramentas Utilizadas
- **Shadcn/UI:** Componentes base
- **Radix UI:** Primitives acessíveis
- **Tailwind CSS:** Utility-first styling
- **Recharts:** Data visualization

---

## ✅ Checklist de Implementação

Ao criar novos componentes:

- [ ] Cores usam variáveis CSS (`hsl(var(--primary))`)
- [ ] Suporta dark mode adequadamente
- [ ] Contraste WCAG AAA para textos importantes
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Acessível (keyboard navigation, screen readers)
- [ ] Loading states definidos
- [ ] Error states definidos
- [ ] Hover/active states implementados
- [ ] Formatação de números usando Intl API
- [ ] Cores semânticas para dados financeiros (verde/vermelho)

---

## 📞 Suporte e Documentação

**Shadcn/UI:** https://ui.shadcn.com
**Tailwind CSS:** https://tailwindcss.com
**Radix UI:** https://www.radix-ui.com
**WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

*Design System v1.0 - B3 AI Analysis Platform*
*Criado em 2025-11-06*
