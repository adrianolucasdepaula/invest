# 🤖 AGENTES ESPECIALIZADOS - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Data de Criação:** 2025-11-15
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Quando Criar Agentes](#quando-criar-agentes)
3. [Agentes de Desenvolvimento](#agentes-de-desenvolvimento)
4. [Agentes de Qualidade e Validação](#agentes-de-qualidade-e-validação)
5. [Agentes de Dados e Scrapers](#agentes-de-dados-e-scrapers)
6. [Agentes de Arquitetura](#agentes-de-arquitetura)
7. [Agentes de Análise e Inteligência](#agentes-de-análise-e-inteligência)
8. [Como Invocar Agentes](#como-invocar-agentes)

---

## 🎯 VISÃO GERAL

Este documento define agentes especializados (subagentes via Task tool) para auxiliar no desenvolvimento e manutenção da plataforma B3 AI Analysis. Cada agente tem **responsabilidades específicas** e **contexto de domínio profundo**.

### Princípios dos Agentes

- ✅ **Especialização**: Cada agente domina um domínio específico
- ✅ **Autonomia**: Agentes tomam decisões dentro do seu escopo
- ✅ **Ultra-Thinking**: Todos usam análise profunda antes de executar
- ✅ **Documentação**: Agentes retornam relatórios detalhados
- ✅ **Validação**: Agentes validam suas próprias entregas

---

## 🔧 QUANDO CRIAR AGENTES

### Usar Agente SE:

1. **Complexidade Alta**: Tarefa > 50 linhas de código
2. **Domínio Específico**: Requer conhecimento especializado
3. **Múltiplos Arquivos**: Afeta 5+ arquivos simultaneamente
4. **Cross-Validation**: Precisa validar em múltiplas camadas
5. **Análise Profunda**: Requer investigação extensa
6. **Paralelização**: Pode executar tarefas em paralelo

### NÃO Usar Agente SE:

1. **Tarefa Trivial**: < 10 linhas de código
2. **Escopo Claro**: Mudança em 1-2 arquivos conhecidos
3. **Fix Simples**: Correção de typo ou import
4. **Validação Rápida**: `tsc --noEmit` apenas

---

## 💻 AGENTES DE DESENVOLVIMENTO

### 1. Backend API Expert

**Nome:** `backend-api-expert`
**Domínio:** NestJS, TypeORM, API REST

**Responsabilidades:**
- Criar/modificar controllers, services, DTOs
- Implementar endpoints REST com validação completa
- Gerenciar relacionamentos TypeORM
- Aplicar padrões NestJS (DI, decorators, pipes)
- Garantir TypeScript 0 erros + Build Success

**Quando Invocar:**
- "Criar endpoint para análise de dividendos"
- "Implementar CRUD de watchlist"
- "Adicionar validação em DTO de portfólio"
- "Refatorar AssetsService para melhor performance"

**Arquivos de Contexto:**
- `backend/src/api/**/*.ts`
- `backend/src/database/entities/**/*.ts`
- `DATABASE_SCHEMA.md`
- `ARCHITECTURE.md` (seção Backend)

**Validações Obrigatórias:**
```bash
cd backend
npx tsc --noEmit  # 0 erros
npm run build     # Compiled successfully
npm run test      # (se testes implementados)
```

**Exemplo de Prompt:**
```
Usar agente backend-api-expert para:

Criar endpoint GET /api/v1/assets/:ticker/dividends que retorna histórico de dividendos.

Contexto:
- Já existe entidade AssetPrices
- Precisa criar DTO DividendHistoryDto
- Implementar em AssetsController + AssetsService
- Validar com TypeScript + Build

Retornar:
- Arquivos modificados/criados
- Validações executadas (checklist completo)
- Exemplo de response
```

---

### 2. Frontend Components Expert

**Nome:** `frontend-components-expert`
**Domínio:** Next.js 14, React, Shadcn/ui, TailwindCSS

**Responsabilidades:**
- Criar/modificar componentes React
- Implementar páginas Next.js (App Router)
- Aplicar design system (Shadcn/ui)
- Gerenciar estado com React Query + Context API
- Garantir responsividade e acessibilidade

**Quando Invocar:**
- "Criar componente DividendHistoryChart"
- "Implementar página /watchlist"
- "Adicionar modal de confirmação de exclusão"
- "Refatorar AssetCard para melhor UX"

**Arquivos de Contexto:**
- `frontend/src/app/**/*.tsx`
- `frontend/src/components/**/*.tsx`
- `frontend/src/lib/hooks/**/*.ts`
- `ARCHITECTURE.md` (seção Frontend)

**Validações Obrigatórias:**
```bash
cd frontend
npx tsc --noEmit  # 0 erros
npm run build     # Build succeeded (X páginas)
npm run lint      # 0 errors
```

**Exemplo de Prompt:**
```
Usar agente frontend-components-expert para:

Criar página /watchlist com:
- Listagem de ativos favoritos
- Botão "Adicionar ativo"
- Card com preço, variação, gráfico sparkline
- Filtro por setor
- Responsivo (mobile, tablet, desktop)

Contexto:
- Usar Shadcn/ui (Card, Button, Input)
- Integrar com hook useWatchlist
- Lazy loading do gráfico

Retornar:
- Arquivos criados
- Screenshot ou descrição da UI
- Validações completas
```

---

### 3. Database Migration Expert

**Nome:** `database-migration-expert`
**Domínio:** PostgreSQL, TypeORM, Migrations, Schema Design

**Responsabilidades:**
- Criar/modificar entities TypeORM
- Gerar migrations seguras
- Projetar relacionamentos (1:N, N:M)
- Criar indexes para performance
- Validar integridade referencial

**Quando Invocar:**
- "Criar tabela watchlist com relacionamento User <-> Assets"
- "Adicionar campo 'tags' em Assets (array)"
- "Criar index em asset_prices.date para otimizar queries"
- "Migrar campo 'sector' para tabela separada 'sectors'"

**Arquivos de Contexto:**
- `backend/src/database/entities/**/*.ts`
- `backend/src/database/migrations/**/*.ts`
- `DATABASE_SCHEMA.md`

**Validações Obrigatórias:**
```bash
cd backend
npx tsc --noEmit                    # 0 erros
npm run migration:generate --name=  # Gera migration
npm run migration:run               # Aplica no DB
psql -U invest_user -d invest_db -c '\dt'  # Verifica tabelas
```

**Exemplo de Prompt:**
```
Usar agente database-migration-expert para:

Criar tabela 'watchlists' com:
- id (PK)
- user_id (FK -> users)
- name (string, unique por user)
- created_at, updated_at

Relacionamento N:M com 'assets':
- Tabela pivot: watchlist_assets
- Campos: watchlist_id, asset_id, added_at

Contexto:
- Seguir padrão de outras entities
- Adicionar indexes em FKs
- Gerar migration TypeORM

Retornar:
- Entity criada
- Migration gerada
- SQL da migration (para revisão)
- Validações completas
```

---

### 4. WebSocket Real-time Expert

**Nome:** `websocket-realtime-expert`
**Domínio:** Socket.io, Eventos Real-time, BullMQ

**Responsabilidades:**
- Implementar eventos WebSocket
- Criar listeners e emitters
- Integrar com BullMQ (jobs assíncronos)
- Gerenciar rooms/namespaces
- Validar comunicação bidirecional

**Quando Invocar:**
- "Implementar evento 'watchlist:updated' via WebSocket"
- "Criar sistema de notificações real-time"
- "Adicionar progress bar para batch updates"
- "Implementar chat de suporte ao vivo"

**Arquivos de Contexto:**
- `backend/src/websocket/**/*.ts`
- `backend/src/queue/**/*.ts`
- `frontend/src/lib/websocket.ts`

**Validações Obrigatórias:**
```bash
# Backend
cd backend && npx tsc --noEmit && npm run build

# Frontend (testar conexão)
cd frontend && npm run dev
# Abrir console: verificar "WebSocket connected"

# Testar evento
curl -X POST http://localhost:3101/api/v1/test-emit
# Verificar se frontend recebe evento
```

**Exemplo de Prompt:**
```
Usar agente websocket-realtime-expert para:

Implementar evento real-time 'price:updated' que:
- Emite quando preço de ativo é atualizado
- Payload: { ticker, price, change, changePercent }
- Frontend recebe e atualiza card sem reload

Contexto:
- Backend: EmitGateway já existe
- Frontend: useWebSocket hook já existe
- Integrar com AssetsUpdateService

Retornar:
- Código backend (emit)
- Código frontend (listener)
- Teste manual executado
- Validações completas
```

---

## ✅ AGENTES DE QUALIDADE E VALIDAÇÃO

### 5. TypeScript Validation Expert

**Nome:** `typescript-validation-expert`
**Domínio:** TypeScript, Type Safety, Linting

**Responsabilidades:**
- Garantir 0 erros TypeScript
- Validar strict mode compliance
- Resolver conflitos de tipos
- Aplicar best practices de TS
- Sugerir refatorações de tipos

**Quando Invocar:**
- "Validar TypeScript em todo o projeto (backend + frontend)"
- "Resolver erro 'Type X is not assignable to type Y'"
- "Adicionar tipos faltantes em hooks/utils"
- "Refatorar 'any' para tipos específicos"

**Arquivos de Contexto:**
- `backend/tsconfig.json`
- `frontend/tsconfig.json`
- Todos os `.ts` e `.tsx`

**Validações Obrigatórias:**
```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
# Resultado esperado: "Found 0 errors"
```

**Exemplo de Prompt:**
```
Usar agente typescript-validation-expert para:

Resolver erro TypeScript em frontend/src/lib/hooks/use-assets.ts:

"Property 'range' does not exist on type 'AssetPricesParams'"

Contexto:
- Adicionei parâmetro 'range' recentemente
- Precisa atualizar interface AssetPricesParams
- Validar em todos os hooks que usam esse tipo

Retornar:
- Tipos atualizados
- Arquivos afetados
- Validação TypeScript completa (0 erros)
```

---

### 6. Build & Performance Expert

**Nome:** `build-performance-expert`
**Domínio:** Build Process, Bundle Size, Performance

**Responsabilidades:**
- Garantir build success (backend + frontend)
- Otimizar bundle size
- Implementar code splitting
- Configurar lazy loading
- Analisar performance metrics

**Quando Invocar:**
- "Build do frontend está falhando com erro X"
- "Bundle size > 2MB, otimizar"
- "Adicionar lazy loading em página /analysis"
- "Configurar dynamic imports para components pesados"

**Arquivos de Contexto:**
- `backend/package.json` (scripts de build)
- `frontend/next.config.js`
- `frontend/package.json`

**Validações Obrigatórias:**
```bash
cd backend
npm run build
# "Compiled successfully"

cd frontend
npm run build
# "Compiled successfully"
# "X static pages generated"
```

**Exemplo de Prompt:**
```
Usar agente build-performance-expert para:

Otimizar bundle do frontend:
- Analisar bundle size atual
- Implementar lazy loading em Charts
- Configurar dynamic imports para Recharts
- Validar que build continua funcionando

Contexto:
- Usar React.lazy + Suspense
- Já existe lazy loading em algumas páginas

Retornar:
- Bundle size antes/depois
- Arquivos modificados
- Build completo (success)
```

---

### 7. Accessibility (A11y) Expert

**Nome:** `accessibility-expert`
**Domínio:** WCAG 2.1, ARIA, Keyboard Navigation, Screen Readers

**Responsabilidades:**
- Auditar acessibilidade com axe-core
- Implementar ARIA labels/roles
- Garantir navegação por teclado
- Validar contraste de cores
- Testar com leitores de tela

**Quando Invocar:**
- "Auditar acessibilidade da página /dashboard"
- "Adicionar ARIA labels em AssetCard"
- "Implementar navegação por teclado em DataTable"
- "Corrigir contraste de cores em botões"

**Arquivos de Contexto:**
- `frontend/src/app/**/*.tsx`
- `frontend/src/components/**/*.tsx`
- `VALIDACAO_FASE_21_ACESSIBILIDADE.md`

**Validações Obrigatórias:**
```bash
# Usar MCP A11y para auditoria
mcp__a11y__audit_webpage http://localhost:3100/dashboard

# Resultado esperado:
# - 0 critical violations
# - 0 serious violations
```

**Exemplo de Prompt:**
```
Usar agente accessibility-expert para:

Auditar e corrigir acessibilidade em /assets:
- Executar axe-core audit
- Corrigir todos os critical/serious
- Adicionar ARIA labels faltantes
- Validar navegação por Tab

Contexto:
- Usar MCP A11y
- Seguir padrões da FASE 21

Retornar:
- Violations encontrados (antes)
- Correções aplicadas
- Audit final (0 violations critical/serious)
```

---

### 8. E2E Testing Expert

**Nome:** `e2e-testing-expert`
**Domínio:** Playwright, Chrome DevTools, Selenium, Testes Automatizados

**Responsabilidades:**
- Criar testes E2E com Playwright
- Validar fluxos críticos
- Testar em múltiplos browsers
- Capturar screenshots/vídeos
- Gerar relatórios de testes

**Quando Invocar:**
- "Criar teste E2E para fluxo de análise completa"
- "Validar integração frontend-backend com MCP Playwright"
- "Testar sincronização de ativos em 3 browsers"
- "Criar suite de testes de regressão"

**Arquivos de Contexto:**
- `frontend/tests/**/*.spec.ts` (se existir)
- `VALIDACAO_MCP_TRIPLO_COMPLETA.md`
- `MCPS_USAGE_GUIDE.md`

**Validações Obrigatórias:**
```bash
npx playwright test
# Resultado esperado: "X tests passed"
```

**Exemplo de Prompt:**
```
Usar agente e2e-testing-expert para:

Criar teste E2E para fluxo:
1. Navegar para /assets
2. Clicar em "Sincronizar"
3. Aguardar toast "Sincronização concluída"
4. Validar que tabela foi atualizada

Contexto:
- Usar MCP Playwright
- Capturar screenshot de cada etapa
- Validar em Chrome + Firefox

Retornar:
- Arquivo de teste criado
- Screenshots das etapas
- Resultado dos testes (passed/failed)
```

---

## 📊 AGENTES DE DADOS E SCRAPERS

### 9. Scraper Development Expert

**Nome:** `scraper-development-expert`
**Domínio:** Playwright, Python, BeautifulSoup, OAuth, Data Extraction

**Responsabilidades:**
- Criar novos scrapers (TypeScript ou Python)
- Implementar autenticação (OAuth, token, user/pass)
- Extrair dados de HTML/APIs
- Implementar retry logic e error handling
- Validar dados extraídos

**Quando Invocar:**
- "Criar scraper para Fundamentei (Google OAuth)"
- "Implementar scraper de dividendos para Investidor10"
- "Adicionar retry logic em StatusInvestScraper"
- "Refatorar scraper BRAPI para usar cache Redis"

**Arquivos de Contexto:**
- `backend/src/scrapers/**/*.ts`
- `backend/python-scrapers/**/*.py`
- `DOCUMENTACAO_SCRAPERS_COMPLETA.md`

**Validações Obrigatórias:**
```bash
# Testar scraper individual
cd backend
npm run test:scraper:fundamentus

# Validar dados retornados
curl http://localhost:3101/api/v1/scrapers/test/PETR4
# Verificar JSON com campos esperados
```

**Exemplo de Prompt:**
```
Usar agente scraper-development-expert para:

Criar scraper para Fundamentei:
- URL: https://fundamentei.com
- Auth: Google OAuth (já temos oauth_session_manager.py)
- Dados: P/L, P/VP, Dividend Yield, ROE

Contexto:
- Seguir padrão de StatusInvestScraper
- Usar Playwright para navegação
- Salvar em ScraperMetrics

Retornar:
- Scraper implementado (fundamentei.scraper.ts)
- Teste manual executado (PETR4)
- Dados extraídos (exemplo JSON)
- Validações completas
```

---

### 10. Cross-Validation Expert

**Nome:** `cross-validation-expert`
**Domínio:** Data Validation, Multi-Source Reconciliation, Confidence Scoring

**Responsabilidades:**
- Implementar cross-validation de dados
- Detectar discrepâncias entre fontes
- Calcular scores de confiança
- Gerar relatórios de qualidade
- Sugerir fontes adicionais

**Quando Invocar:**
- "Validar dados fundamentalistas de PETR4 (6 fontes)"
- "Implementar cross-validation para dividendos"
- "Detectar discrepâncias em P/L entre fontes"
- "Melhorar algoritmo de confidence score"

**Arquivos de Contexto:**
- `backend/src/scrapers/scrapers.service.ts` (método crossValidate)
- `ARCHITECTURE.md` (seção Cross-Validation)

**Validações Obrigatórias:**
```bash
# Executar análise fundamentalista
curl -X POST http://localhost:3101/api/v1/analysis/fundamental/PETR4

# Validar confidence score
# Esperado: 0.8 - 1.0 (6 fontes concordam)
```

**Exemplo de Prompt:**
```
Usar agente cross-validation-expert para:

Analisar discrepâncias em P/L de PETR4:
- Fundamentus: 8.5
- BRAPI: 8.3
- StatusInvest: 8.6
- Investidor10: null
- Fundamentei: 8.4
- Investsite: 8.5

Contexto:
- Threshold atual: 10%
- Método: média aritmética

Retornar:
- Análise das discrepâncias
- Confidence score calculado
- Sugestão de threshold ideal
- Outliers detectados (se houver)
```

---

### 11. OAuth Session Expert

**Nome:** `oauth-session-expert`
**Domínio:** OAuth 2.0, Google OAuth, Session Management, Token Refresh

**Responsabilidades:**
- Gerenciar sessões OAuth
- Implementar token refresh automático
- Diagnosticar problemas de autenticação
- Criar fluxos de re-autenticação
- Documentar credenciais e APIs

**Quando Invocar:**
- "Corrigir token expirado de StatusInvest"
- "Implementar auto-refresh de token Google OAuth"
- "Adicionar novo site OAuth (Fundamentei)"
- "Diagnosticar erro 401 em scraper OAuth"

**Arquivos de Contexto:**
- `backend/python-scrapers/oauth_session_manager.py`
- `backend/python-scrapers/oauth_sites_config.py`
- `OAUTH_FIX_FUNDAMENTEI.md` (se existir)

**Validações Obrigatórias:**
```bash
# Testar sessão OAuth
python backend/python-scrapers/oauth_session_manager.py --site statusinvest --test

# Resultado esperado:
# "Session valid: True"
# "Token expires in: X hours"
```

**Exemplo de Prompt:**
```
Usar agente oauth-session-expert para:

Adicionar suporte OAuth para Fundamentei:
- URL: https://fundamentei.com
- Auth: Google OAuth
- Scopes: profile, email

Contexto:
- Seguir padrão de statusinvest em oauth_sites_config.py
- Usar oauth_session_manager.py
- Adicionar em /oauth-manager do frontend

Retornar:
- Configuração adicionada
- Teste de autenticação (screenshot)
- Token salvo em cookies_fundamentei.pkl
- Validações completas
```

---

## 🏗️ AGENTES DE ARQUITETURA

### 12. Architecture Refactoring Expert

**Nome:** `architecture-refactoring-expert`
**Domínio:** Design Patterns, SOLID, Clean Architecture, Modularização

**Responsabilidades:**
- Refatorar código legado
- Aplicar design patterns (Repository, Factory, Strategy)
- Modularizar código monolítico
- Melhorar separation of concerns
- Documentar decisões arquiteturais

**Quando Invocar:**
- "Refatorar AssetsService (> 500 linhas)"
- "Separar lógica de cross-validation em service dedicado"
- "Aplicar Repository Pattern em scrapers"
- "Modularizar sistema de relatórios"

**Arquivos de Contexto:**
- `backend/src/api/**/*.ts`
- `ARCHITECTURE.md`
- `REFATORACAO_SISTEMA_REPORTS.md` (se existir)

**Validações Obrigatórias:**
```bash
cd backend
npx tsc --noEmit  # 0 erros
npm run build     # Compiled successfully
npm run test      # (se testes existem) All tests passed
```

**Exemplo de Prompt:**
```
Usar agente architecture-refactoring-expert para:

Refatorar AssetsService (580 linhas):
- Separar lógica de sync em AssetsSyncService
- Separar lógica de update em AssetsUpdateService
- Manter AssetsService como orquestrador

Contexto:
- Seguir padrão NestJS (Injectable, providers)
- Manter backward compatibility
- Atualizar imports em controllers

Retornar:
- Arquivos criados/modificados
- Diagrama de nova arquitetura
- Validações completas (TypeScript + Build)
- Breaking changes (se houver)
```

---

### 13. Performance Optimization Expert

**Nome:** `performance-optimization-expert`
**Domínio:** Query Optimization, Caching, Indexes, Lazy Loading

**Responsabilidades:**
- Otimizar queries SQL/TypeORM
- Implementar caching (Redis)
- Criar indexes em colunas chave
- Implementar pagination
- Analisar bottlenecks

**Quando Invocar:**
- "Otimizar query de listagem de ativos (> 2s)"
- "Implementar cache Redis para price history"
- "Adicionar pagination em /api/v1/assets"
- "Criar index em asset_prices.date"

**Arquivos de Contexto:**
- `backend/src/api/**/*.service.ts`
- `backend/src/database/entities/**/*.ts`
- `DATABASE_SCHEMA.md`

**Validações Obrigatórias:**
```bash
# Medir performance ANTES
time curl http://localhost:3101/api/v1/assets

# Aplicar otimizações

# Medir performance DEPOIS
time curl http://localhost:3101/api/v1/assets

# Esperado: Redução de X% no tempo
```

**Exemplo de Prompt:**
```
Usar agente performance-optimization-expert para:

Otimizar endpoint GET /api/v1/assets/:ticker/price-history:
- Query atual: 2.5s (range=1y)
- Problema: Full table scan em 10k+ registros

Contexto:
- Tabela: asset_prices (columns: ticker, date, close, high, low, open, volume)
- Sem index em date
- Sem cache

Retornar:
- Index criado (SQL)
- Cache implementado (Redis)
- Performance antes/depois (curl time)
- Validações completas
```

---

### 14. Database Schema Expert

**Nome:** `database-schema-expert`
**Domínio:** Schema Design, Normalization, Relationships, Constraints

**Responsabilidades:**
- Projetar schemas otimizados
- Normalizar dados (3NF)
- Criar relacionamentos eficientes
- Definir constraints (FK, unique, check)
- Documentar schema completo

**Quando Invocar:**
- "Projetar schema para sistema de alertas"
- "Normalizar tabela de análises (remover duplicação)"
- "Criar relacionamento N:M entre Users e Watchlists"
- "Adicionar constraints de integridade em portfolios"

**Arquivos de Contexto:**
- `backend/src/database/entities/**/*.ts`
- `DATABASE_SCHEMA.md`

**Validações Obrigatórias:**
```bash
# Gerar migration
cd backend
npm run migration:generate --name=create_watchlists

# Revisar SQL gerado
cat src/database/migrations/*.ts

# Aplicar migration
npm run migration:run

# Validar no DB
psql -U invest_user -d invest_db -c '\d+ watchlists'
```

**Exemplo de Prompt:**
```
Usar agente database-schema-expert para:

Projetar schema para sistema de alertas de preço:

Requisitos:
- User pode criar alertas para ticker
- Tipos: "preço acima de X", "preço abaixo de X", "variação > Y%"
- Status: active, triggered, expired
- Histórico de triggers

Contexto:
- Relacionamento: User 1:N Alerts
- Relacionamento: Asset 1:N Alerts
- Precisar de indexes para queries rápidas

Retornar:
- Diagrama ER
- Entities TypeORM
- Migrations SQL
- Indexes criados
- Documentação em DATABASE_SCHEMA.md
```

---

## 🧠 AGENTES DE ANÁLISE E INTELIGÊNCIA

### 15. Chart Analysis Expert

**Nome:** `chart-analysis-expert`
**Domínio:** Candlestick Charts, Technical Analysis, Charting Libraries

**Responsabilidades:**
- Implementar/corrigir gráficos financeiros
- Validar dados OHLC (Open, High, Low, Close)
- Configurar libraries (Recharts, lightweight-charts)
- Analisar padrões de candles
- Comparar com fontes de mercado

**Quando Invocar:**
- "Corrigir candlestick chart que não reflete dados corretos"
- "Implementar gráfico de volume abaixo dos candles"
- "Adicionar indicadores técnicos (RSI, MACD)"
- "Validar dados históricos com TradingView"

**Arquivos de Contexto:**
- `frontend/src/components/charts/**/*.tsx`
- `frontend/src/app/(dashboard)/assets/[ticker]/page.tsx`
- `FASE_24_DADOS_HISTORICOS.md`

**Validações Obrigatórias:**
```bash
# Testar dados backend
curl "http://localhost:3101/api/v1/assets/PETR4/price-history?range=1d"

# Validar frontend
# Usar MCP Chrome DevTools para:
# 1. Abrir http://localhost:3100/assets/PETR4
# 2. Take snapshot
# 3. Take screenshot
# 4. Validar que candles estão corretos
```

**Exemplo de Prompt:**
```
Usar agente chart-analysis-expert para:

Investigar por que candlestick chart não reflete período correto:
- Sintoma: Ao clicar em "1D", mostra dados de 1 mês
- Backend: Endpoint /price-history?range=1d
- Frontend: CandlestickChart component

Contexto:
- Usar MCP Chrome DevTools para validar
- Comparar com dados reais de TradingView/Status Invest
- Verificar mapping de ranges (1d, 1mo, 3mo, etc)

Retornar:
- Root cause identificado
- Correção aplicada (backend e/ou frontend)
- Validação com screenshot (1D mostrando 1 dia)
- Testes de todos os ranges (1D, 1MO, 3MO, 6MO, 1Y, 2Y, 5Y, MAX)
```

---

### 16. Data Quality Expert

**Nome:** `data-quality-expert`
**Domínio:** Data Validation, Anomaly Detection, Data Cleansing

**Responsabilidades:**
- Validar qualidade de dados scraped
- Detectar anomalias (outliers, nulls)
- Implementar data cleansing
- Gerar relatórios de qualidade
- Sugerir melhorias em scrapers

**Quando Invocar:**
- "Validar dados de PETR4 (todas as fontes)"
- "Detectar anomalias em price history"
- "Implementar validação de P/L (deve ser > 0)"
- "Gerar relatório de qualidade de scrapers"

**Arquivos de Contexto:**
- `backend/src/scrapers/**/*.ts`
- `backend/src/database/entities/**/*.ts`
- `DOCUMENTACAO_SCRAPERS_COMPLETA.md`

**Validações Obrigatórias:**
```bash
# Executar scraper e validar dados
curl -X POST http://localhost:3101/api/v1/analysis/fundamental/PETR4

# Verificar dados salvos
psql -U invest_user -d invest_db -c "SELECT * FROM analyses WHERE ticker = 'PETR4' ORDER BY created_at DESC LIMIT 1;"

# Validar campos:
# - Nenhum null em campos obrigatórios
# - P/L > 0
# - Dividend Yield entre 0 e 1
```

**Exemplo de Prompt:**
```
Usar agente data-quality-expert para:

Validar dados de PETR4 scraped de 6 fontes:

Checks:
- Campos obrigatórios não-null: ticker, sector, price
- Ranges válidos: P/L > 0, DY entre 0-1, ROE entre -1 e 1
- Outliers: Valores > 3 desvios-padrão da média
- Timestamps: created_at válido

Contexto:
- Executar scraper de todas as 6 fontes
- Comparar dados entre fontes
- Detectar discrepâncias > 10%

Retornar:
- Relatório de qualidade (por fonte)
- Anomalias detectadas (se houver)
- Sugestões de correção em scrapers
- Confidence score calculado
```

---

### 17. Documentation Expert

**Nome:** `documentation-expert`
**Domínio:** Technical Writing, Markdown, API Documentation

**Responsabilidades:**
- Criar/atualizar documentação técnica
- Gerar diagramas de arquitetura
- Documentar APIs (Swagger/OpenAPI)
- Criar guias de troubleshooting
- Manter README e CLAUDE.md atualizados

**Quando Invocar:**
- "Documentar FASE 25 (Sistema de Alertas)"
- "Atualizar DATABASE_SCHEMA.md com tabela watchlists"
- "Criar guia de troubleshooting para OAuth"
- "Gerar diagrama de arquitetura do sistema de relatórios"

**Arquivos de Contexto:**
- `*.md` (todos os arquivos de documentação)
- `backend/src/**/*.ts` (para extrair documentação de código)
- `CLAUDE.md` (instruções Claude)

**Validações Obrigatórias:**
```bash
# Validar links Markdown
# (usar ferramenta markdown-link-check se disponível)

# Validar sintaxe Markdown
# (usar ferramenta markdownlint se disponível)

# Revisar manualmente
# - Sem typos
# - Links funcionando
# - Code blocks corretos
```

**Exemplo de Prompt:**
```
Usar agente documentation-expert para:

Criar documentação FASE_25_SISTEMA_ALERTAS.md:

Conteúdo:
1. Problema identificado
2. Solução implementada
3. Arquivos modificados/criados
4. Schema de banco (tabela alerts)
5. Endpoints criados
6. Frontend implementado
7. Validações executadas
8. Screenshots (se houver)

Contexto:
- Seguir padrão de FASE_24_DADOS_HISTORICOS.md
- Incluir diagramas se necessário
- Atualizar ROADMAP.md com nova fase

Retornar:
- Arquivo FASE_25_SISTEMA_ALERTAS.md criado
- ROADMAP.md atualizado
- DATABASE_SCHEMA.md atualizado (se aplicável)
```

---

## 🚀 COMO INVOCAR AGENTES

### Sintaxe Básica (Task Tool)

```typescript
Task({
  subagent_type: "general-purpose",  // Ou agente específico (se implementado)
  description: "Breve descrição (3-5 palavras)",
  prompt: `
    Usar agente [NOME_DO_AGENTE] para:

    [TAREFA ESPECÍFICA]

    Contexto:
    - [CONTEXTO RELEVANTE]
    - [ARQUIVOS A LER]
    - [PADRÕES A SEGUIR]

    Retornar:
    - [DELIVERABLE 1]
    - [DELIVERABLE 2]
    - [VALIDAÇÕES EXECUTADAS]
  `,
  model: "sonnet"  // ou "haiku" para tarefas simples
})
```

### Exemplo Completo

```typescript
// Invocar Backend API Expert para criar endpoint
Task({
  subagent_type: "general-purpose",
  description: "Criar endpoint dividends",
  prompt: `
    Usar agente backend-api-expert para:

    Criar endpoint GET /api/v1/assets/:ticker/dividends que retorna:
    {
      ticker: string,
      dividends: [
        { date: string, value: number, type: 'JCP' | 'Dividendo' }
      ],
      total: number,
      averageYield: number
    }

    Contexto:
    - Criar em backend/src/api/assets/
    - Seguir padrão de AssetsController
    - DTO: DividendHistoryDto
    - Service: AssetsService.getDividendHistory()
    - Validar com class-validator

    Retornar:
    - Arquivos modificados/criados (lista completa)
    - Validações TypeScript (npx tsc --noEmit: 0 erros)
    - Build (npm run build: Compiled successfully)
    - Exemplo de response (JSON)
    - Teste com curl (exemplo de comando)
  `,
  model: "sonnet"
})
```

---

## 📊 MATRIZ DE DECISÃO (Quando Usar Cada Agente)

| Tarefa | Agente Recomendado | Motivo |
|--------|-------------------|--------|
| Criar endpoint REST | Backend API Expert | Domínio específico NestJS |
| Criar página Next.js | Frontend Components Expert | Domínio específico React/Next |
| Adicionar tabela DB | Database Migration Expert | Schema design + migration |
| Corrigir erro TypeScript | TypeScript Validation Expert | Especialista em tipos |
| Otimizar query lenta | Performance Optimization Expert | Query optimization |
| Criar scraper OAuth | Scraper Development Expert + OAuth Session Expert | Expertise combinada |
| Validar dados scraped | Data Quality Expert + Cross-Validation Expert | Análise de qualidade |
| Corrigir gráfico | Chart Analysis Expert | Domínio específico charts |
| Implementar WebSocket | WebSocket Real-time Expert | Eventos real-time |
| Refatorar código grande | Architecture Refactoring Expert | Design patterns |
| Auditar acessibilidade | Accessibility Expert | WCAG + ARIA |
| Criar testes E2E | E2E Testing Expert | Playwright + MCPs |
| Documentar fase | Documentation Expert | Technical writing |

---

## ✅ CHECKLIST DE INVOCAÇÃO DE AGENTE

Antes de invocar um agente, validar:

- [ ] Tarefa é complexa o suficiente? (> 50 linhas ou 5+ arquivos)
- [ ] Agente correto identificado? (ver matriz de decisão)
- [ ] Contexto completo fornecido? (arquivos, padrões, requisitos)
- [ ] Deliverables claros definidos? (o que retornar)
- [ ] Validações especificadas? (TypeScript, Build, Testes)
- [ ] Model adequado escolhido? (sonnet para complexo, haiku para simples)

---

## 🔗 REFERÊNCIAS

**Documentação do Projeto:**
- `CLAUDE.md` - Metodologia Claude Code
- `ARCHITECTURE.md` - Arquitetura do sistema
- `DATABASE_SCHEMA.md` - Schema do banco
- `MCPS_USAGE_GUIDE.md` - MCPs disponíveis
- `METODOLOGIA_MCPS_INTEGRADA.md` - Integração MCPs + Ultra-Thinking

**Arquivos de Validação:**
- `VALIDACAO_FRONTEND_COMPLETA.md` - 21 fases de validação
- `VALIDACAO_MCP_TRIPLO_COMPLETA.md` - Validação com 3 MCPs
- `TROUBLESHOOTING.md` - Problemas comuns e soluções

---

**Última atualização:** 2025-11-15
**Mantido por:** Claude Code (Sonnet 4.5)
