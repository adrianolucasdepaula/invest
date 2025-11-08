# ÍNDICE RÁPIDO - ARQUITETURA DO BACKEND

## Documentação Gerada

| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `ARCHITECTURE_MAPPING_COMPLETE.md` | 48 KB | Mapeamento completo e detalhado (1937 linhas) |
| `ARCHITECTURE_SUMMARY.txt` | 14 KB | Resumo executivo estruturado |
| `ARCHITECTURE_INDEX.md` | Este arquivo | Índice rápido e referência |

---

## Estrutura de Diretórios do Backend

```
/home/user/invest/backend/
├── src/
│   ├── api/                          # 6 Controllers + 6 Services
│   │   ├── auth/                     # JWT + Google OAuth
│   │   │   ├── auth.controller.ts    (5 endpoints)
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/           (JWT, Google)
│   │   │   ├── guards/               (JWT Auth Guard, Google Auth Guard)
│   │   │   └── dto/                  (RegisterDto, LoginDto)
│   │   │
│   │   ├── assets/                   # Gerenciamento de Ativos
│   │   │   ├── assets.controller.ts  (4 endpoints)
│   │   │   ├── assets.service.ts
│   │   │   └── assets.module.ts
│   │   │
│   │   ├── portfolio/                # Portfólio com Import
│   │   │   ├── portfolio.controller.ts (9 endpoints)
│   │   │   ├── portfolio.service.ts
│   │   │   ├── portfolio.module.ts
│   │   │   ├── dto/                  (4 DTOs)
│   │   │   └── parsers/              (B3Parser, KinvoParser)
│   │   │
│   │   ├── analysis/                 # Análises
│   │   │   ├── analysis.controller.ts (5 endpoints)
│   │   │   ├── analysis.service.ts
│   │   │   └── analysis.module.ts
│   │   │
│   │   ├── reports/                  # Relatórios
│   │   │   ├── reports.controller.ts (4 endpoints)
│   │   │   ├── reports.service.ts
│   │   │   ├── ai-report.service.ts
│   │   │   ├── reports.module.ts
│   │   │   ├── dto/                  (GenerateReportDto)
│   │   │   └── services/             (ReportTemplate, PdfGenerator)
│   │   │
│   │   └── data-sources/             # Fontes de Dados
│   │       ├── data-sources.controller.ts (2 endpoints)
│   │       ├── data-sources.service.ts
│   │       └── data-sources.module.ts
│   │
│   ├── ai/                           # 5 Agentes + Services
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts
│   │   ├── agents/                   (5 agents especializados)
│   │   ├── services/                 (DocumentSharding, MultiAgent)
│   │   └── interfaces/               (Types e Interfaces)
│   │
│   ├── analysis/                     # Análises Técnicas/Sentimento
│   │   ├── technical/
│   │   │   ├── technical-analysis.service.ts
│   │   │   └── technical-indicators.service.ts
│   │   └── sentiment/
│   │       └── sentiment-analysis.service.ts
│   │
│   ├── database/                     # 10 Entities TypeORM
│   │   ├── entities/
│   │   │   ├── user.entity.ts        (13 campos)
│   │   │   ├── asset.entity.ts       (13 campos)
│   │   │   ├── asset-price.entity.ts (10 campos)
│   │   │   ├── fundamental-data.entity.ts (59 campos)
│   │   │   ├── portfolio.entity.ts   (10 campos)
│   │   │   ├── portfolio-position.entity.ts (13 campos)
│   │   │   ├── analysis.entity.ts    (19 campos)
│   │   │   ├── data-source.entity.ts (15 campos)
│   │   │   ├── scraped-data.entity.ts (12 campos)
│   │   │   └── index.ts
│   │   ├── database.module.ts
│   │   ├── data-source.ts            (Configuração PostgreSQL)
│   │   ├── migrations/               (TypeORM migrations)
│   │   └── seeds/                    (Data seeds)
│   │
│   ├── scrapers/                     # 8 Web Scrapers
│   │   ├── scrapers.module.ts
│   │   ├── scrapers.service.ts       (Orquestrador)
│   │   ├── base/
│   │   │   ├── abstract-scraper.ts   (Classe base com Puppeteer)
│   │   │   └── base-scraper.interface.ts
│   │   ├── fundamental/              (4 scrapers)
│   │   │   ├── brapi.scraper.ts
│   │   │   ├── fundamentus.scraper.ts
│   │   │   ├── investidor10.scraper.ts
│   │   │   └── statusinvest.scraper.ts
│   │   ├── news/                     (2 scrapers)
│   │   │   ├── google-news.scraper.ts
│   │   │   └── valor.scraper.ts
│   │   ├── options/                  (1 scraper)
│   │   │   └── opcoes.scraper.ts
│   │   └── auth/
│   │       └── google-auth.helper.ts
│   │
│   ├── queue/                        # Bull Queue + CRON
│   │   ├── queue.module.ts           (3 filas registradas)
│   │   ├── jobs/
│   │   │   └── scheduled-jobs.service.ts (4 CRON jobs)
│   │   └── processors/
│   │       └── scraping.processor.ts (3 job handlers)
│   │
│   ├── websocket/                    # Real-time com Socket.io
│   │   ├── websocket.gateway.ts      (7 eventos)
│   │   └── websocket.module.ts
│   │
│   ├── common/                       # Global Services
│   │   ├── common.module.ts          (@Global)
│   │   ├── services/
│   │   │   ├── cache.service.ts      (Redis)
│   │   │   └── notifications.service.ts
│   │   ├── decorators/
│   │   ├── interceptors/
│   │   └── guards/
│   │
│   ├── validators/                   # Validadores Customizados
│   │   └── validators.module.ts
│   │
│   ├── app.module.ts                 # Módulo Raiz
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts                       # Entry Point
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript Config
├── nest-cli.json                     # NestJS Config
├── .env.example                      # Variáveis de Ambiente
├── ARCHITECTURE_MAPPING_COMPLETE.md  # Documentação Completa
├── ARCHITECTURE_SUMMARY.txt          # Resumo Executivo
├── ARCHITECTURE_INDEX.md             # Este arquivo
├── dist/                             # Build Output
└── README.md
```

---

## Endpoints por Módulo

### Auth (5 endpoints)
```
POST   /api/v1/auth/register              Registrar
POST   /api/v1/auth/login                 Login
GET    /api/v1/auth/google                Google OAuth
GET    /api/v1/auth/google/callback       Google Callback
GET    /api/v1/auth/me                    Perfil (JWT)
```

### Assets (4 endpoints)
```
GET    /api/v1/assets                     Listar
GET    /api/v1/assets/:ticker             Obter por ticker
GET    /api/v1/assets/:ticker/price-history  Histórico
POST   /api/v1/assets/:ticker/sync        Sincronizar
```

### Portfolio (9 endpoints)
```
GET    /api/v1/portfolio                  Listar (JWT)
GET    /api/v1/portfolio/:id              Obter (JWT)
POST   /api/v1/portfolio                  Criar (JWT)
PATCH  /api/v1/portfolio/:id              Atualizar (JWT)
DELETE /api/v1/portfolio/:id              Deletar (JWT)
POST   /api/v1/portfolio/:portfolioId/positions          Adicionar (JWT)
PATCH  /api/v1/portfolio/:portfolioId/positions/:posId   Atualizar (JWT)
DELETE /api/v1/portfolio/:portfolioId/positions/:posId   Deletar (JWT)
POST   /api/v1/portfolio/import           Importar (JWT)
```

### Analysis (5 endpoints)
```
POST   /api/v1/analysis/:ticker/fundamental  Análise Fundamental (JWT)
POST   /api/v1/analysis/:ticker/technical    Análise Técnica (JWT)
POST   /api/v1/analysis/:ticker/complete     Análise Completa (JWT)
GET    /api/v1/analysis/:ticker              Listar (JWT)
GET    /api/v1/analysis/:id/details          Detalhes (JWT)
```

### Reports (4 endpoints)
```
GET    /api/v1/reports                    Listar (JWT)
GET    /api/v1/reports/:id                Obter (JWT)
POST   /api/v1/reports/generate           Gerar (JWT)
GET    /api/v1/reports/:id/download       Baixar (JWT)
```

### Data Sources (2 endpoints)
```
GET    /api/v1/data-sources               Listar
GET    /api/v1/data-sources/status        Status
```

---

## Entities e Relacionamentos

```
User (13 campos)
  └─ OneToMany: Portfolio

Asset (13 campos)
  ├─ OneToMany: AssetPrice
  ├─ OneToMany: FundamentalData
  ├─ OneToMany: Analysis
  └─ OneToMany: ScrapedData

AssetPrice (10 campos)
  └─ ManyToOne: Asset

FundamentalData (59 campos)
  └─ ManyToOne: Asset

Portfolio (10 campos)
  ├─ ManyToOne: User
  └─ OneToMany: PortfolioPosition

PortfolioPosition (13 campos)
  ├─ ManyToOne: Portfolio
  └─ ManyToOne: Asset

Analysis (19 campos)
  ├─ ManyToOne: Asset
  └─ ManyToOne: User (nullable)

DataSource (15 campos)
  └─ OneToMany: ScrapedData

ScrapedData (12 campos)
  ├─ ManyToOne: Asset
  └─ ManyToOne: DataSource
```

---

## Tecnologias por Camada

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | NestJS | 10.3.0 |
| Linguagem | TypeScript | 5.3.3 |
| API | Express + NestJS | 10.3.0 |
| ORM | TypeORM | 0.3.19 |
| Database | PostgreSQL | 14+ |
| Cache | Redis | 5.3.2 |
| Queue | Bull | 4.16.5 |
| Real-time | Socket.io | 4.6.1 |
| Web Scraping | Puppeteer | 23.11.1 |
| Auth | JWT + Passport | latest |
| Validation | class-validator | 0.14.1 |
| Testing | Jest | 29.7.0 |
| API Docs | Swagger | 7.1.17 |

---

## Services Mapeados

### API Layer (6 services)
- AuthService
- AssetsService
- PortfolioService
- AnalysisService
- ReportsService
- DataSourcesService

### Queue/Jobs (2 services)
- ScheduledJobsService
- ScrapingProcessor

### Analysis (3 services)
- TechnicalAnalysisService
- TechnicalIndicatorsService
- SentimentAnalysisService

### AI (3 services)
- MultiAgentAnalysisService
- DocumentShardingService
- 5 Agents (Fundamental, Technical, Sentiment, Risk, Macro)

### Reports (3 services)
- ReportTemplateService
- PdfGeneratorService
- AIReportService

### Scrapers (2 main)
- ScrapersService
- AbstractScraper (8 implementações)

### Common (2 services)
- CacheService
- NotificationsService

---

## CRON Jobs Agendados

| Horário | Job | Descrição | Status |
|---------|-----|-----------|--------|
| 21:00 daily | updateFundamentalData() | Top 50 ações | ATIVO |
| 18:00 daily | updateOptionsData() | Top 20 com opções | ATIVO |
| 03:00 Sunday | cleanOldData() | Limpeza dados >90d | TODO |
| */15 9-18 | updatePriceData() | 100 ativos | TODO |

---

## WebSocket Events

| Evento | Room Pattern | Uso |
|--------|-------------|-----|
| subscribe | N/A | Cliente inscreve em tickers |
| unsubscribe | N/A | Cliente desinscreve |
| price_update | {ticker}:prices | Broadcast preço |
| analysis_complete | {ticker}:analysis | Broadcast análise |
| report_ready | {ticker}:reports | Broadcast relatório |
| portfolio_update | {userId}:portfolio | Broadcast portfólio |
| market_status | broadcast | Status do mercado |

---

## Indicadores Técnicos

### Implementados (5)
- RSI (14 períodos)
- SMA (20, 50, 200 períodos)
- EMA (12, 26 períodos)
- MACD
- Price changes (1d, 5d, 20d)

### Não Implementados (5)
- Bollinger Bands
- Stochastic
- ATR
- Ichimoku
- ADX

---

## Scrapers Implementados (8)

### Fundamental (4)
- Brapi (API)
- Fundamentus
- Investidor10
- StatusInvest

### News (2)
- Google News
- Valor Econômico

### Options (1)
- Opcoes.com

### Base (1)
- AbstractScraper (Puppeteer)

---

## Problemas Identificados

### CRÍTICOS (5)
1. generateCompleteAnalysis() - TODO
2. syncAsset() - TODO
3. cleanOldData() - TODO
4. updatePriceData() - TODO
5. importPortfolio() - TODO (multer)

### MÉDIOS (4)
6. Indicadores técnicos incompletos
7. Cobertura de testes baixa
8. Validação inconsistente
9. Tratamento de erros inconsistente

### MENORES (3)
10. Rate limiting permissivo
11. Documentação scrapers incompleta
12. CORS precisa validação produção

---

## Variáveis de Ambiente

### Database
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db
DB_SYNCHRONIZE=false
DB_LOGGING=true
```

### Redis
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### JWT
```
JWT_SECRET=<min 32 chars>
JWT_EXPIRATION=7d
```

### OAuth
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3101/api/auth/google/callback
```

### OpenAI
```
OPENAI_API_KEY=
```

### Scrapers
```
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENT_JOBS=3
SCRAPER_RETRY_ATTEMPTS=3
SCRAPER_TIMEOUT=30000
```

### Rate Limiting
```
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### CORS
```
CORS_ORIGIN=http://localhost:3100,http://localhost:3000
```

---

## Estatísticas

| Métrica | Quantidade |
|---------|-----------|
| Total Modules | 14 |
| Controllers | 6 |
| Services | 20+ |
| Entities | 10 |
| DTOs | 7 |
| Scrapers | 8 |
| AI Agents | 5 |
| Total Endpoints | 29 |
| Database Indexes | 19 |
| Database Fields | 144 |
| TypeScript Files | 70+ |

---

## Como Usar Este Índice

1. **Para visão completa:** Consultar `ARCHITECTURE_MAPPING_COMPLETE.md`
2. **Para resumo executivo:** Consultar `ARCHITECTURE_SUMMARY.txt`
3. **Para referência rápida:** Usar este arquivo `ARCHITECTURE_INDEX.md`

---

## Links Rápidos para Arquivos Principais

### Controllers
- `/src/api/auth/auth.controller.ts` (5 endpoints)
- `/src/api/assets/assets.controller.ts` (4 endpoints)
- `/src/api/portfolio/portfolio.controller.ts` (9 endpoints)
- `/src/api/analysis/analysis.controller.ts` (5 endpoints)
- `/src/api/reports/reports.controller.ts` (4 endpoints)
- `/src/api/data-sources/data-sources.controller.ts` (2 endpoints)

### Services Principais
- `/src/api/auth/auth.service.ts` - Autenticação
- `/src/api/assets/assets.service.ts` - Ativos com queries otimizadas
- `/src/api/portfolio/portfolio.service.ts` - Portfólio com import
- `/src/api/analysis/analysis.service.ts` - Análises com indicadores
- `/src/queue/jobs/scheduled-jobs.service.ts` - CRON jobs
- `/src/websocket/websocket.gateway.ts` - Real-time events

### Entities
- `/src/database/entities/user.entity.ts`
- `/src/database/entities/asset.entity.ts`
- `/src/database/entities/portfolio.entity.ts`
- `/src/database/entities/analysis.entity.ts`

### Configurações
- `/src/main.ts` - Setup global
- `/src/app.module.ts` - Módulo raiz
- `/package.json` - Dependencies
- `.env.example` - Variáveis de ambiente

---

## Status Geral

✅ **ARQUITETURA SÓLIDA** com separação clara de responsabilidades  
⚠️ **COM PONTOS DE ATENÇÃO**: 5 TODOs críticos precisam implementação  
✅ **PRONTA PARA DESENVOLVIMENTO** ativo  
⚠️ **ANTES DE PRODUÇÃO**: Completar TODOs e aumentar testes  

---

**Última atualização:** 2025-11-08  
**Versão Backend:** 1.0.0  
**Framework:** NestJS 10.3.0  

