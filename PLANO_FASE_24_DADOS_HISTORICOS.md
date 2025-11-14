# PLANO - FASE 24: Dados Históricos BRAPI (Range Configurável)

**Data de Criação:** 2025-11-14
**Responsável:** Claude Code (Sonnet 4.5)
**Status:** 🚧 EM PLANEJAMENTO
**Estimativa:** 4-6 horas

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Análise da Situação Atual](#análise-da-situação-atual)
3. [Objetivos da FASE 24](#objetivos-da-fase-24)
4. [Plano de Implementação](#plano-de-implementação)
5. [Validações Obrigatórias](#validações-obrigatórias)
6. [Riscos e Mitigações](#riscos-e-mitigações)

---

## 🎯 VISÃO GERAL

Implementar sistema de dados históricos de preços com **range configurável** para permitir que usuários visualizem gráficos de diferentes períodos (1 mês, 3 meses, 6 meses, 1 ano, 2 anos, 5 anos, etc).

**Decisão Arquitetural:** Reutilizar infraestrutura existente (`asset_prices` table, `BrapiScraper`, `PriceChart` component) ao invés de criar nova tabela/sistema do zero.

---

## 🔍 ANÁLISE DA SITUAÇÃO ATUAL

### Backend (NestJS)

**✅ O que JÁ EXISTE:**

1. **Entity `AssetPrice`** (`backend/src/database/entities/asset-price.entity.ts`)
   - Campos: id, assetId, date, open, high, low, close, adjustedClose, volume, marketCap, change, changePercent
   - Indexes: `[asset, date]` e `[date]`
   - **PERFEITA** para armazenar dados históricos!

2. **BrapiScraper** (`backend/src/scrapers/fundamental/brapi.scraper.ts`)
   - ✅ Método `scrape(ticker, range)` já recebe parâmetro `range`
   - ✅ Método `getHistoricalPrices(ticker, range, interval)` dedicado
   - ✅ Interface `BrapiData.historicalPrices[]` com OHLCV

3. **Endpoint `/assets/:ticker/price-history`** (`assets.controller.ts` linha 23-31)
   - Parâmetros: `startDate`, `endDate`
   - Retorna: Array de `AssetPrice` do banco

4. **Service `getPriceHistory`** (`assets.service.ts` linha 166-183)
   - Busca dados do banco com query builder
   - Filtra por startDate/endDate se fornecidos

**❌ PROBLEMAS IDENTIFICADOS:**

1. **Limitação de 30 dias no salvamento** (`assets.service.ts` linha 276)
   ```typescript
   for (const histPrice of brapiData.historicalPrices.slice(0, 30)) { // PROBLEMA!
   ```

2. **Frontend hardcoda 90 dias** (`assets/[ticker]/page.tsx` linha 37)
   ```typescript
   startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // PROBLEMA!
   ```

3. **Endpoint não aceita `range`** - apenas startDate/endDate
   - Usuário teria que calcular manualmente startDate/endDate para cada range
   - BRAPI usa ranges como '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'

4. **Sem seletor de range na UI** - usuário não pode mudar período visualizado

### Frontend (Next.js)

**✅ O que JÁ EXISTE:**

1. **Biblioteca `recharts` v2.10.4** (`package.json` linha 44)
   - Instalada e pronta para uso

2. **Biblioteca `lightweight-charts` v4.1.3** (`package.json` linha 38)
   - TradingView charts (específico para finance, candlestick profissional)

3. **Componente `PriceChart`** (`frontend/src/components/charts/price-chart.tsx`)
   - Gráfico ComposedChart (Recharts)
   - Exibe: Fechamento (linha), Máxima (linha tracejada), Mínima (linha tracejada), Volume (barras)
   - **PERFEITO** - não precisa modificar!

4. **Hook `useAssetPrices`** (`frontend/src/lib/hooks/use-assets.ts` linha 20-30)
   - React Query
   - Parâmetros: `ticker`, `{startDate?, endDate?}`

5. **Página `/assets/[ticker]`** (`frontend/src/app/(dashboard)/assets/[ticker]/page.tsx`)
   - Já renderiza PriceChart (linha 167-185)
   - Lazy loading para performance (linha 23)

**❌ PROBLEMAS IDENTIFICADOS:**

1. **Hook não aceita `range`** - apenas startDate/endDate
2. **Sem seletor de range na UI** - período fixo de 90 dias
3. **API client hardcoda `/price-history`** - não usa parâmetro range

---

## 🎯 OBJETIVOS DA FASE 24

### Objetivos Principais

1. ✅ Permitir salvamento de dados históricos com range configurável (remover limite de 30 dias)
2. ✅ Adicionar parâmetro `range` no endpoint backend (além de startDate/endDate)
3. ✅ Adicionar seletor de range na UI do frontend
4. ✅ Permitir visualização de diferentes períodos: 1mo, 3mo, 6mo, 1y, 2y, 5y, max

### Objetivos Secundários

1. ✅ Otimizar lógica de cache (não buscar BRAPI se dados já existem e estão frescos)
2. ✅ Validar com TypeScript (0 erros obrigatório)
3. ✅ Validar com MCP Triplo (Playwright + Chrome DevTools + Selenium)
4. ✅ Documentar em `FASE_24_DADOS_HISTORICOS.md`

---

## 📐 PLANO DE IMPLEMENTAÇÃO

### FASE 24.1: Backend - Refatorar Salvamento de Dados Históricos

**Arquivo:** `backend/src/api/assets/assets.service.ts`

**Mudança 1: Adicionar parâmetro `range` no método syncAsset**

```typescript
// ANTES (linha 185)
async syncAsset(ticker: string) {

// DEPOIS
async syncAsset(ticker: string, range: string = '1y') {
  // Passar range para BrapiScraper
  const brapiResult = await this.brapiScraper.scrape(ticker, range);
```

**Mudança 2: Remover `slice(0, 30)` do salvamento**

```typescript
// ANTES (linha 276)
for (const histPrice of brapiData.historicalPrices.slice(0, 30)) {

// DEPOIS
for (const histPrice of brapiData.historicalPrices || []) {
  // Salvar TODOS os preços históricos retornados pela BRAPI
```

**Mudança 3: Usar upsert para evitar duplicatas**

```typescript
// Já está usando save() que faz upsert automático (linha 283)
await this.assetPriceRepository.save(assetPrice);
// ✅ OK! TypeORM faz upsert se primary key já existir
```

---

### FASE 24.2: Backend - Adicionar Parâmetro `range` no Endpoint

**Arquivo 1:** `backend/src/api/assets/dto/historical-prices-query.dto.ts` (CRIAR NOVO)

```typescript
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PriceRange {
  ONE_DAY = '1d',
  FIVE_DAYS = '5d',
  ONE_MONTH = '1mo',
  THREE_MONTHS = '3mo',
  SIX_MONTHS = '6mo',
  ONE_YEAR = '1y',
  TWO_YEARS = '2y',
  FIVE_YEARS = '5y',
  TEN_YEARS = '10y',
  YTD = 'ytd',
  MAX = 'max',
}

export class HistoricalPricesQueryDto {
  @ApiPropertyOptional({
    enum: PriceRange,
    description: 'Time range for historical data',
    default: PriceRange.ONE_YEAR,
  })
  @IsOptional()
  @IsEnum(PriceRange)
  range?: PriceRange;

  @ApiPropertyOptional({
    description: 'Custom start date (YYYY-MM-DD)',
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (YYYY-MM-DD)',
  })
  @IsOptional()
  endDate?: string;
}
```

**Arquivo 2:** `backend/src/api/assets/assets.controller.ts`

```typescript
// ANTES (linha 23-31)
@Get(':ticker/price-history')
@ApiOperation({ summary: 'Get asset price history' })
async getPriceHistory(
  @Param('ticker') ticker: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  return this.assetsService.getPriceHistory(ticker, startDate, endDate);
}

// DEPOIS
import { HistoricalPricesQueryDto } from './dto/historical-prices-query.dto';

@Get(':ticker/price-history')
@ApiOperation({ summary: 'Get asset price history with configurable range' })
async getPriceHistory(
  @Param('ticker') ticker: string,
  @Query() query: HistoricalPricesQueryDto,
) {
  return this.assetsService.getPriceHistory(ticker, query);
}
```

**Arquivo 3:** `backend/src/api/assets/assets.service.ts`

```typescript
// ANTES (linha 166)
async getPriceHistory(ticker: string, startDate?: string, endDate?: string) {

// DEPOIS
import { HistoricalPricesQueryDto, PriceRange } from './dto/historical-prices-query.dto';

async getPriceHistory(ticker: string, query: HistoricalPricesQueryDto) {
  const asset = await this.findByTicker(ticker);

  // 1. Se forneceu range, converter para startDate/endDate
  let { startDate, endDate, range } = query;

  if (range && !startDate) {
    startDate = this.rangeToStartDate(range);
    endDate = new Date().toISOString().split('T')[0];
  }

  // 2. Buscar dados no banco
  const queryBuilder = this.assetPriceRepository
    .createQueryBuilder('price')
    .where('price.assetId = :assetId', { assetId: asset.id })
    .orderBy('price.date', 'DESC');

  if (startDate) {
    queryBuilder.andWhere('price.date >= :startDate', { startDate });
  }

  if (endDate) {
    queryBuilder.andWhere('price.date <= :endDate', { endDate });
  }

  const prices = await queryBuilder.getMany();

  // 3. Se dados insuficientes ou desatualizados, buscar da BRAPI
  const shouldFetchFromBrapi = this.shouldRefetchData(prices, range);

  if (shouldFetchFromBrapi) {
    this.logger.log(`Fetching fresh data from BRAPI for ${ticker} (range: ${range})`);
    await this.syncAsset(ticker, range || '1y');
    // Buscar novamente do banco após sync
    return queryBuilder.getMany();
  }

  return prices;
}

private rangeToStartDate(range: PriceRange): string {
  const now = new Date();
  const daysMap = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
    '10y': 3650,
    'ytd': this.getYTDDays(),
    'max': 7300, // ~20 years
  };

  const days = daysMap[range] || 365;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return startDate.toISOString().split('T')[0];
}

private getYTDDays(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
}

private shouldRefetchData(prices: any[], range: string): boolean {
  // Se não tem dados, buscar
  if (!prices || prices.length === 0) {
    return true;
  }

  // Se última data é de mais de 24h atrás, buscar
  const latestDate = new Date(prices[0].date);
  const now = new Date();
  const hoursSinceLatest = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLatest > 24) {
    return true;
  }

  // Se quantidade de dados é muito menor que esperado para o range, buscar
  const expectedDays = this.getExpectedDays(range);
  const actualDays = prices.length;

  if (actualDays < expectedDays * 0.5) { // Se tem menos de 50% do esperado
    return true;
  }

  return false;
}

private getExpectedDays(range: string): number {
  const daysMap = {
    '1d': 1,
    '5d': 5,
    '1mo': 20, // ~20 dias úteis
    '3mo': 60,
    '6mo': 120,
    '1y': 250, // ~250 dias úteis
    '2y': 500,
    '5y': 1250,
    '10y': 2500,
    'ytd': this.getYTDDays(),
    'max': 5000,
  };

  return daysMap[range] || 250;
}
```

---

### FASE 24.3: Frontend - Adicionar Seletor de Range

**Arquivo 1:** `frontend/src/lib/hooks/use-assets.ts`

```typescript
// ANTES (linha 20-30)
export function useAssetPrices(
  ticker: string,
  params?: { startDate?: string; endDate?: string },
) {

// DEPOIS
export function useAssetPrices(
  ticker: string,
  params?: { range?: string; startDate?: string; endDate?: string },
) {
  return useQuery({
    queryKey: ['asset-prices', ticker, params],
    queryFn: () => api.getAssetPrices(ticker, params),
    enabled: !!ticker,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

**Arquivo 2:** `frontend/src/lib/api.ts`

```typescript
// ANTES (linha 82-85)
async getAssetPrices(ticker: string, params?: { startDate?: string; endDate?: string }) {
  const response = await this.client.get(`/assets/${ticker}/price-history`, { params });
  return response.data;
}

// DEPOIS
async getAssetPrices(ticker: string, params?: { range?: string; startDate?: string; endDate?: string }) {
  const response = await this.client.get(`/assets/${ticker}/price-history`, { params });
  return response.data;
}
```

**Arquivo 3:** `frontend/src/app/(dashboard)/assets/[ticker]/page.tsx`

```typescript
// ANTES (linha 30-38)
const ticker = params.ticker;
const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(ticker);
const { data: priceHistory, isLoading: pricesLoading } = useAssetPrices(ticker, {
  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
});

// DEPOIS
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const ticker = params.ticker;
const [selectedRange, setSelectedRange] = useState<string>('1y');

const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(ticker);
const { data: priceHistory, isLoading: pricesLoading } = useAssetPrices(ticker, {
  range: selectedRange,
});

// ... (dentro do return, ANTES do Card do gráfico, linha 166)

{/* Range Selector */}
<div className="flex items-center justify-end space-x-2 mb-4">
  <span className="text-sm text-muted-foreground">Período:</span>
  {['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'].map((range) => (
    <Button
      key={range}
      variant={selectedRange === range ? 'default' : 'outline'}
      size="sm"
      onClick={() => setSelectedRange(range)}
    >
      {range.toUpperCase()}
    </Button>
  ))}
</div>

{/* Price Chart - Lazy loaded for better LCP */}
<Card className="p-6">
  <div className="mb-4">
    <h3 className="text-lg font-semibold">Gráfico de Preços - {selectedRange.toUpperCase()}</h3>
    ...
```

---

## ✅ VALIDAÇÕES OBRIGATÓRIAS

### Checklist de Validação (CHECKLIST_TODO_MASTER.md)

1. ✅ **TypeScript (0 erros obrigatório)**
   ```bash
   cd backend && npx tsc --noEmit
   cd frontend && npx tsc --noEmit
   ```

2. ✅ **Build (Success obrigatório)**
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```

3. ✅ **Testes Manuais Backend (curl)**
   ```bash
   # Teste 1: 1 mês
   curl "http://localhost:3101/api/v1/assets/PETR4/price-history?range=1mo"

   # Teste 2: 3 meses
   curl "http://localhost:3101/api/v1/assets/PETR4/price-history?range=3mo"

   # Teste 3: 1 ano
   curl "http://localhost:3101/api/v1/assets/PETR4/price-history?range=1y"

   # Teste 4: Custom range (startDate/endDate)
   curl "http://localhost:3101/api/v1/assets/PETR4/price-history?startDate=2024-01-01&endDate=2024-06-30"
   ```

4. ✅ **Validação MCP Triplo**
   - Playwright: Verificar carregamento de gráfico
   - Chrome DevTools: Verificar network requests (deve buscar com range correto)
   - Selenium (opcional): Validação adicional
   - **Screenshots obrigatórios**: 3 capturas (1 por MCP)

5. ✅ **React Developer Tools**
   - Verificar hooks renderizando corretamente
   - Verificar estados (selectedRange, priceHistory, isLoading)

6. ✅ **Verificar Serviços Ativos**
   ```bash
   docker ps | grep invest
   # Reiniciar backend se modificou código backend
   docker-compose restart api-service
   # Reiniciar frontend se modificou código frontend
   docker-compose restart frontend
   ```

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Duplicatas no Banco

**Descrição:** Chamar syncAsset() múltiplas vezes pode inserir dados duplicados.

**Mitigação:**
- ✅ AssetPrice tem primary key composta (id + date)
- ✅ TypeORM `save()` faz upsert automático
- ✅ Testar manualmente: chamar endpoint 2x e verificar contagem no banco

### Risco 2: Rate Limit BRAPI

**Descrição:** BRAPI tem rate limits (4 requests grátis, depois precisa de API key).

**Mitigação:**
- ✅ Implementar lógica `shouldRefetchData()` para evitar chamadas desnecessárias
- ✅ Só buscar da BRAPI se dados estão desatualizados (> 24h) ou incompletos
- ✅ Testar com API key configurada em `.env.template`

### Risco 3: Performance com Muitos Dados

**Descrição:** Carregar 5+ anos de dados (1250+ registros) pode ser lento.

**Mitigação:**
- ✅ Inicialmente limitar a '1y' por padrão
- ✅ Frontend já usa lazy loading do PriceChart
- ✅ Query do banco tem index otimizado em [asset, date]
- ⏳ Futuro: Implementar paginação se necessário

### Risco 4: Quebrar Funcionalidade Existente

**Descrição:** Modificar endpoint pode quebrar páginas que já usam `/price-history`.

**Mitigação:**
- ✅ Manter compatibilidade retroativa (startDate/endDate ainda funcionam)
- ✅ range é opcional (default '1y')
- ✅ Testar todas as páginas que usam useAssetPrices:
  - `/assets/[ticker]` ✅
  - Outras páginas? (verificar com grep)

---

## 📊 MÉTRICAS DE SUCESSO

**Objetivos Quantitativos:**

1. ✅ TypeScript Errors: 0
2. ✅ Build Errors: 0
3. ✅ Console Errors: 0 (páginas principais)
4. ✅ MCP Validation: 3/3 MCPs passando
5. ✅ Ranges testados: 7 ranges (1mo, 3mo, 6mo, 1y, 2y, 5y, max)
6. ✅ Screenshots capturados: 3+ (1 por MCP + extras)

**Objetivos Qualitativos:**

1. ✅ UX melhorado: Usuário pode selecionar período facilmente
2. ✅ Performance mantida: Gráfico carrega em < 3 segundos
3. ✅ Código limpo: Sem duplicação, bem documentado
4. ✅ Arquitetura respeitada: Reutiliza infraestrutura existente

---

## 📝 DOCUMENTAÇÃO

**Arquivos a Criar/Atualizar:**

1. ✅ `FASE_24_DADOS_HISTORICOS.md` (validação final)
2. ✅ `ROADMAP.md` (adicionar FASE 24 como completa)
3. ✅ Commit message detalhado (Conventional Commits + co-autoria)

---

**Última atualização:** 2025-11-14
**Próximo passo:** Iniciar implementação backend (FASE 24.1)
