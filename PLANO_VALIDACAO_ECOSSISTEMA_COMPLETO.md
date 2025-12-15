# PLANO DE VALIDACAO DO ECOSSISTEMA COMPLETO

## B3 AI Analysis Platform - Validacao 100%

**Versao:** 1.0.0
**Data:** 2025-12-15
**Status:** PRONTO PARA EXECUCAO
**Autor:** Claude Opus 4.5 (PM Expert Agent)

---

## SUMARIO

1. [Sumario Executivo](#1-sumario-executivo)
2. [Escopo Completo](#2-escopo-completo)
3. [Mapeamento de Componentes](#3-mapeamento-de-componentes)
4. [Cenarios de Teste - Frontend](#4-cenarios-de-teste---frontend)
5. [Cenarios de Teste - Backend](#5-cenarios-de-teste---backend)
6. [Cenarios de Teste - Infraestrutura](#6-cenarios-de-teste---infraestrutura)
7. [Cenarios de Teste - Python Scrapers](#7-cenarios-de-teste---python-scrapers)
8. [Validacoes Obrigatorias](#8-validacoes-obrigatorias)
9. [Gaps Identificados](#9-gaps-identificados)
10. [Plano de Execucao](#10-plano-de-execucao)

---

## 1. SUMARIO EXECUTIVO

### 1.1 Visao Geral do Projeto

**B3 AI Analysis Platform** e uma plataforma de analise de investimentos para a bolsa brasileira (B3) com:

- **861 ativos** cadastrados
- **30+ fontes de dados** externas
- **34 Python scrapers** para coleta automatizada
- **6 modelos de IA** integrados (ChatGPT, Gemini, Claude, DeepSeek, Grok, Perplexity)
- **Cross-validation** com minimo 3 fontes por dado

### 1.2 Stack Tecnologico

| Camada | Tecnologia | Versao |
|--------|------------|--------|
| Frontend | Next.js (App Router) | 14.x |
| Backend | NestJS | 10.x |
| Banco de Dados | PostgreSQL + TimescaleDB | 16.x |
| Cache | Redis | 7.x |
| Filas | BullMQ | - |
| Scrapers | Python + Playwright | 3.11+ |
| Containers | Docker Compose | - |

### 1.3 Metricas do Ecossistema

| Categoria | Quantidade | Validado |
|-----------|------------|----------|
| Paginas Frontend | 19 | Pendente |
| Componentes React | 82+ | Pendente |
| Hooks React | 16 | Pendente |
| Controllers Backend | 11 | Pendente |
| Services Backend | 18 | Pendente |
| Entities TypeORM | 25 | Pendente |
| Migrations | 26 | Pendente |
| Python Scrapers | 34 | Pendente |
| Containers Docker | 18+ | Pendente |
| APIs Externas | 30+ | Pendente |

### 1.4 Objetivos da Validacao

1. **Zero Tolerance Compliance:** 0 erros TypeScript, 0 falhas de build
2. **Cobertura 100%:** Todas as paginas, endpoints e containers validados
3. **MCP Triplo:** Playwright + Chrome DevTools + a11y em cada pagina
4. **Cross-Validation:** Verificar integridade de dados financeiros
5. **Performance:** Response time < 2s para operacoes criticas
6. **Acessibilidade:** WCAG 2.1 AA compliance

---

## 2. ESCOPO COMPLETO

### 2.1 Frontend (Next.js 14)

#### 2.1.1 Paginas Autenticadas (Dashboard Group)

| # | Pagina | Rota | Componentes Criticos | Prioridade |
|---|--------|------|---------------------|------------|
| 1 | Dashboard | `/dashboard` | StatCard, AssetTable, MarketThermometer, EconomicIndicators | ALTA |
| 2 | Assets List | `/assets` | AssetTable, BulkSyncButton, FilterControls, SearchBar | ALTA |
| 3 | Asset Detail | `/assets/[ticker]` | CandlestickChart, FundamentalMetrics, TickerNews, PriceHistory | ALTA |
| 4 | Portfolio | `/portfolio` | AddPositionDialog, PortfolioSummary, PositionTable | ALTA |
| 5 | Analysis | `/analysis` | NewAnalysisDialog, AIAnalysisCard, AnalysisList | ALTA |
| 6 | Reports List | `/reports` | ReportList, ReportFilters, DownloadButtons | MEDIA |
| 7 | Report Detail | `/reports/[id]` | ReportViewer, PDFExport, ChartExport | MEDIA |
| 8 | Data Management | `/data-management` | SyncConfigModal, AuditTrailPanel, BulkOperations | MEDIA |
| 9 | Data Sources | `/data-sources` | ScraperCard, TestResultModal, SourceStatus | MEDIA |
| 10 | Discrepancies | `/discrepancies` | DiscrepancyTable, ResolutionModal, CrossValidation | ALTA |
| 11 | Settings | `/settings` | ProfileForm, NotificationSettings, APIKeys | BAIXA |
| 12 | OAuth Manager | `/oauth-manager` | SiteList, VNCViewer, SessionManager | MEDIA |
| 13 | Wheel Strategy | `/wheel` | WheelDashboard, StrategyList, ProfitCalc | MEDIA |
| 14 | Wheel Detail | `/wheel/[id]` | TradeHistory, RollManagement, Profitability | MEDIA |
| 15 | Health Dashboard | `/health` | ServiceStatus, ContainerHealth, MetricsChart | ALTA |

#### 2.1.2 Paginas Publicas

| # | Pagina | Rota | Componentes Criticos | Prioridade |
|---|--------|------|---------------------|------------|
| 16 | Login | `/login` | LoginForm, GoogleOAuth, RememberMe | ALTA |
| 17 | Register | `/register` | RegisterForm, PasswordStrength, Terms | ALTA |
| 18 | OAuth Callback | `/auth/google/callback` | CallbackHandler, TokenExchange | ALTA |
| 19 | Landing | `/` | Hero, Features, CTA | BAIXA |

#### 2.1.3 Componentes Principais (82+)

**Charts & Visualizacao:**
- CandlestickChart (lightweight-charts)
- PriceChart (Recharts)
- FundamentalChart
- PortfolioChart
- MarketThermometer
- EconomicIndicators

**Data Display:**
- AssetTable
- PortfolioSummary
- AnalysisList
- NewsCard
- StatCard
- MetricCard

**Forms & Inputs:**
- SearchBar
- FilterControls
- DateRangePicker
- TickerSelect
- PriceInput

**Dialogs & Modals:**
- NewAnalysisDialog
- AddPositionDialog
- SyncConfigModal
- ResolutionModal
- ConfirmDialog

**Layout:**
- Sidebar
- Header
- PageLayout
- LoadingState
- ErrorBoundary

#### 2.1.4 Hooks React (16)

| Hook | Funcao | Cache TTL | Prioridade |
|------|--------|-----------|------------|
| useAssets | Listar ativos | 5 min | ALTA |
| useAsset | Ativo individual | Fresh | ALTA |
| useAssetPrices | Precos historicos | 1 min | ALTA |
| useAssetFundamentals | Dados fundamentalistas | 30 min | ALTA |
| useAnalysis | Resultados de analise | 5 min | ALTA |
| usePortfolio | Portfolio do usuario | 5 min | ALTA |
| useDataSync | Sincronizacao de dados | - | MEDIA |
| useSyncWebSocket | Conexao WebSocket | - | ALTA |
| useDebounce | Debounce generico | - | BAIXA |
| useLocalStorage | Persistencia local | - | BAIXA |
| useMediaQuery | Responsividade | - | BAIXA |
| useToast | Notificacoes | - | BAIXA |
| useCrossValidation | Cross-validation | 5 min | MEDIA |
| useEconomicIndicators | Indicadores economicos | 1h | MEDIA |
| useNews | Noticias | 5 min | MEDIA |
| useWheel | Estrategia Wheel | 5 min | MEDIA |

### 2.2 Backend (NestJS 10)

#### 2.2.1 Controllers (11)

| # | Controller | Endpoints | Metodos | Prioridade |
|---|------------|-----------|---------|------------|
| 1 | AssetsController | 15 | GET, POST | ALTA |
| 2 | AssetsUpdateController | 8 | GET, POST | ALTA |
| 3 | AnalysisController | 8 | GET, POST, DELETE | ALTA |
| 4 | MarketDataController | 9 | GET, POST | ALTA |
| 5 | PortfolioController | 9 | GET, POST, PATCH, DELETE | ALTA |
| 6 | ReportsController | 5 | GET, POST | MEDIA |
| 7 | AuthController | 5 | GET, POST | ALTA |
| 8 | EconomicIndicatorsController | 4 | GET, POST | MEDIA |
| 9 | NewsController | 17 | GET, POST | MEDIA |
| 10 | DataSourcesController | 2 | GET | MEDIA |
| 11 | WheelController | - | GET, POST, PATCH, DELETE | MEDIA |

#### 2.2.2 Services (18)

| # | Service | Dependencias | Funcao Principal |
|---|---------|--------------|------------------|
| 1 | AssetsService | TypeORM, Redis | CRUD de ativos |
| 2 | AssetsUpdateService | BullMQ, Scrapers | Atualizacao em lote |
| 3 | AnalysisService | AI Providers | Geracao de analises |
| 4 | MarketDataService | External APIs | Dados de mercado |
| 5 | PortfolioService | TypeORM | Gerenciamento de portfolio |
| 6 | ReportsService | PDFKit | Geracao de relatorios |
| 7 | AIReportService | AI Providers | Relatorios com IA |
| 8 | PDFGeneratorService | PDFKit | Exportacao PDF |
| 9 | AuthService | JWT, Passport | Autenticacao |
| 10 | EconomicIndicatorsService | BCB, FRED | Indicadores economicos |
| 11 | NewsService | Scrapers | Agregacao de noticias |
| 12 | NewsCollectorsService | Playwright | Coleta de noticias |
| 13 | AIOrchestrerService | Multiple AI | Orquestracao de IA |
| 14 | ConsensusService | - | Consenso de analises |
| 15 | EconomicCalendarService | APIs | Calendario economico |
| 16 | DataSourcesService | TypeORM | Fontes de dados |
| 17 | TickerMergeService | TypeORM | Fusao de tickers |
| 18 | WheelService | TypeORM | Estrategia Wheel |

#### 2.2.3 Entities TypeORM (25)

| # | Entity | Campos Principais | Relacionamentos |
|---|--------|-------------------|-----------------|
| 1 | Asset | ticker, name, type, sector, subsector | prices, fundamentals, analyses |
| 2 | AssetPrice | date, open, high, low, close, volume | asset |
| 3 | IntradayPrice | timestamp, price, volume | asset (hypertable) |
| 4 | FundamentalData | 38+ indicadores (P/L, ROE, DY, etc) | asset |
| 5 | Analysis | type, result, confidence, provider | asset |
| 6 | Portfolio | name, description | user, positions |
| 7 | PortfolioPosition | ticker, quantity, avgPrice | portfolio |
| 8 | User | email, password, googleId, role | portfolios |
| 9 | News | title, content, source, sentiment | analyses |
| 10 | NewsAnalysis | sentiment, summary, provider | news |
| 11 | SentimentConsensus | overallSentiment, confidence | asset |
| 12 | EconomicIndicator | name, value, date, source | - |
| 13 | EconomicEvent | name, date, impact, actual, forecast | - |
| 14 | TickerChange | oldTicker, newTicker, changeDate | - |
| 15 | DataSource | name, type, status, lastSync | - |
| 16 | ScrapedData | source, data, timestamp | asset |
| 17 | ScraperMetric | scraper, duration, success | - |
| 18 | SyncHistory | type, status, startedAt, completedAt | - |
| 19 | UpdateLog | entity, operation, changedFields | - |
| 20 | Alert | type, condition, triggered | user, asset |
| 21 | DiscrepancyResolution | field, oldValue, newValue, resolution | - |
| 22 | CrossValidationConfig | field, sources, threshold | - |
| 23 | WheelStrategy | asset, status, targetPremium | user, trades |
| 24 | WheelTrade | type, strike, premium, expiration | strategy |
| 25 | OptionPrice | ticker, strike, type, premium, expiry | - |

#### 2.2.4 Migrations (26)

| # | Migration | Descricao |
|---|-----------|-----------|
| 1 | InitialSchema | Schema inicial |
| 2 | AddUniqueConstraintAnalyses | Constraint unico em analyses |
| 3 | AddCollectedAtToAssetPrices | Campo collectedAt |
| 4 | CreateScraperMetrics | Tabela de metricas |
| 5 | AddSourceToAssetPrices | Campo source |
| 6 | AddAssetUpdateTracking | Tracking de updates |
| 7 | AddChangeFieldsToAssetPrices | Campos de variacao |
| 8 | AddUniqueConstraintAssetPrices | Constraint unico |
| 9 | RenameUniqueConstraintAssetPrices | Renomear constraint |
| 10 | UpdateAssetPricePrecision | Precisao decimal |
| 11 | CreateSyncHistory | Historico de sync |
| 12 | CreateTickerChanges | Mudancas de ticker |
| 13 | AddOptionsLiquidityToAssets | Liquidez de opcoes |
| 14 | CreateEconomicIndicators | Indicadores economicos |
| 15 | AddFieldSourcesToFundamentalData | Sources em fundamentals |
| 16 | CreateIntradayPricesHypertable | Hypertable TimescaleDB |
| 17 | CreateNewsSentimentTables | Tabelas de sentimento |
| 18 | AddLpaVpaLiquidezCorrente | Indicadores adicionais |
| 19 | CreateDiscrepancyResolutions | Resolucao de discrepancias |
| 20 | CreateCrossValidationConfig | Config de cross-validation |
| 21 | CreateWheelTables | Estrategia Wheel |
| 22 | CreateOptionPricesTable | Precos de opcoes |
| 23 | AddOptionPriceIndexes | Indexes de opcoes |
| 24 | OptimizeAssetPriceIndexes | Otimizacao de indexes |
| 25 | CreateAssetPricesArchive | Arquivamento de precos |
| 26 | ... | ... |

### 2.3 Infraestrutura (Docker)

#### 2.3.1 Containers por Profile

**Profile: default (Core - 8 servicos)**

| # | Container | Imagem | Porta | Health Check |
|---|-----------|--------|-------|--------------|
| 1 | postgres | postgres:16 | 5532 | pg_isready |
| 2 | redis | redis:7-alpine | 6479 | redis-cli ping |
| 3 | backend | node:20-alpine | 3101 | /api/v1/health |
| 4 | frontend | node:20-alpine | 3100 | HTTP 200 |
| 5 | scrapers | python:3.11 | 8000 | /health |
| 6 | api-service | python:3.11 | 8000 | /health |
| 7 | python-service | python:3.11 | 8001 | /health |
| 8 | orchestrator | node:20-alpine | - | - |

**Profile: dev (+2 servicos)**

| # | Container | Porta | Funcao |
|---|-----------|-------|--------|
| 9 | pgadmin | 5150 | Admin PostgreSQL |
| 10 | redis-commander | 8181 | Admin Redis |

**Profile: observability (+4 servicos)**

| # | Container | Porta | Funcao |
|---|-----------|-------|--------|
| 11 | tempo | 3200 | Distributed tracing |
| 12 | loki | 3100 | Log aggregation |
| 13 | prometheus | 9090 | Metricas |
| 14 | grafana | 3000 | Dashboards |

**Profile: production (+1 servico)**

| # | Container | Porta | Funcao |
|---|-----------|-------|--------|
| 15 | nginx | 80/443 | Reverse proxy |

**Servicos Auxiliares**

| # | Container | Porta | Funcao |
|---|-----------|-------|--------|
| 16 | vnc | 5900 | VNC para OAuth |
| 17 | novnc | 6080 | Web VNC |
| 18 | oauth-api | 8080 | API de OAuth |

### 2.4 Python Scrapers (34)

#### 2.4.1 Por Categoria

**Dados Fundamentalistas (10)**

| # | Scraper | Fonte | Status |
|---|---------|-------|--------|
| 1 | fundamentus_scraper.py | Fundamentus | Migrado Playwright |
| 2 | statusinvest_scraper.py | StatusInvest | Pendente |
| 3 | investsite_scraper.py | InvestSite | Pendente |
| 4 | investidor10_scraper.py | Investidor10 | Pendente |
| 5 | fundamentei_scraper.py | Fundamentei | Pendente |
| 6 | tradingview_scraper.py | TradingView | Pendente |
| 7 | griffin_scraper.py | Griffin | Pendente |
| 8 | googlefinance_scraper.py | Google Finance | Pendente |
| 9 | maisretorno_scraper.py | Mais Retorno | Pendente |
| 10 | advfn_scraper.py | ADVFN | Pendente |

**Noticias (7)**

| # | Scraper | Fonte | Status |
|---|---------|-------|--------|
| 11 | bloomberg_scraper.py | Bloomberg | Pendente |
| 12 | googlenews_scraper.py | Google News | Pendente |
| 13 | valor_scraper.py | Valor Economico | Pendente |
| 14 | exame_scraper.py | Exame | Pendente |
| 15 | infomoney_scraper.py | InfoMoney | Pendente |
| 16 | estadao_scraper.py | Estadao | Pendente |
| 17 | investing_news_scraper.py | Investing.com | Pendente |

**Analise IA (6)**

| # | Scraper | Modelo | Status |
|---|---------|--------|--------|
| 18 | chatgpt_scraper.py | GPT-4 | Pendente |
| 19 | gemini_scraper.py | Gemini Pro | Pendente |
| 20 | claude_scraper.py | Claude 3 | Pendente |
| 21 | deepseek_scraper.py | DeepSeek | Pendente |
| 22 | grok_scraper.py | Grok | Pendente |
| 23 | perplexity_scraper.py | Perplexity | Pendente |

**Dados de Mercado (6)**

| # | Scraper | Fonte | Status |
|---|---------|-------|--------|
| 24 | yahoo_finance_scraper.py | Yahoo Finance | Pendente |
| 25 | investing_scraper.py | Investing.com | Pendente |
| 26 | b3_scraper.py | B3 | Pendente |
| 27 | coinmarketcap_scraper.py | CoinMarketCap | Pendente |
| 28 | oplab_scraper.py | OpLab | Pendente |
| 29 | kinvo_scraper.py | Kinvo | Pendente |

**Indicadores Economicos (4)**

| # | Scraper | Fonte | Status |
|---|---------|-------|--------|
| 30 | bcb_scraper.py | Banco Central | Migrado Playwright |
| 31 | anbima_scraper.py | ANBIMA | Pendente |
| 32 | fred_scraper.py | FRED | Pendente |
| 33 | ipeadata_scraper.py | IPEA Data | Pendente |

**Opcoes (1)**

| # | Scraper | Fonte | Status |
|---|---------|-------|--------|
| 34 | opcoes_scraper.py | Opcoes.net.br | Pendente |

### 2.5 Filas BullMQ

#### 2.5.1 Queues Configuradas

| Queue | Processor | Funcao | Concorrencia |
|-------|-----------|--------|--------------|
| scraping | ScrapingProcessor | Coleta de dados | 3 |
| asset-updates | AssetUpdateProcessor | Atualizacao de ativos | 5 |
| analysis | AnalysisProcessor | Geracao de analises | 2 |
| reports | ReportsProcessor | Geracao de relatorios | 1 |
| dead-letter | DeadLetterProcessor | Jobs falhados | 1 |

#### 2.5.2 Jobs Agendados

| Job | Cron | Funcao |
|-----|------|--------|
| dailyPriceUpdate | 0 18 * * 1-5 | Atualizar precos EOD |
| weeklyFundamentals | 0 6 * * 6 | Atualizar dados fundamentalistas |
| hourlyNews | 0 * * * * | Coletar noticias |
| dailyEconomicIndicators | 0 9 * * * | Indicadores economicos |

### 2.6 WebSocket Events

#### 2.6.1 Events Disponiveis

| Event | Payload | Direcao |
|-------|---------|---------|
| price_update | { ticker, price, change } | Server -> Client |
| analysis_complete | { analysisId, result } | Server -> Client |
| batch_update_progress | { current, total, status } | Server -> Client |
| sync_started | { syncId, type } | Server -> Client |
| sync_completed | { syncId, success, errors } | Server -> Client |
| scraper_status | { scraper, status, lastRun } | Server -> Client |
| error | { code, message } | Server -> Client |
| subscribe_ticker | { ticker } | Client -> Server |
| unsubscribe_ticker | { ticker } | Client -> Server |
| subscribe_sync | { syncId } | Client -> Server |

---

## 3. MAPEAMENTO DE COMPONENTES

### 3.1 Arquitetura de Alto Nivel

```
                                   +-----------------+
                                   |    USUARIOS     |
                                   +--------+--------+
                                            |
                                   +--------v--------+
                                   |     NGINX       |
                                   | (Reverse Proxy) |
                                   +--------+--------+
                                            |
                    +-----------------------+-----------------------+
                    |                                               |
           +--------v--------+                             +--------v--------+
           |    FRONTEND     |                             |     BACKEND     |
           |   (Next.js)     |                             |    (NestJS)     |
           |    :3100        |<--------------------------->|     :3101       |
           +--------+--------+                             +--------+--------+
                    |                                               |
                    |                      +------------------------+------------------------+
                    |                      |                        |                        |
                    |             +--------v--------+      +--------v--------+      +--------v--------+
                    |             |   POSTGRESQL    |      |      REDIS      |      |     BULLMQ      |
                    |             |     :5532       |      |      :6479      |      |     (Queues)    |
                    |             +-----------------+      +-----------------+      +--------+--------+
                    |                                                                        |
                    |                                                               +--------v--------+
                    |                                                               | PYTHON SCRAPERS |
                    |                                                               |   (Playwright)  |
                    |                                                               +--------+--------+
                    |                                                                        |
                    |                                                               +--------v--------+
                    |                                                               |  EXTERNAL APIs  |
                    +-------------------------------------------------------------->|  (30+ sources)  |
                                                                                    +-----------------+
```

### 3.2 Fluxo de Dados

```
1. COLETA
   External APIs -> Python Scrapers -> BullMQ Queue -> Backend

2. PROCESSAMENTO
   Backend -> Cross-Validation -> PostgreSQL (Storage)

3. ANALISE
   Data -> AI Providers -> Analysis Service -> PostgreSQL

4. EXIBICAO
   PostgreSQL -> Backend API -> Frontend -> Usuario

5. REAL-TIME
   Backend -> WebSocket Gateway -> Frontend (Updates)
```

### 3.3 Dependencias Criticas

| Servico | Depende de |
|---------|------------|
| Backend | PostgreSQL, Redis |
| Frontend | Backend |
| Scrapers | Backend, External APIs |
| BullMQ | Redis |
| Orchestrator | Backend, Scrapers |

---

## 4. CENARIOS DE TESTE - FRONTEND

### 4.1 Dashboard (`/dashboard`)

#### 4.1.1 Testes Funcionais

| ID | Cenario | Passos | Resultado Esperado | Prioridade |
|----|---------|--------|-------------------|------------|
| FE-DASH-001 | Carregar dashboard | 1. Acessar /dashboard | Pagina carrega < 2s, sem erros console | ALTA |
| FE-DASH-002 | Exibir StatCards | 1. Verificar cards de metricas | 4 cards visiveis com dados | ALTA |
| FE-DASH-003 | Exibir AssetTable | 1. Verificar tabela de ativos | Tabela com paginacao funcionando | ALTA |
| FE-DASH-004 | Atualizar dados | 1. Clicar em refresh | Dados atualizados, loading state | MEDIA |
| FE-DASH-005 | Filtrar ativos | 1. Usar search bar | Resultados filtrados corretamente | MEDIA |

#### 4.1.2 Testes de Acessibilidade (WCAG 2.1 AA)

| ID | Cenario | Criterio | Resultado Esperado |
|----|---------|----------|-------------------|
| FE-DASH-A01 | Navegacao por teclado | 2.1.1 | Todos elementos acessiveis via Tab |
| FE-DASH-A02 | Contraste de cores | 1.4.3 | Ratio minimo 4.5:1 |
| FE-DASH-A03 | Labels de formularios | 1.3.1 | Todos inputs com labels |
| FE-DASH-A04 | Alt text em imagens | 1.1.1 | Todas imagens com alt |

#### 4.1.3 Testes de Responsividade

| ID | Viewport | Elementos | Resultado Esperado |
|----|----------|-----------|-------------------|
| FE-DASH-R01 | Desktop (1920x1080) | Todos | Layout completo |
| FE-DASH-R02 | Tablet (768x1024) | Todos | Cards em 2 colunas |
| FE-DASH-R03 | Mobile (375x667) | Todos | Cards em 1 coluna, menu hamburger |

### 4.2 Assets List (`/assets`)

#### 4.2.1 Testes Funcionais

| ID | Cenario | Passos | Resultado Esperado | Prioridade |
|----|---------|--------|-------------------|------------|
| FE-AST-001 | Listar ativos | 1. Acessar /assets | Lista com 861 ativos, paginacao | ALTA |
| FE-AST-002 | Buscar ativo | 1. Digitar "PETR4" | Filtro instantaneo, debounce | ALTA |
| FE-AST-003 | Ordenar tabela | 1. Clicar em header | Ordenacao ASC/DESC funcionando | ALTA |
| FE-AST-004 | Bulk sync | 1. Selecionar ativos 2. Clicar sync | Progress bar, WebSocket updates | ALTA |
| FE-AST-005 | Filtrar por tipo | 1. Selecionar "Acao" | Apenas acoes exibidas | MEDIA |
| FE-AST-006 | Filtrar por setor | 1. Selecionar "Financeiro" | Apenas setor exibido | MEDIA |
| FE-AST-007 | Exportar lista | 1. Clicar export CSV | Download iniciado | BAIXA |

#### 4.2.2 Testes de Performance

| ID | Metrica | Threshold | Medicao |
|----|---------|-----------|---------|
| FE-AST-P01 | Initial load | < 2s | Lighthouse |
| FE-AST-P02 | Search response | < 200ms | Chrome DevTools |
| FE-AST-P03 | Table render | < 500ms | React DevTools |

### 4.3 Asset Detail (`/assets/[ticker]`)

#### 4.3.1 Testes Funcionais

| ID | Cenario | Passos | Resultado Esperado | Prioridade |
|----|---------|--------|-------------------|------------|
| FE-DTL-001 | Carregar detalhe | 1. Acessar /assets/PETR4 | Dados do ativo carregados | ALTA |
| FE-DTL-002 | Exibir grafico | 1. Verificar candlestick | Grafico renderizado corretamente | ALTA |
| FE-DTL-003 | Mudar periodo | 1. Selecionar 1M/3M/1Y | Grafico atualizado | ALTA |
| FE-DTL-004 | Exibir fundamentals | 1. Ver metricas | P/L, ROE, DY, etc exibidos | ALTA |
| FE-DTL-005 | Ver noticias | 1. Scroll para noticias | Lista de noticias relacionadas | MEDIA |
| FE-DTL-006 | Iniciar analise | 1. Clicar "Nova Analise" | Modal aberto, providers visiveis | ALTA |
| FE-DTL-007 | Ver historico | 1. Acessar aba historico | Tabela de precos historicos | MEDIA |

#### 4.3.2 Testes de Grafico (lightweight-charts)

| ID | Cenario | Resultado Esperado |
|----|---------|-------------------|
| FE-DTL-C01 | Zoom in/out | Escala ajustada, dados visiveis |
| FE-DTL-C02 | Pan horizontal | Navegacao suave |
| FE-DTL-C03 | Crosshair | Valores exibidos no cursor |
| FE-DTL-C04 | Tooltip | Dados OHLCV no hover |

### 4.4 Portfolio (`/portfolio`)

#### 4.4.1 Testes Funcionais

| ID | Cenario | Passos | Resultado Esperado | Prioridade |
|----|---------|--------|-------------------|------------|
| FE-PTF-001 | Listar portfolios | 1. Acessar /portfolio | Lista de portfolios do usuario | ALTA |
| FE-PTF-002 | Criar portfolio | 1. Clicar "Novo" 2. Preencher form | Portfolio criado, redirect | ALTA |
| FE-PTF-003 | Adicionar posicao | 1. Selecionar portfolio 2. Add position | Posicao adicionada, totais atualizados | ALTA |
| FE-PTF-004 | Editar posicao | 1. Clicar edit 2. Alterar quantidade | Posicao atualizada | MEDIA |
| FE-PTF-005 | Remover posicao | 1. Clicar delete 2. Confirmar | Posicao removida | MEDIA |
| FE-PTF-006 | Ver rentabilidade | 1. Ver grafico | Grafico de rentabilidade renderizado | ALTA |
| FE-PTF-007 | Exportar portfolio | 1. Clicar export | CSV gerado com posicoes | BAIXA |

#### 4.4.2 Validacao de Dados Financeiros

| ID | Cenario | Validacao |
|----|---------|-----------|
| FE-PTF-V01 | Preco medio | Decimal(10,2) com precisao |
| FE-PTF-V02 | Quantidade | Inteiro positivo |
| FE-PTF-V03 | Valor total | Calculado corretamente |
| FE-PTF-V04 | Variacao | % com 2 casas decimais |

### 4.5 Analysis (`/analysis`)

#### 4.5.1 Testes Funcionais

| ID | Cenario | Passos | Resultado Esperado | Prioridade |
|----|---------|--------|-------------------|------------|
| FE-ANL-001 | Listar analises | 1. Acessar /analysis | Lista de analises anteriores | ALTA |
| FE-ANL-002 | Nova analise | 1. Clicar "Nova" 2. Selecionar ticker 3. Escolher providers | Analise iniciada, progress | ALTA |
| FE-ANL-003 | Ver resultado | 1. Clicar em analise | Detalhes da analise exibidos | ALTA |
| FE-ANL-004 | Comparar providers | 1. Ver cards de cada provider | Comparativo lado a lado | MEDIA |
| FE-ANL-005 | Filtrar por ticker | 1. Buscar ticker | Analises filtradas | MEDIA |
| FE-ANL-006 | Filtrar por data | 1. Selecionar range | Analises no periodo | MEDIA |

#### 4.5.2 Testes de AI Providers

| ID | Provider | Validacao |
|----|----------|-----------|
| FE-ANL-AI01 | ChatGPT | Response < 30s, JSON valido |
| FE-ANL-AI02 | Gemini | Response < 30s, JSON valido |
| FE-ANL-AI03 | Claude | Response < 30s, JSON valido |
| FE-ANL-AI04 | DeepSeek | Response < 30s, JSON valido |
| FE-ANL-AI05 | Grok | Response < 30s, JSON valido |
| FE-ANL-AI06 | Perplexity | Response < 30s, JSON valido |

### 4.6 Demais Paginas

#### 4.6.1 Reports (`/reports`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-RPT-001 | Listar relatorios | Lista paginada | MEDIA |
| FE-RPT-002 | Gerar relatorio | PDF gerado, download | MEDIA |
| FE-RPT-003 | Filtrar por tipo | Filtro funcionando | BAIXA |
| FE-RPT-004 | Ver preview | Preview renderizado | BAIXA |

#### 4.6.2 Data Management (`/data-management`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-DM-001 | Ver sync history | Lista de sincronizacoes | MEDIA |
| FE-DM-002 | Iniciar sync | Job criado, progress | ALTA |
| FE-DM-003 | Ver audit trail | Logs de alteracoes | MEDIA |
| FE-DM-004 | Configurar sync | Modal de configuracao | MEDIA |

#### 4.6.3 Data Sources (`/data-sources`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-DS-001 | Listar sources | 30+ fontes listadas | MEDIA |
| FE-DS-002 | Ver status | Status de cada fonte | MEDIA |
| FE-DS-003 | Testar source | Teste executado, resultado | MEDIA |
| FE-DS-004 | Ver metricas | Grafico de sucesso/falha | BAIXA |

#### 4.6.4 Discrepancies (`/discrepancies`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-DIS-001 | Listar discrepancias | Tabela com discrepancias | ALTA |
| FE-DIS-002 | Resolver manualmente | Modal de resolucao | ALTA |
| FE-DIS-003 | Auto-resolver | Aplicar regra automatica | MEDIA |
| FE-DIS-004 | Ver historico | Resolucoes anteriores | MEDIA |

#### 4.6.5 Settings (`/settings`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-SET-001 | Editar perfil | Form salvo | BAIXA |
| FE-SET-002 | Alterar senha | Senha alterada | MEDIA |
| FE-SET-003 | Notificacoes | Preferencias salvas | BAIXA |
| FE-SET-004 | API Keys | Keys gerenciadas | MEDIA |

#### 4.6.6 OAuth Manager (`/oauth-manager`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-OA-001 | Listar sites | Sites com OAuth | MEDIA |
| FE-OA-002 | Iniciar sessao VNC | noVNC acessivel | MEDIA |
| FE-OA-003 | Gerenciar cookies | Cookies salvos | MEDIA |
| FE-OA-004 | Renovar sessao | Sessao renovada | MEDIA |

#### 4.6.7 Wheel Strategy (`/wheel`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-WH-001 | Listar estrategias | Lista de wheels | MEDIA |
| FE-WH-002 | Nova estrategia | Estrategia criada | MEDIA |
| FE-WH-003 | Registrar trade | Trade registrado | MEDIA |
| FE-WH-004 | Ver lucratividade | Grafico de P&L | MEDIA |

#### 4.6.8 Health Dashboard (`/health`)

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-HLT-001 | Ver status services | Status de todos containers | ALTA |
| FE-HLT-002 | Ver metricas | CPU, Memory, Requests | ALTA |
| FE-HLT-003 | Ver logs | Ultimos logs | MEDIA |
| FE-HLT-004 | Alertas | Alertas de saude | ALTA |

#### 4.6.9 Authentication

| ID | Cenario | Resultado Esperado | Prioridade |
|----|---------|-------------------|------------|
| FE-AUTH-001 | Login email/senha | JWT recebido, redirect | ALTA |
| FE-AUTH-002 | Login Google | OAuth flow completo | ALTA |
| FE-AUTH-003 | Registro | Usuario criado | ALTA |
| FE-AUTH-004 | Logout | Sessao encerrada | ALTA |
| FE-AUTH-005 | Refresh token | Token renovado | ALTA |

---

## 5. CENARIOS DE TESTE - BACKEND

### 5.1 Auth Controller

#### 5.1.1 Endpoints

| Metodo | Endpoint | Body/Params | Response |
|--------|----------|-------------|----------|
| POST | /auth/login | { email, password } | { access_token, refresh_token } |
| POST | /auth/register | { email, password, name } | { user, access_token } |
| POST | /auth/refresh | { refresh_token } | { access_token } |
| GET | /auth/google | - | Redirect to Google |
| GET | /auth/google/callback | code | { access_token } |

#### 5.1.2 Testes

| ID | Cenario | Request | Expected Response | Status |
|----|---------|---------|-------------------|--------|
| BE-AUTH-001 | Login valido | POST /auth/login | 200 + tokens | ALTA |
| BE-AUTH-002 | Login invalido | POST /auth/login (wrong password) | 401 Unauthorized | ALTA |
| BE-AUTH-003 | Login sem email | POST /auth/login (no email) | 400 Bad Request | ALTA |
| BE-AUTH-004 | Registro valido | POST /auth/register | 201 Created | ALTA |
| BE-AUTH-005 | Registro duplicado | POST /auth/register (existing) | 409 Conflict | ALTA |
| BE-AUTH-006 | Refresh valido | POST /auth/refresh | 200 + new token | ALTA |
| BE-AUTH-007 | Refresh expirado | POST /auth/refresh (expired) | 401 Unauthorized | ALTA |

### 5.2 Assets Controller

#### 5.2.1 Endpoints

| Metodo | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | /assets | JWT | Lista paginada de ativos |
| GET | /assets/:ticker | JWT | Detalhes do ativo |
| GET | /assets/:ticker/prices | JWT | Precos historicos |
| GET | /assets/:ticker/fundamentals | JWT | Dados fundamentalistas |
| GET | /assets/:ticker/analysis | JWT | Analises do ativo |
| POST | /assets/sync | JWT | Iniciar sincronizacao |
| POST | /assets/bulk-sync | JWT | Sync em lote |

#### 5.2.2 Testes

| ID | Cenario | Request | Expected Response | Status |
|----|---------|---------|-------------------|--------|
| BE-AST-001 | Listar ativos | GET /assets | 200 + array | ALTA |
| BE-AST-002 | Listar com paginacao | GET /assets?page=2&limit=50 | 200 + paginated | ALTA |
| BE-AST-003 | Buscar por ticker | GET /assets/PETR4 | 200 + asset | ALTA |
| BE-AST-004 | Ticker inexistente | GET /assets/XXXX9 | 404 Not Found | ALTA |
| BE-AST-005 | Precos historicos | GET /assets/PETR4/prices | 200 + prices | ALTA |
| BE-AST-006 | Precos com range | GET /assets/PETR4/prices?start=2024-01-01 | 200 + filtered | ALTA |
| BE-AST-007 | Fundamentals | GET /assets/PETR4/fundamentals | 200 + fundamentals | ALTA |
| BE-AST-008 | Sync individual | POST /assets/sync { ticker: "PETR4" } | 202 Accepted | ALTA |
| BE-AST-009 | Bulk sync | POST /assets/bulk-sync { tickers: [...] } | 202 + jobId | ALTA |
| BE-AST-010 | Sem autenticacao | GET /assets (no JWT) | 401 Unauthorized | ALTA |

### 5.3 Analysis Controller

#### 5.3.1 Endpoints

| Metodo | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | /analysis | JWT | Lista de analises |
| GET | /analysis/:id | JWT | Detalhes da analise |
| POST | /analysis | JWT | Criar nova analise |
| DELETE | /analysis/:id | JWT | Excluir analise |
| GET | /analysis/ticker/:ticker | JWT | Analises por ticker |

#### 5.3.2 Testes

| ID | Cenario | Request | Expected Response | Status |
|----|---------|---------|-------------------|--------|
| BE-ANL-001 | Listar analises | GET /analysis | 200 + array | ALTA |
| BE-ANL-002 | Criar analise | POST /analysis { ticker, providers } | 202 + analysisId | ALTA |
| BE-ANL-003 | Ver analise | GET /analysis/:id | 200 + analysis | ALTA |
| BE-ANL-004 | Analise inexistente | GET /analysis/:invalidId | 404 Not Found | ALTA |
| BE-ANL-005 | Excluir analise | DELETE /analysis/:id | 204 No Content | MEDIA |
| BE-ANL-006 | Por ticker | GET /analysis/ticker/PETR4 | 200 + filtered | ALTA |

### 5.4 Portfolio Controller

#### 5.4.1 Endpoints

| Metodo | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | /portfolio | JWT | Portfolios do usuario |
| GET | /portfolio/:id | JWT | Detalhes do portfolio |
| POST | /portfolio | JWT | Criar portfolio |
| PATCH | /portfolio/:id | JWT | Atualizar portfolio |
| DELETE | /portfolio/:id | JWT | Excluir portfolio |
| POST | /portfolio/:id/positions | JWT | Adicionar posicao |
| PATCH | /portfolio/:id/positions/:posId | JWT | Atualizar posicao |
| DELETE | /portfolio/:id/positions/:posId | JWT | Remover posicao |

#### 5.4.2 Testes

| ID | Cenario | Request | Expected Response | Status |
|----|---------|---------|-------------------|--------|
| BE-PTF-001 | Listar portfolios | GET /portfolio | 200 + array | ALTA |
| BE-PTF-002 | Criar portfolio | POST /portfolio { name } | 201 + portfolio | ALTA |
| BE-PTF-003 | Adicionar posicao | POST /portfolio/:id/positions { ticker, qty, price } | 201 + position | ALTA |
| BE-PTF-004 | Posicao duplicada | POST /portfolio/:id/positions (existing ticker) | 409 Conflict | ALTA |
| BE-PTF-005 | Atualizar posicao | PATCH /portfolio/:id/positions/:posId | 200 + updated | ALTA |
| BE-PTF-006 | Remover posicao | DELETE /portfolio/:id/positions/:posId | 204 | MEDIA |
| BE-PTF-007 | Portfolio de outro user | GET /portfolio/:otherId | 403 Forbidden | ALTA |

### 5.5 Market Data Controller

#### 5.5.1 Endpoints

| Metodo | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | /market-data/prices/:ticker | JWT | Precos atuais |
| GET | /market-data/intraday/:ticker | JWT | Precos intraday |
| GET | /market-data/quotes | JWT | Cotacoes em tempo real |
| POST | /market-data/sync | JWT | Sincronizar precos |

#### 5.5.2 Testes

| ID | Cenario | Request | Expected Response | Status |
|----|---------|---------|-------------------|--------|
| BE-MKT-001 | Precos atuais | GET /market-data/prices/PETR4 | 200 + price | ALTA |
| BE-MKT-002 | Intraday | GET /market-data/intraday/PETR4 | 200 + intraday | ALTA |
| BE-MKT-003 | Quotes multiplos | GET /market-data/quotes?tickers=PETR4,VALE3 | 200 + quotes | ALTA |

### 5.6 Demais Controllers

#### 5.6.1 Reports Controller

| ID | Cenario | Endpoint | Expected | Status |
|----|---------|----------|----------|--------|
| BE-RPT-001 | Listar relatorios | GET /reports | 200 + array | MEDIA |
| BE-RPT-002 | Gerar relatorio | POST /reports | 202 + jobId | MEDIA |
| BE-RPT-003 | Download PDF | GET /reports/:id/download | 200 + PDF | MEDIA |

#### 5.6.2 Economic Indicators Controller

| ID | Cenario | Endpoint | Expected | Status |
|----|---------|----------|----------|--------|
| BE-ECO-001 | Listar indicadores | GET /economic-indicators | 200 + array | MEDIA |
| BE-ECO-002 | Indicador especifico | GET /economic-indicators/SELIC | 200 + indicator | MEDIA |
| BE-ECO-003 | Historico | GET /economic-indicators/SELIC/history | 200 + history | MEDIA |

#### 5.6.3 News Controller

| ID | Cenario | Endpoint | Expected | Status |
|----|---------|----------|----------|--------|
| BE-NEWS-001 | Listar noticias | GET /news | 200 + array | MEDIA |
| BE-NEWS-002 | Por ticker | GET /news?ticker=PETR4 | 200 + filtered | MEDIA |
| BE-NEWS-003 | Com sentimento | GET /news/:id/sentiment | 200 + sentiment | MEDIA |

#### 5.6.4 Data Sources Controller

| ID | Cenario | Endpoint | Expected | Status |
|----|---------|----------|----------|--------|
| BE-DS-001 | Listar fontes | GET /data-sources | 200 + array | MEDIA |
| BE-DS-002 | Status das fontes | GET /data-sources/status | 200 + status | MEDIA |

#### 5.6.5 Wheel Controller

| ID | Cenario | Endpoint | Expected | Status |
|----|---------|----------|----------|--------|
| BE-WH-001 | Listar estrategias | GET /wheel | 200 + array | MEDIA |
| BE-WH-002 | Criar estrategia | POST /wheel | 201 + strategy | MEDIA |
| BE-WH-003 | Registrar trade | POST /wheel/:id/trades | 201 + trade | MEDIA |

---

## 6. CENARIOS DE TESTE - INFRAESTRUTURA

### 6.1 Containers Core

#### 6.1.1 PostgreSQL

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-PG-001 | Container running | docker ps | Status: Up | ALTA |
| INF-PG-002 | Health check | docker exec pg_isready | exit 0 | ALTA |
| INF-PG-003 | Conexao backend | SELECT 1 | Success | ALTA |
| INF-PG-004 | TimescaleDB extension | \dx | timescaledb installed | ALTA |
| INF-PG-005 | Migrations applied | schema_migrations | All applied | ALTA |
| INF-PG-006 | Data integrity | SELECT COUNT(*) FROM assets | 861 rows | ALTA |

#### 6.1.2 Redis

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-RD-001 | Container running | docker ps | Status: Up | ALTA |
| INF-RD-002 | Health check | redis-cli ping | PONG | ALTA |
| INF-RD-003 | Conexao backend | SET/GET test | Success | ALTA |
| INF-RD-004 | BullMQ queues | KEYS bull:* | Queues exist | ALTA |

#### 6.1.3 Backend

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-BE-001 | Container running | docker ps | Status: Up | ALTA |
| INF-BE-002 | Health endpoint | curl :3101/api/v1/health | 200 OK | ALTA |
| INF-BE-003 | DB connection | Health check | connected: true | ALTA |
| INF-BE-004 | Redis connection | Health check | redis: true | ALTA |
| INF-BE-005 | No console errors | docker logs | No ERROR level | ALTA |

#### 6.1.4 Frontend

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-FE-001 | Container running | docker ps | Status: Up | ALTA |
| INF-FE-002 | HTTP response | curl :3100 | 200 OK | ALTA |
| INF-FE-003 | Static assets | curl :3100/_next/* | 200 OK | ALTA |
| INF-FE-004 | API proxy | curl :3100/api/* | Proxy working | ALTA |

#### 6.1.5 Scrapers

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-SC-001 | Container running | docker ps | Status: Up | ALTA |
| INF-SC-002 | Health endpoint | curl :8000/health | 200 OK | ALTA |
| INF-SC-003 | Playwright installed | playwright --version | Version shown | ALTA |
| INF-SC-004 | Test scraper | curl :8000/test/fundamentus | Success | ALTA |

### 6.2 Containers Dev

#### 6.2.1 PgAdmin

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-PGA-001 | Container running | docker ps | Status: Up | BAIXA |
| INF-PGA-002 | Web UI | curl :5150 | 200 OK | BAIXA |
| INF-PGA-003 | DB connection | UI connect | Success | BAIXA |

#### 6.2.2 Redis Commander

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-RC-001 | Container running | docker ps | Status: Up | BAIXA |
| INF-RC-002 | Web UI | curl :8181 | 200 OK | BAIXA |

### 6.3 Containers Auxiliares

#### 6.3.1 noVNC/VNC

| ID | Cenario | Comando | Expected | Prioridade |
|----|---------|---------|----------|------------|
| INF-VNC-001 | VNC running | docker ps | Status: Up | MEDIA |
| INF-VNC-002 | noVNC web | curl :6080 | 200 OK | MEDIA |
| INF-VNC-003 | VNC connection | VNC client | Connected | MEDIA |

### 6.4 Conectividade

| ID | Origem | Destino | Protocolo | Expected |
|----|--------|---------|-----------|----------|
| INF-CON-001 | Backend | PostgreSQL | TCP:5432 | Connected |
| INF-CON-002 | Backend | Redis | TCP:6379 | Connected |
| INF-CON-003 | Frontend | Backend | HTTP:3101 | Connected |
| INF-CON-004 | Scrapers | Backend | HTTP:3101 | Connected |
| INF-CON-005 | Backend | External APIs | HTTPS | Connected |

### 6.5 Volumes

| ID | Volume | Mount Point | Expected |
|----|--------|-------------|----------|
| INF-VOL-001 | postgres_data | /var/lib/postgresql/data | Persistent |
| INF-VOL-002 | redis_data | /data | Persistent |
| INF-VOL-003 | uploads | /app/uploads | Persistent |

### 6.6 Network

| ID | Teste | Comando | Expected |
|----|-------|---------|----------|
| INF-NET-001 | Network exists | docker network ls | invest-network exists |
| INF-NET-002 | All containers connected | docker network inspect | All connected |
| INF-NET-003 | DNS resolution | ping backend | Resolved |

---

## 7. CENARIOS DE TESTE - PYTHON SCRAPERS

### 7.1 Scrapers Migrados (Playwright)

#### 7.1.1 Fundamentus Scraper

| ID | Cenario | Input | Expected | Prioridade |
|----|---------|-------|----------|------------|
| SCR-FUN-001 | Scrape PETR4 | ticker=PETR4 | JSON com fundamentals | ALTA |
| SCR-FUN-002 | Ticker invalido | ticker=XXXX | Error handling | ALTA |
| SCR-FUN-003 | Timeout handling | slow network | Retry/error | MEDIA |
| SCR-FUN-004 | BeautifulSoup pattern | - | Single HTML fetch | ALTA |
| SCR-FUN-005 | Performance | - | < 10s | ALTA |

#### 7.1.2 BCB Scraper

| ID | Cenario | Input | Expected | Prioridade |
|----|---------|-------|----------|------------|
| SCR-BCB-001 | Get SELIC | indicator=SELIC | Current value | ALTA |
| SCR-BCB-002 | Get IPCA | indicator=IPCA | Current value | ALTA |
| SCR-BCB-003 | Historical | range=12m | Array of values | MEDIA |
| SCR-BCB-004 | Performance | - | < 5s | ALTA |

### 7.2 Scrapers Pendentes Migracao

**Nota:** Scrapers pendentes devem ser testados apos migracao para Playwright.

| Categoria | Scrapers | Status |
|-----------|----------|--------|
| Fundamentalistas | statusinvest, investsite, investidor10, fundamentei, tradingview, griffin, googlefinance, maisretorno, advfn | Pendente |
| Noticias | bloomberg, googlenews, valor, exame, infomoney, estadao, investing_news | Pendente |
| AI | chatgpt, gemini, claude, deepseek, grok, perplexity | Pendente |
| Mercado | yahoo_finance, investing, b3, coinmarketcap, oplab, kinvo | Pendente |
| Economicos | anbima, fred, ipeadata | Pendente |
| Opcoes | opcoes | Pendente |

### 7.3 Testes de Integracao Scraper

| ID | Cenario | Fluxo | Expected |
|----|---------|-------|----------|
| SCR-INT-001 | Scrape -> Queue -> DB | Full flow | Data persisted |
| SCR-INT-002 | Cross-validation | 3+ sources | Consensus calculated |
| SCR-INT-003 | Error -> Dead Letter | Failed job | In DLQ |
| SCR-INT-004 | Retry mechanism | Transient error | Retried 3x |

---

## 8. VALIDACOES OBRIGATORIAS

### 8.1 Zero Tolerance

#### 8.1.1 TypeScript Backend

```bash
cd backend && npx tsc --noEmit
```

| ID | Validacao | Comando | Expected |
|----|-----------|---------|----------|
| ZT-BE-001 | TS Errors | tsc --noEmit | 0 errors |
| ZT-BE-002 | Build | npm run build | Success |
| ZT-BE-003 | Lint | npm run lint | 0 critical |

#### 8.1.2 TypeScript Frontend

```bash
cd frontend && npx tsc --noEmit
```

| ID | Validacao | Comando | Expected |
|----|-----------|---------|----------|
| ZT-FE-001 | TS Errors | tsc --noEmit | 0 errors |
| ZT-FE-002 | Build | npm run build | Success |
| ZT-FE-003 | Lint | npm run lint | 0 critical |
| ZT-FE-004 | Console Errors | Browser console | 0 errors |

### 8.2 Dados Financeiros

#### 8.2.1 Precisao

| ID | Validacao | Regra | Verificacao |
|----|-----------|-------|-------------|
| FIN-001 | Tipo de dado | Decimal.js | grep "Decimal" |
| FIN-002 | Precisao BRL | 2 casas decimais | Regex validation |
| FIN-003 | Precisao % | 4 casas decimais | Regex validation |
| FIN-004 | Arredondamento | ROUND_HALF_UP | Unit test |

#### 8.2.2 Cross-Validation

| ID | Validacao | Regra | Verificacao |
|----|-----------|-------|-------------|
| FIN-005 | Min sources | >= 3 | Config check |
| FIN-006 | Outlier threshold | 10% | Config check |
| FIN-007 | Consensus calculation | Mediana | Unit test |

#### 8.2.3 Timezone

| ID | Validacao | Regra | Verificacao |
|----|-----------|-------|-------------|
| FIN-008 | Database | America/Sao_Paulo | DB config |
| FIN-009 | Backend | America/Sao_Paulo | ENV check |
| FIN-010 | Frontend | America/Sao_Paulo | Dayjs config |

### 8.3 Seguranca

| ID | Validacao | Verificacao | Prioridade |
|----|-----------|-------------|------------|
| SEC-001 | JWT secret | ENV variable | ALTA |
| SEC-002 | Password hash | bcrypt | ALTA |
| SEC-003 | CORS config | Whitelist only | ALTA |
| SEC-004 | Rate limiting | Configured | MEDIA |
| SEC-005 | SQL injection | Parameterized queries | ALTA |
| SEC-006 | XSS protection | Sanitization | ALTA |

### 8.4 Performance

| ID | Metrica | Threshold | Medicao |
|----|---------|-----------|---------|
| PERF-001 | API response time | < 500ms | p95 |
| PERF-002 | Page load time | < 2s | LCP |
| PERF-003 | Database queries | < 100ms | avg |
| PERF-004 | Memory usage | < 512MB | per container |
| PERF-005 | CPU usage | < 80% | peak |

### 8.5 Observabilidade

| ID | Validacao | Verificacao | Status |
|----|-----------|-------------|--------|
| OBS-001 | Logger NestJS | Logger class | Verificar |
| OBS-002 | Logger Python | Loguru | Verificar |
| OBS-003 | No console.log | grep check | Verificar |
| OBS-004 | No print() | grep check | Verificar |
| OBS-005 | Correlation ID | Headers | Verificar |

---

## 9. GAPS IDENTIFICADOS

### 9.1 Gaps de Documentacao

| ID | Gap | Impacto | Recomendacao |
|----|-----|---------|--------------|
| GAP-DOC-001 | Testes E2E Playwright ausentes | Sem coverage automatizado | Criar test suite |
| GAP-DOC-002 | Swagger/OpenAPI incompleto | API nao documentada | Completar decorators |

### 9.2 Gaps de Codigo

| ID | Gap | Arquivo | Impacto | Recomendacao |
|----|-----|---------|---------|--------------|
| GAP-COD-001 | 32 scrapers pendentes migracao | python-scrapers/ | Scrapers Selenium deprecated | Migrar para Playwright |
| GAP-COD-002 | Testes unitarios incompletos | backend/src/**/*.spec.ts | Coverage baixo | Aumentar coverage |

### 9.3 Gaps de Infraestrutura

| ID | Gap | Impacto | Recomendacao |
|----|-----|---------|--------------|
| GAP-INF-001 | Observability profile nao padrao | Sem metricas | Ativar Prometheus/Grafana |
| GAP-INF-002 | Backup automatico ausente | Risco de perda de dados | Configurar pg_dump cron |

### 9.4 Gaps de Seguranca

| ID | Gap | Risco | Recomendacao |
|----|-----|-------|--------------|
| GAP-SEC-001 | Rate limiting global | DDoS | Configurar nginx rate limit |
| GAP-SEC-002 | Audit trail incompleto | Compliance | Implementar audit logging |

### 9.5 Matriz de Priorizacao

| Prioridade | Gaps | Esforco Estimado |
|------------|------|------------------|
| CRITICA | GAP-COD-001 | 40h (8 scrapers/semana) |
| ALTA | GAP-DOC-001, GAP-INF-002 | 16h cada |
| MEDIA | GAP-DOC-002, GAP-COD-002 | 24h cada |
| BAIXA | GAP-INF-001, GAP-SEC-001, GAP-SEC-002 | 8h cada |

---

## 10. PLANO DE EXECUCAO

### 10.1 Cronograma de Validacao

#### Fase 1: Pre-Validacao (2h)

| Tarefa | Duracao | Responsavel |
|--------|---------|-------------|
| Verificar ambiente Docker | 15min | DevOps |
| Executar system-manager.ps1 status | 15min | DevOps |
| Verificar Zero Tolerance (tsc, build) | 30min | Dev |
| Preparar ambiente de teste | 1h | QA |

#### Fase 2: Validacao Backend (4h)

| Tarefa | Duracao | Responsavel |
|--------|---------|-------------|
| Testar Auth Controller | 30min | QA |
| Testar Assets Controller | 1h | QA |
| Testar Analysis Controller | 30min | QA |
| Testar Portfolio Controller | 30min | QA |
| Testar demais controllers | 1h | QA |
| Validar WebSocket | 30min | QA |

#### Fase 3: Validacao Frontend (6h)

| Tarefa | Duracao | Responsavel |
|--------|---------|-------------|
| MCP Triplo - Dashboard | 30min | QA |
| MCP Triplo - Assets | 45min | QA |
| MCP Triplo - Asset Detail | 45min | QA |
| MCP Triplo - Portfolio | 30min | QA |
| MCP Triplo - Analysis | 45min | QA |
| MCP Triplo - demais paginas | 2h | QA |
| Testes de acessibilidade | 1h | QA |

#### Fase 4: Validacao Infraestrutura (2h)

| Tarefa | Duracao | Responsavel |
|--------|---------|-------------|
| Verificar containers core | 30min | DevOps |
| Testar conectividade | 30min | DevOps |
| Verificar volumes e network | 30min | DevOps |
| Testar health checks | 30min | DevOps |

#### Fase 5: Validacao Scrapers (4h)

| Tarefa | Duracao | Responsavel |
|--------|---------|-------------|
| Testar scrapers migrados | 1h | Dev |
| Testar integracao scraper -> DB | 1h | Dev |
| Validar cross-validation | 1h | Dev |
| Testar queue jobs | 1h | Dev |

#### Fase 6: Documentacao (2h)

| Tarefa | Duracao | Responsavel |
|--------|---------|-------------|
| Compilar resultados | 1h | QA |
| Atualizar KNOWN-ISSUES.md | 30min | QA |
| Gerar relatorio final | 30min | QA |

### 10.2 Ferramentas de Validacao

#### MCP Triplo (Frontend)

```javascript
// 1. Playwright - Navegacao e Snapshot
mcp__playwright__browser_navigate({ url: "http://localhost:3100/dashboard" })
mcp__playwright__browser_snapshot({})
mcp__playwright__browser_take_screenshot({ filename: "dashboard.png", fullPage: true })

// 2. Chrome DevTools - Console e Network
mcp__chrome-devtools__take_snapshot({})
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
mcp__chrome-devtools__list_network_requests({ resourceTypes: ["xhr", "fetch"] })

// 3. a11y - Acessibilidade
mcp__a11y__audit_webpage({ url: "http://localhost:3100/dashboard", tags: ["wcag2aa"] })
```

#### System Manager (Infraestrutura)

```powershell
# Status completo
.\system-manager.ps1 status

# Health check
.\system-manager.ps1 health

# Logs de servico especifico
.\system-manager.ps1 logs backend
```

#### Zero Tolerance (Codigo)

```bash
# Backend
cd backend
npx tsc --noEmit
npm run build
npm run lint

# Frontend
cd frontend
npx tsc --noEmit
npm run build
npm run lint
```

### 10.3 Criterios de Aceite

#### Validacao Aprovada Se:

1. **Zero Tolerance:** 0 erros TypeScript, 0 falhas de build
2. **Backend:** 100% endpoints testados, todos retornando status esperado
3. **Frontend:** 100% paginas testadas com MCP Triplo, 0 erros console
4. **Infraestrutura:** 100% containers healthy, conectividade OK
5. **Scrapers:** Scrapers migrados funcionando, integracao OK
6. **Acessibilidade:** WCAG 2.1 AA compliance (0 critical issues)
7. **Performance:** Thresholds atendidos

#### Validacao Reprovada Se:

1. Qualquer erro TypeScript
2. Falha de build
3. Containers em estado unhealthy
4. Erros criticos no console
5. Endpoints retornando 5xx
6. Falha de conectividade entre servicos

### 10.4 Relatorio de Validacao

#### Template de Relatorio

```markdown
# RELATORIO DE VALIDACAO - FASE XX

**Data:** YYYY-MM-DD
**Versao:** X.X.X
**Status:** APROVADO/REPROVADO

## Sumario Executivo
- Total de testes: XX
- Aprovados: XX (XX%)
- Reprovados: XX (XX%)
- Bloqueados: XX (XX%)

## Zero Tolerance
- TypeScript Backend: [PASS/FAIL]
- TypeScript Frontend: [PASS/FAIL]
- Build Backend: [PASS/FAIL]
- Build Frontend: [PASS/FAIL]

## Backend
| Controller | Testados | Aprovados | Reprovados |
|------------|----------|-----------|------------|
| Auth | X | X | X |
| Assets | X | X | X |
| ... | ... | ... | ... |

## Frontend
| Pagina | MCP Triplo | Console | a11y |
|--------|------------|---------|------|
| Dashboard | [PASS/FAIL] | [PASS/FAIL] | [PASS/FAIL] |
| ... | ... | ... | ... |

## Infraestrutura
| Container | Status | Health |
|-----------|--------|--------|
| postgres | [UP/DOWN] | [PASS/FAIL] |
| ... | ... | ... |

## Gaps Encontrados
1. [Gap 1]
2. [Gap 2]

## Proximos Passos
1. [Acao 1]
2. [Acao 2]

## Evidencias
- Screenshots: docs/screenshots/validacao_fase_XX/
- Logs: docs/logs/validacao_fase_XX/
```

---

## ANEXOS

### A. Comandos Uteis

```bash
# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f backend
docker ps -a

# System Manager
.\system-manager.ps1 start
.\system-manager.ps1 status
.\system-manager.ps1 health
.\system-manager.ps1 logs <service>

# TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build
cd frontend && npm run build

# Database
cd backend && npm run migration:run
cd backend && npm run seed

# Tests
cd backend && npm run test
cd frontend && npx playwright test
```

### B. URLs de Servicos

| Servico | URL |
|---------|-----|
| Frontend | http://localhost:3100 |
| Backend API | http://localhost:3101/api/v1 |
| Health Check | http://localhost:3101/api/v1/health |
| PgAdmin | http://localhost:5150 |
| Redis Commander | http://localhost:8181 |
| noVNC | http://localhost:6080 |
| Scrapers API | http://localhost:8000 |

### C. Referencias

- CLAUDE.md - Regras e convencoes do projeto
- ARCHITECTURE.md - Arquitetura completa
- DATABASE_SCHEMA.md - Schema do banco
- KNOWN-ISSUES.md - Issues conhecidos
- CHECKLIST_ECOSSISTEMA_COMPLETO.md - Checklist de validacao
- financial-rules.md - Regras de dados financeiros

---

**Documento gerado automaticamente pelo PM Expert Agent**
**Claude Opus 4.5 - 2025-12-15**
