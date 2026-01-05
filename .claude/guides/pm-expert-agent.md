# PM Expert Agent Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Validação 100% do ecossistema com PM Expert sub-agent

---

## Visão Geral

O **PM Expert** é um sub-agent ultra-robusto que combina 4 roles em 1:

1. **Product Manager** - Pesquisa de mercado, análise competitiva, 30+ fontes
2. **QA Lead** - Validação e testes de 100% do ecossistema
3. **DevOps** - Monitoramento de infraestrutura, logs, troubleshooting
4. **Tech Lead** - Garantia de qualidade, dependências, arquitetura

### Características Principais

- ✅ Validação completa de frontend (19 páginas)
- ✅ Validação completa de backend (16 controllers)
- ✅ Validação de infraestrutura (21 containers Docker)
- ✅ Pesquisa web massiva (30+ fontes financeiras)
- ✅ MCP Triplo/Quadruplo integrado
- ✅ Troubleshooting profundo com root cause analysis

---

## Quando Invocar

### Use o PM Expert Para

| Tarefa | Descrição | Prioridade |
|--------|-----------|------------|
| **Validação 100%** | Testar frontend (19 páginas), backend (16 controllers), infra (21 containers) | 🔴 ALTA |
| **Pesquisa de Mercado** | Consultar 30+ fontes de dados financeiros (BRAPI, Fundamentus, BCB, etc.) | 🟠 MÉDIA |
| **Testes E2E Massivos** | Usar Playwright + Chrome DevTools + A11y MCPs em paralelo | 🔴 ALTA |
| **Análise de Concorrentes** | Pesquisar Fundamentei, StatusInvest, TradingView, Bloomberg, etc. | 🟡 BAIXA |
| **Troubleshooting** | Investigar bugs, gaps, erros com logs e traces | 🔴 ALTA |
| **Gestão de Dependências** | Verificar npm/pip outdated, vulnerabilidades (Snyk, npm audit) | 🟠 MÉDIA |
| **Auditorias** | Validação completa de arquitetura e código | 🟠 MÉDIA |

### Quando NÃO Usar

| Situação | Por que? | Use em vez disso |
|----------|----------|------------------|
| Bug simples conhecido | Overhead desnecessário | Corrigir diretamente |
| Feature trivial | PM Expert é para validação massiva | Implementar e testar manualmente |
| Mudança em 1-2 arquivos | Escopo pequeno demais | Code review normal |
| Prototipagem rápida | Validação completa não é prioridade | Desenvolver e validar depois |

---

## Como Invocar

### Sintaxe de Invocação

```bash
# Validação 100% do ecossistema
Use the pm-expert to validate 100% of the ecosystem and report all gaps
```

```bash
# Pesquisa de mercado e concorrentes
Use the pm-expert to research competitors and create improvement plan
```

```bash
# Troubleshooting profundo
Use the pm-expert to investigate [problema] and provide root cause analysis
```

```bash
# Auditoria de qualidade
Use the pm-expert to audit code quality, dependencies, and architecture
```

### Exemplos de Prompts

#### Exemplo 1: Validação Completa Pós-Feature

```text
Use the pm-expert to validate the new dividend tracking feature:
- Frontend: /assets page with dividend filters
- Backend: GET /api/v1/dividends endpoint
- Database: dividend_payments table
- Integration: Cross-validation with 3+ sources
```

#### Exemplo 2: Pesquisa de Mercado

```text
Use the pm-expert to research how competitors (StatusInvest, Fundamentei, TradingView)
display dividend yield and create recommendations for our implementation.
```

#### Exemplo 3: Troubleshooting

```text
Use the pm-expert to investigate why the Python scraper is getting Exit Code 137
and provide root cause analysis with prevention measures.
```

---

## Ferramentas Disponíveis

O PM Expert tem acesso a **TODAS** as ferramentas do Claude Code:

### File Operations
- **Read, Edit, Write** - Manipulação de arquivos
- **Glob, Grep** - Busca de arquivos e conteúdo

### Execution
- **Bash** - Comandos shell (npm, docker, git, etc.)
- **Task** - Lançar sub-agentes em paralelo

### Web Research
- **WebFetch** - Fetch de URLs específicas
- **WebSearch** - Pesquisa paralela (até 4 queries)

### MCP Tools
- **mcp__playwright__*** - Testes E2E (navegação, snapshot, console, network)
- **mcp__chrome-devtools__*** - Debug de browser (performance, traces)
- **mcp__a11y__*** - Testes de acessibilidade (WCAG 2.1)
- **mcp__sequential-thinking__*** - Análise profunda com thinking blocks
- **mcp__react-context__*** - Debug de componentes React (state, props)

---

## Workflow do PM Expert

### Fluxo Completo de Validação

```text
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW PM EXPERT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Ler documentação crítica                                     │
│    ├─ CLAUDE.md                                                │
│    ├─ ARCHITECTURE.md                                          │
│    ├─ DATABASE_SCHEMA.md                                       │
│    └─ KNOWN-ISSUES.md                                          │
│                                                                 │
│ 2. Verificar builds                                            │
│    ├─ cd backend && npx tsc --noEmit                           │
│    ├─ cd backend && npm run build                              │
│    ├─ cd frontend && npx tsc --noEmit                          │
│    └─ cd frontend && npm run build                             │
│                                                                 │
│ 3. Testar Frontend com MCP Triplo                              │
│    ├─ Playwright: navegação + snapshot                         │
│    ├─ Chrome DevTools: console + network                       │
│    └─ A11y: WCAG 2.1 AA                                        │
│                                                                 │
│ 4. Testar Backend                                              │
│    ├─ Health check: GET /api/v1/health                         │
│    ├─ Endpoints autenticados                                   │
│    └─ Queue jobs (BullMQ)                                      │
│                                                                 │
│ 5. Verificar Infraestrutura                                    │
│    ├─ Docker containers (21 serviços)                          │
│    ├─ Conectividade (ports, network)                           │
│    └─ Logs (docker logs, application logs)                     │
│                                                                 │
│ 6. Documentar Findings                                         │
│    ├─ Gaps encontrados                                         │
│    ├─ Screenshots de evidência                                 │
│    ├─ Atualizar KNOWN-ISSUES.md                                │
│    └─ Criar VALIDACAO_[TAREFA].md                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Passo a Passo Detalhado

#### 1. Leitura de Documentação (5-10 min)

```bash
# Ler arquivos críticos
Read: CLAUDE.md
Read: ARCHITECTURE.md
Read: DATABASE_SCHEMA.md
Read: KNOWN-ISSUES.md

# Entender:
# - Stack tecnológico
# - Arquitetura atual
# - Issues conhecidos
# - Regras críticas (financial data, zero tolerance)
```

#### 2. Verificação de Builds (2-5 min)

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

#### 3. Testes Frontend (10-20 min)

```bash
# Para CADA página (19 páginas):
# 1. Navegação
mcp__playwright__browser_navigate("http://localhost:3100/assets")

# 2. Snapshot (captura estado completo)
mcp__playwright__browser_snapshot()

# 3. Console (erros JavaScript)
mcp__playwright__browser_console_messages()

# 4. Network (requests falhando)
mcp__playwright__browser_network_requests()

# 5. Acessibilidade (WCAG 2.1 AA)
mcp__a11y__test_accessibility("http://localhost:3100/assets")
```

#### 4. Testes Backend (5-10 min)

```bash
# Health check
curl http://localhost:3101/api/v1/health

# Endpoints principais (sem auth)
curl http://localhost:3101/api/v1/assets
curl http://localhost:3101/api/v1/assets/PETR4

# Verificar queue
docker exec invest_backend npm run queue:status
```

#### 5. Verificação Infraestrutura (3-5 min)

```bash
# Status de todos os containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs de erros (últimas 50 linhas)
docker logs invest_backend --tail 50
docker logs invest_frontend --tail 50
docker logs invest_scrapers --tail 50

# Conectividade
curl http://localhost:3101/health  # Backend
curl http://localhost:3100          # Frontend
```

#### 6. Documentação de Findings (5-15 min)

```markdown
# VALIDACAO_[TAREFA]_2025-12-21.md

## Executive Summary
- 19 páginas testadas
- 16 controllers validados
- 21 containers verificados

## Gaps Encontrados
### CRÍTICO (0)
(nenhum)

### ALTO (2)
1. Assets page: dividend filter não funciona com tickers rebranded
2. Backend: GET /dividends endpoint sem paginação

### MÉDIO (5)
...

## Screenshots
- `docs/screenshots/assets-page-error.png`
- `docs/screenshots/backend-health-check.png`

## Recomendações
1. Implementar lookup de ticker rebrandings
2. Adicionar paginação ao endpoint /dividends
...
```

---

## Quality Standards

### Zero Tolerance (Obrigatório)

| Validação | Critério | Falha se |
|-----------|----------|----------|
| TypeScript | 0 erros | `npx tsc --noEmit` retorna erro |
| Build | Sucesso | `npm run build` falha |
| Console | 0 erros críticos | Erro vermelho no browser console |
| Network | 0 requests falhando | Request 4xx/5xx (exceto auth) |
| A11y | WCAG 2.1 AA | Violações críticas |

### Cross-Validation (Dados Financeiros)

| Requisito | Critério | Como Validar |
|-----------|----------|--------------|
| Mínimo 3 fontes | 3+ fontes concordando | Verificar logs de scraping |
| Threshold 10% | Discrepância < 10% | Calcular `abs(fonte1 - mediana) / mediana` |
| Score de confiança | Score ≥ 80% | `(fontes concordando / total) * 100` |

### Performance Benchmarks

| Métrica | Target | Como Medir |
|---------|--------|------------|
| Page load | < 3s | Chrome DevTools Performance |
| API response | < 500ms | Network tab, Time column |
| Build time | < 2 min | `time npm run build` |
| Scraper execution | < 10s | Logs do scraper |

---

## Documentação Gerada

### Arquivos Criados pelo PM Expert

| Arquivo | Descrição | Localização |
|---------|-----------|-------------|
| `VALIDACAO_[TAREFA].md` | Relatório completo de validação | Raiz do projeto |
| `KNOWN-ISSUES.md` | Atualizado com novos issues | Raiz do projeto |
| `docs/screenshots/*.png` | Screenshots de evidência | `docs/screenshots/` |
| `IMPROVEMENT_PLAN.md` | Plano de melhorias (se solicitado) | Raiz do projeto |

### Template de Relatório

```markdown
# VALIDACAO_[TAREFA]_YYYY-MM-DD.md

## Executive Summary
- Escopo: [descrever]
- Duração: XX minutos
- Resultado: ✅ APROVADO / ❌ FALHOU

## Metodologia
- MCP Triplo: Playwright + Chrome DevTools + A11y
- Zero Tolerance: TypeScript + Build + Console
- Cross-Validation: 3+ fontes

## Frontend (19 páginas)
### Dashboard (15 páginas)
- [ ] /dashboard ✅ OK
- [ ] /assets ⚠️ WARN: dividend filter issue
...

## Backend (16 controllers)
- [ ] AssetsController ✅ OK
- [ ] DividendsController ❌ FAIL: paginação missing
...

## Infraestrutura (21 containers)
- [ ] invest_backend ✅ OK
- [ ] invest_frontend ✅ OK
- [ ] invest_postgres ✅ OK
...

## Gaps Encontrados

### CRÍTICO (0)
(nenhum)

### ALTO (2)
1. **Dividend filter não funciona com rebrandings**
   - Descrição: Filtro de dividendos não encontra AXIA3 (antigo ELET3)
   - Root Cause: Lookup de ticker_changes não implementado
   - Impacto: 15% dos tickers (rebranded) não funcionam
   - Solução: Implementar JOIN com ticker_changes table
   - Prioridade: ALTA
   - Estimativa: 2-4 horas

2. **GET /dividends sem paginação**
   - Descrição: Endpoint retorna TODOS os dividendos (70K registros)
   - Root Cause: Falta limit/offset no query
   - Impacto: Timeout em produção, 12MB de response
   - Solução: Adicionar paginação (limit 100, default)
   - Prioridade: ALTA
   - Estimativa: 1-2 horas

### MÉDIO (5)
...

### BAIXO (12)
...

## Screenshots de Evidência
- `docs/screenshots/dividend-filter-error.png`
- `docs/screenshots/dividends-endpoint-timeout.png`
- `docs/screenshots/console-errors.png`

## Recomendações Priorizadas

### Imediatas (fazer agora)
1. Implementar paginação em /dividends
2. Adicionar lookup de ticker rebrandings

### Curto Prazo (próxima sprint)
1. Melhorar error handling em scrapers
2. Adicionar cache de queries pesadas

### Longo Prazo (próximo quarter)
1. Migrar para GraphQL (resolver N+1)
2. Implementar CDC (Change Data Capture)

## Próximos Passos
1. Criar issues no GitHub para gaps CRÍTICO e ALTO
2. Atualizar ROADMAP.md com tarefas
3. Commitar correções incrementalmente
```

---

## Definição do Agent

**Arquivo:** `.claude/agents/pm-expert.md`

```markdown
# PM Expert Agent

Ultra-comprehensive Product Manager and QA Lead for B3 AI Analysis Platform.

## Roles
1. Product Manager - Market research (30+ sources)
2. QA Lead - Full ecosystem validation
3. DevOps - Infrastructure monitoring
4. Tech Lead - Quality assurance

## Tools
All tools available.

## Specialties
- E2E testing with MCP Triplo/Quadruplo
- Competitive analysis
- Root cause troubleshooting
- Dependency management
```

---

## Guias Relacionados

### Complementares

- **MCP Triplo:** `.claude/commands/mcp-triplo.md`
- **MCP Quadruplo:** `.claude/commands/mcp-quadruplo.md`
- **Check Ecosystem:** `.claude/commands/check-ecosystem.md`
- **Validate Phase:** `.claude/commands/validate-phase.md`

### Documentação Técnica

- **Validation Checklist:** `docs/VALIDATION_CHECKLIST.md`
- **PM Agent Guide:** `docs/PM_AGENT_GUIDE.md`
- **Testing Patterns:** `.claude/guides/testing-patterns.md`
- **Zero Tolerance:** `.claude/guides/zero-tolerance-policy.md`

---

## Troubleshooting

### Erro: "PM Expert não encontrou gaps mas eu vejo erros"

**Causa:** Escopo não cobriu área específica

**Solução:**

```text
Use the pm-expert to validate specifically the [área]:
- Frontend: [página específica]
- Backend: [endpoint específico]
- Database: [tabela específica]
```

### Erro: "PM Expert demorou muito (>30 min)"

**Causa:** Escopo muito grande ou infraestrutura lenta

**Solução:**

```text
# Dividir em etapas:
1. Use pm-expert to validate frontend only
2. Use pm-expert to validate backend only
3. Use pm-expert to validate infrastructure only
```

### Erro: "PM Expert criou relatório mas não atualizou KNOWN-ISSUES.md"

**Causa:** Permissões ou gap não foi classificado como "conhecido"

**Solução:**

```text
Manually update KNOWN-ISSUES.md with findings from VALIDACAO_[TAREFA].md
```

---

## Fontes

- **Definição do Agent:** `.claude/agents/pm-expert.md`
- **MCP Triplo Methodology:** `METODOLOGIA_MCPS_INTEGRADA.md`
- **Validation Checklist:** `CHECKLIST_ECOSSISTEMA_COMPLETO.md`
- **Quality Standards:** `.claude/guides/zero-tolerance-policy.md`
