# MAPEAMENTO COMPLETO DE INTEGRAÇÕES E DEPENDÊNCIAS
## Plataforma de Análise de Investimentos B3 com IA

Data: 2025-11-08
Status: Análise COMPLETA

---

## 1. DIAGRAMA DE COMUNICAÇÃO Frontend ↔ Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                        │
│                    Port: 3100 / 3001                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ HTTP Calls (Axios)                                      │   │
│  │ - api.getAssets() → GET /assets                         │   │
│  │ - api.getAsset(ticker) → GET /assets/:ticker            │   │
│  │ - api.getAssetPrices() → GET /assets/:ticker/prices ❌  │   │
│  │ - api.getAssetFundamentals() → GET /assets/:ticker/...  │   │
│  │ - api.getPortfolios() → GET /portfolio                  │   │
│  │ - api.getPortfolio(id) → GET /portfolio/:id             │   │
│  │ - api.createPortfolio() → POST /portfolio               │   │
│  │ - api.requestAnalysis() → POST /analysis ❌             │   │
│  │ - api.getAnalysis() → GET /analysis/:ticker ❌          │   │
│  │ - api.listAnalyses() → GET /analysis ❌                 │   │
│  │ - api.getReports() → GET /reports                       │   │
│  │ - api.generateReport() → POST /reports/generate         │   │
│  │ - api.downloadReport() → GET /reports/:id/download      │   │
│  │ - api.login() → POST /auth/login                        │   │
│  │ - api.loginWithGoogle() → POST /auth/google             │   │
│  │ - api.getProfile() → GET /auth/profile ❌               │   │
│  │ - api.register() → POST /auth/register                  │   │
│  │ - api.getDataSources() → GET /data-sources              │   │
│  │ - api.testDataSource() → POST /data-sources/:id/test ❌ │   │
│  │ - api.triggerScraping() → POST /data-sources/scrape ❌  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ WebSocket Events (Socket.io)                            │   │
│  │ Port: 3002 / 3101                                       │   │
│  │                                                         │   │
│  │ Emit:                                                   │   │
│  │ - subscribe(tickers, types)                            │   │
│  │ - unsubscribe(tickers, types)                          │   │
│  │                                                         │   │
│  │ Listen:                                                │   │
│  │ - price_update ✅                                       │   │
│  │ - analysis_complete ✅                                  │   │
│  │ - report_ready ✅                                       │   │
│  │ - portfolio_update ✅                                   │   │
│  │ - market_status ✅                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ OAuth Management Service (External)                     │   │
│  │ Port: 8000                                              │   │
│  │ - POST /api/oauth/session/start                         │   │
│  │ - GET /api/oauth/session/status                         │   │
│  │ - POST /api/oauth/session/confirm-login                 │   │
│  │ - POST /api/oauth/session/skip-site                     │   │
│  │ - POST /api/oauth/session/save                          │   │
│  │ - DELETE /api/oauth/session/cancel                      │   │
│  │ - GET /api/oauth/vnc-url                                │   │
│  │ - GET /api/oauth/sites                                  │   │
│  │ - GET /api/oauth/health                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (NestJS)                              │
│                  Port: 3001 (3101)                              │
│               Base URL: /api/v1                                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CONTROLLERS & ROUTES                                     │  │
│  │                                                          │  │
│  │ Auth Controller (/auth)                                 │  │
│  │ ├─ POST /register - Register new user                  │  │
│  │ ├─ POST /login - Email/password login                  │  │
│  │ ├─ GET /google - Google OAuth redirect                 │  │
│  │ ├─ GET /google/callback - OAuth callback               │  │
│  │ └─ GET /me - Get current user profile ❌ (expects /profile) │
│  │                                                          │  │
│  │ Assets Controller (/assets)                             │  │
│  │ ├─ GET / - List all assets                             │  │
│  │ ├─ GET /:ticker - Get asset by ticker                  │  │
│  │ ├─ GET /:ticker/price-history - Price data ❌ (FE expects /prices) │
│  │ └─ POST /:ticker/sync - Sync asset data                │  │
│  │                                                          │  │
│  │ Analysis Controller (/analysis) [Protected]            │  │
│  │ ├─ POST /:ticker/fundamental - Fundamental analysis   │  │
│  │ ├─ POST /:ticker/technical - Technical analysis        │  │
│  │ ├─ POST /:ticker/complete - Complete analysis with AI  │  │
│  │ ├─ GET /:ticker - Get analyses for ticker ❌ (route confusing) │
│  │ └─ GET /:id/details - Get analysis details             │  │
│  │                                                          │  │
│  │ Portfolio Controller (/portfolio) [Protected]          │  │
│  │ ├─ GET / - List user portfolios                        │  │
│  │ ├─ GET /:id - Get specific portfolio                   │  │
│  │ ├─ POST / - Create portfolio                           │  │
│  │ ├─ PATCH /:id - Update portfolio                       │  │
│  │ ├─ DELETE /:id - Delete portfolio                      │  │
│  │ ├─ POST /:portfolioId/positions - Add position         │  │
│  │ ├─ PATCH /:portfolioId/positions/:positionId - Update  │  │
│  │ ├─ DELETE /:portfolioId/positions/:positionId - Delete │  │
│  │ └─ POST /import - Import portfolio from file           │  │
│  │                                                          │  │
│  │ Reports Controller (/reports) [Protected]              │  │
│  │ ├─ GET / - List reports (complete analyses)            │  │
│  │ ├─ GET /:id - Get specific report                      │  │
│  │ ├─ POST /generate - Generate report for asset          │  │
│  │ └─ GET /:id/download - Download (pdf/html/json)        │  │
│  │                                                          │  │
│  │ DataSources Controller (/data-sources)                 │  │
│  │ ├─ GET / - List all data sources                       │  │
│  │ ├─ GET /status - Get sources status                    │  │
│  │ ├─ POST /:id/test - NOT IMPLEMENTED ❌                 │  │
│  │ └─ POST /scrape - NOT IMPLEMENTED ❌                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ WebSocket Gateway                                        │  │
│  │ ├─ subscribe(tickers, types) - Room-based subscriptions │  │
│  │ ├─ unsubscribe(tickers, types) - Leave rooms           │  │
│  │ ├─ emitPriceUpdate(ticker, data)                        │  │
│  │ ├─ emitAnalysisComplete(ticker, id, type)              │  │
│  │ ├─ emitReportReady(ticker, reportId)                    │  │
│  │ ├─ emitPortfolioUpdate(userId, portfolioId, data)       │  │
│  │ └─ emitMarketStatus(status)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SERVICES (Business Logic)                                │  │
│  │ ├─ AuthService                                           │  │
│  │ ├─ AssetsService                                         │  │
│  │ ├─ AnalysisService                                       │  │
│  │ ├─ PortfolioService                                      │  │
│  │ ├─ ReportsService                                        │  │
│  │ ├─ DataSourcesService                                    │  │
│  │ ├─ ScrapersService (multi-source data validation)        │  │
│  │ ├─ AiService (OpenAI integration - stubbed)              │  │
│  │ ├─ TechnicalAnalysisService                              │  │
│  │ ├─ SentimentAnalysisService                              │  │
│  │ ├─ CacheService (Redis)                                  │  │
│  │ └─ NotificationsService                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼────────┐  ┌────────▼──────────┐
│   PostgreSQL   │  │     Redis        │  │ External Services │
│   + TimescaleDB│  │    Cache/Queue   │  │                   │
│                │  │                  │  │ ├─ BRAPI          │
│ ├─ users       │  │ ├─ Price cache   │  │ ├─ Fundamentus    │
│ ├─ assets      │  │ ├─ Analysis jobs │  │ ├─ StatusInvest   │
│ ├─ asset_prices│  │ ├─ Reports cache │  │ ├─ Investidor10   │
│ ├─ portfolios  │  │ └─ Subscriptions │  │ ├─ Opcoes.net.br  │
│ ├─ positions   │  │                  │  │ ├─ OpenAI         │
│ ├─ analysis    │  │ Bull Queue Jobs  │  │ ├─ Google OAuth   │
│ ├─ fundamental │  │ ├─ Scraping      │  │ └─ OAuth Service  │
│ └─ data_sources│  │ ├─ Analysis      │  │                   │
│                │  │ └─ Reports       │  │ (Port 8000)       │
└────────────────┘  └──────────────────┘  └───────────────────┘
```

---

## 2. MAPEAMENTO DETALHADO DE ENDPOINTS

### ✅ ENDPOINTS CONSISTENTES (Funcionando)

#### Autenticação
| Método | Endpoint | Frontend | Backend | Status | Notas |
|--------|----------|----------|---------|--------|-------|
| POST | /auth/register | api.register() | AuthController | ✅ OK | Rate limit: 3/hr |
| POST | /auth/login | api.login() | AuthController | ✅ OK | Rate limit: 5/5min |
| GET | /auth/google | - | AuthController | ✅ OK | OAuth redirect |
| GET | /auth/google/callback | - | AuthController | ✅ OK | OAuth callback |
| POST | /auth/google | api.loginWithGoogle() | AuthService | ✅ OK | Google token |

#### Portfolio
| Método | Endpoint | Frontend | Backend | Status | Notas |
|--------|----------|----------|---------|--------|-------|
| GET | /portfolio | api.getPortfolios() | PortfolioController | ✅ OK | Protected |
| GET | /portfolio/:id | api.getPortfolio(id) | PortfolioController | ✅ OK | Protected |
| POST | /portfolio | api.createPortfolio() | PortfolioController | ✅ OK | Protected |
| PATCH | /portfolio/:id | api.updatePortfolio() | PortfolioController | ✅ OK | Protected |
| DELETE | /portfolio/:id | api.deletePortfolio() | PortfolioController | ✅ OK | Protected |
| POST | /portfolio/:id/positions | api.addPosition() | PortfolioController | ✅ OK | Protected |
| PATCH | /portfolio/:id/pos/:posId | api.updatePosition() | PortfolioController | ✅ OK | Protected |
| DELETE | /portfolio/:id/pos/:posId | api.deletePosition() | PortfolioController | ✅ OK | Protected |
| POST | /portfolio/import | api.importPortfolio() | PortfolioController | ✅ OK | TODO: multer |

#### Assets
| Método | Endpoint | Frontend | Backend | Status | Notas |
|--------|----------|----------|---------|--------|-------|
| GET | /assets | api.getAssets() | AssetsController | ✅ OK | Supports filtering |
| GET | /assets/:ticker | api.getAsset() | AssetsController | ✅ OK | Public endpoint |
| POST | /assets/:ticker/sync | - | AssetsController | ✅ OK | Protected |

#### Reports
| Método | Endpoint | Frontend | Backend | Status | Notas |
|--------|----------|----------|---------|--------|-------|
| GET | /reports | api.getReports() | ReportsController | ✅ OK | Protected |
| GET | /reports/:id | api.getReport(id) | ReportsController | ✅ OK | Protected |
| POST | /reports/generate | api.generateReport() | ReportsController | ✅ OK | Protected |
| GET | /reports/:id/download | api.downloadReport() | ReportsController | ✅ OK | pdf/html/json |

#### Data Sources
| Método | Endpoint | Frontend | Backend | Status | Notas |
|--------|----------|----------|---------|--------|-------|
| GET | /data-sources | api.getDataSources() | DataSourcesController | ✅ OK | Public |
| GET | /data-sources/status | - | DataSourcesController | ✅ OK | Public |

### ❌ ENDPOINTS COM PROBLEMAS (Incompatibilidades)

#### Crítico - Rotas não mapeadas

1. **GET /auth/profile vs GET /auth/me**
   - Frontend chama: `api.getProfile()` → `GET /auth/profile`
   - Backend tem: `GET /auth/me`
   - Severidade: CRÍTICA
   - Impacto: Falha ao carregar perfil do usuário
   - Solução: Adicionar alias `/profile` ou renomear no frontend

2. **GET /assets/:ticker/prices vs GET /assets/:ticker/price-history**
   - Frontend chama: `api.getAssetPrices(ticker)` → `GET /assets/{ticker}/prices`
   - Backend tem: `GET /assets/{ticker}/price-history`
   - Severidade: CRÍTICA
   - Impacto: Gráficos de preço não carregam
   - Solução: Adicionar rota alternativa no backend

3. **POST /analysis (genérico) - Não existe**
   - Frontend chama: `api.requestAnalysis(ticker, type)` → `POST /analysis` com `{ticker, type}`
   - Backend tem: 
     - `POST /analysis/:ticker/fundamental`
     - `POST /analysis/:ticker/technical`
     - `POST /analysis/:ticker/complete`
   - Severidade: CRÍTICA
   - Impacto: Análise não pode ser requisitada do frontend
   - Solução: Criar endpoint genérico que roteia para o correto

4. **GET /analysis (list) - Padrão confuso**
   - Frontend chama: `api.listAnalyses(params)` → `GET /analysis` com `{ticker, type, limit}`
   - Backend tem: `GET /analysis/:ticker` (sempre requer ticker)
   - Severidade: ALTA
   - Impacto: Listagem de análises não funciona
   - Solução: Tornar ticker opcional ou criar GET /analysis/list

5. **GET /assets/:ticker/fundamentals - Nome inconsistente**
   - Frontend chama: `api.getAssetFundamentals(ticker)` → `GET /assets/{ticker}/fundamentals`
   - Backend não tem endpoint específico para isso
   - Severidade: ALTA
   - Impacto: Dados fundamentais não carregam no detalhe do ativo
   - Solução: Criar endpoint ou usar análise fundamental

6. **POST /data-sources/:id/test - Não implementado**
   - Frontend chama: `api.testDataSource(id)` → `POST /data-sources/{id}/test`
   - Backend: Endpoint não existe no controller
   - Severidade: MÉDIA
   - Impacto: Não pode testar conexão das fontes de dados
   - Solução: Implementar no DataSourcesService

7. **POST /data-sources/scrape - Não implementado**
   - Frontend chama: `api.triggerScraping(source, ticker)` → `POST /data-sources/scrape`
   - Backend: Endpoint não existe no controller
   - Severidade: ALTA
   - Impacto: Não pode disparar scraping manual
   - Solução: Implementar trigger de scraping

8. **PATCH /data-sources/:id - Não implementado**
   - Frontend chama: `api.updateDataSource(id, data)` → `PATCH /data-sources/{id}`
   - Backend: Endpoint não existe no controller
   - Severidade: BAIXA
   - Impacto: Não pode editar configuração das fontes
   - Solução: Implementar método de atualização

---

## 3. MAPEAMENTO DE EVENTOS WEBSOCKET

### Conexão e Gerenciamento de Rooms

```typescript
// Room Pattern: "{ticker}:{type}" ou "{userId}:portfolio"

Tipos de subscrição:
- prices
- analysis
- reports
- portfolio
```

### Eventos Emitidos pelo Backend ✅

| Evento | Payload | Room | Descrição |
|--------|---------|------|-----------|
| price_update | `{ticker, data, timestamp}` | `{ticker}:prices` | Atualização de preço em tempo real |
| analysis_complete | `{ticker, analysisId, type, timestamp}` | `{ticker}:analysis` | Análise completa |
| report_ready | `{ticker, reportId, timestamp}` | `{ticker}:reports` | Relatório pronto para download |
| portfolio_update | `{userId, portfolioId, data, timestamp}` | `{userId}:portfolio` | Atualização do portfólio |
| market_status | `{status, timestamp}` | Broadcast | Status do mercado (open/closed/pre_open/post_close) |

### Eventos Recebidos pelo Backend ✅

| Evento | Payload | Descrição |
|--------|---------|-----------|
| subscribe | `{tickers: [], types: []}` | Cliente se inscreve em tickers/tipos |
| unsubscribe | `{tickers?, types?}` | Cliente desinscreve de tickers/tipos |

### Memory Leak Prevention ✅

- Cleanup periódico a cada 5 minutos
- Remove subscrições órfãs
- Limpa rooms ao desconectar
- Rastreia subscrições por client ID

---

## 4. FLUXO COMPLETO DE AUTENTICAÇÃO

### Variantes:

#### A. Email/Senha
```
1. User → POST /auth/register {email, password, firstName?, lastName?}
   ├─ Valida email único
   ├─ Hash password com bcrypt (10 rounds)
   ├─ Cria usuario em DB
   └─ Retorna {user: {...}, token: JWT}

2. Frontend armazena token em cookie 'access_token' (7 dias)

3. User → POST /auth/login {email, password}
   ├─ Valida email/password
   ├─ Atualiza lastLogin
   └─ Retorna {user: {...}, token: JWT}

4. Subsequent requests
   ├─ Frontend inclui token no header: Authorization: Bearer {token}
   ├─ JwtAuthGuard valida token usando JWT_SECRET
   ├─ JwtStrategy extrai payload e valida user
   └─ Injetar user no req.user
```

#### B. Google OAuth
```
1. Frontend → iniciaBotão Google
   ├─ Abre popup Google login
   └─ Retorna token Google

2. Frontend → POST /auth/google {token}
   ├─ Backend valida token com Google
   ├─ Extrai {email, firstName, lastName, picture, googleId}
   ├─ Find or Create User
   ├─ Gera JWT
   └─ Retorna {user: {...}, token: JWT}

3. Frontend armazena em cookie 'access_token'
```

### Guards & Estratégias

```typescript
// JWT Strategy (Passport)
- Extrai token de Authorization header (Bearer)
- Valida assinatura com JWT_SECRET
- Retorna user para injetar em req.user

// Google Strategy (Passport)
- Redireciona para Google OAuth
- Callback em GET /auth/google/callback
- Valida resposta de Google
- Cria ou atualiza user
```

### Rate Limiting (Throttler)

```
POST /auth/register
├─ Limite: 3 requisições por 1 hora (3600000ms)

POST /auth/login
├─ Limite: 5 requisições por 5 minutos (300000ms)
```

### Token Management

```
JWT Token:
├─ Payload: {sub: userId, email: userEmail}
├─ Secreto: process.env.JWT_SECRET
├─ Expiração: 7 dias (JWT_EXPIRATION)
├─ Armazenamento: Cookie seguro, sameSite=lax
└─ Transmissão: Authorization: Bearer {token}

Interceptadores de Erro:
├─ Status 401 → Remove cookie, redireciona para /login
└─ Propaga outros erros
```

---

## 5. INTEGRAÇÕES EXTERNAS

### 1. Scrapers de Dados Fundamentais

#### Arquitetura de Cross-Validation

```typescript
async scrapeFundamentalData(ticker):
  1. Dispara scraping paralelo de múltiplas fontes:
     - Fundamentus
     - BRAPI
     - StatusInvest
     - Investidor10
  
  2. Coleta resultados bem-sucedidos (min 3 fontes)
  
  3. Cross-valida dados:
     - Busca discrepâncias em campos numéricos
     - Limiar de desvio: 5% (configurável)
     - Calcula score de confiança
  
  4. Merge de dados:
     - Usa dado mais recente como base
     - Adiciona metadados de fontes
     - Retorna {data, sources, confidence}
```

#### Scrapers Implementados

| Scraper | Fonte | Login Requerido | Status |
|---------|-------|-----------------|--------|
| FundamentusScraper | Fundamentus.com.br | ❌ | Implementado |
| BrapiScraper | BRAPI.dev (API) | ❌ | Implementado |
| StatusInvestScraper | StatusInvest.com.br | ❌ | Implementado |
| Investidor10Scraper | Investidor10.com.br | ❌ | Implementado |
| OpcoesScraper | Opcoes.net.br | ✅ Requer Oauth | Implementado |

#### Credenciais Configuradas

```env
BRAPI_API_KEY=mVcy3EFZaBdza27tPQjdC1

# Opcoes.net.br OAuth (opcional)
OPCOES_USERNAME=312.862.178-06
OPCOES_PASSWORD=Safra998266@#

# Chrome para scraping
CHROME_EXECUTABLE_PATH=/usr/bin/chromium-browser
CHROME_HEADLESS=true
CHROME_USER_DATA_DIR=./browser-profiles
```

#### Settings & Rate Limits

```env
SCRAPING_TIMEOUT=30000ms
SCRAPING_MAX_RETRIES=3
SCRAPING_CONCURRENT_JOBS=10
SCRAPING_INTERVAL_MINUTES=15
MIN_DATA_SOURCES=3
DATA_VALIDATION_THRESHOLD=0.05 (5%)
```

### 2. OpenAI Integration

**Status: STUB (Não Totalmente Implementado)**

```typescript
// Arquivo: backend/src/ai/ai.service.ts
class AiService {
  async analyzeWithAI(data: any, prompt: string) {
    // TODO: Implementar análise com OpenAI
    return { message: 'AI analysis not implemented yet' };
  }

  async generateRecommendation(ticker: string, analysisData: any) {
    // TODO: Implementar recomendação com IA
    return { recommendation: 'hold', confidence: 0.5 };
  }
}
```

**O que está faltando:**
- Inicialização do cliente OpenAI
- Implementação de chamadas à API
- Chunking/sharding de documentos grandes
- System prompts customizados
- Cache de análises

**Variáveis necessárias:**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=... (opcional)
AI_ENABLED=true
AI_DEFAULT_PROVIDER=openai
```

### 3. Serviço OAuth Externo (FastAPI)

**Port: 8000**

Endpoints (Implementados no API Client):

```typescript
oauth.startSession() → POST /api/oauth/session/start
oauth.getSessionStatus() → GET /api/oauth/session/status
oauth.confirmLogin() → POST /api/oauth/session/confirm-login
oauth.skipSite(reason) → POST /api/oauth/session/skip-site
oauth.saveCookies() → POST /api/oauth/session/save
oauth.cancelSession() → DELETE /api/oauth/session/cancel
oauth.getVncUrl() → GET /api/oauth/vnc-url
oauth.getSites() → GET /api/oauth/sites
oauth.navigateToSite(siteId) → POST /api/oauth/navigate/{siteId}
oauth.healthCheck() → GET /api/oauth/health
```

**Status de Integração:**
- Frontend: ✅ Hooks implementados (useOAuthSession.ts)
- Backend: ⚠️ Endpoints disponíveis mas não conectados ao fluxo principal
- Comunicação: HTTP direto para localhost:8000

---

## 6. BANCO DE DADOS

### TypeORM Entities & Relacionamentos

```
User (1)
├── id: UUID
├── email: string (unique)
├── password: string (hashed)
├── firstName: string
├── lastName: string
├── googleId: string (nullable)
├── avatar: string (URL)
├── isActive: boolean
├── isEmailVerified: boolean
├── preferences: JSONB
├── notifications: JSONB
├── createdAt: timestamp
├── updatedAt: timestamp
├── lastLogin: timestamp
└── portfolios: Portfolio[] (OneToMany)

Portfolio (1) → User
├── id: UUID
├── userId: UUID (FK)
├── name: string
├── description: text
├── isActive: boolean
├── totalInvested: decimal(18,2)
├── currentValue: decimal(18,2)
├── profit: decimal(18,2)
├── profitPercentage: decimal(10,4)
├── settings: JSONB
├── createdAt: timestamp
├── updatedAt: timestamp
└── positions: PortfolioPosition[] (OneToMany)

PortfolioPosition (N) → Portfolio
├── id: UUID
├── portfolioId: UUID (FK)
├── assetId: UUID (FK)
├── quantity: decimal
├── costPrice: decimal
├── entryDate: timestamp
├── exitDate: timestamp (nullable)
├── notes: text
├── createdAt: timestamp
└── updatedAt: timestamp

Asset (1)
├── id: UUID
├── ticker: string (unique)
├── name: string
├── type: enum (stock|fii|etf|bdr|option|future|crypto|fixed_income)
├── sector: string
├── subsector: string
├── segment: string
├── cnpj: string
├── website: string
├── description: text
├── logoUrl: string
├── isActive: boolean
├── listingDate: date
├── metadata: JSONB
├── createdAt: timestamp
├── updatedAt: timestamp
├── prices: AssetPrice[] (OneToMany)
└── fundamentalData: FundamentalData[] (OneToMany)

AssetPrice (N) → Asset
├── id: UUID
├── assetId: UUID (FK)
├── date: date
├── open: decimal
├── high: decimal
├── low: decimal
├── close: decimal
├── adjustedClose: decimal
├── volume: bigint
├── createdAt: timestamp
└── updatedAt: timestamp

FundamentalData (N) → Asset
├── id: UUID
├── assetId: UUID (FK)
├── date: date
├── pe: decimal (Price/Earnings)
├── pbRatio: decimal (Price/Book)
├── dividendYield: decimal
├── marketCap: decimal
├── revenues: decimal
├── netIncome: decimal
├── roe: decimal (Return on Equity)
├── roic: decimal (Return on Invested Capital)
├── debtToEquity: decimal
├── currentRatio: decimal
├── quickRatio: decimal
├── metadata: JSONB
├── createdAt: timestamp
└── updatedAt: timestamp

Analysis (1) → Asset
├── id: UUID
├── assetId: UUID (FK)
├── type: enum (fundamental|technical|complete)
├── status: enum (pending|processing|completed|failed)
├── analysis: JSONB (resultados)
├── recommendation: enum (strong_buy|buy|hold|sell|strong_sell)
├── confidenceScore: decimal (0-1)
├── dataSources: string[]
├── sourcesCount: int
├── indicators: JSONB (technical indicators)
├── processingTime: int (ms)
├── completedAt: timestamp
├── errorMessage: string
├── createdAt: timestamp
└── updatedAt: timestamp

DataSource (1)
├── id: UUID
├── name: string
├── code: string
├── type: enum
├── endpoint: string
├── status: enum (active|inactive|error)
├── reliabilityScore: decimal
├── lastSuccessAt: timestamp
├── lastErrorAt: timestamp
├── errorCount: int
├── config: JSONB
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Índices Criados

```sql
-- Asset queries rápidas
CREATE INDEX idx_assets_ticker ON assets(ticker);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_sector ON assets(sector);

-- Portfolio queries
CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- Price lookups
CREATE INDEX idx_asset_prices_asset_date ON asset_prices(asset_id, date DESC);

-- Analysis queries
CREATE INDEX idx_analysis_asset_type ON analysis(asset_id, type);
CREATE INDEX idx_analysis_status ON analysis(status);
```

---

## 7. DEPENDÊNCIAS DE BIBLIOTECAS

### Frontend (Next.js 14)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.2.33",
    "@tanstack/react-query": "^5.17.19",
    "@tanstack/react-table": "^8.11.6",
    "axios": "^1.6.5",
    "socket.io-client": "^4.6.1",
    "zustand": "^4.5.0",
    "recharts": "^2.10.4",
    "lightweight-charts": "^4.1.3",
    "date-fns": "^3.0.6",
    "js-cookie": "^3.0.5",
    "tailwindcss": "^3.4.1",
    "@radix-ui/*": "latest"
  }
}
```

### Backend (NestJS 10)

```json
{
  "dependencies": {
    "@nestjs/core": "^10.3.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/websockets": "^10.3.0",
    "@nestjs/bull": "^11.0.4",
    "@nestjs/schedule": "^4.0.0",
    "@nestjs/cache-manager": "^3.0.1",
    "typeorm": "^0.3.19",
    "pg": "^8.11.3",
    "redis": "via ioredis: ^5.3.2",
    "bull": "^4.16.5",
    "axios": "^1.6.5",
    "openai": "^6.8.1",
    "socket.io": "^4.6.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-google-oauth20": "^2.0.0",
    "bcrypt": "^5.1.1",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^23.11.1",
    "puppeteer-extra": "^3.3.6"
  }
}
```

### Comparação de Versões Críticas

| Biblioteca | Frontend | Backend | Compatibilidade |
|-----------|----------|---------|-----------------|
| axios | ^1.6.5 | ^1.6.5 | ✅ Idêntico |
| socket.io-client | ^4.6.1 | (server) | ✅ Compatível |
| date-fns | ^3.0.6 | ^3.0.6 | ✅ Idêntico |
| TypeScript | ^5.3.3 | ^5.3.3 | ✅ Idêntico |
| Node Types | ^20.19.24 | ^20.11.0 | ✅ Compatível |

### Verificação de Incompatibilidades

- ✅ Sem incompatibilidades críticas detectadas
- Socket.io-client e socket.io na mesma versão maior (4.x)
- Axios versão idêntica garante comportamento consistente
- TypeScript version matching evita tipo de erros

---

## 8. VARIÁVEIS DE AMBIENTE

### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3101/api
NEXT_PUBLIC_WS_URL=http://localhost:3101
NEXT_PUBLIC_ENV=development

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_ANALYSIS=true
NEXT_PUBLIC_ENABLE_REALTIME_DATA=true
NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true
```

### Backend (.env)

```env
# Application
NODE_ENV=development
APP_PORT=3101
FRONTEND_URL=http://localhost:3100

# Database - PostgreSQL + TimescaleDB
DB_HOST=postgres (Docker) ou localhost
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Redis
REDIS_HOST=redis (Docker) ou localhost
REDIS_PORT=6379
QUEUE_REDIS_HOST=redis
QUEUE_REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-32chars-min
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRATION=30d

# Google OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3101/auth/google/callback

# API Keys
BRAPI_API_KEY=mVcy3EFZaBdza27tPQjdC1
OPENAI_API_KEY=sk-...

# Scraping
SCRAPING_TIMEOUT=30000
SCRAPING_MAX_RETRIES=3
SCRAPING_CONCURRENT_JOBS=10
SCRAPING_INTERVAL_MINUTES=15
MIN_DATA_SOURCES=3
DATA_VALIDATION_THRESHOLD=0.05

# WebSocket
WS_PORT=3002
WS_PATH=/socket.io

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL=300
CACHE_MAX=1000

# Feature Flags
FEATURE_REALTIME_UPDATES=true
FEATURE_AI_ANALYSIS=true
FEATURE_PORTFOLIO_IMPORT=true
FEATURE_REPORTS_GENERATION=true
```

### Checklist de Variáveis Obrigatórias

**Críticas para inicialização:**
- [x] DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- [x] JWT_SECRET (gerado no ambiente)
- [x] REDIS_HOST, REDIS_PORT
- [x] NEXT_PUBLIC_API_URL
- [x] NODE_ENV

**Para funcionalidades específicas:**
- [ ] OPENAI_API_KEY (AI analysis)
- [ ] GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (OAuth)
- [ ] BRAPI_API_KEY (scraping de dados)

---

## 9. PROBLEMAS DE INTEGRAÇÃO IDENTIFICADOS

### CRÍTICOS 🔴

1. **Endpoint /auth/profile não existe**
   - Impacto: Perfil de usuário não carrega
   - Solução: Adicionar rota ou renomear

2. **POST /analysis genérico não existe**
   - Impacto: Frontend não pode requisitar análises
   - Solução: Criar endpoint router ou adaptar frontend

3. **GET /assets/:ticker/prices vs /price-history**
   - Impacto: Gráficos não carregam
   - Solução: Criar alias ou standardizar nome

### ALTOS 🟠

1. **GET /analysis sem filtro por ticker não existe**
   - Impacto: Listagem completa de análises não funciona
   - Solução: Tornar ticker opcional ou criar rota separate

2. **POST /data-sources/scrape não implementado**
   - Impacto: Não pode disparar scraping manual
   - Solução: Implementar endpoint

3. **GET /assets/:ticker/fundamentals não mapeado**
   - Impacto: Dados fundamentais não carregam
   - Solução: Criar endpoint ou usar análise fundamental

### MÉDIOS 🟡

1. **POST /data-sources/:id/test não implementado**
   - Impacto: Não pode testar fontes de dados
   - Solução: Implementar no service

2. **PATCH /data-sources/:id não implementado**
   - Impacto: Configurações não podem ser atualizadas
   - Solução: Implementar update

3. **AiService é apenas stub**
   - Impacto: Análise com IA não funciona
   - Solução: Implementar integração OpenAI

4. **Portfolio import usa Buffer mock**
   - Impacto: Import de portfólio não funciona 100%
   - Solução: Implementar multer para upload

### BAIXOS 🟢

1. **OAuth service no port 8000 não integrado completamente**
   - Impacto: OAuth workflows não iniciados
   - Solução: Conectar com fluxo de análise

---

## 10. RECOMENDAÇÕES ACTIONÁVEIS

### Prioridade 1 - Corrigir Incompatibilidades de Rotas

```typescript
// backend/src/api/auth/auth.controller.ts
@Get('profile') // Adicionar alias
async getProfile(@Req() req: any) {
  return req.user;
}

// backend/src/api/assets/assets.controller.ts
@Get(':ticker/prices') // Adicionar alias
async getAssetPrices(
  @Param('ticker') ticker: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  return this.assetsService.getPriceHistory(ticker, startDate, endDate);
}

// backend/src/api/analysis/analysis.controller.ts
@Post() // Adicionar router genérico
async requestAnalysis(@Body() body: {ticker: string, type: string}) {
  const analysisType = body.type.toLowerCase();
  switch(analysisType) {
    case 'fundamental':
      return this.generateFundamentalAnalysis(body.ticker);
    case 'technical':
      return this.generateTechnicalAnalysis(body.ticker);
    case 'complete':
      return this.generateCompleteAnalysis(body.ticker);
    default:
      throw new BadRequestException('Invalid analysis type');
  }
}

@Get() // Adicionar list genérico
async listAnalyses(
  @Query('ticker') ticker?: string,
  @Query('type') type?: string,
  @Query('limit') limit = 10,
) {
  // Implementar query dinâmica
}
```

### Prioridade 2 - Implementar Endpoints Faltantes

```typescript
// backend/src/api/data-sources/data-sources.controller.ts
@Post(':id/test')
async testDataSource(@Param('id') id: string) {
  return this.dataSourcesService.testConnection(id);
}

@Post('scrape')
async triggerScraping(@Body() {source, ticker}: any) {
  return this.dataSourcesService.triggerScrapingJob(source, ticker);
}

@Patch(':id')
async updateDataSource(@Param('id') id: string, @Body() data: any) {
  return this.dataSourcesService.update(id, data);
}
```

### Prioridade 3 - Completar Integrações

1. **OpenAI Integration**
   ```typescript
   // Implementar multi-agent analysis
   // Setup document chunking/sharding
   // Cache analysis results
   ```

2. **Portfolio Import com Multer**
   ```typescript
   // Implementar handler de upload de arquivo
   // Suportar múltiplos formatos (B3, Kinvo, etc)
   ```

3. **OAuth Service Connection**
   ```typescript
   // Integrar com workflows de análise
   // Sync dados com backend principal
   ```

---

## 11. RESUMO EXECUTIVO

### Status Geral: ⚠️ FUNCIONAL COM RESSALVAS

**O que funciona bem:**
- ✅ Autenticação (email/Google)
- ✅ Portfolio CRUD
- ✅ WebSocket real-time (estrutura)
- ✅ Cross-validation de dados
- ✅ Análise técnica
- ✅ Geração de relatórios

**O que precisa de correção:**
- ❌ 8 rotas com inconsistências de nomes
- ❌ 3 endpoints não implementados
- ❌ AI integration é stub
- ❌ Portfolio import mock

**Trabalho estimado para produção:**
- Corrigir rotas: 2-4 horas
- Implementar endpoints: 4-6 horas
- Completar AI: 16-24 horas
- Testes completos: 8-12 horas
- **Total: 30-46 horas**

