# PLANO FASE 33: Integração COTAHIST + NestJS + PostgreSQL

**Data:** 2025-11-16
**Responsável:** Claude Code (Sonnet 4.5)
**Prioridade:** 🔥 CRÍTICA
**Estimativa:** 3-5 horas

---

## 🎯 OBJETIVO

Integrar o parser COTAHIST (Python Service) com o backend NestJS, sincronizando dados históricos no PostgreSQL para resolver o problema de dados insuficientes.

**Problema Atual:**
- ❌ 60% dos ativos com < 200 pontos (gráficos não renderizam)
- ❌ BRAPI Free: Máximo 3 meses (67 pontos)
- ❌ Usuário precisa clicar "Sync" manualmente para cada ativo

**Solução Proposta:**
- ✅ COTAHIST: 1986-2025 (9.000+ pontos por ativo)
- ✅ Sincronização automática via backend
- ✅ Merge inteligente: COTAHIST (histórico) + BRAPI (recente + adjustedClose)
- ✅ 100% dos ativos com gráficos funcionais

---

## 📋 ANÁLISE TÉCNICA

### Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  /assets/[ticker] → useAssetPrices(ticker, range='1y')     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP GET
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND NestJS (MarketDataService)             │
│  - getPriceHistory(ticker, range='1y')                      │
│  - syncAsset(ticker, range='1y') → BRAPI apenas            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL (asset_prices)                  │
│  - 67 pontos (3mo) para maioria dos ativos                 │
└─────────────────────────────────────────────────────────────┘
```

### Arquitetura Nova (FASE 33)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  /assets/[ticker] → useAssetPrices(ticker, range='1y')     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP GET
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND NestJS (MarketDataService)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ getPriceHistory(ticker, range='1y')                  │  │
│  │  1. Check PostgreSQL                                 │  │
│  │  2. If < 200 points → syncHistoricalDataFromCotahist│  │
│  │  3. Return merged data                               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ syncHistoricalDataFromCotahist(ticker, startYear)    │  │
│  │  1. Call Python Service /cotahist/fetch              │  │
│  │  2. Call BRAPI for recent 3mo (adjustedClose)        │  │
│  │  3. Merge strategy (COTAHIST priority)               │  │
│  │  4. Batch UPSERT PostgreSQL (ON CONFLICT)            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────┬──────────────────────┘
                     │                 │
                     ↓                 ↓
         ┌───────────────────┐  ┌──────────────────┐
         │  Python Service   │  │  BRAPI API       │
         │  /cotahist/fetch  │  │  /quote/{ticker} │
         │  251 records 2024 │  │  adjustedClose   │
         └───────────────────┘  └──────────────────┘
                     │                 │
                     └─────────┬───────┘
                               ↓
                  ┌─────────────────────────────┐
                  │  PostgreSQL (asset_prices)  │
                  │  - 9.000+ pontos (1986-2025)│
                  │  - Unique: (asset_id, date) │
                  └─────────────────────────────┘
```

---

## 🔧 IMPLEMENTAÇÃO DETALHADA

### FASE 33.1: Criar DTO

**Arquivo:** `backend/src/api/market-data/dto/sync-cotahist.dto.ts`

```typescript
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncCotahistDto {
  @ApiProperty({
    description: 'Ticker do ativo (ex: ABEV3, PETR4)',
    example: 'ABEV3',
  })
  @IsString()
  ticker: string;

  @ApiProperty({
    description: 'Ano inicial (1986-2025)',
    example: 2020,
    minimum: 1986,
    maximum: 2025,
  })
  @IsInt()
  @Min(1986)
  @Max(2025)
  @IsOptional()
  startYear?: number = 2020; // Default: últimos 5 anos

  @ApiProperty({
    description: 'Ano final (1986-2025)',
    example: 2025,
    minimum: 1986,
    maximum: 2025,
  })
  @IsInt()
  @Min(1986)
  @Max(2025)
  @IsOptional()
  endYear?: number = new Date().getFullYear();
}

export class SyncCotahistResponseDto {
  @ApiProperty({ description: 'Total de registros sincronizados' })
  totalRecords: number;

  @ApiProperty({ description: 'Anos processados' })
  yearsProcessed: number;

  @ApiProperty({ description: 'Tempo de processamento (segundos)' })
  processingTime: number;

  @ApiProperty({ description: 'Fontes utilizadas' })
  sources: {
    cotahist: number;
    brapi: number;
    merged: number;
  };

  @ApiProperty({ description: 'Período dos dados' })
  period: {
    start: string;
    end: string;
  };
}
```

---

### FASE 33.2: Implementar Service

**Arquivo:** `backend/src/api/market-data/market-data.service.ts`

**Método Principal:** `syncHistoricalDataFromCotahist()`

```typescript
/**
 * Sincroniza dados históricos do COTAHIST para um ativo
 *
 * Fluxo:
 * 1. Buscar dados COTAHIST (Python Service)
 * 2. Buscar dados BRAPI recentes (últimos 3 meses)
 * 3. Merge inteligente (COTAHIST prioridade)
 * 4. Batch UPSERT PostgreSQL
 *
 * @param ticker - Código do ativo (ex: ABEV3)
 * @param startYear - Ano inicial (default: 2020)
 * @param endYear - Ano final (default: ano atual)
 * @returns Estatísticas da sincronização
 */
async syncHistoricalDataFromCotahist(
  ticker: string,
  startYear: number = 2020,
  endYear: number = new Date().getFullYear(),
): Promise<SyncCotahistResponseDto> {
  const startTime = Date.now();

  // 1. Buscar ou criar asset
  let asset = await this.assetRepository.findOne({ where: { ticker } });
  if (!asset) {
    asset = this.assetRepository.create({ ticker });
    await this.assetRepository.save(asset);
  }

  // 2. Buscar dados COTAHIST via Python Service
  const cotahistData = await this.fetchCotahistData(ticker, startYear, endYear);

  // 3. Buscar dados BRAPI recentes (últimos 3 meses)
  const brapiData = await this.fetchBrapiRecentData(ticker);

  // 4. Merge strategy
  const mergedData = this.mergeCotahistBrapi(cotahistData, brapiData);

  // 5. Batch UPSERT
  await this.batchUpsertPrices(asset.id, mergedData);

  // 6. Estatísticas
  const endTime = Date.now();
  return {
    totalRecords: mergedData.length,
    yearsProcessed: endYear - startYear + 1,
    processingTime: (endTime - startTime) / 1000,
    sources: {
      cotahist: cotahistData.length,
      brapi: brapiData.length,
      merged: mergedData.length,
    },
    period: {
      start: mergedData[0]?.date || '',
      end: mergedData[mergedData.length - 1]?.date || '',
    },
  };
}
```

**Métodos Auxiliares:**

```typescript
/**
 * Busca dados COTAHIST via Python Service
 */
private async fetchCotahistData(
  ticker: string,
  startYear: number,
  endYear: number,
): Promise<any[]> {
  const response = await this.pythonServiceClient.post('/cotahist/fetch', {
    start_year: startYear,
    end_year: endYear,
    tickers: [ticker],
  });

  return response.data.data || [];
}

/**
 * Busca dados BRAPI recentes (últimos 3 meses)
 */
private async fetchBrapiRecentData(ticker: string): Promise<any[]> {
  // Usar serviço BRAPI existente
  // Range: 3mo para obter adjustedClose
  const brapiScraper = this.scrapersService.getBrapiScraper();
  const data = await brapiScraper.getHistoricalPrices(ticker, '3mo');
  return data || [];
}

/**
 * Merge inteligente: COTAHIST (histórico) + BRAPI (recente + adjustedClose)
 *
 * Estratégia:
 * 1. COTAHIST: 1986 → (hoje - 3 meses)
 * 2. BRAPI: (hoje - 3 meses) → hoje (com adjustedClose)
 * 3. Se divergência > 1% no overlap → log warning
 * 4. COTAHIST tem prioridade em caso de conflito
 */
private mergeCotahistBrapi(cotahist: any[], brapi: any[]): any[] {
  const cotahistMap = new Map(cotahist.map(d => [d.date, d]));
  const brapiMap = new Map(brapi.map(d => [d.date, d]));

  const merged = [];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Adicionar todos os dados COTAHIST
  for (const [date, data] of cotahistMap.entries()) {
    merged.push({
      date,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
      adjustedClose: null, // COTAHIST não tem adjustedClose
    });
  }

  // Adicionar dados BRAPI recentes (últimos 3 meses)
  for (const [date, data] of brapiMap.entries()) {
    const dateObj = new Date(date);

    if (dateObj >= threeMonthsAgo) {
      const cotahistRecord = cotahistMap.get(date);

      // Se overlap, validar divergência
      if (cotahistRecord) {
        const divergence = Math.abs(
          (cotahistRecord.close - data.close) / cotahistRecord.close
        );

        if (divergence > 0.01) {
          this.logger.warn(
            `Divergência ${(divergence * 100).toFixed(2)}% em ${date}: ` +
            `COTAHIST=${cotahistRecord.close}, BRAPI=${data.close}`
          );
        }
      }

      // Adicionar/atualizar com dados BRAPI (tem adjustedClose)
      const existingIdx = merged.findIndex(m => m.date === date);
      const record = {
        date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        adjustedClose: data.adjustedClose, // ✅ Campo exclusivo BRAPI
      };

      if (existingIdx >= 0) {
        merged[existingIdx] = record; // Substituir com BRAPI
      } else {
        merged.push(record);
      }
    }
  }

  // Ordenar por data
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Batch UPSERT no PostgreSQL com ON CONFLICT
 */
private async batchUpsertPrices(assetId: number, data: any[]): Promise<void> {
  const entities = data.map(d =>
    this.assetPriceRepository.create({
      assetId,
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      adjustedClose: d.adjustedClose,
    })
  );

  // Batch insert com ON CONFLICT (date + assetId são unique)
  await this.assetPriceRepository
    .createQueryBuilder()
    .insert()
    .into('asset_prices')
    .values(entities)
    .orUpdate(['open', 'high', 'low', 'close', 'volume', 'adjusted_close'], ['asset_id', 'date'])
    .execute();

  this.logger.log(`✅ Batch UPSERT: ${entities.length} records for asset ${assetId}`);
}
```

---

### FASE 33.3: Controller Endpoint

**Arquivo:** `backend/src/api/market-data/market-data.controller.ts`

```typescript
@Post('sync-cotahist')
@ApiOperation({
  summary: 'Sincronizar dados históricos COTAHIST',
  description:
    'Busca dados históricos do COTAHIST (1986-2025) via Python Service ' +
    'e sincroniza com PostgreSQL. Merge inteligente com BRAPI para adjustedClose.',
})
@ApiResponse({
  status: 200,
  description: 'Sincronização concluída com sucesso',
  type: SyncCotahistResponseDto,
})
@ApiResponse({
  status: 400,
  description: 'Parâmetros inválidos (ticker, anos)',
})
@ApiResponse({
  status: 500,
  description: 'Erro ao sincronizar (Python Service offline, timeout, etc)',
})
async syncCotahist(
  @Body() dto: SyncCotahistDto,
): Promise<SyncCotahistResponseDto> {
  this.logger.log(`Sync COTAHIST: ${dto.ticker} (${dto.startYear}-${dto.endYear})`);

  return this.marketDataService.syncHistoricalDataFromCotahist(
    dto.ticker,
    dto.startYear,
    dto.endYear,
  );
}
```

---

## ✅ VALIDAÇÃO

### Checklist de Testes

**1. Teste Manual (curl):**
```bash
curl -X POST "http://localhost:3101/api/v1/market-data/sync-cotahist" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "ABEV3", "startYear": 2020, "endYear": 2024}'
```

**Response Esperado:**
```json
{
  "totalRecords": 1200,
  "yearsProcessed": 5,
  "processingTime": 12.5,
  "sources": {
    "cotahist": 1150,
    "brapi": 67,
    "merged": 1200
  },
  "period": {
    "start": "2020-01-02",
    "end": "2024-11-15"
  }
}
```

**2. Validar PostgreSQL:**
```sql
SELECT COUNT(*)
FROM asset_prices ap
JOIN assets a ON ap.asset_id = a.id
WHERE a.ticker = 'ABEV3';
-- Esperado: ~1200 registros (5 anos * 250 dias úteis)
```

**3. Validar Frontend:**
- [ ] Acessar `/assets/ABEV3`
- [ ] Gráfico deve renderizar com 1200+ pontos
- [ ] Seletor de range: 1y, 2y, 5y, max devem funcionar
- [ ] Console: 0 erros

**4. Validar 10 Ativos:**
```bash
# Testar 10 ativos diferentes
for ticker in ABEV3 PETR4 VALE3 ITUB4 BBDC4 WEGE3 RENT3 EGIE3 RADL3 MGLU3; do
  echo "Testing $ticker..."
  curl -X POST "http://localhost:3101/api/v1/market-data/sync-cotahist" \
    -H "Content-Type: application/json" \
    -d "{\"ticker\": \"$ticker\", \"startYear\": 2020}"
done
```

**5. TypeScript & Build:**
```bash
cd backend && npx tsc --noEmit  # 0 erros
cd backend && npm run build     # Success
```

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes (FASE 32) | Depois (FASE 33) | Meta |
|---------|-----------------|------------------|------|
| **Ativos com gráficos** | 40% (4/10) | 100% (10/10) | ✅ 100% |
| **Pontos médios/ativo** | 67 | 1.200+ | ✅ > 200 |
| **Período histórico** | 3 meses | 5 anos | ✅ > 1 ano |
| **Tempo sincronização** | N/A | < 15s | ✅ < 60s |
| **Coverage COTAHIST** | 0% | 100% | ✅ 100% |

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Python Service offline | Média | Alto | Try-catch + fallback para BRAPI apenas |
| Timeout download COTAHIST | Média | Médio | Timeout 60s + retry 3x |
| Divergência COTAHIST vs BRAPI | Alta | Baixo | Log warning se > 1%, não bloqueia |
| PostgreSQL constraint violation | Baixa | Médio | ON CONFLICT UPDATE |
| OOM (9000+ registros) | Baixa | Alto | Batch 1000 records por vez |

---

## 📁 ARQUIVOS A MODIFICAR

| Arquivo | Tipo | Linhas | Descrição |
|---------|------|--------|-----------|
| `dto/sync-cotahist.dto.ts` | Criar | 50 | DTO request/response |
| `market-data.service.ts` | Modificar | +200 | Métodos sync + merge |
| `market-data.controller.ts` | Modificar | +30 | Endpoint POST |
| `market-data.module.ts` | Modificar | +5 | Import PythonServiceClient |
| `PLANO_FASE_33_INTEGRACAO_COTAHIST.md` | Criar | 500+ | Este arquivo |
| `ROADMAP.md` | Modificar | +50 | Atualizar FASE 33 status |

**Total:** 6 arquivos, ~835 linhas

---

## 🎯 PRÓXIMOS PASSOS (FASE 34-35)

**FASE 34: Otimizações**
- [ ] Cache Redis para dados COTAHIST (TTL: 24h)
- [ ] Queue BullMQ para sync background
- [ ] Cron job: Auto-sync diário 00:00

**FASE 35: Frontend Integration**
- [ ] Botão "Sync COTAHIST" na página `/assets/[ticker]`
- [ ] Loading state durante sincronização
- [ ] Toast notification "Synced 1200 records in 12s"
- [ ] Auto-refetch após sync concluído

---

**Status:** 📋 **PLANEJAMENTO COMPLETO - PRONTO PARA IMPLEMENTAÇÃO**
