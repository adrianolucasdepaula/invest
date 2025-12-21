# CHECKLIST_ECOSSISTEMA_COMPLETO.md

**Versao:** 1.0.0
**Data:** 2025-12-15
**Proposito:** Checklist ultra-robusto para validacao 100% do ecossistema B3 AI Analysis Platform
**Complementa:** CHECKLIST_TODO_MASTER.md (nao substitui)

---

## INDICE

1. [PRE-DESENVOLVIMENTO (Context Loading)](#secao-1-pre-desenvolvimento-context-loading)
2. [ANALISE PRE-IMPLEMENTACAO](#secao-2-analise-pre-implementacao)
3. [DURANTE O DESENVOLVIMENTO](#secao-3-durante-o-desenvolvimento)
4. [VALIDACAO PRE-COMMIT](#secao-4-validacao-pre-commit)
5. [COMMIT E DOCUMENTACAO](#secao-5-commit-e-documentacao)
6. [VALIDACAO POS-IMPLEMENTACAO](#secao-6-validacao-pos-implementacao)
7. [TROUBLESHOOTING](#secao-7-troubleshooting)
8. [COBERTURA 100% DO ECOSSISTEMA](#secao-8-cobertura-100-do-ecossistema)
9. [TESTES PARALELOS COM AGENTES](#secao-9-testes-paralelos-com-agentes)
10. [OBSERVABILIDADE](#secao-10-observabilidade)
11. [INTEGRACOES CRITICAS](#secao-11-integracoes-criticas)
12. [VALIDACOES FALTANTES](#secao-12-validacoes-faltantes)
13. [GAPS DE TESTES](#secao-13-gaps-de-testes)
14. [AUTOMACAO EXISTENTE](#secao-14-automacao-existente)
15. [DATA FLOWS CRITICOS](#secao-15-data-flows-criticos)
16. [INVENTARIO DE SEGURANCA](#secao-16-inventario-de-seguranca)
17. [INVENTARIO DATABASE](#secao-17-inventario-database)
18. [INVENTARIO SCRAPERS](#secao-18-inventario-scrapers)
19. [INVENTARIO DOCKER](#secao-19-inventario-docker)
20. [INVENTARIO APIs EXTERNAS](#secao-20-inventario-apis-externas)
21. [INVENTARIO MCP E TOOLS](#secao-21-inventario-mcp-e-tools)

---

## SECAO 1: PRE-DESENVOLVIMENTO (Context Loading)

### 1.1 Leitura Obrigatoria de Documentacao

| Prioridade | Arquivo | Conteudo |
|------------|---------|----------|
| CRITICO | CLAUDE.md / GEMINI.md | Todas as regras (verificar se sao identicos) |
| CRITICO | .gemini/context/financial-rules.md | Dados financeiros |
| CRITICO | ARCHITECTURE.md | Arquitetura completa |
| IMPORTANTE | README.md | Overview do projeto |
| IMPORTANTE | ROADMAP.md | Historico de 117+ fases |
| IMPORTANTE | KNOWN-ISSUES.md | 19 issues com root cause |
| IMPORTANTE | DATABASE_SCHEMA.md | 26 entidades |
| IMPORTANTE | IMPLEMENTATION_PLAN.md | Template de fases |
| UTIL | INDEX.md | Indice de 300+ docs |
| UTIL | CHANGELOG.md | Historico de mudancas |
| UTIL | .gemini/context/conventions.md | Padroes de codigo |
| UTIL | .gemini/context/known-issues.md | Analise tecnica |

**Checklist:**
- [ ] CLAUDE.md / GEMINI.md lidos e identicos
- [ ] ARCHITECTURE.md consultado
- [ ] README.md revisado
- [ ] ROADMAP.md verificado (fase anterior completa?)
- [ ] KNOWN-ISSUES.md checado
- [ ] DATABASE_SCHEMA.md estudado
- [ ] .gemini/context/financial-rules.md lido (CRITICO)
- [ ] .gemini/context/conventions.md revisado

### 1.2 Verificacao de Estado do Ambiente

```bash
# Git status limpo?
git status
# Output esperado: "nothing to commit, working tree clean"

# Branch atualizada?
git pull origin main

# Docker containers rodando?
.\system-manager.ps1 status

# Health check completo?
.\system-manager.ps1 health
```

**Checklist:**
- [ ] Git status limpo (working tree clean)
- [ ] Branch atualizada com main
- [ ] Docker containers rodando (8 core services)
- [ ] Todas as portas respondendo (3100, 3101, 5532, 6479, 8000, 8001)
- [ ] Redis sem filas pausadas (`KEYS bull:*:meta-paused`)
- [ ] PostgreSQL acessivel
- [ ] Logs habilitados

### 1.3 Historico e Contexto Git

```bash
# Ultimos commits
git log --oneline -20

# Mudancas pendentes
git diff main

# Verificar conflitos
git merge main --no-commit --no-ff
git merge --abort  # Se nao houver conflitos
```

**Checklist:**
- [ ] `git log --oneline -20` revisado
- [ ] `git diff main` verificado
- [ ] Sem conflitos de merge

---

## SECAO 2: ANALISE PRE-IMPLEMENTACAO

### 2.1 Verificacao de Duplicidades

**Antes de criar qualquer novo componente/servico/funcao:**

```bash
# Pesquisar no codigo
grep -r "palavraChave" backend/src frontend/src

# Buscar em entities existentes
grep -r "class.*Entity" backend/src/database/entities

# Verificar controllers existentes
ls backend/src/api/*/controllers/
```

**Checklist:**
- [ ] Grep para funcao/componente existente
- [ ] Verificar ARCHITECTURE.md "Onde Armazenar Novos Dados"
- [ ] Consultar INDEX.md para docs relacionados
- [ ] Buscar em entities existentes
- [ ] Verificar controllers/services existentes

### 2.2 Analise de Dependencias

**Checklist:**
- [ ] Mapear imports afetados
- [ ] Verificar integracoes com outros modulos
- [ ] Checar fluxos que usam componente alvo
- [ ] Identificar testes que precisam atualizacao

### 2.3 Planejamento com Ultra-Thinking

**Checklist:**
- [ ] Usar Sequential Thinking MCP para analise profunda
- [ ] Criar TodoWrite com todas as tarefas
- [ ] Documentar decisoes arquiteturais
- [ ] Identificar riscos e mitigacoes

---

## SECAO 3: DURANTE O DESENVOLVIMENTO

### 3.1 Padroes Obrigatorios - Backend (NestJS)

**TypeScript:**
```bash
cd backend && npx tsc --noEmit  # 0 erros
```

**Checklist:**
- [ ] 0 erros TypeScript: `cd backend && npx tsc --noEmit`
- [ ] Usar class-validator para DTOs
- [ ] Logger estruturado (nao console.log)
- [ ] Decorators corretos (@Injectable, @Controller, etc.)

**Dados Financeiros (NAO-NEGOCIAVEL):**
```typescript
// CORRETO
import { Decimal } from 'decimal.js';
const price: Decimal = new Decimal('123.45');

// ERRADO - NUNCA USAR
const price: number = 123.45;  // Float tem imprecisao
```

**Checklist:**
- [ ] Decimal.js para valores monetarios (NUNCA Float)
- [ ] Precisao correta (2 decimais BRL, 4 decimais %)
- [ ] ROUND_HALF_UP para arredondamento
- [ ] Timezone America/Sao_Paulo

**Queries:**
- [ ] SEM N+1 queries (usar batch loading + Maps)
- [ ] Relations explicitas (nao `relations: ['*']`)
- [ ] Indexes para queries frequentes

### 3.2 Padroes Obrigatorios - Frontend (Next.js)

**TypeScript:**
```bash
cd frontend && npx tsc --noEmit  # 0 erros
```

**Checklist:**
- [ ] 0 erros TypeScript: `cd frontend && npx tsc --noEmit`
- [ ] Types explicitos (nao `any`)
- [ ] Props validadas

**Componentes:**
- [ ] Usar Shadcn/ui existentes
- [ ] React Query para server state
- [ ] Error boundaries implementados
- [ ] Acessibilidade (WCAG 2.1 AA)

### 3.3 Padroes Obrigatorios - Python Scrapers

**Playwright Pattern CORRETO - BeautifulSoup Single Fetch:**
```python
from bs4 import BeautifulSoup

# 1 UNICO await - rapido, ~10x mais rapido
html_content = await page.content()
soup = BeautifulSoup(html_content, 'html.parser')

# Parsing local SEM await - instantaneo
tables = soup.select("table")
for table in tables:
    rows = table.select("tr")
```

**ERRADO - Multiplos await (causa Exit 137):**
```python
# NAO FAZER - lento, pode estourar memoria
tables = await page.query_selector_all("table")  # LENTO
for table in tables:
    rows = await table.query_selector_all("tr")  # MUITOS awaits
```

**Checklist:**
- [ ] Single HTML fetch: `await page.content()` (1 await so)
- [ ] BeautifulSoup para parsing local (sem awaits)
- [ ] Browser individual por scraper
- [ ] `wait_until='load'` (nao 'networkidle')
- [ ] Performance < 10s por scrape
- [ ] Cookies ANTES de navigate

**Logging:**
- [ ] Loguru estruturado (nao print())
- [ ] Log antes/depois de cada passo major

### 3.4 Observabilidade

**Checklist:**
- [ ] Logs habilitados em todos os servicos
- [ ] Traces de execucao ativos
- [ ] Metricas de performance coletadas
- [ ] Audit trails configurados

---

## SECAO 4: VALIDACAO PRE-COMMIT

### 4.1 Zero Tolerance - Backend

```bash
cd backend
npx tsc --noEmit       # Deve retornar 0 erros
npm run build          # Deve completar sem erros
npm run lint           # 0 critical warnings
npm test               # Testes passando
```

### 4.2 Zero Tolerance - Frontend

```bash
cd frontend
npx tsc --noEmit       # Deve retornar 0 erros
npm run build          # Deve completar sem erros
npm run lint           # 0 critical warnings
```

### 4.3 MCP Triplo - Validacao Browser

```
1. mcp__playwright__browser_navigate + browser_snapshot
2. mcp__chrome-devtools__list_console_messages + list_network_requests
3. mcp__a11y__get_summary
```

**Checklist:**
- [ ] **Playwright:** Navegacao + snapshot
- [ ] **Chrome DevTools:** Console (0 errors) + Network (0 4xx/5xx)
- [ ] **A11y:** 0 violacoes criticas WCAG

> **⚠️ UPGRADE:** Para features complexas ou bugs >2h debug, use `/mcp-quadruplo` que adiciona **Documentation Research** (GitHub Issues + Docs Oficiais + KNOWN-ISSUES.md + Git History + WebSearch). Ver `docs/MCP_QUADRUPLO_METODOLOGIA.md`

### 4.3.1 MCP Quadruplo - Com Documentation Research (NOVO)

**Quando usar:** Feature complexa, bug desconhecido, nova biblioteca, integração

```
1. mcp__playwright__browser_navigate + browser_snapshot
2. mcp__chrome-devtools__list_console_messages + list_network_requests
3. mcp__a11y__get_summary
4. Documentation Research (5 sub-steps)
```

**Checklist:**
- [ ] **Etapas 1-3:** MCP Triplo completo
- [ ] **4.1 GitHub Issues:** Minimo 2 issues relevantes encontrados
- [ ] **4.2 Docs Oficiais:** Feature documentada e nao deprecated
- [ ] **4.3 KNOWN-ISSUES.md:** Issue similar checado (grep)
- [ ] **4.4 Git History:** Commits relacionados analisados
- [ ] **4.5 WebSearch Paralelo:** Minimo 3 fontes validando solucao

**ROI:** 15-30 min research economiza 2-8h debugging

### 4.4 Verificacao de Containers

```bash
.\system-manager.ps1 status    # Todos running
.\system-manager.ps1 health    # Todos healthy
```

---

## SECAO 5: COMMIT E DOCUMENTACAO

### 5.1 Conventional Commits

```
feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert
```

**Formato:**
```bash
git commit -m "feat(scope): descricao

- Detalhe 1
- Detalhe 2

Zero Tolerance validado
Documentacao atualizada

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5.2 Documentacao Obrigatoria

**Checklist:**
- [ ] CLAUDE.md atualizado (se novas regras)
- [ ] GEMINI.md sincronizado (100% identico)
- [ ] ARCHITECTURE.md (se novos componentes)
- [ ] ROADMAP.md (fase completa)
- [ ] CHANGELOG.md (mudancas notaveis)
- [ ] KNOWN-ISSUES.md (se novos issues)
- [ ] DATABASE_SCHEMA.md (se novas entities)

### 5.3 Git Workflow

**Checklist:**
- [ ] `git status` limpo
- [ ] Commit com mensagem descritiva
- [ ] Push para branch
- [ ] PR se necessario

---

## SECAO 6: VALIDACAO POS-IMPLEMENTACAO

### 6.1 Testes Massivos Frontend

**Paginas (18 total):**
- [ ] Dashboard
- [ ] Assets (lista + detalhes)
- [ ] Portfolio
- [ ] Analysis
- [ ] Reports
- [ ] Data Management
- [ ] Data Sources
- [ ] Discrepancies
- [ ] Settings
- [ ] OAuth Manager
- [ ] Wheel Strategies
- [ ] Login/Register

**Componentes Criticos (82 total):**
- [ ] Charts (candlestick, MACD, RSI)
- [ ] Tables (ordenacao, paginacao)
- [ ] Forms (validacao, submit)
- [ ] Modals (abertura, fechamento)
- [ ] Dropdowns (selecao)
- [ ] Buttons (acoes)
- [ ] Sync Progress (WebSocket)

### 6.2 Testes Backend

**Controllers (11 total):**
- [ ] Assets endpoints
- [ ] Auth endpoints
- [ ] Analysis endpoints
- [ ] Portfolio endpoints
- [ ] Reports endpoints
- [ ] Market Data endpoints
- [ ] Economic Indicators endpoints
- [ ] News endpoints
- [ ] Wheel endpoints
- [ ] Assets Update endpoints
- [ ] Data Sources endpoints

**Integracoes:**
- [ ] WebSocket funcionando
- [ ] BullMQ processando jobs
- [ ] Redis conectado
- [ ] PostgreSQL queries OK

### 6.3 Testes Infraestrutura

**Containers (13 total):**
- [ ] invest_postgres (5532)
- [ ] invest_redis (6479)
- [ ] invest_backend (3101)
- [ ] invest_frontend (3100)
- [ ] invest_python_service (8001)
- [ ] invest_scrapers (5900, 6080, 8000)
- [ ] invest_api_service (8000)
- [ ] invest_pgadmin (5150) - dev
- [ ] invest_redis_commander (8181) - dev

---

## SECAO 7: TROUBLESHOOTING

### 7.1 Diagnostico Inicial

```bash
# Verificar logs
docker logs <container> --tail 100

# Verificar status
.\system-manager.ps1 status

# Verificar health
.\system-manager.ps1 health

# Console do browser (Chrome DevTools MCP)
mcp__chrome-devtools__list_console_messages

# Network requests
mcp__chrome-devtools__list_network_requests
```

### 7.2 Problemas Conhecidos (Quick Reference)

| Problema | Causa Raiz | Solucao |
|----------|-----------|---------|
| Exit 137 scrapers | Multiplos awaits | BeautifulSoup pattern |
| BullMQ paused | Redis metadata | DEL bull:*:meta-paused |
| Dist cache stale | Docker volume | rm -rf /app/dist + restart |
| API 77s timeout | N+1 queries | Batch loading + Maps |
| SELIC 0.83% | Serie BCB errada | Usar serie 432 |
| Frontend cache | .next stale | volume rm + rebuild |

### 7.3 Root Cause Analysis Obrigatorio

**Checklist:**
- [ ] Identificar causa raiz (nao sintoma)
- [ ] Documentar em KNOWN-ISSUES.md
- [ ] Implementar correcao definitiva
- [ ] Adicionar prevencao

### 7.4 Anti-Patterns a Evitar

- [ ] Workarounds temporarios
- [ ] try-catch vazio
- [ ] console.log em producao
- [ ] Float para valores financeiros
- [ ] docker-compose down -v (NUNCA em producao)
- [ ] N+1 queries
- [ ] Multiplos awaits em loops (scrapers)

---

## SECAO 8: COBERTURA 100% DO ECOSSISTEMA

### 8.1 Frontend - Todas as 17 Paginas

| # | Pagina | Rota | Teste |
|---|--------|------|-------|
| 1 | Dashboard | `/` | Cards, graficos, indicadores |
| 2 | Assets List | `/assets` | Tabela, busca, paginacao |
| 3 | Asset Details | `/assets/[ticker]` | Header, precos, fundamentals, candlestick, MACD, RSI |
| 4 | Portfolio | `/portfolio` | CRUD posicoes |
| 5 | Analysis | `/analysis` | Solicitar, listar |
| 6 | Reports | `/reports` | PDF export |
| 7 | Data Management | `/data-management` | Sync bulk |
| 8 | Data Sources | `/data-sources` | Cross-validation |
| 9 | Discrepancies | `/discrepancies` | Resolucao |
| 10 | Settings | `/settings` | Configuracoes |
| 11 | OAuth Manager | `/oauth-manager` | 21 sites |
| 12 | Wheel | `/wheel` | Estrategia |
| 13 | Login | `/auth/login` | Autenticacao |
| 14 | Register | `/auth/register` | Cadastro |
| 15 | Callback | `/auth/callback/google` | OAuth |
| 16 | Not Found | `/404` | Erro 404 |
| 17 | Error | `/error` | Error boundary |

### 8.2 Backend - Todos os 11 Controllers

| # | Controller | Base Path | Endpoints Criticos |
|---|------------|-----------|-------------------|
| 1 | Assets | `/api/v1/assets` | GET list, GET :ticker |
| 2 | Auth | `/api/v1/auth` | POST login, POST register |
| 3 | Analysis | `/api/v1/analysis` | POST request, GET :id |
| 4 | Portfolio | `/api/v1/portfolio` | CRUD completo |
| 5 | Reports | `/api/v1/reports` | GET list, GET :id/pdf |
| 6 | MarketData | `/api/v1/market-data` | GET prices, indicators |
| 7 | EconomicIndicators | `/api/v1/economic` | GET indicators |
| 8 | News | `/api/v1/news` | GET list |
| 9 | Wheel | `/api/v1/wheel` | GET, POST calculate |
| 10 | AssetsUpdate | `/api/v1/assets/bulk` | POST update |
| 11 | DataSources | `/api/v1/data-sources` | GET sources |

### 8.3 Infraestrutura - Todos os 21 Containers

| # | Container | Porta | Health Check | Profile |
|---|-----------|-------|--------------|---------|
| 1 | invest_postgres | 5532 | pg_isready | core |
| 2 | invest_redis | 6479 | redis-cli ping | core |
| 3 | invest_backend | 3101 | /api/v1/health | core |
| 4 | invest_frontend | 3100 | HTTP 200 | core |
| 5 | invest_python_service | 8001 | /health | core |
| 6 | invest_scrapers | 8000 | /health | core |
| 7 | invest_api_service | 8000 | /api/oauth/health | core |
| 8 | invest_pgadmin | 5150 | HTTP 200 | dev |
| 9 | invest_redis_commander | 8181 | HTTP 200 | dev |
| 10 | invest_tempo | 3200 | - | obs |
| 11 | invest_loki | 3102 | - | obs |
| 12 | invest_prometheus | 9090 | - | obs |
| 13 | invest_grafana | 3000 | - | obs |
| 14 | invest_promtail | - | - | obs |
| 15 | invest_meilisearch | 7700 | /health | extra |
| 16 | invest_minio | 9000 | mc ready | extra |
| 17 | invest_nginx | 80,443 | / | prod |

---

## SECAO 9: TESTES PARALELOS COM AGENTES

### 9.1 Estrategia de Paralelizacao

```
Para validacao completa do ecossistema, usar ate 3 agentes em paralelo:

AGENTE 1: Frontend (pm-expert ou e2e-testing-expert)
- Navegar todas as 18 paginas
- MCP Triplo em cada pagina critica
- Capturar screenshots

AGENTE 2: Backend (backend-api-expert)
- Testar todos os 11 controllers
- Validar integracoes (WebSocket, BullMQ)
- Checar queue jobs

AGENTE 3: Infraestrutura (Explore)
- Verificar 20 containers
- Testar conectividade entre servicos
- Validar logs e metricas
```

### 9.2 Template de Cenarios de Teste

| Tipo | Frontend | Backend | Infra |
|------|----------|---------|-------|
| Happy Path | Navegacao normal | CRUD OK | Containers up |
| Edge Cases | Forms vazios | Payloads invalidos | Restart |
| Error Handling | Network error | Exception handling | Falha dep |
| Performance | Load < 3s | Response < 500ms | CPU < 80% |
| Concurrency | Multi-tabs | Parallel requests | Queue load |

### 9.3 Comandos para Paralelizacao

```typescript
// Exemplo de lancamento paralelo de agentes
Task(subagent_type="pm-expert", prompt="Validate all 18 frontend pages...")
Task(subagent_type="backend-api-expert", prompt="Test all 11 controllers...")
Task(subagent_type="Explore", prompt="Check all 20 containers...")
```

---

## SECAO 10: OBSERVABILIDADE

### 10.1 Padroes de Logging

**Backend (NestJS):**
```typescript
// CORRETO
private readonly logger = new Logger(MyService.name);
this.logger.log(`Processing: ${id}`);
this.logger.error(`Failed: ${id}`, error.stack);

// ERRADO - NUNCA USAR
console.log("processing");
```

**Python Scrapers:**
```python
# CORRETO
from loguru import logger
logger.info(f"Scraping: {ticker}")

# ERRADO - NUNCA USAR
print("scraping")
```

### 10.2 Checklist de Observabilidade

- [ ] Backend: Logger NestJS habilitado
- [ ] Frontend: Error boundaries com logging
- [ ] Scrapers: Loguru configurado
- [ ] Docker: Logs acessiveis
- [ ] Metricas: Health checks ativos
- [ ] Traces: Correlation IDs (se aplicavel)

### 10.3 Anti-Patterns de Logging

- `console.log()` em codigo NestJS (usar `this.logger.log()`)
- `print()` em codigo Python de producao (usar `logger.info()`)
- Suprimir erros com try-catch vazio
- Logs sem contexto (ex: `logger.log("error")` sem detalhes)
- Desabilitar logs em producao para "performance"

---

## SECAO 11: INTEGRACOES CRITICAS

### 11.1 WebSocket - 15+ Tipos de Eventos

| Evento | Room Format | Uso |
|--------|-------------|-----|
| price_update | `{ticker}:prices` | Precos em tempo real |
| analysis_complete | `{ticker}:analysis` | Analise AI finalizada |
| report_ready | `{ticker}:reports` | Relatorio gerado |
| portfolio_update | `{userId}:portfolio` | Mudancas no portfolio |
| market_status | broadcast | Mercado aberto/fechado |
| asset_update_started | broadcast | Inicio de atualizacao |
| asset_update_completed | broadcast | Fim de atualizacao |
| asset_update_failed | broadcast | Falha de atualizacao |
| batch_update_progress | broadcast | Progresso de batch |
| scraper_test_progress | broadcast | Status de scrapers |
| option_price_update | `{ticker}:options` | Precos de opcoes |
| option_chain_update | `{ticker}:options` | Chain de opcoes |

**Checklist WebSocket:**
- [ ] Conexao estabelecida (socket.io-client)
- [ ] Rooms sendo joined corretamente
- [ ] Eventos sendo recebidos
- [ ] Cleanup de subscriptions (a cada 5 min)
- [ ] Reconnection funcionando

### 11.2 BullMQ - 5 Queues + 8 Job Types

| Queue | Jobs | Timeout | Retry |
|-------|------|---------|-------|
| scraping | fundamental, options, bulk-scraping | 120s | 3x exponential |
| analysis | AI analysis | 60s | 3x |
| reports | PDF generation | 90s | 3x |
| asset-updates | single, multiple, portfolio, sector, retry, daily | 180s | 3x |
| dead-letter | Failed jobs archive | - | - |

**Checklist BullMQ:**
- [ ] Redis conectado (6479)
- [ ] Queues nao pausadas (`KEYS bull:*:meta-paused`)
- [ ] Workers processando
- [ ] Dead letter nao crescendo excessivamente
- [ ] Retry exponential funcionando (2s-4s-8s)

### 11.3 APIs Externas - 34+ Fontes

| API | Proposito | Rate Limit | Fallback |
|-----|-----------|-----------|----------|
| BRAPI | Precos, historico | 10k/mes (free) | DB cache |
| Fundamentus | Fundamentals | Implicit | Cross-validation |
| StatusInvest | Fundamentals alt | Implicit | Consensus |
| Investidor10 | Setor, dados | Implicit | Fallback |
| BCB | SELIC, IPCA | Public | Cache 24h |
| B3 COTAHIST | Historico 1986-2025 | File download | Local cache |
| Python Service | Indicadores tecnicos | Internal | Graceful deg. |

**Checklist APIs:**
- [ ] Cross-validation com minimo 3 fontes
- [ ] Outlier detection (threshold 10%)
- [ ] Circuit breaker ativo (3 falhas = open)
- [ ] Retry exponential configurado
- [ ] Fallback para DB quando API falha

---

## SECAO 12: VALIDACOES FALTANTES

### 12.1 Gaps de Validacao Identificados

| Categoria | Issue | Impacto | Prioridade |
|-----------|-------|---------|------------|
| **Data Integrity** | No unique (portfolio, asset) in PortfolioPosition | Posicoes duplicadas | ALTA |
| **Data Integrity** | lastUpdateStatus sem TTL enforcement | Dados desatualizados | ALTA |
| **Cache** | Pattern invalidation nao implementado | Dados stale | ALTA |
| **Seguranca** | Portfolio operations sem validar ownership | Acesso nao autorizado | ALTA |
| **Validacao** | Negative P/L nao flagged como outlier | Dados ruins | MEDIA |
| **API** | BRAPI 10k/month sem monitoramento | Quota esgotada | MEDIA |
| **API** | No fallback quando TODAS APIs falham | Cascading failure | MEDIA |
| **Frontend** | No error boundaries | Crash = blank page | MEDIA |
| **WebSocket** | Subscriptions em memoria apenas | Perdidas no restart | BAIXA |

### 12.2 Checklist de Validacoes

**Integridade de Dados:**
- [ ] Unique constraint em (portfolio_id, asset_id)
- [ ] Validacao de ownership em operacoes de portfolio
- [ ] Validacao de tipos em dados scraped
- [ ] Outlier detection para fundamentals negativos

**Cache:**
- [ ] Invalidacao de cache apos updates
- [ ] Pattern-based deletion implementado
- [ ] TTL apropriado para cada tipo de dado

**Error Handling:**
- [ ] Error boundaries no frontend
- [ ] Fallback quando todas APIs falham
- [ ] Request deduplication

---

## SECAO 13: GAPS DE TESTES

### 13.1 Cobertura Atual

| Componente | Cobertura | Gap |
|------------|-----------|-----|
| Backend Services | 62% (31/50) | 19 services sem testes |
| Backend Controllers | 5% (1/21) | **20 controllers sem testes** |
| Frontend Components | 0% | **Nenhum unit test React** |
| Frontend Hooks | 0% | **Nenhum hook testado** |
| Playwright E2E | 19 files | Boa cobertura de paginas |
| Python Scrapers | 1 file | 28+ scrapers sem testes |
| Accessibility | 0% | **Nenhum teste a11y** |
| Performance | 0% | **Nenhum load test** |

### 13.2 Cenarios de Teste Faltantes

**Backend:**
- [ ] Controller tests (20 controllers)
- [ ] Queue processor error scenarios
- [ ] Database migration rollback
- [ ] Authentication edge cases
- [ ] Cross-validation error scenarios

**Frontend:**
- [ ] React component unit tests
- [ ] Custom hooks tests
- [ ] Form validation tests
- [ ] Error boundary tests
- [ ] Accessibility (WCAG) tests

**E2E:**
- [ ] Multi-user concurrent operations
- [ ] WebSocket real-time updates
- [ ] File upload/download
- [ ] PDF report generation
- [ ] Network failure recovery

---

## SECAO 14: AUTOMACAO EXISTENTE

### 14.1 system-manager.ps1 (27+ funcoes)

| Comando | Funcao |
|---------|--------|
| `start` | Iniciar 8 servicos core |
| `start-dev` | + pgadmin, redis-commander |
| `start-prod` | + nginx |
| `stop` | Parar todos |
| `status` | Status de containers |
| `health` | Health check completo |
| `logs <service>` | Ver logs |
| `restart-service <name>` | Restart com dependencias |
| `check-types` | TypeScript validation |
| `backup-database` | Backup PostgreSQL |
| `restore-database` | Restore PostgreSQL |
| `clean-cache` | Limpar frontend cache |
| `rebuild-frontend` | Cache + rebuild |

### 14.2 Husky Hooks (3)

| Hook | Validacao | Bypass |
|------|-----------|--------|
| pre-commit | tsc --noEmit (backend + frontend) | --no-verify |
| commit-msg | Conventional Commits format | --no-verify |
| pre-push | npm run build (ambos) | --no-verify |

### 14.3 Slash Commands (11)

| Comando | Uso |
|---------|-----|
| `/check-context` | Verificacao pre-tarefa |
| `/validate-all` | Zero Tolerance completo |
| `/validate-phase` | Validacao de fase |
| `/mcp-triplo` | Playwright + DevTools + a11y |
| `/docker-status` | Status containers |
| `/fix-ts-errors` | Corrigir erros TS |
| `/sync-docs` | CLAUDE.md - GEMINI.md |
| `/commit-phase` | Commit padronizado |
| `/new-phase` | Criar PLANO_FASE_XX.md |
| `/run-scraper` | Executar scraper Python |
| `/check-ecosystem` | Validacao 100% ecossistema (NOVO) |

### 14.4 Gaps de Automacao

| Gap | Impacto | Recomendacao |
|-----|---------|--------------|
| No dependency scanning | Vulnerabilidades | Adicionar Dependabot |
| No performance monitoring | Regressoes silenciosas | Metricas CI/CD |
| No backup automation | Risco de perda de dados | Cron job diario |
| No scraper health alerts | Falhas nao detectadas | Alerting system |
| No log aggregation | Debug dificil | ELK ou similar |
| No deployment automation | Deploy manual | GitHub Actions deploy |

---

## SECAO 15: DATA FLOWS CRITICOS

### 15.1 Price Update Flow

```
External API (BRAPI) - Python Service (cache check)
    | CACHE MISS
Python Service (8001) calcula indicadores
    |
Redis Cache (TTL 24h)
    |
Assets.service retorna dados
    |
WebSocket room: {ticker}:prices
    |
Frontend hook: usePriceUpdates()
```

### 15.2 Asset Update Flow

```
User/Cron trigger
    |
BullMQ Queue: asset-updates
    |
AssetUpdateProcessor (concurrency: 1)
    |
ScrapersService (6 parallel):
  - Fundamentus, BRAPI, Investidor10
  - StatusInvest, Fundamentei, Investsite
    |
CrossValidationConfigService (min 3 fontes)
    |
DiscrepancyResolutionService (se outlier)
    |
Save FundamentalData + asset.lastUpdated
    |
WebSocket: asset_update_completed
```

### 15.3 Checklist de Data Flows

- [ ] Cache hit rate aceitavel (>80%)
- [ ] Cross-validation passando
- [ ] WebSocket broadcast funcionando
- [ ] Concurrency respeitada (1 para Playwright)
- [ ] Retry exponential ativo
- [ ] Dead letter nao crescendo

---

## SECAO 16: INVENTARIO DE SEGURANCA

### 16.1 Vulnerabilidades Criticas (IMEDIATO)

| # | Vulnerabilidade | Arquivo | Impacto | Solucao |
|---|-----------------|---------|---------|---------|
| 1 | OAuth accessToken armazenado | `google.strategy.ts` | Comprometimento de conta | Remover, usar cookies HTTP-only |
| 2 | JWT em URL (redirect) | `auth.controller.ts` | Exposicao em historico | Usar cookies seguros |
| 3 | WebSocket sem autenticacao | `websocket.gateway.ts` | Vazamento de dados | Adicionar JWT no handshake |
| 4 | CORS permite `*` com credentials | `main.ts` | CSRF possivel | Nunca `*` com credentials |
| 5 | SSL `rejectUnauthorized: false` | `app.module.ts` | MITM no database | Setar `true`, validar cert |
| 6 | Senha minima 8 chars | `auth.dto.ts` | Senhas fracas | 12+ chars com complexidade |

### 16.2 Checklist de Seguranca Obrigatorio

**Antes de Cada Release:**
- [ ] Remover OAuth tokens do user object
- [ ] Verificar WebSocket tem JWT validation
- [ ] CORS nao permite `*` com credentials
- [ ] SSL certificate validation ativo
- [ ] Senhas tem validacao de complexidade
- [ ] Rate limiting em endpoints sensiveis
- [ ] Headers de seguranca (Helmet) configurados

---

## SECAO 17: INVENTARIO DATABASE

### 17.1 Entidades (26 total)

| # | Entity | Tabela | Status |
|---|--------|--------|--------|
| 1 | User | users | Falta idx isActive |
| 2 | Asset | assets | Falta idx lastUpdated |
| 3 | AssetPrice | asset_prices | Otimizado FASE 117 |
| 4 | TickerChange | ticker_changes | Falta FK para assets |
| 5 | FundamentalData | fundamental_data | Falta UNIQUE(asset,date) |
| 6 | Analysis | analyses | Falta idx completedAt |
| 7 | Portfolio | portfolios | Falta UNIQUE(userId,name) |
| 8 | PortfolioPosition | portfolio_positions | Tem UNIQUE |
| 9 | WheelStrategy | wheel_strategies | Falta idx phase |
| 10 | WheelTrade | wheel_trades | Falta idx openedAt |
| 11 | OptionPrice | option_prices | Otimizado FASE 111 |
| 12 | IntradayPrice | intraday_prices | TimescaleDB |
| 13 | News | news | Falta FTS index |
| 14 | NewsAnalysis | news_analysis | Falta UNIQUE(news,provider) |
| 15 | SentimentConsensus | sentiment_consensus | OK |
| 16 | EconomicIndicator | economic_indicators | UNIQUE OK |
| 17 | EconomicEvent | economic_events | Falta idx source |
| 18 | Alert | alerts | Falta idx expiresAt |
| 19 | UpdateLog | update_logs | Falta idx triggeredBy |
| 20 | SyncHistory | sync_history | Completo |
| 21 | ScraperMetric | scraper_metrics | Falta idx success |
| 22 | DataSource | data_sources | Falta idx isTrusted |
| 23 | ScrapedData | scraped_data | Falta idx isValid |
| 24 | DiscrepancyResolution | discrepancy_resolutions | Falta idx severity |
| 25 | CrossValidationConfig | cross_validation_config | Falta idx isActive |
| 26 | RefreshToken | refresh_tokens | OK |

### 17.2 Gaps Criticos de Database

| Gap | Tabela | Impacto | Prioridade |
|-----|--------|---------|------------|
| UNIQUE(asset,referenceDate) | fundamental_data | Duplicados | ALTA |
| UNIQUE(userId,name) | portfolios | Nomes duplicados | ALTA |
| UNIQUE(news,provider) | news_analysis | Analises duplicadas | ALTA |
| CHECK constraints OHLC | asset_prices | Dados invalidos | MEDIA |
| CHECK quantity > 0 | portfolio_positions | Valores negativos | MEDIA |

---

## SECAO 18: INVENTARIO SCRAPERS

### 18.1 35 Python Scrapers

| # | Scraper | Auth | Padrao | Performance | Status |
|---|---------|------|--------|-------------|--------|
| 1 | Fundamentus | Public | BeautifulSoup | 3-5s | OK |
| 2 | BCB | Public | aiohttp | <2s | OK |
| 3 | StatusInvest | Public | BeautifulSoup | 4-5s | OK |
| 4 | Investsite | Public | BeautifulSoup | 4-5s | OK |
| 5 | Investidor10 | OAuth | BeautifulSoup | 5-6s | OK |
| 6 | TradingView | OAuth | BeautifulSoup | 5-6s | OK |
| 7-9 | News (Bloomberg, GoogleNews, InvestingNews) | Mixed | BeautifulSoup | 4-6s | OK |
| 10-16 | News (Valor, Exame, InfoMoney, Estadao, +3) | OAuth | BeautifulSoup | 5-6s | OK |
| 17-22 | AI (ChatGPT, Gemini, DeepSeek, Claude, Grok, Perplexity) | OAuth | Session+localStorage | 6-8s | OK |
| 23-27 | Market (Yahoo, Oplab, Kinvo, Investing, B3) | Mixed | BeautifulSoup | 4-7s | OK |
| 28-30 | OAuth (Fundamentei, MaisRetorno, ADVFN) | OAuth/Creds | Cookie loading | 5-7s | OK |
| 31 | OpcoesNet | Creds | Column mapping | 6-7s | OK |
| 32-34 | Economic (ANBIMA, FRED, IPEADATA) | API Key | aiohttp (NO browser) | <2s | OK |

### 18.2 Padroes de Scraper

**CORRETO - BeautifulSoup Single Fetch:**
```python
html_content = await page.content()  # 1 UNICO await
soup = BeautifulSoup(html_content, 'html.parser')
# Parsing local SEM await
```

**ERRADO - Multiplos await (Exit 137):**
```python
tables = await page.query_selector_all("table")  # LENTO
for table in tables:
    rows = await table.query_selector_all("tr")  # MUITOS awaits
```

---

## SECAO 19: INVENTARIO DOCKER

### 19.1 21 Servicos Docker

| # | Servico | Container | Porta | CPU Max | RAM Max |
|---|---------|-----------|-------|---------|---------|
| 1 | postgres | invest_postgres | 5532 | 2.0 | 4G |
| 2 | redis | invest_redis | 6479 | 1.0 | 1G |
| 3 | python-service | invest_python_service | 8001 | 2.0 | 1G |
| 4 | backend | invest_backend | 3101 | 2.0 | 4G |
| 5 | scrapers | invest_scrapers | 5900,6080,8000 | 2.0 | 2G |
| 6 | api-service | invest_api_service | 8000 | 2.0 | 4G |
| 7 | frontend | invest_frontend | 3100 | 2.0 | 2G |
| 8 | pgadmin | invest_pgadmin | 5150 | - | - |
| 9 | redis-commander | invest_redis_commander | 8181 | - | - |
| 10 | tempo | invest_tempo | 3200,4317,4318 | - | - |
| 11 | loki | invest_loki | 3102 | - | - |
| 12 | prometheus | invest_prometheus | 9090 | - | - |
| 13 | grafana | invest_grafana | 3000 | - | - |
| 14 | promtail | invest_promtail | - | - | - |
| 15 | meilisearch | invest_meilisearch | 7700 | - | - |
| 16 | minio | invest_minio | 9000,9001 | - | - |
| 17 | nginx | invest_nginx | 80,443 | - | - |

**Total Recursos:** 16 CPU cores max, 23GB RAM max (7GB peak real)

### 19.2 Profiles Docker

| Profile | Servicos | Comando |
|---------|----------|---------|
| default | 8 core | `docker-compose up -d` |
| dev | +pgadmin, redis-commander | `--profile dev` |
| observability | +tempo, loki, prometheus, grafana, promtail | `--profile observability` |
| production | +nginx | `--profile production` |

---

## SECAO 20: INVENTARIO APIs EXTERNAS

### 20.1 34+ APIs Integradas

| Categoria | APIs | Auth | Cross-Validation |
|-----------|------|------|------------------|
| **Fundamentals (6)** | Fundamentus, BRAPI, StatusInvest, Investidor10, Fundamentei, Investsite | Mixed | Min 3 fontes |
| **Economic (4)** | BCB, ANBIMA, FRED, IPEADATA | API Key/Public | Sim |
| **News (6)** | Bloomberg, Valor, Exame, InfoMoney, Estadao, InvestingNews | OAuth/Public | Nao |
| **AI (6)** | ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity | OAuth | Nao |
| **Market (7)** | Yahoo, TradingView, GoogleFinance, Investing, B3, Kinvo, ADVFN | Mixed | Parcial |
| **Options (2)** | Opcoes.net.br, Oplab | Creds/Public | Nao |
| **Crypto (1)** | CoinMarketCap | API/Public | Nao |

### 20.2 Cross-Validation Config

| Parametro | Valor | Proposito |
|-----------|-------|-----------|
| MIN_DATA_SOURCES | 3 | Consenso minimo |
| DATA_VALIDATION_THRESHOLD | 5% | Discrepancia maxima |
| Confidence Score Floor | 60% | Trigger Python fallback |
| Circuit Breaker Failures | 3 | Abrir circuito |
| Retry Attempts | 3 | Com backoff exponencial |

---

## SECAO 21: INVENTARIO MCP E TOOLS

### 21.1 6 MCPs Configurados

| MCP | Pacote | Proposito | Ferramentas Principais |
|-----|--------|-----------|------------------------|
| **playwright** | @playwright/mcp | Automacao browser | navigate, snapshot, click, fill |
| **chrome-devtools** | chrome-devtools-mcp | Debug browser | console, network, screenshot |
| **a11y** | @anthropic/mcp-server-a11y | Acessibilidade | get_summary (WCAG audit) |
| **sequential-thinking** | @anthropic/mcp-sequential-thinking | Planejamento | sequentialthinking |
| **react-context** | react-context-mcp | Debug React | component tree, state |
| **context7** | @anthropic/context7-mcp | Contexto | context management |

> **CRITICO:** Playwright MCP DEVE usar `--snapshot incremental` para evitar "Prompt is too long".
> Configuracao: `"args": ["/c", "npx", "@playwright/mcp@latest", "--snapshot", "incremental"]`

### 21.2 12 Slash Commands

| Comando | Proposito | Quando Usar |
|---------|-----------|-------------|
| `/mcp-triplo` | Playwright + DevTools + a11y | Validacao frontend |
| `/mcp-quadruplo` | MCP Triplo + Documentation Research | Feature complexa, bug >2h debug |
| `/validate-phase` | Zero Tolerance + docs | Fim de fase |
| `/commit-phase` | Commit padronizado | Apos validacao |
| `/new-phase` | Criar PLANO_FASE_XX.md | Inicio de fase |
| `/docker-status` | Health de containers | Troubleshooting |
| `/fix-ts-errors` | Corrigir TypeScript | Erros de tipo |
| `/check-context` | Verificar contexto | Antes de compact |
| `/sync-docs` | CLAUDE.md - GEMINI.md | Apos mudancas |
| `/validate-all` | Suite completa | Release |
| `/run-scraper` | Executar scraper | Testes de dados |
| `/check-ecosystem` | Validacao 100% (NOVO) | Fases criticas |

### 21.3 27 Funcoes system-manager.ps1

| Categoria | Funcoes | Exemplos |
|-----------|---------|----------|
| **Startup** | 7 | start, start-dev, start-prod, stop, restart |
| **Status** | 5 | status, health, logs, volumes, network |
| **Build** | 4 | install, build, migrate, check-types |
| **Backup** | 2 | backup, restore |
| **Cache** | 2 | clean-cache, rebuild-frontend |
| **Cleanup** | 2 | prune, clean |
| **Helpers** | 5 | Test-Prerequisites, Wait-ForHealthy, etc. |

### 21.4 10 Sub-Agents Especializados

| Agent | Expertise | Tools |
|-------|-----------|-------|
| **pm-expert** | PM + QA + DevOps + Tech Lead | All MCPs + Task |
| **backend-api-expert** | NestJS, TypeORM, PostgreSQL | Read, Edit, Bash |
| **frontend-components-expert** | Next.js 14, React, Shadcn | Read, Edit, Bash |
| **e2e-testing-expert** | Playwright, Chrome DevTools, a11y | All MCPs |
| **database-migration-expert** | TypeORM migrations | Read, Edit, Bash |
| **scraper-development-expert** | Playwright, Python, OAuth | Read, Edit, Bash |
| **chart-analysis-expert** | Recharts, lightweight-charts | Read, Edit, DevTools |
| **typescript-validation-expert** | TypeScript strict mode | Read, Edit, Bash |
| **queue-management-expert** | BullMQ, Redis | Read, Edit, Bash |
| **documentation-expert** | Technical docs, templates | Read, Edit, Write |

---

## COMANDOS RAPIDOS

### Validacao Completa

```bash
# Backend
cd backend && npx tsc --noEmit && npm run build

# Frontend
cd frontend && npx tsc --noEmit && npm run build && npm run lint

# Sistema
.\system-manager.ps1 status
.\system-manager.ps1 health
```

### Slash Commands

```
/check-context     # Verificacao pre-tarefa
/check-ecosystem   # Validacao 100% ecossistema
/validate-all      # Zero Tolerance completo
/validate-phase    # Validacao de fase
/mcp-triplo        # Playwright + DevTools + a11y
/mcp-quadruplo     # MCP Triplo + Documentation Research (NOVO)
/docker-status     # Status containers
/fix-ts-errors     # Corrigir erros TS
/sync-docs         # Sincronizar CLAUDE.md/GEMINI.md
```

### MCP Triplo

```
1. mcp__playwright__browser_navigate + browser_snapshot
2. mcp__chrome-devtools__list_console_messages + list_network_requests
3. mcp__a11y__get_summary
```

### MCP Quadruplo (NOVO)

```
1. mcp__playwright__browser_navigate + browser_snapshot
2. mcp__chrome-devtools__list_console_messages + list_network_requests
3. mcp__a11y__get_summary
4. Documentation Research:
   - GitHub Issues (minimo 2)
   - Docs Oficiais
   - KNOWN-ISSUES.md (grep)
   - Git History (git log --grep)
   - WebSearch Paralelo (minimo 3 fontes)
```

**Use quando:** Feature complexa, bug >2h debug, nova biblioteca

**ROI:** 15-30 min research economiza 2-8h debugging

---

## 22. PESQUISA WEB PARALELA (WebSearch Strategy)

### 22.1 Quando Pesquisar

- [ ] Decisoes arquiteturais (qual biblioteca usar?)
- [ ] Problemas sem solucao clara (erro desconhecido)
- [ ] Best practices (como implementar corretamente?)
- [ ] Comparacao de alternativas (A vs B vs C)
- [ ] Documentacao atualizada (versao 2025)
- [ ] Troubleshooting complexo (root cause desconhecido)
- [ ] Evolucao/melhoria de funcionalidade existente

### 22.2 Template de Pesquisa Paralela (4 queries)

Execute em paralelo para maxima eficiencia:

| Query # | Template | Exemplo |
|---------|----------|---------|
| 1 | "[tecnologia] best practices 2025" | "NestJS Redis cache best practices 2025" |
| 2 | "[tecnologia] official documentation" | "NestJS caching official documentation" |
| 3 | "[problema] solution site:stackoverflow.com" | "Redis connection timeout solution site:stackoverflow.com" |
| 4 | "[alternativas] comparison review 2025" | "ioredis vs redis comparison review 2025" |

### 22.3 Fontes Prioritarias por Tecnologia

| Tecnologia | Fontes Oficiais | Blogs/Comunidade |
|------------|-----------------|------------------|
| NestJS | docs.nestjs.com | trilon.io, dev.to |
| Next.js | nextjs.org | leerob.io, vercel.com/blog |
| React | react.dev | kentcdodds.com, epicreact.dev |
| TypeORM | typeorm.io | github.com/typeorm/typeorm |
| PostgreSQL | postgresql.org | wiki.postgresql.org |
| Docker | docs.docker.com | docker.com/blog |
| Playwright | playwright.dev | github.com/microsoft/playwright |
| Redis | redis.io | redis.com/blog |
| BullMQ | docs.bullmq.io | github.com/taskforcesh/bullmq |

### 22.4 Cross-Validation Obrigatorio

| Regra | Descricao |
|-------|-----------|
| Minimo 3 fontes | Nunca confiar em fonte unica |
| Prioridade | Docs oficiais > Blogs 2024-2025 > StackOverflow |
| Data | Preferir conteudo de 2024-2025 |
| Descartar | Informacao anterior a 2023 (exceto conceitos fundamentais) |

### 22.5 Anti-Patterns de Pesquisa

- [ ] Usar informacao de 2022 ou anterior sem validar atualidade
- [ ] Confiar em unica fonte para decisao arquitetural
- [ ] Ignorar documentacao oficial em favor de blogs
- [ ] Nao citar fontes usadas na decisao
- [ ] Copiar codigo sem entender contexto

---

## ARQUIVOS CRITICOS PARA LEITURA

| Arquivo | Prioridade | Conteudo |
|---------|-----------|----------|
| CLAUDE.md | CRITICO | Todas as regras |
| .gemini/context/financial-rules.md | CRITICO | Dados financeiros |
| ARCHITECTURE.md | CRITICO | Arquitetura |
| KNOWN-ISSUES.md | IMPORTANTE | Issues resolvidos |
| PLAYWRIGHT_SCRAPER_PATTERN.md | IMPORTANTE | Padrao scrapers |
| CHECKLIST_TODO_MASTER.md | IMPORTANTE | Checklist principal |
| CHECKLIST_ECOSSISTEMA_COMPLETO.md | IMPORTANTE | Este checklist |

---

**Criado:** 2025-12-15
**Versao:** 2.0.0 (22 secoes)
**Refs:** CHECKLIST_TODO_MASTER.md, CLAUDE.md, ARCHITECTURE.md
