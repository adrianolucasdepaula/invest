---
name: validate-nivel-3
description: Comprehensive Validation - Validacao completa para features criticas e releases (45-60 min)
---

# Skill: validate-nivel-3 (Comprehensive Validation)

**Descricao:** Validacao completa para features criticas e releases

**Frequencia de Uso:** 1-2x por dia (features grandes, releases)

**Tempo Estimado:** 45-60 minutos

**Pre-requisito:** Nivel 2 deve passar 100%

---

## Objetivo

Executar validacao completa para features criticas (>5 arquivos), mudancas em arquitetura, release candidates, e antes de merge para main.

---

## Quando Usar

| Cenario | Arquivos | Risco |
|---------|----------|-------|
| Feature grande | 10-20 | Alto |
| Refactoring grande | >20 | Alto |
| Mudanca arquitetural | Variavel | Muito Alto |
| Release candidate | Todos | Critico |
| Before merge to main | Variavel | Alto |

---

## Etapas de Validacao

### 3.1 Executar Nivel 2 Completo (Pre-requisito)

```bash
# OBRIGATORIO: Nivel 2 deve passar 100%
# Ver: .claude/skills/validate-nivel-2.md
```

**Se Nivel 2 falhar:** PARAR. Corrigir antes de prosseguir.

---

### 3.2 FASE 156 Pipeline (FULL Mode)

```bash
cd frontend
npm run test:pipeline
```

**O que executa (TODOS os 6 layers):**
- Layer 1: Playwright Native (baseline)
- Layer 2: Playwright MCP (validation)
- Layer 3: VS Code Extension (conditional debug)
- Layer 4: Chrome DevTools MCP (console/network)
- Layer 5: a11y MCP (WCAG compliance)
- Layer 6: React Context MCP (component state)

**Resultado Esperado:**
```
PIPELINE SUMMARY:
  Layer 1: 14/14 PASS (100%)
  Layer 2: PASS
  Layer 3: PASS (or SKIPPED if no failures)
  Layer 4: 0 console errors, 0 network errors
  Layer 5: 0 SERIOUS violations
  Layer 6: Component state correct

  Overall: FULL PIPELINE PASSED
```

**Criterios de Aprovacao:**
- >= 70% overall pass rate
- All layers without CRITICAL issues

---

### 3.3 PM Expert Validation

**Delegar validacao completa para PM Expert agent:**

```typescript
Task({
  subagent_type: "pm-expert",
  description: "Comprehensive validation",
  prompt: `Execute comprehensive validation:

  FRONTEND (18 paginas):
  1. Dashboard (/) - Cards, charts, indicators
  2. Assets List (/assets) - Table, search, pagination
  3. Asset Details (/assets/[ticker]) - All tabs, charts
  4. Portfolio (/portfolio) - CRUD operations
  5. Analysis (/analysis) - Request, view
  6. Reports (/reports) - Generate, download
  7. Data Management (/data-management) - Sync
  8. Data Sources (/data-sources) - Cross-validation
  9. Discrepancies (/discrepancies) - Resolution
  10. Settings (/settings) - All settings
  11. OAuth Manager (/oauth-manager) - 21 sites
  12. Wheel (/wheel) - Strategy
  13-18. Auth pages

  BACKEND (11 controllers):
  1-11. [All controllers from AssetsController to DataSourcesController]

  INFRA (21 containers):
  - Check all containers running
  - Health check each service

  Report format:
  - Total items validated: X/XX
  - Issues found: [list]
  - Recommendation: PASS/FAIL`
})
```

---

### 3.4 Database Integrity

```bash
cd backend

# Ensure migrations applied
npm run migration:run

# Check for pending migrations
npm run migration:show
# Output ESPERADO: All migrations marked as [X] executed
```

**SQL Integrity Checks (via pgadmin ou psql):**
```sql
-- Foreign key constraints valid
-- Unique constraints enforced
-- No orphan records
```

---

### 3.5 Security Audit

```bash
# NPM audit
cd backend && npm audit
cd frontend && npm audit

# Output ESPERADO: 0 critical, 0 high vulnerabilities
# Acceptable: moderate/low (document in KNOWN-ISSUES if needed)
```

**Verificar:**
- CORS nao permite * com credentials
- JWT token expiry configurado
- Rate limiting ativo em endpoints sensiveis

---

### 3.6 Documentation Sync

```bash
# Verificar CLAUDE.md === GEMINI.md
/sync-docs

# Output ESPERADO:
# CLAUDE.md and GEMINI.md are 100% identical
```

---

## Criterios de Aprovacao

```
NIVEL 3: COMPREHENSIVE VALIDATION - CRITERIOS
----------------------------------------------
[ ] 3.1 Nivel 2: 100% PASS (pre-requisito)

[ ] 3.2 FASE 156 Pipeline FULL:
    [ ] >= 70% overall pass rate
    [ ] No CRITICAL issues in any layer

[ ] 3.3 PM Expert Validation:
    [ ] Frontend: 18/18 paginas OK
    [ ] Backend: 11/11 controllers OK
    [ ] Infra: 21/21 containers healthy

[ ] 3.4 Database Integrity:
    [ ] All migrations executed
    [ ] No integrity issues

[ ] 3.5 Security Audit:
    [ ] 0 critical/high vulnerabilities

[ ] 3.6 Documentation:
    [ ] CLAUDE.md === GEMINI.md

----------------------------------------------
APROVADO: Todos os criterios passando
REPROVADO: Qualquer criterio falhando
----------------------------------------------
TEMPO ESTIMADO: 45-60 minutos
FREQUENCIA: Features criticas, releases
```

---

## Report Template

```markdown
## Validacao Nivel 3 Report

### 3.1 Nivel 2 (Pre-requisito)
- Status: [PASS / FAIL]

### 3.2 FASE 156 Pipeline FULL
| Layer | Status | Details |
|-------|--------|---------|
| L1 Native | PASS/FAIL | X/14 |
| L2 MCP | PASS/FAIL | validation |
| L3 VS Code | PASS/SKIP | conditional |
| L4 DevTools | PASS/FAIL | console/network |
| L5 a11y | PASS/FAIL | X violations |
| L6 React | PASS/FAIL | component state |

Overall Pass Rate: X%

### 3.3 PM Expert Validation
- Frontend: X/18 paginas OK
- Backend: X/11 controllers OK
- Infra: X/21 containers healthy
- Issues: [list]

### 3.4 Database Integrity
- Migrations: [All executed / X pending]
- Integrity: [OK / X issues]

### 3.5 Security Audit
- NPM Audit Backend: [0 critical/high / X vulnerabilities]
- NPM Audit Frontend: [0 critical/high / X vulnerabilities]

### 3.6 Documentation
- CLAUDE.md === GEMINI.md: [YES / NO]

### Resultado Final: [APROVADO / REPROVADO]
```

---

## Invocacao

**Via Slash Command:**
```
/validate-nivel-3
```

**Via Skill:**
```
Execute skill validate-nivel-3
```

---

## Proximos Passos se REPROVADO

1. **Se Pipeline FULL falhou:**
   - Usar Layer 3 (VS Code Trace) para debugging visual
   - Analisar Layer 4 console/network errors
   - Corrigir Layer 5 a11y violations

2. **Se PM Expert encontrou issues:**
   - Priorizar por severidade (CRITICAL > HIGH > MEDIUM)
   - Corrigir e re-executar validacao

3. **Se Security Audit falhou:**
   - `npm audit fix` para vulnerabilidades automaticas
   - Atualizar dependencias manualmente se necessario

4. **Se Docs desincronizados:**
   - Executar `/sync-docs` novamente
   - Verificar diff e corrigir

---

## Escalar para Nivel 4 Quando

- Bugs persistentes >2h sem solucao
- Root cause analysis necessario
- Performance issues detectados
- Problemas intermitentes

---

## Referencia

- `FLUXO_UNIVERSAL_VALIDACAO.md` - Secao "NIVEL 3: COMPREHENSIVE VALIDATION"
- `.claude/guides/pm-expert-agent.md` - PM Expert documentation
- `.claude/skills/validate-nivel-2.md` - Pre-requisito

---

**Versao:** 1.0.0
**Criado:** 2026-01-04
**Mantenedor:** Claude Code (Opus 4.5)
