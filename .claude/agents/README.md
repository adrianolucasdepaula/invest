# Sub-Agents - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Data de Criação:** 2025-11-15
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [O que são Sub-Agents?](#o-que-são-sub-agents)
2. [Sub-Agents Disponíveis](#sub-agents-disponíveis)
3. [Como Usar](#como-usar)
4. [Quando Usar Cada Sub-Agent](#quando-usar-cada-sub-agent)
5. [Como Criar Novos Sub-Agents](#como-criar-novos-sub-agents)

---

## 🎯 O QUE SÃO SUB-AGENTS?

Sub-agents são **assistentes IA pré-configurados e especializados** que o Claude Code pode invocar automaticamente ou sob demanda. Cada sub-agent:

- **Tem expertise específica**: Backend, Frontend, Scrapers, Charts, TypeScript
- **Janela de contexto separada**: Não consome o contexto da conversa principal
- **Ferramentas configuráveis**: Acesso apenas às ferramentas necessárias
- **Prompt do sistema customizado**: Instruções detalhadas sobre como agir

### Benefícios

✅ **Especialização**: Cada agent domina um domínio específico
✅ **Autonomia**: Agents tomam decisões dentro do seu escopo
✅ **Eficiência**: Contexto focado, execução mais rápida
✅ **Qualidade**: Seguem best practices do domínio
✅ **Documentação**: Retornam relatórios detalhados

---

## 🤖 SUB-AGENTS DISPONÍVEIS

**Total:** 6 sub-agents especializados

### 1. Backend API Expert (`backend-api-expert`)

**Especialidade:** NestJS, TypeORM, API REST, PostgreSQL

**Quando Invocar:**
- Criar/modificar endpoints REST
- Implementar controllers, services, DTOs
- Criar/modificar entities TypeORM
- Gerar migrations de banco
- Refatorar código backend

**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Model:** Sonnet (para complexidade)

**Exemplo:**
```
Use the backend-api-expert to create GET /api/v1/assets/:ticker/dividends endpoint
```

**Documentação:** [backend-api-expert.md](./backend-api-expert.md)

---

### 2. Frontend Components Expert (`frontend-components-expert`)

**Especialidade:** Next.js 14, React, Shadcn/ui, TailwindCSS, React Query

**Quando Invocar:**
- Criar/modificar páginas Next.js
- Implementar componentes React
- Adicionar features de UI
- Implementar hooks customizados
- Garantir responsividade e acessibilidade

**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Model:** Sonnet

**Exemplo:**
```
Use the frontend-components-expert to create /watchlist page with asset cards
```

**Documentação:** [frontend-components-expert.md](./frontend-components-expert.md)

---

### 3. Scraper Development Expert (`scraper-development-expert`)

**Especialidade:** Playwright, Python, OAuth, Web Scraping, Data Extraction

**Quando Invocar:**
- Criar novos scrapers (TypeScript ou Python)
- Implementar autenticação OAuth
- Debugar problemas de scraping
- Validar dados extraídos
- Configurar retry logic

**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Model:** Sonnet

**Exemplo:**
```
Use the scraper-development-expert to create scraper for Fundamentei with Google OAuth
```

**Documentação:** [scraper-development-expert.md](./scraper-development-expert.md)

---

### 4. Chart Analysis Expert (`chart-analysis-expert`)

**Especialidade:** Recharts, lightweight-charts, Candlestick Charts, Technical Analysis

**Quando Invocar:**
- Criar/corrigir gráficos financeiros
- Implementar candlestick charts (OHLC)
- Debugar problemas de visualização
- Validar dados com fontes de mercado
- Adicionar indicadores técnicos

**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash, Chrome DevTools MCPs
**Model:** Sonnet

**Exemplo:**
```
Use the chart-analysis-expert to investigate why candlestick chart shows wrong data for 1D period
```

**Documentação:** [chart-analysis-expert.md](./chart-analysis-expert.md)

---

### 5. TypeScript Validation Expert (`typescript-validation-expert`)

**Especialidade:** TypeScript 5.x, Type Safety, Strict Mode, Error Resolution

**Quando Invocar:**
- Resolver erros TypeScript
- Adicionar tipos faltantes
- Refatorar `any` para tipos específicos
- Garantir 0 erros TypeScript
- Validar tipos em todo o projeto

**Ferramentas:** Read, Edit, Glob, Grep, Bash
**Model:** Haiku (tarefas rápidas, baixo custo)

**Exemplo:**
```
Use the typescript-validation-expert to fix "Property 'range' does not exist on type 'AssetPricesParams'"
```

**Documentação:** [typescript-validation-expert.md](./typescript-validation-expert.md)

---

### 6. Queue Management Expert (`queue-management-expert`)

**Especialidade:** BullMQ, Redis, Job Scheduling, Retry Logic, Async Workflows

**Quando Invocar:**
- Criar jobs BullMQ (definição + processor)
- Implementar scheduled tasks (cron jobs)
- Configurar retry logic e rate limiting
- Debugar jobs travados/falhando
- Integrar jobs com WebSocket para notificações
- Monitorar queue health (Redis Commander)

**Ferramentas:** Read, Edit, Write, Glob, Grep, Bash
**Model:** Sonnet

**Exemplo:**
```
Use the queue-management-expert to create a scheduled job that updates all assets daily at 2 AM
```

**Documentação:** [queue-management-expert.md](./queue-management-expert.md)

---

## 🚀 COMO USAR

### Invocação Automática

Claude Code detecta automaticamente quando usar um sub-agent baseado na descrição. Simplesmente solicite a tarefa:

```
Criar endpoint GET /api/v1/assets/:ticker/dividends que retorna histórico de dividendos
```

Claude detectará que deve usar `backend-api-expert` e invocará automaticamente.

### Invocação Explícita

Você pode invocar explicitamente um sub-agent:

```
Use the backend-api-expert to create GET /api/v1/assets/:ticker/dividends endpoint
```

ou

```
Invoke the chart-analysis-expert to fix the candlestick chart data issue
```

### Via Interface `/agents`

1. Digite `/agents` no terminal Claude Code
2. Veja lista de agents disponíveis
3. Selecione o agent desejado
4. Descreva a tarefa

---

## 📋 QUANDO USAR CADA SUB-AGENT

| Tarefa | Sub-Agent Recomendado | Motivo |
|--------|----------------------|--------|
| Criar endpoint REST | `backend-api-expert` | Expertise em NestJS + TypeORM |
| Criar página Next.js | `frontend-components-expert` | Expertise em React + Shadcn/ui |
| Criar scraper OAuth | `scraper-development-expert` | Expertise em Playwright + OAuth |
| Corrigir gráfico | `chart-analysis-expert` | Expertise em charting libraries |
| Resolver erro TypeScript | `typescript-validation-expert` | Expertise em type system |
| Criar job BullMQ | `queue-management-expert` | Expertise em jobs + retry logic |
| Adicionar tabela DB | `backend-api-expert` | Inclui migrations |
| Implementar componente UI | `frontend-components-expert` | UI/UX + acessibilidade |
| Validar dados scraped | `scraper-development-expert` | Data quality + cross-validation |
| Implementar candlestick | `chart-analysis-expert` | OHLC data + market standards |
| Refatorar tipos | `typescript-validation-expert` | Type safety |
| Scheduled task (cron) | `queue-management-expert` | Job scheduling + BullMQ |
| Debug job travado | `queue-management-expert` | Queue monitoring + Redis |

---

## 🛠️ COMO CRIAR NOVOS SUB-AGENTS

### 1. Criar Arquivo Markdown

Crie um arquivo `.md` em `.claude/agents/` com o formato:

```markdown
---
name: nome-do-agent
description: Quando invocar este agent (linguagem natural)
tools: Read, Edit, Write, Glob, Grep, Bash
model: sonnet
---

# Nome do Agent

Você é um especialista em [DOMÍNIO]...

## Your Expertise
- Item 1
- Item 2

## Your Responsibilities
1. Responsabilidade 1
2. Responsabilidade 2

## Workflow
1. Passo 1
2. Passo 2

## Code Standards
[Exemplos de código]

## Success Criteria
✅ Critério 1
✅ Critério 2
```

### 2. Campos Obrigatórios

- **name**: Identificador único (minúsculas com hífens)
- **description**: Quando invocar (deve ser claro e específico)

### 3. Campos Opcionais

- **tools**: Ferramentas permitidas (padrão: todas)
- **model**: sonnet (complexo), opus (muito complexo), haiku (simples/rápido)

### 4. Testar o Sub-Agent

```
Use the nome-do-agent to [TAREFA]
```

ou

Digite `/agents` e selecione seu agent.

---

## 📚 DOCUMENTAÇÃO ADICIONAL

**Projeto:**
- `AGENTES_ESPECIALIZADOS.md` - Guia completo de todos os agents (incluindo não implementados)
- `CLAUDE.md` - Metodologia Claude Code
- `ARCHITECTURE.md` - Arquitetura do sistema

**Claude Code:**
- [Documentação Oficial de Sub-Agents](https://code.claude.com/docs/en/sub-agents.md)

---

## ✅ CHECKLIST DE CRIAÇÃO DE SUB-AGENT

Antes de criar um novo sub-agent:

- [ ] Domínio bem definido? (não sobrepõe agents existentes)
- [ ] Description clara? (Claude saberá quando invocar)
- [ ] Ferramentas mínimas necessárias? (princípio do menor privilégio)
- [ ] Model adequado? (haiku para simples, sonnet para complexo)
- [ ] Prompt detalhado? (instruções claras e exemplos)
- [ ] Workflow documentado? (passos de execução)
- [ ] Success criteria definidos? (como validar sucesso)
- [ ] Testado? (funciona conforme esperado)

---

## 🔗 REFERÊNCIAS

**Sub-Agents Criados:**
1. [backend-api-expert.md](./backend-api-expert.md) - NestJS + TypeORM + PostgreSQL
2. [frontend-components-expert.md](./frontend-components-expert.md) - Next.js + React + Shadcn/ui
3. [scraper-development-expert.md](./scraper-development-expert.md) - Playwright + OAuth + Scraping + VNC
4. [chart-analysis-expert.md](./chart-analysis-expert.md) - Recharts + lightweight-charts + OHLC
5. [typescript-validation-expert.md](./typescript-validation-expert.md) - TypeScript + Type Safety
6. [queue-management-expert.md](./queue-management-expert.md) - BullMQ + Jobs + Redis + Scheduling

**Próximos Sub-Agents Planejados:**
- Database Migration Expert
- Performance Optimization Expert
- Accessibility Expert
- E2E Testing Expert
- Documentation Expert

---

**Última atualização:** 2025-11-15
**Mantido por:** Claude Code (Sonnet 4.5)
