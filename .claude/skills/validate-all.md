---
description: Executa validação completa do projeto (TypeScript + Build + Lint)
---

# Skill: validate-all

**Descrição:** Valida 0 erros TypeScript, Build e Lint (Zero Tolerance Policy)

**Frequência de Uso:** 🔥 10-20x por dia (antes de cada commit)

**Tempo Economizado:** ~5 min → ~30 seg (**90% redução**)

---

## Objetivo

Executar **todas as validações obrigatórias** do projeto em um único comando, garantindo **Zero Tolerance** (0 erros TypeScript, Build e Lint).

---

## Etapas de Validação

### 1. Validar TypeScript Backend

```bash
cd backend && npx tsc --noEmit
```

**Resultado Esperado:** Silêncio (0 erros)

**Se falhar:** Listar erros encontrados

---

### 2. Validar TypeScript Frontend

```bash
cd frontend && npx tsc --noEmit
```

**Resultado Esperado:** Silêncio (0 erros)

**Se falhar:** Listar erros encontrados

---

### 3. Build Backend

```bash
cd backend && npm run build
```

**Resultado Esperado:** `Build complete. The output was saved to "dist" folder`

**Se falhar:** Mostrar erro de build

---

### 4. Build Frontend

```bash
cd frontend && npm run build
```

**Resultado Esperado:**
```
Route (app)                              Size     First Load JS
✓ /                                      X kB     XX kB
...
○  (Static)  prerendered as static content
```

**Se falhar:** Mostrar erro de build

---

### 5. Lint Frontend

```bash
cd frontend && npm run lint
```

**Resultado Esperado:** `No ESLint warnings or errors` ou apenas warnings não-críticos

**Se falhar:** Listar warnings/errors

---

## Resumo de Saída

### ✅ Se Todas Validações Passarem

```
✅ VALIDAÇÃO COMPLETA - ZERO TOLERANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TypeScript Backend:  0 erros
✅ TypeScript Frontend: 0 erros
✅ Build Backend:       Success
✅ Build Frontend:      Success (XX páginas)
✅ Lint Frontend:       0 errors, X warnings (não-críticos)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Projeto validado. Pronto para commit.
```

---

### ❌ Se Houver Erros

```
❌ VALIDAÇÃO FALHOU - CORRIJA ANTES DE COMMITAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ TypeScript Backend:  3 erros
   - src/api/assets/assets.service.ts:45 - Property 'foo' does not exist on type 'Asset'
   - src/api/assets/assets.controller.ts:12 - Argument of type 'string' is not assignable
   - ...

✅ TypeScript Frontend: 0 erros
❌ Build Backend:       FAILED
   - Error: Module not found: '@types/lodash'

✅ Build Frontend:      Success
✅ Lint Frontend:       0 errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Corrija os X erros acima antes de commitar.
```

---

## Quando Usar

- ✅ **Antes de CADA commit** (obrigatório)
- ✅ **Antes de push** (recomendado)
- ✅ **Após mudanças grandes** (> 100 linhas)
- ✅ **Antes de marcar fase como completa**

---

## Invocação

**Via Comando:**
```
Execute skill validate-all
```

**Via Slash Command (se configurado):**
```
/validate-all
```

---

## Regras Críticas

1. ❌ **NUNCA commitar se validate-all falhar**
2. ✅ **SEMPRE corrigir 100% dos erros antes de commit**
3. ❌ **Não ignorar warnings críticos** (ex: unused vars em produção)
4. ✅ **Executar novamente após correções** (garantir que fix não quebrou nada)

---

## Tempo Estimado

- **Execução:** ~30-60 segundos
- **Antes (manual):** ~5 minutos

**Economia:** ⬆️ **90% de redução de tempo**

---

## Zero Tolerance Policy

Este skill implementa a **Zero Tolerance Policy** do projeto:

```
TypeScript Errors:     0 ✅ OBRIGATÓRIO
Build Errors:          0 ✅ OBRIGATÓRIO
Console Errors:        0 ✅ OBRIGATÓRIO (validar separadamente)
Lint Critical:         0 ✅ OBRIGATÓRIO
```

**Referência:** `CHECKLIST_TODO_MASTER.md` - Seção "Visão Geral"

---

**Versão:** 1.0.0
**Criado:** 2025-12-05
**Mantenedor:** Claude Code (Opus 4.5)
**Última Atualização:** 2025-12-05
