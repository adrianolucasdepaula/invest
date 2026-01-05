---
name: validate-nivel-5
description: Ecosystem Audit - Validacao 100% completa de todo o ecossistema (2-4 horas)
---

# Skill: validate-nivel-5 (Ecosystem Audit)

**Descricao:** Validacao 100% completa de todo o ecossistema

**Frequencia de Uso:** 1-2x por mes (releases, auditorias)

**Tempo Estimado:** 2-4 horas

**Pre-requisito:** Niveis 0-3 devem passar 100%

---

## Objetivo

Validacao 100% completa de todo o ecossistema (frontend, backend, infraestrutura, dados, seguranca, documentacao) para releases majors e auditorias mensais.

---

## Quando Usar

| Cenario | Frequencia |
|---------|------------|
| Before major release | Cada release |
| After massive changes (>20 files) | Quando necessario |
| Monthly audit | Primeiro sabado do mes |
| After major outage recovery | Pos-incidente |

---

## Etapas de Validacao

### 5.1 Executar Niveis 0-3 Completos (Pre-requisito OBRIGATORIO)

```bash
# TODOS os niveis anteriores devem passar 100%
# Nivel 0: Pre-requisitos
# Nivel 1: Quick Validation
# Nivel 2: Deep Validation
# Nivel 3: Comprehensive Validation
```

**Se qualquer nivel falhar:** PARAR. Corrigir antes de prosseguir.

---

### 5.2 PM Expert Ultra-Validation (3 Agents Paralelos)

**Lancar 3 agents PM Expert em PARALELO:**

```typescript
// LANCAR TODOS EM PARALELO (single message)

// Agent 1: Frontend
Task({
  subagent_type: "pm-expert",
  description: "Validate Frontend (18 pages)",
  prompt: `Execute 100% validation of all 18 frontend pages.

  For each page:
  1. Navigate and verify load
  2. Check console for errors (0 expected)
  3. Verify main functionality works
  4. Test key interactions
  5. Report any issues

  Pages:
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

  Final report: X/18 pages PASS, issues found: [list]`
});

// Agent 2: Backend
Task({
  subagent_type: "pm-expert",
  description: "Validate Backend (11 controllers + 26 entities)",
  prompt: `Execute 100% validation of backend.

  CONTROLLERS (11):
  For each controller: test endpoints, verify responses, check error handling

  ENTITIES (26):
  For each entity: verify table, check indexes, validate constraints

  Final report: X/11 controllers PASS, X/26 entities PASS`
});

// Agent 3: Infrastructure
Task({
  subagent_type: "pm-expert",
  description: "Validate Infrastructure (21 containers)",
  prompt: `Execute 100% validation of infrastructure.

  CONTAINERS (21):
  For each: verify running, health check, logs, connectivity

  OBSERVABILITY:
  Prometheus, Grafana, Loki, Tempo - all operational

  NETWORK:
  All services communicate, ports responding, DNS working

  Final report: X/21 containers healthy`
});
```

---

### 5.3 CHECKLIST_ECOSSISTEMA_COMPLETO.md (Manual)

**Executar TODAS as 21 secoes:**

```markdown
[ ] Secao 1: PRE-DESENVOLVIMENTO (Context Loading)
[ ] Secao 2: ANALISE PRE-IMPLEMENTACAO
[ ] Secao 3: DURANTE O DESENVOLVIMENTO
[ ] Secao 4: VALIDACAO PRE-COMMIT
[ ] Secao 5: COMMIT E DOCUMENTACAO
[ ] Secao 6: VALIDACAO POS-IMPLEMENTACAO
[ ] Secao 7: TROUBLESHOOTING
[ ] Secao 8: COBERTURA 100% DO ECOSSISTEMA
[ ] Secao 9: TESTES PARALELOS COM AGENTES
[ ] Secao 10: OBSERVABILIDADE
[ ] Secao 11: INTEGRACOES CRITICAS
[ ] Secao 12: VALIDACOES FALTANTES
[ ] Secao 13: GAPS DE TESTES
[ ] Secao 14: AUTOMACAO EXISTENTE
[ ] Secao 15: DATA FLOWS CRITICOS
[ ] Secao 16: INVENTARIO DE SEGURANCA
[ ] Secao 17: INVENTARIO DATABASE
[ ] Secao 18: INVENTARIO SCRAPERS
[ ] Secao 19: INVENTARIO DOCKER
[ ] Secao 20: INVENTARIO APIs EXTERNAS
[ ] Secao 21: INVENTARIO MCP E TOOLS
```

---

### 5.4 Cross-Validation Data Integrity

```sql
-- Assets <-> AssetPrices
SELECT a.ticker FROM assets a
LEFT JOIN asset_prices ap ON a.id = ap.asset_id
WHERE ap.id IS NULL AND a.is_active = true;
-- Expected: 0 rows (all active assets have prices)

-- Portfolio <-> PortfolioPositions
SELECT p.name FROM portfolios p
LEFT JOIN portfolio_positions pp ON p.id = pp.portfolio_id
WHERE pp.id IS NULL;
-- Expected: 0 rows OR only empty portfolios

-- FundamentalData uniqueness
SELECT asset_id, reference_date, COUNT(*)
FROM fundamental_data
GROUP BY asset_id, reference_date
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- TickerChanges integrity
SELECT tc.old_ticker FROM ticker_changes tc
LEFT JOIN assets a ON tc.old_ticker = a.ticker
WHERE a.id IS NULL;
-- Expected: 0 rows
```

---

### 5.5 Performance Profiling

```bash
# Lighthouse (Frontend)
npx lighthouse http://localhost:3100 --output=json --output-path=./lighthouse-report.json
# Expected: Score >= 90

# Backend API response time
curl -w "@curl-format.txt" http://localhost:3101/api/v1/assets
# Expected: time_total <= 500ms

# Database queries
# Via pgadmin, check slow query log
# Expected: all queries <= 100ms

# Frontend TTI (Time to Interactive)
# Via Chrome DevTools Performance tab
# Expected: TTI <= 3s
```

---

### 5.6 Security Audit Completo

```bash
# NPM audit (production)
cd backend && npm audit --production
cd frontend && npm audit --production
# Expected: 0 critical, 0 high

# Docker image scan
docker scan invest_backend
docker scan invest_frontend
# Expected: 0 critical vulnerabilities
```

**OWASP Top 10 Check:**
1. Injection - SQL/NoSQL injection prevention
2. Broken Authentication - JWT security
3. Sensitive Data Exposure - HTTPS, encryption
4. XML External Entities - N/A (no XML)
5. Broken Access Control - Authorization checks
6. Security Misconfiguration - CORS, headers
7. XSS - Input sanitization, output encoding
8. Insecure Deserialization - class-transformer validation
9. Using Components with Known Vulnerabilities - npm audit
10. Insufficient Logging - structured logging

---

### 5.7 Documentation Sync Final

```bash
# Sync CLAUDE.md <-> GEMINI.md
/sync-docs

# Verify all docs up to date:
# - ROADMAP.md (current phase documented)
# - ARCHITECTURE.md (no outdated info)
# - DATABASE_SCHEMA.md (all entities)
# - KNOWN-ISSUES.md (no stale issues)
```

---

### 5.8 Backup Before Release

```powershell
# Database backup
.\system-manager.ps1 backup
# Verify backup file created: backup-YYYY-MM-DD-HH-mm-ss.sql

# Git tag
git tag -a v1.X.Y -m "Release v1.X.Y"
```

---

## Criterios de Aprovacao

```
NIVEL 5: ECOSYSTEM AUDIT - CRITERIOS
--------------------------------------
[ ] 5.1 Niveis 0-3: 100% PASS

[ ] 5.2 PM Expert Ultra-Validation:
    [ ] Agent 1 (Frontend): 18/18 paginas OK
    [ ] Agent 2 (Backend): 11/11 controllers + 26/26 entities
    [ ] Agent 3 (Infra): 21/21 containers healthy

[ ] 5.3 CHECKLIST_ECOSSISTEMA_COMPLETO.md:
    [ ] 21/21 secoes verificadas

[ ] 5.4 Data Integrity:
    [ ] 0 inconsistencias encontradas

[ ] 5.5 Performance:
    [ ] Lighthouse >= 90
    [ ] API response <= 500ms
    [ ] DB queries <= 100ms
    [ ] Frontend TTI <= 3s

[ ] 5.6 Security:
    [ ] 0 critical/high vulnerabilities
    [ ] OWASP Top 10 verified

[ ] 5.7 Documentation:
    [ ] All docs synchronized

[ ] 5.8 Backup:
    [ ] Database backup created
    [ ] Git tag created (if release)

--------------------------------------
APROVADO: Todos os criterios passando
REPROVADO: Qualquer criterio critico falhando
--------------------------------------
TEMPO ESTIMADO: 2-4 horas
FREQUENCIA: Before release, monthly audit
```

---

## Report Template

```markdown
## Ecosystem Audit Report - Nivel 5

### Data: YYYY-MM-DD
### Motivo: [Release X.Y.Z / Monthly Audit / Post-Outage]

---

### 5.1 Niveis 0-3 (Pre-requisito)
- Status: [PASS / FAIL]

### 5.2 PM Expert Ultra-Validation (3 Agents)

#### Agent 1: Frontend
- Pages Validated: X/18
- Issues Found: [list or none]
- Status: [PASS / FAIL]

#### Agent 2: Backend
- Controllers Validated: X/11
- Entities Validated: X/26
- Issues Found: [list or none]
- Status: [PASS / FAIL]

#### Agent 3: Infrastructure
- Containers Healthy: X/21
- Observability: [OK / issues]
- Network: [OK / issues]
- Status: [PASS / FAIL]

### 5.3 CHECKLIST_ECOSSISTEMA_COMPLETO.md
- Sections Verified: X/21
- Issues Found: [list or none]

### 5.4 Data Integrity
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Assets <-> Prices | 0 rows | X | PASS/FAIL |
| Portfolio integrity | 0 rows | X | PASS/FAIL |
| FundamentalData uniqueness | 0 rows | X | PASS/FAIL |
| TickerChanges integrity | 0 rows | X | PASS/FAIL |

### 5.5 Performance
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Lighthouse | >= 90 | X | PASS/FAIL |
| API Response | <= 500ms | Xms | PASS/FAIL |
| DB Queries | <= 100ms | Xms | PASS/FAIL |
| Frontend TTI | <= 3s | Xs | PASS/FAIL |

### 5.6 Security
- NPM Audit Backend: [0 critical/high / X]
- NPM Audit Frontend: [0 critical/high / X]
- Docker Scan: [0 critical / X]
- OWASP Top 10: [All verified]

### 5.7 Documentation
- CLAUDE.md === GEMINI.md: [YES / NO]
- ROADMAP.md: [Up to date / Needs update]
- ARCHITECTURE.md: [Up to date / Needs update]
- KNOWN-ISSUES.md: [Up to date / Needs update]

### 5.8 Backup
- Database Backup: [Created: filename / NOT created]
- Git Tag: [Created: vX.Y.Z / NOT created]

---

### RESULTADO FINAL: [APROVADO / REPROVADO]

### Issues to Address Before Release
1. [Issue 1]
2. [Issue 2]

### Sign-off
- [ ] All criteria met
- [ ] Ready for release/deployment
```

---

## Invocacao

**Via Slash Command:**
```
/validate-nivel-5
```

**Via Skill:**
```
Execute skill validate-nivel-5
```

---

## ROI do Ecosystem Audit

| Metrica | Valor |
|---------|-------|
| Bugs prevenidos por audit | ~5-10 |
| Downtime evitado | ~2-4h por mes |
| Confianca no release | 95%+ |
| Documentacao sincronizada | 100% |

---

## Referencia

- `FLUXO_UNIVERSAL_VALIDACAO.md` - Secao "NIVEL 5: ECOSYSTEM AUDIT"
- `CHECKLIST_ECOSSISTEMA_COMPLETO.md` - Checklist completo (21 secoes)
- `.claude/guides/pm-expert-agent.md` - PM Expert documentation

---

**Versao:** 1.0.0
**Criado:** 2026-01-04
**Mantenedor:** Claude Code (Opus 4.5)
