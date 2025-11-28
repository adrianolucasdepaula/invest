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

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3100 | http://localhost:3100 |
| Backend API | 3101 | http://localhost:3101/api/v1 |
| PostgreSQL | 5532 | localhost:5532 |
| Redis | 6479 | localhost:6479 |
| PgAdmin | 5150 | http://localhost:5150 |
| noVNC (OAuth) | 6080 | http://localhost:6080 |

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

### Validação Completa e Robusta

**Para TODA nova funcionalidade:**

- ✅ **MCP Triplo Obrigatório:**
  1. Playwright (E2E testing)
  2. Chrome DevTools (snapshot + console + network)
  3. React DevTools (component tree + state)

- ✅ **Ultra-Thinking + TodoWrite:** Planejamento antes de execução
- ✅ **Screenshots de Evidência:** Salvar em `docs/screenshots/`
- ✅ **Relatório de Validação:** Criar `VALIDACAO_FASE_XX.md`

**Referência:** `METODOLOGIA_MCPS_INTEGRADA.md`

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
- 8 issues documentados com root cause
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

**Funcionalidades:**
- ✅ Check prerequisites (Docker, Node.js, etc)
- ✅ Start/Stop/Restart services
- ✅ Status de todos containers
- ✅ View logs
- ✅ Clean/rebuild
- ✅ Validação de environment

**Uso Obrigatório:**
- Antes de QUALQUER teste com MCPs
- Antes de validação de frontend/backend
- Após mudanças em docker-compose.yml
- Para verificar saúde do ambiente

**Comando:**

```powershell
.\system-manager.ps1 status    # Ver status de todos serviços
.\system-manager.ps1 start     # Iniciar todos serviços
.\system-manager.ps1 restart   # Reiniciar serviços específicos
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

## Additional Documentation

### Core Documentation (Raiz do Projeto)

- **README.md** - Overview do projeto, quick start, stack tecnológico, installation guide
- **ARCHITECTURE.md** - Arquitetura completa, fluxos, onde armazenar novos dados
- **DATABASE_SCHEMA.md** - Schema completo, relacionamentos, indexes
- **INSTALL.md** - Instalação completa (Docker, portas, env vars)
- **TROUBLESHOOTING.md** - 16+ problemas comuns com soluções
- **ROADMAP.md** - Histórico de 55+ fases completas
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
