# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 📌 **IMPORTANTE:** Este arquivo é carregado em TODAS as conversas. Contém apenas o essencial + @ references para guias detalhados.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Common Commands](#common-commands)
3. [Architecture](#architecture)
4. [Service Ports](#service-ports)
5. [Financial Data Rules](#financial-data-rules) ⚠️ **CRÍTICO**
6. [Zero Tolerance Policy](#zero-tolerance-policy) ⚠️ **CRÍTICO**
7. [Validation & MCPs](#validation--mcps)
8. [Mandatory Agent Usage](#mandatory-agent-usage) ⚠️ **CRÍTICO**
9. [Checklist Automatico](#checklist-automatico)
10. [Detailed Guides](#detailed-guides)

---

## Project Overview

B3 AI Analysis Platform - Investment analysis platform for Brazilian stock exchange (B3) with AI-powered fundamental, technical, and macroeconomic analysis.

**Stack:** NestJS 10 + Next.js 14 App Router + PostgreSQL 16 + TypeORM + BullMQ/Redis + Python Scrapers

**Purpose:** Provide investors with AI-powered analysis combining fundamental metrics, technical indicators, and macroeconomic data with cross-validated data from 6+ sources.

@ .claude/guides/development-principles.md

---

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

---

## Architecture

```
Frontend (Next.js :3100) ←→ Backend (NestJS :3101) ←→ PostgreSQL (:5532)
                                    ↓
                              BullMQ + Redis (:6479)
                                    ↓
                           Python Scrapers (Playwright)
```

**Key Directories:**
- `backend/src/api/` - REST controllers, services, DTOs
- `backend/src/database/entities/` - TypeORM entities
- `backend/src/database/migrations/` - Database migrations
- `frontend/src/app/(dashboard)/` - Authenticated pages (App Router)
- `frontend/src/components/` - React components (Shadcn/ui)

**Main Entities:** Asset, AssetPrice, TickerChange, Analysis, Portfolio/PortfolioPosition

**Para detalhes completos:** `ARCHITECTURE.md`

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3100 | http://localhost:3100 |
| Backend API | 3101 | http://localhost:3101/api/v1 |
| PostgreSQL | 5532 | localhost:5532 |
| Redis | 6479 | localhost:6479 |
| PgAdmin | 5150 | http://localhost:5150 |
| Python API Service | 8000 | http://localhost:8000 |

---

## Financial Data Rules ⚠️ **CRÍTICO**

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

**Por que Decimal.js é obrigatório:**
- Float: `0.1 + 0.2 === 0.3` → `false` (!)
- Decimal: Precisão matemática perfeita para valores monetários
- Compliance com padrões financeiros internacionais

@ .claude/guides/financial-data-rules.md (detalhes completos, cross-validation, outlier detection)

---

## Zero Tolerance Policy ⚠️ **CRÍTICO**

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

**Git Workflow:**
- Commits frequentes com mensagens descritivas (Conventional Commits)
- Documentação atualizada no mesmo commit (não separado)
- ❌ NUNCA commitar código que não compila
- ❌ NUNCA commitar com erros TypeScript

**Git Hooks (Husky v9):**
- `pre-commit` - Bloqueia se erros TypeScript
- `commit-msg` - Valida Conventional Commits format
- `pre-push` - Bloqueia se build falhar

@ .claude/guides/zero-tolerance-policy.md (workflow completo, Husky setup)

---

## Validation & MCPs

**Para TODA nova funcionalidade:**

- ✅ **MCP Triplo Obrigatório:**
  1. Playwright (E2E testing)
  2. Chrome DevTools (snapshot + console + network)
  3. A11y (WCAG 2.1 AA)

- ✅ **MCP Quadruplo:** Para features complexas ou bugs >2h sem solução
  - MCP Triplo + Documentation Research (busca preventiva em conhecimento)

- ✅ **Context7 MCP (Proactive Documentation Research):** ⭐ **NOVO**
  - **Quando usar:** ANTES de implementar features com bibliotecas novas/desconhecidas
  - **ROI:** 10-20h economizadas/mês (95% redução trial-and-error)
  - **Workflow:** 2 passos
    1. `mcp__context7__resolve-library-id` → obter Library ID
    2. `mcp__context7__query-docs` → consultar documentação atualizada
  - **Limite:** Máximo 3 calls/conversa
  - **Skill:** `/research-lib` (automatiza workflow)

  **Exemplos de uso:**
  - Nova biblioteca: "recharts", "bullmq", "typeorm"
  - Feature complexa: "JWT auth with refresh tokens in NestJS"
  - Breaking changes: Atualização major version (v1 → v2)
  - Bug >1h sem solução em biblioteca de terceiros

  **Anti-pattern:** Implementar direto → 4-8h trial-and-error
  **Correto:** Context7 primeiro → 10min research + implementação correta

- ✅ **Browser Session Management:** Se erro de conflito, usar `/mcp-browser-reset`

**Workflow Recomendado:**

```text
1. Navegue: mcp__playwright__browser_navigate
2. Snapshot: mcp__playwright__browser_snapshot
3. Console: mcp__playwright__browser_console_messages
4. Network: mcp__playwright__browser_network_requests
5. A11y: Teste após snapshot
```

**Limitação Conhecida:** Playwright MCP e Chrome DevTools MCP usam browsers SEPARADOS. Não misturar na mesma validação.

@ .claude/guides/testing-patterns.md (multi-layer testing, React Testing Library, Vitest)

---

## Mandatory Agent Usage ⚠️ **CRÍTICO**

**Specialized agents DEVEM ser usados para:**

### Regras de Delegação Obrigatória

**SEMPRE delegar para agent especializado quando:**

1. **Backend API changes** → `backend-api-expert`
   - Controllers, services, DTOs, entities TypeORM
   - Garante NestJS best practices + Zero Tolerance

2. **Frontend UI changes** → `frontend-components-expert`
   - Components, pages, hooks React
   - Garante Next.js App Router patterns + accessibility

3. **Database schema changes** → `database-migration-expert`
   - Migrations, entities, indexes
   - Previne corrupção de schema + garante rollback

4. **Phase completion** → `pm-expert`
   - Validação 100% do ecossistema antes de declarar fase completa
   - Previne regressões + garante qualidade

### Quick Decision Tree

```
Task involves...
├─ Backend NestJS? ──────────→ backend-api-expert
├─ Frontend React/Next.js? ──→ frontend-components-expert
├─ Charts/Graphs? ───────────→ chart-analysis-expert
├─ Python scrapers? ─────────→ scraper-development-expert
├─ TypeScript errors? ───────→ typescript-validation-expert
├─ BullMQ jobs? ─────────────→ queue-management-expert
├─ Database migrations? ─────→ database-migration-expert
├─ E2E/MCP Triplo? ──────────→ e2e-testing-expert
├─ Documentation? ───────────→ documentation-expert
└─ 100% validation? ─────────→ pm-expert
```

### Anti-Patterns

| Anti-Pattern | Consequência | Correto |
|--------------|--------------|---------|
| ❌ Implementar direto sem delegação | Código inconsistente | ✅ Delegar ao agent correto |
| ❌ "Vou fazer rápido aqui mesmo" | Pula Zero Tolerance | ✅ Agent garante qualidade |
| ❌ Pular validação de especialista | Bugs não detectados | ✅ Agent valida output |
| ❌ Usar agent genérico | Falta expertise | ✅ Agent especializado |

### ROI da Delegação

**Economia estimada:** 15-30h/semana (60-120h/mês)

**Por que delegar:**
- ✅ Expertise de domínio aplicado automaticamente
- ✅ Zero Tolerance enforced em CADA mudança
- ✅ Padrões consistentes em todo o código
- ✅ Validação automática (TypeScript, Build, Console)
- ✅ Documentação atualizada automaticamente

@ .claude/AGENT_QUICK_REFERENCE.md (guia completo de quando usar cada agent)

@ .claude/guides/specialized-agents.md (detalhes dos 10 agents especializados)

---

## Checklist Automatico

O projeto possui **sistema de automação 100%** com detecção de keywords, correlação de bugs, e analytics integrados.

**Como Funciona:**
1. **SessionStart Hook** - Exibe resumo de 65 categorias ao iniciar sessão
2. **UserPromptSubmit Hook** - Detecta keywords (PT + EN) e injeta contexto relevante
3. **PreToolUse Hook** - Valida tags em arquivos antes de editar
4. **PostToolUse Hook** - Correlaciona erros com KNOWN-ISSUES automaticamente
5. **Stop Hook** - Coleta analytics da sessão

**65 Categorias de Keywords:**
- **Core (27):** planning, development, frontend, backend, database, financial, etc.
- **v3.0 (10):** webResearch, postImplementation, regression, docSync, etc.
- **v4.0 (17):** migration, validation, transaction, cache, dividend, etc.
- **v5.0 (11):** technicalIndicators, fundamentalMetrics, macro, wheelStrategy, etc.

**Total:** ~1,100+ keywords bilíngues cobrindo 100% do ecossistema

**Referência Completa:** `CHECKLIST_ECOSSISTEMA_COMPLETO.md` (1144 linhas, 21 seções)

---

## Detailed Guides

### Development & Quality

- @ .claude/guides/development-principles.md (Quality > Velocity, KISS, Root Cause Analysis, Anti-Workaround, Observabilidade)
- @ .claude/guides/zero-tolerance-policy.md (Zero errors enforcement, Git workflow, Husky hooks)
- @ .claude/guides/error-handling.md (NestJS exceptions, error codes, global filters, validation)

### Testing & Validation

- @ .claude/guides/testing-patterns.md (Multi-layer testing, React Testing Library, Playwright E2E, Vitest)
- @ .claude/guides/web-research-strategy.md (Proactive WebSearch, 4 parallel queries, cross-validation)

### Security & Financial Data

- @ .claude/guides/financial-data-rules.md (Decimal.js, cross-validation, timezone, outlier detection) ⚠️ **CRÍTICO**
- @ .claude/guides/security-practices.md (OWASP Top 10 2025, XSS/CSRF prevention, JWT security, input validation)

### Backend & Database

- @ .claude/guides/api-versioning.md (URL versioning, semantic versioning, deprecation policy)
- @ .claude/guides/environment-validation.md (@nestjs/config, class-validator, Joi, secrets management)
- @ .claude/guides/database-transactions.md (TypeORM QueryRunner, isolation levels, deadlock handling)

### Python Scrapers

- @ .claude/guides/python-scrapers.md (BeautifulSoup Single Fetch pattern, Playwright migration, Exit 137 prevention) ⚠️ **OBRIGATÓRIO**

### Context & Agents

- @ .claude/guides/context-management.md (1M token context, Read tool limits, chunked reading, MCP protection)
- @ .claude/guides/pm-expert-agent.md (PM Expert sub-agent, 100% ecosystem validation, 4 roles in 1)
- @ .claude/guides/specialized-agents.md (10 sub-agents: backend-api, frontend-components, scraper-dev, etc.)
- @ .claude/guides/gemini-advisor-protocol.md (Gemini 3 Pro integration, 88% hallucination rate, consultation protocol)

### Workflow & Commands

- @ .claude/guides/skills-slash-commands.md (15 slash commands: /validate-all, /mcp-triplo, /check-context, etc.)
- @ .claude/skills/research-lib.md (Context7 proactive documentation research, 10-20h/month savings) ⭐ **NOVO**
- @ .claude/skills/context-check.md (Context check workflow with Context7 integration)

### Process Documentation

**Core Documentation:**
- `README.md` - Overview, quick start, installation
- `ARCHITECTURE.md` - Architecture completa, onde armazenar novos dados
- `DATABASE_SCHEMA.md` - Schema completo, relacionamentos
- `ROADMAP.md` - Histórico de 60+ fases completas
- `KNOWN-ISSUES.md` - Issues conhecidos (resumo executivo)
- `INDEX.md` - Índice mestre de toda documentação (200+ arquivos)

**Python Scrapers:**
- `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md` - Template standardizado (LEITURA OBRIGATÓRIA)
- `backend/python-scrapers/ERROR_137_ANALYSIS.md` - Análise Exit Code 137 (resolvido)

**Gemini Context Files (.gemini/context/):**
- `conventions.md` - Convenções de código
- `financial-rules.md` - Regras financeiras (CRÍTICO)
- `known-issues.md` - Análise técnica de issues

**Process:**
- `CHECKLIST_TODO_MASTER.md` - Checklist ultra-robusto antes de cada fase
- `METODOLOGIA_MCPS_INTEGRADA.md` - Integração MCPs + Ultra-Thinking + TodoWrite

### System Management

**Script:** `system-manager.ps1` (raiz do projeto)

**Uso Obrigatório:** Antes de QUALQUER teste com MCPs, validação de frontend/backend, após mudanças em docker-compose.yml

```powershell
.\system-manager.ps1 start           # Core services (7)
.\system-manager.ps1 status          # Status de todos os serviços
.\system-manager.ps1 health          # Health check completo
```

---

## Quick Reference

**Comandos Críticos:**

```bash
# Validação completa ANTES de commit
cd backend && npx tsc --noEmit && npm run build
cd frontend && npx tsc --noEmit && npm run build && npm run lint

# Slash commands essenciais
/check-context      # ANTES de iniciar tarefa complexa
/research-lib       # ANTES de implementar com biblioteca nova/desconhecida ⭐ NOVO
/validate-all       # ANTES de QUALQUER commit (obrigatório)
/mcp-triplo         # APÓS mudanças frontend
/mcp-quadruplo      # Feature complexa ou bug >2h
/sync-docs          # APÓS mudar CLAUDE.md ou GEMINI.md

# Docker essencial
docker-compose up -d                    # Start all
.\system-manager.ps1 health             # Health check
docker logs invest_backend --tail 50    # Backend logs

# Cache Turbopack (CRÍTICO - componentes novos não aparecem)
.\system-manager.ps1 rebuild-frontend-complete  # MATA processo + limpa volumes
```

**Arquivos de Referência Rápida:**

| Tarefa | Arquivo |
|--------|---------|
| Criar novo endpoint NestJS | `ARCHITECTURE.md` - Seção "Onde Armazenar Novos Dados" |
| Criar novo scraper Python | `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md` |
| Trabalhar com dados financeiros | `.gemini/context/financial-rules.md` (LEITURA OBRIGATÓRIA) |
| Troubleshooting | `TROUBLESHOOTING.md` (16+ problemas comuns) |
| Planejamento de fase | `IMPLEMENTATION_PLAN.md` (template) |

---

## Anti-Patterns (NUNCA FAZER)

| Anti-Pattern | Consequência | Correto |
|--------------|--------------|---------|
| ❌ Commit sem `/validate-all` | Código quebrado no repo | ✅ Sempre validar |
| ❌ Float para valores monetários | Imprecisão financeira | ✅ Decimal.js SEMPRE |
| ❌ console.log() em NestJS | Logs não estruturados | ✅ this.logger.log() |
| ❌ Múltiplos await em scraper | Exit Code 137 | ✅ BeautifulSoup Single Fetch |
| ❌ Aceitar sugestão Gemini sem validar | 88% hallucination rate | ✅ Verificar no código |
| ❌ `docker restart frontend` para cache | Turbopack cache persiste | ✅ `rebuild-frontend-complete` |

---

**Última Atualização:** 2025-12-21
**Versão:** 2.0 (Modular com @ references)
**Total de Guias:** 16 (6 novos + 10 migrados do CLAUDE.md original)
