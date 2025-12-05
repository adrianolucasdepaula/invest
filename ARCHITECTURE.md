# 🏗️ ARCHITECTURE - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-25
**Versão:** 1.2.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura Geral](#arquitetura-geral)
3. [Camadas da Aplicação](#camadas-da-aplicação)
4. [Stack Tecnológica](#stack-tecnológica)
5. [Estrutura de Pastas](#estrutura-de-pastas)
6. [Portas e Serviços](#portas-e-serviços)
7. [Fluxo de Dados](#fluxo-de-dados)

---

## 🎯 VISÃO GERAL

Plataforma completa de análise de investimentos B3 com Inteligência Artificial para análise fundamentalista, técnica, macroeconômica e gestão de portfólio.

### Princípios Arquiteturais

- ✅ **Separação de Responsabilidades**: Frontend (apresentação), Backend (lógica), Scrapers (coleta)
- ✅ **Escalabilidade Horizontal**: Containers Docker orquestrados
- ✅ **Comunicação Assíncrona**: BullMQ + Redis para tarefas pesadas
- ✅ **Real-time Updates**: WebSocket para atualizações em tempo real
- ✅ **Cross-Validation**: Múltiplas fontes de dados (mínimo 3)
- ✅ **Type Safety**: TypeScript em todo o stack (backend + frontend)

---

## 🏛️ ARQUITETURA GERAL

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │ ←──→ │   NestJS    │ ←──→ │ PostgreSQL  │
│  Frontend   │      │   Backend   │      │  Database   │
│   :3100     │      │    :3101    │      │   :5532     │
└─────────────┘      └─────────────┘      └─────────────┘
                            ↓
                     ┌─────────────┐
                     │   BullMQ    │
                     │   + Redis   │
                     │    :6479    │
                     └─────────────┘
                            ↓
                     ┌─────────────┐
                     │  Python     │
                     │  Scrapers   │
                     │  (Selenium) │
                     └─────────────┘
```

### Fluxo de Comunicação

1. **Frontend → Backend**: REST API (HTTP/HTTPS)
2. **Backend → Database**: TypeORM (PostgreSQL protocol)
3. **Backend → Queue**: BullMQ (Redis protocol)
4. **Queue → Scrapers**: Python subprocess/API calls
5. **Backend → Frontend**: WebSocket (real-time events)

---

## 📚 CAMADAS DA APLICAÇÃO

### Frontend (Next.js 14 App Router)

**Responsabilidades:**

- Renderização de páginas e componentes UI
- Gerenciamento de estado local (React Query + Context API)
- Comunicação com backend via REST API
- Recebimento de eventos real-time via WebSocket
- Validação de formulários (React Hook Form + Zod)

**Páginas Principais:**

- `/dashboard` - Overview de portfólio e mercado
- `/assets` - Listagem e gerenciamento de ativos
- `/assets/[ticker]/technical` - Análise técnica avançada com gráficos multi-pane (FASE 29)
- `/analysis` - Solicitação e visualização de análises
- `/portfolio` - Gestão de portfólio
- `/reports` - Relatórios e análises detalhadas
- `/data-sources` - Status e métricas dos scrapers
- `/oauth-manager` - Gerenciamento de sessões OAuth
- `/settings` - Configurações do usuário

**Componentes:**

- Shadcn/ui + TailwindCSS
- Charts: Recharts (dashboard, portfolio) + lightweight-charts 4.1.3 (análise técnica)
- Icons: Lucide React

**Componentes de Charts (FASE 29):**

- `candlestick-chart-with-overlays.tsx` - Candlestick com 15+ overlays (SMA, EMA, Bollinger, Pivot Points)
- `rsi-chart.tsx` - RSI indicator (linhas 70/30)
- `macd-chart.tsx` - MACD Line + Signal + Histogram
- `stochastic-chart.tsx` - Stochastic oscillator (%K + %D, linhas 80/20)
- `multi-pane-chart.tsx` - Orquestrador de 4 painéis sincronizados

**Estado:**

- React Query (cache, refetch, mutations)
- Context API (autenticação, tema)

**Comunicação:**

- REST API: axios via `lib/api.ts`
- WebSocket: Socket.io-client

---

### Backend (NestJS)

**Responsabilidades:**

- API REST (CRUD de ativos, análises, portfólios)
- Autenticação e autorização (JWT)
- Lógica de negócio (cross-validation, cálculos)
- Orquestração de scrapers
- Gerenciamento de filas (BullMQ)
- WebSocket Gateway (eventos real-time)
- Persistência de dados (TypeORM)

**Módulos Principais:**

1. **API Module** (`src/api/`)

   - Controllers: Rotas REST
   - Services: Lógica de negócio
   - DTOs: Validação de entrada/saída

2. **Database Module** (`src/database/`)

   - Entities: Modelos TypeORM
   - Migrations: Versionamento de schema
   - Seeds: Dados iniciais

3. **Scrapers Module** (`src/scrapers/`)

   - ScrapersService: Orquestração
   - Individual Scrapers: Fundamentus, BRAPI, StatusInvest, etc
   - Cross-Validation: Merge e cálculo de confiança

4. **Queue Module** (`src/queue/`)

   - Jobs: Definições de tarefas
   - Processors: Executores de jobs

5. **WebSocket Module** (`src/websocket/`)
   - Gateway: Gerenciamento de conexões
   - Events: Eventos emitidos para frontend

**Padrões:**

- Dependency Injection (NestJS native)
- Repository Pattern (TypeORM)
- DTO Pattern (validação com class-validator)
- Decorator Pattern (NestJS decorators)

**Validações Customizadas:**

Para regras de negócio complexas (ex: endYear >= startYear), implementamos **custom validators** com `@ValidatorConstraint`:

```typescript
// Exemplo: sync-bulk.dto.ts (FASE 37)
@ValidatorConstraint({ name: 'IsEndYearGreaterThanOrEqualToStartYear', async: false })
export class IsEndYearGreaterThanOrEqualToStartYear implements ValidatorConstraintInterface {
  validate(endYear: number, args: ValidationArguments) {
    const object = args.object as any;
    return endYear >= object.startYear;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    return `Ano final (${object.endYear}) deve ser maior ou igual ao ano inicial (${object.startYear})`;
  }
}

// Aplicação no DTO:
export class SyncBulkDto {
  @IsInt()
  @Min(1986)
  @Max(2025)
  startYear: number;

  @IsInt()
  @Min(1986)
  @Max(2025)
  @Validate(IsEndYearGreaterThanOrEqualToStartYear)  // ✅ Custom validator
  endYear: number;
}
```

**Vantagens:**
- Mensagens de erro customizadas
- Validações entre múltiplos campos
- Reutilizável em DTOs diferentes
- Type-safe (TypeScript)

---

### Scrapers (Python + Playwright)

**Responsabilidades:**

- Coleta de dados de sites públicos e privados
- Autenticação OAuth (Google, email/senha)
- Parsing de HTML (BeautifulSoup, lxml)
- Chamadas a APIs públicas (BRAPI, etc)
- Retry logic e error handling

**Scrapers Primários (TypeScript - NestJS):**

- Fundamentus (público, sem auth)
- BRAPI (API token)
- StatusInvest (OAuth Google)
- Investidor10 (OAuth Google)
- Fundamentei (OAuth Google)
- Investsite (público, sem auth)

**Scrapers Fallback (Python - FastAPI) - 26 scrapers:**

Acionados automaticamente quando:
1. Menos de 3 fontes TypeScript disponíveis
2. Confidence < 60% (baixo consenso)
3. >30% dos campos com discrepância > 20%
4. 2+ campos críticos (P/L, ROE, DY) com desvio > 15%

| Categoria | Scrapers |
|-----------|----------|
| Fundamental (10) | FUNDAMENTUS, BCB, STATUSINVEST, INVESTSITE, INVESTIDOR10, TRADINGVIEW, GOOGLEFINANCE, GRIFFIN, COINMARKETCAP, OPCOESNET |
| News (7) | BLOOMBERG, GOOGLENEWS, INVESTINGNEWS, VALOR, EXAME, INFOMONEY, ESTADAO |
| AI (6) | CHATGPT, GEMINI, DEEPSEEK, CLAUDE, GROK, PERPLEXITY |
| Market Data (3) | YAHOOFINANCE, OPLAB, KINVO |

**API Endpoint:** `POST /api/scrapers/fundamental/{ticker}` (porta 8000)

**Tecnologias:**

- Playwright: Automação de browser
- Requests/HTTPX: APIs públicas
- BeautifulSoup4: Parsing HTML
- Cheerio (em scrapers TypeScript): Parsing HTML

---

### Banco de Dados (PostgreSQL)

**Responsabilidades:**

- Armazenamento persistente de dados
- Garantia de integridade (ACID)
- Indexes para performance
- Migrations (versionamento de schema)

**Entidades Principais:**

- Assets (ativos financeiros - 861 ativos B3 não-fracionários)
- AssetPrices (preços históricos - período 1986-2025, COTAHIST B3)
- TickerChange (mudanças de ticker - FASE 55, ex: ELET3→AXIA3)
- Analyses (análises fundamentalistas/técnicas)
- Portfolios (portfólios de usuários)
- PortfolioPositions (posições em portfólios)
- Users (usuários)
- ScraperMetrics (métricas de scrapers)
- UpdateLogs (logs de atualização)

**Documentação Completa:** Ver `DATABASE_SCHEMA.md`

---

## 🗂️ ONDE ARMAZENAR NOVOS DADOS

**Guia de decisão:** Use esta tabela para determinar onde armazenar novos tipos de dados.

### Mapeamento: Tipo de Dado → Entity/Tabela

| Tipo de Dado                     | Entity/Tabela                   | Localização                                                  | Exemplo de Uso                            |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| **Ativos (ticker, nome, setor)** | `Asset`                         | `backend/src/database/entities/asset.entity.ts`              | PETR4, VALE3, ITUB4                       |
| **Preços históricos (OHLCV)**    | `AssetPrices`                   | `backend/src/database/entities/asset-price.entity.ts`        | Open, High, Low, Close, Volume + variação |
| **Mudanças de ticker (FASE 55)** | `TickerChange`                  | `backend/src/database/entities/ticker-change.entity.ts`      | ELET3→AXIA3, ELET6→AXIA6 (rebranding)     |
| **Análises fundamentalistas**    | `Analysis` (type='fundamental') | `backend/src/database/entities/analysis.entity.ts`           | P/L, P/VP, ROE, ROIC, Dividend Yield      |
| **Análises técnicas**            | `Analysis` (type='technical')   | `backend/src/database/entities/analysis.entity.ts`           | RSI, MACD, Bollinger, SMA                 |
| **Análises completas**           | `Analysis` (type='complete')    | `backend/src/database/entities/analysis.entity.ts`           | Combinação Fundamentalista + Técnica      |
| **Portfólios de usuários**       | `Portfolio`                     | `backend/src/database/entities/portfolio.entity.ts`          | Carteiras de investimento                 |
| **Posições em portfólio**        | `PortfolioPosition`             | `backend/src/database/entities/portfolio-position.entity.ts` | Ticker + quantidade + preço médio         |
| **Usuários**                     | `User`                          | `backend/src/database/entities/user.entity.ts`               | Autenticação, perfil                      |
| **Métricas de scrapers**         | `ScraperMetrics`                | `backend/src/database/entities/scraper-metric.entity.ts`     | Taxa de sucesso, response time, errors    |
| **Logs de atualização**          | `UpdateLog`                     | `backend/src/database/entities/update-log.entity.ts`         | Histórico de atualizações de preços       |
| **Notificações** ⚠️              | `Notification` (criar)          | `backend/src/database/entities/notification.entity.ts`       | Alertas, sistema, análises completas      |
| **Alertas de preço** ⚠️          | `PriceAlert` (criar)            | `backend/src/database/entities/price-alert.entity.ts`        | Target price, condição (above/below)      |
| **Dados de scrapers (raw)**      | Campo `metadata` JSON           | Coluna JSON nas entities existentes                          | Dados brutos de fontes específicas        |
| **Configurações de usuário**     | Campo `settings` JSON           | `User` entity                                                | Preferências, temas, notificações         |
| **Dividendos** ⚠️                | `Dividend` (criar)              | `backend/src/database/entities/dividend.entity.ts`           | Data pagamento, valor por ação, tipo      |
| **Proventos (JCP)** ⚠️           | `Provento` (criar)              | `backend/src/database/entities/provento.entity.ts`           | Juros sobre capital próprio               |
| **Eventos corporativos** ⚠️      | `CorporateEvent` (criar)        | `backend/src/database/entities/corporate-event.entity.ts`    | Splits, grupamentos, fusões               |

**Legenda:**

- ✅ Entity existente (use diretamente)
- ⚠️ Entity NÃO existe (precisa criar)

### Workflow para Criar Nova Entity

**1. Criar Entity:**

```bash
cd backend/src/database/entities
# Criar arquivo: <nome>.entity.ts
```

**Exemplo (Notification):**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string; // 'ANALYSIS_COMPLETED', 'PRICE_ALERT', 'SYSTEM'

  @Column()
  title: string;

  @Column("text")
  message: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

**2. Criar Migration:**

```bash
cd backend
npm run migration:generate -- -n CreateNotification
```

**3. Registrar Entity no Module:**

```typescript
// backend/src/database/database.module.ts
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      AssetPrice,
      Analysis,
      // ... outras entities
      Notification, // ← Adicionar aqui
    ]),
  ],
})
```

**4. Criar Repository/Service:**

```bash
# Service
cd backend/src/api
mkdir notifications
cd notifications
# Criar: notifications.service.ts, notifications.controller.ts, dto/
```

**5. Executar Migration:**

```bash
cd backend
npm run migration:run
```

### Decisão: Nova Entity vs Campo JSON

**Usar Nova Entity quando:**

- ✅ Dados estruturados e previsíveis (schema fixo)
- ✅ Precisa de queries complexas (filtros, joins, agregações)
- ✅ Precisa de relacionamentos (foreign keys)
- ✅ Precisa de indexes para performance
- ✅ Dados crescem significativamente (> 1000 registros)

**Usar Campo JSON (`metadata`) quando:**

- ✅ Dados semi-estruturados ou variáveis
- ✅ Schema pode mudar frequentemente
- ✅ Não precisa de queries complexas (apenas leitura/escrita)
- ✅ Dados auxiliares/opcionais (não críticos)
- ✅ Poucos registros (< 1000)

**Exemplos:**

```typescript
// ✅ CORRETO: Nova Entity para dados estruturados
@Entity("price_alerts")
export class PriceAlert {
  @Column() ticker: string;
  @Column("decimal") targetPrice: number;
  @Column() condition: "above" | "below";
}

// ✅ CORRETO: JSON para dados variáveis
@Entity("analyses")
export class Analysis {
  @Column("jsonb")
  metadata: {
    source?: string;
    rawData?: any;
    scrapedAt?: Date;
  };
}
```

### Checklist de Validação

Antes de criar nova entity, verificar:

- [ ] Tipo de dado não se encaixa em entity existente?
- [ ] Pesquisou no código se já existe? (`grep -r "NomeSimilar"`)
- [ ] Consultou `DATABASE_SCHEMA.md` para ver entities existentes?
- [ ] Definiu relacionamentos (foreign keys)?
- [ ] Definiu indexes necessários (performance)?
- [ ] Criou migration completa (up + down)?
- [ ] Registrou entity no `database.module.ts`?
- [ ] Criou service + controller + DTOs?
- [ ] Documentou no `DATABASE_SCHEMA.md`?

---

### Queue (BullMQ + Redis)

**Responsabilidades:**

- Processamento assíncrono de tarefas pesadas
- Retry automático em falhas
- Rate limiting
- Agendamento de tarefas (cron jobs)

**Jobs Implementados:**

- `process-pending-analysis`: Processa análises pendentes
- `update-asset-prices`: Atualiza preços de ativos
- `daily-update`: Atualização diária automática
- `batch-update`: Atualização em lote

---

## 💻 STACK TECNOLÓGICA

### Backend

| Tecnologia        | Versão | Propósito                        |
| ----------------- | ------ | -------------------------------- |
| NestJS            | 10.x   | Framework backend (Node.js 20.x) |
| TypeScript        | 5.x    | Linguagem tipada                 |
| TypeORM           | 0.3.x  | ORM para PostgreSQL              |
| class-validator   | latest | Validação de DTOs                |
| class-transformer | latest | Transformação de dados           |
| BullMQ            | latest | Sistema de filas                 |
| Socket.io         | latest | WebSocket real-time              |
| Swagger/OpenAPI   | latest | Documentação de API              |

### Frontend

| Tecnologia       | Versão | Propósito                    |
| ---------------- | ------ | ---------------------------- |
| Next.js          | 14.x   | Framework React (App Router) |
| TypeScript       | 5.x    | Linguagem tipada             |
| Shadcn/ui        | latest | Componentes UI               |
| TailwindCSS      | 3.x    | CSS utility-first            |
| React Query      | latest | Cache e estado servidor      |
| React Hook Form  | latest | Gerenciamento de formulários |
| Zod              | latest | Validação de schemas         |
| Recharts         | latest | Gráficos e visualizações     |
| Socket.io-client | latest | WebSocket client             |

### Database

| Tecnologia | Versão | Propósito                  |
| ---------- | ------ | -------------------------- |
| PostgreSQL | 16.x   | RDBMS principal            |
| Redis      | 7.x    | Cache e filas              |
| PgAdmin    | 4.x    | Interface de administração |

### DevOps

| Tecnologia     | Versão | Propósito                  |
| -------------- | ------ | -------------------------- |
| Docker         | latest | Containerização            |
| Docker Compose | latest | Orquestração de containers |
| Git            | latest | Controle de versão         |
| GitHub         | -      | Repositório remoto         |

### Scrapers

| Tecnologia     | Versão | Propósito               |
| -------------- | ------ | ----------------------- |
| Python         | 3.11.x | Linguagem para scrapers |
| Playwright     | latest | Automação de browser    |
| Requests       | latest | Cliente HTTP            |
| HTTPX          | latest | Cliente HTTP assíncrono |
| BeautifulSoup4 | latest | Parsing HTML            |
| lxml           | latest | Parser XML/HTML rápido  |

### MCPs (Model Context Protocol)

Sistema completo de 9 servidores MCP para estender capacidades do Claude Code:

| MCP                 | Propósito                                 | Status      |
| ------------------- | ----------------------------------------- | ----------- |
| Sequential Thinking | Raciocínio estruturado e análise profunda | ✓ Connected |
| Filesystem          | Leitura/escrita segura de arquivos        | ✓ Connected |
| Shell               | Execução de comandos PowerShell/CMD       | ✓ Connected |
| A11y                | Auditoria WCAG automatizada (axe-core)    | ✓ Connected |
| Context7            | Documentação atualizada de frameworks     | ✓ Connected |
| Playwright          | Automação de browser para testes E2E      | ✓ Connected |
| Chrome DevTools     | Inspeção e debugging de aplicações web    | ✓ Connected |
| Selenium            | Automação web alternativa                 | ✓ Connected |
| **Gemini Advisor**  | Segunda opinião via Gemini CLI (1M tokens)| ✓ Connected |

**Configuração:** `C:\Users\adria\.claude.json`
**Escopo:** Projeto (invest-claude-web)
**Documentação:** `MCPS_USAGE_GUIDE.md`, `METODOLOGIA_MCPS_INTEGRADA.md`

**Gemini Advisor - Protocolo:**
- Claude Code = **DECISOR** (autoridade final)
- Gemini = **ADVISOR** (segunda opinião, não implementa)
- Modelo recomendado: `gemini-3-pro-preview`
- Ver detalhes em `CLAUDE.md` seção "Gemini 3 Pro - Protocolo de Segunda Opiniao"

---

## 📁 ESTRUTURA DE PASTAS

```
invest-claude-web/
├── backend/                        # Backend NestJS
│   ├── src/
│   │   ├── api/                   # Controllers e DTOs
│   │   │   ├── analysis/          # Análises (fundamental, técnica, completa)
│   │   │   ├── assets/            # Ativos (CRUD, sync, update)
│   │   │   ├── auth/              # Autenticação OAuth
│   │   │   ├── portfolio/         # Gestão de portfólio
│   │   │   └── reports/           # Relatórios
│   │   ├── database/              # TypeORM
│   │   │   ├── entities/          # Modelos de dados
│   │   │   ├── migrations/        # Migrations SQL
│   │   │   └── seeds/             # Seeds de dados (all-b3-assets.seed.ts: 861 ativos B3 1986-2025, ticker-changes.seed.ts: FASE 55)
│   │   ├── scrapers/              # Serviços de scraping
│   │   │   ├── fundamental/       # Scrapers fundamentalistas
│   │   │   ├── news/              # Scrapers de notícias
│   │   │   └── options/           # Scrapers de opções
│   │   ├── queue/                 # BullMQ
│   │   │   ├── jobs/              # Definição de jobs
│   │   │   └── processors/        # Processadores de jobs
│   │   ├── websocket/             # Gateway WebSocket
│   │   ├── app.module.ts          # Módulo raiz
│   │   └── main.ts                # Entry point
│   ├── test/                      # Testes E2E
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Frontend Next.js
│   ├── src/
│   │   ├── app/                   # App Router
│   │   │   ├── (dashboard)/       # Rotas autenticadas
│   │   │   │   ├── analysis/
│   │   │   │   ├── assets/
│   │   │   │   ├── portfolio/
│   │   │   │   └── reports/
│   │   │   ├── auth/              # Rotas de autenticação
│   │   │   └── layout.tsx         # Layout raiz
│   │   ├── components/            # Componentes React
│   │   │   ├── ui/                # Shadcn/ui base
│   │   │   ├── dashboard/         # Componentes do dashboard
│   │   │   ├── analysis/          # Componentes de análise
│   │   │   └── assets/            # Componentes de ativos
│   │   ├── lib/                   # Utilitários
│   │   │   ├── api.ts             # Cliente API
│   │   │   ├── hooks/             # Custom hooks
│   │   │   └── utils.ts           # Funções auxiliares
│   │   └── contexts/              # Context API
│   ├── public/                    # Assets estáticos
│   ├── package.json
│   └── tsconfig.json
│
├── api-service/                    # Serviço Python (FastAPI)
│   ├── app/
│   │   ├── scrapers/              # Scrapers Python
│   │   ├── services/              # Serviços
│   │   └── main.py                # Entry point
│   └── requirements.txt
│
├── docker-compose.yml              # Orquestração de serviços
├── .gitignore
├── README.md                       # Documentação pública
├── claude.md                       # Instruções Claude Code
├── DATABASE_SCHEMA.md              # Schema completo do banco
└── ARCHITECTURE.md                 # Este arquivo
```

---

## 🔌 PORTAS E SERVIÇOS

| Serviço                          | Porta Host | Porta Container | URL                          |
| -------------------------------- | ---------- | --------------- | ---------------------------- |
| **Frontend Next.js**             | 3100       | 3000            | http://localhost:3100        |
| **Backend NestJS**               | 3101       | 3101            | http://localhost:3101/api/v1 |
| **API Service (Python/FastAPI)** | 8000       | 8000            | http://localhost:8000        |
| **PostgreSQL**                   | 5532       | 5432            | localhost:5532               |
| **Redis**                        | 6479       | 6379            | localhost:6479               |
| **PgAdmin**                      | 5150       | 80              | http://localhost:5150        |
| **Redis Commander**              | 8181       | 8081            | http://localhost:8181        |
| **VNC Direct**                   | 5900       | 5900            | vnc://localhost:5900         |
| **noVNC Web**                    | 6080       | 6080            | http://localhost:6080        |

### Credenciais Padrão

**PostgreSQL:**

- User: `invest_user`
- Password: `invest_password`
- Database: `invest_db`

**PgAdmin:**

- Email: `admin@invest.com`
- Password: `admin`

---

## 🔄 FLUXO DE DADOS

### 1. Fluxo de Sincronização de Ativos (BRAPI)

```
1. User clica "Sincronizar" no frontend
2. Frontend → POST /api/v1/assets/sync
3. Backend (AssetsService):
   - Busca dados da BRAPI para cada ticker
   - Para cada ativo:
     a. Verifica se já existe no DB
     b. Se existe: Atualiza dados (nome, setor, etc)
     c. Se não existe: Cria novo ativo
   - Para cada preço:
     a. Verifica se já existe para a data
     b. Se existe: Atualiza com dados mais recentes
     c. Se não existe: Insere novo registro
   - Salva: price, change, changePercent, volume, marketCap
4. Backend → Retorna resumo (total, created, updated, failed)
5. Frontend exibe toast com resultado
```

**Arquivo:** `backend/src/api/assets/assets.service.ts:180-280`

---

### 2. Fluxo de Análise Fundamentalista

```
1. User clica "Solicitar Análise" para PETR4
2. Frontend → POST /api/v1/analysis/fundamental/PETR4
3. Backend (AnalysisService):
   - Cria registro de análise com status=PROCESSING
   - Chama ScrapersService.scrapeFundamentalData('PETR4')
4. ScrapersService:
   - Executa 6 scrapers em paralelo (Promise.allSettled):
     a. FundamentusScraper
     b. BrapiScraper
     c. StatusInvestScraper
     d. Investidor10Scraper
     e. FundamenteiScraper
     f. InvestsiteScraper
   - Cross-validation:
     a. Merge de dados de todas as fontes
     b. Detecção de discrepâncias (threshold 10%)
     c. Cálculo de confiança (0.0 - 1.0)
5. AnalysisService:
   - Atualiza análise: status=COMPLETED, analysis=data, confidence=score
   - Define recomendação baseada em confiança:
     - >= 0.8: BUY
     - >= 0.6: HOLD
     - < 0.6: SELL
6. Frontend recebe análise completa e exibe
```

**Arquivos:**

- `backend/src/api/analysis/analysis.service.ts:20-62`
- `backend/src/scrapers/scrapers.service.ts:38-62`

---

### 3. Fluxo de Análise em Massa (Bulk Analysis)

```
1. User clica "Solicitar Análises em Massa" em /analysis
2. Frontend → POST /api/v1/analysis/bulk/request
   Body: { type: 'complete' }
3. Backend (AnalysisService.requestBulkAnalysis):
   - Busca todos os ativos ativos (isActive=true)
   - Para cada ativo:
     a. Verifica se análise recente existe (< 7 dias)
     b. Se existe: Pula (skipped)
     c. Se não existe: Cria análise com status=PENDING
   - Retorna: total, requested, skipped
4. Queue (BullMQ) processa análises PENDING:
   - Job: process-pending-analysis
   - Processa 1 análise por vez
   - Emite WebSocket event a cada conclusão
5. Frontend recebe eventos WebSocket e atualiza lista em tempo real
```

**Arquivo:** `backend/src/api/analysis/analysis.service.ts:465-536`

---

### 4. Fluxo de Atualização de Preços (Update)

```
1. User clica "Atualizar" em uma posição de portfólio
2. Frontend → POST /api/v1/assets/update/:ticker
3. Backend (AssetsUpdateService):
   - Busca preço mais recente da BRAPI para o ticker
   - Calcula variação (change, changePercent)
   - Atualiza tabela asset_prices (novo registro)
   - Atualiza tabela assets (metadata)
   - Registra log em update_logs
   - Emite WebSocket event: 'asset:updated'
4. Frontend recebe evento WebSocket
5. Frontend atualiza preço na UI sem reload
6. Toast de sucesso exibido
```

**Arquivo:** `backend/src/api/assets/assets-update.service.ts`

---

### 5. Fluxo de Histórico Unificado (Ticker Merge)

```
1. User habilita "Histórico Unificado" no frontend (/assets/AXIA3)
2. Frontend → GET /api/v1/market-data/AXIA3/prices?unified=true
3. Backend (TickerMergeService):
   - findTickerChain('AXIA3') → Retorna ['ELET3', 'AXIA3']
   - Para cada ticker na cadeia:
     a. Busca histórico de preços (DB + BRAPI sync se necessário)
   - Merge de dados:
     a. Combina arrays de preços
     b. Remove duplicatas (prioriza ticker mais recente)
     c. Ordena cronologicamente
4. Backend → Retorna array unificado de AssetPrice[]
5. Frontend exibe gráfico contínuo com badge "Exibindo histórico unificado"
```

**Arquivos:**

- `backend/src/api/market-data/ticker-merge.service.ts`
- `backend/src/api/market-data/market-data.controller.ts`

---

### 5. Fluxo de Cross-Validation de Dados

```
1. ScrapersService executa 6 scrapers em paralelo
2. Para cada campo (ex: P/L):
   - Coleta valores de todas as fontes: [8.5, 8.3, 8.6, null, 8.4, 8.5]
   - Remove nulls: [8.5, 8.3, 8.6, 8.4, 8.5]
   - Calcula média: 8.46
   - Detecta outliers (threshold 10%):
     - 8.3 está a 1.89% da média → OK
     - 8.6 está a 1.65% da média → OK
     - Todos os valores concordam dentro de 10%
   - Marca campo como "confiável"
3. Conta quantos campos são confiáveis
4. Calcula score de confiança:
   - 6 fontes concordam: 1.0
   - 5 fontes concordam: 0.92
   - 4 fontes concordam: 0.83
   - 3 fontes concordam: 0.75
   - 2 fontes concordam: 0.5
   - Menos de 2: 0.0
5. Retorna dados merged + score de confiança
```

**Arquivo:** `backend/src/scrapers/scrapers.service.ts:104-215`

---

## 🔗 DOCUMENTAÇÃO COMPLEMENTAR

- **`DATABASE_SCHEMA.md`** - Schema completo do banco de dados, relacionamentos, indexes e queries comuns
- **`claude.md`** - Instruções completas para Claude Code, convenções e workflows
- **`README.md`** - Documentação pública do projeto
- **`CHECKLIST_TODO_MASTER.md`** - Checklist e TODO master do projeto
- **`MCPS_USAGE_GUIDE.md`** - Guia técnico completo dos 8 MCPs instalados
- **`METODOLOGIA_MCPS_INTEGRADA.md`** - Integração MCPs com Ultra-Thinking + TodoWrite

---

**Última atualização:** 2025-11-25
**Mantido por:** Claude Code (Sonnet 4.5)
