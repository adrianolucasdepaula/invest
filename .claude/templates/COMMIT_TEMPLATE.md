# Git Commit Message Template with Agent Attribution

**Purpose:** Template padrão para commits com atribuição de agent especializado
**Usage:** Copiar e adaptar ao criar commits que usaram agents

---

## Template Básico (Com Agent)

```
<type>(<scope>): <subject>

<body - descrever o que foi feito>

Agent usado: <agent-name>
Validações executadas:
- ✅ TypeScript: 0 errors
- ✅ Build: Success
- ✅ Console: 0 errors
- ✅ Tests: Passing

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: <agent-name>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Template para CADA Agent

### 1. backend-api-expert

```
feat(api): add GET /api/v1/dividends endpoint

Implementado endpoint para buscar histórico de dividendos com:
- Controller DividendsController
- Service AssetService.getDividendHistory()
- DTO GetDividendsQueryDto (ticker, startDate, endDate, pagination)
- Validação customizada de datas
- Ordenação por exDate DESC

Agent usado: backend-api-expert
Validações executadas:
- ✅ TypeScript: 0 errors (backend)
- ✅ Build: Success (NestJS)
- ✅ Tests: 12/12 passing
- ✅ API response validated

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: backend-api-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 2. frontend-components-expert

```
feat(ui): add DividendCard component

Criado componente de card de dividendos com:
- Shadcn Card component base
- Props: { ticker, value, exDate, paymentDate, type }
- Badge para tipo (Dividendo, JCP, Rendimento)
- Skeleton loader para loading state
- Mobile responsive (Tailwind)

Agent usado: frontend-components-expert
Validações executadas:
- ✅ TypeScript: 0 errors (frontend)
- ✅ Build: Success (Next.js)
- ✅ Lint: 0 critical warnings
- ✅ A11y: WCAG 2.1 AA compliant
- ✅ Console: 0 errors

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: frontend-components-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 3. database-migration-expert

```
feat(db): add watchlists tables

Criadas tabelas para watchlists de usuários:
- watchlists (id, user_id, name, created_at)
- watchlist_assets (watchlist_id, asset_id, added_at)
- Foreign keys com CASCADE
- Indexes em (user_id, name) e (watchlist_id, asset_id)
- Seed inicial com 3 watchlists padrão

Agent usado: database-migration-expert
Validações executadas:
- ✅ Migration syntax valid
- ✅ Migration runs successfully
- ✅ Rollback works
- ✅ Indexes created
- ✅ Seeds executed

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: database-migration-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 4. typescript-validation-expert

```
fix(types): resolve 27 TypeScript errors

Corrigidos todos os erros de tipo no frontend:
- Substituído `any` por tipos corretos (15 ocorrências)
- Adicionados tipos faltantes em hooks (8 arquivos)
- Corrigidos imports incorretos (4 arquivos)
- Strict mode compliance

Agent usado: typescript-validation-expert
Validações executadas:
- ✅ TypeScript: 0 errors (antes: 27)
- ✅ Build: Success
- ✅ No `any` types remaining
- ✅ Strict mode enabled

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: typescript-validation-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 5. scraper-development-expert

```
feat(scraper): add Fundamentus dividends scraper

Implementado scraper de dividendos do Fundamentus com:
- Playwright + BeautifulSoup Single Fetch pattern
- Context manager para cleanup
- Retry logic (3 tentativas, backoff exponencial)
- Logging estruturado com Loguru
- Performance < 10s por ticker

Agent usado: scraper-development-expert
Validações executadas:
- ✅ Exit code: 0
- ✅ Data validated (3+ sources cross-validation)
- ✅ Performance: < 10s
- ✅ Memory: No leaks
- ✅ Error handling: Graceful failures

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: scraper-development-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 6. chart-analysis-expert

```
fix(charts): resolve candlestick rendering issue

Corrigido bug onde candlestick chart não renderizava:
- Dados OHLCV agora formatados corretamente
- Adicionado fallback para valores nulos
- Performance profiling com Chrome DevTools
- Screenshot de validação incluído

Agent usado: chart-analysis-expert
Validações executadas:
- ✅ Chart renders correctly
- ✅ Console: 0 errors
- ✅ Performance: < 500ms render
- ✅ Screenshot validated

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: chart-analysis-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 7. queue-management-expert

```
feat(queue): add daily scraping job

Implementado job de sincronização diária com:
- Queue: data-sync-queue
- Processor: process-scraping-job
- Retry: 3 tentativas com backoff exponencial (1s, 2s, 4s)
- Rate limit: 10 jobs/minuto
- Logging estruturado

Agent usado: queue-management-expert
Validações executadas:
- ✅ Job enqueues successfully
- ✅ Processor executes correctly
- ✅ Retry logic works
- ✅ Rate limiting enforced
- ✅ Redis connection stable

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: queue-management-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 8. e2e-testing-expert

```
test(e2e): add MCP Triplo validation for assets page

Executada validação completa com MCP Triplo:
- Playwright: Navigation, interaction, screenshots
- Chrome DevTools: Console errors, network requests
- A11y: WCAG 2.1 AA compliance

Agent usado: e2e-testing-expert
Validações executadas:
- ✅ Playwright: 18/18 tests passing
- ✅ Console: 0 errors
- ✅ Network: No 4xx/5xx errors
- ✅ A11y: 0 critical violations
- ✅ Screenshots saved

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: e2e-testing-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 9. documentation-expert

```
docs: update ROADMAP with FASE 156 completion

Atualizada documentação de fase completa:
- ROADMAP.md com FASE 156 marcada como 100%
- VALIDACAO_FASE_156.md criado com template padrão
- CHANGELOG.md atualizado
- CLAUDE.md e GEMINI.md sincronizados (100% idêntico)
- INDEX.md atualizado com novos arquivos

Agent usado: documentation-expert
Validações executadas:
- ✅ CLAUDE.md ↔ GEMINI.md sync validated
- ✅ Markdown lint: 0 errors
- ✅ Links validated (0 broken)
- ✅ INDEX.md up to date

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: documentation-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 10. pm-expert

```
feat: complete FASE 156 - 100% ecosystem validated

Validação completa do ecossistema com pm-expert:
- Frontend: 19 páginas validadas (0 errors)
- Backend: 16 controllers validados (0 errors)
- Infrastructure: 21 containers running
- Cross-validation: 3+ sources for financial data
- Relatório completo em VALIDACAO_FASE_156.md

Agent usado: pm-expert
Validações executadas:
- ✅ Frontend: 19/19 pages OK
- ✅ Backend: 16/16 controllers OK
- ✅ Database: 26 entities OK
- ✅ Docker: 21/21 containers running
- ✅ MCP Triplo: All validations passed
- ✅ Gaps: 0 critical issues found

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)
Agent: pm-expert

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Template SEM Agent (Mudanças Triviais)

**Use quando:**
- Mudanças triviais (typos, comments, readme minor updates)
- Nenhum código executável foi modificado
- Nenhum agent foi necessário

```
docs: fix typo in README

Corrigido erro de digitação na seção de instalação.

✅ Zero Tolerance validado (N/A - não é código)

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Uso no Git

### Opção 1: Configurar Template Global

```bash
# Salvar template
git config --global commit.template .claude/templates/COMMIT_TEMPLATE.md

# Ao fazer commit
git commit
# Abrirá editor com template pre-preenchido
```

### Opção 2: Copiar Template Manualmente

```bash
# Copiar template do agent relevante
# Adaptar para sua mudança
# Colar no git commit -m
```

### Opção 3: Usar Script Helper

```bash
# .claude/scripts/commit-with-agent.sh
#!/bin/bash

echo "Qual agent foi usado?"
echo "1) backend-api-expert"
echo "2) frontend-components-expert"
echo "3) pm-expert"
# ... etc

read -p "Escolha (1-10): " choice

# Carregar template correspondente
# Preencher informações
# Executar git commit
```

---

## Benefícios da Atribuição de Agent

### 1. Rastreabilidade
- ✅ Saber qual agent criou qual código
- ✅ Entender contexto de decisões
- ✅ Facilitar debugging futuro

### 2. Accountability
- ✅ Agent garantiu Zero Tolerance
- ✅ Validações documentadas no commit
- ✅ Quality assurance transparente

### 3. Analytics
- ✅ Medir uso de cada agent
- ✅ Identificar padrões de delegação
- ✅ Calcular ROI real (tempo economizado)

### 4. Knowledge Transfer
- ✅ Novos devs veem qual agent usar
- ✅ Commits servem como exemplos
- ✅ Onboarding mais rápido

---

## Métricas (Exemplo)

**Após 1 mês com agent attribution:**

```
Total commits: 145
Com agent: 98 (67%)
Sem agent: 47 (33% - triviais)

Agent usage breakdown:
- backend-api-expert: 28 commits (28%)
- frontend-components-expert: 26 commits (27%)
- pm-expert: 12 commits (12%)
- typescript-validation-expert: 10 commits (10%)
- e2e-testing-expert: 8 commits (8%)
- database-migration-expert: 6 commits (6%)
- Outros: 8 commits (9%)

Zero Tolerance violations: 0 (100% success rate)
Avg commit quality score: 9.4/10
```

---

## Referências

- **Zero Tolerance Policy:** `.claude/guides/zero-tolerance-policy.md`
- **Agent Quick Reference:** `.claude/AGENT_QUICK_REFERENCE.md`
- **Specialized Agents Guide:** `.claude/guides/specialized-agents.md`
- **Conventional Commits Spec:** https://www.conventionalcommits.org/

---

**Version:** 1.0.0
**Created:** 2026-01-04
**Maintainer:** Claude Code (Sonnet 4.5)
