# Phase Checklist Workflow

Este workflow documenta o processo completo para completar uma fase do projeto.

---

## 📋 ANTES DE COMEÇAR

### 1. Verificar Estado do Projeto

```bash
# Git tree limpo?
git status
# Output esperado: "nothing to commit, working tree clean"

# Fase atual
cat ROADMAP.md | grep "FASE.*:"
```

### 2. Ler Documentação

- [ ] Ler `ROADMAP.md` (fase anterior completa?)
- [ ] Ler `.gemini/GEMINI.md` (regras não-negociáveis)
- [ ] Ler `.gemini/context/conventions.md` (naming, structure)
- [ ] Ler `CHECKLIST_TODO_MASTER.md`

---

## 🎯 PLANEJAMENTO (Mode: PLANNING)

### 1. Criar Documento de Planejamento

```bash
# Se mudança > 100 linhas
code FASE_XX_PLANEJAMENTO.md
```

**Conteúdo:**

- Objetivo da fase
- Arquivos afetados
- Mudanças propostas
- Validação esperada
- Riscos identificados

### 2. Ultra-Thinking

- [ ] Ler arquivo principal + tipos + dependências
- [ ] Buscar código similar existente (`grep`, `codebase_search`)
- [ ] Identificar TODOS os arquivos afetados
- [ ] Validar deps: `tsc --noEmit` + `grep -r "importName"`

### 3. Criar TodoWrite

```typescript
[
  { content: "1. Criar DTO/Interface", status: "pending" },
  { content: "2. Implementar Service/Hook", status: "pending" },
  { content: "3. Criar Controller/Component", status: "pending" },
  { content: "4. Validar TypeScript", status: "pending" },
  { content: "5. Build de produção", status: "pending" },
  { content: "6. Atualizar documentação", status: "pending" },
  { content: "7. Commit e push", status: "pending" },
];
```

**Regras:**

- Etapas atômicas (não genéricas)
- Apenas 1 `in_progress` por vez
- Marcar `completed` imediatamente

---

## 💻 IMPLEMENTAÇÃO (Mode: EXECUTION)

### 1. Implementar (1 Etapa Por Vez)

```bash
# Atualizar TodoWrite
# Marcar etapa como "in_progress"

# Implementar
code backend/src/...

# Marcar como "completed"
```

### 2. Validar CADA Etapa

```bash
# TypeScript (OBRIGATÓRIO)
cd backend && npx tsc --noEmit  # 0 errors
cd frontend && npx tsc --noEmit  # 0 errors

# Lint (OBRIGATÓRIO)
cd backend && npm run lint  # 0 warnings
cd frontend && npm run lint  # 0 warnings

# Build (OBRIGATÓRIO)
cd backend && npm run build  # 0 errors
cd frontend && npm run build  # 0 errors

# Console (OBRIGATÓRIO)
# Abrir app, verificar 0 errors no console
```

### 3. Reiniciar Serviços (Se Necessário)

```bash
# Backend mudou?
.\system-manager.ps1 restart backend

# Frontend mudou?
.\system-manager.ps1 restart frontend

# Tudo
.\system-manager.ps1 restart
```

---

## ✅ VALIDAÇÃO (Mode: VERIFICATION)

### 1. MCP Triplo (OBRIGATÓRIO)

```bash
# 1. Playwright MCP (E2E automatizado)
npx playwright test tests/e2e/feature.spec.ts

# 2. Chrome DevTools MCP (Inspeção manual)
# - Abrir app
# - Verificar Network (200ms OK)
# - Verificar Console (0 errors)
# - Capturar screenshot

# 3. React DevTools (Components/Hooks)
# - Verificar component tree
# - Verificar hooks state
# - Verificar re-renders excessivos
```

### 2. Testes Específicos

```bash
# Unit tests (se existem)
cd backend && npm run test

# E2E tests
npx playwright test
```

### 3. Validação Visual

- [ ] UI funciona conforme esperado
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Loading states corretos
- [ ] Error handling adequado
- [ ] Tooltips/mensagens claras

---

## 📖 DOCUMENTAÇÃO

### 1. Atualizar ROADMAP.md

```markdown
## FASE XX: [Nome da Fase] (Data)

**Status:** ✅ 100% Completo

**Implementação:**

- Arquivo 1 modificado
- Arquivo 2 criado
- Arquivo 3 deletado

**Validação:**

- TypeScript: 0 errors
- Build: 0 errors
- MCP Triplo: ✅

**Commits:**

- feat(scope): description (hash)
```

### 2. Atualizar .gemini/memory/decisions.md

```markdown
## YYYY-MM-DD: [Decisão Importante]

**Problema:** ...
**Decisão:** ...
**Alternativas Rejeitadas:** ...
**Impacto:** ...
**Arquivos Afetados:** ...
```

### 3. Atualizar Outros Docs (Se Aplicável)

- [ ] `ARCHITECTURE.md` (mudança arquitetural)
- [ ] `DATABASE_SCHEMA.md` (nova entity/migration)
- [ ] `INDEX.md` (novo documento criado)
- [ ] `.gemini/memory/tech-debt.md` (novo debt identificado)

---

## 🔄 GIT WORKFLOW

### 1. Verificar Estado

```bash
git status
# Listar arquivos modificados, novos, deletados
```

### 2. Commit

```bash
git add .
git commit -m "feat(scope): description

- Detalhe 1
- Detalhe 2

Impact: ...
Refs: ROADMAP.md FASE XX

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Regras:**

- Conventional Commits (feat, fix, docs, etc)
- Scope obrigatório
- Descrição > 10 chars
- Co-Authored para AI

### 3. Push

```bash
git push origin feature/branch-name
```

**Validação Automática:**

- ✅ Pre-commit hook (TypeScript + Lint)
- ✅ Pre-push hook (Build)
- ✅ Commit-msg hook (Conventional Commits)

---

## 🎉 FASE COMPLETA

### Checklist Final

- [ ] Todos os TodoWrite marcados `completed`
- [ ] TypeScript: 0 errors (backend + frontend)
- [ ] Build: 0 errors (backend + frontend)
- [ ] Lint: 0 warnings (backend + frontend)
- [ ] MCP Triplo executado e validado
- [ ] Documentação atualizada (ROADMAP.md mínimo)
- [ ] Git tree clean after commit+push
- [ ] ROADMAP.md: Fase marcada 100% completa

### Marcar Fase como Completa

```markdown
# ROADMAP.md

## FASE XX: [Nome] (Data)

**Status:** ✅ 100% Completo <-- Atualizar
**Data Conclusão:** YYYY-MM-DD <-- Adicionar
```

---

## ❌ ANTI-PATTERNS (NUNCA FAZER)

1. ❌ Implementar sem planejar (> 10 linhas)
2. ❌ Commitar com erros TypeScript
3. ❌ Commitar com build quebrado
4. ❌ Pular validações MCP
5. ❌ Múltiplos `in_progress` no TodoWrite
6. ❌ Avançar fase sem anterior completa
7. ❌ Documentar depois (sempre junto com código)
8. ❌ Push sem validação (usar `--no-verify`)

---

**Criado:** 2025-11-24  
**Sprint:** 3 - Memory Automation  
**Refs:** `.gemini/GEMINI.md`, `CHECKLIST_TODO_MASTER.md`
