---
name: validate-nivel-4
description: Troubleshooting & Root Cause - Identificar e resolver bugs complexos (2-8 horas)
---

# Skill: validate-nivel-4 (Troubleshooting & Root Cause)

**Descricao:** Identificar e resolver bugs complexos com root cause analysis

**Frequencia de Uso:** 1-2x por semana (bugs complexos)

**Tempo Estimado:** 2-8 horas (variavel)

**Pre-requisito:** Nivel 3 deve ter sido tentado ou bug >2h sem solucao

---

## Objetivo

Identificar e resolver bugs complexos atraves de root cause analysis estruturado, utilizando Sequential Thinking MCP e investigacao profunda.

---

## Quando Usar

| Cenario | Indicador |
|---------|-----------|
| Bugs >2h sem solucao | Tentativas falharam |
| Regressoes | Algo que funcionava parou |
| Performance issues | Lentidao, memory leaks |
| Problemas intermitentes | Dificil reproduzir |
| Race conditions | Timing-dependent |

---

## Etapas de Troubleshooting

### 4.1 Sequential Thinking MCP

**Iniciar analise estruturada do problema:**

```javascript
mcp__sequential-thinking__sequentialthinking({
  thought: `Analyzing bug: [DESCRIPTION]

  Known facts:
  1. [Symptom 1]
  2. [Symptom 2]
  3. [When it started]

  Initial hypothesis:
  - [Hypothesis 1]
  - [Hypothesis 2]

  Next step: [What to investigate first]`,

  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
})
```

**Continuar ate root cause identificado:**
- Usar `isRevision: true` para revisar hipoteses
- Usar `needsMoreThoughts: true` se precisar mais analise
- Documentar cada descoberta

---

### 4.2 MCP Quadruplo

**Executar validacao completa com documentation research:**

```javascript
// Etapa 1-3: MCP Triplo
// Playwright + DevTools + a11y

// Etapa 4: Documentation Research

// 4.1 GitHub Issues
WebSearch({ query: "[library] [error] site:github.com/issues 2024 OR 2025" })

// 4.2 Official Docs
WebSearch({ query: "[technology] [feature] official documentation" })

// 4.3 KNOWN-ISSUES.md
Grep({ pattern: "[keyword]", path: "KNOWN-ISSUES.md" })

// 4.4 Git History
// git log --grep="[keyword]" --all --oneline -20

// 4.5 WebSearch (3+ sources)
WebSearch({ query: "[problem] solution 2025" })
```

---

### 4.3 Specialized Agent

**Delegar para agente especializado baseado na area do problema:**

```typescript
// Se problema FRONTEND:
Task({
  subagent_type: "frontend-components-expert",
  description: "Debug frontend issue",
  prompt: `Debug: [DESCRIPTION]

  Symptoms:
  - [Symptom 1]
  - [Symptom 2]

  Files to investigate:
  - [File 1]
  - [File 2]

  Find root cause and propose fix.`
})

// Se problema BACKEND:
Task({
  subagent_type: "backend-api-expert",
  ...
})

// Se problema TYPESCRIPT:
Task({
  subagent_type: "typescript-validation-expert",
  ...
})
```

---

### 4.4 Observability Deep Dive

```bash
# Loki - Logs
# Abrir: http://localhost:3102
# Query: {container="invest_backend"} |= "error" | json
# Filtrar por timestamp do problema

# Tempo - Traces
# Abrir: http://localhost:3200
# Buscar por trace ID do request com problema

# Prometheus - Metrics
# Abrir: http://localhost:9090/graph
# Query: rate(http_requests_total{status=~"5.."}[5m])
# Identificar padroes

# Grafana - Timeline
# Abrir: http://localhost:3000
# Dashboard relevante
# Correlacionar eventos
```

---

### 4.5 Git Bisect (Identificar quando bug foi introduzido)

```bash
# Iniciar bisect
git bisect start

# Marcar commit atual como ruim
git bisect bad HEAD

# Marcar ultimo commit bom conhecido
git bisect good <commit-hash>

# Git vai fazer checkout de commit intermediario
# Testar se bug existe
git bisect bad   # Se bug existe
git bisect good  # Se bug nao existe

# Repetir ate encontrar primeiro commit com bug
# Git mostrara: <commit-hash> is the first bad commit
```

---

### 4.6 Database Forensics

```sql
-- Verificar dados inconsistentes
SELECT * FROM assets WHERE last_updated < NOW() - INTERVAL '7 days';

-- Verificar locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Slow queries
SELECT * FROM pg_stat_activity WHERE state = 'active' ORDER BY query_start;

-- Explain analyze
EXPLAIN ANALYZE SELECT * FROM asset_prices WHERE ticker = 'PETR4' ORDER BY date DESC;
```

---

### 4.7 Cache Clearing (Se problema de Turbopack/Frontend)

```powershell
# Turbopack cache completo
.\system-manager.ps1 rebuild-frontend-complete

# OU manualmente:
docker exec invest_frontend rm -rf .next node_modules/.cache
docker restart invest_frontend
```

---

### 4.8 Documentar Solucao

**OBRIGATORIO: Documentar em KNOWN-ISSUES.md**

```markdown
### Issue #NEW_ISSUE: [Title]

**Severidade:** CRITICA / ALTA / MEDIA / BAIXA
**Status:** RESOLVIDO / EM PROGRESSO / NAO RESOLVIDO
**Data Identificado:** YYYY-MM-DD
**Tempo Investigacao:** X horas

#### Descricao
[Descricao detalhada do problema]

#### Sintomas
- [Sintoma 1]
- [Sintoma 2]

#### Root Cause Identificado
[Causa raiz - NAO sintoma]

#### Solucao Aplicada
[Comandos/codigo da solucao]

#### Prevencao
- [Como evitar no futuro]

#### Arquivos Afetados
- path/to/file1.ts
- path/to/file2.tsx
```

---

## Criterios de Sucesso

```
NIVEL 4: TROUBLESHOOTING - CRITERIOS DE SUCESSO
------------------------------------------------
[ ] Root cause identificado (NAO sintoma)
[ ] Fix implementado e validado (Niveis 1-3)
[ ] Regression test adicionado (se aplicavel)
[ ] KNOWN-ISSUES.md atualizado
[ ] Prevencao implementada

------------------------------------------------
SUCESSO: Todos os criterios cumpridos
EM PROGRESSO: Root cause nao identificado
------------------------------------------------
TEMPO ESTIMADO: 2-8 horas (variavel)
FREQUENCIA: Quando bugs >2h sem solucao
```

---

## Report Template

```markdown
## Troubleshooting Report - Nivel 4

### Problema
- Descricao: [DESCRIPTION]
- Severidade: [CRITICAL/HIGH/MEDIUM/LOW]
- Tempo investigando: [X hours]

### Sequential Thinking Analysis
- Total thoughts: [X]
- Hipoteses testadas: [X]
- Hipoteses descartadas: [X]

### MCP Quadruplo Results
- Playwright: [findings]
- DevTools: [console/network findings]
- a11y: [findings]
- Documentation Research: [findings]

### Specialized Agent Used
- Agent: [frontend/backend/typescript/etc]
- Findings: [summary]

### Observability Findings
- Logs: [relevant errors]
- Traces: [trace IDs]
- Metrics: [anomalies]

### Git Bisect Results (se usado)
- First bad commit: [hash]
- Commit date: [date]
- Commit message: [message]

### ROOT CAUSE IDENTIFICADO
[Causa raiz - NAO sintoma]

### Solucao Aplicada
[Descricao da solucao]

### Validacao Pos-Fix
- Nivel 1: [PASS/FAIL]
- Nivel 2: [PASS/FAIL]
- Nivel 3: [PASS/FAIL]

### Prevencao
- [Medidas para evitar no futuro]

### Status: [RESOLVIDO / EM PROGRESSO]
```

---

## Invocacao

**Via Slash Command:**
```
/validate-nivel-4
```

**Via Skill:**
```
Execute skill validate-nivel-4
```

---

## Escalar para Nivel 5 Quando

- Problem affects entire ecosystem
- Major outage recovery needed
- Massive changes (>20 files) affected
- Release candidate impacted

---

## Referencia

- `FLUXO_UNIVERSAL_VALIDACAO.md` - Secao "NIVEL 4: TROUBLESHOOTING & ROOT CAUSE"
- `.claude/guides/specialized-agents.md` - Agents documentation
- `KNOWN-ISSUES.md` - Issues documentation

---

**Versao:** 1.0.0
**Criado:** 2026-01-04
**Mantenedor:** Claude Code (Opus 4.5)
