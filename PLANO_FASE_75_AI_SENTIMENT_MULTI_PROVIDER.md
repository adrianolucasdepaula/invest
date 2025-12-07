# PLANO FASE 75: AI Sentiment Multi-Provider

**Data:** 2025-12-06
**Tipo:** Feature + AI Integration
**Prioridade:** ALTA
**Estimativa:** 20-25h (expandido de 12-15h original)

---

## Objetivo

Implementar sistema de análise de sentimento de notícias financeiras utilizando **todos os 6 scrapers de IA disponíveis**, com cross-validation para maior confiabilidade.

---

## Scrapers Disponíveis

### AI Providers (6 scrapers) - Modelos Mais Recentes (06/Dez/2025)

| Provider | Scraper | Modelo Atual | Strengths | Benchmark |
|----------|---------|--------------|-----------|-----------|
| **OpenAI** | chatgpt_scraper.py | **GPT-5** (default) | Reasoning avançado, multimodal | SOTA multiple benchmarks |
| **Anthropic** | claude_scraper.py | **Claude Sonnet 4.5** | #1 coding, hybrid reasoning | 77.2% SWE-bench |
| **Google** | gemini_scraper.py | **Gemini 2.5 Pro** | 1M context, Deep Think | 1501 Elo LMArena |
| **DeepSeek** | deepseek_scraper.py | **DeepSeek-V3.2** | 685B params, 128K context | GPT-5 level |
| **xAI** | grok_scraper.py | **Grok 4.1** | Real-time X/Twitter data | Top Chatbot Arena |
| **Perplexity** | perplexity_scraper.py | **Sonar Pro** | Busca + citações + reasoning | Multi-source |

> **Fontes Oficiais (06/Dez/2025):**
> - [OpenAI](https://openai.com/) - GPT-5 released Aug 2025
> - [Anthropic](https://www.anthropic.com/) - Claude 4 family, Sonnet 4.5 (Sep 2025)
> - [Google AI](https://blog.google/technology/ai/) - Gemini 2.5 Pro
> - [DeepSeek API Docs](https://api-docs.deepseek.com/news/news251201) - V3.2 released Dec 2025
> - [xAI](https://x.ai/) - Grok 4.1 (Nov 2025)
> - [Perplexity](https://www.perplexity.ai/changelog) - Sonar Pro (Feb 2025)

### News Sources (7 scrapers)

| Source | Scraper | Tipo | Cobertura |
|--------|---------|------|-----------|
| **Google News** | googlenews_scraper.py | Agregador | Global + Brasil |
| **InfoMoney** | infomoney_scraper.py | Portal BR | Foco em B3 |
| **Valor Econômico** | valor_scraper.py | Jornal BR | Economia + Mercado |
| **Estadão Investidor** | estadao_scraper.py | Jornal BR | Análises institucionais |
| **Exame** | exame_scraper.py | Revista BR | Negócios + Mercado |
| **Bloomberg** | bloomberg_scraper.py | Global | Mercados internacionais |
| **Investing.com** | investing_news_scraper.py | Portal Global | Dados + Notícias |

**Total: 13 scrapers** (6 AI + 7 News)

---

## Arquitetura

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASE 75 - AI SENTIMENT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     NEWS SOURCES (7 scrapers)                     │  │
│  │                                                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │ Google  │ │InfoMoney│ │  Valor  │ │ Estadão │ │  Exame  │    │  │
│  │  │  News   │ │         │ │Econômico│ │Investidor│ │         │    │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │  │
│  │       │           │           │           │           │         │  │
│  │  ┌────┴───────────┴───────────┴───────────┴───────────┴────┐    │  │
│  │  │              ┌─────────┐ ┌─────────┐                    │    │  │
│  │  │              │Bloomberg│ │Investing│                    │    │  │
│  │  │              │         │ │  .com   │                    │    │  │
│  │  │              └────┬────┘ └────┬────┘                    │    │  │
│  │  └───────────────────┴───────────┴─────────────────────────┘    │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │                                      │
│                                 ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    NEWS COLLECTOR SERVICE                         │ │
│  │  - Deduplica por URL                                              │ │
│  │  - Normaliza formato                                              │ │
│  │  - Associa ticker                                                 │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                 │                                      │
│                                 ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                         NEWS TABLE                                │ │
│  │  id, ticker, title, summary, url, source, published_at           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                 │                                      │
│                                                          │             │
│                                                          ▼             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    AI SENTIMENT ORCHESTRATOR                      │ │
│  │                                                                   │ │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │
│  │   │ ChatGPT │ │ Claude  │ │ Gemini  │ │DeepSeek │ │  Grok   │    │ │
│  │   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │ │
│  │        │           │           │           │           │         │ │
│  │        ▼           ▼           ▼           ▼           ▼         │ │
│  │   ┌─────────────────────────────────────────────────────────┐    │ │
│  │   │              CROSS-VALIDATION ENGINE                     │    │ │
│  │   │                                                          │    │ │
│  │   │  ┌─────────────────────────────────────────────────┐    │    │ │
│  │   │  │ Consensus Algorithm:                            │    │    │ │
│  │   │  │ - Mínimo 3 providers concordando                │    │    │ │
│  │   │  │ - Weighted average por provider reliability     │    │    │ │
│  │   │  │ - Outlier detection (provider divergente)       │    │    │ │
│  │   │  │ - Confidence score baseado em concordância      │    │    │ │
│  │   │  └─────────────────────────────────────────────────┘    │    │ │
│  │   │                                                          │    │ │
│  │   └──────────────────────────┬───────────────────────────────┘    │ │
│  │                              │                                    │ │
│  └──────────────────────────────┼────────────────────────────────────┘ │
│                                 │                                      │
│                                 ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    NEWS_ANALYSIS TABLE                            │ │
│  │                                                                   │ │
│  │  id, news_id, provider, sentiment_score, confidence,             │ │
│  │  analysis_text, key_factors, created_at                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                 │                                      │
│                                 ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    SENTIMENT_CONSENSUS TABLE                      │ │
│  │                                                                   │ │
│  │  id, news_id, final_sentiment, confidence_score,                 │ │
│  │  providers_count, consensus_details (JSON)                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Fases de Implementação

### FASE 75.1: Database Schema (3h)

**Entidades a criar:**

```typescript
// News entity
@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, { nullable: true })
  asset: Asset;

  @Column()
  ticker: string;

  @Column()
  title: string;

  @Column('text')
  summary: string;

  @Column()
  url: string;

  @Column()
  source: string; // 'GOOGLE_NEWS', 'RSS_INFOMONEY', etc.

  @Column({ type: 'timestamp' })
  publishedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => NewsAnalysis, (analysis) => analysis.news)
  analyses: NewsAnalysis[];

  @OneToOne(() => SentimentConsensus, (consensus) => consensus.news)
  consensus: SentimentConsensus;
}

// NewsAnalysis entity (one per AI provider)
@Entity('news_analysis')
export class NewsAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => News, (news) => news.analyses)
  news: News;

  @Column()
  provider: string; // 'CHATGPT', 'CLAUDE', 'GEMINI', 'DEEPSEEK', 'GROK', 'PERPLEXITY'

  @Column('decimal', { precision: 4, scale: 3 })
  sentimentScore: number; // -1.000 to +1.000

  @Column('decimal', { precision: 4, scale: 3 })
  confidence: number; // 0.000 to 1.000

  @Column('text')
  analysisText: string;

  @Column('jsonb', { nullable: true })
  keyFactors: {
    bullish: string[];
    bearish: string[];
    neutral: string[];
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

// SentimentConsensus entity (cross-validated result)
@Entity('sentiment_consensus')
export class SentimentConsensus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => News, (news) => news.consensus)
  @JoinColumn()
  news: News;

  @Column('decimal', { precision: 4, scale: 3 })
  finalSentiment: number; // -1.000 to +1.000 (consensus)

  @Column('decimal', { precision: 4, scale: 3 })
  confidenceScore: number; // 0.000 to 1.000

  @Column('int')
  providersCount: number; // How many providers analyzed

  @Column('int')
  agreementCount: number; // How many agreed with consensus

  @Column('jsonb')
  consensusDetails: {
    providers: {
      name: string;
      score: number;
      weight: number;
      agreed: boolean;
    }[];
    outliers: string[];
    methodology: string;
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**Migration:**
```bash
npm run migration:generate -- -n CreateNewsAndSentimentTables
```

---

### FASE 75.2: News Collector Service (4h)

**Implementação:**

```typescript
// backend/src/news/news-collector.service.ts
@Injectable()
export class NewsCollectorService {
  private readonly logger = new Logger(NewsCollectorService.name);

  async collectNewsForTicker(ticker: string): Promise<News[]> {
    const sources = [
      this.collectFromGoogleNews(ticker),
      this.collectFromInfomoneyRSS(ticker),
      this.collectFromValorRSS(ticker),
    ];

    const results = await Promise.allSettled(sources);
    // Deduplicate by URL, save to database
  }

  private async collectFromGoogleNews(ticker: string): Promise<RawNews[]> {
    // Google News RSS: https://news.google.com/rss/search?q={ticker}+stock
  }
}
```

---

### FASE 75.3: AI Sentiment Orchestrator (8h)

**Core Service:**

```typescript
// backend/src/sentiment/sentiment-orchestrator.service.ts
@Injectable()
export class SentimentOrchestratorService {
  private readonly providers = [
    'CHATGPT',
    'CLAUDE',
    'GEMINI',
    'DEEPSEEK',
    'GROK',
    'PERPLEXITY',
  ];

  async analyzeNews(news: News): Promise<SentimentConsensus> {
    // 1. Queue analysis jobs for each provider
    const jobs = this.providers.map(provider =>
      this.queueAnalysis(news, provider)
    );

    // 2. Wait for minimum 3 providers
    const analyses = await this.waitForMinimumAnalyses(jobs, 3);

    // 3. Cross-validate and calculate consensus
    const consensus = this.calculateConsensus(analyses);

    // 4. Save and return
    return this.saveConsensus(news, consensus);
  }

  private calculateConsensus(analyses: NewsAnalysis[]): ConsensusResult {
    // Weighted average based on provider reliability
    // Outlier detection
    // Confidence based on agreement
  }
}
```

**Prompt Template (para todos os providers):**

```typescript
const SENTIMENT_PROMPT = `
Analise a seguinte notícia sobre a ação {ticker} da B3:

Título: {title}
Resumo: {summary}

Responda em JSON com o seguinte formato:
{
  "sentiment_score": <número de -1.0 (muito negativo) a +1.0 (muito positivo)>,
  "confidence": <número de 0.0 a 1.0 indicando sua confiança>,
  "key_factors": {
    "bullish": ["fator positivo 1", "fator positivo 2"],
    "bearish": ["fator negativo 1"],
    "neutral": ["fator neutro 1"]
  },
  "analysis": "<análise breve em 2-3 frases>"
}

Considere:
- Impacto nos resultados futuros
- Riscos e oportunidades
- Contexto do mercado brasileiro
`;
```

---

### FASE 75.4: Cross-Validation Engine (3h)

**Algoritmo de Consenso:**

```typescript
interface ProviderWeight {
  CHATGPT: 1.0;     // GPT-4 - alta confiabilidade
  CLAUDE: 1.0;      // Claude 3.5 - alta confiabilidade
  GEMINI: 0.9;      // Gemini - bom, mas menor contexto
  DEEPSEEK: 0.8;    // DeepSeek - bom para dados
  GROK: 0.7;        // Grok - dados em tempo real
  PERPLEXITY: 0.8;  // Perplexity - bom para pesquisa
}

function calculateConsensus(analyses: NewsAnalysis[]): ConsensusResult {
  // 1. Weighted average
  const weightedSum = analyses.reduce((sum, a) =>
    sum + a.sentimentScore * ProviderWeight[a.provider], 0
  );
  const totalWeight = analyses.reduce((sum, a) =>
    sum + ProviderWeight[a.provider], 0
  );
  const averageScore = weightedSum / totalWeight;

  // 2. Calculate standard deviation
  const variance = analyses.reduce((sum, a) =>
    sum + Math.pow(a.sentimentScore - averageScore, 2), 0
  ) / analyses.length;
  const stdDev = Math.sqrt(variance);

  // 3. Identify outliers (> 2 std devs from mean)
  const outliers = analyses.filter(a =>
    Math.abs(a.sentimentScore - averageScore) > 2 * stdDev
  );

  // 4. Recalculate without outliers
  const validAnalyses = analyses.filter(a => !outliers.includes(a));

  // 5. Confidence = agreement ratio * average confidence
  const agreementRatio = validAnalyses.length / analyses.length;
  const avgConfidence = validAnalyses.reduce((s, a) => s + a.confidence, 0) / validAnalyses.length;

  return {
    finalSentiment: recalculatedAverage,
    confidenceScore: agreementRatio * avgConfidence,
    agreementCount: validAnalyses.length,
    outliers: outliers.map(o => o.provider),
  };
}
```

---

### FASE 75.5: Frontend - Dashboard Widget (4h)

**Termômetro do Mercado:**

```tsx
// frontend/src/components/dashboard/MarketSentimentWidget.tsx
export function MarketSentimentWidget() {
  const { data: sentiment } = useSentimentSummary();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Termômetro do Mercado
      </h3>

      {/* Gauge visual */}
      <SentimentGauge value={sentiment.overall} />

      {/* Breakdown by sector */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {sentiment.sectors.map(sector => (
          <SectorSentiment key={sector.name} {...sector} />
        ))}
      </div>

      {/* Recent news */}
      <RecentNewsWithSentiment news={sentiment.recentNews} />
    </Card>
  );
}
```

---

### FASE 75.6: Frontend - Asset News Page (3h)

**Notícias por ativo:**

```tsx
// frontend/src/app/(dashboard)/assets/[ticker]/news/page.tsx
export default function AssetNewsPage({ params: { ticker } }) {
  const { data: news } = useAssetNews(ticker);

  return (
    <div className="space-y-6">
      <h2>Notícias - {ticker}</h2>

      {/* Sentiment summary for this ticker */}
      <TickerSentimentCard ticker={ticker} />

      {/* News list with sentiment badges */}
      <NewsList news={news} showSentiment />
    </div>
  );
}
```

---

### FASE 75.7: Calendário Econômico (4h)

**Objetivo:** Integrar calendário de eventos econômicos para contextualizar análise de sentimento.

**Fontes de dados:**

| Fonte | URL | Dados |
|-------|-----|-------|
| **Investing.com** | https://br.investing.com/economic-calendar/ | Eventos globais + Brasil |
| **FRED** | fred_scraper.py (existente) | Indicadores US macro |
| **BCB** | bcb_scraper.py (existente) | COPOM, IPCA, SELIC |

**Entidade EconomicEvent:**

```typescript
@Entity('economic_events')
export class EconomicEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  country: string; // 'BR', 'US', 'EU', etc.

  @Column({ type: 'enum', enum: EventImportance })
  importance: EventImportance; // 'low', 'medium', 'high'

  @Column({ name: 'event_date', type: 'timestamp with time zone' })
  eventDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  actual: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  forecast: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  previous: number;

  @Column({ nullable: true })
  unit: string; // '%', 'M', 'B', etc.

  @Column()
  source: string;
}
```

**Widget Calendário no Dashboard:**

```tsx
// frontend/src/components/dashboard/EconomicCalendarWidget.tsx
export function EconomicCalendarWidget() {
  const { data: events } = useUpcomingEvents();

  return (
    <Card>
      <h3>Próximos Eventos Econômicos</h3>
      <EventTimeline events={events} />
    </Card>
  );
}
```

---

## Validação

### Critérios de Aceite

- [ ] 6 AI providers integrados e funcionando
- [ ] Cross-validation com mínimo 3 providers concordando
- [ ] Confidence score calculado corretamente
- [ ] Widget Termômetro no Dashboard
- [ ] Notícias por ativo funcionando
- [ ] Calendário Econômico integrado
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] MCP Triplo: Validado

### Métricas de Qualidade

| Métrica | Target |
|---------|--------|
| Providers respondendo | ≥ 4/6 |
| Tempo médio de análise | < 30s |
| Taxa de consenso | > 80% |
| Confidence score médio | > 0.7 |
| Eventos próximos 7 dias | ≥ 5 |

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Rate limiting dos providers | Alto | Queue com delays, fallback graceful |
| Cookies expirados | Médio | OAuth refresh automático |
| Inconsistência entre providers | Médio | Cross-validation robusto |
| Custo de API (se usar) | Baixo | Usar browser automation (free) |
| Cloudflare no Investing.com | Médio | Playwright + cookies persistentes |

---

## Próximos Passos

1. **Criar branch:** `git checkout -b feat/fase-75-ai-sentiment`
2. **Iniciar FASE 75.1:** Criar entidades e migration
3. **Validar schema:** Rodar migration e verificar tabelas
4. **FASE 75.7:** Adicionar entidade EconomicEvent e scraper

---

**Estimativa Total:** 24-30h (expandido com Calendário Econômico)
**Complexidade:** ALTA
**Dependências:** FASE 66 (OAuth scrapers) ✅
