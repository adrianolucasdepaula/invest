# PLANO DE MELHORIAS DO ECOSSISTEMA - B3 AI Analysis Platform

**Data:** 2025-12-05
**Versão:** 1.0
**Status:** 📋 PROPOSTA (Aguardando Aprovação)
**Responsável:** Claude Code (Sonnet 4.5)
**Prioridade:** 🔴 ALTA (Produtividade Imediata)
**Custo:** ✅ GRATUITO (Apenas ferramentas open-source)

---

## 📑 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Análise do Estado Atual](#análise-do-estado-atual)
3. [Propostas de Melhorias](#propostas-de-melhorias)
4. [Roadmap de Implementação](#roadmap-de-implementação)
5. [Critérios de Sucesso](#critérios-de-sucesso)
6. [Riscos e Mitigações](#riscos-e-mitigações)
7. [Aprovação e Próximos Passos](#aprovação-e-próximos-passos)

---

## 🎯 RESUMO EXECUTIVO

### Objetivo

Automatizar workflows manuais recorrentes, criar ferramentas de produtividade e expandir o ecossistema de desenvolvimento do projeto B3 AI Analysis Platform **sem engessar o processo de desenvolvimento ativo**.

### Contexto

Após mapeamento completo do ecossistema (11 MCPs ativos, 6 sub-agents, 220+ documentos, 219 dependências), identificamos **oportunidades críticas de automação** que podem aumentar a produtividade em **30-40%** sem adicionar complexidade desnecessária.

### Escopo

- ✅ **Skills**: 5 prioritários para automação de tarefas repetitivas
- ✅ **Comandos Slash**: 15 atalhos para workflows comuns
- ✅ **Sub-Agents**: 3 novos agentes especializados (dos 11 planejados)
- ✅ **Hooks Claude Code**: 3 automações críticas
- ✅ **Atualizações de Bibliotecas**: Sincronização e patches de segurança
- ✅ **Extensões VSCode**: Recomendações adicionais

### Restrições

- 🔒 **Apenas ferramentas gratuitas** (sem custos adicionais)
- 🔒 **Não engessar desenvolvimento** (automações flexíveis)
- 🔒 **Compatível com Zero Tolerance** (0 erros sempre)

---

## 📊 ANÁLISE DO ESTADO ATUAL

### Infraestrutura Existente

| Componente | Quantidade | Status |
|------------|------------|--------|
| **MCPs Ativos** | 11 | ✅ Funcionando (gemini-advisor, playwright, chrome-devtools, filesystem, etc) |
| **Sub-Agents** | 6 | ✅ Implementados (backend, frontend, charts, typescript, queue, scraper) |
| **Git Hooks (Husky)** | 3 | ✅ Ativos (pre-commit, commit-msg, pre-push) |
| **Workflows Claude** | 1 | ✅ context-check.md |
| **Skills Claude** | 0 | ❌ Nenhum implementado |
| **Comandos Slash Customizados** | 0 | ❌ Nenhum implementado |
| **Hooks Claude Code** | 0 | ❌ Nenhum implementado |
| **Documentação** | 220+ | ✅ Muito bem organizada |
| **Dependências** | 219 | ⚠️ Algumas desatualizadas (Playwright desincronizado) |
| **Scrapers** | 34 | ⚠️ 29 ativos, 5 aguardando fixes (24 aguardando migração Playwright) |

### Gaps Identificados

#### 🔴 **CRÍTICOS** (Impactam produtividade diária)

1. **Workflows manuais repetitivos** → Executados **10-20x por dia**
   - Validação completa (TypeScript + Build + Lint): **~5 min cada**
   - Context check: **~3 min cada**
   - Sincronização CLAUDE.md ↔ GEMINI.md: **~2 min cada**

2. **Nenhum skill ou comando slash** → **0% de automação** de tarefas comuns
   - Criar migration: **manual (5-7 passos)**
   - Atualizar ROADMAP.md: **manual (edição estruturada)**
   - Testar scraper: **manual (docker exec + logs)**

3. **Sub-agents faltantes para domínios críticos**
   - Database migrations (frequência: **alta**)
   - E2E testing (obrigatório via **MCP Triplo**)
   - Documentation (obrigatório em **toda fase**)

#### ⚠️ **IMPORTANTES** (Impactam qualidade)

4. **Bibliotecas desincronizadas**
   - Playwright: 1.56.0 (scrapers) vs 1.57.0 (backend/frontend)
   - FastAPI: 0.115.6 (scrapers) vs 0.122.0 (api-service)

5. **24 scrapers aguardando migração** Selenium → Playwright
   - Padrão standardizado já documentado (PLAYWRIGHT_SCRAPER_PATTERN.md)
   - Mas nenhum agente/skill automatizando migração

#### 💡 **DESEJÁVEIS** (Nice to have)

6. **Hooks Claude Code não configurados**
   - Context check manual (deveria ser automático)
   - Commit message template manual

7. **Extensões VSCode** poderiam ser expandidas
   - 110+ instaladas, mas apenas 8 recomendadas em `.vscode/extensions.json`

---

## 💡 PROPOSTAS DE MELHORIAS

### 1. Skills (Automação de Tarefas Repetitivas)

**Conceito:** Scripts executáveis que automatizam workflows completos.

#### 1.1. **validate-all** 🔴 ALTA PRIORIDADE

**Workflow manual atual:**
```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
cd backend && npm run build
cd frontend && npm run build
cd frontend && npm run lint
git status
```

**Frequência:** 10-20x por dia (antes de cada commit)
**Tempo economizado:** ~5 min → ~30 seg (**90% redução**)
**Impacto:** 🔥 MUITO ALTO (Zero Tolerance obrigatório)

**Implementação:**
```markdown
<!-- .claude/skills/validate-all.md -->
# Skill: validate-all

Executa validação completa do projeto (TypeScript + Build + Lint).

## Passos:
1. Validar TypeScript backend (npx tsc --noEmit)
2. Validar TypeScript frontend (npx tsc --noEmit)
3. Build backend (npm run build)
4. Build frontend (npm run build)
5. Lint frontend (npm run lint)
6. Mostrar resumo: ✅ All checks passed ou ❌ X errors found

## Resultado:
- Se 0 erros → "✅ Projeto validado. Pronto para commit."
- Se erros → "❌ X erros encontrados. Corrija antes de commitar."
```

---

#### 1.2. **context-check** 🔴 ALTA PRIORIDADE

**Workflow manual atual:**
```bash
git status
git log -3 --oneline
# Ler ROADMAP.md (primeiras 100 linhas)
# Ler CHECKLIST_TODO_MASTER.md
# Validar TypeScript/Build
```

**Frequência:** A cada nova tarefa (~5-10x por dia)
**Tempo economizado:** ~3 min → ~20 seg (**89% redução**)
**Impacto:** 🔥 MUITO ALTO (Previne erros de contexto)

**Implementação:**
```markdown
<!-- .claude/skills/context-check.md -->
# Skill: context-check

Executa workflow de verificação de contexto completo.

## Passos:
1. Git status (branch, commits pendentes, working tree limpo?)
2. Git log -3 (últimos commits)
3. Ler ROADMAP.md (fase atual)
4. Ler CHECKLIST_TODO_MASTER.md (regras do projeto)
5. Validar TypeScript/Build (0 erros?)
6. Resumo do contexto

## Resultado:
- Branch atual: main
- Fase atual: FASE 60 (98.1% completo)
- Última validação: ✅ 0 erros TypeScript/Build
- Regras lembradas: Zero Tolerance, Ultra-Thinking, TodoWrite
```

---

#### 1.3. **sync-docs** 🔴 ALTA PRIORIDADE

**Workflow manual atual:**
```bash
# Comparar CLAUDE.md vs GEMINI.md
# Se divergir → copiar CLAUDE.md → GEMINI.md
```

**Frequência:** A cada mudança em CLAUDE.md (~2-3x por semana)
**Tempo economizado:** ~2 min → ~5 seg (**96% redução**)
**Impacto:** 🔥 ALTO (Regra explícita de sincronização 100%)

**Implementação:**
```markdown
<!-- .claude/skills/sync-docs.md -->
# Skill: sync-docs

Sincroniza CLAUDE.md ↔ GEMINI.md (regra de sincronização 100%).

## Passos:
1. Ler CLAUDE.md
2. Ler GEMINI.md
3. Se idênticos → "✅ Já sincronizados"
4. Se divergirem → Copiar CLAUDE.md → GEMINI.md
5. Confirmar: "✅ GEMINI.md atualizado (100% sincronizado)"

## Regra:
CLAUDE.md e GEMINI.md DEVEM estar 100% idênticos sempre.
```

---

#### 1.4. **create-migration** ⚠️ MÉDIA PRIORIDADE

**Workflow manual atual:**
```bash
cd backend
npm run migration:generate -- -n MigrationName
npm run migration:run
git add src/database/migrations/*
```

**Frequência:** A cada mudança de entity (~3-5x por semana)
**Tempo economizado:** ~3 min → ~15 seg (**92% redução**)
**Impacto:** 🟡 MÉDIO (Frequente em desenvolvimento)

**Implementação:**
```markdown
<!-- .claude/skills/create-migration.md -->
# Skill: create-migration

Cria migration TypeORM automaticamente.

## Parâmetros:
- `name`: Nome da migration (ex: AddMarketCapToAssetPrices)

## Passos:
1. cd backend
2. npm run migration:generate -- -n {name}
3. Verificar se migration foi criada
4. npm run migration:run
5. Verificar logs (sucesso ou erro)
6. git add src/database/migrations/*
7. Confirmar: "✅ Migration {name} criada e aplicada"

## Exemplo:
/create-migration AddMarketCapToAssetPrices
```

---

#### 1.5. **update-roadmap** ⚠️ MÉDIA PRIORIDADE

**Workflow manual atual:**
```bash
# Editar ROADMAP.md (adicionar fase concluída)
# Atualizar % completude
# Atualizar CHANGELOG.md
```

**Frequência:** Fim de cada fase (~1-2x por semana)
**Tempo economizado:** ~5 min → ~30 seg (**90% redução**)
**Impacto:** 🟡 MÉDIO (Rastreabilidade)

**Implementação:**
```markdown
<!-- .claude/skills/update-roadmap.md -->
# Skill: update-roadmap

Atualiza ROADMAP.md com fase concluída.

## Parâmetros:
- `phase`: Número da fase (ex: 61)
- `title`: Título da fase (ex: Sistema de Notificações)

## Passos:
1. Ler ROADMAP.md
2. Adicionar fase {phase} como ✅ COMPLETA
3. Atualizar % completude
4. Adicionar linha em CHANGELOG.md
5. Confirmar: "✅ ROADMAP.md atualizado (FASE {phase})"

## Exemplo:
/update-roadmap phase=61 title="Sistema de Notificações"
```

---

### 2. Comandos Slash Customizados

**Conceito:** Atalhos que expandem prompts pré-definidos (mais leves que skills).

#### 2.1. **Alta Prioridade** (Uso diário)

| Comando | Propósito | Frequência | Implementação |
|---------|-----------|------------|---------------|
| `/validate-all` | Valida TypeScript + Build + Lint | 🔥 10-20x/dia | Expande para skill validate-all |
| `/check-context` | Executa context-check workflow | 🔥 5-10x/dia | Expande para skill context-check |
| `/sync-docs` | Sincroniza CLAUDE.md ↔ GEMINI.md | 🔥 2-3x/semana | Expande para skill sync-docs |
| `/create-migration <name>` | Cria migration TypeORM | 🟡 3-5x/semana | Expande para skill create-migration |
| `/update-roadmap` | Atualiza ROADMAP.md | 🟡 1-2x/semana | Expande para skill update-roadmap |

#### 2.2. **Média Prioridade** (Uso semanal)

| Comando | Propósito | Frequência | Implementação |
|---------|-----------|------------|---------------|
| `/test-scraper <name>` | Testa scraper Python | 🟡 5-10x/semana | docker exec + logs |
| `/create-component <name>` | Cria componente React | 🟡 2-3x/semana | Template Shadcn/ui |
| `/validate-frontend <page>` | MCP Triplo (Playwright + DevTools) | 🟡 1-2x/semana | Workflow MCP |
| `/restart <service>` | Reinicia serviço Docker | 🟡 3-5x/semana | docker-compose restart |
| `/fix-zero-tolerance` | Corrige erros TS/Build/Lint | 🟡 1-2x/semana | Análise + correção |

#### 2.3. **Baixa Prioridade** (Nice to have)

| Comando | Propósito | Frequência | Implementação |
|---------|-----------|------------|---------------|
| `/create-phase-doc <n>` | Cria PLANO_FASE_XX.md | 🔵 1x/fase | Template IMPLEMENTATION_PLAN.md |
| `/commit-template` | Gera template commit | 🔵 Ocasional | Template obrigatório |
| `/analyze-deps` | npm outdated | 🔵 Mensal | npm outdated + Context7 |
| `/audit-a11y <page>` | Auditoria WCAG | 🔵 Ocasional | A11y MCP |
| `/search-code <pattern>` | Busca padrão codebase | 🔵 Ocasional | Filesystem search_files |

---

### 3. Novos Sub-Agents Especializados

**Conceito:** Agentes autônomos com expertise em domínio específico.

#### 3.1. **Database Migration Expert** 🔴 ALTA PRIORIDADE

**Especialização:**
- TypeORM migrations (generate, run, revert)
- Schema design (relationships, indexes)
- Data migrations (transformações)

**Ferramentas:** Read, Edit, Write, Bash

**Quando Usar:**
- Criar/modificar entities
- Gerar migrations
- Resolver conflitos de migration
- Otimizar schema (indexes, constraints)

**Frequência:** 🔥 Alta (3-5x por semana)
**Impacto:** 🔥 Alto (evita erros em migrations)

**Arquivo:** `.claude/agents/database-migration-expert.md`

**Prompt Template:**
```markdown
# Database Migration Expert

Especialista em TypeORM migrations, schema design e otimizações de database.

## Especialização:
- TypeORM 0.3.x (migrations, entities, repositories)
- PostgreSQL 15 + TimescaleDB
- Schema design (1:1, 1:N, N:N relationships)
- Performance (indexes, constraints, partitioning)

## Ferramentas: Read, Edit, Write, Bash

## Quando Usar:
- Criar/modificar entities TypeORM
- Gerar migrations (migration:generate)
- Executar/reverter migrations
- Resolver conflitos de schema
- Otimizar queries (explain analyze)
- Adicionar indexes/constraints

## Workflow:
1. Analisar entity atual (Read)
2. Propor mudanças (Edit com dry-run)
3. Gerar migration (Bash: npm run migration:generate)
4. Revisar migration gerada (Read)
5. Executar migration (Bash: npm run migration:run)
6. Validar schema (Bash: psql queries)
7. Commit migration

## Zero Tolerance:
- ✅ Migration testada localmente
- ✅ Rollback plan documentado
- ✅ Breaking changes identificados
- ✅ Data loss prevented
```

---

#### 3.2. **E2E Testing Expert** 🔴 ALTA PRIORIDADE

**Especialização:**
- Playwright E2E tests
- Chrome DevTools (console, network, performance)
- MCP Triplo (Playwright + DevTools + React DevTools)
- Assertions e validações

**Ferramentas:** Read, Edit, Write, Bash, Playwright MCP, Chrome DevTools MCP

**Quando Usar:**
- Criar testes E2E para novas páginas
- Validar fluxos críticos (login, análise, portfólio)
- Executar MCP Triplo (obrigatório em fases frontend)
- Debugar testes falhando

**Frequência:** 🔥 Alta (validação obrigatória de fases)
**Impacto:** 🔥 Muito Alto (MCP Triplo obrigatório)

**Arquivo:** `.claude/agents/e2e-testing-expert.md`

**Prompt Template:**
```markdown
# E2E Testing Expert

Especialista em testes E2E com Playwright, validação de frontend e MCP Triplo.

## Especialização:
- Playwright 1.57.0 (E2E testing)
- Chrome DevTools (console errors, network, performance)
- MCP Triplo (Playwright + DevTools + React DevTools)
- WCAG 2.1 AA (acessibilidade)

## Ferramentas: Read, Edit, Write, Bash, mcp__playwright__*, mcp__chrome-devtools__*

## Quando Usar:
- Validar nova página frontend (MCP Triplo obrigatório)
- Criar testes E2E para fluxos críticos
- Debugar testes Playwright falhando
- Validar console errors (0 erros obrigatório)
- Capturar screenshots de evidência

## Workflow MCP Triplo:
1. **Playwright MCP:**
   - browser_navigate(url)
   - browser_snapshot() (a11y tree)
   - browser_click() (testar interações)
   - browser_network_requests() (validar APIs)
   - browser_take_screenshot() (evidência)

2. **Chrome DevTools MCP:**
   - take_snapshot() (accessibility)
   - list_console_messages() (0 erros obrigatório)
   - list_network_requests() (validar payloads)
   - take_screenshot() (evidência)

3. **Documentar:**
   - Criar VALIDACAO_FASE_XX.md
   - Screenshots em validations/FASE_XX/
   - Resumo: ✅ 0 erros console, ✅ 0 violações a11y

## Zero Tolerance:
- ✅ Console: 0 erros
- ✅ Acessibilidade: 0 violações critical
- ✅ Network: Todos requests 200 OK
- ✅ Screenshots capturados
```

---

#### 3.3. **Documentation Expert** 🔴 ALTA PRIORIDADE

**Especialização:**
- Templates (PLANO_FASE_XX.md, VALIDACAO_XX.md)
- ROADMAP.md, CHANGELOG.md
- Sincronização CLAUDE.md ↔ GEMINI.md
- Manter INDEX.md atualizado

**Ferramentas:** Read, Edit, Write, Filesystem

**Quando Usar:**
- Criar documentação de planejamento de fase
- Criar documentação de validação de fase
- Atualizar ROADMAP.md/CHANGELOG.md
- Sincronizar CLAUDE.md ↔ GEMINI.md
- Atualizar INDEX.md

**Frequência:** 🔥 Muito Alta (toda fase requer docs)
**Impacto:** 🔥 Alto (rastreabilidade)

**Arquivo:** `.claude/agents/documentation-expert.md`

**Prompt Template:**
```markdown
# Documentation Expert

Especialista em documentação técnica, templates e organização de conhecimento.

## Especialização:
- Templates (PLANO_FASE_XX.md, VALIDACAO_XX.md, BUGFIX_XX.md)
- ROADMAP.md, CHANGELOG.md, INDEX.md
- CLAUDE.md ↔ GEMINI.md (sincronização 100%)
- Markdown formatting (GitHub-flavored)

## Ferramentas: Read, Edit, Write, Filesystem

## Quando Usar:
- Criar PLANO_FASE_XX.md (antes de implementar fase)
- Criar VALIDACAO_FASE_XX.md (após concluir fase)
- Atualizar ROADMAP.md (fase concluída)
- Atualizar CHANGELOG.md (mudanças notáveis)
- Sincronizar CLAUDE.md ↔ GEMINI.md (após edição)
- Atualizar INDEX.md (novos arquivos)

## Templates Disponíveis:
- IMPLEMENTATION_PLAN.md (template de planejamento)
- VALIDACAO_FASE_XX.md (template de validação)
- BUGFIX_XX.md (template de bugfix)

## Workflow Sincronização CLAUDE.md:
1. Detectar edição em CLAUDE.md
2. Ler CLAUDE.md
3. Copiar para GEMINI.md (100% idêntico)
4. Confirmar: "✅ GEMINI.md sincronizado"

## Zero Tolerance:
- ✅ CLAUDE.md e GEMINI.md 100% idênticos
- ✅ ROADMAP.md sempre atualizado
- ✅ INDEX.md reflete todos arquivos
- ✅ Templates seguidos corretamente
```

---

#### 3.4. **OAuth Session Expert** ⚠️ MÉDIA PRIORIDADE

**Especialização:**
- Google OAuth 2.0
- Cookie management (Playwright)
- Session renewal
- Destravar 6 scrapers OAuth

**Ferramentas:** Read, Edit, Write, Bash

**Quando Usar:**
- Renovar sessões OAuth expiradas
- Debugar scrapers OAuth (fundamentei, chatgpt, gemini, etc)
- Implementar novos scrapers OAuth

**Frequência:** 🟡 Média (6 scrapers aguardando fix)
**Impacto:** 🟡 Alto (destravar scrapers)

**Arquivo:** `.claude/agents/oauth-session-expert.md`

---

#### 3.5. **Cross-Validation Expert** ⚠️ MÉDIA PRIORIDADE

**Especialização:**
- Comparar dados de 6 fontes
- Detectar outliers (threshold 10%)
- Consolidar valores (mediana vs média)
- Precisão financeira (Decimal, não Float)

**Ferramentas:** Read, Edit, Write

**Quando Usar:**
- Validar dados financeiros (preços, dividendos, indicadores)
- Implementar novos scrapers (cross-validation obrigatória)
- Debugar divergências entre fontes

**Frequência:** 🟡 Média (análise de dados financeiros)
**Impacto:** 🟡 Alto (precisão financeira obrigatória)

**Arquivo:** `.claude/agents/cross-validation-expert.md`

---

### 4. Hooks Claude Code

**Conceito:** Eventos automáticos que disparam em momentos específicos do workflow.

#### 4.1. **pre-task** 🔴 ALTA PRIORIDADE

**Gatilho:** Usuário fornece nova tarefa

**Ação:** Executar context-check workflow automaticamente

**Conteúdo:**
```markdown
<!-- .claude/hooks/pre-task.md -->
Antes de iniciar esta tarefa, vou executar o context-check workflow obrigatório:

1. ✅ Verificar git status (branch, commits pendentes, working tree limpo?)
2. ✅ Ler ROADMAP.md (qual fase atual?)
3. ✅ Ler CHECKLIST_TODO_MASTER.md (regras do projeto)
4. ✅ Validar TypeScript/Build atual (0 erros?)
5. ✅ Identificar arquivos relevantes para esta tarefa

Aguarde enquanto valido o contexto completo...
```

**Benefício:** Previne erros de contexto (muito comum segundo CHECKLIST)

**Implementação:** `.claude/hooks/pre-task.md`

---

#### 4.2. **post-file-edit (CLAUDE.md)** 🔴 ALTA PRIORIDADE

**Gatilho:** Claude modifica CLAUDE.md

**Ação:** Automaticamente sincronizar com GEMINI.md

**Conteúdo:**
```markdown
<!-- .claude/hooks/post-file-edit.md -->
Detectei modificação em CLAUDE.md.

REGRA CRÍTICA: CLAUDE.md e GEMINI.md devem estar 100% sincronizados.

Vou copiar CLAUDE.md → GEMINI.md automaticamente...

✅ GEMINI.md atualizado (100% sincronizado)
```

**Benefício:** Garante sincronização (regra explícita)

**Implementação:** `.claude/hooks/post-file-edit.md`

---

#### 4.3. **pre-commit-msg** 🔴 ALTA PRIORIDADE

**Gatilho:** Claude vai criar commit

**Ação:** Gerar template de commit detalhado automaticamente

**Conteúdo:**
```markdown
<!-- .claude/hooks/pre-commit-msg.md -->
Vou gerar commit message seguindo o template obrigatório:

<tipo>(<escopo>): <descrição curta max 72 chars>

**Problema:**
[Identificado automaticamente baseado na tarefa]

**Solução:**
[Implementação realizada]

**Arquivos Modificados:**
[Lista de arquivos com +X/-Y linhas]

**Validação:**
- ✅ TypeScript: 0 erros (backend + frontend)
- ✅ Build: Success (ambos)
- ✅ Console: 0 erros

**Documentação:**
- ARQUIVO.md (criado/atualizado)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Benefício:** Commits sempre completos e rastreáveis

**Implementação:** `.claude/hooks/pre-commit-msg.md`

---

#### 4.4. **pre-phase-complete** ⚠️ MÉDIA PRIORIDADE

**Gatilho:** Claude vai marcar fase como 100% completa

**Ação:** Executar checklist de validação obrigatória

**Conteúdo:**
```markdown
<!-- .claude/hooks/pre-phase-complete.md -->
Antes de marcar fase como 100% completa, vou validar:

CHECKLIST OBRIGATÓRIO:
- [ ] TypeScript: 0 erros (backend + frontend)?
- [ ] Build: Success (ambos)?
- [ ] Console: 0 erros (páginas principais)?
- [ ] MCP Triplo executado (se frontend)?
- [ ] Documentação criada (VALIDACAO_FASE_XX.md)?
- [ ] ROADMAP.md atualizado?
- [ ] Git: working tree clean?
- [ ] Commit criado com Co-Authored-By?

Validando...
```

**Benefício:** Garante Zero Tolerance antes de concluir fase

**Implementação:** `.claude/hooks/pre-phase-complete.md`

---

#### 4.5. **post-implementation** ⚠️ MÉDIA PRIORIDADE

**Gatilho:** Claude termina implementação

**Ação:** Sugerir criação de VALIDACAO_FASE_XX.md

**Conteúdo:**
```markdown
<!-- .claude/hooks/post-implementation.md -->
Implementação concluída! Agora vou:

1. ✅ Executar validação completa (TypeScript + Build + Lint)
2. ✅ Sugerir testes E2E se funcionalidade frontend
3. ✅ Sugerir criação de VALIDACAO_FASE_XX.md para documentar

Deseja que eu crie o arquivo de validação?
```

**Benefício:** Garante documentação de todas as fases

**Implementação:** `.claude/hooks/post-implementation.md`

---

### 5. Atualizações de Bibliotecas

#### 5.1. **Bibliotecas Desincronizadas (CRÍTICO)**

| Biblioteca | Backend/Frontend | Scrapers/Services | Ação |
|------------|------------------|-------------------|------|
| **Playwright** | 1.57.0 | 1.56.0 (scrapers) | ⬆️ Atualizar scrapers → 1.57.0 |
| **FastAPI** | - | 0.122.0 (api-service) vs 0.115.6 (scrapers) | ⬆️ Sincronizar → 0.122.0 |

**Impacto:** 🔥 Alto (inconsistência pode causar bugs)

**Comando:**
```bash
# Scrapers
cd backend/python-scrapers
pip install --upgrade playwright==1.57.0

# Scrapers (FastAPI)
pip install --upgrade fastapi==0.122.0
```

---

#### 5.2. **Verificar Atualizações (Mensal)**

**Processo:**
```bash
# Backend
cd backend && npm outdated

# Frontend
cd frontend && npm outdated

# Python
cd backend/python-scrapers && pip list --outdated
cd backend/api-service && pip list --outdated
cd backend/python-service && pip list --outdated
```

**Consultar Context7 MCP** para breaking changes antes de atualizar major versions.

---

#### 5.3. **Vulnerabilidades de Segurança (Emergencial)**

**Comando:**
```bash
# Backend
cd backend && npm audit
npm audit fix

# Frontend
cd frontend && npm audit
npm audit fix

# Python
cd backend/python-scrapers && pip-audit
```

**Ação:** Se CVE crítico → atualizar **imediatamente** (< 24h)

---

### 6. Extensões VSCode Recomendadas

#### 6.1. **Adicionar ao `.vscode/extensions.json`**

**Atualmente:** 8 extensões recomendadas
**Proposta:** Adicionar **5 extensões críticas** faltantes

```json
{
  "recommendations": [
    // Existentes
    "Continue.continue",
    "RooVeterinaryInc.roo-cline",
    "ms-playwright.playwright",
    "GitHub.copilot",
    "GitHub.copilot-chat",
    "MS-vsliveshare.vsliveshare",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",

    // NOVOS (Alta Prioridade)
    "usernamehw.errorlens",           // Mostrar erros inline (MUITO útil)
    "eamodio.gitlens",                // Git supercharged (já instalada, faltava recomendar)
    "alefragnani.bookmarks",          // Bookmarks em código (navegação)
    "gruntfuggly.todo-tree",          // Visualizar TODOs no projeto
    "cweijan.dbclient-jdbc"           // Database client (PostgreSQL GUI)
  ]
}
```

**Benefício:** Onboarding mais rápido para novos devs (extensões auto-sugeridas)

---

### 7. Novos MCPs (Se Houver Gratuitos)

#### 7.1. **MCPs Potencialmente Úteis (Investigar)**

| MCP | Funcionalidade | Status | Custo |
|-----|----------------|--------|-------|
| **git** | Git operations via MCP | 🔍 Investigar | ✅ Gratuito |
| **postgres** | PostgreSQL queries via MCP | 🔍 Investigar | ✅ Gratuito |
| **docker** | Docker operations via MCP | 🔍 Investigar | ✅ Gratuito |
| **npm** | NPM operations via MCP | 🔍 Investigar | ✅ Gratuito |

**Ação:** Pesquisar no registry de MCPs open-source e avaliar utilidade.

---

## 📅 ROADMAP DE IMPLEMENTAÇÃO

### FASE 1: Automações Críticas (Alta Prioridade) - **Semana 1**

**Objetivo:** Automatizar workflows mais frequentes (10-20x por dia)

**Entregas:**
1. ✅ **3 Skills:**
   - `validate-all` (validação completa)
   - `context-check` (verificação de contexto)
   - `sync-docs` (sincronização CLAUDE.md ↔ GEMINI.md)

2. ✅ **3 Comandos Slash:**
   - `/validate-all`
   - `/check-context`
   - `/sync-docs`

3. ✅ **3 Hooks Claude Code:**
   - `pre-task.md` (context check automático)
   - `post-file-edit.md` (sincronização automática)
   - `pre-commit-msg.md` (template commit automático)

**Critérios de Sucesso:**
- ✅ Validação completa em **< 1 min** (atualmente ~5 min)
- ✅ Context check em **< 30 seg** (atualmente ~3 min)
- ✅ Sincronização docs em **< 5 seg** (atualmente ~2 min)
- ✅ 0 erros TypeScript/Build antes de qualquer commit

**Tempo Estimado:** 8-12 horas

---

### FASE 2: Sub-Agents Especializados (Alta Prioridade) - **Semana 2**

**Objetivo:** Criar 3 agentes para domínios críticos

**Entregas:**
1. ✅ **Database Migration Expert** (.claude/agents/database-migration-expert.md)
2. ✅ **E2E Testing Expert** (.claude/agents/e2e-testing-expert.md)
3. ✅ **Documentation Expert** (.claude/agents/documentation-expert.md)

**Critérios de Sucesso:**
- ✅ Agents respondem quando invocados
- ✅ Seguem especialização definida
- ✅ Executam workflow completo autonomamente
- ✅ Geram output rastreável (documentação/testes)

**Tempo Estimado:** 10-15 horas

---

### FASE 3: Comandos Slash Adicionais (Média Prioridade) - **Semana 3**

**Objetivo:** Expandir automações para workflows semanais

**Entregas:**
1. ✅ **2 Skills:**
   - `create-migration` (migrations TypeORM)
   - `update-roadmap` (atualizar ROADMAP.md)

2. ✅ **7 Comandos Slash:**
   - `/create-migration <name>`
   - `/update-roadmap`
   - `/test-scraper <name>`
   - `/create-component <name>`
   - `/validate-frontend <page>`
   - `/restart <service>`
   - `/fix-zero-tolerance`

**Critérios de Sucesso:**
- ✅ Migrations criadas em **< 30 seg** (atualmente ~3 min)
- ✅ ROADMAP.md atualizado em **< 30 seg** (atualmente ~5 min)

**Tempo Estimado:** 6-10 horas

---

### FASE 4: Atualizações de Bibliotecas (Média Prioridade) - **Semana 4**

**Objetivo:** Sincronizar bibliotecas e patches de segurança

**Entregas:**
1. ✅ **Sincronizar Playwright:**
   - backend/python-scrapers: 1.56.0 → 1.57.0
   - Testar 2 scrapers migrados (fundamentus, bcb)

2. ✅ **Sincronizar FastAPI:**
   - backend/python-scrapers: 0.115.6 → 0.122.0
   - Validar API routes

3. ✅ **npm audit fix:**
   - Backend: corrigir CVEs (se houver)
   - Frontend: corrigir CVEs (se houver)

4. ✅ **Atualizar `.vscode/extensions.json`:**
   - Adicionar 5 extensões recomendadas

**Critérios de Sucesso:**
- ✅ Playwright sincronizado em todas as services
- ✅ FastAPI sincronizado
- ✅ 0 vulnerabilidades críticas (npm audit)
- ✅ Extensões VSCode recomendadas atualizadas

**Tempo Estimado:** 4-6 horas

---

### FASE 5: Sub-Agents Adicionais (Baixa Prioridade) - **Futuro**

**Objetivo:** Expandir agentes para casos de uso específicos

**Entregas:**
1. ✅ **OAuth Session Expert**
2. ✅ **Cross-Validation Expert**

**Critérios de Sucesso:**
- ✅ 6 scrapers OAuth destravados (fundamentei, chatgpt, gemini, etc)
- ✅ Cross-validation implementada em análises financeiras

**Tempo Estimado:** 8-12 horas (quando priorizado)

---

## ✅ CRITÉRIOS DE SUCESSO

### Métricas de Produtividade

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Tempo de Validação Completa** | ~5 min | ~30 seg | ⬆️ 90% |
| **Tempo de Context Check** | ~3 min | ~20 seg | ⬆️ 89% |
| **Tempo de Sincronização Docs** | ~2 min | ~5 seg | ⬆️ 96% |
| **Tempo de Criar Migration** | ~3 min | ~15 seg | ⬆️ 92% |
| **Tempo de Atualizar ROADMAP** | ~5 min | ~30 seg | ⬆️ 90% |
| **Total Tempo Economizado/Dia** | - | ~40-60 min | ⬆️ **30-40%** |

### Indicadores de Qualidade

- ✅ **Zero Tolerance mantido:** 0 erros TypeScript/Build/Console
- ✅ **Documentação sempre atualizada:** ROADMAP.md, CHANGELOG.md, VALIDACAO_XX.md
- ✅ **CLAUDE.md ↔ GEMINI.md 100% sincronizados**
- ✅ **Commits sempre detalhados** (template obrigatório)
- ✅ **Context check obrigatório** (previne erros)

### Indicadores de Usabilidade

- ✅ **Workflows automatizados:** 10+ tarefas repetitivas
- ✅ **Comandos slash usáveis:** 15+ atalhos disponíveis
- ✅ **Sub-agents especializados:** 9 agentes (6 existentes + 3 novos)
- ✅ **Hooks automáticos:** 3+ automações críticas

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Engessar Desenvolvimento

**Descrição:** Automações muito rígidas podem impedir flexibilidade

**Mitigação:**
- ✅ Skills são **opcionais** (podem ser ignorados se necessário)
- ✅ Comandos slash são **atalhos** (não obrigatórios)
- ✅ Hooks podem ser **desabilitados** temporariamente
- ✅ Sub-agents podem ser **invocados manualmente** (não automáticos)

**Nível de Risco:** 🟡 BAIXO (design flexível)

---

### Risco 2: Complexidade Adicional

**Descrição:** Muitos skills/comandos/hooks podem confundir

**Mitigação:**
- ✅ **Documentação clara** de cada skill/comando/hook
- ✅ **Nomenclatura intuitiva** (/validate-all, /check-context)
- ✅ **Priorização** (implementar apenas os mais usados primeiro)
- ✅ **README.md atualizado** com lista de todos os atalhos

**Nível de Risco:** 🟡 BAIXO (documentação robusta)

---

### Risco 3: Manutenção de Skills/Hooks

**Descrição:** Skills podem ficar desatualizados se projeto mudar

**Mitigação:**
- ✅ **Skills versionados** (documentar versão e data)
- ✅ **Revisão trimestral** de skills/hooks (remover obsoletos)
- ✅ **Testes automáticos** de skills críticos (validate-all)

**Nível de Risco:** 🟢 MUITO BAIXO (design simples)

---

### Risco 4: Dependência de Ferramentas Externas

**Descrição:** MCPs/Extensões podem ser descontinuados

**Mitigação:**
- ✅ **Apenas ferramentas open-source** (código auditável)
- ✅ **Alternativas documentadas** (ex: se Context7 falhar, usar docs oficiais)
- ✅ **Funcionalidade core não depende de MCPs** (podem ser desabilitados)

**Nível de Risco:** 🟢 MUITO BAIXO (apenas ferramentas gratuitas)

---

## 🎯 APROVAÇÃO E PRÓXIMOS PASSOS

### Aprovação Necessária

- [ ] **Usuário aprova FASE 1** (Skills + Comandos Slash + Hooks - Alta Prioridade)?
- [ ] **Usuário aprova FASE 2** (3 Sub-Agents especializados)?
- [ ] **Usuário aprova FASE 3** (Comandos Slash adicionais)?
- [ ] **Usuário aprova FASE 4** (Atualizações de bibliotecas)?
- [ ] **Usuário quer priorizar FASE 5** (Sub-Agents adicionais) ou deixar para futuro?

### Próximos Passos (Após Aprovação)

1. ✅ **Criar branch:** `feature/ecosystem-improvements`
2. ✅ **Implementar FASE 1:** Skills + Comandos + Hooks (Semana 1)
3. ✅ **Validar FASE 1:** Testar cada skill/comando/hook
4. ✅ **Documentar FASE 1:** VALIDACAO_FASE_XX.md
5. ✅ **Commit FASE 1:** Com Co-Authored-By
6. ✅ **Repetir para FASE 2-4**

### Próximas Decisões

1. **Quais fases implementar primeiro?**
   - Recomendação: FASE 1 → FASE 2 → FASE 4 → FASE 3 → FASE 5

2. **Alguma customização específica?**
   - Ex: Comandos slash adicionais que você gostaria?

3. **Algum sub-agent prioritário não mencionado?**
   - Ex: Agent para X domínio específico?

---

## 📝 RESUMO EXECUTIVO FINAL

### O Que Será Entregue

1. ✅ **5 Skills** para automação de tarefas repetitivas (economiza ~40-60 min/dia)
2. ✅ **15 Comandos Slash** para atalhos rápidos
3. ✅ **3 Novos Sub-Agents** (Database, E2E, Documentation)
4. ✅ **5 Hooks Claude Code** para automações críticas
5. ✅ **Atualizações de Bibliotecas** (sincronização + patches segurança)
6. ✅ **Extensões VSCode** recomendadas atualizadas

### Benefícios

- ⬆️ **30-40% mais produtividade** (tempo economizado em tarefas repetitivas)
- ✅ **Zero Tolerance garantido** (validações automáticas)
- ✅ **Documentação sempre atualizada** (hooks automáticos)
- ✅ **Desenvolvimento mais ágil** (comandos slash + skills)
- ✅ **Qualidade mantida** (sub-agents especializados)

### Investimento

- **Tempo:** 28-43 horas (distribuído em 4 semanas)
- **Custo:** ✅ R$ 0 (apenas ferramentas gratuitas)
- **Risco:** 🟢 MUITO BAIXO (design flexível, não engessa)

### Decisão Recomendada

🟢 **APROVAR** implementação das FASES 1-4 (Alta e Média Prioridade)
🟡 **ADIAR** FASE 5 (Baixa Prioridade) para iteração futura

---

**Última Atualização:** 2025-12-05
**Versão:** 1.0
**Status:** 📋 Aguardando Aprovação do Usuário
**Próxima Ação:** Usuário decidir quais fases implementar

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
