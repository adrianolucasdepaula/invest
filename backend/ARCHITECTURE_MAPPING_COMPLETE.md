# MAPEAMENTO COMPLETO E DETALHADO DA ARQUITETURA DO BACKEND
## B3 Investment Analysis Platform API - NestJS

**Data:** 2025-11-08  
**Versão Backend:** 1.0.0  
**Framework:** NestJS 10.3.0  
**Database:** PostgreSQL 14+  
**Cache:** Redis (5.3.2)  
**Queue:** Bull 4.16.5 com Redis  

---

## ÍNDICE

1. [Estrutura Geral do Projeto](#estrutura-geral)
2. [Módulos NestJS](#módulos-nestjs)
3. [Controllers e Endpoints](#controllers-endpoints)
4. [Services](#services)
5. [Entities e Database](#entities-database)
6. [DTOs e Validação](#dtos-validação)
7. [Jobs, Schedulers e Background Tasks](#jobs-schedulers)
8. [WebSocket Gateway](#websocket-gateway)
9. [Integrações Externas](#integrações-externas)
10. [Configurações](#configurações)
11. [Problemas Identificados](#problemas-identificados)

---

## ESTRUTURA GERAL

```
/backend
├── src/
│   ├── api/                    # Camada de API (Controllers + Services)
│   │   ├── auth/               # Autenticação e autorização
│   │   ├── assets/             # Gerenciamento de ativos
│   │   ├── portfolio/          # Gerenciamento de portfólio
│   │   ├── analysis/           # Análises de ativos
│   │   ├── reports/            # Geração de relatórios
│   │   └── data-sources/       # Gerenciamento de fontes de dados
│   ├── ai/                     # Módulo de IA com agentes especializados
│   │   ├── agents/             # Agentes de análise especializados
│   │   ├── services/           # Serviços de AI (Document Sharding, Multi-Agent)
│   │   └── interfaces/         # Tipos e interfaces
│   ├── analysis/               # Análises técnicas e de sentimento
│   │   ├── technical/          # Análise técnica
│   │   └── sentiment/          # Análise de sentimento
│   ├── database/               # Camada de dados
│   │   ├── entities/           # Entities TypeORM
│   │   ├── migrations/         # Migrações do banco
│   │   └── seeds/              # Seeds iniciais
│   ├── scrapers/               # Web scrapers para coleta de dados
│   │   ├── base/               # Classes base abstratas
│   │   ├── fundamental/        # Scrapers de análise fundamental
│   │   ├── news/               # Scrapers de notícias
│   │   ├── options/            # Scrapers de opções
│   │   └── auth/               # Helpers de autenticação
│   ├── queue/                  # Queue/Jobs com Bull
│   │   ├── jobs/               # Scheduled jobs
│   │   └── processors/         # Job processors
│   ├── websocket/              # WebSocket real-time
│   │   └── websocket.gateway.ts
│   ├── common/                 # Utilitários comuns
│   │   ├── services/           # Cache, Notifications
│   │   ├── decorators/         # Custom decorators
│   │   └── interceptors/       # Global interceptors
│   ├── validators/             # Validadores customizados
│   ├── app.module.ts           # Módulo raiz
│   ├── app.controller.ts       # Controller raiz
│   ├── app.service.ts          # Service raiz
│   └── main.ts                 # Entry point
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
└── dist/                       # Build output

```

---

## MÓDULOS NESTJS

### 1. **AppModule** (Raiz)
**Arquivo:** `src/app.module.ts`

**Responsabilidades:**
- Configuração global da aplicação
- Setup de banco de dados (TypeORM)
- Configuração de filas (Bull)
- Setup de rate limiting (Throttler)
- Importação de todos os módulos da aplicação

**Imports:**
- ConfigModule (global)
- TypeOrmModule
- BullModule
- ScheduleModule
- ThrottlerModule
- CommonModule
- DatabaseModule
- AuthModule
- AssetsModule
- AnalysisModule
- PortfolioModule
- ReportsModule
- ScrapersModule
- DataSourcesModule
- QueueModule
- AiModule
- ValidatorsModule
- WebSocketModule

**Configurações Principais:**
```typescript
Database: PostgreSQL com SSL para produção
Rate Limiting: 100 requests por 60 segundos (global)
JWT Expiration: 7 dias
Synchronize: false (migrations manually)
```

---

### 2. **AuthModule**
**Arquivo:** `src/api/auth/auth.module.ts`

**Responsabilidades:**
- Autenticação com JWT
- Autenticação com Google OAuth (condicional)
- Gerenciamento de sessão de usuário

**Providers:**
- `AuthService` - Lógica de autenticação
- `JwtStrategy` - Estratégia JWT Passport
- `GoogleStrategy` - Estratégia Google OAuth (condicional)

**Entities:**
- User

**Exports:**
- AuthService
- JwtModule
- PassportModule

---

### 3. **AssetsModule**
**Arquivo:** `src/api/assets/assets.module.ts`

**Responsabilidades:**
- Gerenciamento de ativos (ações, ETFs, FIIs, BDRs, etc.)
- Histórico de preços
- Sincronização de dados de ativos

**Providers:**
- `AssetsService`

**Entities:**
- Asset
- AssetPrice

**Exports:**
- AssetsService

---

### 4. **PortfolioModule**
**Arquivo:** `src/api/portfolio/portfolio.module.ts`

**Responsabilidades:**
- CRUD de portfólios
- Gerenciamento de posições de investimento
- Import de portfólios (B3, Kinvo)
- Cálculo de valores e lucros

**Providers:**
- `PortfolioService`
- `B3Parser` - Parser de arquivos B3
- `KinvoParser` - Parser de arquivos Kinvo

**Entities:**
- Portfolio
- PortfolioPosition
- Asset

**Exports:**
- PortfolioService

---

### 5. **AnalysisModule**
**Arquivo:** `src/api/analysis/analysis.module.ts`

**Responsabilidades:**
- Análise técnica
- Análise fundamental
- Armazenamento de análises
- Geração de recomendações

**Providers:**
- `AnalysisService`

**Entities:**
- Analysis
- Asset
- AssetPrice

**Imports:**
- ScrapersModule

**Exports:**
- AnalysisService

---

### 6. **ReportsModule**
**Arquivo:** `src/api/reports/reports.module.ts`

**Responsabilidades:**
- Geração de relatórios completos
- Geração de PDF, HTML e JSON
- Integração com IA para relatórios enriquecidos
- Templates de relatórios

**Providers:**
- `ReportsService`
- `AIReportService`
- `ReportTemplateService`
- `PdfGeneratorService`

**Entities:**
- Asset

**Imports:**
- AnalysisModule

**Exports:**
- ReportsService
- AIReportService

---

### 7. **DataSourcesModule**
**Arquivo:** `src/api/data-sources/data-sources.module.ts`

**Responsabilidades:**
- Gerenciamento de fontes de dados
- Monitoramento de status das fontes
- Confiabilidade e histórico de sucesso

**Providers:**
- `DataSourcesService`

---

### 8. **QueueModule**
**Arquivo:** `src/queue/queue.module.ts`

**Responsabilidades:**
- Gerenciamento de filas (scraping, analysis, reports)
- Processamento assíncrono de jobs
- Scheduled jobs com CRON

**Providers:**
- `ScrapingProcessor`
- `ScheduledJobsService`

**Filas Registradas:**
- `scraping` - Processamento de scraping
- `analysis` - Processamento de análises
- `reports` - Geração de relatórios

**Imports:**
- ScrapersModule
- TypeOrmModule

**Exports:**
- BullModule
- ScheduledJobsService

---

### 9. **ScrapersModule**
**Arquivo:** `src/scrapers/scrapers.module.ts`

**Responsabilidades:**
- Web scraping de dados financeiros
- Múltiplas fontes de dados
- Autenticação para fontes protegidas

**Scrapers Implementados:**
- **Fundamental:**
  - `BrapiScraper` - API Brapi
  - `Fundamentus Scraper` - Fundamentus
  - `Investidor10Scraper` - Investidor10
  - `StatusinvestScraper` - StatusInvest

- **News:**
  - `GoogleNewsScraper` - Notícias Google
  - `ValorScraper` - Valor Econômico

- **Options:**
  - `OpcoesScraper` - Dados de opções

**Providers:**
- `ScrapersService` (orquestrador)
- Todos os scrapers individuais

---

### 10. **AiModule**
**Arquivo:** `src/ai/ai.module.ts`

**Responsabilidades:**
- Análises com IA
- Agentes especializados
- Document sharding para análises profundas

**Providers:**
- `DocumentShardingService` - Divisão de documentos para análise
- `MultiAgentAnalysisService` - Orquestração de múltiplos agentes
- `FundamentalAnalystAgent` - Análise fundamental com IA
- `TechnicalAnalystAgent` - Análise técnica com IA
- `SentimentAnalystAgent` - Análise de sentimento
- `RiskAnalystAgent` - Análise de risco
- `MacroAnalystAgent` - Análise macroeconômica

---

### 11. **CommonModule**
**Arquivo:** `src/common/common.module.ts`

**Responsabilidades:**
- Serviços compartilhados
- Cache com Redis
- Notificações

**Providers:**
- `CacheService` - Cache com Redis
- `NotificationsService` - Sistema de notificações

**Global:** Sim (disponível em toda aplicação)

---

### 12. **DatabaseModule**
**Arquivo:** `src/database/database.module.ts`

**Responsabilidades:**
- Configuração de banco de dados
- Tipos e enums

---

### 13. **ValidatorsModule**
**Responsabilidades:**
- Validadores customizados
- Lógica de validação reutilizável

---

### 14. **WebSocketModule**
**Arquivo:** `src/websocket/websocket.module.ts`

**Responsabilidades:**
- Real-time updates via WebSocket
- Broadcast de eventos
- Gerenciamento de subscriptions

**Providers:**
- `AppWebSocketGateway`

---

## CONTROLLERS E ENDPOINTS

**Total de Endpoints:** 29

### 1. **AuthController** (`/api/v1/auth`)
**Arquivo:** `src/api/auth/auth.controller.ts`

| Método | Rota | Autenticação | DTO | Descrição |
|--------|------|--------------|-----|-----------|
| POST | `/register` | Não | RegisterDto | Registrar novo usuário |
| POST | `/login` | Não | LoginDto | Login com email/senha |
| GET | `/google` | Google OAuth | - | Iniciar fluxo Google OAuth |
| GET | `/google/callback` | Google OAuth | - | Callback do Google OAuth |
| GET | `/me` | JwtAuthGuard | - | Obter perfil do usuário atual |

**DTOs:**
```typescript
RegisterDto {
  @IsEmail() email: string
  @MinLength(8) password: string
  @IsOptional() firstName?: string
  @IsOptional() lastName?: string
}

LoginDto {
  @IsEmail() email: string
  @MinLength(8) password: string
}
```

---

### 2. **AssetsController** (`/api/v1/assets`)
**Arquivo:** `src/api/assets/assets.controller.ts`

| Método | Rota | Autenticação | Parâmetros | Descrição |
|--------|------|--------------|-----------|-----------|
| GET | `/` | Não | `?type=stock` | Listar todos os ativos |
| GET | `/:ticker` | Não | - | Obter ativo por ticker |
| GET | `/:ticker/price-history` | Não | `?startDate=...&endDate=...` | Histórico de preços |
| POST | `/:ticker/sync` | JwtAuthGuard | - | Sincronizar dados do ativo |

**Query Params:**
- `type` - Filtrar por tipo (stock, fii, etf, bdr, option, future, crypto, fixed_income)
- `startDate` - Data inicial (formato ISO)
- `endDate` - Data final (formato ISO)

**Response Sample:**
```json
{
  "id": "uuid",
  "ticker": "PETR4",
  "name": "Petróleo Brasileiro",
  "type": "stock",
  "price": 28.50,
  "change": 0.50,
  "changePercent": 1.79,
  "volume": 150000000,
  "marketCap": 1500000000
}
```

---

### 3. **PortfolioController** (`/api/v1/portfolio`)
**Arquivo:** `src/api/portfolio/portfolio.controller.ts`

**Guard:** JwtAuthGuard (global para todos endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar portfólios do usuário |
| GET | `/:id` | Obter portfólio específico |
| POST | `/` | Criar novo portfólio |
| PATCH | `/:id` | Atualizar portfólio |
| DELETE | `/:id` | Deletar portfólio |
| POST | `/:portfolioId/positions` | Adicionar posição |
| PATCH | `/:portfolioId/positions/:positionId` | Atualizar posição |
| DELETE | `/:portfolioId/positions/:positionId` | Deletar posição |
| POST | `/import` | Importar portfólio de arquivo |

**DTOs:**
```typescript
CreatePortfolioDto {
  @IsString() name: string
  @IsOptional() description?: string
}

UpdatePortfolioDto extends PartialType(CreatePortfolioDto)

AddPositionDto {
  @IsString() ticker: string
  @IsPositive() quantity: number
  @IsPositive() averagePrice: number
}

UpdatePositionDto extends PartialType(AddPositionDto)
```

---

### 4. **AnalysisController** (`/api/v1/analysis`)
**Arquivo:** `src/api/analysis/analysis.controller.ts`

**Guard:** JwtAuthGuard (global para todos endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/:ticker/fundamental` | Gerar análise fundamental |
| POST | `/:ticker/technical` | Gerar análise técnica |
| POST | `/:ticker/complete` | Gerar análise completa com IA |
| GET | `/:ticker` | Listar análises para ticker |
| GET | `/:id/details` | Obter detalhes da análise |

**Query Params:**
- `type` - Filtrar por tipo de análise

---

### 5. **ReportsController** (`/api/v1/reports`)
**Arquivo:** `src/api/reports/reports.controller.ts`

**Guard:** JwtAuthGuard (global para todos endpoints)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar relatórios (análises completas) |
| GET | `/:id` | Obter relatório específico |
| POST | `/generate` | Gerar novo relatório |
| GET | `/:id/download` | Baixar relatório (JSON/HTML/PDF) |

**DTOs:**
```typescript
GenerateReportDto {
  @IsString()
  @IsUppercase()
  @Matches(/^[A-Z]{4}[0-9]{1,2}$/)
  ticker: string
}
```

**Query Params (download):**
- `format` - json | html | pdf (default: json)

---

### 6. **DataSourcesController** (`/api/v1/data-sources`)
**Arquivo:** `src/api/data-sources/data-sources.controller.ts`

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/` | Não | Listar todas as fontes de dados |
| GET | `/status` | Não | Obter status das fontes |

---

## SERVICES

### Camada API

#### 1. **AuthService**
**Arquivo:** `src/api/auth/auth.service.ts`

**Métodos Principais:**
- `register(registerDto)` - Registrar novo usuário
- `login(loginDto)` - Autenticar usuário
- `googleLogin(googleProfile)` - Autenticar via Google OAuth
- `validateUser(email, password)` - Validar credenciais
- `generateJWT(user)` - Gerar token JWT

---

#### 2. **AssetsService**
**Arquivo:** `src/api/assets/assets.service.ts`

**Métodos Principais:**
- `findAll(type?)` - Buscar ativos com preço mais recente
- `findByTicker(ticker)` - Buscar ativo específico
- `getPriceHistory(ticker, startDate, endDate)` - Histórico de preços
- `syncAsset(ticker)` - Sincronizar dados do ativo
- `create(assetData)` - Criar novo ativo
- `update(ticker, assetData)` - Atualizar ativo

**Query Optimization:**
- Usa LEFT JOIN com subqueries para buscar últimas 2 cotações
- Calcula variações de preço em tempo real
- Filtra por tipo de ativo eficientemente

---

#### 3. **PortfolioService**
**Arquivo:** `src/api/portfolio/portfolio.service.ts`

**Métodos Principais:**
- `findUserPortfolios(userId)` - Listar portfólios do usuário
- `findOne(id, userId)` - Obter portfólio específico
- `create(userId, data)` - Criar portfólio
- `update(id, userId, data)` - Atualizar portfólio
- `remove(id, userId)` - Deletar portfólio
- `addPosition(portfolioId, userId, data)` - Adicionar posição
- `updatePosition(portfolioId, positionId, userId, data)` - Atualizar posição
- `removePosition(portfolioId, positionId, userId)` - Deletar posição
- `importFromFile(userId, buffer, filename)` - Importar de arquivo

**Parsers Suportados:**
- B3Parser - Arquivos da B3
- KinvoParser - Arquivos Kinvo

**Otimizações:**
- Usa transações TypeORM para operações atômicas
- Batch insert para múltiplas posições
- Lazy loading de relacionamentos

---

#### 4. **AnalysisService**
**Arquivo:** `src/api/analysis/analysis.service.ts`

**Métodos Principais:**
- `generateFundamentalAnalysis(ticker)` - Análise fundamental
- `generateTechnicalAnalysis(ticker)` - Análise técnica
- `generateCompleteAnalysis(ticker, userId)` - Análise completa (TODO)
- `findAll(userId, params?)` - Listar análises
- `findByTicker(ticker, type?)` - Análises por ticker
- `findById(id)` - Obter análise específica

**Indicadores Técnicos:**
- RSI (Relative Strength Index) - 14 períodos
- SMA (Simple Moving Average) - 20, 50, 200 períodos
- EMA (Exponential Moving Average) - 12, 26 períodos
- MACD (Moving Average Convergence Divergence)
- Variações de preço (1d, 5d, 20d)

**Recomendações:**
- STRONG_BUY | BUY | HOLD | SELL | STRONG_SELL
- Baseado em score de indicadores
- Confidence score (0.0 - 1.0)

---

#### 5. **ReportsService**
**Arquivo:** `src/api/reports/reports.service.ts`

**Responsabilidades:**
- Gerenciar relatórios
- Integração com análises

---

#### 6. **DataSourcesService**
**Arquivo:** `src/api/data-sources/data-sources.service.ts`

**Métodos Principais:**
- `findAll()` - Listar todas as fontes
- `getStatus()` - Status das fontes

**Tipos de Fontes:**
- FUNDAMENTAL
- TECHNICAL
- NEWS
- OPTIONS
- MACRO
- INSIDER
- REPORT
- AI
- GENERAL

---

### Camada de Analysis

#### 1. **TechnicalAnalysisService**
**Arquivo:** `src/analysis/technical/technical-analysis.service.ts`

---

#### 2. **TechnicalIndicatorsService**
**Arquivo:** `src/analysis/technical/technical-indicators.service.ts`

---

#### 3. **SentimentAnalysisService**
**Arquivo:** `src/analysis/sentiment/sentiment-analysis.service.ts`

---

### Camada de Queue e Jobs

#### 1. **ScheduledJobsService**
**Arquivo:** `src/queue/jobs/scheduled-jobs.service.ts`

**CRON Jobs:**

| Schedule | Job | Descrição |
|----------|-----|-----------|
| `9 PM diariamente` | `updateFundamentalData()` | Atualiza dados fundamentais dos top 50 ativos |
| `6 PM diariamente` | `updateOptionsData()` | Atualiza dados de opções dos top 20 ativos |
| `Domingo 3 AM (semanal)` | `cleanOldData()` | Limpa dados com mais de 90 dias |
| `*/15 9-18 1-5` | `updatePriceData()` | Atualiza preços a cada 15 min (dias úteis, 9-18h) |

**Métodos:**
- `updateFundamentalData()` - Scraping agendado de análise fundamental
- `updateOptionsData()` - Scraping agendado de opções
- `cleanOldData()` - Limpeza de dados antigos
- `updatePriceData()` - Atualização de preços
- `triggerImmediateScraping(ticker, type)` - Trigger manual

---

#### 2. **ScrapingProcessor**
**Arquivo:** `src/queue/processors/scraping.processor.ts`

**Job Handlers:**
- `@Process('fundamental')` - Scraping de dados fundamentais
- `@Process('options')` - Scraping de dados de opções
- `@Process('bulk-scraping')` - Scraping em bulk

**Listeners:**
- `@OnQueueActive()` - Quando job inicia
- `@OnQueueCompleted()` - Quando job termina
- `@OnQueueFailed()` - Quando job falha

---

### Camada de IA

#### 1. **AIService**
**Arquivo:** `src/ai/ai.service.ts`

---

#### 2. **MultiAgentAnalysisService**
**Arquivo:** `src/ai/services/multi-agent-analysis.service.ts`

**Responsabilidade:**
- Orquestrar múltiplos agentes de IA
- Consolidar análises de diferentes perspectivas

---

#### 3. **DocumentShardingService**
**Arquivo:** `src/ai/services/document-sharding.service.ts`

**Responsabilidade:**
- Dividir documentos grandes para análise
- Garantir contexto em análises profundas

---

### Agentes de IA

1. **FundamentalAnalystAgent** - Análise fundamental com IA
2. **TechnicalAnalystAgent** - Análise técnica com IA
3. **SentimentAnalystAgent** - Análise de sentimento
4. **RiskAnalystAgent** - Análise de risco
5. **MacroAnalystAgent** - Análise macroeconômica

---

### Camada de Reports

#### 1. **ReportTemplateService**
**Arquivo:** `src/api/reports/services/report-template.service.ts`

**Métodos:**
- `generateHtmlReport(analysis)` - Gerar HTML do relatório

---

#### 2. **PdfGeneratorService**
**Arquivo:** `src/api/reports/services/pdf-generator.service.ts`

**Métodos:**
- `generatePdf(html)` - Converter HTML para PDF

---

#### 3. **AIReportService**
**Arquivo:** `src/api/reports/ai-report.service.ts`

**Responsabilidade:**
- Gerar relatórios enriquecidos com IA

---

### Camada de Scrapers

#### 1. **ScrapersService** (Orquestrador)
**Arquivo:** `src/api/scrapers/scrapers.service.ts`

**Métodos Principais:**
- `scrapeFundamentalData(ticker)` - Scraping multi-fonte de análise fundamental
- `scrapeOptionsData(ticker)` - Scraping de dados de opções
- `scrapeNews(ticker)` - Scraping de notícias

---

#### 2. **AbstractScraper** (Classe Base)
**Arquivo:** `src/scrapers/base/abstract-scraper.ts`

**Responsabilidades:**
- Template pattern para scrapers
- Gerenciamento de browser Puppeteer
- Retry com exponential backoff
- Timeout e validação

**Métodos:**
- `initialize()` - Inicializar browser
- `cleanup()` - Fechar browser
- `scrape(ticker)` - Executar scraping
- `login()` - Autenticar (override)
- `scrapeData(ticker)` - Scraping customizado (abstract)
- `validate(data)` - Validar dados
- `retry(fn, retries)` - Retry com backoff

---

#### 3. Scrapers Implementados

**Fundamental Data:**
- `BrapiScraper` - Brapi API
- `FundamentusScraper` - Fundamentus
- `Investidor10Scraper` - Investidor10
- `StatusinvestScraper` - StatusInvest

**News:**
- `GoogleNewsScraper` - Google News
- `ValorScraper` - Valor Econômico

**Options:**
- `OpcoesScraper` - Dados de opções

---

### Camada de Cache

#### 1. **CacheService**
**Arquivo:** `src/common/services/cache.service.ts`

**Responsabilidade:**
- Cache com Redis
- TTL configurável

---

### Camada de Notificações

#### 1. **NotificationsService**
**Arquivo:** `src/common/services/notifications.service.ts`

---

## ENTITIES E DATABASE

### Database
- **Type:** PostgreSQL
- **Host:** Configurável via .env
- **Synchronize:** false (usar migrações)

### Entities (10 total)

#### 1. **User** 
**Arquivo:** `src/database/entities/user.entity.ts`

```typescript
@Entity('users')
User {
  id: UUID (PK)
  email: string (UNIQUE)
  password: string (nullable, para OAuth)
  googleId: string (nullable)
  firstName: string (nullable)
  lastName: string (nullable)
  avatar: string (nullable)
  isActive: boolean (default: true)
  isEmailVerified: boolean (default: false)
  preferences: JSONB (nullable)
  notifications: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
  lastLogin: timestamp (nullable)
  
  OneToMany: portfolios
}
```

---

#### 2. **Asset**
**Arquivo:** `src/database/entities/asset.entity.ts`

```typescript
@Entity('assets')
@Index(['ticker'])
@Index(['type'])
@Index(['sector'])
Asset {
  id: UUID (PK)
  ticker: string (UNIQUE)
  name: string
  type: enum[stock|fii|etf|bdr|option|future|crypto|fixed_income]
  sector: string (nullable)
  subsector: string (nullable)
  segment: string (nullable)
  cnpj: string (nullable)
  website: string (nullable)
  description: text (nullable)
  logoUrl: string (nullable)
  isActive: boolean (default: true)
  listingDate: date (nullable)
  metadata: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
  
  OneToMany: prices, fundamentalData
}
```

**Tipos de Ativos:**
- STOCK - Ações
- FII - Fundo Imobiliário
- ETF - Fundo de Índice
- BDR - Brazilian Depositary Receipt
- OPTION - Opções
- FUTURE - Futuros
- CRYPTO - Criptomoedas
- FIXED_INCOME - Renda Fixa

---

#### 3. **AssetPrice**
**Arquivo:** `src/database/entities/asset-price.entity.ts`

```typescript
@Entity('asset_prices')
@Index(['asset', 'date'])
@Index(['date'])
AssetPrice {
  id: UUID (PK)
  assetId: UUID (FK -> Asset)
  date: date
  open: decimal(18,2)
  high: decimal(18,2)
  low: decimal(18,2)
  close: decimal(18,2)
  adjustedClose: decimal(18,2) (nullable)
  volume: bigint
  marketCap: decimal(18,2) (nullable)
  numberOfTrades: int (nullable)
  metadata: JSONB (nullable)
  createdAt: timestamp
  
  ManyToOne: asset
}
```

---

#### 4. **FundamentalData**
**Arquivo:** `src/database/entities/fundamental-data.entity.ts`

```typescript
@Entity('fundamental_data')
@Index(['asset', 'referenceDate'])
FundamentalData {
  id: UUID (PK)
  assetId: UUID (FK -> Asset)
  referenceDate: date
  
  // Valuation Indicators
  pl: decimal (P/L - Price/Earnings)
  pvp: decimal (P/VP - Price/Book)
  psr: decimal (P/SR - Price/Sales)
  pAtivos: decimal (P/Assets)
  pCapitalGiro: decimal (P/Working Capital)
  pEbit: decimal (P/EBIT)
  evEbit: decimal (EV/EBIT)
  evEbitda: decimal (EV/EBITDA)
  pegRatio: decimal (PEG Ratio)
  
  // Debt Indicators
  dividaLiquidaPatrimonio: decimal
  dividaLiquidaEbitda: decimal
  dividaLiquidaEbit: decimal
  patrimonioLiquidoAtivos: decimal
  passivosAtivos: decimal
  
  // Efficiency Indicators
  margemBruta: decimal
  margemEbit: decimal
  margemEbitda: decimal
  margemLiquida: decimal
  roe: decimal (Return on Equity)
  roa: decimal (Return on Assets)
  roic: decimal (Return on Invested Capital)
  giroAtivos: decimal
  
  // Growth Indicators
  cagrReceitas5anos: decimal (5-year revenue CAGR)
  cagrLucros5anos: decimal (5-year earnings CAGR)
  
  // Dividend Indicators
  dividendYield: decimal
  payout: decimal
  
  // Financial Statements (millions)
  receitaLiquida: decimal (Revenue)
  ebit: decimal
  ebitda: decimal
  lucroLiquido: decimal (Net Income)
  patrimonioLiquido: decimal (Equity)
  ativoTotal: decimal (Total Assets)
  dividaBruta: decimal (Gross Debt)
  dividaLiquida: decimal (Net Debt)
  disponibilidades: decimal
  
  metadata: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
  
  ManyToOne: asset
}
```

---

#### 5. **Portfolio**
**Arquivo:** `src/database/entities/portfolio.entity.ts`

```typescript
@Entity('portfolios')
@Index(['user'])
Portfolio {
  id: UUID (PK)
  userId: UUID (FK -> User)
  name: string
  description: text (nullable)
  isActive: boolean (default: true)
  totalInvested: decimal(18,2) (default: 0)
  currentValue: decimal(18,2) (default: 0)
  profit: decimal(18,2)
  profitPercentage: decimal(10,4)
  settings: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
  
  ManyToOne: user
  OneToMany: positions
}
```

---

#### 6. **PortfolioPosition**
**Arquivo:** `src/database/entities/portfolio-position.entity.ts`

```typescript
@Entity('portfolio_positions')
@Index(['portfolio'])
@Index(['asset'])
PortfolioPosition {
  id: UUID (PK)
  portfolioId: UUID (FK -> Portfolio)
  assetId: UUID (FK -> Asset)
  quantity: decimal(18,8)
  averagePrice: decimal(18,2)
  currentPrice: decimal(18,2) (nullable)
  totalInvested: decimal(18,2)
  currentValue: decimal(18,2) (nullable)
  profit: decimal(18,2) (nullable)
  profitPercentage: decimal(10,4) (nullable)
  firstBuyDate: date (nullable)
  lastUpdateDate: date (nullable)
  notes: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
  
  ManyToOne: portfolio, asset
}
```

---

#### 7. **Analysis**
**Arquivo:** `src/database/entities/analysis.entity.ts`

```typescript
@Entity('analyses')
@Index(['asset', 'type'])
@Index(['user'])
@Index(['status'])
@Index(['createdAt'])
Analysis {
  id: UUID (PK)
  assetId: UUID (FK -> Asset)
  userId: UUID (FK -> User, nullable)
  type: enum[fundamental|technical|macro|sentiment|correlation|options|risk|complete]
  status: enum[pending|processing|completed|failed]
  recommendation: enum[strong_buy|buy|hold|sell|strong_sell] (nullable)
  confidenceScore: decimal(3,2) (0.0-1.0, nullable)
  summary: text (nullable)
  analysis: JSONB (detailed analysis)
  indicators: JSONB (technical/fundamental indicators)
  risks: JSONB (risk analysis)
  targetPrices: JSONB (low, medium, high)
  dataSources: string[] (source IDs)
  sourcesCount: int
  aiProvider: string (openai|anthropic|etc)
  errorMessage: text (nullable)
  processingTime: int (milliseconds, nullable)
  metadata: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
  completedAt: timestamp (nullable)
  
  ManyToOne: asset, user
}
```

**AnalysisType:**
- FUNDAMENTAL - Análise Fundamental
- TECHNICAL - Análise Técnica
- MACRO - Análise Macroeconômica
- SENTIMENT - Análise de Sentimento
- CORRELATION - Correlação
- OPTIONS - Análise de Opções
- RISK - Análise de Risco
- COMPLETE - Análise Completa

**Recommendation:**
- STRONG_BUY
- BUY
- HOLD
- SELL
- STRONG_SELL

---

#### 8. **DataSource**
**Arquivo:** `src/database/entities/data-source.entity.ts`

```typescript
@Entity('data_sources')
@Index(['type'])
@Index(['status'])
DataSource {
  id: UUID (PK)
  name: string
  code: string (UNIQUE) // 'fundamentei', 'investidor10', etc
  url: string
  type: enum[fundamental|technical|news|options|macro|insider|report|ai|general]
  status: enum[active|inactive|maintenance|error]
  description: text (nullable)
  requiresLogin: boolean (default: false)
  loginType: string (nullable) // 'google', 'credentials', 'token'
  isVerified: boolean (default: false)
  isTrusted: boolean (default: false)
  reliabilityScore: decimal(3,2) // 0.0-1.0
  lastSuccessAt: timestamp (nullable)
  lastErrorAt: timestamp (nullable)
  errorCount: int
  successCount: int
  averageResponseTime: int (milliseconds, nullable)
  config: JSONB (nullable)
  metadata: JSONB (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

#### 9. **ScrapedData**
**Arquivo:** `src/database/entities/scraped-data.entity.ts`

```typescript
@Entity('scraped_data')
@Index(['asset', 'dataSource', 'dataType', 'scrapedAt'])
@Index(['dataSource'])
@Index(['scrapedAt'])
ScrapedData {
  id: UUID (PK)
  assetId: UUID (FK -> Asset)
  dataSourceId: UUID (FK -> DataSource)
  dataType: string // 'price', 'fundamental', 'news', 'dividend'
  data: JSONB (scraped data)
  referenceDate: date (nullable)
  scrapedAt: timestamp
  responseTime: int (milliseconds, nullable)
  isValid: boolean (default: true)
  validationErrors: text (nullable)
  metadata: JSONB (nullable)
  createdAt: timestamp
  
  ManyToOne: asset, dataSource
}
```

---

#### 10. **ScrapedData**
Já descrito acima.

---

### Relacionamentos

```
User (1) ──────→ (N) Portfolio
                   ↓
                (1) ──────→ (N) PortfolioPosition
                                 ↓
                            Asset

Asset (1) ──────→ (N) AssetPrice
Asset (1) ──────→ (N) FundamentalData
Asset (1) ──────→ (N) Analysis
Asset (1) ──────→ (N) ScrapedData

DataSource (1) ──────→ (N) ScrapedData
```

---

## DTOs E VALIDAÇÃO

### Auth DTOs

#### RegisterDto
```typescript
export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100, { message: 'Senha deve ter no máximo 100 caracteres' })
  password: string

  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  @MaxLength(100)
  firstName?: string

  @IsString({ message: 'Sobrenome deve ser uma string' })
  @IsOptional()
  @MaxLength(100)
  lastName?: string
}
```

#### LoginDto
```typescript
export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password: string
}
```

---

### Portfolio DTOs

#### CreatePortfolioDto
```typescript
export class CreatePortfolioDto {
  @ApiProperty({ description: 'Nome do portfólio', example: 'Meu Portfólio Principal' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Descrição do portfólio' })
  @IsString()
  @IsOptional()
  description?: string
}
```

#### UpdatePortfolioDto
```typescript
export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {}
```

#### AddPositionDto
```typescript
export class AddPositionDto {
  @ApiProperty({ description: 'Ticker (ex: PETR4)', example: 'PETR4' })
  @IsString()
  ticker: string

  @ApiProperty({ description: 'Quantidade de ações', example: 100, minimum: 1 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number

  @ApiProperty({ description: 'Preço médio de compra', example: 28.50, minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  averagePrice: number
}
```

#### UpdatePositionDto
```typescript
export class UpdatePositionDto extends PartialType(AddPositionDto) {}
```

---

### Reports DTOs

#### GenerateReportDto
```typescript
export class GenerateReportDto {
  @ApiProperty({
    description: 'Ticker do ativo para gerar relatório',
    example: 'PETR4',
    pattern: '^[A-Z]{4}[0-9]{1,2}$'
  })
  @IsString()
  @IsUppercase()
  @Matches(/^[A-Z]{4}[0-9]{1,2}$/, {
    message: 'Ticker deve estar no formato válido da B3 (ex: PETR4, VALE3)'
  })
  ticker: string
}
```

---

### Validação Global

**Arquivo:** `src/main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Remove fields não definidos em DTOs
    transform: true,            // Transforma tipos automaticamente
    forbidNonWhitelisted: true, // Rejeita fields desconhecidos
    transformOptions: {
      enableImplicitConversion: true
    }
  })
)
```

---

## JOBS, SCHEDULERS E BACKGROUND TASKS

### Scheduled Jobs Service
**Arquivo:** `src/queue/jobs/scheduled-jobs.service.ts`

| Schedule | Job | Ticker Count | Retry | Descrição |
|----------|-----|--------------|-------|-----------|
| `@Cron('0 21 * * *')` | `updateFundamentalData()` | 50 (top stocks) | 3x exponential | Atualiza análise fundamental diária |
| `@Cron('0 18 * * *')` | `updateOptionsData()` | 20 (top options) | 3x exponential | Atualiza dados de opções |
| `@Cron('0 3 * * 0')` | `cleanOldData()` | - | - | Limpa dados com >90 dias |
| `@Cron('*/15 9-18 * * 1-5')` | `updatePriceData()` | 100 | - | Atualiza preços a cada 15 min |

### Job Details

#### 1. updateFundamentalData()
- **Trigger:** 21:00 (9 PM) diariamente
- **Queue:** `scraping`
- **Job Type:** `bulk-scraping`
- **Assets:** Top 50 ações (AssetType.STOCK)
- **Retry:** 3 tentativas com backoff exponencial
- **Backoff Delay:** 5 segundos

#### 2. updateOptionsData()
- **Trigger:** 18:00 (6 PM) diariamente
- **Queue:** `scraping`
- **Job Type:** `options`
- **Assets:** Top 20 ações com opções
- **Retry:** 3 tentativas

#### 3. cleanOldData()
- **Trigger:** Semanal (Domingo 3 AM)
- **Queue:** N/A (Job local)
- **Descrição:** Implementação pendente
- **Target:** Dados com > 90 dias

#### 4. updatePriceData()
- **Trigger:** A cada 15 minutos (9 AM - 6 PM, seg-sex)
- **Queue:** `scraping`
- **Assets:** Top 100 ativos
- **Descrição:** Implementação pendente

### Manual Trigger
```typescript
await scheduledJobsService.triggerImmediateScraping(ticker, 'fundamental')
```

---

## WEBSOCKET GATEWAY

**Arquivo:** `src/websocket/websocket.gateway.ts`

### Gateway Setup
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
  }
})
```

---

### Events e Rooms

#### Subscription Events

**Event:** `subscribe`
```typescript
// Client emits
socket.emit('subscribe', {
  tickers: ['PETR4', 'VALE3'],
  types: ['prices', 'analysis', 'reports', 'portfolio']
})

// Server joins rooms
// Rooms: PETR4:prices, PETR4:analysis, PETR4:reports, VALE3:prices, etc
```

**Event:** `unsubscribe`
```typescript
socket.emit('unsubscribe', {
  tickers?: ['PETR4'],
  types?: ['analysis']
})
```

---

#### Broadcast Events

| Event | Room Pattern | Payload | Descrição |
|-------|--------------|---------|-----------|
| `price_update` | `{ticker}:prices` | `{ticker, data, timestamp}` | Atualização de preço |
| `analysis_complete` | `{ticker}:analysis` | `{ticker, analysisId, type, timestamp}` | Análise concluída |
| `report_ready` | `{ticker}:reports` | `{ticker, reportId, timestamp}` | Relatório pronto |
| `portfolio_update` | `{userId}:portfolio` | `{userId, portfolioId, data, timestamp}` | Portfólio atualizado |
| `market_status` | broadcast | `{status, timestamp}` | Status do mercado |

---

### Methods

```typescript
emitPriceUpdate(ticker: string, data: any)
emitAnalysisComplete(ticker: string, analysisId: string, type: string)
emitReportReady(ticker: string, reportId: string)
emitPortfolioUpdate(userId: string, portfolioId: string, data: any)
emitMarketStatus(status: 'open'|'closed'|'pre_open'|'post_close')
broadcastMessage(event: string, data: any)
```

---

### Cleanup

- **Periodic Cleanup:** A cada 5 minutos
- **Cleanup Trigger:** Ao primeiro cliente conectar
- **Cleanup Stop:** Quando último cliente desconecta
- **Purpose:** Remover subscrições órfãs de clientes desconectados
- **Memory Management:** Libera rooms ao desconectar

---

## INTEGRAÇÕES EXTERNAS

### 1. Scrapers

#### Fundamental Data Scrapers
1. **Brapi** (API)
   - Status: Implementado
   - Requer: API Key (opcional)
   - Dados: P/L, P/VP, Dividend Yield

2. **Fundamentus**
   - Status: Implementado
   - Dados: Valuation Indicators

3. **Investidor10**
   - Status: Implementado
   - Requer: Login (opcional)
   - Dados: Análise Fundamental

4. **StatusInvest**
   - Status: Implementado
   - Dados: Indicadores Técnicos

#### News Scrapers
1. **Google News**
   - Status: Implementado
   - Dados: Notícias de mercado

2. **Valor Econômico**
   - Status: Implementado
   - Dados: Notícias financeiras

#### Options Scrapers
1. **Opcões.com**
   - Status: Implementado
   - Dados: Preços de opções

---

### 2. APIs Externas

#### OpenAI
**Configuração:** `.env`
- `OPENAI_API_KEY` - Chave de API
- **Uso:** Análises com IA (AgentPool)
- **Provider:** openai (em análises)

#### Google OAuth
**Configuração:** `.env`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- **Status:** Condicional (opcional)

---

### 3. Databases

#### PostgreSQL
- **Host:** Configurável
- **Port:** 5432 (default)
- **Database:** invest_db
- **Entities:** 10
- **Migrations:** Manual

#### Redis
- **Host:** Configurável
- **Port:** 6379 (default)
- **Uso:** Cache, Queue, Notifications
- **Password:** Opcional

---

### 4. Telegram Bot (Opcional)
**Configuração:** `.env`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- **Uso:** Notificações

---

## CONFIGURAÇÕES

### Environment Variables

**Arquivo:** `.env.example`

#### Server
```env
NODE_ENV=development
APP_PORT=3101
PORT=3101
```

#### Database PostgreSQL
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db
DB_SYNCHRONIZE=false
DB_LOGGING=true
```

#### Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### JWT
```env
JWT_SECRET=change_this_in_production_min_32_chars_super_secret_key_2024
JWT_EXPIRATION=7d
```

#### Google OAuth
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3101/api/auth/google/callback
```

#### OpenAI
```env
OPENAI_API_KEY=
```

#### Telegram
```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

#### Scrapers
```env
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENT_JOBS=3
SCRAPER_RETRY_ATTEMPTS=3
SCRAPER_TIMEOUT=30000
```

#### Cache
```env
CACHE_TTL=300
```

#### Queue
```env
QUEUE_REDIS_HOST=localhost
QUEUE_REDIS_PORT=6379
```

#### Logs
```env
LOG_LEVEL=debug
```

#### CORS
```env
CORS_ORIGIN=http://localhost:3100,http://localhost:3000
```

#### Rate Limiting
```env
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

### Package.json Scripts

```json
{
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "migration:generate": "npm run typeorm -- migration:generate -d src/database/data-source.ts",
  "migration:create": "npm run typeorm -- migration:create",
  "migration:run": "npm run typeorm -- migration:run -d src/database/data-source.ts",
  "migration:revert": "npm run typeorm -- migration:revert -d src/database/data-source.ts",
  "seed": "ts-node src/database/seeds/seed.ts"
}
```

---

### TypeScript Configuration

**Arquivo:** `tsconfig.json`

- **Target:** ES2021
- **Module:** CommonJS
- **Output:** ./dist
- **Path Aliases:**
  - `@/*` → `src/*`
  - `@api/*` → `src/api/*`
  - `@services/*` → `src/services/*`
  - `@scrapers/*` → `src/scrapers/*`
  - `@validators/*` → `src/validators/*`
  - `@ai/*` → `src/ai/*`
  - `@analysis/*` → `src/analysis/*`
  - `@database/*` → `src/database/*`
  - `@queue/*` → `src/queue/*`
  - `@common/*` → `src/common/*`

---

### NestJS Configuration

**Arquivo:** `nest-cli.json`

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

---

## PROBLEMAS IDENTIFICADOS

### 1. **Análise Completa não Implementada** ⚠️
- **Arquivo:** `src/api/analysis/analysis.service.ts:323`
- **Método:** `generateCompleteAnalysis()`
- **Status:** TODO
- **Descrição:** Método retorna mock de response
- **Impacto:** Relatórios não geram análises completas com IA
- **Solução Necessária:** Implementar integração com MultiAgentAnalysisService

---

### 2. **Sincronização de Assets não Implementada** ⚠️
- **Arquivo:** `src/api/assets/assets.service.ts:171`
- **Método:** `syncAsset()`
- **Status:** TODO
- **Descrição:** Apenas retorna status "pending"
- **Impacto:** Sincronização manual de ativos não funciona
- **Solução Necessária:** Integrar com ScrapersService e Queue

---

### 3. **Cleanup de Dados Antigos não Implementado** ⚠️
- **Arquivo:** `src/queue/jobs/scheduled-jobs.service.ts:97`
- **Método:** `cleanOldData()`
- **Status:** TODO
- **Descrição:** CRON registrada mas sem implementação
- **Impacto:** Dados não são limpos automaticamente (crescimento de BD)
- **Solução Necessária:** Implementar deleção de dados com >90 dias

---

### 4. **Atualização de Preços Agendada não Implementada** ⚠️
- **Arquivo:** `src/queue/jobs/scheduled-jobs.service.ts:119`
- **Método:** `updatePriceData()`
- **Status:** TODO
- **Descrição:** CRON registrada mas sem implementação
- **Impacto:** Preços não são atualizados em tempo real
- **Solução Necessária:** Implementar job de atualização de preços

---

### 5. **Upload de Arquivo para Import não Implementado** ⚠️
- **Arquivo:** `src/api/portfolio/portfolio.controller.ts:82`
- **Método:** `importPortfolio()`
- **Status:** TODO
- **Descrição:** Comentário indica necessidade de multer para upload
- **Impacto:** Import de portfólio via arquivo não funciona
- **Solução Necessária:** Implementar middleware multer e parsing de arquivo

---

### 6. **Indicadores Técnicos Incompletos** ⚠️
- **Arquivo:** `src/api/analysis/analysis.service.ts`
- **Indicadores Faltantes:**
  - Bollinger Bands
  - Stochastic Oscillator
  - ATR (Average True Range)
  - Ichimoku Cloud
  - ADX (Average Directional Index)
- **Impacto:** Análise técnica limitada
- **Solução Necessária:** Adicionar mais indicadores

---

### 7. **Validação de Contexto Parcial** ⚠️
- **Arquivo:** `src/common/services/validators.service.ts`
- **Status:** Module criado mas serviços não implementados
- **Impacto:** Validações customizadas podem estar faltando
- **Solução Necessária:** Implementar validadores específicos

---

### 8. **Cobertura de Testes Baixa** ⚠️
- **Status:** Não há testes visíveis no repositório
- **Impacto:** Risco de regressões
- **Solução Necessária:** Implementar suite de testes unitários e E2E

---

### 9. **Documentação de Scrapers Incompleta** ⚠️
- **Arquivos:** `src/scrapers/*/`
- **Status:** Scrapers implementados mas documentação mínima
- **Impacto:** Difícil manutenção
- **Solução Necessária:** Adicionar JSDoc e exemplos

---

### 10. **Rate Limiting Global Muito Permissivo** ⚠️
- **Configuração:** 100 requests por 60 segundos (global)
- **Endpoints Protegidos:** Alguns (auth) com limite específico
- **Impacto:** Possível abuso de API
- **Solução Necessária:** Revisar e refinir limites por endpoint

---

### 11. **Tratamento de Erros Inconsistente** ⚠️
- **Status:** Alguns endpoints retornam errors, outros não padronizam
- **Impacto:** Dificuldade para cliente processar erros
- **Solução Necessária:** Implementar GlobalExceptionFilter padronizado

---

### 12. **CORS permite múltiplas origens** ⚠️
- **Configuração:** Comma-separated list em .env
- **Problema:** Versão de exemplo permite localhost
- **Impacto:** Em produção, CORS pode não ser restritivo o suficiente
- **Solução Necessária:** Validar e testar CORS em produção

---

## RESUMO DE ARQUITETURA

### Tecnologias Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | NestJS 10.3.0 |
| Linguagem | TypeScript 5.3.3 |
| Database | PostgreSQL 14+ |
| Cache | Redis 5.3.2 |
| Queue | Bull 4.16.5 |
| ORM | TypeORM 0.3.19 |
| Auth | JWT + Passport |
| Real-time | Socket.io 4.6.1 |
| API Docs | Swagger/OpenAPI |
| Scraping | Puppeteer 23.11.1 |
| PDF | Puppeteer (headless) |
| Validation | class-validator 0.14.1 |
| Testing | Jest 29.7.0 |

---

### Padrões de Design Utilizados

1. **Module Pattern** - Separação em módulos organizados
2. **Service Injection** - Injeção de dependências via NestJS
3. **Repository Pattern** - Abstração de dados via TypeORM
4. **Gateway Pattern** - WebSocket gateway para real-time
5. **Queue Pattern** - Processamento assíncrono com Bull
6. **Decorator Pattern** - Custom decorators para validação
7. **Strategy Pattern** - Diferentes parsers para import
8. **Abstract Factory** - AbstractScraper para web scrapers
9. **Observer Pattern** - Listeners de queue (OnQueueActive, etc)
10. **Singleton Pattern** - Services como singletons

---

### Endpoints Summary

```
Authentication (5):
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  GET    /api/v1/auth/google
  GET    /api/v1/auth/google/callback
  GET    /api/v1/auth/me

Assets (4):
  GET    /api/v1/assets
  GET    /api/v1/assets/:ticker
  GET    /api/v1/assets/:ticker/price-history
  POST   /api/v1/assets/:ticker/sync

Portfolio (8):
  GET    /api/v1/portfolio
  GET    /api/v1/portfolio/:id
  POST   /api/v1/portfolio
  PATCH  /api/v1/portfolio/:id
  DELETE /api/v1/portfolio/:id
  POST   /api/v1/portfolio/:portfolioId/positions
  PATCH  /api/v1/portfolio/:portfolioId/positions/:positionId
  DELETE /api/v1/portfolio/:portfolioId/positions/:positionId
  POST   /api/v1/portfolio/import

Analysis (5):
  POST   /api/v1/analysis/:ticker/fundamental
  POST   /api/v1/analysis/:ticker/technical
  POST   /api/v1/analysis/:ticker/complete
  GET    /api/v1/analysis/:ticker
  GET    /api/v1/analysis/:id/details

Reports (4):
  GET    /api/v1/reports
  GET    /api/v1/reports/:id
  POST   /api/v1/reports/generate
  GET    /api/v1/reports/:id/download

Data Sources (2):
  GET    /api/v1/data-sources
  GET    /api/v1/data-sources/status

TOTAL: 29 endpoints
```

---

### Database Statistics

| Entidade | Índices | Relacionamentos | Campos |
|----------|---------|-----------------|--------|
| User | 0 | 1 OneToMany | 13 |
| Asset | 3 | 2 OneToMany | 13 |
| AssetPrice | 2 | 1 ManyToOne | 10 |
| FundamentalData | 1 | 1 ManyToOne | 59 |
| Portfolio | 1 | 2 Rel (1M, 1N) | 10 |
| PortfolioPosition | 2 | 2 ManyToOne | 13 |
| Analysis | 4 | 2 ManyToOne | 19 |
| DataSource | 2 | 1 OneToMany | 15 |
| ScrapedData | 3 | 2 ManyToOne | 12 |

**Total:** 10 entities, 19 índices, 144 campos

---

### File Statistics

```
Total TypeScript Files: 70+
Controllers:           6
Services:             20+
Entities:             10
DTOs:                  7
Modules:             14
Middlewares/Guards:    4
Scrapers:             8
Agents:               5
```

---

## CONCLUSÃO

A arquitetura do backend é **bem estruturada e escalável**, seguindo padrões de design NestJS. O sistema está preparado para:

✅ **Autenticação:** JWT + OAuth Google  
✅ **Gerenciamento de Ativos:** CRUD completo com histórico  
✅ **Portfólio:** Completo com import de arquivos  
✅ **Análises:** Técnica e Fundamental (Com IA parcial)  
✅ **Relatórios:** JSON, HTML, PDF  
✅ **Real-time:** WebSocket com subscriptions  
✅ **Background Jobs:** Bull queue com CRON  
✅ **Web Scraping:** Múltiplas fontes com Puppeteer  
✅ **Cache:** Redis integrado  
✅ **Rate Limiting:** Throttler global  

⚠️ **Pontos que Precisam de Atenção:**
- Implementar TODOs (Análise Completa, Cleanup, Upload)
- Adicionar mais indicadores técnicos
- Melhorar cobertura de testes
- Refinar tratamento de erros
- Adicionar mais documentação

