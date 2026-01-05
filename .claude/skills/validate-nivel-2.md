---
name: validate-nivel-2
description: Deep Validation - Validacao profunda para features novas e refactoring (15-30 min)
---

# Skill: validate-nivel-2 (Deep Validation)

**Descricao:** Validacao profunda para features novas e refactoring

**Frequencia de Uso:** 3-5x por dia (features medias, antes de PR)

**Tempo Estimado:** 15-30 minutos

**Pre-requisito:** Nivel 1 deve passar 100%

---

## Objetivo

Executar validacao profunda para features novas (2-5 arquivos) e refactoring significativo, incluindo FASE 156 Pipeline CI.

---

## Quando Usar

| Cenario | Arquivos | Complexidade |
|---------|----------|--------------|
| Feature pequena | 2-5 | Media |
| Feature media | 5-10 | Media-Alta |
| Refactoring | 5-10 | Media |
| Antes de PR | Variavel | Variavel |

---

## Etapas de Validacao

### 2.1 Executar Nivel 1 Completo (Pre-requisito)

```bash
# OBRIGATORIO: Nivel 1 deve passar 100%
# Ver: .claude/skills/validate-nivel-1.md
```

**Se Nivel 1 falhar:** PARAR. Corrigir antes de prosseguir.

---

### 2.2 FASE 156 Pipeline (CI Mode)

```bash
cd frontend
npm run test:pipeline:ci
```

**O que executa:**
- Layer 1: Playwright Native (baseline) - 14 scenarios
- Layer 2: Playwright MCP (race detection)
- Layer 5: a11y MCP (WCAG compliance)

**Resultado Esperado:**
```
Running Layer 1: Playwright Native...
  SC-01: Toggle Single Scraper - PASS
  SC-02: Parameters Persistence - PASS
  ...
  14/14 scenarios passed (100%)

Running Layer 2: Playwright MCP...
  Validation against Layer 1 - PASS
  Race condition check - PASS

Running Layer 5: a11y MCP...
  WCAG 2.1 AA - 0 serious violations

PIPELINE SUMMARY:
  Layer 1: 14/14 PASS (100%)
  Layer 2: PASS
  Layer 5: PASS

  Overall: CI PIPELINE PASSED
```

**Criterios de Aprovacao Pipeline CI:**
- Layer 1: >= 60% pass rate (minimo 8/14 scenarios)
- Layer 2: No race conditions detected OR documented in KNOWN-ISSUES.md
- Layer 5: 0 SERIOUS/CRITICAL violations

---

### 2.3 Backend Tests

```bash
cd backend

# Unit tests
npm run test
# Output ESPERADO: All tests passing

# E2E tests (se aplicavel)
npm run test:e2e
# Output ESPERADO: All tests passing
```

---

### 2.4 Observability Check

**Verificar que observability stack esta operacional:**

```bash
# Prometheus targets
# Abrir: http://localhost:9090/targets
# Verificar: ALL targets UP

# Grafana dashboards
# Abrir: http://localhost:3000
# Verificar: Dashboards carregando
```

**Resultado Esperado:**
- Prometheus: ALL targets UP
- Grafana: Dashboards loading correctly

---

## Criterios de Aprovacao

```
NIVEL 2: DEEP VALIDATION - CRITERIOS
--------------------------------------
[ ] 2.1 Nivel 1: 100% PASS (pre-requisito)

[ ] 2.2 FASE 156 Pipeline CI:
    [ ] Layer 1: >= 60% pass rate
    [ ] Layer 2: No undocumented race conditions
    [ ] Layer 5: 0 SERIOUS/CRITICAL a11y violations

[ ] 2.3 Backend Tests:
    [ ] Unit tests: 100% PASS
    [ ] E2E tests: 100% PASS (se aplicavel)

[ ] 2.4 Observability:
    [ ] Prometheus: ALL targets UP
    [ ] Grafana: Dashboards loading

--------------------------------------
APROVADO: Todos os criterios passando
REPROVADO: Qualquer criterio falhando
--------------------------------------
TEMPO ESTIMADO: 15-30 minutos
FREQUENCIA: Antes de PR, features novas
```

---

## Report Template

```markdown
## Validacao Nivel 2 Report

### 2.1 Nivel 1 (Pre-requisito)
- Status: [PASS / FAIL]
- Detalhes: [resumo do Nivel 1]

### 2.2 FASE 156 Pipeline CI
| Layer | Status | Pass Rate | Details |
|-------|--------|-----------|---------|
| L1 Native | PASS/FAIL | X/14 (Y%) | baseline |
| L2 MCP | PASS/FAIL | - | race detection |
| L5 a11y | PASS/FAIL | - | X violations |

### 2.3 Backend Tests
- Unit Tests: [PASS (X tests) / FAIL]
- E2E Tests: [PASS / FAIL / N/A]

### 2.4 Observability
- Prometheus: [ALL UP / X targets DOWN]
- Grafana: [OK / FAIL]

### Resultado Final: [APROVADO / REPROVADO]
```

---

## Invocacao

**Via Slash Command:**
```
/validate-nivel-2
```

**Via Skill:**
```
Execute skill validate-nivel-2
```

---

## Proximos Passos se REPROVADO

1. **Se Pipeline CI falhou:**
   - Layer 1 <60%: Investigar scenarios falhando
   - Layer 2 race condition: Ver BUG-B1 pattern, usar `/mcp-triplo`
   - Layer 5 a11y: Corrigir violations WCAG

2. **Se Backend Tests falharam:**
   - Verificar logs: `docker logs invest_backend --tail 100`
   - Debug especifico: `npm run test -- --testNamePattern="<pattern>"`

3. **Se Observability falhou:**
   - Prometheus DOWN: `docker restart invest_prometheus`
   - Grafana DOWN: `docker restart invest_grafana`

---

## Escalar para Nivel 3 Quando

- Pipeline CI teve >3 failures
- Bugs detectados precisam de debugging visual
- Race conditions confirmadas
- Feature critica (alto risco)

---

## Referencia

- `FLUXO_UNIVERSAL_VALIDACAO.md` - Secao "NIVEL 2: DEEP VALIDATION"
- `frontend/tests/integration-pipeline/README.md` - Pipeline documentation
- `.claude/skills/validate-nivel-1.md` - Pre-requisito

---

**Versao:** 1.0.0
**Criado:** 2026-01-04
**Mantenedor:** Claude Code (Opus 4.5)
