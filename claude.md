# Claude.md - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-14
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📚 DOCUMENTAÇÃO TÉCNICA

Este arquivo contém **APENAS** instruções e metodologia para Claude Code. Toda documentação técnica foi organizada em arquivos dedicados:

- **`INSTALL.md`** - Instalação completa, portas, serviços, variáveis de ambiente
- **`ARCHITECTURE.md`** - Arquitetura, stack tecnológica, estrutura de pastas, fluxos
- **`DATABASE_SCHEMA.md`** - Schema completo, relacionamentos, indexes, queries
- **`ROADMAP.md`** - Histórico de desenvolvimento (53 fases, 98.1% completo)
- **`TROUBLESHOOTING.md`** - 16+ problemas comuns com soluções detalhadas
- **`CONTRIBUTING.md`** - Convenções de código, Git workflow, decisões técnicas
- **`CHECKLIST_TODO_MASTER.md`** - Checklist ultra-robusto e TODO master (OBRIGATÓRIO antes de cada fase)

**📌 IMPORTANTE:** Sempre consulte os arquivos acima para detalhes técnicos do projeto. Este arquivo foca exclusivamente na metodologia de trabalho.

---

## 🎯 VISÃO GERAL DO PROJETO

Plataforma completa de análise de investimentos B3 com IA para análise fundamentalista, técnica, macroeconômica e gestão de portfólio.

**Princípios:**
- ✅ **Precisão**: Cross-validation de múltiplas fontes (mínimo 3)
- ✅ **Transparência**: Logs detalhados de todas as operações
- ✅ **Escalabilidade**: Arquitetura modular (NestJS + Next.js + PostgreSQL)
- ✅ **Manutenibilidade**: Código limpo, documentado e testado

**Stack Principal:**
- Backend: NestJS 10.x + TypeScript 5.x + PostgreSQL 16 + TypeORM
- Frontend: Next.js 14 App Router + Shadcn/ui + TailwindCSS
- Queue: BullMQ + Redis
- Scrapers: Python 3.11 + Playwright

---

## 🤖 METODOLOGIA CLAUDE CODE

### Visão Geral

**PADRÃO OBRIGATÓRIO** para todas as sessões: **Ultra-Thinking + TodoWrite + Validação Contínua**

```
┌────────────────────────────────────────────────┐
│           METODOLOGIA CLAUDE (4 PILARES)       │
├────────────────────────────────────────────────┤
│ 1. ULTRA-THINKING     → Análise profunda       │
│ 2. TODOWRITE          → Organização em etapas  │
│ 3. IMPLEMENTAÇÃO      → Execução com validação │
│ 4. DOCUMENTAÇÃO       → Registro detalhado     │
└────────────────────────────────────────────────┘
```

---

### 1. Ultra-Thinking (Análise Profunda)

**Quando Aplicar (OBRIGATÓRIO):**
- ✅ Features > 10 linhas
- ✅ Bugs complexos
- ✅ Refatorações
- ✅ Mudanças em arquivos críticos (entities, services, hooks)
- ✅ Mudanças que afetam múltiplos arquivos

**Processo:**
1. **Ler contexto**: Arquivo principal + tipos + dependências + testes
2. **Analisar impacto**: Identificar TODOS os arquivos afetados
3. **Planejar**: Criar documento se > 100 linhas de mudança
4. **Validar deps**: `tsc --noEmit` + `grep -r "importName"`
5. **Prevenir regressões**: Buscar padrões similares no codebase

---

### 2. TodoWrite (Organização)

**Regras:**
1. **Granularidade**: Etapas atômicas (não genéricas)
2. **Ordem Sequencial**: Lógica de execução
3. **Apenas 1 in_progress**: Foco em uma tarefa por vez
4. **Completar imediatamente**: Marcar `completed` assim que concluir

**Estrutura Padrão (Feature):**
```typescript
[
  {content: "1. Criar DTO/Interface", status: "pending", ...},
  {content: "2. Implementar Service/Hook", status: "pending", ...},
  {content: "3. Criar Controller/Component", status: "pending", ...},
  {content: "4. Validar TypeScript", status: "pending", ...},
  {content: "5. Build de produção", status: "pending", ...},
  {content: "6. Atualizar documentação", status: "pending", ...},
  {content: "7. Commit e push", status: "pending", ...},
]
```

---

### 3. Validação (Checklist Obrigatório)

**SEMPRE executar antes de commit:**

```bash
# TypeScript (0 erros obrigatório)
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build (se modificou código)
cd backend && npm run build   # Compiled successfully
cd frontend && npm run build  # 17 páginas compiladas

# Git Status (apenas arquivos intencionais)
git status
```

**Validações Adicionais (quando aplicável):**
- Testes: `npm run test`
- E2E: `npx playwright test`
- Lint: `npm run lint`
- Console: Abrir app e verificar 0 erros

---

### 4. Documentação

**Quando atualizar:**
- ✅ Após implementar feature
- ✅ Após corrigir bug crítico
- ✅ Após refatoração importante
- ✅ Após completar fase de projeto

**Onde atualizar:**
- Arquivo técnico relevante (ARCHITECTURE.md, ROADMAP.md, etc)
- Criar novo .md se mudança > 100 linhas
- Sempre incluir: problema, solução, arquivos afetados, validação, impacto

---

## 📋 REGRAS DE OURO (NÃO NEGOCIÁVEL)

**✅ SEMPRE:**
1. Ler contexto antes de implementar
2. Usar TodoWrite para tarefas ≥ 3 etapas
3. Validar TypeScript (0 erros) antes de commit
4. Validar Build (Success) antes de commit
5. Ter apenas 1 todo `in_progress` por vez
6. Marcar `completed` imediatamente após concluir
7. Atualizar documentação após implementação
8. Incluir `Co-Authored-By: Claude <noreply@anthropic.com>` em commits
9. Documentar decisões técnicas importantes
10. Criar arquivo específico quando mudança > 100 linhas
11. Validar arquivos reais (documentação pode estar desatualizada)
12. Verificar se precisa reiniciar serviços antes de testar

**❌ NUNCA:**
1. Implementar sem planejar (exceto < 5 linhas triviais)
2. Commitar com erros TypeScript
3. Commitar com build quebrado
4. Pular validações do checklist
5. Deixar múltiplos `in_progress` simultaneamente

---

## 🚫 ANTI-PATTERNS

```typescript
// ❌ ANTI-PATTERN 1: Implementar sem ler contexto
"Criar componente X" → IMPLEMENTA DIRETO

// ✅ CORRETO:
"Criar componente X" → LER arquivos → PLANEJAR → IMPLEMENTAR

// ❌ ANTI-PATTERN 2: TodoWrite genérico
[{content: "Fazer tudo", status: "in_progress"}]

// ✅ CORRETO:
[
  {content: "Etapa 1", status: "completed"},
  {content: "Etapa 2", status: "in_progress"},
  {content: "Etapa 3", status: "pending"},
]

// ❌ ANTI-PATTERN 3: Commitar sem validar
git commit -m "fix: algo" (sem tsc --noEmit)

// ✅ CORRETO:
npx tsc --noEmit → 0 erros → git commit
```

---

## 🎯 PADRÃO DE COMMITS (Conventional Commits)

```bash
<tipo>: <descrição curta (max 72 chars)>

<corpo detalhado:
- Problema identificado
- Solução implementada
- Arquivos modificados (+X/-Y linhas)
- Validações realizadas (checklist)>

**Arquivos Modificados:**
- arquivo1.ts (+X linhas)

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success

**Documentação:**
- ARQUIVO.md (criado/atualizado)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração (sem mudança de comportamento)
- `test`: Testes
- `chore`: Manutenção/config
- `perf`: Performance

---

## 📊 MÉTRICAS DE QUALIDADE (Zero Tolerance)

```
TypeScript Errors: 0 ✅
Build Errors: 0 ✅
Console Errors: 0 ✅ (páginas principais)
Lint Problems: 0 ✅ (critical)
Breaking Changes: 0 ✅ (sem aprovação)
Documentação: 100% ✅
Co-autoria em Commits: 100% ✅
```

---

## 🔗 REFERÊNCIAS RÁPIDAS

**Arquivos de Configuração:**
- `docker-compose.yml` - Orquestração de serviços
- `backend/tsconfig.json` - TypeScript config backend
- `frontend/tsconfig.json` - TypeScript config frontend
- `.gitignore` - Arquivos ignorados pelo Git

**Portas Principais:**
- Frontend: http://localhost:3100
- Backend: http://localhost:3101/api/v1
- PostgreSQL: localhost:5532
- Redis: localhost:6479

**Comandos Essenciais:**
```bash
# Docker
docker-compose up -d          # Iniciar todos os serviços
docker-compose down           # Parar todos os serviços
docker-compose logs -f <srv>  # Ver logs de serviço

# Validação
cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit

# Build
npm run build                 # Em backend/ ou frontend/

# Migrations
cd backend && npm run migration:run
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

**Guias Técnicos:**
- `MCPS_USAGE_GUIDE.md` - 8 MCPs instalados (Sequential Thinking, Filesystem, etc)
- `METODOLOGIA_MCPS_INTEGRADA.md` - Integração MCPs com metodologia
- `DOCUMENTACAO_SCRAPERS_COMPLETA.md` - 31 fontes de dados planejadas (6 implementadas)

**Validações de Fases:**
- `VALIDACAO_FRONTEND_COMPLETA.md` - 21 fases frontend (100% completo)
- `VALIDACAO_MCP_TRIPLO_COMPLETA.md` - Validação com 3 MCPs (Playwright + Chrome DevTools + Selenium)

**Planejamentos:**
- `REFATORACAO_SISTEMA_REPORTS.md` - Sistema de relatórios (6 fases)
- `ROADMAP_SISTEMA_ATUALIZACAO_ATIVOS.md` - Sistema de atualização

---

**Fim do claude.md**

> **Lembre-se:** Este arquivo é para **Claude Code**, não para usuários finais. Para documentação do projeto, veja `README.md` e os arquivos de documentação listados no início deste arquivo.
