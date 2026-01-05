# Agent Quick Reference

**Purpose:** Quick lookup guide for when to delegate tasks to specialized agents
**Last Updated:** 2026-01-04
**Full Guide:** `.claude/guides/specialized-agents.md`

---

## ⚡ Quick Decision Tree

```
Task involves...
├─ Backend NestJS code? ────────────→ backend-api-expert
├─ Frontend React/Next.js code? ────→ frontend-components-expert
├─ Charts/Graphs rendering? ────────→ chart-analysis-expert
├─ Python scrapers? ────────────────→ scraper-development-expert
├─ TypeScript errors? ──────────────→ typescript-validation-expert
├─ BullMQ jobs/queues? ─────────────→ queue-management-expert
├─ Database migrations? ────────────→ database-migration-expert
├─ E2E tests / MCP Triplo? ─────────→ e2e-testing-expert
├─ Documentation updates? ──────────→ documentation-expert
└─ 100% ecosystem validation? ──────→ pm-expert
```

---

## 📋 Agent Catalog (10 Agents)

### 1. backend-api-expert
**Use when:** Creating/modifying NestJS endpoints, services, DTOs, entities
**Keywords:** controller, service, dto, endpoint, typeorm
**Output:** `backend/src/api/[resource]/`

### 2. frontend-components-expert
**Use when:** Creating/modifying React components, pages, hooks
**Keywords:** component, page, hook, shadcn, next.js
**Output:** `frontend/src/components/` or `frontend/src/app/`

### 3. chart-analysis-expert
**Use when:** Creating/debugging charts, candlesticks, technical indicators
**Keywords:** chart, candlestick, recharts, lightweight-charts
**Output:** `frontend/src/components/charts/`

### 4. scraper-development-expert
**Use when:** Creating/debugging Python scrapers, OAuth flows
**Keywords:** scraper, playwright, beautifulsoup, oauth
**Output:** `backend/python-scrapers/scrapers/`

### 5. typescript-validation-expert
**Use when:** Fixing TypeScript errors, adding types, strict mode
**Keywords:** tsc, type error, strict, any, generic
**Output:** Type fixes across codebase

### 6. queue-management-expert
**Use when:** Creating/debugging BullMQ jobs, retry logic, scheduling
**Keywords:** job, queue, bullmq, processor, cron
**Output:** `backend/src/queue/`

### 7. database-migration-expert
**Use when:** Creating migrations, schema changes, indexes
**Keywords:** migration, schema, entity, index, sql
**Output:** `backend/src/database/migrations/`

### 8. e2e-testing-expert
**Use when:** E2E tests, MCP Triplo validation, accessibility audits
**Keywords:** e2e, playwright, validation, a11y, triplo
**Output:** Test files + validation reports

### 9. documentation-expert
**Use when:** Updating phase docs, ROADMAP, CHANGELOG, INDEX
**Keywords:** docs, readme, changelog, roadmap, index, sync
**Output:** Markdown files updated

### 10. pm-expert
**Use when:** 100% ecosystem validation, market research, troubleshooting
**Keywords:** validar, ecossistema, 100%, audit, gaps
**Output:** Comprehensive validation reports

---

## 🎯 Common Scenarios

| Scenario | Agent | Why |
|----------|-------|-----|
| "Add new endpoint for dividends" | backend-api-expert | Controller + Service + DTO |
| "Create dividend card component" | frontend-components-expert | React component + Shadcn |
| "Candlestick chart not rendering" | chart-analysis-expert | Chart debugging expertise |
| "Scrape dividend data from site X" | scraper-development-expert | Playwright + BeautifulSoup |
| "Fix 27 TypeScript errors" | typescript-validation-expert | Type system expertise |
| "Create daily scraping job" | queue-management-expert | BullMQ + cron |
| "Add new table for watchlists" | database-migration-expert | Migration + entity |
| "Validate entire platform works" | e2e-testing-expert | MCP Triplo workflow |
| "Update ROADMAP after phase" | documentation-expert | Doc templates + sync |
| "Find all bugs in ecosystem" | pm-expert | Comprehensive audit |

---

## 🚀 Invocation Syntax

**Standard format:**
```markdown
Use the [agent-name] to [task description]:
- [specific requirement 1]
- [specific requirement 2]
- [specific requirement 3]
```

**Example:**
```markdown
Use the backend-api-expert to create a new endpoint GET /api/v1/dividends:
- DTO for query params (ticker, startDate, endDate)
- Pagination (limit 100, offset)
- Ordenação por exDate DESC
- Zero Tolerance enforcement (0 TS errors, builds successfully)
```

---

## ⚠️ IMPORTANT: Mandatory Agent Usage

**ALWAYS use specialized agents for:**

1. **Backend API changes** (backend-api-expert)
   - Controllers, services, DTOs, entities
   - Ensures NestJS best practices + Zero Tolerance

2. **Frontend UI changes** (frontend-components-expert)
   - Components, pages, hooks
   - Ensures Next.js App Router patterns + accessibility

3. **Database schema changes** (database-migration-expert)
   - Migrations, entities, indexes
   - Prevents schema corruption + ensures rollback capability

4. **Phase completion validation** (pm-expert)
   - 100% ecosystem validation before declaring phase complete
   - Prevents regressions and ensures quality

**Anti-pattern:**
```
❌ Implementar direto sem delegação
❌ "Vou fazer rápido aqui mesmo"
❌ Pular validação de agent especializado
```

**Correto:**
```
✅ Identificar agent correto
✅ Passar contexto completo
✅ Validar output do agent
✅ Garantir Zero Tolerance
```

---

## 📊 Agent Usage Matrix

| Agent | Frequency | Avg Time Saved | Critical? |
|-------|-----------|----------------|-----------|
| backend-api-expert | 5-8x/semana | 30-60 min | ⚠️ YES |
| frontend-components-expert | 5-8x/semana | 30-60 min | ⚠️ YES |
| pm-expert | 1-2x/semana | 2-4h | ⚠️ YES |
| scraper-development-expert | 2-3x/semana | 1-2h | ✅ HIGH |
| typescript-validation-expert | 3-5x/semana | 20-40 min | ✅ HIGH |
| database-migration-expert | 1-2x/semana | 30-60 min | ⚠️ YES |
| queue-management-expert | 1x/semana | 1-2h | ✅ MEDIUM |
| chart-analysis-expert | 1x/semana | 1-2h | ✅ MEDIUM |
| e2e-testing-expert | 3-5x/semana | 1-2h | ⚠️ YES |
| documentation-expert | 2-3x/semana | 30 min | ✅ MEDIUM |

**Total estimated savings:** 15-30h/semana (60-120h/mês)

---

## 🔗 Integration with Workflows

### /check-context integration

**Step 9: Agent Delegation Check**

Before implementing:
1. Identify if task requires specialized agent (see decision tree)
2. If YES → delegate to agent BEFORE starting implementation
3. If NO → proceed with implementation

### Zero Tolerance Policy integration

All agents MUST enforce:
- ✅ 0 TypeScript errors (`npx tsc --noEmit`)
- ✅ 0 Build errors (`npm run build`)
- ✅ 0 Console errors (validated with Chrome DevTools)
- ✅ 0 ESLint critical warnings

---

## 🎓 Training Examples

### Example 1: Backend Feature
**User Request:** "Add endpoint to get dividend history"

**Correct approach:**
```markdown
Use the backend-api-expert to create GET /api/v1/dividends endpoint:
- DTO: GetDividendsQueryDto (ticker, startDate?, endDate?, limit?, offset?)
- Service: AssetService.getDividendHistory()
- Entity: Dividend (ticker, exDate, paymentDate, value, type)
- Pagination + ordenação por exDate DESC
- Zero Tolerance enforcement
```

### Example 2: Frontend Feature
**User Request:** "Create component to show dividends in a card"

**Correct approach:**
```markdown
Use the frontend-components-expert to create DividendCard component:
- Shadcn Card component base
- Props: { ticker, value, exDate, paymentDate, type }
- Badge for type (Dividendo, JCP, Rendimento)
- Skeleton loader for loading state
- Mobile responsive
- Zero Tolerance enforcement
```

### Example 3: Full Ecosystem Validation
**User Request:** "Validate everything works before phase completion"

**Correct approach:**
```markdown
Use the pm-expert to validate 100% of the ecosystem:
- Frontend: All 19 pages load without errors
- Backend: All 16 controllers respond correctly
- Database: All 26 entities have migrations
- Infrastructure: All 21 Docker containers running
- Cross-validation: 3+ sources for financial data
- Generate comprehensive report in VALIDACAO_FASE_XXX.md
```

---

## 📚 References

- **Full Agent Guide:** `.claude/guides/specialized-agents.md`
- **PM Expert Details:** `.claude/guides/pm-expert-agent.md`
- **Zero Tolerance Policy:** `.claude/guides/zero-tolerance-policy.md`
- **Context Management:** `.claude/guides/context-management.md`

---

## 🔄 Version History

**v1.0.0** (2026-01-04) - Initial creation
- 10 specialized agents documented
- Decision tree for quick lookup
- Integration with /check-context and Zero Tolerance
- Real ROI metrics from ecosystem analysis

---

**Remember:** Delegation to specialized agents is **MANDATORY** for the project, not optional. This ensures:
- ✅ Consistent quality across all components
- ✅ Domain expertise applied to each task
- ✅ Zero Tolerance Policy enforced automatically
- ✅ 15-30h/week saved through specialization
