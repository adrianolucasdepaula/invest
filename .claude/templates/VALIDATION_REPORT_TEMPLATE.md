# Validation Report - Level [N]

**Data:** YYYY-MM-DD HH:MM
**Nivel:** [0-5]
**Motivo:** [Commit / PR / Release / Audit / Bug Fix]
**Executor:** [Claude Code / CI/CD / Manual]

---

## Resumo Executivo

| Metrica | Valor |
|---------|-------|
| **Nivel Executado** | [N] |
| **Tempo Total** | [X min] |
| **Steps Total** | [X] |
| **Steps PASS** | [X] |
| **Steps FAIL** | [X] |
| **Steps SKIP** | [X] |
| **Steps WARN** | [X] |
| **Recomendacao** | [APROVADO / REPROVADO / INVESTIGAR] |

---

## Nivel 0: Pre-requisitos

| Step | Status | Duracao | Detalhes |
|------|--------|---------|----------|
| 0.1 Git Status | PASS/FAIL | Xms | [Working tree clean / X uncommitted] |
| 0.2 Docker Health | PASS/FAIL | Xms | [X/7 containers healthy] |
| 0.3 TypeScript Backend | PASS/FAIL | Xms | [0 errors / X errors] |
| 0.4 TypeScript Frontend | PASS/FAIL | Xms | [0 errors / X errors] |
| 0.5 Build Backend | PASS/FAIL | Xms | [Success / Failed] |
| 0.6 Build Frontend | PASS/FAIL | Xms | [Success / Failed] |

**Nivel 0 Status:** [PASS / FAIL]

---

## Nivel 1: Quick Validation

| Step | Status | Duracao | Detalhes |
|------|--------|---------|----------|
| 1.1 Lint Frontend | PASS/WARN | Xms | [0 critical / X warnings] |
| 1.2 Layer 1 - Playwright Native | PASS/FAIL | Xms | [X/14 scenarios] |
| 1.3 Health Check Backend | PASS/FAIL | Xms | [200 OK / Failed] |

### L1 vs L2 Validacao Cruzada (se aplicavel)

| L1 Result | L2 Result | Interpretacao |
|-----------|-----------|---------------|
| PASS | PASS | Validado |
| PASS | FAIL | Race condition detectada |
| FAIL | PASS | Timing issue |
| FAIL | FAIL | Bug confirmado |

**Nivel 1 Status:** [PASS / FAIL]

---

## Nivel 2: Deep Validation

| Step | Status | Duracao | Detalhes |
|------|--------|---------|----------|
| 2.1 FASE 156 Pipeline CI | PASS/WARN | Xms | [Layers 1,2,5 passed] |
| 2.2 Backend Unit Tests | PASS/FAIL | Xms | [X tests passed] |
| 2.3 Prometheus Targets | PASS/WARN | Xms | [All UP / X DOWN] |

**Nivel 2 Status:** [PASS / FAIL]

---

## Nivel 3: Comprehensive Validation

| Step | Status | Duracao | Detalhes |
|------|--------|---------|----------|
| 3.1 FASE 156 Pipeline FULL | PASS/WARN | Xms | [All 6 layers] |
| 3.2 Migrations Check | PASS/WARN | Xms | [All executed] |
| 3.3 NPM Audit Backend | PASS/WARN | Xms | [0 critical/high] |
| 3.4 NPM Audit Frontend | PASS/WARN | Xms | [0 critical/high] |
| 3.5 PM Expert Validation | PASS/SKIP | Xms | [18/18 pages, 11/11 controllers] |

**Nivel 3 Status:** [PASS / FAIL]

---

## Nivel 4: Troubleshooting (se aplicavel)

### Sequential Thinking Analysis

| Thought | Hipotese | Status |
|---------|----------|--------|
| 1 | [Initial hypothesis] | [Tested / Discarded] |
| 2 | [Refined hypothesis] | [Tested / Discarded] |
| N | [Root cause identified] | [Confirmed] |

### Root Cause

```
[Descricao detalhada do root cause]
```

### Solucao Aplicada

```
[Descricao da solucao]
```

**Nivel 4 Status:** [RESOLVIDO / EM PROGRESSO]

---

## Nivel 5: Ecosystem Audit (se aplicavel)

### PM Expert Ultra-Validation

| Agent | Scope | Status | Details |
|-------|-------|--------|---------|
| Agent 1 | Frontend (18 pages) | PASS/FAIL | [X/18 OK] |
| Agent 2 | Backend (11 controllers) | PASS/FAIL | [X/11 OK] |
| Agent 3 | Infra (21 containers) | PASS/FAIL | [X/21 healthy] |

### Data Integrity

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Assets <-> Prices | 0 orphans | X | PASS/FAIL |
| Portfolio integrity | 0 orphans | X | PASS/FAIL |
| FundamentalData uniqueness | 0 duplicates | X | PASS/FAIL |

### Performance

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Lighthouse | >= 90 | X | PASS/FAIL |
| API Response | <= 500ms | Xms | PASS/FAIL |
| DB Queries | <= 100ms | Xms | PASS/FAIL |
| Frontend TTI | <= 3s | Xs | PASS/FAIL |

### Security

| Check | Status | Details |
|-------|--------|---------|
| NPM Audit Backend | PASS/FAIL | [0 critical/high / X found] |
| NPM Audit Frontend | PASS/FAIL | [0 critical/high / X found] |
| OWASP Top 10 | PASS/FAIL | [All verified / X issues] |

**Nivel 5 Status:** [PASS / FAIL]

---

## Issues Encontrados

### Criticos (Bloqueantes)

| # | Descricao | Step | Acao Requerida |
|---|-----------|------|----------------|
| 1 | [Issue description] | [Step X.X] | [Action needed] |

### Warnings (Nao-bloqueantes)

| # | Descricao | Step | Recomendacao |
|---|-----------|------|--------------|
| 1 | [Warning description] | [Step X.X] | [Recommendation] |

---

## Recomendacao Final

### Status: [APROVADO / REPROVADO / INVESTIGAR]

### Justificativa

```
[Explicacao detalhada da recomendacao]
```

### Proximos Passos

- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]

---

## Assinaturas

| Role | Nome | Data |
|------|------|------|
| Executor | [Claude Code / Manual] | YYYY-MM-DD |
| Revisor | [Nome] | YYYY-MM-DD |
| Aprovador | [Nome] | YYYY-MM-DD |

---

**Gerado por:** Universal Validation Flow v1.0
**Referencia:** FLUXO_UNIVERSAL_VALIDACAO.md
