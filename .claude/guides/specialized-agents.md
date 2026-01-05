# Specialized Agents Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Guia de uso dos 10 sub-agents especializados do projeto

---

## Visão Geral

O projeto possui **10 sub-agents especializados** que DEVEM ser invocados para tarefas específicas. Cada agent tem ferramentas e expertise dedicados para maximizar eficiência e qualidade.

### Princípio Fundamental

**Delegar > Fazer tudo sozinho**

- ✅ Usar specialist para tarefas específicas
- ✅ Passar contexto relevante ao agent
- ❌ Tentar fazer tudo no main thread
- ❌ Usar agent genérico para tarefa especializada

---

## Matriz de Invocação por Contexto

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

---

## 1. backend-api-expert

### Quando Usar

Criar endpoints, services, DTOs, entities TypeORM, validators

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep, Bash

### Stack Expertise

- NestJS 10 (controllers, services, modules)
- TypeORM (entities, repositories, migrations)
- class-validator (DTOs, custom validators)
- PostgreSQL (queries, indexes)

### Exemplo de Prompt

```text
Use o backend-api-expert para criar um novo endpoint GET /api/v1/dividends
que retorna os dividendos de um ativo específico com:
- DTO para query params (ticker, startDate, endDate)
- Validação customizada de datas
- Paginação (limit 100, offset)
- Ordenação por exDate DESC
```

### Outputs Esperados

- Controllers em `backend/src/api/[resource]/[resource].controller.ts`
- Services em `backend/src/api/[resource]/[resource].service.ts`
- DTOs em `backend/src/api/[resource]/dto/`
- Entities em `backend/src/database/entities/`
- Tests em `backend/src/api/[resource]/[resource].controller.spec.ts`

---

## 2. frontend-components-expert

### Quando Usar

Criar páginas, componentes, hooks React, integrar Shadcn/ui

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep, Bash

### Stack Expertise

- Next.js 14 App Router
- React 18 (hooks, suspense, server components)
- Shadcn/ui + Radix UI
- TailwindCSS
- React Query (TanStack Query)

### Exemplo de Prompt

```text
Use o frontend-components-expert para criar um componente de card
de dividendos com shadcn/ui e tailwind:
- Card com ticker, valor, data ex, data pagamento
- Badge para tipo (Dividendo, JCP, Rendimento)
- Skeleton loader para loading state
- Responsivo (mobile-first)
```

### Outputs Esperados

- Components em `frontend/src/components/[domain]/`
- Pages em `frontend/src/app/(dashboard)/[page]/`
- Hooks em `frontend/src/lib/hooks/`
- Types em `frontend/src/types/`

---

## 3. pm-expert

### Quando Usar

Validação completa, pesquisa de mercado, troubleshooting profundo

### Ferramentas Disponíveis

- Todas + WebSearch + Playwright + Chrome DevTools + A11y

### Expertise

- Product Management (market research, competitive analysis)
- QA Lead (100% ecosystem validation)
- DevOps (infrastructure monitoring)
- Tech Lead (architecture, dependencies)

### Exemplo de Prompt

```text
Use o pm-expert para validar 100% do ecossistema e reportar todos os gaps:
- Frontend: 19 páginas (dashboard + auth)
- Backend: 16 controllers
- Infrastructure: 21 containers Docker
- Cross-validation: 3+ fontes para dados financeiros
```

### Outputs Esperados

- `VALIDACAO_[TAREFA]_YYYY-MM-DD.md`
- `KNOWN-ISSUES.md` atualizado
- Screenshots em `docs/screenshots/`
- `IMPROVEMENT_PLAN.md` (se solicitado)

**Ver detalhes:** `.claude/guides/pm-expert-agent.md`

---

## 4. scraper-development-expert

### Quando Usar

Criar scrapers, implementar OAuth, debugar coleta de dados

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep, Bash

### Stack Expertise

- Playwright (async, context managers)
- BeautifulSoup4 (parsing HTML)
- OAuth flows (Google, user/password)
- httpx (HTTP client)
- Loguru (logging estruturado)

### Exemplo de Prompt

```text
Use o scraper-development-expert para criar um scraper de dividendos
do site Fundamentus usando:
- Playwright + BeautifulSoup Single Fetch pattern
- Context manager para cleanup
- Retry logic (3 tentativas com backoff exponencial)
- Logging estruturado com Loguru
- Performance < 10s por ticker
```

### Outputs Esperados

- Scrapers em `backend/python-scrapers/scrapers/`
- Tests em `backend/python-scrapers/test_*.py`
- Documentação em `backend/python-scrapers/README.md`

**Ver detalhes:** `.claude/guides/python-scrapers.md`

---

## 5. chart-analysis-expert

### Quando Usar

Criar gráficos, candlesticks, indicadores técnicos, debugar rendering

### Ferramentas Disponíveis

- Read, Edit, Write, Chrome DevTools, Playwright

### Stack Expertise

- Recharts (dashboard charts)
- lightweight-charts (candlestick, OHLCV)
- Chart.js (alternativa)
- D3.js (custom visualizations)
- Chrome DevTools (performance profiling)

### Exemplo de Prompt

```text
Use o chart-analysis-expert para debugar por que o gráfico de candlestick
não está renderizando corretamente:
- Verificar dados OHLCV (formato, valores nulos)
- Inspecionar DOM com Chrome DevTools
- Profiling de performance
- Corrigir issue e validar com screenshot
```

### Outputs Esperados

- Components de charts em `frontend/src/components/charts/`
- Hooks de data em `frontend/src/lib/hooks/use-chart-data.ts`
- Screenshots de validação em `docs/screenshots/`

---

## 6. typescript-validation-expert

### Quando Usar

Corrigir erros TypeScript, adicionar tipos, refatorar para strict mode

### Ferramentas Disponíveis

- Read, Edit, Glob, Grep, Bash

### Expertise

- TypeScript strict mode
- Generic types
- Utility types (Partial, Pick, Omit, etc.)
- Type guards
- TSConfig optimization

### Exemplo de Prompt

```text
Use o typescript-validation-expert para corrigir todos os erros
de tipo no projeto frontend:
- Rodar npx tsc --noEmit
- Identificar todos os erros
- Corrigir um por um (não usar any)
- Validar 0 erros no final
```

### Outputs Esperados

- Tipos em `frontend/src/types/`
- Arquivos corrigidos (substituir `any` por tipos corretos)
- Relatório de correções em `TYPESCRIPT_FIXES.md`

---

## 7. queue-management-expert

### Quando Usar

Criar jobs BullMQ, configurar retry, debugar filas

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep, Bash

### Stack Expertise

- BullMQ (jobs, processors, queues)
- Redis (pub/sub, streams)
- Cron expressions
- Rate limiting
- Retry strategies (exponential backoff)

### Exemplo de Prompt

```text
Use o queue-management-expert para criar um job de sincronização
de dados com:
- Queue: data-sync-queue
- Processor: process-scraping-job
- Retry: 3 tentativas com backoff exponencial (1s, 2s, 4s)
- Rate limit: 10 jobs/minuto
- Logging estruturado
```

### Outputs Esperados

- Jobs em `backend/src/queue/jobs/`
- Processors em `backend/src/queue/processors/`
- Queues em `backend/src/queue/queues/`

---

## 8. database-migration-expert

### Quando Usar

Criar migrations TypeORM, schema changes, indexes, data migrations

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep, Bash

### Stack Expertise

- TypeORM migrations
- PostgreSQL (DDL, indexes, constraints)
- Data migrations (bulk updates)
- Schema versioning
- Rollback strategies

### Exemplo de Prompt

```text
Use o database-migration-expert para criar uma migration que:
- Adiciona tabela watchlists (id, user_id, name, created_at)
- Tabela watchlist_assets (watchlist_id, asset_id, added_at)
- Foreign keys com CASCADE
- Indexes em (user_id, name) e (watchlist_id, asset_id)
- Seed inicial com 3 watchlists padrão
```

### Outputs Esperados

- Migrations em `backend/src/database/migrations/`
- Entities em `backend/src/database/entities/`
- Seeds em `backend/src/database/seeds/`

---

## 9. documentation-expert

### Quando Usar

Atualizar documentação de fases, sync CLAUDE.md ↔ GEMINI.md, ROADMAP.md

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep

### Expertise

- Markdown (GitHub Flavored)
- Documentation templates
- Sync scripts
- Changelog generation
- INDEX.md management

### Exemplo de Prompt

```text
Use o documentation-expert para:
- Criar VALIDACAO_FASE_133.md com template padrão
- Atualizar ROADMAP.md com fase completa
- Atualizar CHANGELOG.md com mudanças notáveis
- Sincronizar CLAUDE.md ↔ GEMINI.md (100% idêntico)
- Atualizar INDEX.md com novos arquivos
```

### Outputs Esperados

- `VALIDACAO_FASE_[XX].md`
- `ROADMAP.md` atualizado
- `CHANGELOG.md` atualizado
- `CLAUDE.md` e `GEMINI.md` sincronizados
- `INDEX.md` atualizado

---

## 10. e2e-testing-expert

### Quando Usar

Testes E2E, validação MCP Triplo, accessibility audits

### Ferramentas Disponíveis

- Read, Edit, Write, Glob, Grep, Bash, mcp__playwright__*, mcp__chrome-devtools__*, mcp__a11y__*

### Stack Expertise

- Playwright E2E
- Chrome DevTools Protocol
- A11y testing (WCAG 2.1)
- Visual regression testing
- Performance audits

### Exemplo de Prompt

```text
Use o e2e-testing-expert para executar MCP Triplo na página /assets:
1. Playwright: navegação + snapshot + console + network
2. Chrome DevTools: performance trace
3. A11y: WCAG 2.1 AA compliance
4. Validar 0 erros críticos
5. Screenshots de evidência
```

### Outputs Esperados

- Tests em `frontend/tests/e2e/`
- Screenshots em `docs/screenshots/`
- Performance reports em `docs/performance/`
- A11y reports em `docs/accessibility/`

---

## Anti-Patterns de Agents

### O Que NUNCA Fazer

| Anti-Pattern | Problema | Correto |
|--------------|----------|---------|
| ❌ Fazer tudo sozinho | Uso ineficiente de contexto, especialização perdida | ✅ Delegar para specialist agent |
| ❌ Usar agent errado | Resultado subótimo, falta de expertise | ✅ Consultar matriz de invocação |
| ❌ Não fornecer contexto | Agent precisa re-explorar, perde tempo | ✅ Passar contexto relevante no prompt |
| ❌ Invocar múltiplos agents para mesma tarefa | Conflitos, overhead | ✅ Escolher 1 agent mais adequado |
| ❌ Esperar agent fazer tudo sem direção | Resultado genérico | ✅ Fornecer requisitos específicos |

### Exemplos de Anti-Patterns

#### Anti-Pattern 1: Fazer Tudo Sozinho

```text
❌ ERRADO:
User: Create a new dividend filter component
Claude: [Reads 50 files, creates component, creates API endpoint,
         creates migration, all in main thread]
```

```text
✅ CORRETO:
User: Create a new dividend filter component
Claude: This requires 3 specialists:
1. Use backend-api-expert to create GET /dividends endpoint
2. Use frontend-components-expert to create filter component
3. Use e2e-testing-expert to validate integration
```

#### Anti-Pattern 2: Agent Errado

```text
❌ ERRADO:
User: Fix TypeScript errors in backend
Claude: Use pm-expert to fix TypeScript errors
[PM Expert é para validação 100%, não correção específica]
```

```text
✅ CORRETO:
User: Fix TypeScript errors in backend
Claude: Use typescript-validation-expert to fix TypeScript errors
```

#### Anti-Pattern 3: Sem Contexto

```text
❌ ERRADO:
Use backend-api-expert to create endpoint
[Agent precisa explorar tudo desde o início]
```

```text
✅ CORRETO:
Use backend-api-expert to create GET /api/v1/dividends endpoint with:
- Existing entity: Dividend (backend/src/database/entities/dividend.entity.ts)
- DTO pattern: backend/src/api/assets/dto/get-assets.dto.ts (reference)
- Pagination: limit 100, offset
- Validation: ticker required, dates optional
```

---

## Workflow de Invocação

### Fluxo Recomendado

```text
┌─────────────────────────────────────────┐
│  TASK: Implementar dividend filter       │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Analisar Task │
        └──────┬───────┘
               │
               ▼
       ┌───────────────────┐
       │ Identificar Agents │ ◄── Consultar matriz
       └───────┬───────────┘
               │
               ▼
   ┌───────────────────────────┐
   │ Agent 1: backend-api-expert │
   │ - Criar endpoint /dividends │
   └───────┬───────────────────┘
           │
           ▼
   ┌───────────────────────────────────┐
   │ Agent 2: frontend-components-expert │
   │ - Criar DividendFilter component    │
   └───────┬───────────────────────────┘
           │
           ▼
   ┌─────────────────────────────┐
   │ Agent 3: e2e-testing-expert  │
   │ - Validar integração MCP Triplo │
   └───────┬─────────────────────┘
           │
           ▼
   ┌──────────────────┐
   │ Task Complete     │
   └──────────────────┘
```

---

## Definições dos Agents

### Arquivos de Definição

Cada agent tem arquivo de definição em `.claude/agents/`:

| Agent | Arquivo |
|-------|---------|
| backend-api-expert | `.claude/agents/backend-api-expert.md` |
| frontend-components-expert | `.claude/agents/frontend-components-expert.md` |
| pm-expert | `.claude/agents/pm-expert.md` |
| scraper-development-expert | `.claude/agents/scraper-development-expert.md` |
| chart-analysis-expert | `.claude/agents/chart-analysis-expert.md` |
| typescript-validation-expert | `.claude/agents/typescript-validation-expert.md` |
| queue-management-expert | `.claude/agents/queue-management-expert.md` |
| database-migration-expert | `.claude/agents/database-migration-expert.md` |
| documentation-expert | `.claude/agents/documentation-expert.md` |
| e2e-testing-expert | `.claude/agents/e2e-testing-expert.md` |

### Estrutura de Definição

```markdown
# [Agent Name]

## Role
[Brief description]

## Tools
[List of available tools]

## Expertise
[Domain expertise]

## Quality Standards
[What "done" looks like]

## Common Tasks
[Typical invocation patterns]
```

---

## Troubleshooting

### Erro: "Agent não entendeu o que fazer"

**Causa:** Prompt vago ou sem contexto

**Solução:**

```text
# ❌ Vago
Use backend-api-expert to create endpoint

# ✅ Específico
Use backend-api-expert to create GET /api/v1/dividends endpoint:
- Query params: ticker (required), startDate, endDate (optional)
- Response: { data: Dividend[], total: number, page: number }
- Pagination: limit 100, offset
- Ordenação: exDate DESC
- Validation: ticker must exist in assets table
```

### Erro: "Agent criou código que não compila"

**Causa:** Agent não validou com Zero Tolerance

**Solução:**

```text
# Sempre incluir validação no prompt
Use [agent] to [tarefa] and ensure:
- npx tsc --noEmit returns 0 errors
- npm run build succeeds
- All tests pass
```

### Erro: "Agent demorou muito"

**Causa:** Tarefa muito grande ou complexa

**Solução:**

```text
# Dividir em sub-tarefas menores
1. Use backend-api-expert for API only
2. Use frontend-components-expert for UI only
3. Use e2e-testing-expert for validation only
```

---

## Fontes

- **Agent Definitions:** `.claude/agents/*.md`
- **Task Tool Documentation:** [Claude Code Docs](https://docs.anthropic.com/claude-code/task-tool)
- **Sub-Agent Best Practices:** `docs/AGENT_BEST_PRACTICES.md`
