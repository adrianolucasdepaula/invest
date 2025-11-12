# Claude.md - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-12
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Portas e Serviços](#portas-e-serviços)
6. [Banco de Dados](#banco-de-dados)
7. [Fontes de Dados](#fontes-de-dados)
8. [Convenções de Código](#convenções-de-código)
9. [Fluxos Principais](#fluxos-principais)
10. [Decisões Técnicas](#decisões-técnicas)
11. [Roadmap](#roadmap)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

Plataforma completa de análise de investimentos B3 com Inteligência Artificial para análise fundamentalista, técnica, macroeconômica e gestão de portfólio.

### Objetivo
Coletar dados de múltiplas fontes públicas e privadas, realizar cross-validation, e gerar análises precisas usando IA para auxiliar na tomada de decisão de investimentos.

### Princípios
- ✅ **Precisão**: Cross-validation de múltiplas fontes (mínimo 3)
- ✅ **Transparência**: Logs detalhados de todas as operações
- ✅ **Escalabilidade**: Arquitetura modular e distribuída
- ✅ **Manutenibilidade**: Código limpo, documentado e testado

---

## 🏗️ ARQUITETURA

### Arquitetura Geral

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

### Camadas da Aplicação

**Frontend (Next.js 14 App Router)**
- Páginas: `/dashboard`, `/assets`, `/analysis`, `/portfolio`, `/reports`
- Componentes: Shadcn/ui + TailwindCSS
- Estado: React Query + Context API
- Comunicação: REST API + WebSocket (real-time)

**Backend (NestJS)**
- Controllers: Rotas REST
- Services: Lógica de negócio
- Repositories: Acesso a dados (TypeORM)
- Queue: BullMQ para tarefas assíncronas
- WebSocket: Eventos em tempo real

**Scrapers (Python + Selenium)**
- Playwright para sites autenticados
- Requests para APIs públicas
- Cross-validation entre fontes

**Banco de Dados (PostgreSQL)**
- Entidades: Assets, AssetPrices, Analyses, Portfolios, Users
- Migrations: TypeORM
- Indexes: Otimizados para queries frequentes

---

## 💻 STACK TECNOLÓGICA

### Backend
- **Framework**: NestJS 10.x (Node.js 20.x)
- **Linguagem**: TypeScript 5.x
- **ORM**: TypeORM 0.3.x
- **Validação**: class-validator, class-transformer
- **Queue**: BullMQ + Redis
- **WebSocket**: Socket.io
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14.x (App Router)
- **Linguagem**: TypeScript 5.x
- **UI**: Shadcn/ui + TailwindCSS 3.x
- **Estado**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **WebSocket**: Socket.io-client

### Database
- **RDBMS**: PostgreSQL 16.x
- **Cache**: Redis 7.x
- **Admin**: PgAdmin 4

### DevOps
- **Containers**: Docker + Docker Compose
- **VCS**: Git + GitHub
- **CI/CD**: (A implementar)

### Scrapers
- **Python**: 3.11.x
- **Browser Automation**: Playwright
- **HTTP**: Requests, HTTPX
- **Parsing**: BeautifulSoup4, lxml

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
│   │   │   └── seeds/             # Seeds de dados
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
└── claude.md                       # Este arquivo
```

---

## 🔌 PORTAS E SERVIÇOS

| Serviço | Porta Host | Porta Container | URL |
|---------|-----------|----------------|-----|
| **Frontend Next.js** | 3100 | 3000 | http://localhost:3100 |
| **Backend NestJS** | 3101 | 3101 | http://localhost:3101/api/v1 |
| **API Service (Python/FastAPI)** | 8000 | 8000 | http://localhost:8000 |
| **PostgreSQL** | 5532 | 5432 | localhost:5532 |
| **Redis** | 6479 | 6379 | localhost:6479 |
| **PgAdmin** | 5150 | 80 | http://localhost:5150 |
| **Redis Commander** | 8181 | 8081 | http://localhost:8181 |
| **VNC Direct** | 5900 | 5900 | vnc://localhost:5900 |
| **noVNC Web** | 6080 | 6080 | http://localhost:6080 |

### Credenciais Padrão

**PostgreSQL:**
- User: `invest_user`
- Password: `invest_password`
- Database: `invest_db`

**PgAdmin:**
- Email: `admin@invest.com`
- Password: `admin`

---

## 🗄️ BANCO DE DADOS

### Entidades Principais

**1. Assets (Ativos)**
```typescript
{
  id: UUID
  ticker: string (UNIQUE)           // Ex: PETR4, VALE3
  name: string                       // Nome completo
  type: AssetType                    // stock, fii, etf, crypto
  sector: string
  subsector: string
  isActive: boolean
  metadata: JSON                     // Dados extras
  createdAt: timestamp
  updatedAt: timestamp
}
```

**2. AssetPrices (Preços)**
```typescript
{
  id: UUID
  assetId: UUID (FK -> Assets)
  date: date
  open: decimal(18,2)
  high: decimal(18,2)
  low: decimal(18,2)
  close: decimal(18,2)
  adjustedClose: decimal(18,2)
  volume: bigint
  marketCap: decimal(18,2)
  change: decimal(18,2)              // Variação absoluta
  changePercent: decimal(10,4)       // Variação percentual
  collectedAt: timestamp             // Quando foi coletado
  createdAt: timestamp
}
```

**3. Analyses (Análises)**
```typescript
{
  id: UUID
  assetId: UUID (FK -> Assets)
  userId: UUID (FK -> Users)
  type: AnalysisType                 // fundamental, technical, complete
  status: AnalysisStatus             // pending, processing, completed, failed
  analysis: JSON                     // Dados da análise
  dataSources: string[]              // Fontes utilizadas
  sourcesCount: number               // Quantidade de fontes
  confidenceScore: decimal(5,4)      // 0.0000 - 1.0000
  recommendation: Recommendation     // buy, hold, sell
  targetPrice: decimal(18,2)
  errorMessage: string
  completedAt: timestamp
  createdAt: timestamp
}
```

**4. Portfolios (Portfólios)**
```typescript
{
  id: UUID
  userId: UUID (FK -> Users)
  name: string
  description: string
  totalValue: decimal(18,2)
  totalCost: decimal(18,2)
  totalProfitLoss: decimal(18,2)
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

**5. PortfolioPositions (Posições)**
```typescript
{
  id: UUID
  portfolioId: UUID (FK -> Portfolios)
  assetId: UUID (FK -> Assets)
  quantity: decimal(18,8)
  averagePrice: decimal(18,2)
  currentPrice: decimal(18,2)
  totalCost: decimal(18,2)
  totalValue: decimal(18,2)
  profitLoss: decimal(18,2)
  profitLossPercent: decimal(10,4)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Indexes Importantes

```sql
-- Performance crítica para queries frequentes
CREATE INDEX idx_asset_prices_date ON asset_prices(date);
CREATE INDEX idx_asset_prices_asset_date ON asset_prices(asset_id, date);
CREATE INDEX idx_analyses_asset_type ON analyses(asset_id, type);
CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at);
```

---

## 📊 FONTES DE DADOS

### Análise Fundamentalista (4 fontes implementadas)

| Fonte | Tipo | Login | Status | Scraper |
|-------|------|-------|--------|---------|
| **Fundamentus** | Público | Não | ✅ Implementado | fundamentus.scraper.ts |
| **BRAPI** | API Pública | Não | ✅ Implementado | brapi.scraper.ts |
| **StatusInvest** | Privado | Google | ✅ Implementado | statusinvest.scraper.ts |
| **Investidor10** | Privado | Google | ✅ Implementado | investidor10.scraper.ts |
| Fundamentei | Privado | Google | 🔜 Planejado | - |
| Investsite | Público | Não | 🔜 Planejado | - |

### Cross-Validation

O sistema coleta dados de **todas as 4 fontes** simultaneamente e faz:

1. **Merge de dados**: Combina dados de todas as fontes
2. **Detecção de discrepâncias**: Identifica valores divergentes (threshold 10%)
3. **Cálculo de confiança**: Score de 0.0 a 1.0 baseado em consenso
4. **Priorização**:
   - 4 fontes concordam: 1.0
   - 3 fontes concordam: 0.75
   - 2 fontes concordam: 0.5
   - Menos de 2: 0.0

**Arquivo:** `backend/src/scrapers/scrapers.service.ts`

---

## 📝 CONVENÇÕES DE CÓDIGO

### TypeScript

**Nomenclatura:**
- Classes: `PascalCase` (ex: `AssetService`)
- Interfaces: `PascalCase` com prefixo `I` opcional (ex: `IAssetRepository` ou `AssetRepository`)
- Enums: `PascalCase` (ex: `AssetType`)
- Variáveis/funções: `camelCase` (ex: `findAssetByTicker`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_RETRY_COUNT`)
- Arquivos: `kebab-case` (ex: `asset.service.ts`)

**Imports:**
- Absolutos usando `@` aliases (configurado em `tsconfig.json`)
```typescript
import { AssetService } from '@api/assets/asset.service';
import { Asset } from '@database/entities';
```

**DTOs:**
- Sempre usar `class-validator` para validação
- Sempre usar `class-transformer` para transformação
```typescript
export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsOptional()
  @IsString()
  name?: string;
}
```

### Git

**Branches:**
- `main`: Produção
- `develop`: Desenvolvimento
- `feature/nome-feature`: Features
- `fix/nome-bug`: Correções

**Commits:**
Seguir Conventional Commits:
```
feat: Adicionar endpoint de análise completa
fix: Corrigir cálculo de variação de preço
docs: Atualizar README com novas fontes
refactor: Refatorar serviço de scrapers
test: Adicionar testes unitários para AssetService
chore: Atualizar dependências do projeto
```

**Pull Requests:**
- Sempre incluir descrição detalhada
- Sempre linkar issue relacionada
- Sempre solicitar review
- Sempre incluir co-autoria do Claude:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Fluxo de Sincronização de Ativos (BRAPI)

```
1. User clica "Sincronizar" no frontend
2. Frontend chama POST /api/v1/assets/sync
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
4. Retorna resumo: total, created, updated, failed
5. Frontend mostra toast com resultado
```

**Arquivo:** `backend/src/api/assets/assets.service.ts:180-280`

### 2. Fluxo de Análise Fundamentalista

```
1. User clica "Solicitar Análise" para PETR4
2. Frontend chama POST /api/v1/analysis/fundamental/PETR4
3. Backend (AnalysisService):
   - Cria registro de análise com status=PROCESSING
   - Chama ScrapersService.scrapeFundamentalData('PETR4')
4. ScrapersService:
   - Executa 4 scrapers em paralelo (Promise.allSettled):
     a. FundamentusScraper
     b. BrapiScraper
     c. StatusInvestScraper
     d. Investidor10Scraper
   - Cross-validation:
     a. Merge de dados
     b. Detecção de discrepâncias
     c. Cálculo de confiança
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

### 3. Fluxo de Análise em Massa (Bulk Analysis)

```
1. User clica "Solicitar Análises em Massa" na página /analysis
2. Frontend chama POST /api/v1/analysis/bulk/request
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

## 🧩 DECISÕES TÉCNICAS

### 1. Por que NestJS no backend?

**Motivos:**
- ✅ Arquitetura modular e escalável
- ✅ TypeScript nativo com decorators
- ✅ Integração fácil com TypeORM
- ✅ Swagger/OpenAPI automático
- ✅ Dependency Injection robusto
- ✅ Ecosystem maduro (Queue, WebSocket, etc)

### 2. Por que Next.js 14 App Router?

**Motivos:**
- ✅ Server Components para performance
- ✅ Roteamento file-based intuitivo
- ✅ SSR e SSG nativos
- ✅ TypeScript first-class
- ✅ Integração com Shadcn/ui
- ✅ Otimizações automáticas (image, font, etc)

### 3. Por que PostgreSQL?

**Motivos:**
- ✅ ACID compliant (confiabilidade)
- ✅ JSON support para campos flexíveis
- ✅ Indexes avançados (GIN, GiST)
- ✅ Window functions para análises
- ✅ Extensões (pg_stat_statements, etc)
- ✅ Grátis e open-source

### 4. Por que BullMQ + Redis?

**Motivos:**
- ✅ Queue distribuída e escalável
- ✅ Retry automático em falhas
- ✅ Rate limiting nativo
- ✅ Dashboard de monitoramento
- ✅ Priorização de jobs
- ✅ Agendamento de tarefas (cron)

### 5. Por que Python para scrapers?

**Motivos:**
- ✅ Playwright melhor que Puppeteer
- ✅ BeautifulSoup para parsing HTML
- ✅ Ecosystem rico para scraping
- ✅ Requests/HTTPX para APIs
- ✅ Fácil integração com NestJS via API

### 6. Por que TypeORM?

**Motivos:**
- ✅ TypeScript nativo
- ✅ Migrations automáticas
- ✅ Decorators para entidades
- ✅ QueryBuilder type-safe
- ✅ Relacionamentos complexos
- ✅ Integração perfeita com NestJS

---

## 🗺️ ROADMAP

### FASE 1-10: Backend Core ✅ COMPLETO
- [x] Setup inicial (Docker, PostgreSQL, NestJS)
- [x] Entidades básicas (Assets, AssetPrices)
- [x] Scrapers fundamentalistas (4 fontes)
- [x] Cross-validation de dados
- [x] Análise fundamentalista
- [x] Análise técnica
- [x] Análise completa
- [x] Sistema de portfólio
- [x] Autenticação OAuth
- [x] WebSocket real-time

### FASE 11: Frontend Core ✅ EM ANDAMENTO
- [x] Dashboard principal
- [x] Página de ativos (/assets)
- [x] Página de análises (/analysis)
- [x] Página de portfólio (/portfolio)
- [ ] Página de relatórios (/reports)
- [ ] Página de configurações (/settings)

### FASE 12-21: Validação Frontend 🔄 PLANEJADO
- [ ] FASE 12: Responsividade (mobile, tablet, desktop)
- [ ] FASE 13: Navegação (links, breadcrumbs, sidebar)
- [ ] FASE 14: Performance (loading, lazy, caching)
- [ ] FASE 15: Network (requests, errors, retries)
- [ ] FASE 16: Console (0 erros, 0 warnings)
- [ ] FASE 17: Browser Compatibility (Chrome, Firefox, Edge)
- [ ] FASE 18: TypeScript (0 erros, strict mode)
- [ ] FASE 19: Integrações Complexas (WebSocket, OAuth)
- [ ] FASE 20: Estados e Transições (loading, success, error)
- [ ] FASE 21: Acessibilidade (a11y, ARIA, keyboard)

### FASE 22: Sistema de Atualização de Ativos ✅ 100% COMPLETO
- [x] Entidades (UpdateLog)
- [x] Migrations
- [x] AssetsUpdateService (574 linhas)
- [x] AssetsUpdateController (279 linhas)
- [x] Jobs BullMQ (daily, single, retry, batch) + Processor (175 linhas)
- [x] WebSocket events (6 eventos)
- [x] Frontend components (AssetUpdateButton, BatchUpdateControls, OutdatedBadge, UpdateProgressBar)
- [x] Integração Portfolio Page
- [x] Testes Visuais (Validados 2025-11-12)

**Referência:** `ROADMAP_SISTEMA_ATUALIZACAO_ATIVOS.md`
**Status:** Sistema 100% implementado e funcional
**Validação:** TypeScript 0 erros, Build OK, Componentes UI testados

### FASE 23: Dados Históricos BRAPI 🔜 PLANEJADO
- [ ] Pesquisar endpoints BRAPI para histórico
- [ ] Verificar períodos disponíveis (diário, semanal, mensal, anual, 3-10 anos)
- [ ] Comparar com Investing.com
- [ ] Planejar estrutura de tabela
- [ ] Planejar endpoint backend
- [ ] Planejar componente frontend

### FASE 24: Refatoração Botão "Solicitar Análises" ⏳ AGUARDANDO APROVAÇÃO
- [ ] Remover botão de /assets
- [ ] Adicionar botão em /analysis (função já existe)
- [ ] Adicionar Tooltip sobre coleta multi-fonte
- [ ] Validar backend coleta de TODAS as fontes
- [ ] Testes de funcionalidade

**Referência:** `REFATORACAO_BOTAO_SOLICITAR_ANALISES.md`

### FASE 25+: Features Futuras 🔮
- [ ] Implementar scrapers: Fundamentei, Investsite
- [ ] Sistema de alertas e notificações
- [ ] Análise de opções (vencimentos, IV, greeks)
- [ ] Análise de insiders
- [ ] Análise de dividendos
- [ ] Análise macroeconômica
- [ ] Análise de correlações
- [ ] Integração com IAs (ChatGPT, Claude, Gemini)
- [ ] Importação de portfólios (Kinvo, B3, MyProfit, etc)
- [ ] Mobile app (React Native)
- [ ] CI/CD completo
- [ ] Testes automatizados (>80% coverage)

---

## 🔧 TROUBLESHOOTING

### Problema: Backend não compila

**Sintomas:**
```
Error: Cannot find module '@api/assets/assets.service'
```

**Solução:**
1. Verificar `tsconfig.json` tem paths configurados:
```json
{
  "compilerOptions": {
    "paths": {
      "@api/*": ["src/api/*"],
      "@database/*": ["src/database/*"],
      "@scrapers/*": ["src/scrapers/*"]
    }
  }
}
```

2. Reiniciar TypeScript server no VSCode: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`

---

### Problema: Frontend não conecta ao backend

**Sintomas:**
```
Error: Network Error - ERR_CONNECTION_REFUSED
```

**Solução:**
1. Verificar se backend está rodando: `docker ps | grep invest_backend`
2. Verificar variável de ambiente: `NEXT_PUBLIC_API_URL=http://localhost:3101`
3. Verificar CORS no backend (`main.ts`):
```typescript
app.enableCors({
  origin: 'http://localhost:3100',
  credentials: true,
});
```

---

### Problema: Scraper retorna dados vazios

**Sintomas:**
```
ScraperResult { data: {}, confidence: 0.0 }
```

**Solução:**
1. Verificar se site mudou estrutura HTML
2. Rodar scraper manualmente para debug:
```bash
cd backend
npm run test:scraper -- PETR4
```
3. Verificar logs do scraper:
```bash
docker logs invest_backend | grep "Scraper"
```
4. Atualizar seletores CSS/XPath no scraper

---

### Problema: Migration falha

**Sintomas:**
```
QueryFailedError: column "change" already exists
```

**Solução:**
1. Verificar migrations executadas:
```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

2. Reverter migration:
```bash
cd backend
npm run migration:revert
```

3. Corrigir migration e re-executar:
```bash
npm run migration:run
```

---

### Problema: WebSocket não conecta

**Sintomas:**
```
WebSocket connection failed
```

**Solução:**
1. Verificar URL do WebSocket: `http://localhost:3101` (mesma porta do backend)
2. Verificar variável: `NEXT_PUBLIC_WS_URL=http://localhost:3101`
3. Verificar backend tem Gateway configurado:
```typescript
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3100',
    credentials: true,
  },
})
```

---

### Problema: Docker container não inicia

**Sintomas:**
```
Error: Container invest_postgres exited with code 1
```

**Solução:**
1. Verificar logs:
```bash
docker logs invest_postgres
```

2. Verificar volume:
```bash
docker volume inspect invest_postgres_data
```

3. Recriar container:
```bash
docker-compose down
docker volume rm invest_postgres_data
docker-compose up -d
```

---

## 📚 REFERÊNCIAS

### Documentação Oficial
- NestJS: https://docs.nestjs.com
- Next.js: https://nextjs.org/docs
- TypeORM: https://typeorm.io
- BullMQ: https://docs.bullmq.io
- Shadcn/ui: https://ui.shadcn.com

### Documentos do Projeto
- `README.md`: Documentação pública
- `VALIDACAO_FRONTEND_COMPLETA.md`: Plano de validação frontend (24 fases)
- `ROADMAP_SISTEMA_ATUALIZACAO_ATIVOS.md`: Sistema de atualização
- `REFATORACAO_BOTAO_SOLICITAR_ANALISES.md`: Refatoração planejada
- `CORRECAO_VARIACAO_ATIVOS.md`: Correção de variação BRAPI

### Commits Importantes
- `43b197d`: Correção de variação (BRAPI)
- `c6ba377`: Correção OAuth Google
- `7531bc9`: Autenticação com Cookie

---

**Fim do claude.md**
