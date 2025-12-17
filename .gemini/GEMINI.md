# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B3 AI Analysis Platform - Investment analysis platform for Brazilian stock exchange (B3) with AI-powered fundamental, technical, and macroeconomic analysis.

**Stack:** NestJS 10 + Next.js 14 App Router + PostgreSQL 16 + TypeORM + BullMQ/Redis + Python Scrapers

## Common Commands

### Development

```bash
# Start all services (Docker)
docker-compose up -d

# TypeScript validation (REQUIRED before commits)
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build   # NestJS build
cd frontend && npm run build  # Next.js build

# Lint
cd frontend && npm run lint

# Run tests
cd backend && npm run test                    # Unit tests
cd backend && npm run test:watch              # Watch mode
cd backend && npm run test:e2e                # E2E tests
cd frontend && npx playwright test            # Playwright E2E
```

### Database

```bash
# Run migrations
cd backend && npm run migration:run

# Revert last migration
cd backend && npm run migration:revert

# Generate new migration
cd backend && npm run migration:generate -- -n MigrationName

# Run seeds
cd backend && npm run seed
```

### Docker

```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f <srv>  # View logs (backend, frontend, postgres, redis)
docker restart invest_backend invest_frontend  # Restart services
```

## Architecture

```
Frontend (Next.js :3100) ←→ Backend (NestJS :3101) ←→ PostgreSQL (:5532)
                                    ↓
                              BullMQ + Redis (:6479)
                                    ↓
                           Python Scrapers (Playwright)
```

### Key Directories

- `backend/src/api/` - REST controllers, services, DTOs
- `backend/src/database/entities/` - TypeORM entities
- `backend/src/database/migrations/` - Database migrations
- `backend/src/scrapers/` - Data scraping services (fundamental, news, options)
- `backend/src/queue/` - BullMQ jobs and processors
- `frontend/src/app/(dashboard)/` - Authenticated pages (App Router)
- `frontend/src/components/` - React components (Shadcn/ui)
- `frontend/src/lib/hooks/` - Custom React hooks
- `frontend/src/lib/api.ts` - API client (axios)

### Main Entities

- `Asset` - Stock tickers (861 B3 assets)
- `AssetPrice` - Historical OHLCV data (1986-2025 from COTAHIST)
- `TickerChange` - Ticker rebranding history (e.g., ELET3→AXIA3)
- `Analysis` - Fundamental/technical analysis results
- `Portfolio` / `PortfolioPosition` - User portfolios

## Coding Patterns

### Backend (NestJS)

- Use `class-validator` decorators for DTO validation
- Custom validators with `@ValidatorConstraint` for cross-field validation
- Repository pattern via TypeORM
- WebSocket events via `@nestjs/websockets` for real-time updates

```typescript
// Example: Custom cross-field validator
@ValidatorConstraint({ name: 'IsEndYearGreaterThanStartYear', async: false })
export class IsEndYearGreaterThanStartYear implements ValidatorConstraintInterface {
  validate(endYear: number, args: ValidationArguments) {
    return endYear >= (args.object as any).startYear;
  }
}
```

### Frontend (Next.js 14)

- App Router with route groups: `(dashboard)` for authenticated, `auth` for public
- React Query for server state management
- Shadcn/ui components in `components/ui/`
- Charts: Recharts (dashboard) + lightweight-charts (candlestick)

### Data Flow

1. **Scraping**: 6 sources with cross-validation (min 3 sources for confidence)
2. **Queue**: BullMQ processes heavy tasks (analysis, bulk sync)
3. **Real-time**: WebSocket events for progress updates

## Quality Requirements

**Zero Tolerance Policy:**
- TypeScript: 0 errors (backend + frontend)
- Build: Must succeed
- ESLint: 0 critical warnings

---

## Checklist Automatico do Ecossistema (ATIVADO - v5.2)

### Sistema de Auto-Trigger Bilingue (PT + EN)

O projeto possui **sistema de automacao 100%** com deteccao de keywords, correlacao de bugs, e analytics integrados.

**Como Funciona:**

1. **SessionStart Hook** - Exibe resumo de 65 categorias de keywords ao iniciar sessao
2. **UserPromptSubmit Hook** - Detecta keywords (PT + EN) e injeta contexto relevante
3. **PreToolUse Hook** - Valida tags em arquivos antes de editar
4. **PostToolUse Hook** - Correlaciona erros com KNOWN-ISSUES automaticamente
5. **Stop Hook** - Coleta analytics da sessao

**Script Principal:** `.claude/hooks-scripts/checklist-auto-trigger.js` (v5.2)

### Sistema de Prioridades (v5.2)

| Prioridade | Icone | Limite Max | Peso | Exemplos |
|------------|-------|------------|------|----------|
| **critical** | 🔴 | 10 | 9-10 | regression, uncertainty, dataQuality |
| **high** | 🟠 | 4 | 7-8 | planning, financial, backup, riskManagement |
| **medium** | 🟡 | 2 | 5-6 | frontend, backend, testing, cache |
| **low** | 🟢 | 1 | 3-4 | documentation, network, sentiment |

### 65 Categorias de Keywords (PT + EN)

**Core (27 categorias):** planning, development, codeReview, commit, phase, scraper, frontend, ux, forms, visual, charts, backend, database, financial, troubleshoot, quality, security, docker, api, testing, performance, observability, jobs, websocket, documentation, mcp, environment

**v3.0 (10 categorias):** webResearch, postImplementation, regression, docSync, testCoverage, deployment, ecosystem, agentHelp, improvement, urgency

**v4.0 (17 categorias):** migration, validation, routing, hook, middleware, transaction, index, cache, crossvalidation, dividend, options, health, network, backup, retry, ratelimit, circuit

**v5.0 Domain-Specific (11 categorias):** technicalIndicators, fundamentalMetrics, macro, corporateActions, wheelStrategy, sentiment, riskManagement, marketIndices, dataSources, cicd, dataQuality

**v5.1 (4 categorias):** uncertainty, decisionMaking, clarification, assumption

**Total:** ~1,100+ keywords bilingues cobrindo 100% do ecossistema

### Scripts de Automacao

| Script | Funcao | Hook |
|--------|--------|------|
| `checklist-auto-trigger.js` | Deteccao de keywords com prioridades | UserPromptSubmit |
| `tag-injector.js` | Injecao de contexto no prompt | UserPromptSubmit |
| `tag-validator.js` | Validacao de tags em arquivos | PreToolUse (Edit/Write) |
| `bug-correlator.js` | Correlacao com KNOWN-ISSUES | PostToolUse (Bash) |
| `solution-finder.js` | Busca fuzzy de solucoes | Sob demanda |
| `tag-generator.js` | Geracao de tags com fallback | Sob demanda |
| `auto-sync-docs.js` | Sincronizacao CLAUDE.md ↔ GEMINI.md | PreCompact |
| `tag-analytics.js` | Coleta de metricas | Stop |
| `circuit-breaker.js` | Resiliencia para scripts | Utilidade |
| `test-suite.js` | Suite de testes (33 tests) | Validacao |

### Diretorio de Dados

```text
.claude/data/
├── analytics/       # Metricas coletadas
├── cache/           # Cache de keywords e solucoes
└── locks/           # File locks para sincronizacao
```

### Referencia Completa

**Arquivo:** `CHECKLIST_ECOSSISTEMA_COMPLETO.md` (1144 linhas, 21 secoes)

**Cobertura:**

- 19 páginas frontend (15 dashboard + 3 auth + 1 root)
- 16 custom hooks (frontend/src/lib/hooks/)
- 11 controllers backend
- 21 containers Docker
- 34+ APIs externas
- 35 Python scrapers
- 6 vulnerabilidades críticas documentadas

### Slash Commands Relacionados

```bash
/check-ecosystem   # Validacao 100% do ecossistema
/check-context     # Verificacao pre-tarefa
/validate-phase    # Validacao de fase completa
/mcp-triplo        # Playwright + DevTools + a11y
```

### Executar Testes de Automacao

```bash
node .claude/hooks-scripts/test-suite.js --verbose
```

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3100 | http://localhost:3100 |
| Backend API | 3101 | http://localhost:3101/api/v1 |
| PostgreSQL | 5532 | localhost:5532 |
| Redis | 6479 | localhost:6479 |
| PgAdmin | 5150 | http://localhost:5150 |
| noVNC (OAuth) | 6080 | http://localhost:6080 |
| OAuth API | 8080 | http://localhost:8080/api/oauth |
| API Service (Python) | 8000 | http://localhost:8000 |
| Python Technical Analysis | 8001 | http://localhost:8001 |
| VNC Direct | 5900 | vnc://localhost:5900 |

## Development Principles

### 1. Quality > Velocity ("Não Ter Pressa")

**Princípio Fundamental:** Priorizar correção definitiva sobre fix rápido.

- ✅ Tempo adequado para análise profunda (Ultra-Thinking)
- ✅ Não pular etapas de validação
- ✅ Code review obrigatório antes de próxima fase
- ❌ Pressão por deadlines NÃO justifica baixa qualidade
- ❌ NUNCA fazer workarounds temporários que se tornam permanentes

**Referência:** `VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md` - Regra 1.6

---

### 2. KISS Principle (Keep It Simple, Stupid)

**Evitar complexidade desnecessária:**

- ✅ Usar melhores práticas comprovadas e modernas
- ✅ Soluções simples e diretas quando possível
- ✅ Código legível > Código "inteligente"
- ❌ Over-engineering
- ❌ Abstrações prematuras

**Nota:** "Moderno e funcional" ≠ "Complexo". Simplicidade é sofisticação.

---

### 3. Root Cause Analysis Obrigatório

**Para TODOS os bugs e problemas:**

- ✅ Identificar causa raiz (não apenas sintoma)
- ✅ Corrigir problema original (não workaround)
- ✅ Documentar em `KNOWN-ISSUES.md` ou `.gemini/context/known-issues.md`
- ✅ Implementar prevenção (não apenas correção)
- ❌ NUNCA simplificar para "terminar rápido"

**Exemplo:**
```
❌ ERRADO: Adicionar try-catch para suprimir erro
✅ CORRETO: Investigar por que erro ocorre e corrigir causa
```

**Referência:** `.gemini/context/known-issues.md` - 8 issues com root cause completo

---

### 4. Anti-Workaround Policy

**Regra Explícita:**

- ❌ Workarounds temporários que se tornam permanentes
- ❌ "Resolver depois" sem issue/TODO rastreável
- ❌ Comentários tipo `// FIXME`, `// HACK` sem plano de correção
- ✅ Se problema é crítico → corrigir agora
- ✅ Se não é crítico → criar issue rastreável com prioridade

**Fluxo Correto:**

```
Problema Encontrado
    ↓
É bloqueante?
    ├─ SIM → Corrigir AGORA (root cause analysis)
    └─ NÃO → Criar issue no KNOWN-ISSUES.md + continuar
```

---

### 5. Observabilidade e Rastreabilidade (OBRIGATÓRIO)

**Princípio Fundamental:** Sempre habilitar e manter habilitados logs, traces e ferramentas de debug/auditoria para rastreabilidade completa dos fluxos.

**SEMPRE manter habilitados:**

- ✅ **Logs estruturados** (NestJS Logger em controllers/services, Loguru em Python)
- ✅ **Traces de execução** (request/response, tempo de resposta, correlation IDs)
- ✅ **Ferramentas de debug e auditoria avançadas** (audit trails, update logs)
- ✅ **Métricas de performance** (response time, success/failure rates)

**Para rastreabilidade de:**

| Categoria | Exemplos | Nível de Log |
|-----------|----------|--------------|
| Fluxos completos | Scraping → Processing → Storage | `log` |
| Gaps e bugs | Erros não capturados, comportamentos inesperados | `error` |
| Alarmes e warnings | Degradação de performance, thresholds atingidos | `warn` |
| Exceções e falhas | Erros de conexão, timeouts, falhas de validação | `error` |
| Divergências | Cross-validation discrepancies, dados inconsistentes | `warn` |
| Não-bloqueantes | Oportunidades de melhoria, debt técnico | `debug` |
| Itens incompletos | Features parcialmente implementadas | `warn` |

**Padrões Obrigatórios:**

```typescript
// ✅ CORRETO: NestJS com Logger estruturado
@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async process(data: any) {
    this.logger.log(`Processing started: ${JSON.stringify({ id: data.id })}`);
    try {
      // ... logic
      this.logger.log(`Processing completed: ${data.id}`);
    } catch (error) {
      this.logger.error(`Processing failed: ${data.id}`, error.stack);
      throw error;
    }
  }
}
```

```python
# ✅ CORRETO: Python com Loguru estruturado
from loguru import logger

class MyScraper:
    def scrape(self, ticker: str):
        logger.info(f"Scraping started: {ticker}")
        try:
            # ... logic
            logger.info(f"Scraping completed: {ticker} in {elapsed}ms")
        except Exception as e:
            logger.error(f"Scraping failed: {ticker} - {str(e)}")
            raise
```

**Anti-Patterns (NUNCA fazer):**

- ❌ `console.log()` em código NestJS (usar `this.logger.log()`)
- ❌ `print()` em código Python de produção (usar `logger.info()`)
- ❌ Suprimir erros com try-catch vazio
- ❌ Logs sem contexto (ex: `logger.log("error")` sem detalhes)
- ❌ Desabilitar logs em produção para "performance"

**Verificação Obrigatória:**

```bash
# Verificar anti-patterns no backend
grep -r "console.log" backend/src --include="*.ts" | wc -l  # Deve ser 0

# Verificar anti-patterns nos scrapers
grep -r "^print(" backend/python-scrapers --include="*.py" | wc -l  # Deve ser 0
```

**Referência:** Análise de Observabilidade (2025-12-06) - Score atual: 49% → Meta: 90%

---

## Critical Rules (Regras Críticas)

### Zero Tolerance Policy

**0 erros obrigatório em:**

- TypeScript: `npx tsc --noEmit` (backend + frontend)
- Build: `npm run build` (backend + frontend)
- Console: Navegador sem erros (validar com Chrome DevTools MCP)
- ESLint: 0 critical warnings

**Antes de CADA commit:**

```bash
# Backend
cd backend
npx tsc --noEmit  # Deve retornar 0 erros
npm run build     # Deve completar sem erros

# Frontend
cd frontend
npx tsc --noEmit  # Deve retornar 0 erros
npm run build     # Deve completar sem erros
npm run lint      # 0 critical warnings
```

---

### Git Workflow

**Regras Obrigatórias:**

- ✅ Git sempre atualizado (working tree clean antes de nova fase)
- ✅ Branch sempre atualizada e mergeada com main
- ✅ Commits frequentes com mensagens descritivas (Conventional Commits)
- ✅ Documentação atualizada no mesmo commit (não separado)
- ❌ NUNCA commitar código que não compila
- ❌ NUNCA commitar com erros TypeScript

**Commit Message Format:**

```bash
git commit -m "feat: add new feature X

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Referência:** `CONTRIBUTING.md` - Git workflow completo

---

### Git Hooks (Husky)

O projeto utiliza **Husky v9** para automatizar validações de qualidade.

**Hooks Configurados:**

| Hook | Validação | Bloqueia se |
|------|-----------|-------------|
| `pre-commit` | TypeScript (backend + frontend) | Erros TS encontrados |
| `commit-msg` | Conventional Commits format | Formato inválido |
| `pre-push` | Build (backend + frontend) | Build falhar |

**Arquivos:**
- `.husky/pre-commit` - Executa `npx tsc --noEmit`
- `.husky/commit-msg` - Valida pattern `^(feat|fix|docs|...):`
- `.husky/pre-push` - Executa `npm run build`

**Bypass de Emergência:**

```bash
git commit --no-verify -m "hotfix: ..."  # Pula pre-commit e commit-msg
git push --no-verify                      # Pula pre-push
```

**IMPORTANTE:** Bypass só deve ser usado em emergências. Os hooks garantem Zero Tolerance.

---

### Validação Completa e Robusta

**Para TODA nova funcionalidade:**

- ✅ **MCP Triplo Obrigatório:**
  1. Playwright (E2E testing)
  2. Chrome DevTools (snapshot + console + network)
  3. React DevTools (component tree + state)

- ✅ **Browser Session Management:** Se erro de conflito de browser, usar `/mcp-browser-reset`
- ✅ **Ultra-Thinking + TodoWrite:** Planejamento antes de execução
- ✅ **Screenshots de Evidência:** Salvar em `docs/screenshots/`
- ✅ **Relatório de Validação:** Criar `VALIDACAO_FASE_XX.md`

**Referência:** `METODOLOGIA_MCPS_INTEGRADA.md`

### Uso de MCPs de Browser

**Limitação Conhecida:**
Playwright MCP e Chrome DevTools MCP usam instâncias de browser SEPARADAS.

**Best Practice:**

- Para testes E2E: Use **apenas Playwright MCP** (100% funcional)
- Para debug de console/network: Use **Playwright** (`browser_console_messages`, `browser_network_requests`)
- Para performance traces: Use **Chrome DevTools** em sessão dedicada

**Workflow Recomendado:**

1. Navegue com Playwright: `mcp__playwright__browser_navigate`
2. Capture snapshot: `mcp__playwright__browser_snapshot`
3. Verifique console: `mcp__playwright__browser_console_messages`
4. Verifique network: `mcp__playwright__browser_network_requests`
5. Para a11y: Use após snapshot do Playwright

**Não Tente:**

- ❌ Usar Chrome DevTools para inspecionar página do Playwright
- ❌ Misturar browsers entre MCPs na mesma validação

---

### Dados Financeiros - Precisão Absoluta

**Regras NÃO-NEGOCIÁVEIS:**

- ✅ **Decimal (não Float)** para valores monetários
- ✅ **Cross-validation** mínimo 3 fontes
- ✅ **Timezone:** America/Sao_Paulo (sempre)
- ❌ NUNCA arredondar/manipular dados financeiros
- ❌ NUNCA usar dados mock em produção
- ❌ NUNCA ajustar valores para "parecer melhor"

**Exemplo:**

```typescript
// ❌ ERRADO
const price: number = 123.45;  // Float tem imprecisão

// ✅ CORRETO
import { Decimal } from 'decimal.js';
const price: Decimal = new Decimal('123.45');
```

**Referência CRÍTICA:** `.gemini/context/financial-rules.md` - Leitura obrigatória

---

### Não Duplicar Código/Funcionalidade

**Antes de criar qualquer novo componente/serviço/função:**

- ✅ Pesquisar no código: `grep -r "palavraChave"`
- ✅ Consultar `ARCHITECTURE.md` (mapa de componentes)
- ✅ Verificar se não existe solução similar
- ✅ Se existir → melhorar/evoluir o atual (não duplicar)
- ❌ NUNCA criar fluxo novo sendo que já existe

**Referência:** `CHECKLIST_TODO_MASTER.md` - Anti-Pattern #2

---

## Planejamento de Fases

### Template Obrigatório

**Para TODA nova fase:**

1. Criar `PLANO_FASE_XX_NOME.md` usando template de `IMPLEMENTATION_PLAN.md`
2. Ultra-Thinking: Análise profunda (não planejar só baseado em docs)
3. Analisar TODOS artefatos relacionados (código + docs)
4. Code review do planejamento (antes de implementar)
5. Versionamento do plano (v1.0, v1.1, v2.0)

**Workflow:**

```
Planejamento (PLANO_FASE_XX.md)
    ↓
Code Review Aprovado
    ↓
Implementação
    ↓
Validação MCP Triplo
    ↓
VALIDACAO_FASE_XX.md
    ↓
Commit + Atualizar ROADMAP.md
```

**Referência:** `IMPLEMENTATION_PLAN.md` - Template completo

---

## Documentação Sempre Atualizada

### Arquivos que DEVEM ser atualizados em CADA fase:

| Arquivo | Quando Atualizar | Obrigatório? |
|---------|------------------|--------------|
| **CLAUDE.md** / **GEMINI.md** | Novas regras/convenções | ✅ SIM (sync obrigatório) |
| **ARCHITECTURE.md** | Novos componentes/fluxos | ✅ SIM |
| **ROADMAP.md** | Fase completa | ✅ SIM |
| **CHANGELOG.md** | Mudanças notáveis | ✅ SIM |
| **KNOWN-ISSUES.md** | Novos issues conhecidos | ✅ SIM (se aplicável) |
| **DATABASE_SCHEMA.md** | Novas entities/migrations | ✅ SIM (se aplicável) |
| **INDEX.md** | Nova documentação criada | ⚠️ IMPORTANTE |

### Onde Armazenar Novos Dados

**Consultar SEMPRE:** `ARCHITECTURE.md` seção "ONDE ARMAZENAR NOVOS DADOS"

**Tabela de decisão completa para:**
- Entities vs Campo JSON
- Onde criar novos endpoints
- Onde adicionar novas funcionalidades

---

## Critical Files Reference (Arquivos em .gemini/context/)

**⚠️ IMPORTANTE:** Os arquivos abaixo estão em `.gemini/context/` mas são **CRÍTICOS** para Claude Code:

### 1. Convenções de Código

**Arquivo:** `.gemini/context/conventions.md`

**Conteúdo:**
- Naming conventions (classes, files, variables, etc)
- Code style (indentation, quotes, semicolons)
- Imports organization
- Types vs Interfaces
- Git commit messages

**Quando consultar:** Antes de criar qualquer arquivo/classe/função nova

---

### 2. Regras de Dados Financeiros

**Arquivo:** `.gemini/context/financial-rules.md`

**Conteúdo CRÍTICO:**
- Tipos de dados (Decimal vs Float)
- Precisão e arredondamento
- Timezone (America/Sao_Paulo)
- Cross-validation (mínimo 3 fontes)
- Outlier detection
- Corporate actions (splits, dividends)

**Quando consultar:** Antes de trabalhar com QUALQUER dado financeiro

**LEITURA OBRIGATÓRIA - NÃO-NEGOCIÁVEL**

---

### 3. Known Issues (Problemas Conhecidos)

**Arquivo:** `.gemini/context/known-issues.md`

**Conteúdo:**
- 9 issues documentados com root cause
- Soluções aplicadas
- Lições aprendidas
- Procedimentos de recuperação
- Checklist de prevenção

**Quando consultar:**
- Antes de modificar Docker volumes
- Antes de trabalhar com scrapers
- Quando encontrar erro similar
- Antes de operações destrutivas

**Arquivo Público (resumo):** `KNOWN-ISSUES.md` (raiz do projeto)

---

## Script de Gerenciamento

### system-manager.ps1

**Localização:** `system-manager.ps1` (raiz do projeto)

**Versão:** 2.0 - Suporte completo a 11 serviços com profiles

**Serviços Gerenciados:**

| Tipo | Serviços | Comando |
|------|----------|---------|
| Core (8) | postgres, redis, python-service, backend, frontend, scrapers, api-service, orchestrator | `start` |
| Dev (2) | pgadmin, redis-commander | `start-dev` |
| Production (1) | nginx | `start-prod` |

**Funcionalidades:**
- ✅ Check prerequisites (Docker, Node.js, etc)
- ✅ Start/Stop/Restart services (individual ou em grupo)
- ✅ Status de todos os 11 containers
- ✅ Health check completo (HTTP + Docker inspect)
- ✅ View logs
- ✅ Clean/rebuild
- ✅ Validação de environment
- ✅ Suporte a profiles Docker (dev/production)
- ✅ Verificação de volumes e rede
- ✅ Restart inteligente com dependências

**Uso Obrigatório:**
- Antes de QUALQUER teste com MCPs
- Antes de validação de frontend/backend
- Após mudanças em docker-compose.yml
- Para verificar saúde do ambiente

**Comandos Principais:**

```powershell
# Inicialização
.\system-manager.ps1 start           # Core services (8)
.\system-manager.ps1 start-dev       # Core + pgadmin + redis-commander
.\system-manager.ps1 start-prod      # Core + nginx
.\system-manager.ps1 stop            # Parar todos os serviços

# Status e Diagnóstico
.\system-manager.ps1 status          # Status de todos os serviços
.\system-manager.ps1 health          # Health check completo
.\system-manager.ps1 volumes         # Listar volumes Docker
.\system-manager.ps1 network         # Verificar rede Docker

# Gerenciamento
.\system-manager.ps1 restart-service backend   # Reiniciar serviço específico
.\system-manager.ps1 logs scrapers             # Ver logs de um serviço
.\system-manager.ps1 help                      # Ajuda completa
```

---

## Python Scrapers (Playwright)

### Arquitetura e Padrão Standardizado

**Localização:** `backend/python-scrapers/`

**Framework:** Playwright (migrado de Selenium em 2025-11-28)

**Scrapers ativos:** 2 (fundamentus, bcb)
**Scrapers aguardando migração:** 24

### Padrão Obrigatório - BeautifulSoup Single Fetch

**❌ NUNCA fazer** (padrão antigo Selenium):
```python
# Múltiplos await operations (lento, pode causar Exit 137)
tables = await page.query_selector_all("table")
for table in tables:
    rows = await table.query_selector_all("tr")
    for row in rows:
        cells = await row.query_selector_all("td")
        # ... múltiplos awaits = LENTO
```

**✅ SEMPRE fazer** (padrão novo Playwright + BeautifulSoup):
```python
from bs4 import BeautifulSoup

# Single HTML fetch (rápido, ~10x mais rápido)
html_content = await page.content()  # await #1 (ÚNICO)
soup = BeautifulSoup(html_content, 'html.parser')

# All operations local (sem await)
tables = soup.select("table")  # local
for table in tables:
    rows = table.select("tr")  # local
    for row in rows:
        cells = row.select("td")  # local
        # ... instantâneo!
```

### Regras Críticas

1. **Browser Individual** (não compartilhado)
   - Cada scraper tem `self.playwright`, `self.browser`, `self.page`
   - Seguir padrão do backend TypeScript (`abstract-scraper.ts`)

2. **Wait Strategy**
   - ✅ Usar `wait_until='load'` (rápido)
   - ❌ EVITAR `wait_until='networkidle'` (analytics lentos = timeout)

3. **Cleanup Completo**
   - Sempre fechar: `page`, `browser`, `playwright` (nessa ordem)

4. **Performance**
   - Meta: <10s por scrape
   - Usar single HTML fetch + BeautifulSoup local parsing

### Arquivos Críticos

- **PLAYWRIGHT_SCRAPER_PATTERN.md** - Template e padrão standardizado (LEITURA OBRIGATÓRIA)
- **VALIDACAO_MIGRACAO_PLAYWRIGHT.md** - Validação completa da migração
- **ERROR_137_ANALYSIS.md** - Análise do Exit Code 137 (resolvido)
- **base_scraper.py** - Classe base (arquitetura Playwright)

### Quando Consultar

- **Antes de migrar qualquer scraper** → Ler `PLAYWRIGHT_SCRAPER_PATTERN.md`
- **Erro Exit 137** → Verificar se está usando BeautifulSoup pattern
- **Scraper lento (>10s)** → Verificar múltiplos `await` operations
- **Container restarting** → Verificar `main.py` imports (apenas scrapers migrados)

### Testing

```bash
# Test individual scraper
docker exec invest_scrapers python test_fundamentus.py
docker exec invest_scrapers python test_bcb.py

# Check container status
docker logs invest_scrapers --tail 50

# Restart scrapers service
docker-compose restart scrapers
```

---

## Gemini 3 Pro - Protocolo de Segunda Opiniao (Advisor)

### Arquitetura de Integracao

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DECISAO HIBRIDO                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐         ┌─────────────────┐                  │
│   │  CLAUDE CODE    │ ──────► │  GEMINI 3 PRO   │                  │
│   │  (DECISOR)      │ consulta│  (ADVISOR)      │                  │
│   │                 │ ◄────── │                 │                  │
│   │  - Implementa   │ opiniao │  - Analisa      │                  │
│   │  - Decide       │         │  - Sugere       │                  │
│   │  - Executa      │         │  - NAO executa  │                  │
│   └─────────────────┘         └─────────────────┘                  │
│          │                                                          │
│          ▼                                                          │
│   ┌─────────────────┐                                              │
│   │ DECISAO FINAL   │ ◄── Claude SEMPRE tem autoridade final       │
│   │ (CLAUDE CODE)   │                                              │
│   └─────────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Principio Fundamental:**
- Claude Code = **DECISOR** (autoridade final, implementador)
- Gemini 3 Pro = **ADVISOR** (consultor, segunda opiniao, SEM poder de execucao)

### MCP Instalado

**Server:** `gemini-advisor` via `gemini-mcp-tool-windows-fixed`
**Status:** Ativo e conectado
**Modelo:** `gemini-3-pro-preview` (usar com parametro model)
**Modelos disponiveis:** `gemini-3-pro-preview` (melhor), `gemini-2.5-pro`, `gemini-2.5-flash`
**Context window:** 1M tokens

### Quando Claude DEVE Consultar Gemini

| Cenario | Prioridade | Justificativa |
|---------|------------|---------------|
| Dados financeiros criticos | **ALTA** | Taxa de alucinacao Claude 12% vs Gemini 88% - Claude mais preciso, mas segunda opiniao reduz risco |
| Analise de codebase grande (>50 arquivos) | **ALTA** | Gemini tem 1M tokens vs 200K Claude |
| Decisoes arquiteturais | **MEDIA** | Perspectiva diferente pode revelar blind spots |
| Refatoracao > 5 arquivos | **MEDIA** | Validar impacto em arquivos relacionados |
| Escolha entre alternativas | **MEDIA** | Debate de pros/cons |
| Debugging complexo | **BAIXA** | Claude e superior (80.9% vs 76.2% SWE-bench) |
| Tarefas < 50 linhas | **NAO CONSULTAR** | Overhead nao compensa |

### Quando Claude NAO DEVE Consultar Gemini

- Bug fixes simples (Claude e melhor em debugging)
- Tarefas triviais (< 50 linhas de codigo)
- Quando ja tem certeza da solucao
- Prototipagem rapida (adiciona latencia desnecessaria)
- Codigo que precisa de precisao absoluta (Claude tem menor taxa de alucinacao)

### Limitacoes Conhecidas do Gemini 3 Pro (CRITICO)

**Claude DEVE considerar estas limitacoes ao interpretar respostas do Gemini:**

| Limitacao | Impacto | Como Claude Deve Tratar |
|-----------|---------|-------------------------|
| **Taxa de alucinacao 88%** | Pode afirmar coisas incorretas | Verificar SEMPRE com codigo fonte |
| **Afirma "corrigido" quando nao esta** | Falso positivo em validacoes | Testar manualmente apos sugestao |
| **Over-optimization** | Muda codigo que foi especificado | Ignorar se contradiz requisitos |
| **Infinite loops em edicao** | Pode travar em old_string not found | Nao usar para edicao direta |
| **Instabilidade em picos** | Provider overload errors | Retry ou prosseguir sem consulta |
| **Hallucina estruturas cross-language** | Inventa models Java em projeto Python | Validar linguagem correta |

**Fontes:**
- [Gemini 3 Pro Hallucination Rate - The Decoder](https://the-decoder.com/gemini-3-pro-tops-new-ai-reliability-benchmark-but-hallucination-rates-remain-high/)
- [GitHub Issues - google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli/issues)

### Protocolo de Consulta Inteligente

**Workflow Recomendado com Sequential Thinking + Gemini:**

```
1. Claude inicia Sequential Thinking
   ↓
2. Durante analise, Claude identifica necessidade de segunda opiniao
   ↓
3. Claude formula pergunta ESPECIFICA e CONTEXTUALIZADA para Gemini
   ↓
4. Gemini retorna analise/sugestao
   ↓
5. Claude AVALIA criticamente a resposta considerando limitacoes
   ↓
6. Claude DECIDE (aceita, rejeita ou adapta sugestao)
   ↓
7. Claude IMPLEMENTA a decisao final
   ↓
8. Claude valida com Zero Tolerance (tsc, build, lint)
```

### Como Formular Consultas ao Gemini

**Template de Consulta Efetiva:**

```markdown
CONTEXTO:
- Projeto: [descrever brevemente]
- Stack: [tecnologias]
- Arquivos envolvidos: [listar]

SITUACAO:
[Descrever o problema/decisao de forma clara]

CODIGO RELEVANTE:
[Incluir trechos especificos - Gemini tem 1M tokens]

PERGUNTA ESPECIFICA:
[Uma pergunta clara e objetiva]

RESTRICOES:
[Listar restricoes que Gemini deve respeitar]
```

**Exemplo de Consulta Bem Formulada:**

```markdown
CONTEXTO:
- Projeto: B3 AI Analysis Platform
- Stack: NestJS + TypeORM + PostgreSQL
- Arquivo: backend/src/scrapers/scrapers.service.ts

SITUACAO:
Estou implementando cross-validation de dados financeiros.
Preciso decidir entre usar media ou mediana para consolidar valores de 6 fontes.

CODIGO RELEVANTE:
[codigo do metodo atual]

PERGUNTA ESPECIFICA:
Qual abordagem e mais robusta para dados financeiros B3:
1. Media com outlier detection (threshold 10%)
2. Mediana (naturalmente resistente a outliers)

RESTRICOES:
- Deve manter precisao Decimal (nao Float)
- Minimo 3 fontes concordando
- Timezone America/Sao_Paulo
```

### Interpretando Respostas do Gemini

**Claude DEVE aplicar este filtro critico:**

1. **Verificar facticidade:** Gemini afirmou algo? Validar no codigo fonte
2. **Checar consistencia:** Sugestao contradiz regras do projeto? Ignorar
3. **Avaliar completude:** Resposta considera todas restricoes? Complementar se necessario
4. **Testar viabilidade:** Sugestao e implementavel? Simular antes de aplicar
5. **Documentar decisao:** Registrar por que aceitou/rejeitou sugestao

**Padrao de Documentacao:**

```markdown
## Consulta Gemini: [titulo]
**Data:** YYYY-MM-DD
**Contexto:** [breve descricao]

### Pergunta
[pergunta formulada]

### Resposta Gemini
[resumo da resposta]

### Avaliacao Claude
- Pontos aceitos: [lista]
- Pontos rejeitados: [lista com justificativa]
- Adaptacoes: [modificacoes feitas]

### Decisao Final
[o que foi implementado e por que]
```

### Integracao com MCPs Existentes

**Combinacao Recomendada:**

| Fase | MCPs a Usar | Ordem |
|------|-------------|-------|
| Ultra-Thinking | Sequential Thinking + Gemini (se complexo) | 1. ST analisa → 2. Gemini opina → 3. ST decide |
| Analise de Contexto | Filesystem + Gemini | 1. FS le arquivos → 2. Gemini analisa contexto grande |
| Code Review | Gemini + Sequential Thinking | 1. Gemini revisa → 2. ST avalia criticas |
| Validacao | Shell + Chrome DevTools | SEM Gemini (validacao objetiva) |
| Implementacao | Filesystem + Shell | SEM Gemini (Claude implementa sozinho) |

### Anti-Patterns (NUNCA FAZER)

| Anti-Pattern | Por que e Ruim | O que Fazer |
|--------------|----------------|-------------|
| Delegar decisao ao Gemini | Claude perde controle | Claude sempre decide |
| Aceitar sugestao sem validar | Gemini alucina 88% | Verificar no codigo |
| Consultar para tarefas triviais | Overhead desnecessario | Resolver diretamente |
| Pedir para Gemini implementar | Gemini nao executa | Claude implementa |
| Ignorar limitacoes documentadas | Bugs e inconsistencias | Consultar tabela de limitacoes |
| Consultar sem contexto | Resposta generica inutil | Usar template de consulta |

### Metricas de Uso

**Claude deve registrar internamente:**

- Consultas ao Gemini por sessao
- Taxa de aceitacao de sugestoes
- Sugestoes rejeitadas e motivo
- Tempo economizado vs overhead

**Meta:** Consultar Gemini em ~20-30% das tarefas complexas, com taxa de utilidade >70%

---

## PM Expert Agent - Validação 100% do Ecossistema

### Visão Geral

O **PM Expert** é um sub-agent ultra-robusto que combina 4 roles em 1:

1. **Product Manager** - Pesquisa de mercado, análise competitiva, 30+ fontes
2. **QA Lead** - Validação e testes de 100% do ecossistema
3. **DevOps** - Monitoramento de infraestrutura, logs, troubleshooting
4. **Tech Lead** - Garantia de qualidade, dependências, arquitetura

### Quando Invocar

**Use o PM Expert para:**

| Tarefa | Descrição |
|--------|-----------|
| Validação 100% | Testar frontend (12 páginas), backend (10 controllers), infra (13 containers) |
| Pesquisa de Mercado | Consultar 30+ fontes de dados financeiros |
| Testes E2E Massivos | Usar Playwright + Chrome DevTools + A11y MCPs em paralelo |
| Análise de Concorrentes | Pesquisar Fundamentei, StatusInvest, TradingView, etc. |
| Troubleshooting | Investigar bugs, gaps, erros com logs e traces |
| Gestão de Dependências | Verificar npm/pip outdated, vulnerabilidades |
| Auditorias | Validação completa de arquitetura e código |

### Como Invocar

```bash
Use the pm-expert to validate 100% of the ecosystem and report all gaps
```

ou

```bash
Use the pm-expert to research competitors and create improvement plan
```

### Ferramentas Disponíveis

O PM Expert tem acesso a:

- **Read, Edit, Write, Glob, Grep, Bash** - Operações de arquivo
- **WebFetch, WebSearch** - Pesquisa web
- **Task** - Lançar sub-agentes em paralelo
- **mcp__playwright__*** - Testes E2E
- **mcp__chrome-devtools__*** - Debug de browser
- **mcp__a11y__*** - Testes de acessibilidade
- **mcp__sequential-thinking__*** - Análise profunda
- **mcp__react-context__*** - Debug de componentes React

### Workflow do PM Expert

```text
1. Ler documentação crítica (CLAUDE.md, ARCHITECTURE.md)
   ↓
2. Verificar builds (tsc --noEmit, npm run build)
   ↓
3. Testar Frontend com MCP Triplo
   - Playwright: navegação + snapshot
   - Chrome DevTools: console + network
   - A11y: WCAG 2.1 AA
   ↓
4. Testar Backend
   - Health check
   - Endpoints autenticados
   - Queue jobs
   ↓
5. Verificar Infraestrutura
   - Docker containers
   - Conectividade
   - Logs
   ↓
6. Documentar Findings
   - Gaps encontrados
   - Screenshots de evidência
   - Atualizar KNOWN-ISSUES.md
```

### Quality Standards

**Zero Tolerance:**

- 0 erros TypeScript (frontend + backend)
- 0 falhas de build
- 0 erros críticos no console
- 0 requests falhando (não-auth)

**Cross-Validation:**

- Mínimo 3 fontes por data point
- Threshold de discrepância: 10%
- Score de confiança calculado

### Documentação

- **Definição:** `.claude/agents/pm-expert.md`
- **Guia de Uso:** `docs/PM_AGENT_GUIDE.md`
- **Checklist:** `docs/VALIDATION_CHECKLIST.md`

---

## Sub-Agents Especializados - Guia de Uso

### Visão Geral

O projeto possui **10 sub-agents especializados** que DEVEM ser invocados para tarefas específicas.

### Matriz de Invocação por Contexto

| Tarefa | Agent Recomendado | Keywords Trigger |
|--------|-------------------|------------------|
| Criar/modificar endpoint NestJS | `backend-api-expert` | controller, service, dto, endpoint |
| Criar/modificar componente React | `frontend-components-expert` | component, page, hook, shadcn |
| Validar 100% do ecossistema | `pm-expert` | validar, ecossistema, 100%, audit |
| Criar/debugar scraper Python | `scraper-development-expert` | scraper, playwright, beautifulsoup |
| Criar/debugar gráficos | `chart-analysis-expert` | chart, candlestick, recharts, lightweight |
| Corrigir erros TypeScript | `typescript-validation-expert` | tsc, type error, strict, any |
| Criar/debugar jobs BullMQ | `queue-management-expert` | job, queue, bullmq, processor |
| Criar migrations TypeORM | `database-migration-expert` | migration, schema, entity, index, sql |
| Atualizar documentação técnica | `documentation-expert` | docs, readme, changelog, roadmap, index |
| Testes E2E e validação MCP Triplo | `e2e-testing-expert` | e2e, playwright, validation, a11y, triplo |

### Quando Usar Cada Agent

#### 1. backend-api-expert

**Use quando:** Criar endpoints, services, DTOs, migrations
**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Exemplo de prompt:**

```text
Use o backend-api-expert para criar um novo endpoint GET /api/v1/dividends
que retorna os dividendos de um ativo específico.
```

#### 2. frontend-components-expert

**Use quando:** Criar páginas, componentes, hooks React
**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Exemplo de prompt:**

```text
Use o frontend-components-expert para criar um componente de card
de dividendos com shadcn/ui e tailwind.
```

#### 3. pm-expert

**Use quando:** Validação completa, pesquisa de mercado, troubleshooting profundo
**Ferramentas:** Todas + WebSearch + Playwright + Chrome DevTools + a11y
**Exemplo de prompt:**

```text
Use o pm-expert para validar 100% do ecossistema e reportar todos os gaps.
```

#### 4. scraper-development-expert

**Use quando:** Criar scrapers, implementar OAuth, debugar coleta de dados
**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Exemplo de prompt:**

```text
Use o scraper-development-expert para criar um scraper de dividendos
do site Fundamentus usando Playwright + BeautifulSoup.
```

#### 5. chart-analysis-expert

**Use quando:** Criar gráficos, candlesticks, indicadores técnicos
**Ferramentas:** Read, Edit, Write, Chrome DevTools, Playwright
**Exemplo de prompt:**

```text
Use o chart-analysis-expert para debugar por que o gráfico de candlestick
não está renderizando corretamente.
```

#### 6. typescript-validation-expert

**Use quando:** Corrigir erros TypeScript, adicionar tipos, refatorar para strict mode
**Ferramentas:** Read, Edit, Glob, Grep, Bash
**Exemplo de prompt:**

```text
Use o typescript-validation-expert para corrigir todos os erros
de tipo no projeto frontend.
```

#### 7. queue-management-expert

**Use quando:** Criar jobs BullMQ, configurar retry, debugar filas
**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Exemplo de prompt:**

```text
Use o queue-management-expert para criar um job de sincronização
de dados com retry exponencial.
```

#### 8. database-migration-expert

**Use quando:** Criar migrations TypeORM, schema changes, indexes, data migrations
**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Exemplo de prompt:**

```text
Use o database-migration-expert para criar uma migration que adiciona
a tabela watchlists com relacionamento para users e indexes otimizados.
```

#### 9. documentation-expert

**Use quando:** Atualizar documentação de fases, sync CLAUDE.md ↔ GEMINI.md, ROADMAP.md
**Ferramentas:** Read, Edit, Write, Glob, Grep
**Exemplo de prompt:**

```text
Use o documentation-expert para criar VALIDACAO_FASE_133.md e atualizar
ROADMAP.md com a fase completa.
```

#### 10. e2e-testing-expert

**Use quando:** Testes E2E, validação MCP Triplo, accessibility audits
**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash, mcp__playwright__*, mcp__chrome-devtools__*, mcp__a11y__*
**Exemplo de prompt:**

```text
Use o e2e-testing-expert para executar MCP Triplo na página /assets e
validar que não há erros de console, network ou acessibilidade.
```

### Anti-Patterns de Agents

| Anti-Pattern | Problema | Correto |
|--------------|----------|---------|
| ❌ Fazer tudo sozinho | Uso ineficiente de contexto | ✅ Delegar para specialist |
| ❌ Usar agent errado | Resultado subótimo | ✅ Consultar matriz acima |
| ❌ Não fornecer contexto | Agent precisa re-explorar | ✅ Passar contexto relevante |

---

## Pesquisa Web Proativa (WebSearch Strategy)

### Quando Claude DEVE Pesquisar Automaticamente

| Situação | Trigger | Queries Paralelas |
|----------|---------|-------------------|
| Decisão arquitetural | "qual usar", "melhor opção" | 4 queries |
| Erro desconhecido | "não sei", "nunca vi" | 2-3 queries |
| Best practices | "como fazer corretamente" | 3 queries |
| Comparar alternativas | "A vs B", "qual escolher" | 4 queries |
| Troubleshooting complexo | "não funciona", "root cause" | 3 queries |
| Melhoria/evolução | "otimizar", "modernizar" | 3 queries |

### Template de Queries (4 paralelas)

```text
1. WebSearch: "[tecnologia] best practices 2025"
2. WebSearch: "[tecnologia] official documentation"
3. WebSearch: "[problema] solution site:stackoverflow.com"
4. WebSearch: "[alternativas] comparison 2025"
```

### Fontes Confiáveis (Whitelist)

| Tipo | Domínios |
|------|----------|
| Docs oficiais | *.dev, docs.*, *.io/docs, github.com/*/docs |
| Q&A | stackoverflow.com, github.com/issues |
| Blogs | dev.to, medium.com (tech), hashnode.dev |
| Benchmarks | benchmarksgame, techempower |

### Cross-Validation Obrigatório

- **Mínimo 3 fontes** concordando antes de decisão
- **Prioridade:** Docs oficiais > Blogs 2024-2025 > StackOverflow
- **Data:** Preferir conteúdo de 2024-2025
- **Descartar:** Informação anterior a 2023 (exceto conceitos fundamentais)

### Anti-Patterns (NUNCA fazer)

- ❌ Usar informação de 2022 ou anterior sem validar
- ❌ Confiar em única fonte para decisões
- ❌ Ignorar documentação oficial
- ❌ Não citar fontes usadas
- ❌ Copiar código sem entender contexto

**Referência:** CHECKLIST_ECOSSISTEMA_COMPLETO.md - Seção 22

### WebSearch Automático (OBRIGATÓRIO)

**Situações que DEVEM triggerar WebSearch ANTES de responder:**

| Trigger | Exemplo | Queries |
|---------|---------|---------|
| Decisão arquitetural | "qual framework usar?" | 4 paralelas |
| Incerteza explícita | "não sei", "talvez" | 3 paralelas |
| Best practices | "como fazer corretamente?" | 3 paralelas |
| Erro desconhecido | Stack trace novo | 2 paralelas |
| Comparação | "Redis vs Memcached" | 4 paralelas |

**Template de Queries Paralelas:**
1. `"[tecnologia] best practices 2025"`
2. `"[tecnologia] official documentation"`
3. `"[problema] solution site:stackoverflow.com OR github.com"`
4. `"[alternativa1] vs [alternativa2] comparison 2025"`

**Anti-Pattern (NUNCA FAZER):**
- ❌ Responder com incerteza sem pesquisar
- ❌ Usar conhecimento desatualizado (< 2024)
- ❌ Ignorar documentação oficial
- ❌ Não citar fontes usadas

---

## Skills & Slash Commands - Invocação Automática

### Visão Geral

O projeto possui **14 slash commands** que DEVEM ser invocados em contextos específicos.

### Matriz de Invocação Obrigatória

| Contexto | Comando/Skill | Quando Invocar |
|----------|---------------|----------------|
| **Início de tarefa complexa** | `/check-context` | ANTES de começar |
| **Antes de QUALQUER commit** | `/validate-all` | Obrigatório |
| **Após mudanças frontend** | `/mcp-triplo` | Após editar .tsx/.css |
| **Nova fase do projeto** | `/new-phase` | Antes de implementar |
| **Validar fase completa** | `/validate-phase` | Após implementar |
| **Sincronizar documentação** | `/sync-docs` | Após mudar CLAUDE.md |
| **Verificar containers** | `/docker-status` | Antes de testar |
| **Corrigir erros TypeScript** | `/fix-ts-errors` | Quando tsc falhar |
| **Executar scraper** | `/run-scraper` | Para coleta de dados |
| **Commit de fase** | `/commit-phase` | Ao finalizar fase |
| **Validar ecossistema** | `/check-ecosystem` | Validação 100% |

### Workflow de Skills

```text
Início Tarefa
     │
     ▼
┌─────────────────┐
│ /check-context  │ ◄── Sempre primeiro
└────────┬────────┘
         │
         ▼
    [Implementação]
         │
         ▼
┌─────────────────┐
│ /validate-all   │ ◄── Antes de commit
└────────┬────────┘
         │
    Mudou frontend?
    ┌────┴────┐
    │ SIM    │ NÃO
    ▼         │
┌─────────────┐ │
│ /mcp-triplo │ │
└─────┬───────┘ │
      └────┬────┘
           ▼
┌─────────────────┐
│ /commit-phase   │ ◄── Commit padronizado
└─────────────────┘
```

### Anti-Patterns (NUNCA FAZER)

| Anti-Pattern | Consequência | Correto |
|--------------|--------------|---------|
| ❌ Commit sem `/validate-all` | Código quebrado no repo | ✅ Sempre validar |
| ❌ Editar frontend sem `/mcp-triplo` | Bugs visuais não detectados | ✅ Validar visualmente |
| ❌ Iniciar tarefa sem contexto | Retrabalho, inconsistências | ✅ `/check-context` primeiro |
| ❌ Ignorar erros TypeScript | Build falha em produção | ✅ `/fix-ts-errors` |

### Referência de Comandos

| Comando | Descrição | Arquivo |
|---------|-----------|---------|
| `/check-context` | Verifica contexto completo | `.claude/commands/check-context.md` |
| `/check-ecosystem` | Validação 100% ecossistema | `.claude/commands/check-ecosystem.md` |
| `/commit-phase` | Commit padronizado de fase | `.claude/commands/commit-phase.md` |
| `/docker-status` | Status dos containers | `.claude/commands/docker-status.md` |
| `/fix-ts-errors` | Corrige erros TypeScript | `.claude/commands/fix-ts-errors.md` |
| `/mcp-triplo` | Playwright + DevTools + a11y | `.claude/commands/mcp-triplo.md` |
| `/new-phase` | Cria PLANO_FASE_XX.md | `.claude/commands/new-phase.md` |
| `/run-scraper` | Executa scraper Python | `.claude/commands/run-scraper.md` |
| `/sync-docs` | Sincroniza CLAUDE.md ↔ GEMINI.md | `.claude/commands/sync-docs.md` |
| `/validate-all` | TypeScript + Build + Lint | `.claude/commands/validate-all.md` |
| `/validate-phase` | Validação completa de fase | `.claude/commands/validate-phase.md` |
| `/mcp-browser-reset` | Reset de sessões de browser dos MCPs | `.claude/commands/mcp-browser-reset.md` |
| `/validate-dev-config` | Valida configurações de desenvolvimento | `.claude/commands/validate-dev-config.md` |
| `/rebuild-guide` | Guia de rebuild vs restart de containers | `.claude/commands/rebuild-guide.md` |

---

## Additional Documentation

### Core Documentation (Raiz do Projeto)

- **README.md** - Overview do projeto, quick start, stack tecnológico, installation guide
- **ARCHITECTURE.md** - Arquitetura completa, fluxos, onde armazenar novos dados
- **DATABASE_SCHEMA.md** - Schema completo, relacionamentos, indexes
- **INSTALL.md** - Instalação completa (Docker, portas, env vars)
- **TROUBLESHOOTING.md** - 16+ problemas comuns com soluções
- **ROADMAP.md** - Histórico de 60+ fases completas
- **CHANGELOG.md** - Mudanças notáveis versionadas
- **INDEX.md** - Índice mestre de toda documentação (200+ arquivos)
- **KNOWN-ISSUES.md** - Issues conhecidos (resumo executivo)
- **IMPLEMENTATION_PLAN.md** - Template de planejamento de fases
- **VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md** - Compliance de regras
- **VALIDACAO_DOCUMENTACAO_CLAUDE_CODE.md** - Validação de acessibilidade de docs pelo Claude Code

### Python Scrapers Documentation

- **backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md** - Template e padrão standardizado (LEITURA OBRIGATÓRIA)
- **backend/python-scrapers/VALIDACAO_MIGRACAO_PLAYWRIGHT.md** - Relatório completo de validação
- **backend/python-scrapers/ERROR_137_ANALYSIS.md** - Análise técnica Exit Code 137 (resolvido)
- **backend/python-scrapers/MIGRATION_REPORT.md** - Status de migração de todos scrapers
- **backend/python-scrapers/SELENIUM_TO_PLAYWRIGHT_MIGRATION.md** - Guia de migração

### Gemini Context Files (Leitura Obrigatória)

- **.gemini/context/conventions.md** - Convenções de código
- **.gemini/context/financial-rules.md** - Regras de dados financeiros (CRÍTICO)
- **.gemini/context/known-issues.md** - Análise técnica de issues

### Process Documentation

- **CHECKLIST_TODO_MASTER.md** - Checklist ultra-robusto antes de cada fase
- **CHECKLIST_CODE_REVIEW_COMPLETO.md** - Code review obrigatório
- **METODOLOGIA_MCPS_INTEGRADA.md** - Integração MCPs + Ultra-Thinking + TodoWrite
- **MCPS_USAGE_GUIDE.md** - Guia técnico dos 8 MCPs

---

## Context Management (Sonnet 4.5 - 1M Context Beta)

### Limites Oficiais do Claude Sonnet 4.5

**Fontes Oficiais:**
- [Models Overview](https://platform.claude.com/docs/en/about-claude/models/all-models)
- [Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [1M Context Announcement](https://claude.com/blog/1m-context)

| Modelo | Context Window | Max Output | Preco Input | Preco Output |
|--------|----------------|------------|-------------|--------------|
| **Claude Sonnet 4.5** | **1M tokens (beta)** | **64K tokens** | $3/MTok ($6 >200K) | $15/MTok ($22.50 >200K) |
| Claude Opus 4.5 | 200K tokens | 64K tokens | $5/MTok | $25/MTok |
| Claude Haiku 4.5 | 200K tokens | 64K tokens | $1/MTok | $5/MTok |

### Especificacoes Sonnet 4.5 (Dezembro 2025)

| Parametro | Valor | Observacao |
|-----------|-------|------------|
| **Context Window (padrao)** | 200K tokens | ~150K palavras |
| **Context Window (beta)** | **1M tokens** | ~750K palavras, requer beta header |
| **Max Output Tokens** | 64K tokens | Igual ao Opus 4.5 |
| **Extended Thinking** | Sim | Tokens removidos automaticamente |
| **Context Awareness** | Sim | Rastreia tokens restantes nativamente |
| **API ID** | `claude-sonnet-4-5-20250929` | Versao mais recente |
| **Conhecimento confiavel** | Jan 2025 | Dados de treinamento ate Jul 2025 |

### Como Habilitar 1M Context Window

**Requisitos:**
- Organizacao em **Tier 4** ou com rate limits customizados
- Header beta obrigatorio: `context-1m-2025-08-07`

**Python SDK:**
```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["context-1m-2025-08-07"]  # Header obrigatorio para 1M
)
```

### Configuracao Otimizada (Sonnet 4.5 - 1M Contexto)

| Variavel | Valor | Observacao |
|----------|-------|------------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 64000 | Maximo oficial |
| `MAX_THINKING_TOKENS` | 100000 | Extended thinking |
| `MAX_MCP_OUTPUT_TOKENS` | 200000 | Output de MCPs |
| `MAX_TOOL_OUTPUT_TOKENS` | 200000 | Output de ferramentas |
| `BASH_DEFAULT_TIMEOUT_MS` | 600000 | 10 minutos - builds longos |
| `BASH_MAX_TIMEOUT_MS` | 1800000 | 30 minutos - operacoes muito longas |
| `MCP_TIMEOUT` | 120000 | 2 minutos - conexao inicial com MCPs |
| `MCP_TOOL_TIMEOUT` | 300000 | 5 minutos - operacoes de MCPs complexas |

**Notas:**
- Valores alinhados com limites oficiais da Anthropic (Dezembro 2025)
- Context window de 1M permite sessoes muito mais longas sem `/compact`

### Leitura de Arquivos Grandes

**IMPORTANTE:** O Read tool do Claude Code tem limite **HARDCODED de 25.000 tokens** que NAO pode ser alterado por variaveis de ambiente.

**Limites por Tipo de Ferramenta:**

| Ferramenta | Limite | Configuravel? |
|------------|--------|---------------|
| Read tool (built-in) | 25.000 tokens | NAO (hardcoded) |
| MCP tools (mcp__*) | 25.000 tokens | SIM (MAX_MCP_OUTPUT_TOKENS) |

**Variaveis Configuradas (afetam apenas MCPs):**

- `MAX_MCP_OUTPUT_TOKENS=25000` - Output de ferramentas MCP (padrao oficial)

**Arquivos de Configuracao:**

- `~/.claude/settings.json` (global)
- `.claude/settings.json` (projeto)
- `.claude/settings.local.json` (local)

**Solucao para Arquivos >25K tokens - Leitura em Chunks:**

```typescript
// Arquivo grande (ex: 71K tokens, ~6200 linhas)
// Dividir em chunks de ~1500 linhas

Read(file_path="arquivo.md", offset=1, limit=1500)      // Chunk 1
Read(file_path="arquivo.md", offset=1501, limit=1500)   // Chunk 2
Read(file_path="arquivo.md", offset=3001, limit=1500)   // Chunk 3
Read(file_path="arquivo.md", offset=4501, limit=1500)   // Chunk 4
// ... continua ate cobrir todo o arquivo
```

**Calculo de Chunks:**

- ~11.5 tokens por linha (media para markdown/codigo)
- 25.000 tokens / 11.5 = ~2.170 linhas maximo por chunk
- Recomendado: **1.500 linhas** por chunk (margem de seguranca)

**Referencias:**

- [GitHub Issue #4002](https://github.com/anthropics/claude-code/issues/4002) - Discussao do limite
- [GitHub Issue #7679](https://github.com/anthropics/claude-code/issues/7679) - Feature request para aumentar (pendente)

### Compact Instructions

Quando for necessario compactar contexto, use `/compact` com estas instrucoes:

```bash
/compact Keep: recent code changes, error traces, architecture decisions, current task status.
Discard: verbose explanations, old debug output, completed task details, intermediate steps.
```

### Extended Thinking Guidelines (Sonnet 4.5)

**Sonnet 4.5 preserva thinking blocks automaticamente entre turnos.**
**Context Awareness nativo rastreia tokens restantes durante a conversacao.**

**Use High Effort para:**

- Planejamento arquitetural
- Bugs complexos multi-arquivo
- Security reviews
- Analise de dados financeiros

**Use Medium Effort para:**

- Implementacao de features
- Debugging padrao
- Code review

**Use Low Effort para:**

- Refactoring simples
- Perguntas rapidas
- Verificacao de sintaxe

### Prevencao de "Prompt is too long"

1. **Compactar proativamente** a cada ~30-40 interacoes
2. **Usar `/clear`** ao iniciar tarefa completamente nova
3. **Monitorar com `/cost`** o uso de tokens
4. **Dividir tarefas complexas** em sessoes separadas
5. **Evitar carregar arquivos grandes** desnecessariamente

### Protecao para MCPs Playwright/Chrome DevTools

**Hooks de Protecao Ativos:**

| Hook | Script | Funcao |
|------|--------|--------|
| `context-monitor.js` | UserPromptSubmit | Monitora contexto, bloqueia em 85% |
| `pre-playwright-guard.js` | PreToolUse (MCPs) | Bloqueia snapshots quando contexto > 70% |

**Thresholds de Bloqueio:**

| Contexto | Acao |
|----------|------|
| < 50% | Permitir tudo |
| 50-70% | Warning, mas permite |
| 70-85% | BLOQUEIA snapshots (permite clicks, navegacao) |
| > 85% | BLOQUEIA TUDO, forcar /compact |

**Consumo de Tokens por Operacao MCP (1M Context):**

| Operacao | Tokens | % Contexto (200K) | % Contexto (1M) |
|----------|--------|-------------------|-----------------|
| `browser_snapshot` (pagina complexa) | 25-50k | 12-25% | **2.5-5%** |
| `take_snapshot` (Chrome DevTools) | 18-30k | 9-15% | **1.8-3%** |
| `browser_take_screenshot` (PNG) | ~1k | <1% | **<0.1%** |
| `browser_click/navigate` | ~100 | <0.1% | **<0.01%** |

**Thresholds Absolutos (1M Context):**

| Threshold | % | Tokens Absolutos |
|-----------|---|------------------|
| Warning | 50% | **500K tokens** |
| Compact | 70% | **700K tokens** |
| Block | 85% | **850K tokens** |

**Best Practice (Sonnet 4.5 - 1M):**

1. **Snapshots mais livres** - Com 1M, snapshots consomem apenas ~3% cada
2. **Menos `/compact`** - Thresholds absolutos muito maiores
3. **Sessoes longas** - Ate 75K linhas de codigo em uma sessao
4. **Context Awareness** - Modelo rastreia tokens automaticamente

### Pacotes MCP Oficiais (Nomes Corretos)

**IMPORTANTE:** Use os nomes corretos dos pacotes MCP. Os pacotes abaixo foram validados em 2025-12-17.

| MCP Server | Pacote npm Correto | Status |
|------------|-------------------|--------|
| **Playwright** | `@playwright/mcp@latest` | ✅ Oficial |
| **Chrome DevTools** | `chrome-devtools-mcp@latest` | ✅ Oficial |
| **React Context** | `react-context-mcp@latest` | ✅ Comunidade |
| **A11y (Accessibility)** | `a11y-mcp-server` | ✅ Comunidade |
| **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | ✅ Oficial |
| **Context7 (Docs)** | `@upstash/context7-mcp` | ✅ Comunidade (Upstash) |

**Pacotes INCORRETOS (NÃO EXISTEM no npm):**
- ❌ `@anthropic/mcp-server-a11y` → Use `a11y-mcp-server`
- ❌ `@anthropic/mcp-sequential-thinking` → Use `@modelcontextprotocol/server-sequential-thinking`
- ❌ `@anthropic/context7-mcp` → Use `@upstash/context7-mcp`

**Fontes:**
- [A11y MCP Server - LobeHub](https://lobehub.com/mcp/temanuel1-a11y-mcp-server)
- [Sequential Thinking MCP - PulseMCP](https://www.pulsemcp.com/servers/anthropic-sequential-thinking)
- [Context7 MCP - npm](https://www.npmjs.com/package/@upstash/context7-mcp)
- [Model Context Protocol Servers - GitHub](https://github.com/modelcontextprotocol/servers)

### Comandos Uteis

```bash
/compact   # Compactar contexto (usar com instrucoes especificas)
/clear     # Limpar contexto completamente
/cost      # Ver uso de tokens da sessao
/config    # Ver configuracoes atuais
/mcp       # Ver MCPs ativos
```
