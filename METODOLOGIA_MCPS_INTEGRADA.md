# Metodologia Claude Code + MCPs - Guia Integrado

**Data:** 2025-11-14
**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Responsável:** Claude Code (Sonnet 4.5)
**Versão:** 1.0
**Status:** ✅ COMPLETO

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Integração de MCPs na Metodologia](#integração-de-mcps-na-metodologia)
3. [Regras de Uso de MCPs (18-25)](#regras-de-uso-de-mcps-18-25)
4. [Ultra-Thinking com MCPs](#ultra-thinking-com-mcps)
5. [TodoWrite com MCPs](#todowrite-com-mcps)
6. [Validação com MCPs](#validação-com-mcps)
7. [Workflows Completos com MCPs](#workflows-completos-com-mcps)
8. [Anti-Patterns de MCPs](#anti-patterns-de-mcps)
9. [Decisão: Quando Usar Cada MCP](#decisão-quando-usar-cada-mcp)
10. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 VISÃO GERAL

Este documento integra os **8 MCPs instalados** com a **Metodologia Claude Code** (Ultra-Thinking + TodoWrite + Validação Contínua) existente no projeto, criando um workflow unificado e otimizado.

### Princípio Fundamental

> **MCPs são ferramentas de APOIO, não de SUBSTITUIÇÃO.**
> A metodologia Ultra-Thinking + TodoWrite continua sendo o core.
> MCPs aceleram execução, mas SEMPRE dentro das regras estabelecidas.

### MCPs Disponíveis

| MCP | Fase de Uso | Propósito na Metodologia |
|-----|-------------|--------------------------|
| **Sequential Thinking** | Ultra-Thinking | Análise profunda estruturada |
| **Filesystem** | Ultra-Thinking + Implementação | Leitura/escrita de arquivos |
| **Shell** | Validação + Implementação | Comandos build, test, git |
| **A11y** | Validação + QA | Auditoria WCAG automática |
| **Context7** | Ultra-Thinking | Consulta de docs atualizadas |
| **Playwright** | Validação + QA | Testes E2E automatizados |
| **Chrome DevTools** | Validação + Debugging | Inspeção de frontend |
| **Selenium** | Validação + QA | Testes cross-browser |

---

## 🔗 INTEGRAÇÃO DE MCPs NA METODOLOGIA

### Metodologia Expandida

```
┌──────────────────────────────────────────────────────────────┐
│                 METODOLOGIA CLAUDE + MCPs                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. ULTRA-THINKING         ┌──────────────────────┐          │
│     (Análise Profunda)     │  Sequential Thinking │ ◄─ MCP   │
│                            │  Filesystem (Read)   │ ◄─ MCP   │
│                            │  Context7            │ ◄─ MCP   │
│                            └──────────┬───────────┘          │
│                                       │                       │
│  2. TODOWRITE              ┌──────────▼───────────┐          │
│     (Organização)          │  Etapa 1 → ✅        │          │
│                            │  Etapa 2 → ✅        │          │
│                            │  Etapa 3 → ✅        │          │
│                            └──────────┬───────────┘          │
│                                       │                       │
│  3. IMPLEMENTAÇÃO          ┌──────────▼───────────┐          │
│     (Execução)             │  Filesystem (Write)  │ ◄─ MCP   │
│                            │  Shell (npm, git)    │ ◄─ MCP   │
│                            │  Código              │          │
│                            └──────────┬───────────┘          │
│                                       │                       │
│  4. VALIDAÇÃO              ┌──────────▼───────────┐          │
│     (QA Contínua)          │  Shell (tsc, build)  │ ◄─ MCP   │
│                            │  A11y (WCAG)         │ ◄─ MCP   │
│                            │  Playwright (E2E)    │ ◄─ MCP   │
│                            │  Chrome DevTools     │ ◄─ MCP   │
│                            └──────────┬───────────┘          │
│                                       │                       │
│  5. DOCUMENTAÇÃO           ┌──────────▼───────────┐          │
│     (Registro)             │  Filesystem (Write)  │ ◄─ MCP   │
│                            │  CLAUDE.md           │          │
│                            │  Commit detalhado    │          │
│                            └──────────────────────┘          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 REGRAS DE USO DE MCPs (18-25)

Extensão das **17 Regras de Ouro** existentes no CLAUDE.md.

### 18. ✅ SEMPRE usar Sequential Thinking para análise de problemas complexos (> 5 decisões)

**Quando:**
- Debugging de bugs com causa raiz não óbvia
- Planejamento de refatorações que afetam > 3 arquivos
- Análise de arquitetura e decisões técnicas
- Comparação de alternativas (bibliotecas, abordagens)

**Como:**
```typescript
// Exemplo: Debugging de bug complexo
sequential_thinking({
  thought: "Analisando por que análises duplicam ao clicar múltiplas vezes",
  thoughtNumber: 1,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

// Próximo passo
sequential_thinking({
  thought: "Identificado: falta estado isSubmitting para prevenir cliques múltiplos",
  thoughtNumber: 2,
  totalThoughts: 7,
  nextThoughtNeeded: true
})
```

**Anti-Pattern:**
- ❌ Usar Sequential Thinking para tarefas triviais (< 3 decisões)
- ❌ Não documentar conclusões do Sequential Thinking

### 19. ✅ SEMPRE usar Filesystem MCP para leitura/escrita de múltiplos arquivos

**Quando:**
- Ler > 3 arquivos relacionados durante Ultra-Thinking
- Buscar padrões no codebase (`search_files`)
- Criar documentação de validação (VALIDACAO_FASE_X.md)
- Editar arquivos com dry-run antes de aplicar

**Como:**
```typescript
// Leitura de múltiplos arquivos para análise
read_multiple_files({
  paths: [
    "backend/src/api/assets/assets.service.ts",
    "backend/src/api/assets/assets.controller.ts",
    "backend/src/api/assets/dto/create-asset.dto.ts"
  ]
})

// Busca de padrões
search_files({
  path: "backend/src",
  pattern: "*.dto.ts",
  excludePatterns: ["node_modules/**", "dist/**"]
})

// Edição com dry-run
edit_file({
  path: "frontend/src/components/Button.tsx",
  edits: [{
    oldText: "onClick()",
    newText: "onClick(e)"
  }],
  dryRun: true  // Pré-visualizar antes de aplicar
})
```

**Anti-Pattern:**
- ❌ Usar Filesystem para arquivos fora do workspace
- ❌ Editar sem dry-run em arquivos críticos
- ❌ Não validar TypeScript após edições

### 20. ✅ SEMPRE usar Shell MCP para validações obrigatórias (tsc, build)

**Quando:**
- Validar TypeScript antes de commitar
- Build de produção antes de commitar
- Executar testes automatizados
- Gerenciar Docker containers

**Como:**
```bash
# Validação TypeScript (OBRIGATÓRIO antes de commit)
shell_execute({
  command: "cd backend && npx tsc --noEmit",
  mode: "foreground"
})

# Build de produção
shell_execute({
  command: "cd frontend && npm run build",
  mode: "foreground"
})

# Docker status
shell_execute({
  command: "docker-compose ps"
})
```

**Anti-Pattern:**
- ❌ Commitar sem rodar `tsc --noEmit` via Shell MCP
- ❌ Executar comandos destrutivos sem confirmação

### 21. ✅ SEMPRE usar A11y MCP para validar acessibilidade em novas páginas

**Quando:**
- Após criar nova página frontend
- Após refatorar componentes UI principais
- Antes de deploy em produção
- Durante FASE de validação frontend

**Como:**
```typescript
// Auditar página específica (WCAG 2.1 AA)
audit_webpage({
  url: "http://localhost:3100/dashboard",
  tags: ["wcag21aa"],
  includeHtml: true
})

// Resumo rápido
get_summary({
  url: "http://localhost:3100/assets"
})
```

**Anti-Pattern:**
- ❌ Ignorar violações de acessibilidade
- ❌ Não auditar páginas principais
- ❌ Auditar apenas 1 resolução (mobile/desktop)

### 22. ✅ SEMPRE usar Context7 MCP para consultar docs antes de implementar novos patterns

**Quando:**
- Implementar feature com biblioteca não familiar
- Resolver erros de framework (Next.js, NestJS)
- Consultar APIs de bibliotecas (Shadcn/ui, React Query)
- Migrar versões de dependências

**Como:**
```
Solicitar:
"Context7: Como implementar React Query infinite scroll com TypeScript?"
"Context7: Next.js 14 App Router - dynamic route com params"
"Context7: NestJS - como criar custom decorator para autenticação"
```

**Anti-Pattern:**
- ❌ Confiar 100% em Context7 sem validar com docs oficiais
- ❌ Usar Context7 para decisões de arquitetura (use Sequential Thinking)

### 23. ✅ SEMPRE usar Playwright/Chrome DevTools MCP para validação de frontend

**Quando:**
- Validar FASE completa de frontend (12-21)
- Testar fluxos críticos (login, análise, portfólio)
- Capturar screenshots para documentação
- Validar WebSocket real-time

**Como:**
```typescript
// Playwright: Teste E2E de fluxo completo
// (via chamada ao MCP)

// Chrome DevTools: Validar console errors
// (via chamada ao MCP para inspecionar console)
```

**Anti-Pattern:**
- ❌ Não testar fluxos críticos antes de commit
- ❌ Ignorar console errors capturados pelos MCPs
- ❌ Não capturar screenshots de evidência

### 24. ✅ SEMPRE combinar Sequential Thinking + Filesystem para Ultra-Thinking

**Padrão Recomendado:**

```
1. Sequential Thinking: Planejar análise
   ↓
2. Filesystem: Ler arquivos identificados
   ↓
3. Sequential Thinking: Analisar impacto
   ↓
4. Filesystem: Buscar padrões similares
   ↓
5. Sequential Thinking: Decidir abordagem
```

**Exemplo Real:**
```typescript
// Etapa 1: Planejar
sequential_thinking({
  thought: "Preciso refatorar sistema de Reports. Primeiro identifico arquivos afetados.",
  thoughtNumber: 1,
  totalThoughts: 8
})

// Etapa 2: Ler arquivos
read_multiple_files({
  paths: [
    "frontend/src/app/(dashboard)/reports/page.tsx",
    "frontend/src/hooks/use-reports-assets.ts",
    "frontend/src/lib/api.ts"
  ]
})

// Etapa 3: Analisar
sequential_thinking({
  thought: "Arquivos lidos. Identifico que falta método requestCompleteAnalysis na API.",
  thoughtNumber: 2,
  totalThoughts: 8
})

// Continue o processo...
```

### 25. ❌ NUNCA usar MCPs para substituir Ultra-Thinking ou TodoWrite

**IMPORTANTE:**
- MCPs são **ferramentas de apoio**
- Ultra-Thinking + TodoWrite **continuam obrigatórios**
- MCPs **não eliminam necessidade de planejamento**

**Anti-Pattern:**
```typescript
// ❌ ERRADO: Pular planejamento e ir direto para Filesystem
"Refatorar Reports"
→ Filesystem: edit_file() diretamente
→ SEM Ultra-Thinking
→ SEM TodoWrite

// ✅ CORRETO: Planejamento primeiro
"Refatorar Reports"
→ Sequential Thinking: Planejar refatoração (8 etapas)
→ TodoWrite: Criar lista de 10 tarefas
→ Filesystem: Ler arquivos (durante execução)
→ Filesystem: Editar com dry-run
→ Shell: Validar TypeScript
→ Commit
```

---

## 🧠 ULTRA-THINKING COM MCPs

### Processo Expandido

**Passo 1: Leitura de Contexto (com Filesystem + Context7)**

```bash
1. Filesystem: read_multiple_files([arquivos relacionados])
2. Context7: Consultar docs de bibliotecas (se necessário)
3. Filesystem: search_files(padrões similares)
4. Sequential Thinking: Documentar descobertas
```

**Passo 2: Análise de Impacto (com Sequential Thinking)**

```typescript
1. Sequential Thinking: Iniciar análise
   thought: "Identificando arquivos afetados pela mudança X"

2. Filesystem: directory_tree() para ver estrutura

3. Sequential Thinking: Listar impactos
   thought: "Arquivos afetados: A, B, C. Dependências: D, E"

4. Sequential Thinking: Revisar se necessário
   isRevision: true
   revisesThought: 3
   thought: "Corrijo: Esqueci arquivo F que também importa módulo A"
```

**Passo 3: Planejamento (com Sequential Thinking + Filesystem)**

```typescript
1. Sequential Thinking: Propor solução
   thought: "Solução: Adicionar campo X ao DTO, atualizar service, criar migration"

2. Filesystem: read_text_file("docs/PADROES_PROJETO.md")
   // Verificar se solução segue padrões

3. Sequential Thinking: Validar contra padrões
   thought: "Solução valida com padrão Y documentado em linha Z"

4. Filesystem: write_file("PLANEJAMENTO_FEATURE_X.md", planejamento)
   // Documentar planejamento SE > 100 linhas
```

**Passo 4: Validação de Dependências (com Filesystem + Shell)**

```bash
# Filesystem: Buscar onde módulo é importado
search_files({
  path: "frontend/src",
  pattern: "import.*AssetService"
})

# Shell: Verificar tipos
shell_execute({
  command: "cd backend && npx tsc --noEmit"
})
```

### Decisão: Quando Usar Sequential Thinking

| Cenário | Usar Sequential Thinking? | Por quê |
|---------|---------------------------|---------|
| Bug simples (typo) | ❌ NÃO | Solução óbvia, < 3 decisões |
| Bug com causa desconhecida | ✅ SIM | Requer investigação estruturada |
| Feature nova (< 50 linhas) | ❌ NÃO | Escopo pequeno, planejamento direto |
| Feature nova (> 100 linhas) | ✅ SIM | Escopo grande, múltiplas decisões |
| Refatoração (1 arquivo) | ❌ NÃO | Impacto localizado |
| Refatoração (> 3 arquivos) | ✅ SIM | Impacto distribuído, alto risco |
| Decisão de arquitetura | ✅ SIM | Decisão crítica com longo impacto |
| Escolha de biblioteca | ✅ SIM | Comparação de alternativas |

---

## ✅ TODOWRITE COM MCPs

### Estrutura Padrão Expandida

**Feature Implementação com MCPs:**

```typescript
[
  // Ultra-Thinking
  {content: "1. [Sequential Thinking] Planejar feature", status: "pending", ...},
  {content: "2. [Filesystem] Ler arquivos relacionados", status: "pending", ...},
  {content: "3. [Context7] Consultar docs de biblioteca X", status: "pending", ...},
  {content: "4. [Sequential Thinking] Finalizar planejamento", status: "pending", ...},

  // Implementação
  {content: "5. Criar DTO/Interface", status: "pending", ...},
  {content: "6. Implementar Service/Hook", status: "pending", ...},
  {content: "7. Criar Controller/Component", status: "pending", ...},
  {content: "8. [Filesystem] Criar testes", status: "pending", ...},

  // Validação
  {content: "9. [Shell] Validar TypeScript (tsc --noEmit)", status: "pending", ...},
  {content: "10. [Shell] Build de produção", status: "pending", ...},
  {content: "11. [A11y] Auditar acessibilidade (se frontend)", status: "pending", ...},
  {content: "12. [Playwright] Testar fluxo E2E (se crítico)", status: "pending", ...},
  {content: "13. [Chrome DevTools] Validar console errors", status: "pending", ...},

  // Documentação
  {content: "14. [Filesystem] Atualizar CLAUDE.md", status: "pending", ...},
  {content: "15. [Shell] Criar commit", status: "pending", ...},
]
```

**Bug Fix com MCPs:**

```typescript
[
  // Investigação
  {content: "1. [Sequential Thinking] Analisar causa raiz", status: "pending", ...},
  {content: "2. [Filesystem] Ler arquivo afetado", status: "pending", ...},
  {content: "3. [Chrome DevTools] Validar erro no console", status: "pending", ...},
  {content: "4. [Sequential Thinking] Propor solução", status: "pending", ...},

  // Implementação
  {content: "5. [Filesystem] Implementar correção (dry-run)", status: "pending", ...},
  {content: "6. [Filesystem] Aplicar correção", status: "pending", ...},

  // Validação
  {content: "7. [Shell] Validar TypeScript", status: "pending", ...},
  {content: "8. [Shell] Build de produção", status: "pending", ...},
  {content: "9. [Chrome DevTools] Confirmar erro corrigido", status: "pending", ...},

  // Documentação
  {content: "10. [Filesystem] Atualizar CLAUDE.md", status: "pending", ...},
  {content: "11. [Shell] Criar commit", status: "pending", ...},
]
```

### Nomenclatura de Etapas com MCPs

**Formato:**
```
[MCP_USADO] Ação no imperativo
```

**Exemplos:**
- `[Sequential Thinking] Planejar refatoração`
- `[Filesystem] Ler arquivos relacionados`
- `[Shell] Validar TypeScript`
- `[A11y] Auditar página /dashboard`
- `[Playwright] Testar fluxo de login`

**Benefícios:**
- ✅ Rastreabilidade: Saber quais MCPs foram usados
- ✅ Reprodutibilidade: Repetir workflow em situações similares
- ✅ Documentação: Histórico de uso de MCPs por tarefa

---

## 🔍 VALIDAÇÃO COM MCPs

### Checklist Expandido (OBRIGATÓRIO)

```bash
# ========== VALIDAÇÕES CORE (SEMPRE) ==========

# 1. TypeScript (via Shell MCP)
[Shell] cd backend && npx tsc --noEmit
[Shell] cd frontend && npx tsc --noEmit
# Resultado esperado: 0 erros

# 2. Build (via Shell MCP)
[Shell] cd backend && npm run build
[Shell] cd frontend && npm run build
# Resultado esperado: Success

# 3. Git Status
git status
# Resultado esperado: Apenas arquivos intencionalmente modificados

# ========== VALIDAÇÕES FRONTEND (Quando Aplicável) ==========

# 4. Acessibilidade (via A11y MCP)
[A11y] audit_webpage({
  url: "http://localhost:3100/<página-modificada>",
  tags: ["wcag21aa"]
})
# Resultado esperado: 0 violações critical

# 5. Console Errors (via Chrome DevTools MCP)
[Chrome DevTools] Inspecionar console da página
# Resultado esperado: 0 errors, 0 warnings

# 6. Testes E2E (via Playwright MCP) - SE feature crítica
[Playwright] Testar fluxo completo
# Resultado esperado: All tests pass

# ========== VALIDAÇÕES DOCKER (Quando Aplicável) ==========

# 7. Containers Status (via Shell MCP)
[Shell] docker-compose ps
# Resultado esperado: All healthy

# 8. Logs (via Shell MCP)
[Shell] docker-compose logs --tail=50 backend frontend
# Resultado esperado: Sem erros recentes
```

### Validação Progressiva (Ordem de Execução)

```
1. TypeScript PRIMEIRO (bloqueia se falhar)
   ↓
2. Build SEGUNDO (bloqueia se falhar)
   ↓
3. Acessibilidade (warning se falhar)
   ↓
4. Console Errors (warning se falhar)
   ↓
5. E2E Tests (warning se falhar)
   ↓
6. Git Status (verificação manual)
   ↓
7. Commit (apenas se etapas 1-2 passaram)
```

**Regra de Ouro:**
> **NUNCA** commitar se TypeScript ou Build falharem.
> **SEMPRE** investigar warnings de Acessibilidade/Console.

---

## 🔄 WORKFLOWS COMPLETOS COM MCPs

### Workflow 1: Feature Implementation (Full Stack)

**Tarefa:** Adicionar campo `marketCap` a `AssetPrices`

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: Ultra-Thinking (com MCPs)                           │
├─────────────────────────────────────────────────────────────┤
│ 1. [Sequential Thinking] Iniciar análise                    │
│    thought: "Adicionar marketCap a AssetPrices. Analisar    │
│             impacto em backend (entity, DTO, service) e      │
│             frontend (hooks, components)"                    │
│                                                              │
│ 2. [Filesystem] Ler arquivos backend                        │
│    read_multiple_files([                                     │
│      "backend/src/database/entities/asset-price.entity.ts",  │
│      "backend/src/api/assets/dto/asset-price.dto.ts",        │
│      "backend/src/api/assets/assets.service.ts"             │
│    ])                                                        │
│                                                              │
│ 3. [Filesystem] Ler arquivos frontend                       │
│    read_multiple_files([                                     │
│      "frontend/src/types/asset.ts",                          │
│      "frontend/src/hooks/use-assets.ts",                     │
│      "frontend/src/app/(dashboard)/assets/page.tsx"         │
│    ])                                                        │
│                                                              │
│ 4. [Sequential Thinking] Analisar impacto                   │
│    thought: "Impacto identificado:                           │
│             Backend: 3 arquivos (entity, DTO, service)       │
│             Frontend: 3 arquivos (types, hook, component)    │
│             Migration: 1 arquivo novo                        │
│             Total: 7 arquivos afetados"                      │
│                                                              │
│ 5. [Sequential Thinking] Finalizar planejamento             │
│    thought: "Ordem de implementação:                         │
│             1. Migration → 2. Entity → 3. DTO →              │
│             4. Service → 5. Frontend Types →                 │
│             6. Hook → 7. Component"                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 2: TodoWrite                                            │
├─────────────────────────────────────────────────────────────┤
│ [                                                            │
│   {content: "1. Criar migration", status: "pending"},       │
│   {content: "2. Atualizar Entity", status: "pending"},      │
│   {content: "3. Atualizar DTO", status: "pending"},         │
│   {content: "4. Atualizar Service", status: "pending"},     │
│   {content: "5. Atualizar Types frontend", status: "pending"│
│   {content: "6. Atualizar Hook", status: "pending"},        │
│   {content: "7. Atualizar Component", status: "pending"},   │
│   {content: "8. [Shell] Validar TypeScript", status: "pend" │
│   {content: "9. [Shell] Build", status: "pending"},         │
│   {content: "10. [Shell] Commit", status: "pending"}        │
│ ]                                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Implementação (Sequencial)                          │
├─────────────────────────────────────────────────────────────┤
│ ✅ 1. Migration criada (15 linhas)                          │
│ ✅ 2. Entity atualizada (+2 linhas)                         │
│ ✅ 3. DTO atualizado (+3 linhas)                            │
│ ✅ 4. Service atualizado (+1 linha)                         │
│ ✅ 5. Types frontend atualizados (+2 linhas)                │
│ ✅ 6. Hook atualizado (+1 linha)                            │
│ ✅ 7. Component atualizado (+5 linhas)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 4: Validação (com MCPs)                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ 8. [Shell] TypeScript backend: 0 erros                   │
│     shell_execute({                                          │
│       command: "cd backend && npx tsc --noEmit"              │
│     })                                                       │
│                                                              │
│ ✅ 9. [Shell] TypeScript frontend: 0 erros                  │
│     shell_execute({                                          │
│       command: "cd frontend && npx tsc --noEmit"             │
│     })                                                       │
│                                                              │
│ ✅ 10. [Shell] Build backend: Success                       │
│     shell_execute({                                          │
│       command: "cd backend && npm run build"                 │
│     })                                                       │
│                                                              │
│ ✅ 11. [Shell] Build frontend: Success (17 páginas)         │
│     shell_execute({                                          │
│       command: "cd frontend && npm run build"                │
│     })                                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 5: Documentação & Commit                               │
├─────────────────────────────────────────────────────────────┤
│ ✅ 12. [Filesystem] Atualizar CLAUDE.md                     │
│     write_file("CLAUDE.md", conteúdo atualizado)             │
│                                                              │
│ ✅ 13. [Shell] Git commit                                   │
│     shell_execute({                                          │
│       command: "git add . && git commit -m '...'"            │
│     })                                                       │
└─────────────────────────────────────────────────────────────┘

Tempo Total: 35 minutos
Arquivos Modificados: 7
MCPs Usados: Sequential Thinking, Filesystem, Shell
```

### Workflow 2: Bug Fix (Frontend)

**Tarefa:** Corrigir bug de análises duplicadas

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: Investigação (com MCPs)                             │
├─────────────────────────────────────────────────────────────┤
│ 1. [Chrome DevTools] Inspecionar console                    │
│    → Confirmar: Múltiplas chamadas POST /analysis           │
│                                                              │
│ 2. [Sequential Thinking] Analisar causa raiz                │
│    thought: "Usuário clica múltiplas vezes em 'Solicitar    │
│             Análise'. Botão não desabilita. Cada clique      │
│             cria nova requisição."                           │
│    thought: "Causa raiz: Falta estado isSubmitting para     │
│             desabilitar botão durante requisição."           │
│                                                              │
│ 3. [Filesystem] Ler componente afetado                      │
│    read_text_file(                                           │
│      "frontend/src/components/analysis/new-analysis-dialog.tsx│
│    )                                                         │
│                                                              │
│ 4. [Sequential Thinking] Propor solução                     │
│    thought: "Solução: Adicionar estado isSubmitting,        │
│             desabilitar botão quando true, resetar no        │
│             finally. Trocar ícone Play por Loader2."         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 2: TodoWrite                                            │
├─────────────────────────────────────────────────────────────┤
│ [                                                            │
│   {content: "1. Adicionar estado isSubmitting", status: "pe"│
│   {content: "2. Importar Loader2", status: "pending"},      │
│   {content: "3. Adicionar disabled={isSubmitting}", "pend" │
│   {content: "4. Adicionar finally reset", status: "pending"│
│   {content: "5. Atualizar ícone Play → Loader2", "pending" │
│   {content: "6. [Shell] Validar TypeScript", status: "pend"│
│   {content: "7. [Shell] Build", status: "pending"},         │
│   {content: "8. [Chrome DevTools] Testar correção", "pend" │
│   {content: "9. [Filesystem] Atualizar CLAUDE.md", "pend" │
│   {content: "10. [Shell] Commit", status: "pending"}        │
│ ]                                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Implementação + Validação                           │
├─────────────────────────────────────────────────────────────┤
│ ✅ 1-5. Correção implementada (+18 linhas)                  │
│ ✅ 6. [Shell] TypeScript: 0 erros                           │
│ ✅ 7. [Shell] Build: Success                                │
│ ✅ 8. [Chrome DevTools] Testado: Botão desabilita ✅         │
│                        Apenas 1 POST enviado ✅              │
│ ✅ 9. [Filesystem] CLAUDE.md atualizado                     │
│ ✅ 10. [Shell] Commit criado                                │
└─────────────────────────────────────────────────────────────┘

Tempo Total: 25 minutos
MCPs Usados: Chrome DevTools, Sequential Thinking, Filesystem, Shell
Resultado: Bug corrigido, 0 regressões
```

### Workflow 3: Validação de Acessibilidade WCAG

**Tarefa:** Auditar todas as 7 páginas principais

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: Setup                                                │
├─────────────────────────────────────────────────────────────┤
│ 1. [Shell] Iniciar frontend                                 │
│    shell_execute({                                           │
│      command: "docker-compose up -d frontend"                │
│    })                                                        │
│                                                              │
│ 2. [Shell] Verificar health                                 │
│    shell_execute({                                           │
│      command: "docker-compose ps frontend"                   │
│    })                                                        │
│    → Resultado esperado: healthy                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 2: Auditoria (com A11y MCP)                            │
├─────────────────────────────────────────────────────────────┤
│ ✅ 1. [A11y] /dashboard                                     │
│    audit_webpage({                                           │
│      url: "http://localhost:3100/dashboard",                 │
│      tags: ["wcag21aa"]                                      │
│    })                                                        │
│    → 3 violações (color-contrast)                           │
│                                                              │
│ ✅ 2. [A11y] /assets                                        │
│    → 0 violações ✅                                         │
│                                                              │
│ ✅ 3. [A11y] /analysis                                      │
│    → 1 violação (missing aria-label)                        │
│                                                              │
│ ✅ 4. [A11y] /portfolio                                     │
│    → 0 violações ✅                                         │
│                                                              │
│ ✅ 5. [A11y] /reports                                       │
│    → 2 violações (button contrast)                          │
│                                                              │
│ ✅ 6. [A11y] /data-sources                                  │
│    → 0 violações ✅                                         │
│                                                              │
│ ✅ 7. [A11y] /settings                                      │
│    → 0 violações ✅                                         │
│                                                              │
│ RESUMO: 6 violações em 3 páginas                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Correções                                            │
├─────────────────────────────────────────────────────────────┤
│ 1. [Filesystem] Ler componentes com violações               │
│ 2. Corrigir contraste de cores (CSS)                        │
│ 3. Adicionar aria-labels faltantes                          │
│ 4. [Shell] Validar TypeScript                               │
│ 5. [Shell] Build                                             │
│ 6. [A11y] Re-auditar páginas corrigidas                     │
│    → 0 violações ✅                                         │
│ 7. [Shell] Commit                                            │
└─────────────────────────────────────────────────────────────┘

Tempo Total: 1h 15min
MCPs Usados: Shell, A11y, Filesystem
Páginas Auditadas: 7
Violações Corrigidas: 6
```

---

## ❌ ANTI-PATTERNS DE MCPs

### Anti-Pattern 1: Usar Sequential Thinking para Tudo

```typescript
// ❌ ERRADO: Usar Sequential Thinking para tarefa trivial
"Corrigir typo em comentário"
→ Sequential Thinking com 5 etapas

// ✅ CORRETO: Corrigir diretamente
"Corrigir typo"
→ Edit direto
→ Commit
```

### Anti-Pattern 2: Não Usar Dry-Run do Filesystem

```typescript
// ❌ ERRADO: Editar arquivo crítico sem pré-visualizar
edit_file({
  path: "backend/src/database/entities/user.entity.ts",
  edits: [...],
  dryRun: false  // Aplicar direto!
})

// ✅ CORRETO: Sempre dry-run primeiro em arquivos críticos
edit_file({
  path: "backend/src/database/entities/user.entity.ts",
  edits: [...],
  dryRun: true  // Pré-visualizar
})
// Revisar output
// Aplicar se OK
```

### Anti-Pattern 3: Commitar sem Shell MCP Validation

```typescript
// ❌ ERRADO: Commitar sem validar TypeScript via Shell
Filesystem: edit_file(...)
git add . && git commit

// ✅ CORRETO: SEMPRE validar antes
Filesystem: edit_file(...)
Shell: cd backend && npx tsc --noEmit  // 0 erros
Shell: cd frontend && npx tsc --noEmit  // 0 erros
Shell: npm run build  // Success
git add . && git commit
```

### Anti-Pattern 4: Ignorar Violações do A11y MCP

```typescript
// ❌ ERRADO: Auditar e ignorar violações
A11y: audit_webpage(...)
// Output: 5 violações critical
// Desenvolved or: "Deixa pra depois"
// Commit

// ✅ CORRETO: Corrigir violações críticas
A11y: audit_webpage(...)
// Output: 5 violações critical
// Corrigir TODAS as violações critical
// Re-auditar: 0 violações
// Commit
```

### Anti-Pattern 5: Não Combinar Sequential Thinking + Filesystem

```typescript
// ❌ ERRADO: Planejar sem ler código existente
Sequential Thinking: "Vou adicionar feature X assim..."
// (sem ler arquivos existentes)
// Implementa feature que quebra padrão existente

// ✅ CORRETO: Ler código antes de planejar
Filesystem: read_multiple_files([arquivos relacionados])
Sequential Thinking: "Analisando código existente..."
Sequential Thinking: "Identifico padrão Y. Feature X deve seguir padrão Y."
// Implementa seguindo padrão
```

### Anti-Pattern 6: Usar Context7 como Fonte Única

```typescript
// ❌ ERRADO: Confiar 100% em Context7
Context7: "Como usar React Query?"
// Implementa baseado APENAS na resposta
// Não valida com docs oficiais

// ✅ CORRETO: Context7 + Validação
Context7: "Como usar React Query?"
// Lê resposta
// Acessa docs oficiais: https://tanstack.com/query/latest
// Compara
// Implementa baseado em docs oficiais
```

### Anti-Pattern 7: Não Documentar Uso de MCPs

```typescript
// ❌ ERRADO: Usar MCPs sem documentar
Sequential Thinking: Planeja
Filesystem: Lê
Shell: Valida
// Commit sem mencionar MCPs usados

// ✅ CORRETO: Documentar MCPs no commit
**MCPs Utilizados:**
- Sequential Thinking: Análise de impacto (7 etapas)
- Filesystem: Leitura de 5 arquivos
- Shell: Validação TypeScript + Build
```

---

## 🎯 DECISÃO: QUANDO USAR CADA MCP

### Matriz de Decisão

| Situação | MCP Recomendado | Alternativa |
|----------|-----------------|-------------|
| Planejar refatoração complexa | Sequential Thinking | Documento .md |
| Ler 3+ arquivos | Filesystem (read_multiple) | Read tool individual |
| Buscar padrão no código | Filesystem (search_files) | Grep tool |
| Editar arquivo crítico | Filesystem (edit com dry-run) | Edit tool manual |
| Validar TypeScript | Shell MCP | Bash tool |
| Build de produção | Shell MCP | Bash tool |
| Auditar WCAG | A11y MCP | Inspeção manual |
| Consultar docs framework | Context7 MCP | Web search |
| Testar fluxo E2E | Playwright MCP | Testes manuais |
| Debugar frontend | Chrome DevTools MCP | Inspeção manual |
| Testes cross-browser | Selenium MCP | Testes manuais |

### Fluxograma de Decisão

```
Tarefa Recebida
│
├─ É análise/planejamento? (> 5 decisões)
│  ├─ SIM → Sequential Thinking MCP ✅
│  └─ NÃO → Continuar
│
├─ Precisa ler múltiplos arquivos? (> 3)
│  ├─ SIM → Filesystem MCP (read_multiple_files) ✅
│  └─ NÃO → Read tool individual
│
├─ Precisa buscar padrões no código?
│  ├─ SIM → Filesystem MCP (search_files) ✅
│  └─ NÃO → Continuar
│
├─ Precisa editar arquivos?
│  ├─ Críticos? → Filesystem MCP (dry-run) ✅
│  └─ Simples → Edit tool
│
├─ Precisa validar?
│  ├─ TypeScript/Build → Shell MCP ✅
│  ├─ Acessibilidade → A11y MCP ✅
│  ├─ Fluxo E2E → Playwright MCP ✅
│  └─ Console Errors → Chrome DevTools MCP ✅
│
└─ Precisa docs?
   └─ SIM → Context7 MCP ✅
```

---

## 📚 EXEMPLOS PRÁTICOS

### Exemplo 1: Adicionar Nova Página Frontend

**TodoWrite com MCPs:**

```typescript
[
  // Ultra-Thinking
  {content: "[Sequential Thinking] Planejar estrutura da página", status: "pending"},
  {content: "[Filesystem] Ler páginas similares (dashboard, assets)", status: "pending"},
  {content: "[Context7] Consultar Next.js 14 App Router patterns", status: "pending"},

  // Implementação
  {content: "Criar arquivo page.tsx", status: "pending"},
  {content: "Criar componentes específicos", status: "pending"},
  {content: "Criar hook customizado", status: "pending"},

  // Validação
  {content: "[Shell] Validar TypeScript", status: "pending"},
  {content: "[Shell] Build", status: "pending"},
  {content: "[A11y] Auditar nova página (WCAG 2.1 AA)", status: "pending"},
  {content: "[Chrome DevTools] Verificar console errors", status: "pending"},
  {content: "[Playwright] Testar navegação para nova página", status: "pending"},

  // Documentação
  {content: "[Filesystem] Atualizar CLAUDE.md", status: "pending"},
  {content: "[Shell] Commit", status: "pending"},
]
```

### Exemplo 2: Migrar Biblioteca

**TodoWrite com MCPs:**

```typescript
[
  // Pesquisa
  {content: "[Context7] Consultar migration guide da biblioteca", status: "pending"},
  {content: "[Sequential Thinking] Analisar breaking changes", status: "pending"},

  // Análise de Impacto
  {content: "[Filesystem] Buscar uso da biblioteca antiga (search_files)", status: "pending"},
  {content: "[Sequential Thinking] Listar arquivos afetados", status: "pending"},

  // Implementação
  {content: "Atualizar package.json", status: "pending"},
  {content: "Refatorar arquivo 1", status: "pending"},
  {content: "Refatorar arquivo 2", status: "pending"},
  // ...

  // Validação
  {content: "[Shell] npm install", status: "pending"},
  {content: "[Shell] Validar TypeScript", status: "pending"},
  {content: "[Shell] Build", status: "pending"},
  {content: "[Shell] Rodar testes", status: "pending"},
  {content: "[Playwright] Rodar testes E2E", status: "pending"},

  // Documentação
  {content: "[Filesystem] Criar MIGRACAO_BIBLIOTECA_X.md", status: "pending"},
  {content: "[Filesystem] Atualizar CLAUDE.md", status: "pending"},
  {content: "[Shell] Commit", status: "pending"},
]
```

---

## ✅ CHECKLIST FINAL DE USO DE MCPs

### Antes de Implementar

- [ ] Li a seção relevante de `MCPS_USAGE_GUIDE.md`?
- [ ] Identifiquei quais MCPs usar nesta tarefa?
- [ ] Planejei workflow com Sequential Thinking (se complexo)?
- [ ] Adicionei etapas de MCPs ao TodoWrite?

### Durante Implementação

- [ ] Usei Filesystem para leitura de múltiplos arquivos?
- [ ] Usei dry-run antes de edit em arquivos críticos?
- [ ] Documentei uso de Sequential Thinking?
- [ ] Consultei Context7 para bibliotecas não familiares?

### Durante Validação

- [ ] Usei Shell MCP para TypeScript validation?
- [ ] Usei Shell MCP para Build?
- [ ] Usei A11y MCP para acessibilidade (se frontend)?
- [ ] Usei Chrome DevTools para console errors (se frontend)?
- [ ] Usei Playwright para fluxos críticos (se aplicável)?

### Antes de Commit

- [ ] Todas as validações obrigatórias passaram?
- [ ] Documentei MCPs usados no commit message?
- [ ] Atualizei CLAUDE.md mencionando MCPs (se relevante)?

---

## 📝 RESUMO EXECUTIVO

### Princípios-Chave

1. **MCPs são APOIO, não SUBSTITUIÇÃO** da metodologia Ultra-Thinking + TodoWrite
2. **SEMPRE validar com Shell MCP** antes de commitar (TypeScript + Build)
3. **SEMPRE usar Sequential Thinking** para problemas complexos (> 5 decisões)
4. **SEMPRE auditar acessibilidade** em novas páginas (A11y MCP)
5. **SEMPRE documentar MCPs usados** em commits e TodoWrite

### MCPs por Fase

- **Ultra-Thinking:** Sequential Thinking, Filesystem (read), Context7
- **Implementação:** Filesystem (write/edit), Shell (npm install)
- **Validação:** Shell (tsc/build), A11y, Playwright, Chrome DevTools
- **Documentação:** Filesystem (write CLAUDE.md), Shell (git commit)

### Novas Regras (18-25)

18. ✅ Sequential Thinking para análise complexa (> 5 decisões)
19. ✅ Filesystem para leitura/escrita de múltiplos arquivos
20. ✅ Shell para validações obrigatórias (tsc, build)
21. ✅ A11y para validar acessibilidade em novas páginas
22. ✅ Context7 para consultar docs antes de novos patterns
23. ✅ Playwright/Chrome DevTools para validação de frontend
24. ✅ Combinar Sequential Thinking + Filesystem para Ultra-Thinking
25. ❌ NUNCA usar MCPs para substituir Ultra-Thinking/TodoWrite

---

**Última Atualização:** 2025-11-14
**Responsável:** Claude Code (Sonnet 4.5)
**Status:** ✅ COMPLETO - Metodologia Integrada com 8 MCPs

**Arquivo Complementar:** `MCPS_USAGE_GUIDE.md` (guia técnico de cada MCP)
**Arquivo Base:** `CLAUDE.md` (metodologia core do projeto)

---

**🎯 OBJETIVO FINAL:**
Maximizar qualidade e velocidade de desenvolvimento usando MCPs de forma disciplinada e integrada com as regras existentes do projeto, mantendo ZERO TOLERANCE para erros de TypeScript/Build e 100% de conformidade com a metodologia Ultra-Thinking + TodoWrite.
