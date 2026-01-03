# PLANO DE VALIDACAO 100% DO ECOSSISTEMA - FASE 154

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Data Criacao:** 2026-01-03
**Autor:** PM Expert Agent (Claude Opus 4.5)
**Versao:** 1.0.0
**Status:** PRONTO PARA EXECUCAO

---

## 1. SUMARIO EXECUTIVO

### 1.1 Objetivo

Validar **100% do ecossistema** da plataforma B3 AI Analysis apos conclusao da FASE 153 (Troubleshooting). Este plano cobre:

- **28 Controllers** NestJS (100% coverage)
- **57 Services** Backend (100% coverage)
- **32 Entities** TypeORM (100% coverage)
- **21 Pages** Frontend Next.js (100% coverage)
- **41 Scrapers** Python (100% coverage)
- **21 Containers** Docker (100% coverage)
- **5 Issues Ativos** documentados em KNOWN-ISSUES.md

### 1.2 Escopo

| Area | Quantidade | Metodo de Validacao |
|------|------------|---------------------|
| Backend Controllers | 28 | API Testing + E2E |
| Backend Services | 57 | Unit Tests + Integration |
| Database Entities | 32 | Schema Validation + Migrations |
| Frontend Pages | 21 | MCP Triplo (Playwright + DevTools + a11y) |
| Python Scrapers | 41 | Health Check + Output Validation |
| Docker Containers | 21 | Health Probes + Connectivity |
| Integracoes Externas | 34+ APIs | Response Validation |

### 1.3 Criterios de Sucesso

- [ ] 0 erros TypeScript (`npx tsc --noEmit`)
- [ ] 0 falhas de build (frontend + backend)
- [ ] 0 erros de console no navegador
- [ ] 100% endpoints respondendo (HTTP 200/201)
- [ ] 100% containers healthy
- [ ] WCAG 2.1 AA compliance (todas as paginas)
- [ ] Cross-validation funcionando (3+ fontes)
- [ ] WebSocket conectando corretamente
- [ ] BullMQ processando jobs sem stalling

---

## 2. INVENTARIO COMPLETO DO SISTEMA

### 2.1 Backend - Controllers (28 arquivos)

| # | Controller | Path | Endpoints Estimados |
|---|------------|------|---------------------|
| 1 | AppController | `backend/src/app.controller.ts` | 2 (health, root) |
| 2 | AssetsController | `backend/src/api/assets/assets.controller.ts` | 15 |
| 3 | AssetsUpdateController | `backend/src/api/assets/assets-update.controller.ts` | 8 |
| 4 | AnalysisController | `backend/src/api/analysis/analysis.controller.ts` | 8 |
| 5 | AuthController | `backend/src/api/auth/auth.controller.ts` | 5 |
| 6 | PortfolioController | `backend/src/api/portfolio/portfolio.controller.ts` | 9 |
| 7 | ReportsController | `backend/src/api/reports/reports.controller.ts` | 5 |
| 8 | MarketDataController | `backend/src/api/market-data/market-data.controller.ts` | 9 |
| 9 | NewsController | `backend/src/api/news/news.controller.ts` | 17 |
| 10 | EconomicIndicatorsController | `backend/src/api/economic-indicators/economic-indicators.controller.ts` | 4 |
| 11 | DividendsController | `backend/src/api/dividends/dividends.controller.ts` | 5 |
| 12 | StockLendingController | `backend/src/api/stock-lending/stock-lending.controller.ts` | 5 |
| 13 | WheelController | `backend/src/api/wheel/wheel.controller.ts` | 8 |
| 14 | BacktestController | `backend/src/api/wheel/backtest.controller.ts` | 4 |
| 15 | DataSourcesController | `backend/src/api/data-sources/data-sources.controller.ts` | 2 |
| 16 | DataCleanupController | `backend/src/api/data-cleanup/data-cleanup.controller.ts` | 3 |
| 17 | ScraperConfigController | `backend/src/api/scraper-config/scraper-config.controller.ts` | 6 |
| 18 | IndexMembershipsController | `backend/src/api/index-memberships/index-memberships.controller.ts` | 4 |
| 19 | DiskLifecycleController | `backend/src/api/webhooks/disk-lifecycle.controller.ts` | 2 |
| 20 | OptionsController | `backend/src/modules/options/options.controller.ts` | 6 |
| 21 | AlertsController | `backend/src/modules/alerts/alerts.controller.ts` | 5 |
| 22 | SearchController | `backend/src/modules/search/search.controller.ts` | 3 |
| 23 | CronController | `backend/src/modules/cron/cron.controller.ts` | 2 |
| 24 | StorageController | `backend/src/modules/storage/storage.controller.ts` | 4 |
| 25 | ScrapersController | `backend/src/scrapers/scrapers.controller.ts` | 10 |
| 26 | MetricsController | `backend/src/metrics/metrics.controller.ts` | 2 |
| 27 | TelemetryController | `backend/src/telemetry/telemetry.controller.ts` | 3 |
| 28 | ContextController | `backend/src/ai/knowledge-base/context.controller.ts` | 3 |

**Total Estimado:** ~150 endpoints REST

### 2.2 Backend - Services (57 arquivos)

| Categoria | Services | Quantidade |
|-----------|----------|------------|
| API Core | assets, assets-update, analysis, auth, portfolio, reports | 6 |
| Market Data | market-data, ticker-merge, dividends, stock-lending | 4 |
| News | news, news-collectors, consensus, economic-calendar, ai-orchestrator | 5 |
| AI | ai, knowledge-base, document-sharding, multi-agent-analysis | 4 |
| Technical | technical-analysis, technical-indicators, python-client | 3 |
| Scrapers | scrapers, rate-limiter, circuit-breaker, scraper-metrics, discrepancy-resolution | 5 |
| Validation | validators, cross-validation, cross-validation-config | 3 |
| Queue | asset-update-jobs, scheduled-jobs, data-cleanup, dead-letter | 4 |
| Integrations | brapi, fred, anbima | 3 |
| Infrastructure | cache, storage, metrics, telemetry, notifications | 5 |
| Modules | alerts, options, search, cron, scraper-config | 5 |
| Other | sentiment-analysis, pdf-generator, ai-report, data-sources, wheel, backtest, index-memberships, disk-lifecycle | 8 |

### 2.3 Backend - Entities (32 arquivos)

| # | Entity | Tabela | Relacionamentos |
|---|--------|--------|-----------------|
| 1 | Asset | assets | prices, fundamentals, analyses, news |
| 2 | AssetPrice | asset_prices | asset |
| 3 | IntradayPrice | intraday_prices | asset |
| 4 | FundamentalData | fundamental_data | asset |
| 5 | Analysis | analyses | asset |
| 6 | User | users | portfolios, alerts |
| 7 | Portfolio | portfolios | user, positions |
| 8 | PortfolioPosition | portfolio_positions | portfolio |
| 9 | Dividend | dividends | asset |
| 10 | StockLending | stock_lending | asset |
| 11 | News | news | analyses |
| 12 | NewsAnalysis | news_analyses | news |
| 13 | Alert | alerts | user |
| 14 | EconomicIndicator | economic_indicators | - |
| 15 | EconomicEvent | economic_events | - |
| 16 | OptionPrice | option_prices | - |
| 17 | WheelStrategy | wheel_strategies | trades |
| 18 | WheelTrade | wheel_trades | strategy |
| 19 | BacktestResult | backtest_results | - |
| 20 | DataSource | data_sources | - |
| 21 | ScrapedData | scraped_data | - |
| 22 | ScraperMetric | scraper_metrics | - |
| 23 | SyncHistory | sync_histories | - |
| 24 | UpdateLog | update_logs | - |
| 25 | TickerChange | ticker_changes | - |
| 26 | AssetIndexMembership | asset_index_memberships | asset |
| 27 | CrossValidationConfig | cross_validation_configs | - |
| 28 | DiscrepancyResolution | discrepancy_resolutions | - |
| 29 | ScraperConfig | scraper_configs | audits |
| 30 | ScraperConfigAudit | scraper_config_audits | config |
| 31 | ScraperExecutionProfile | scraper_execution_profiles | - |
| 32 | SentimentConsensus | sentiment_consensus | - |

### 2.4 Frontend - Pages (21 arquivos)

| # | Page | Route | Tipo | Componentes Criticos |
|---|------|-------|------|---------------------|
| 1 | Home | `/` | Publica | Hero, Features |
| 2 | Login | `/login` | Publica | LoginForm, GoogleOAuth |
| 3 | Register | `/register` | Publica | RegisterForm |
| 4 | Google Callback | `/auth/google/callback` | Publica | OAuth Handler |
| 5 | Dashboard | `/dashboard` | Auth | StatCards, Charts, TickerTape |
| 6 | Assets | `/assets` | Auth | AssetTable, Filters, BulkSync |
| 7 | Asset Detail | `/assets/[ticker]` | Auth | CandlestickChart, Fundamentals, News |
| 8 | Portfolio | `/portfolio` | Auth | PositionTable, AddPosition, Summary |
| 9 | Analysis | `/analysis` | Auth | AnalysisList, NewAnalysis, AICard |
| 10 | Reports | `/reports` | Auth | ReportList, Download |
| 11 | Report Detail | `/reports/[id]` | Auth | ReportViewer, PDF |
| 12 | Settings | `/settings` | Auth | ProfileForm, Notifications |
| 13 | Data Sources | `/data-sources` | Auth | ScraperCards, TestModal |
| 14 | Data Management | `/data-management` | Auth | SyncConfig, AuditTrail |
| 15 | Discrepancies | `/discrepancies` | Auth | DiscrepancyTable, Resolution |
| 16 | OAuth Manager | `/oauth-manager` | Auth | SiteList, VNCViewer |
| 17 | Wheel Strategy | `/wheel` | Auth | StrategyList, Backtest |
| 18 | Wheel Detail | `/wheel/[id]` | Auth | TradeHistory, Performance |
| 19 | Wheel Backtest | `/wheel/backtest` | Auth | BacktestForm, Results |
| 20 | Admin Scrapers | `/admin/scrapers` | Auth | ScraperAdmin, Profiles |
| 21 | Health | `/health` | Auth | SystemHealth, ContainerStatus |

### 2.5 Python Scrapers (41 arquivos)

| # | Scraper | Arquivo | Categoria | Auth |
|---|---------|---------|-----------|------|
| 1 | StatusInvest | statusinvest_scraper.py | Fundamental | No |
| 2 | StatusInvest Dividends | statusinvest_dividends_scraper.py | Dividends | OAuth |
| 3 | Fundamentus | fundamentus_scraper.py | Fundamental | No |
| 4 | Fundamentei | fundamentei_scraper.py | Fundamental | No |
| 5 | Investidor10 | investidor10_scraper.py | Fundamental | No |
| 6 | Investsite | investsite_scraper.py | Fundamental | No |
| 7 | ADVFN | advfn_scraper.py | Market Data | No |
| 8 | B3 | b3_scraper.py | Market Data | No |
| 9 | TradingView | tradingview_scraper.py | Technical | No |
| 10 | Yahoo Finance | yahoo_finance_scraper.py | Market Data | No |
| 11 | Google Finance | googlefinance_scraper.py | Market Data | No |
| 12 | Investing | investing_scraper.py | Market Data | No |
| 13 | Investing News | investing_news_scraper.py | News | No |
| 14 | BCB | bcb_scraper.py | Economic | No |
| 15 | ANBIMA | anbima_scraper.py | Economic | No |
| 16 | FRED | fred_scraper.py | Economic | API Key |
| 17 | IBGE | ibge_scraper.py | Economic | No |
| 18 | IPEA Data | ipeadata_scraper.py | Economic | No |
| 19 | Bloomberg | bloomberg_scraper.py | News | No |
| 20 | Google News | googlenews_scraper.py | News | No |
| 21 | Valor | valor_scraper.py | News | No |
| 22 | Exame | exame_scraper.py | News | No |
| 23 | InfoMoney | infomoney_scraper.py | News | No |
| 24 | Estadao | estadao_scraper.py | News | No |
| 25 | E-Investidor | einvestidor_scraper.py | News | No |
| 26 | ChatGPT | chatgpt_scraper.py | AI Analysis | OAuth |
| 27 | Gemini | gemini_scraper.py | AI Analysis | OAuth |
| 28 | Claude | claude_scraper.py | AI Analysis | OAuth |
| 29 | DeepSeek | deepseek_scraper.py | AI Analysis | OAuth |
| 30 | Grok | grok_scraper.py | AI Analysis | OAuth |
| 31 | Perplexity | perplexity_scraper.py | AI Analysis | OAuth |
| 32 | Opcoes.net | opcoes_scraper.py | Options | OAuth |
| 33 | OpLab | oplab_scraper.py | Options | OAuth |
| 34 | Stock Lending | stock_lending_scraper.py | Lending | No |
| 35 | Griffin | griffin_scraper.py | Fundamental | No |
| 36 | IDIV | idiv_scraper.py | Index | No |
| 37 | Oceans14 | oceans14_scraper.py | Fundamental | No |
| 38 | Mais Retorno | maisretorno_scraper.py | Market Data | No |
| 39 | Kinvo | kinvo_scraper.py | Portfolio | OAuth |
| 40 | CoinGecko | coingecko_scraper.py | Crypto | No |
| 41 | CoinMarketCap | coinmarketcap_scraper.py | Crypto | No |

### 2.6 Docker Containers (21 servicos)

| # | Service | Porta | Health Check | Criticidade |
|---|---------|-------|--------------|-------------|
| 1 | postgres | 5532 | pg_isready | CRITICA |
| 2 | redis | 6479 | redis-cli ping | CRITICA |
| 3 | backend | 3101 | /health | CRITICA |
| 4 | frontend | 3100 | HTTP 200 | CRITICA |
| 5 | python-service | 8001 | /health | ALTA |
| 6 | scrapers | - | Process check | ALTA |
| 7 | api-service | 8000 | /health | ALTA |
| 8 | nginx | 80/443 | HTTP 200 | MEDIA |
| 9 | pgadmin | 5150 | HTTP 200 | BAIXA |
| 10 | redis-commander | 8181 | HTTP 200 | BAIXA |
| 11 | tempo | - | HTTP 200 | MEDIA |
| 12 | loki | - | HTTP 200 | MEDIA |
| 13 | prometheus | 9090 | HTTP 200 | MEDIA |
| 14 | grafana | 3000 | HTTP 200 | MEDIA |
| 15 | node-exporter | - | HTTP 200 | BAIXA |
| 16 | promtail | - | HTTP 200 | BAIXA |
| 17 | postgres-exporter | - | HTTP 200 | BAIXA |
| 18 | redis-exporter | - | HTTP 200 | BAIXA |
| 19 | alertmanager | - | HTTP 200 | MEDIA |
| 20 | meilisearch | 7700 | HTTP 200 | MEDIA |
| 21 | minio | 9000 | HTTP 200 | BAIXA |

---

## 3. MATRIZ DE VALIDACAO

### 3.1 Validacao de Codigo (Pre-Requisito)

| Verificacao | Comando | Criterio | Prioridade |
|-------------|---------|----------|------------|
| TypeScript Backend | `cd backend && npx tsc --noEmit` | 0 erros | BLOQUEANTE |
| TypeScript Frontend | `cd frontend && npx tsc --noEmit` | 0 erros | BLOQUEANTE |
| Build Backend | `cd backend && npm run build` | Sucesso | BLOQUEANTE |
| Build Frontend | `cd frontend && npm run build` | Sucesso | BLOQUEANTE |
| ESLint Frontend | `cd frontend && npm run lint` | 0 critical | BLOQUEANTE |

### 3.2 Validacao de Infraestrutura

| Container | Health Check | Conectividade | Log Check |
|-----------|--------------|---------------|-----------|
| postgres | `pg_isready -h localhost -p 5532` | Backend -> PG | Sem erros criticos |
| redis | `redis-cli -p 6479 ping` | Backend -> Redis | Sem erros criticos |
| backend | `curl localhost:3101/api/v1/health` | Frontend -> Backend | Sem exceptions |
| frontend | `curl localhost:3100` | Browser -> Frontend | 0 console errors |
| python-service | `curl localhost:8001/health` | Backend -> Python | Sem exceptions |
| api-service | `curl localhost:8000/health` | Backend -> API | Sem exceptions |

### 3.3 Validacao de API - Endpoints Criticos

| Endpoint | Metodo | Auth | Validacao |
|----------|--------|------|-----------|
| `/api/v1/health` | GET | No | HTTP 200 + JSON |
| `/api/v1/auth/login` | POST | No | JWT retornado |
| `/api/v1/auth/google` | GET | No | Redirect OAuth |
| `/api/v1/assets` | GET | Yes | Lista assets |
| `/api/v1/assets/:ticker` | GET | Yes | Asset + fundamentals |
| `/api/v1/assets/sync` | POST | Yes | Trigger bulk sync |
| `/api/v1/portfolio` | GET | Yes | Lista portfolios |
| `/api/v1/portfolio/:id/positions` | GET | Yes | Lista posicoes |
| `/api/v1/analysis` | GET | Yes | Lista analyses |
| `/api/v1/analysis` | POST | Yes | Nova analysis |
| `/api/v1/reports` | GET | Yes | Lista reports |
| `/api/v1/market-data/indicators` | GET | Yes | Indicadores economicos |
| `/api/v1/news` | GET | Yes | Lista news |
| `/api/v1/wheel/strategies` | GET | Yes | Lista estrategias |
| `/api/v1/wheel/backtest` | POST | Yes | Executar backtest |
| `/api/v1/scrapers/status` | GET | Yes | Status scrapers |

### 3.4 Validacao de Frontend - MCP Triplo

Para CADA pagina, executar:

```javascript
// 1. Playwright - Navegacao + Snapshot
mcp__playwright__browser_navigate({ url: "http://localhost:3100/[page]" })
mcp__playwright__browser_snapshot({})
mcp__playwright__browser_take_screenshot({ filename: "[page].png", fullPage: true })

// 2. Chrome DevTools - Console + Network
mcp__chrome-devtools__take_snapshot({})
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
mcp__chrome-devtools__list_network_requests({ resourceTypes: ["xhr", "fetch"] })

// 3. A11y - Accessibility Audit
mcp__a11y__audit_webpage({ url: "http://localhost:3100/[page]", tags: ["wcag2aa"] })
```

| Pagina | Navegacao | Loading | Interacao | Console | A11y |
|--------|-----------|---------|-----------|---------|------|
| `/` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/login` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/register` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/dashboard` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/assets` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/assets/PETR4` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/portfolio` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/analysis` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/reports` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/settings` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/data-sources` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/data-management` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/discrepancies` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/oauth-manager` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/wheel` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/wheel/backtest` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/admin/scrapers` | [ ] | [ ] | [ ] | [ ] | [ ] |
| `/health` | [ ] | [ ] | [ ] | [ ] | [ ] |

### 3.5 Validacao de Scrapers

| Scraper | Health | Output | Cross-Val | Performance |
|---------|--------|--------|-----------|-------------|
| StatusInvest | [ ] | [ ] | [ ] | [ ] |
| Fundamentus | [ ] | [ ] | [ ] | [ ] |
| Fundamentei | [ ] | [ ] | [ ] | [ ] |
| Investidor10 | [ ] | [ ] | [ ] | [ ] |
| BCB | [ ] | [ ] | [ ] | [ ] |
| Yahoo Finance | [ ] | [ ] | [ ] | [ ] |
| BRAPI | [ ] | [ ] | [ ] | [ ] |

### 3.6 Validacao de Integracao

| Integracao | Conectividade | Dados | Latencia |
|------------|---------------|-------|----------|
| Backend -> PostgreSQL | [ ] | [ ] | < 50ms |
| Backend -> Redis | [ ] | [ ] | < 10ms |
| Backend -> Python Service | [ ] | [ ] | < 100ms |
| Frontend -> Backend API | [ ] | [ ] | < 200ms |
| Backend -> External APIs | [ ] | [ ] | < 5000ms |
| WebSocket Connection | [ ] | [ ] | - |
| BullMQ Jobs | [ ] | [ ] | - |

---

## 4. CENARIOS DE TESTE

### 4.1 Testes E2E Criticos

| # | Cenario | Steps | Expected Result |
|---|---------|-------|-----------------|
| E2E-001 | Login com email/senha | 1. Navegar /login 2. Preencher form 3. Submit | Redirect /dashboard |
| E2E-002 | Login com Google | 1. Navegar /login 2. Click Google 3. OAuth | Redirect /dashboard |
| E2E-003 | Visualizar asset | 1. Login 2. /assets 3. Click PETR4 | Detalhes + graficos |
| E2E-004 | Sync individual | 1. Login 2. /assets 3. Sync PETR4 | Dados atualizados |
| E2E-005 | Bulk sync | 1. Login 2. /assets 3. Bulk sync | Progress + completion |
| E2E-006 | Criar portfolio | 1. Login 2. /portfolio 3. New | Portfolio criado |
| E2E-007 | Add posicao | 1. Login 2. /portfolio 3. Add position | Posicao adicionada |
| E2E-008 | Nova analysis | 1. Login 2. /analysis 3. New | Analysis gerada |
| E2E-009 | Wheel backtest | 1. Login 2. /wheel/backtest 3. Run | Resultados exibidos |
| E2E-010 | Gerar report | 1. Login 2. /reports 3. Generate | PDF disponivel |

### 4.2 Testes de API

| # | Cenario | Endpoint | Method | Expected |
|---|---------|----------|--------|----------|
| API-001 | Health check | /health | GET | 200 + uptime |
| API-002 | Login valido | /auth/login | POST | 200 + JWT |
| API-003 | Login invalido | /auth/login | POST | 401 |
| API-004 | Lista assets | /assets | GET | 200 + array |
| API-005 | Asset por ticker | /assets/PETR4 | GET | 200 + dados |
| API-006 | Asset inexistente | /assets/XXXXX | GET | 404 |
| API-007 | Sync sem auth | /assets/sync | POST | 401 |
| API-008 | Sync com auth | /assets/sync | POST | 200/202 |
| API-009 | Lista portfolios | /portfolio | GET | 200 + array |
| API-010 | CRUD portfolio | /portfolio | POST/PUT/DELETE | 201/200/204 |

### 4.3 Testes de Scraper

| # | Scraper | Test | Expected |
|---|---------|------|----------|
| SCR-001 | Fundamentus | GET PETR4 | P/L, P/VP, DY% |
| SCR-002 | StatusInvest | GET PETR4 | ROE, ROIC, margins |
| SCR-003 | BCB | GET SELIC | Taxa atual |
| SCR-004 | Yahoo Finance | GET PETR4.SA | OHLCV prices |
| SCR-005 | Cross-validation | GET PETR4 (3 fontes) | Consenso < 10% diff |

### 4.4 Testes de Resiliencia

| # | Cenario | Simulacao | Expected |
|---|---------|-----------|----------|
| RES-001 | Scraper timeout | Delay 200s | Graceful degradation |
| RES-002 | API externa down | Mock 503 | Fallback/retry |
| RES-003 | Redis down | Stop container | Error handling |
| RES-004 | High load | 100 concurrent | Response < 5s |
| RES-005 | Job stalling | Kill mid-job | Auto-cleanup 5min |

---

## 5. CRONOGRAMA DE EXECUCAO

### 5.1 Timeline Estimado

| Fase | Atividade | Duracao | Dependencias |
|------|-----------|---------|--------------|
| 0 | Pre-requisitos (Build validation) | 30 min | - |
| 1 | Infraestrutura (Docker health) | 1 hora | Fase 0 |
| 2 | Backend API (28 controllers) | 3 horas | Fase 1 |
| 3 | Frontend Pages (21 pages) | 4 horas | Fase 1 |
| 4 | Python Scrapers (41 scrapers) | 2 horas | Fase 1 |
| 5 | Integracao E2E | 2 horas | Fases 2-4 |
| 6 | Performance/Stress | 1 hora | Fase 5 |
| 7 | Documentacao/Report | 1 hora | Fase 6 |

**Total Estimado:** 14-16 horas (2 dias uteis)

### 5.2 Ordem de Execucao

```
FASE 0: Build Validation
    |
    v
FASE 1: Infrastructure Health
    |
    +----+----+----+
    |    |    |    |
    v    v    v    v
  API  Frontend  Scrapers  DB
    |    |    |    |
    +----+----+----+
    |
    v
FASE 5: E2E Integration
    |
    v
FASE 6: Performance
    |
    v
FASE 7: Documentation
```

### 5.3 Paralelizacao

Executar em paralelo apos Fase 1:
- **Agent 1:** Backend API Testing
- **Agent 2:** Frontend MCP Triplo
- **Agent 3:** Python Scrapers Validation
- **Agent 4:** Database/Integration Testing

---

## 6. RISCOS IDENTIFICADOS

### 6.1 Issues Ativos (de KNOWN-ISSUES.md)

| ID | Issue | Severidade | Impacto na Validacao |
|----|-------|------------|---------------------|
| DOCKER_DESKTOP_500 | C: drive 95% full | CRITICA | Pode bloquear todos os testes |
| DIVID-001 | StatusInvest Cloudflare | MEDIA | Dividends scraper nao funcional |
| FRED-001 | FRED API key required | BAIXA | Economic indicators incompletos |
| SCRAPER_CONFIG_SIDEBAR | Link faltando sidebar | BAIXA | Nao impacta funcionalidade |
| SCRAPER_CONFIG_EDIT | PUT endpoint faltando | MEDIA | Edit de profiles nao funciona |

### 6.2 Riscos Tecnicos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Docker Desktop fail | Alta | Critico | Liberar espaco C: antes |
| Scraper timeout | Media | Medio | Circuit breaker ativo |
| Rate limiting APIs | Media | Medio | Delay entre requests |
| WebSocket disconnect | Baixa | Baixo | Reconnect automatico |
| Memory exhaustion | Baixa | Alto | Monitor container limits |

### 6.3 Pre-Requisitos Obrigatorios

ANTES de iniciar validacao:

1. **Liberar espaco em C:** (>50GB free) - ver DOCKER_DESKTOP_500
2. **Verificar Docker Desktop** rodando e healthy
3. **Confirmar todos containers up:** `docker-compose ps`
4. **Verificar builds:** TypeScript 0 errors

---

## 7. METRICAS DE SUCESSO

### 7.1 KPIs de Qualidade

| Metrica | Target | Medicao |
|---------|--------|---------|
| TypeScript Errors | 0 | `tsc --noEmit` |
| Build Failures | 0 | `npm run build` |
| Console Errors | 0 | Chrome DevTools |
| API Success Rate | 100% | HTTP 2xx responses |
| Container Health | 100% | Docker health checks |
| WCAG AA Compliance | 100% | a11y MCP audit |
| Cross-Validation Pass | 95%+ | 3+ sources agree |
| E2E Test Pass | 100% | Playwright tests |

### 7.2 KPIs de Performance

| Metrica | Target | Medicao |
|---------|--------|---------|
| API Response Time | < 200ms | P95 latency |
| Page Load Time | < 3s | Lighthouse |
| Time to First Byte | < 500ms | DevTools |
| WebSocket Latency | < 100ms | Event timing |
| Scraper Execution | < 30s cada | Job completion |

### 7.3 Definicao de "Done"

Validacao COMPLETA quando:

- [ ] Fase 0: Builds passando sem erros
- [ ] Fase 1: Todos containers healthy
- [ ] Fase 2: Todos endpoints API respondendo
- [ ] Fase 3: Todas paginas renderizando sem console errors
- [ ] Fase 4: Scrapers prioritarios funcionando
- [ ] Fase 5: E2E tests passando
- [ ] Fase 6: Performance dentro dos targets
- [ ] Fase 7: Relatorio final gerado

---

## 8. PROCEDIMENTOS DE EXECUCAO

### 8.1 Fase 0 - Build Validation

```bash
# Backend TypeScript
cd C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend
npx tsc --noEmit
npm run build

# Frontend TypeScript
cd C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\frontend
npx tsc --noEmit
npm run build
npm run lint
```

**Criterio:** 0 erros em todos os comandos

### 8.2 Fase 1 - Infrastructure Health

```powershell
# Script de validacao
.\system-manager.ps1 health
.\system-manager.ps1 status

# Ou manualmente:
docker-compose ps
docker exec invest_postgres pg_isready
docker exec invest_redis redis-cli ping
curl http://localhost:3101/api/v1/health
curl http://localhost:3100
```

**Criterio:** Todos containers "healthy", APIs respondendo

### 8.3 Fase 2 - Backend API

Para cada controller, testar endpoints principais:

```bash
# Auth
curl -X POST http://localhost:3101/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Assets (com JWT)
TOKEN="your_jwt_here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3101/api/v1/assets
curl -H "Authorization: Bearer $TOKEN" http://localhost:3101/api/v1/assets/PETR4
```

### 8.4 Fase 3 - Frontend MCP Triplo

Para cada pagina:

1. Playwright navigate + snapshot
2. Chrome DevTools console check
3. A11y audit

### 8.5 Fase 4 - Python Scrapers

```bash
# Health check
curl http://localhost:8000/health
curl http://localhost:8001/health

# Test scraper
curl http://localhost:8000/api/scrapers/fundamentus/PETR4
curl http://localhost:8000/api/scrapers/bcb/selic
```

### 8.6 Fase 5 - E2E Integration

```bash
cd frontend
npx playwright test
```

### 8.7 Fase 6 - Performance

```bash
# Lighthouse audit via Playwright
# Load testing via k6 ou similar
```

### 8.8 Fase 7 - Documentation

Gerar relatorio final com:
- Issues encontrados
- Metricas coletadas
- Recomendacoes

---

## 9. ANEXOS

### 9.1 Arquivos de Referencia

| Documento | Localizacao | Proposito |
|-----------|-------------|-----------|
| CLAUDE.md | Raiz | Regras do projeto |
| ARCHITECTURE.md | Raiz | Arquitetura do sistema |
| DATABASE_SCHEMA.md | Raiz | Schema do banco |
| KNOWN-ISSUES.md | Raiz | Issues documentados |
| CHECKLIST_ECOSSISTEMA_COMPLETO.md | Raiz | Checklist detalhado |
| MAPEAMENTO_FONTES_DADOS_COMPLETO.md | Raiz | Mapa de scrapers |

### 9.2 Scripts Uteis

| Script | Localizacao | Proposito |
|--------|-------------|-----------|
| system-manager.ps1 | Raiz | Gerenciar Docker |
| fix-docker-desktop.ps1 | Raiz | Recovery Docker |
| check-disk-space.ps1 | Raiz | Monitor disco |

### 9.3 MCPs Disponiveis

| MCP | Proposito |
|-----|-----------|
| playwright | E2E testing, screenshots |
| chrome-devtools | Console, network debug |
| a11y | WCAG accessibility audit |
| sequential-thinking | Analysis structuring |
| react-context | Component debugging |

---

## 10. CONCLUSAO

Este plano de validacao cobre **100% do ecossistema** da plataforma B3 AI Analysis:

- **28 Controllers** backend
- **57 Services** backend
- **32 Entities** database
- **21 Pages** frontend
- **41 Scrapers** Python
- **21 Containers** Docker

A execucao completa requer **14-16 horas** (2 dias uteis) e depende da resolucao previa do issue DOCKER_DESKTOP_500 (liberar espaco em C:).

**Recomendacao:** Iniciar pela Fase 0 (build validation) para garantir que o codigo esta compilando corretamente antes de qualquer teste de integracao.

---

**Documento gerado por:** PM Expert Agent (Claude Opus 4.5)
**Data:** 2026-01-03
**Versao:** 1.0.0
