---
name: validate-nivel-1
description: Quick Validation - Validacao rapida para mudancas pequenas/medias (5-10 min)
---

# Skill: validate-nivel-1 (Quick Validation)

**Descricao:** Validacao rapida para mudancas em 1-3 arquivos

**Frequencia de Uso:** 10-20x por dia (mudancas pequenas)

**Tempo Estimado:** 5-10 minutos

**Pre-requisito:** Nivel 0 (Pre-requisitos) deve estar OK

---

## Objetivo

Executar validacao rapida para mudancas pequenas/medias, garantindo Zero Tolerance antes de commit.

---

## Quando Usar

| Cenario | Arquivos | Complexidade |
|---------|----------|--------------|
| Typo, comment | 1 | Trivial |
| Bug fix pequeno | 1-3 | Baixa |
| Style/CSS change | 1-3 | Baixa |

---

## Etapas de Validacao

### 1.1 Executar /validate-all

```bash
# Backend
cd backend && npx tsc --noEmit && npm run build

# Frontend
cd frontend && npx tsc --noEmit && npm run build && npm run lint
```

**Resultado Esperado:**
```
VALIDACAO COMPLETA - ZERO TOLERANCE
TypeScript Backend:  0 erros
TypeScript Frontend: 0 erros
Build Backend:       Success
Build Frontend:      Success (XX paginas)
Lint Frontend:       0 errors, X warnings (nao-criticos)

Projeto validado. Pronto para commit.
```

---

### 1.2 Validacao Frontend (SE mudanca afeta frontend)

#### GRUPO PRINCIPAL: L1 + L2 (OBRIGATORIO - VALIDACAO CRUZADA)

**REGRA CRITICA:** Playwright Native (L1) e Playwright MCP (L2) SEMPRE juntos.

```bash
# Layer 1 - Playwright Native (baseline)
cd frontend
npx playwright test tests/integration-pipeline/01-baseline-native.spec.ts --reporter=list
```

```javascript
// Layer 2 - Playwright MCP (validacao de L1)
mcp__playwright__browser_navigate({ url: "http://localhost:3100/<page>" })
mcp__playwright__browser_snapshot({})
mcp__playwright__browser_take_screenshot({ fullPage: true })
```

**Interpretacao L1 vs L2:**

| L1 | L2 | Interpretacao | Acao |
|----|----|--------------|----- |
| PASS | PASS | Validado | Prosseguir |
| PASS | FAIL | Race condition | Investigar BUG-B1 |
| FAIL | PASS | Timing issue | Verificar timing |
| FAIL | FAIL | Bug confirmado | Corrigir antes de prosseguir |

#### GRUPO SECUNDARIO: Console + Network + a11y

```javascript
// Console errors (fallback se L1+L2 nao capturam)
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
// Output ESPERADO: 0 errors

// Network errors
mcp__chrome-devtools__list_network_requests({})
// Output ESPERADO: All requests 200/201/304, no 4xx/5xx

// Accessibility (especializado - SEMPRE executar)
mcp__a11y__test_accessibility({ url: "http://localhost:3100/<page>" })
// Output ESPERADO: 0 SERIOUS violations
```

---

### 1.3 API Tests (SE mudanca afeta backend)

```bash
# Health check
curl http://localhost:3101/api/v1/health
# Output ESPERADO: {"status":"ok","timestamp":"..."}

# Testar endpoint especifico modificado
curl http://localhost:3101/api/v1/<endpoint>
# Output ESPERADO: 200/201 com dados validos
```

---

## Criterios de Aprovacao

```
NIVEL 1: QUICK VALIDATION - CRITERIOS
--------------------------------------
OBRIGATORIO:
[ ] 1.1 /validate-all: 100% PASS

SE MUDANCA FRONTEND:
[ ] 1.2 GRUPO PRINCIPAL (L1+L2 SEMPRE JUNTOS):
    [ ] L1 (Native): >= 60% scenarios PASS (8/14)
    [ ] L2 (MCP): Executado para validacao cruzada
    [ ] L1 vs L2: Comparacao analisada
    * Se L1=PASS, L2=FAIL: Investigar race condition

[ ] 1.2 GRUPO SECUNDARIO:
    [ ] Console: 0 errors
    [ ] Network: 0 erros 4xx/5xx
    [ ] a11y: 0 SERIOUS/CRITICAL violations

SE MUDANCA BACKEND:
[ ] 1.3 API Tests:
    [ ] Health check: 200 OK
    [ ] Endpoints modificados: 200/201

--------------------------------------
APROVADO: Todos os criterios aplicaveis passando
INVESTIGAR: L1 e L2 discordantes
REPROVADO: L1 e L2 ambos falhando
--------------------------------------
TEMPO ESTIMADO: 5-10 minutos
```

---

## Report Template

```markdown
## Validacao Nivel 1 Report

### 1.1 /validate-all
- TypeScript Backend: [0 erros / X erros]
- TypeScript Frontend: [0 erros / X erros]
- Build Backend: [SUCCESS / FAIL]
- Build Frontend: [SUCCESS / FAIL]
- Lint: [0 errors / X errors]

### 1.2 Frontend (se aplicavel)
| Layer | Status | Details |
|-------|--------|---------|
| L1 Native | PASS/FAIL | X/14 scenarios |
| L2 MCP | PASS/FAIL | validation |
| Console | PASS/FAIL | X errors |
| Network | PASS/FAIL | X errors |
| a11y | PASS/FAIL | X violations |

### 1.3 Backend (se aplicavel)
- Health: [200 OK / FAIL]
- Endpoint testado: [200/201 / FAIL]

### Resultado Final: [APROVADO / REPROVADO]
```

---

## Invocacao

**Via Slash Command:**
```
/validate-nivel-1
```

**Via Skill:**
```
Execute skill validate-nivel-1
```

---

## Proximos Passos se REPROVADO

1. **Se erros TypeScript:** Corrigir erros listados, re-executar
2. **Se L1 vs L2 discordantes:** Investigar race condition (ver BUG-B1)
3. **Se console errors:** Verificar logs do navegador
4. **Se a11y violations:** Corrigir WCAG issues

---

## Referencia

- `FLUXO_UNIVERSAL_VALIDACAO.md` - Secao "NIVEL 1: QUICK VALIDATION"
- `.claude/skills/validate-all.md` - Skill de validacao Zero Tolerance
- `.claude/skills/mcp-triplo.md` - Skill MCP Triplo

---

**Versao:** 1.0.0
**Criado:** 2026-01-04
**Mantenedor:** Claude Code (Opus 4.5)
