# PLANO DE EVOLUÇÃO DO SISTEMA DE COLETA DE DADOS

**Data:** 2025-12-02
**Versão:** 1.0
**Objetivo:** Aumentar confiança de 2 para 3+ fontes com rastreamento completo de origem dos dados

---

## 📊 DIAGNÓSTICO DO SISTEMA ATUAL

### Configuração Atual
```typescript
// scrapers.service.ts
MIN_SOURCES = 2  // Reduzido de 3 para 2
MIN_CONFIDENCE = 0.5  // Reduzido de 0.7 para 0.5

// Scrapers ativos (6 total):
1. fundamentus    ❌ NÃO requer login
2. brapi          ❌ NÃO requer login (API Key)
3. statusinvest   ❌ NÃO requer login
4. investidor10   ❌ NÃO requer login
5. fundamentei    ✅ REQUER Google OAuth
6. investsite     ❌ NÃO requer login
```

### Problema do "Early Exit"
```typescript
// Linha 73-77 de scrapers.service.ts
if (successfulResults.length >= this.minSources) {
  this.logger.debug(`Got ${successfulResults.length} sources, stopping early`);
  break;  // ⚠️ Para com apenas 2 fontes!
}
```

**Impacto:** Sistema para de coletar após obter 2 fontes, mesmo tendo 6 disponíveis.

### Armazenamento Atual de Metadados
```typescript
// FundamentalData.metadata (JSONB)
{
  sources: ["fundamentus", "brapi"],       // ✅ Lista de fontes
  sourcesCount: 2,                         // ✅ Quantidade
  confidence: 0.67,                        // ✅ Confiança geral
  discrepancies: [...],                    // ✅ Discrepâncias
  rawData: {...}                           // ⚠️ Dados brutos misturados
}
```

**Problema:** Não há rastreamento de QUAL fonte forneceu QUAL campo específico.

---

## 🎯 OBJETIVOS DO PLANO

### Objetivos Primários
1. **Aumentar mínimo de fontes de 2 para 3** para maior confiança
2. **Rastrear origem de cada campo individualmente**
3. **Implementar sistema de priorização de fontes por campo**
4. **Criar visualização de proveniência dos dados no frontend**

### Objetivos Secundários
5. **Remover early exit** para coletar de TODAS as fontes disponíveis
6. **Implementar merge inteligente** (mediana em vez de primeiro valor)
7. **Detectar e alertar sobre outliers** por fonte
8. **Dashboard de qualidade de dados** por scraper

---

## 📋 FASES DE IMPLEMENTAÇÃO

### FASE 1: Rastreamento de Origem por Campo (2-3 dias)

#### 1.1 Nova Estrutura de Dados
```typescript
// Novo tipo para rastreamento granular
interface FieldSourceInfo {
  value: number | string | null;
  source: string;
  scrapedAt: Date;
  confidence?: number;
}

interface FundamentalDataWithProvenance {
  // Campo com rastreamento
  pl: {
    value: number;
    sources: FieldSourceInfo[];
    finalSource: string;       // Fonte escolhida para o valor final
    consensus: number;         // % de fontes que concordam
    variance: number;          // Variância entre fontes
  };
  // ... outros campos
}
```

#### 1.2 Alteração na Entity FundamentalData
```typescript
// fundamental-data.entity.ts - Adicionar nova coluna
@Column({ type: 'jsonb', name: 'field_sources', nullable: true })
fieldSources: Record<string, {
  values: Array<{
    source: string;
    value: number | null;
    scrapedAt: string;
  }>;
  finalValue: number | null;
  finalSource: string;
  sourcesCount: number;
  variance: number;
}>;
```

#### 1.3 Migration
```sql
-- Migration: AddFieldSourcesToFundamentalData
ALTER TABLE fundamental_data
ADD COLUMN field_sources JSONB DEFAULT '{}';

-- Índice para queries por fonte
CREATE INDEX idx_fundamental_data_field_sources
ON fundamental_data USING GIN (field_sources);
```

#### 1.4 Tarefas
- [ ] Criar migration para nova coluna `field_sources`
- [ ] Atualizar `FundamentalData` entity
- [ ] Criar interface `FieldSourceInfo`
- [ ] Atualizar `saveFundamentalData()` para popular `field_sources`

---

### FASE 2: Coleta Completa de Todas as Fontes (1-2 dias)

#### 2.1 Remover Early Exit
```typescript
// scrapers.service.ts - ANTES
for (const { name, scraper } of scrapers) {
  // ...
  if (successfulResults.length >= this.minSources) {
    break;  // ❌ REMOVER ISSO
  }
}

// DEPOIS
for (const { name, scraper } of scrapers) {
  try {
    const result = await scraper.scrape(ticker);
    if (result.success) {
      successfulResults.push(result);
    }
  } catch (error) {
    this.logger.debug(`[${ticker}] ${name}: ERROR`);
  }
  // ✅ Continua para TODAS as fontes
}
```

#### 2.2 Aumentar Mínimo para 3
```typescript
// .env
MIN_DATA_SOURCES=3

// scrapers.service.ts
this.minSources = this.configService.get<number>('MIN_DATA_SOURCES', 3);
```

#### 2.3 Tarefas
- [ ] Remover early exit do loop de scrapers
- [ ] Atualizar MIN_DATA_SOURCES para 3
- [ ] Ajustar testes unitários
- [ ] Validar que todos 6 scrapers são consultados

---

### FASE 3: Merge Inteligente de Dados (2-3 dias)

#### 3.1 Estratégias de Merge por Tipo de Campo
```typescript
enum MergeStrategy {
  MEDIAN = 'median',           // Para valores numéricos (mais robusto)
  AVERAGE = 'average',         // Para valores menos voláteis
  MOST_RECENT = 'most_recent', // Para dados que mudam frequentemente
  CONSENSUS = 'consensus',     // Para campos categóricos
  PRIORITY = 'priority',       // Para campos com fonte preferencial
}

// Configuração por campo
const fieldMergeConfig: Record<string, MergeStrategy> = {
  // Valuation - usar MEDIANA (robusto a outliers)
  pl: MergeStrategy.MEDIAN,
  pvp: MergeStrategy.MEDIAN,
  psr: MergeStrategy.MEDIAN,
  evEbit: MergeStrategy.MEDIAN,
  evEbitda: MergeStrategy.MEDIAN,

  // Rentabilidade - usar MEDIANA
  roe: MergeStrategy.MEDIAN,
  roic: MergeStrategy.MEDIAN,
  roa: MergeStrategy.MEDIAN,

  // Margens - usar MEDIANA
  margemBruta: MergeStrategy.MEDIAN,
  margemEbit: MergeStrategy.MEDIAN,
  margemLiquida: MergeStrategy.MEDIAN,

  // Dividendos - usar AVERAGE (menos variação)
  dividendYield: MergeStrategy.AVERAGE,
  payout: MergeStrategy.AVERAGE,

  // Financials (valores absolutos) - usar PRIORITY
  receitaLiquida: MergeStrategy.PRIORITY,
  lucroLiquido: MergeStrategy.PRIORITY,
  patrimonioLiquido: MergeStrategy.PRIORITY,

  // Classificação - usar CONSENSUS
  sector: MergeStrategy.CONSENSUS,
  subsector: MergeStrategy.CONSENSUS,
};

// Prioridade de fontes para estratégia PRIORITY
const sourcePriority = [
  'fundamentus',   // 1º - Mais completo
  'statusinvest',  // 2º - Boa qualidade
  'investidor10',  // 3º - Dados extras
  'brapi',         // 4º - API oficial
  'investsite',    // 5º - Backup
  'fundamentei',   // 6º - Requer login
];
```

#### 3.2 Implementação do Merge
```typescript
private mergeFieldValues(
  fieldName: string,
  values: Array<{ source: string; value: number | null }>
): { finalValue: number; finalSource: string; variance: number } {
  const strategy = fieldMergeConfig[fieldName] || MergeStrategy.MEDIAN;
  const validValues = values.filter(v => v.value !== null && !isNaN(v.value));

  if (validValues.length === 0) {
    return { finalValue: null, finalSource: 'none', variance: 0 };
  }

  switch (strategy) {
    case MergeStrategy.MEDIAN:
      return this.calculateMedian(validValues);

    case MergeStrategy.AVERAGE:
      return this.calculateAverage(validValues);

    case MergeStrategy.PRIORITY:
      return this.selectByPriority(validValues);

    case MergeStrategy.MOST_RECENT:
      return this.selectMostRecent(validValues);

    default:
      return this.calculateMedian(validValues);
  }
}

private calculateMedian(values: Array<{ source: string; value: number }>): {...} {
  const sorted = values.map(v => v.value).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const medianValue = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Encontrar qual fonte tem o valor mais próximo da mediana
  const closestSource = values.reduce((prev, curr) =>
    Math.abs(curr.value - medianValue) < Math.abs(prev.value - medianValue)
      ? curr : prev
  );

  // Calcular variância
  const variance = this.calculateVariance(sorted);

  return {
    finalValue: medianValue,
    finalSource: closestSource.source,
    variance,
  };
}
```

#### 3.3 Tarefas
- [ ] Criar enum `MergeStrategy`
- [ ] Definir configuração de merge por campo
- [ ] Implementar `mergeFieldValues()`
- [ ] Implementar `calculateMedian()`, `calculateAverage()`, etc.
- [ ] Atualizar `crossValidateData()` para usar novo merge
- [ ] Adicionar logs de decisão de merge

---

### FASE 4: API e Frontend de Proveniência (2-3 dias)

#### 4.1 Novo Endpoint de Detalhes de Fontes
```typescript
// assets.controller.ts
@Get(':ticker/data-sources')
@ApiOperation({ summary: 'Get data sources for an asset' })
async getAssetDataSources(@Param('ticker') ticker: string) {
  return this.assetsService.getDataSources(ticker);
}

// Response
{
  ticker: "PETR4",
  lastUpdate: "2025-12-02T10:30:00Z",
  overallConfidence: 0.85,
  sourcesUsed: ["fundamentus", "statusinvest", "investidor10"],
  fields: {
    pl: {
      finalValue: 5.42,
      finalSource: "fundamentus",
      allValues: [
        { source: "fundamentus", value: 5.42 },
        { source: "statusinvest", value: 5.45 },
        { source: "investidor10", value: 5.38 }
      ],
      consensus: 100,  // % de fontes com valor similar
      variance: 0.012
    },
    // ... outros campos
  }
}
```

#### 4.2 Componente React de Proveniência
```tsx
// components/DataSourceIndicator.tsx
interface DataSourceIndicatorProps {
  fieldName: string;
  sources: FieldSourceInfo[];
  finalSource: string;
  consensus: number;
}

export function DataSourceIndicator({
  fieldName, sources, finalSource, consensus
}: DataSourceIndicatorProps) {
  return (
    <Tooltip content={
      <div>
        <p className="font-bold">Fontes para {fieldName}:</p>
        {sources.map(s => (
          <p key={s.source}>
            {s.source}: {s.value}
            {s.source === finalSource && " ✓"}
          </p>
        ))}
        <p className="text-xs mt-2">Consenso: {consensus}%</p>
      </div>
    }>
      <Badge variant={consensus >= 80 ? "success" : consensus >= 50 ? "warning" : "destructive"}>
        {sources.length} fontes
      </Badge>
    </Tooltip>
  );
}
```

#### 4.3 Atualização da Página de Ativos
```tsx
// assets/[ticker]/page.tsx
<Card>
  <CardHeader>
    <CardTitle>Indicadores Fundamentalistas</CardTitle>
    <Badge variant="outline">
      {fundamentalData.metadata.sourcesCount} fontes
    </Badge>
  </CardHeader>
  <CardContent>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>P/L</TableCell>
          <TableCell>{fundamentalData.pl}</TableCell>
          <TableCell>
            <DataSourceIndicator
              fieldName="P/L"
              sources={fundamentalData.fieldSources?.pl?.values}
              finalSource={fundamentalData.fieldSources?.pl?.finalSource}
              consensus={calculateConsensus(fundamentalData.fieldSources?.pl)}
            />
          </TableCell>
        </TableRow>
        {/* ... outros indicadores */}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

#### 4.4 Tarefas
- [ ] Criar endpoint GET `/assets/:ticker/data-sources`
- [ ] Criar DTO de resposta `AssetDataSourcesDto`
- [ ] Criar componente `DataSourceIndicator`
- [ ] Atualizar página de detalhes do ativo
- [ ] Adicionar tooltip com detalhes por campo

---

### FASE 5: Dashboard de Qualidade de Scrapers (2-3 dias)

#### 5.1 Nova Entity para Métricas de Scrapers
```typescript
// scraper-metrics.entity.ts
@Entity('scraper_metrics')
export class ScraperMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scraperName: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int' })
  totalRequests: number;

  @Column({ type: 'int' })
  successfulRequests: number;

  @Column({ type: 'int' })
  failedRequests: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  successRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  avgResponseTime: number;

  @Column({ type: 'int' })
  outliersDetected: number;

  @Column({ type: 'jsonb', nullable: true })
  fieldCoverage: Record<string, number>;  // % de campos preenchidos

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 5.2 Dashboard de Qualidade
```
┌─────────────────────────────────────────────────────────────┐
│                    QUALIDADE DOS SCRAPERS                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Scraper         Taxa Sucesso   Tempo Médio   Cobertura    │
│  ────────────────────────────────────────────────────────  │
│  fundamentus     98.5%          2.3s          95%    ████  │
│  statusinvest    97.2%          1.8s          92%    ████  │
│  investidor10    96.8%          2.1s          88%    ███   │
│  brapi           94.5%          3.5s          75%    ███   │
│  investsite      93.2%          2.5s          70%    ██    │
│  fundamentei     85.0%          4.2s          65%    ██    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Campos com Maior Discrepância (últimos 7 dias)     │   │
│  │  • EV/EBITDA: 15% variância média                   │   │
│  │  • ROE: 12% variância média                         │   │
│  │  • Margem Líquida: 10% variância média              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3 Tarefas
- [ ] Criar entity `ScraperMetrics`
- [ ] Criar migration para tabela `scraper_metrics`
- [ ] Implementar coleta de métricas em `ScrapersService`
- [ ] Criar endpoint GET `/scrapers/metrics`
- [ ] Criar página `/admin/scrapers-quality`
- [ ] Implementar gráficos de tendência

---

### FASE 6: Detecção de Outliers e Alertas (2 dias)

#### 6.1 Sistema de Detecção de Outliers
```typescript
// outlier-detection.service.ts
@Injectable()
export class OutlierDetectionService {
  private readonly ZSCORE_THRESHOLD = 2.5;  // 2.5 desvios padrão

  detectOutliers(
    fieldName: string,
    values: Array<{ source: string; value: number }>
  ): Array<{ source: string; value: number; isOutlier: boolean; zScore: number }> {
    const validValues = values.filter(v => v.value !== null);
    if (validValues.length < 3) return validValues.map(v => ({ ...v, isOutlier: false, zScore: 0 }));

    const mean = validValues.reduce((sum, v) => sum + v.value, 0) / validValues.length;
    const stdDev = Math.sqrt(
      validValues.reduce((sum, v) => sum + Math.pow(v.value - mean, 2), 0) / validValues.length
    );

    return validValues.map(v => {
      const zScore = stdDev > 0 ? (v.value - mean) / stdDev : 0;
      return {
        ...v,
        isOutlier: Math.abs(zScore) > this.ZSCORE_THRESHOLD,
        zScore,
      };
    });
  }
}
```

#### 6.2 Sistema de Alertas
```typescript
// alerts.service.ts
enum AlertType {
  HIGH_VARIANCE = 'high_variance',
  SCRAPER_DOWN = 'scraper_down',
  INSUFFICIENT_SOURCES = 'insufficient_sources',
  OUTLIER_DETECTED = 'outlier_detected',
}

interface DataAlert {
  type: AlertType;
  ticker?: string;
  scraper?: string;
  field?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
}
```

#### 6.3 Tarefas
- [ ] Criar `OutlierDetectionService`
- [ ] Integrar detecção no fluxo de merge
- [ ] Criar entity `DataAlert`
- [ ] Implementar notificações WebSocket
- [ ] Criar página de alertas no frontend

---

## 📅 CRONOGRAMA SUGERIDO

```
Semana 1:
├── Dia 1-2: FASE 1 - Rastreamento de Origem
├── Dia 3:   FASE 2 - Coleta Completa
└── Dia 4-5: FASE 3 - Merge Inteligente

Semana 2:
├── Dia 1-3: FASE 4 - API e Frontend
├── Dia 4-5: FASE 5 - Dashboard de Qualidade

Semana 3:
├── Dia 1-2: FASE 6 - Outliers e Alertas
├── Dia 3:   Testes de integração
├── Dia 4:   Documentação
└── Dia 5:   Deploy e monitoramento
```

---

## 🔧 ARQUIVOS A MODIFICAR

### Backend
```
backend/src/
├── scrapers/
│   ├── scrapers.service.ts          # Remover early exit, novo merge
│   ├── outlier-detection.service.ts # NOVO
│   └── scraper-metrics.service.ts   # NOVO
├── api/assets/
│   ├── assets.controller.ts         # Novo endpoint data-sources
│   └── assets.service.ts            # Método getDataSources
├── database/
│   ├── entities/
│   │   ├── fundamental-data.entity.ts  # Adicionar field_sources
│   │   ├── scraper-metrics.entity.ts   # NOVO
│   │   └── data-alert.entity.ts        # NOVO
│   └── migrations/
│       └── XXXXXX-AddFieldSources.ts   # NOVA
└── websocket/
    └── websocket.gateway.ts         # Eventos de alerta
```

### Frontend
```
frontend/src/
├── components/
│   ├── ui/
│   │   └── data-source-indicator.tsx  # NOVO
│   └── assets/
│       └── fundamental-table.tsx      # Atualizar
├── app/(dashboard)/
│   ├── assets/[ticker]/
│   │   └── page.tsx                   # Adicionar indicadores
│   └── admin/
│       └── scrapers-quality/
│           └── page.tsx               # NOVO
└── lib/
    └── api.ts                         # Novo endpoint
```

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs do Projeto
| Métrica | Atual | Meta |
|---------|-------|------|
| Fontes mínimas | 2 | 3 |
| Fontes médias usadas | ~2.1 | 4+ |
| Confiança média | 0.55 | 0.75+ |
| Campos com rastreamento | 0% | 100% |
| Tempo médio de coleta | ~8s | <15s |

### Critérios de Aceite
- [ ] Todos os 6 scrapers são consultados em cada atualização
- [ ] Cada campo tem origem rastreada em `field_sources`
- [ ] Frontend mostra indicador de fontes por campo
- [ ] Dashboard de qualidade funcionando
- [ ] Alertas de outliers funcionando
- [ ] Documentação atualizada

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Aumento do tempo de coleta | Alta | Médio | Paralelizar scrapers sem login |
| Mais falhas por scraper | Média | Baixo | Sistema já tolerante a falhas |
| Complexidade do merge | Média | Médio | Testes unitários extensivos |
| Performance do JSONB | Baixa | Alto | Índices GIN, queries otimizadas |

---

## 📚 REFERÊNCIAS

- `scrapers.service.ts:40-87` - Fluxo atual de coleta
- `assets-update.service.ts:548-616` - Salvamento de dados
- `fundamental-data.entity.ts` - Estrutura atual
- `MAPEAMENTO_FONTES_DADOS_COMPLETO.md` - Campos por fonte

---

*Documento criado em 2025-12-02 - Versão 1.0*
