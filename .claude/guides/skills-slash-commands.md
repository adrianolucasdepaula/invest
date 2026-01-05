# Skills & Slash Commands Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Guia de invocação automática dos 15 slash commands do projeto

---

## Visão Geral

O projeto possui **15 slash commands (skills)** que DEVEM ser invocados em contextos específicos para garantir qualidade, validação completa, e workflow consistente.

### Princípio Fundamental

**Automatizar validações > Lembrar manualmente**

- ✅ Skills são triggers automáticos para workflows críticos
- ✅ Cada skill tem contexto específico de invocação
- ❌ NUNCA pular validações obrigatórias
- ❌ NUNCA commit sem `/validate-all`

---

## Matriz de Invocação Obrigatória

| Contexto | Comando/Skill | Quando Invocar | Obrigatório? |
|----------|---------------|----------------|--------------|
| **Início de tarefa complexa** | `/check-context` | ANTES de começar | 🔴 SIM |
| **Antes de QUALQUER commit** | `/validate-all` | Sempre antes de commit | 🔴 SIM |
| **Após mudanças frontend** | `/mcp-triplo` | Após editar .tsx/.css | 🟠 RECOMENDADO |
| **Feature complexa** | `/mcp-quadruplo` | Bug >2h ou nova lib | 🟡 OPCIONAL |
| **Nova fase do projeto** | `/new-phase` | Antes de implementar | 🔴 SIM |
| **Validar fase completa** | `/validate-phase` | Após implementar fase | 🔴 SIM |
| **Sincronizar docs** | `/sync-docs` | Após mudar CLAUDE.md | 🔴 SIM |
| **Verificar containers** | `/docker-status` | Antes de testar | 🟠 RECOMENDADO |
| **Erros TypeScript** | `/fix-ts-errors` | Quando tsc falhar | 🔴 SIM |
| **Executar scraper** | `/run-scraper` | Coleta de dados | 🟡 OPCIONAL |
| **Commit de fase** | `/commit-phase` | Finalizar fase | 🔴 SIM |
| **Validar 100%** | `/check-ecosystem` | Validação massiva | 🟠 RECOMENDADO |
| **Browser conflicts** | `/mcp-browser-reset` | Erro de MCP browser | 🟡 OPCIONAL |
| **Validar dev config** | `/validate-dev-config` | Setup inicial | 🟡 OPCIONAL |
| **Docker rebuild** | `/rebuild-guide` | Container issues | 🟡 OPCIONAL |

---

## Workflow de Skills

### Fluxo Completo de Desenvolvimento

```text
┌─────────────────────────────────────────────────────────────┐
│                   WORKFLOW COMPLETO                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Início Tarefa                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────┐                                        │
│  │ /check-context  │ ◄── Sempre primeiro                    │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│      [Implementação]                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ /validate-all   │ ◄── Antes de commit (OBRIGATÓRIO)     │
│  └────────┬────────┘                                        │
│           │                                                 │
│      Mudou frontend?                                        │
│      ┌────┴────┐                                            │
│      │ SIM    │ NÃO                                         │
│      ▼         │                                            │
│  ┌─────────────┐ │                                          │
│  │ /mcp-triplo │ │  ◄── UI simples                          │
│  └─────┬───────┘ │                                          │
│        │         │                                          │
│        │ Feature complexa?                                  │
│        │ Bug >2h debug?                                     │
│        ▼                                                    │
│  ┌──────────────────┐                                       │
│  │ /mcp-quadruplo   │  ◄── Com documentation research       │
│  └─────┬────────────┘                                       │
│        └────┬────┘                                          │
│             ▼                                               │
│  ┌─────────────────┐                                        │
│  │ /commit-phase   │ ◄── Commit padronizado                 │
│  └─────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quando Usar /mcp-quadruplo

**Use `/mcp-quadruplo` quando:**

| Situação | Descrição | Benefício |
|----------|-----------|-----------|
| ✅ Feature complexa | Nova biblioteca, integração externa | Documentation research automático |
| ✅ Bug desconhecido | >2 horas debugando sem solução | Busca em KNOWN-ISSUES + web research |
| ✅ Validar problema | Precisa confirmar se é issue conhecido | Economiza tempo de investigação |
| ✅ Research preventivo | Quer evitar problemas conhecidos | Proativo > Reativo |

**Diferença para /mcp-triplo:**

| Aspecto | /mcp-triplo | /mcp-quadruplo |
|---------|-------------|----------------|
| **MCPs** | Playwright + DevTools + A11y | + Documentation Research |
| **Uso** | Validação visual + funcional | + Contexto técnico profundo |
| **Duração** | ~5-10 min | ~10-20 min |
| **Quando** | Mudanças frontend simples | Features complexas, bugs obscuros |

---

## Detalhamento de Cada Skill

### 1. /check-context

**Quando:** Início de TODA tarefa complexa

**O que faz:**
- Lê arquivos críticos (CLAUDE.md, ARCHITECTURE.md, KNOWN-ISSUES.md)
- Verifica state atual do projeto (git status, containers)
- Identifica gaps de conhecimento
- Sugere leituras adicionais

**Exemplo de uso:**

```bash
/check-context

# Claude irá:
# 1. Ler CLAUDE.md, ARCHITECTURE.md
# 2. Verificar git status
# 3. Verificar docker ps
# 4. Listar issues conhecidos relacionados
# 5. Sugerir contexto adicional necessário
```

**Arquivo:** `.claude/commands/check-context.md`

---

### 2. /validate-all

**Quando:** ANTES de QUALQUER commit (OBRIGATÓRIO)

**O que faz:**
- `cd backend && npx tsc --noEmit` (0 erros)
- `cd backend && npm run build` (sucesso)
- `cd frontend && npx tsc --noEmit` (0 erros)
- `cd frontend && npm run build` (sucesso)
- `cd frontend && npm run lint` (0 critical warnings)

**Exemplo de uso:**

```bash
/validate-all

# Claude irá:
# 1. Validar TypeScript backend
# 2. Build backend
# 3. Validar TypeScript frontend
# 4. Build frontend
# 5. Lint frontend
# 6. Reportar resultado consolidado
```

**Arquivo:** `.claude/commands/validate-all.md`

---

### 3. /mcp-triplo

**Quando:** Após mudanças frontend (.tsx, .css, componentes)

**O que faz:**
1. **Playwright:** navegação + snapshot + console + network
2. **Chrome DevTools:** performance trace
3. **A11y:** WCAG 2.1 AA compliance

**Exemplo de uso:**

```bash
/mcp-triplo /assets

# Claude irá:
# 1. Navegar para http://localhost:3100/assets
# 2. Capturar snapshot (estado completo)
# 3. Verificar console (0 erros)
# 4. Verificar network (0 falhas)
# 5. Testar acessibilidade (WCAG 2.1 AA)
# 6. Screenshots de evidência
```

**Arquivo:** `.claude/commands/mcp-triplo.md`

---

### 4. /mcp-quadruplo

**Quando:** Feature complexa, bug >2h, ou precisa research

**O que faz:**
- Tudo do `/mcp-triplo`
- **+ Documentation Research:** Busca em KNOWN-ISSUES, web search de best practices

**Exemplo de uso:**

```bash
/mcp-quadruplo "dividend filter not working"

# Claude irá:
# 1-5. MCP Triplo completo
# 6. Buscar "dividend filter" em KNOWN-ISSUES.md
# 7. WebSearch: "react dividend filter best practices 2025"
# 8. WebSearch: "next.js filter component solution"
# 9. Correlacionar com problemas conhecidos
# 10. Sugerir solução baseada em research
```

**Arquivo:** `.claude/commands/mcp-quadruplo.md`

---

### 5. /new-phase

**Quando:** Antes de iniciar nova fase do projeto

**O que faz:**
- Cria `PLANO_FASE_XX_NOME.md` com template padrão
- Ultra-Thinking para análise profunda
- Sugere quebra em sub-tarefas
- Identifica dependências

**Exemplo de uso:**

```bash
/new-phase "Implementar Watchlists"

# Claude irá:
# 1. Criar PLANO_FASE_XX_WATCHLISTS.md
# 2. Analisar dependências (auth, assets, database)
# 3. Quebrar em sub-tarefas
# 4. Estimar complexidade
# 5. Identificar riscos
```

**Arquivo:** `.claude/commands/new-phase.md`

---

### 6. /validate-phase

**Quando:** Após implementar fase completa

**O que faz:**
- Zero Tolerance (tsc + build + lint)
- MCP Triplo em páginas afetadas
- Validação de documentação atualizada
- Cria `VALIDACAO_FASE_XX.md`

**Exemplo de uso:**

```bash
/validate-phase 133

# Claude irá:
# 1. /validate-all
# 2. /mcp-triplo em páginas afetadas
# 3. Verificar ROADMAP.md atualizado
# 4. Verificar CHANGELOG.md atualizado
# 5. Criar VALIDACAO_FASE_133.md
```

**Arquivo:** `.claude/commands/validate-phase.md`

---

### 7. /sync-docs

**Quando:** Após mudar CLAUDE.md (OBRIGATÓRIO)

**O que faz:**
- Copia CLAUDE.md → GEMINI.md (100% idêntico)
- Valida sincronização (diff)
- Atualiza timestamp

**Exemplo de uso:**

```bash
/sync-docs

# Claude irá:
# 1. Copiar CLAUDE.md → GEMINI.md
# 2. Validar diff (deve ser 0)
# 3. Atualizar "Last Updated" timestamp
# 4. Confirmar 100% idêntico
```

**Arquivo:** `.claude/commands/sync-docs.md`

---

### 8. /docker-status

**Quando:** Antes de testes, ou troubleshooting infra

**O que faz:**
- `docker ps` (status de 21 containers)
- Health check de cada serviço
- Verificar logs de erros (últimas 50 linhas)
- Reportar problemas

**Exemplo de uso:**

```bash
/docker-status

# Claude irá:
# 1. docker ps --format table
# 2. Verificar 21 containers esperados
# 3. docker logs [container] --tail 50 (para cada)
# 4. Identificar containers com problemas
# 5. Sugerir correções
```

**Arquivo:** `.claude/commands/docker-status.md`

---

### 9. /fix-ts-errors

**Quando:** `npx tsc --noEmit` retorna erros

**O que faz:**
- Rodar `npx tsc --noEmit`
- Identificar todos os erros
- Corrigir um por um (NÃO usar `any`)
- Validar 0 erros no final

**Exemplo de uso:**

```bash
/fix-ts-errors frontend

# Claude irá:
# 1. cd frontend && npx tsc --noEmit
# 2. Listar todos os erros
# 3. Corrigir cada erro (usar tipos corretos)
# 4. Validar 0 erros
# 5. Reportar correções aplicadas
```

**Arquivo:** `.claude/commands/fix-ts-errors.md`

---

### 10. /run-scraper

**Quando:** Coleta de dados financeiros

**O que faz:**
- Verificar scraper existe
- Rodar scraper em container Python
- Coletar logs
- Validar dados coletados

**Exemplo de uso:**

```bash
/run-scraper fundamentus PETR4

# Claude irá:
# 1. docker exec invest_scrapers python test_fundamentus.py
# 2. Monitorar logs
# 3. Validar dados retornados
# 4. Verificar performance (< 10s)
```

**Arquivo:** `.claude/commands/run-scraper.md`

---

### 11. /commit-phase

**Quando:** Finalizar fase completa

**O que faz:**
- git status
- git add arquivos relevantes
- Criar commit message padronizada (Conventional Commits)
- Incluir assinatura Claude Code

**Exemplo de uso:**

```bash
/commit-phase "Implementar watchlists"

# Claude irá:
# 1. git status
# 2. git add [arquivos relevantes]
# 3. git commit com mensagem:
#    feat(watchlists): implement user watchlists feature
#
#    - Backend: watchlists table + CRUD endpoints
#    - Frontend: WatchlistsPage component
#    - Tests: E2E validation with MCP Triplo
#
#    ✅ Zero Tolerance validado
#    ✅ Documentação atualizada
#
#    🤖 Generated with Claude Code
#    Co-Authored-By: Claude <noreply@anthropic.com>
```

**Arquivo:** `.claude/commands/commit-phase.md`

---

### 12. /check-ecosystem

**Quando:** Validação massiva de 100% do ecossistema

**O que faz:**
- Validar frontend (19 páginas)
- Validar backend (16 controllers)
- Validar infraestrutura (21 containers)
- Criar relatório completo

**Exemplo de uso:**

```bash
/check-ecosystem

# Claude irá:
# 1. Invocar pm-expert agent
# 2. Validação massiva de 100%
# 3. MCP Triplo em todas as 19 páginas
# 4. Criar VALIDACAO_ECOSSISTEMA_YYYY-MM-DD.md
# 5. Atualizar KNOWN-ISSUES.md com gaps
```

**Arquivo:** `.claude/commands/check-ecosystem.md`

---

### 13. /mcp-browser-reset

**Quando:** Conflitos de browser entre MCPs (Playwright vs Chrome DevTools)

**O que faz:**
- Fechar todas sessões de browser
- Resetar MCPs
- Validar restart

**Exemplo de uso:**

```bash
/mcp-browser-reset

# Claude irá:
# 1. Fechar Playwright browser
# 2. Fechar Chrome DevTools browser
# 3. Resetar MCP connections
# 4. Validar restart com teste simples
```

**Arquivo:** `.claude/commands/mcp-browser-reset.md`

---

### 14. /validate-dev-config

**Quando:** Setup inicial ou troubleshooting de ambiente

**O que faz:**
- Verificar .env files
- Verificar node_modules
- Verificar Docker images
- Validar portas disponíveis

**Exemplo de uso:**

```bash
/validate-dev-config

# Claude irá:
# 1. Verificar .env.local existe
# 2. npm list (dependencies instaladas)
# 3. docker images (21 images esperadas)
# 4. Verificar portas (3100, 3101, 5532, 6479, etc.)
```

**Arquivo:** `.claude/commands/validate-dev-config.md`

---

### 15. /rebuild-guide

**Quando:** Container issues (Exit 137, restart loops)

**O que faz:**
- Guia de decisão: rebuild vs restart
- Passos de troubleshooting
- Comandos recomendados

**Exemplo de uso:**

```bash
/rebuild-guide scrapers

# Claude irá:
# 1. Analisar logs do container
# 2. Identificar tipo de problema
# 3. Recomendar:
#    - Restart: se config change
#    - Rebuild: se dependency change
# 4. Fornecer comandos específicos
```

**Arquivo:** `.claude/commands/rebuild-guide.md`

---

## Anti-Patterns (NUNCA FAZER)

### O Que NUNCA Fazer

| Anti-Pattern | Consequência | Correto |
|--------------|--------------|---------|
| ❌ Commit sem `/validate-all` | Código quebrado no repo, CI falha | ✅ **SEMPRE** validar antes |
| ❌ Editar frontend sem `/mcp-triplo` | Bugs visuais, console errors não detectados | ✅ Validar visualmente |
| ❌ Iniciar sem `/check-context` | Retrabalho, inconsistências, violar regras | ✅ Contexto primeiro |
| ❌ Ignorar erros TypeScript | Build falha em produção | ✅ `/fix-ts-errors` imediato |
| ❌ Mudar CLAUDE.md sem `/sync-docs` | GEMINI.md dessinc, quebra regra 100% idêntico | ✅ Sync obrigatório |
| ❌ Finalizar fase sem `/validate-phase` | Fase incompleta, sem documentação | ✅ Validação completa |

### Exemplos de Anti-Patterns

#### Anti-Pattern 1: Commit sem Validação

```text
❌ ERRADO:
[Implementa feature]
git add .
git commit -m "feat: add feature"
[CI falha - TypeScript errors]

✅ CORRETO:
[Implementa feature]
/validate-all
[0 erros confirmado]
git add .
git commit -m "feat: add feature"
```

#### Anti-Pattern 2: Frontend sem Visual Validation

```text
❌ ERRADO:
[Edita DividendFilter.tsx]
git commit
[Bug visual não detectado]

✅ CORRETO:
[Edita DividendFilter.tsx]
/mcp-triplo /assets
[Valida visualmente]
git commit
```

---

## Troubleshooting

### Erro: "Skill não existe"

**Causa:** Typo no nome ou skill não instalada

**Solução:**

```bash
# Listar skills disponíveis
ls .claude/commands/

# Verificar nome exato
cat .claude/commands/[skill].md
```

### Erro: "Skill falhou"

**Causa:** Dependências não satisfeitas (ex: containers parados)

**Solução:**

```bash
# Verificar pré-requisitos
/docker-status  # Containers rodando?
/validate-dev-config  # Ambiente OK?
```

### Erro: "/validate-all retorna erros"

**Causa:** Código com erros TypeScript ou build

**Solução:**

```bash
# Corrigir erros TypeScript
/fix-ts-errors frontend
/fix-ts-errors backend

# Validar novamente
/validate-all
```

---

## Checklist de Uso

### Antes de Commit (OBRIGATÓRIO)

```markdown
- [ ] `/validate-all` executado (0 erros)
- [ ] `/mcp-triplo` se mudou frontend
- [ ] `/sync-docs` se mudou CLAUDE.md
- [ ] Commit message segue Conventional Commits
```

### Antes de Nova Fase

```markdown
- [ ] `/check-context` para entender estado atual
- [ ] `/new-phase` para criar plano
- [ ] Ultra-Thinking para análise profunda
```

### Após Implementar Fase

```markdown
- [ ] `/validate-all` (0 erros)
- [ ] `/validate-phase` (validação completa)
- [ ] `/commit-phase` (commit padronizado)
- [ ] ROADMAP.md atualizado
```

---

## Referência Rápida

### Comandos por Frequência

| Frequência | Comandos |
|------------|----------|
| **Sempre (100%)** | `/validate-all`, `/check-context` |
| **Muito Frequente (80%)** | `/mcp-triplo`, `/sync-docs`, `/commit-phase` |
| **Frequente (50%)** | `/validate-phase`, `/new-phase`, `/docker-status` |
| **Ocasional (20%)** | `/fix-ts-errors`, `/check-ecosystem`, `/run-scraper` |
| **Raro (<10%)** | `/mcp-browser-reset`, `/validate-dev-config`, `/rebuild-guide`, `/mcp-quadruplo` |

### Comandos por Fase de Desenvolvimento

| Fase | Comandos |
|------|----------|
| **Planejamento** | `/check-context`, `/new-phase` |
| **Desenvolvimento** | `/validate-all`, `/fix-ts-errors`, `/docker-status` |
| **Validação** | `/mcp-triplo`, `/mcp-quadruplo`, `/validate-phase` |
| **Commit** | `/commit-phase`, `/sync-docs` |
| **Auditoria** | `/check-ecosystem`, `/validate-dev-config` |

---

## Fontes

- **Skills Directory:** `.claude/commands/*.md` (15 arquivos)
- **MCP Triplo Methodology:** `METODOLOGIA_MCPS_INTEGRADA.md`
- **Zero Tolerance:** `.claude/guides/zero-tolerance-policy.md`
- **Validation Checklist:** `CHECKLIST_ECOSSISTEMA_COMPLETO.md`
