---
description: Executa workflow de verificação de contexto completo antes de iniciar tarefa
---

# Skill: context-check

**Descrição:** Valida contexto completo do projeto antes de qualquer implementação

**Frequência de Uso:** 🔥 5-10x por dia (a cada nova tarefa)

**Tempo Economizado:** ~3 min → ~20 seg (**89% redução**)

---

## Objetivo

Executar o **Context Check Workflow** obrigatório antes de iniciar qualquer implementação, bugfix ou resposta técnica, prevenindo erros de contexto.

**Referência:** `.claude/workflows/context-check.md`

---

## Etapas de Validação

### 1. Estado do Projeto (Git)

```bash
# Ver branch atual, commits pendentes, working tree
git status
git log -3 --oneline
```

**Perguntas a Responder:**
- ✅ Qual branch estou? (main, feature/*, bugfix/*?)
- ✅ Há commits não pushados?
- ✅ Há mudanças não commitadas?
- ✅ O working tree está limpo?

**Resultado Esperado:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

---

### 2. Fase Atual do Projeto

**Ler:** `ROADMAP.md` (primeiras 100 linhas + buscar "Fases em Andamento")

**Perguntas a Responder:**
- ✅ Qual fase está em andamento? (Ex: FASE 60, 98.1% completo)
- ✅ Qual o objetivo da fase?
- ✅ Há bloqueadores documentados?

**Resultado Esperado:**
```
FASE ATUAL: FASE 60 - Validação E2E + Fixes API (98.1% completo)
Última fase concluída: FASE 59
Próxima fase planejada: FASE 61 (Sistema de Notificações)
```

---

### 3. Regras do Projeto

**Ler:** `CHECKLIST_TODO_MASTER.md` (seção "Princípios Fundamentais")

**Validar Conformidade:**
- [ ] Ultra-Thinking será aplicado? (se mudança > 50 linhas)
- [ ] Zero Tolerance será garantido? (0 erros TS/Build/Console)
- [ ] Documentação será atualizada? (no mesmo commit)
- [ ] Dados reais serão usados? (não mocks)
- [ ] Git será mantido atualizado? (working tree clean)

**Resultado Esperado:**
```
REGRAS CRÍTICAS LEMBRADAS:
1. Verdade dos Arquivos > Documentação (ler código real)
2. Zero Tolerance (0 erros TypeScript/Build/Console)
3. Git Sempre Atualizado (working tree clean)
4. Dados Reais > Mocks
5. Precisão de Dados Financeiros (Decimal, cross-validation)
```

---

### 4. Arquivos Técnicos Relevantes

**Baseado na tarefa, ler:**

- **Backend Task:** `ARCHITECTURE.md` → Estrutura NestJS
- **Frontend Task:** `ARCHITECTURE.md` → Estrutura Next.js
- **Database Task:** `DATABASE_SCHEMA.md` → Schema
- **Bug Task:** `TROUBLESHOOTING.md` → Problemas conhecidos

**Resultado Esperado:**
```
ARQUITETURA CONSULTADA:
- Stack: NestJS 11 + Next.js 14 + PostgreSQL 15 + Redis 7
- Backend: Controllers → Services → Repositories (TypeORM)
- Frontend: App Router + React Query + Shadcn/ui
- Database: 12 entities principais (Asset, AssetPrice, Analysis, etc)
```

---

### 5. Código Real (NÃO Assumir)

**Usar ferramentas para buscar código existente:**

- **Grep:** Buscar padrões (`grep -r "pattern"`)
- **Read:** Ler arquivos relacionados
- **Filesystem:** Explorar estrutura

**Regra de Ouro:**
> **SEMPRE verificar arquivos reais antes de implementar.**
> Documentação pode estar desatualizada.

**Resultado Esperado:**
```
CÓDIGO REAL CONSULTADO:
- backend/src/api/assets/assets.service.ts (lido)
- frontend/src/hooks/use-assets.ts (lido)
- Nenhuma divergência com documentação encontrada ✅
```

---

### 6. Validar Estado Atual

```bash
# TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build
cd frontend && npm run build
```

**Resultado Esperado:**
```
VALIDAÇÃO PRÉ-TAREFA:
✅ TypeScript Backend:  0 erros
✅ TypeScript Frontend: 0 erros
✅ Build Backend:       Success
✅ Build Frontend:      Success

Estado atual: LIMPO (pronto para nova tarefa)
```

---

### 7. Context7 Documentation Research (se aplicável) ⭐ NEW

**Executar SE a tarefa envolve:**
- ✅ Nova biblioteca/framework sendo integrada
- ✅ Feature complexa com biblioteca desconhecida
- ✅ Bug em biblioteca de terceiros (>1h debug sem solução)
- ✅ Atualização major version (breaking changes prováveis)

**Workflow Context7 (2 passos):**

#### 7.1. Identificar Biblioteca

Baseado na tarefa, determinar qual biblioteca precisa consultar:

**Exemplos:**
- Tarefa: "Adicionar autenticação JWT" → Biblioteca: `@nestjs/jwt` ou `jsonwebtoken`
- Tarefa: "Criar gráfico candlestick" → Biblioteca: `recharts` ou `lightweight-charts`
- Tarefa: "Implementar job queue" → Biblioteca: `bullmq`

#### 7.2. Resolver Library ID

```javascript
mcp__context7__resolve-library-id({
  libraryName: "NOME_DA_BIBLIOTECA",
  query: "Pergunta técnica completa do usuário"
})
```

**Output Esperado:**
```
✅ Selected Library ID: /org/project/version
Benchmark Score: 92 (higher = better docs)
Code Snippets: 856
Reputation: High
```

#### 7.3. Query Documentation

```javascript
mcp__context7__query-docs({
  libraryId: "/org/project",  // do passo anterior
  query: "Query específica sobre feature ou API"
})
```

**Queries Boas vs Ruins:**
- ❌ BAD: "authentication"
- ✅ GOOD: "How to implement JWT authentication with refresh tokens in NestJS"

**Output Esperado:**
```
📚 CONTEXT7 DOCS CONSULTADAS:
Library: recharts (/recharts/recharts)
Query: "Candlestick chart with OHLC data custom tooltip"
Snippets: 12 code examples found
Breaking changes: None (v2.x stable)
Pattern identified: ComposedChart + Candlestick component
```

#### 7.4. Quando Pular Esta Etapa

**PULE Context7 se:**
- ❌ Tarefa não envolve bibliotecas externas
- ❌ Biblioteca já bem conhecida (ex: React basics, TypeScript)
- ❌ Mudança trivial (ex: ajustar CSS, texto)
- ❌ Tarefa usa apenas código interno do projeto

**Regra de Ouro:**
> Se você está pensando "vou tentar e ver se funciona", **PARE** e use Context7 primeiro.

**Resultado Esperado (se aplicável):**
```
📚 CONTEXT7 RESEARCH:
✅ Biblioteca: recharts
✅ Library ID: /recharts/recharts
✅ Docs consultadas: 12 code snippets
✅ API identificada: ComposedChart + Candlestick
✅ Breaking changes: None
✅ Padrão a seguir: [código exemplo]

Pronto para implementar sem trial-and-error ✅
```

⚠️ **LIMITE:** Máximo 3 calls ao Context7 por conversa. Se ultrapassar, use WebSearch.

**Referência:** `.claude/skills/research-lib.md` - Workflow completo

---

## Resumo de Saída

### ✅ Context Check Completo

```
✅ CONTEXT CHECK COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 GIT STATUS:
  Branch: main
  Commits pendentes: 0
  Working tree: clean ✅

📊 FASE ATUAL:
  FASE 60 - Validação E2E + Fixes API (98.1%)
  Última concluída: FASE 59
  Próxima: FASE 61 (Sistema de Notificações)

📋 REGRAS CRÍTICAS:
  ✅ Verdade dos Arquivos > Documentação
  ✅ Zero Tolerance (0 erros)
  ✅ Git Sempre Atualizado
  ✅ Ultra-Thinking (se > 50 linhas)
  ✅ Dados Reais > Mocks

📁 ARQUITETURA:
  Stack: NestJS 11 + Next.js 14 + PostgreSQL 15
  Padrões: Controllers → Services → Repositories
  Frontend: App Router + React Query

🔍 CÓDIGO REAL:
  Arquivos consultados: 5
  Divergências: 0 ✅

✅ VALIDAÇÃO ATUAL:
  TypeScript: 0 erros ✅
  Build: Success ✅
  Estado: LIMPO ✅

📚 CONTEXT7 RESEARCH (se aplicável):
  Biblioteca: [nome ou N/A]
  Library ID: [/org/project ou N/A]
  Status: ✅ Docs consultadas | ⏭️ Não aplicável

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Contexto validado. Pronto para iniciar tarefa.
```

---

## Checklist Final

Antes de implementar QUALQUER mudança:

- [ ] Li ROADMAP.md (fase atual)?
- [ ] Verifiquei `git status` (estado limpo)?
- [ ] Li CHECKLIST_TODO_MASTER.md (regras)?
- [ ] Li arquivos técnicos relevantes?
- [ ] Busquei código real (não assumi)?
- [ ] Validei TypeScript (0 erros)?
- [ ] Validei Build (0 erros)?
- [ ] Consultei CHECKLIST_ECOSSISTEMA_COMPLETO.md (secao relevante)?
- [ ] Consultei Context7 docs? (se tarefa envolve biblioteca nova/desconhecida)

### Etapa 8: Checklist Ecossistema (Automatico)

O sistema de auto-trigger detecta keywords e sugere secoes relevantes:

- Se **dados financeiros**: verificar secao 3 (Decimal.js, cross-validation)
- Se **scrapers**: verificar secao 18 (BeautifulSoup pattern obrigatorio)
- Se **frontend**: verificar secoes 3.2 + 8.1 (18 paginas)
- Se **backend**: verificar secoes 3.1 + 8.2 (11 controllers)
- Se **database**: verificar secao 17 (26 entidades)
- Se **troubleshoot**: verificar secao 7 + KNOWN-ISSUES.md

**Referencia:** `CHECKLIST_ECOSSISTEMA_COMPLETO.md` (1144 linhas, 21 secoes)

---

## Quando Usar

- ✅ **Antes de TODA nova tarefa** (obrigatório)
- ✅ **Após retomar trabalho** (após pausa > 1h)
- ✅ **Antes de resposta técnica** (garantir contexto correto)
- ✅ **Quando em dúvida** (sempre melhor validar)

---

## Invocação

**Via Comando:**
```
Execute skill context-check
```

**Via Slash Command (se configurado):**
```
/check-context
```

**Via Hook Automático:**
O hook `pre-task.md` executa automaticamente este skill antes de toda tarefa.

---

## Anti-Patterns (NUNCA FAZER)

❌ Implementar sem ler contexto
❌ Assumir estrutura sem verificar código
❌ Oferecer solução genérica sem validar projeto
❌ Pular validações (TypeScript, Build, Lint)
❌ Commitar com erros
❌ Avançar fase sem completar anterior

**Referência:** `.claude/workflows/context-check.md` - Seção "Anti-Patterns"

---

## Tempo Estimado

- **Execução:** ~20-30 segundos
- **Antes (manual):** ~3 minutos

**Economia:** ⬆️ **89% de redução de tempo**

---

## Benefício

Previne **erros de contexto**, que são muito comuns segundo `CHECKLIST_TODO_MASTER.md`:
- Implementar baseado em documentação desatualizada
- Duplicar funcionalidade existente
- Quebrar código ao não verificar dependências
- Commitar em branch errada

**Este skill garante que você sempre tem o contexto completo antes de iniciar.**

---

**Versão:** 1.2.0
**Criado:** 2025-12-05
**Mantenedor:** Claude Code (Sonnet 4.5)
**Última Atualização:** 2026-01-04
**Baseado em:** `.claude/workflows/context-check.md` + `CHECKLIST_ECOSSISTEMA_COMPLETO.md` + Context7 MCP integration
