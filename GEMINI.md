# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B3 AI Analysis Platform - Investment analysis platform for Brazilian stock exchange (B3) with AI-powered fundamental, technical, and macroeconomic analysis.

**Stack:** NestJS 10 + Next.js 14 App Router + PostgreSQL 16 + TypeORM + BullMQ/Redis + Python Scrapers

## Common Commands

### Development

```bash
# Start all services (Docker)
docker-compose up -d

# TypeScript validation (REQUIRED before commits)
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build   # NestJS build
cd frontend && npm run build  # Next.js build

# Lint
cd frontend && npm run lint

# Run tests
cd backend && npm run test                    # Unit tests
cd backend && npm run test:watch              # Watch mode
cd backend && npm run test:e2e                # E2E tests
cd frontend && npx playwright test            # Playwright E2E
```

### Database

```bash
# Run migrations
cd backend && npm run migration:run

# Revert last migration
cd backend && npm run migration:revert

# Generate new migration
cd backend && npm run migration:generate -- -n MigrationName

# Run seeds
cd backend && npm run seed
```

### Docker

```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f <srv>  # View logs (backend, frontend, postgres, redis)
docker restart invest_backend invest_frontend  # Restart services
```

## Architecture

```
Frontend (Next.js :3100) <-> Backend (NestJS :3101) <-> PostgreSQL (:5532)
                                    |
                              BullMQ + Redis (:6479)
                                    |
                           Python Scrapers (Playwright)
```

### Key Directories

- `backend/src/api/` - REST controllers, services, DTOs
- `backend/src/database/entities/` - TypeORM entities
- `backend/src/database/migrations/` - Database migrations
- `backend/src/scrapers/` - Data scraping services (fundamental, news, options)
- `backend/src/queue/` - BullMQ jobs and processors
- `frontend/src/app/(dashboard)/` - Authenticated pages (App Router)
- `frontend/src/components/` - React components (Shadcn/ui)
- `frontend/src/lib/hooks/` - Custom React hooks
- `frontend/src/lib/api.ts` - API client (axios)

### Main Entities

- `Asset` - Stock tickers (861 B3 assets)
- `AssetPrice` - Historical OHLCV data (1986-2025 from COTAHIST)
- `TickerChange` - Ticker rebranding history (e.g., ELET3->AXIA3)
- `Analysis` - Fundamental/technical analysis results
- `Portfolio` / `PortfolioPosition` - User portfolios

## Coding Patterns

### Backend (NestJS)

- Use `class-validator` decorators for DTO validation
- Custom validators with `@ValidatorConstraint` for cross-field validation
- Repository pattern via TypeORM
- WebSocket events via `@nestjs/websockets` for real-time updates

```typescript
// Example: Custom cross-field validator
@ValidatorConstraint({ name: 'IsEndYearGreaterThanStartYear', async: false })
export class IsEndYearGreaterThanStartYear implements ValidatorConstraintInterface {
  validate(endYear: number, args: ValidationArguments) {
    return endYear >= (args.object as any).startYear;
  }
}
```

### Frontend (Next.js 14)

- App Router with route groups: `(dashboard)` for authenticated, `auth` for public
- React Query for server state management
- Shadcn/ui components in `components/ui/`
- Charts: Recharts (dashboard) + lightweight-charts (candlestick)

### Data Flow

1. **Scraping**: 6 sources with cross-validation (min 3 sources for confidence)
2. **Queue**: BullMQ processes heavy tasks (analysis, bulk sync)
3. **Real-time**: WebSocket events for progress updates

## Quality Requirements

**Zero Tolerance Policy:**
- TypeScript: 0 errors (backend + frontend)
- Build: Must succeed
- ESLint: 0 critical warnings

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3100 | http://localhost:3100 |
| Backend API | 3101 | http://localhost:3101/api/v1 |
| PostgreSQL | 5532 | localhost:5532 |
| Redis | 6479 | localhost:6479 |
| PgAdmin | 5150 | http://localhost:5150 |
| noVNC (OAuth) | 6080 | http://localhost:6080 |

## Development Principles

### 1. Quality > Velocity ("Nao Ter Pressa")

**Principio Fundamental:** Priorizar correcao definitiva sobre fix rapido.

- OK Tempo adequado para analise profunda (Ultra-Thinking)
- OK Nao pular etapas de validacao
- OK Code review obrigatorio antes de proxima fase
- NO Pressao por deadlines NAO justifica baixa qualidade
- NO NUNCA fazer workarounds temporarios que se tornam permanentes

**Referencia:** `VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md` - Regra 1.6

---

### 2. KISS Principle (Keep It Simple, Stupid)

**Evitar complexidade desnecessaria:**

- OK Usar melhores praticas comprovadas e modernas
- OK Solucoes simples e diretas quando possivel
- OK Codigo legivel > Codigo "inteligente"
- NO Over-engineering
- NO Abstracoes prematuras

**Nota:** "Moderno e funcional" != "Complexo". Simplicidade e sofisticacao.

---

### 3. Root Cause Analysis Obrigatorio

**Para TODOS os bugs e problemas:**

- OK Identificar causa raiz (nao apenas sintoma)
- OK Corrigir problema original (nao workaround)
- OK Documentar em `KNOWN-ISSUES.md` ou `.gemini/context/known-issues.md`
- OK Implementar prevencao (nao apenas correcao)
- NO NUNCA simplificar para "terminar rapido"

**Exemplo:**
```
NO ERRADO: Adicionar try-catch para suprimir erro
OK CORRETO: Investigar por que erro ocorre e corrigir causa
```

**Referencia:** `.gemini/context/known-issues.md` - 8 issues com root cause completo

---

### 4. Anti-Workaround Policy

**Regra Explicita:**

- NO Workarounds temporarios que se tornam permanentes
- NO "Resolver depois" sem issue/TODO rastreavel
- NO Comentarios tipo `// FIXME`, `// HACK` sem plano de correcao
- OK Se problema e critico -> corrigir agora
- OK Se nao e critico -> criar issue rastreavel com prioridade

**Fluxo Correto:**

```
Problema Encontrado
    |
E bloqueante?
    +- SIM -> Corrigir AGORA (root cause analysis)
    +- NAO -> Criar issue no KNOWN-ISSUES.md + continuar
```

---

## Critical Rules (Regras Criticas)

### Zero Tolerance Policy

**0 erros obrigatorio em:**

- TypeScript: `npx tsc --noEmit` (backend + frontend)
- Build: `npm run build` (backend + frontend)
- Console: Navegador sem erros (validar com Chrome DevTools MCP)
- ESLint: 0 critical warnings

**Antes de CADA commit:**

```bash
# Backend
cd backend
npx tsc --noEmit  # Deve retornar 0 erros
npm run build     # Deve completar sem erros

# Frontend
cd frontend
npx tsc --noEmit  # Deve retornar 0 erros
npm run build     # Deve completar sem erros
npm run lint      # 0 critical warnings
```

---

### Git Workflow

**Regras Obrigatorias:**

- OK Git sempre atualizado (working tree clean antes de nova fase)
- OK Branch sempre atualizada e mergeada com main
- OK Commits frequentes com mensagens descritivas (Conventional Commits)
- OK Documentacao atualizada no mesmo commit (nao separado)
- NO NUNCA commitar codigo que nao compila
- NO NUNCA commitar com erros TypeScript

**Commit Message Format:**

```bash
git commit -m "feat: add new feature X

OK Zero Tolerance validado
OK Documentacao atualizada

Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Referencia:** `CONTRIBUTING.md` - Git workflow completo

---

### Validacao Completa e Robusta

**Para TODA nova funcionalidade:**

- OK **MCP Triplo Obrigatorio:**
  1. Playwright (E2E testing)
  2. Chrome DevTools (snapshot + console + network)
  3. React DevTools (component tree + state)

- OK **Ultra-Thinking + TodoWrite:** Planejamento antes de execucao
- OK **Screenshots de Evidencia:** Salvar em `docs/screenshots/`
- OK **Relatorio de Validacao:** Criar `VALIDACAO_FASE_XX.md`

**Referencia:** `METODOLOGIA_MCPS_INTEGRADA.md`

---

### Dados Financeiros - Precisao Absoluta

**Regras NAO-NEGOCIAVEIS:**

- OK **Decimal (nao Float)** para valores monetarios
- OK **Cross-validation** minimo 3 fontes
- OK **Timezone:** America/Sao_Paulo (sempre)
- NO NUNCA arredondar/manipular dados financeiros
- NO NUNCA usar dados mock em producao
- NO NUNCA ajustar valores para "parecer melhor"

**Exemplo:**

```typescript
// NO ERRADO
const price: number = 123.45;  // Float tem imprecisao

// OK CORRETO
import { Decimal } from 'decimal.js';
const price: Decimal = new Decimal('123.45');
```

**Referencia CRITICA:** `.gemini/context/financial-rules.md` - Leitura obrigatoria

---

### Nao Duplicar Codigo/Funcionalidade

**Antes de criar qualquer novo componente/servico/funcao:**

- OK Pesquisar no codigo: `grep -r "palavraChave"`
- OK Consultar `ARCHITECTURE.md` (mapa de componentes)
- OK Verificar se nao existe solucao similar
- OK Se existir -> melhorar/evoluir o atual (nao duplicar)
- NO NUNCA criar fluxo novo sendo que ja existe

**Referencia:** `CHECKLIST_TODO_MASTER.md` - Anti-Pattern #2

---

## Planejamento de Fases

### Template Obrigatorio

**Para TODA nova fase:**

1. Criar `PLANO_FASE_XX_NOME.md` usando template de `IMPLEMENTATION_PLAN.md`
2. Ultra-Thinking: Analise profunda (nao planejar so baseado em docs)
3. Analisar TODOS artefatos relacionados (codigo + docs)
4. Code review do planejamento (antes de implementar)
5. Versionamento do plano (v1.0, v1.1, v2.0)

**Workflow:**

```
Planejamento (PLANO_FASE_XX.md)
    |
Code Review Aprovado
    |
Implementacao
    |
Validacao MCP Triplo
    |
VALIDACAO_FASE_XX.md
    |
Commit + Atualizar ROADMAP.md
```

**Referencia:** `IMPLEMENTATION_PLAN.md` - Template completo

---

## Documentacao Sempre Atualizada

### Arquivos que DEVEM ser atualizados em CADA fase:

| Arquivo | Quando Atualizar | Obrigatorio? |
|---------|------------------|--------------|
| **CLAUDE.md** / **GEMINI.md** | Novas regras/convencoes | OK SIM (sync obrigatorio) |
| **ARCHITECTURE.md** | Novos componentes/fluxos | OK SIM |
| **ROADMAP.md** | Fase completa | OK SIM |
| **CHANGELOG.md** | Mudancas notaveis | OK SIM |
| **KNOWN-ISSUES.md** | Novos issues conhecidos | OK SIM (se aplicavel) |
| **DATABASE_SCHEMA.md** | Novas entities/migrations | OK SIM (se aplicavel) |
| **INDEX.md** | Nova documentacao criada | IMPORTANTE |

### Onde Armazenar Novos Dados

**Consultar SEMPRE:** `ARCHITECTURE.md` secao "ONDE ARMAZENAR NOVOS DADOS"

**Tabela de decisao completa para:**
- Entities vs Campo JSON
- Onde criar novos endpoints
- Onde adicionar novas funcionalidades

---

## Critical Files Reference (Arquivos em .gemini/context/)

**IMPORTANTE:** Os arquivos abaixo estao em `.gemini/context/` mas sao **CRITICOS** para Claude Code:

### 1. Convencoes de Codigo

**Arquivo:** `.gemini/context/conventions.md`

**Conteudo:**
- Naming conventions (classes, files, variables, etc)
- Code style (indentation, quotes, semicolons)
- Imports organization
- Types vs Interfaces
- Git commit messages

**Quando consultar:** Antes de criar qualquer arquivo/classe/funcao nova

---

### 2. Regras de Dados Financeiros

**Arquivo:** `.gemini/context/financial-rules.md`

**Conteudo CRITICO:**
- Tipos de dados (Decimal vs Float)
- Precisao e arredondamento
- Timezone (America/Sao_Paulo)
- Cross-validation (minimo 3 fontes)
- Outlier detection
- Corporate actions (splits, dividends)

**Quando consultar:** Antes de trabalhar com QUALQUER dado financeiro

**LEITURA OBRIGATORIA - NAO-NEGOCIAVEL**

---

### 3. Known Issues (Problemas Conhecidos)

**Arquivo:** `.gemini/context/known-issues.md`

**Conteudo:**
- 9 issues documentados com root cause
- Solucoes aplicadas
- Licoes aprendidas
- Procedimentos de recuperacao
- Checklist de prevencao

**Quando consultar:**
- Antes de modificar Docker volumes
- Antes de trabalhar com scrapers
- Quando encontrar erro similar
- Antes de operacoes destrutivas

**Arquivo Publico (resumo):** `KNOWN-ISSUES.md` (raiz do projeto)

---

## Script de Gerenciamento

### system-manager.ps1

**Localizacao:** `system-manager.ps1` (raiz do projeto)

**Funcionalidades:**
- OK Check prerequisites (Docker, Node.js, etc)
- OK Start/Stop/Restart services
- OK Status de todos containers
- OK View logs
- OK Clean/rebuild
- OK Validacao de environment

**Uso Obrigatorio:**
- Antes de QUALQUER teste com MCPs
- Antes de validacao de frontend/backend
- Apos mudancas em docker-compose.yml
- Para verificar saude do ambiente

**Comando:**

```powershell
.\system-manager.ps1 status    # Ver status de todos servicos
.\system-manager.ps1 start     # Iniciar todos servicos
.\system-manager.ps1 restart   # Reiniciar servicos especificos
```

---

## Python Scrapers (Playwright)

### Arquitetura e Padrao Standardizado

**Localizacao:** `backend/python-scrapers/`

**Framework:** Playwright (migrado de Selenium em 2025-11-28)

**Scrapers ativos:** 2 (fundamentus, bcb)
**Scrapers aguardando migracao:** 24

### Padrao Obrigatorio - BeautifulSoup Single Fetch

**NO NUNCA fazer** (padrao antigo Selenium):
```python
# Multiplos await operations (lento, pode causar Exit 137)
tables = await page.query_selector_all("table")
for table in tables:
    rows = await table.query_selector_all("tr")
    for row in rows:
        cells = await row.query_selector_all("td")
        # ... multiplos awaits = LENTO
```

**OK SEMPRE fazer** (padrao novo Playwright + BeautifulSoup):
```python
from bs4 import BeautifulSoup

# Single HTML fetch (rapido, ~10x mais rapido)
html_content = await page.content()  # await #1 (UNICO)
soup = BeautifulSoup(html_content, 'html.parser')

# All operations local (sem await)
tables = soup.select("table")  # local
for table in tables:
    rows = table.select("tr")  # local
    for row in rows:
        cells = row.select("td")  # local
        # ... instantaneo!
```

### Regras Criticas

1. **Browser Individual** (nao compartilhado)
   - Cada scraper tem `self.playwright`, `self.browser`, `self.page`
   - Seguir padrao do backend TypeScript (`abstract-scraper.ts`)

2. **Wait Strategy**
   - OK Usar `wait_until='load'` (rapido)
   - NO EVITAR `wait_until='networkidle'` (analytics lentos = timeout)

3. **Cleanup Completo**
   - Sempre fechar: `page`, `browser`, `playwright` (nessa ordem)

4. **Performance**
   - Meta: <10s por scrape
   - Usar single HTML fetch + BeautifulSoup local parsing

### Arquivos Criticos

- **PLAYWRIGHT_SCRAPER_PATTERN.md** - Template e padrao standardizado (LEITURA OBRIGATORIA)
- **VALIDACAO_MIGRACAO_PLAYWRIGHT.md** - Validacao completa da migracao
- **ERROR_137_ANALYSIS.md** - Analise do Exit Code 137 (resolvido)
- **base_scraper.py** - Classe base (arquitetura Playwright)

### Quando Consultar

- **Antes de migrar qualquer scraper** -> Ler `PLAYWRIGHT_SCRAPER_PATTERN.md`
- **Erro Exit 137** -> Verificar se esta usando BeautifulSoup pattern
- **Scraper lento (>10s)** -> Verificar multiplos `await` operations
- **Container restarting** -> Verificar `main.py` imports (apenas scrapers migrados)

### Testing

```bash
# Test individual scraper
docker exec invest_scrapers python test_fundamentus.py
docker exec invest_scrapers python test_bcb.py

# Check container status
docker logs invest_scrapers --tail 50

# Restart scrapers service
docker-compose restart scrapers
```

---

## Gemini 3 Pro - Protocolo de Segunda Opiniao (Advisor)

### Arquitetura de Integracao

```
+---------------------------------------------------------------------+
|                    MODELO DE DECISAO HIBRIDO                        |
+---------------------------------------------------------------------+
|                                                                     |
|   +-----------------+         +-----------------+                   |
|   |  CLAUDE CODE    | ------> |  GEMINI 3 PRO   |                   |
|   |  (DECISOR)      | consulta|  (ADVISOR)      |                   |
|   |                 | <------ |                 |                   |
|   |  - Implementa   | opiniao |  - Analisa      |                   |
|   |  - Decide       |         |  - Sugere       |                   |
|   |  - Executa      |         |  - NAO executa  |                   |
|   +-----------------+         +-----------------+                   |
|          |                                                          |
|          v                                                          |
|   +-----------------+                                               |
|   | DECISAO FINAL   | <-- Claude SEMPRE tem autoridade final        |
|   | (CLAUDE CODE)   |                                               |
|   +-----------------+                                               |
|                                                                     |
+---------------------------------------------------------------------+
```

**Principio Fundamental:**
- Claude Code = **DECISOR** (autoridade final, implementador)
- Gemini 3 Pro = **ADVISOR** (consultor, segunda opiniao, SEM poder de execucao)

### MCP Instalado

**Server:** `gemini-advisor` via `gemini-mcp-tool-windows-fixed`
**Status:** Ativo e conectado
**Modelo:** `gemini-3-pro-preview` (usar com parametro model)
**Modelos disponiveis:** `gemini-3-pro-preview` (melhor), `gemini-2.5-pro`, `gemini-2.5-flash`
**Context window:** 1M tokens

### Quando Claude DEVE Consultar Gemini

| Cenario | Prioridade | Justificativa |
|---------|------------|---------------|
| Dados financeiros criticos | **ALTA** | Taxa de alucinacao Claude 12% vs Gemini 88% - Claude mais preciso, mas segunda opiniao reduz risco |
| Analise de codebase grande (>50 arquivos) | **ALTA** | Gemini tem 1M tokens vs 200K Claude |
| Decisoes arquiteturais | **MEDIA** | Perspectiva diferente pode revelar blind spots |
| Refatoracao > 5 arquivos | **MEDIA** | Validar impacto em arquivos relacionados |
| Escolha entre alternativas | **MEDIA** | Debate de pros/cons |
| Debugging complexo | **BAIXA** | Claude e superior (80.9% vs 76.2% SWE-bench) |
| Tarefas < 50 linhas | **NAO CONSULTAR** | Overhead nao compensa |

### Quando Claude NAO DEVE Consultar Gemini

- Bug fixes simples (Claude e melhor em debugging)
- Tarefas triviais (< 50 linhas de codigo)
- Quando ja tem certeza da solucao
- Prototipagem rapida (adiciona latencia desnecessaria)
- Codigo que precisa de precisao absoluta (Claude tem menor taxa de alucinacao)

### Limitacoes Conhecidas do Gemini 3 Pro (CRITICO)

**Claude DEVE considerar estas limitacoes ao interpretar respostas do Gemini:**

| Limitacao | Impacto | Como Claude Deve Tratar |
|-----------|---------|-------------------------|
| **Taxa de alucinacao 88%** | Pode afirmar coisas incorretas | Verificar SEMPRE com codigo fonte |
| **Afirma "corrigido" quando nao esta** | Falso positivo em validacoes | Testar manualmente apos sugestao |
| **Over-optimization** | Muda codigo que foi especificado | Ignorar se contradiz requisitos |
| **Infinite loops em edicao** | Pode travar em old_string not found | Nao usar para edicao direta |
| **Instabilidade em picos** | Provider overload errors | Retry ou prosseguir sem consulta |
| **Hallucina estruturas cross-language** | Inventa models Java em projeto Python | Validar linguagem correta |

**Fontes:**
- [Gemini 3 Pro Hallucination Rate - The Decoder](https://the-decoder.com/gemini-3-pro-tops-new-ai-reliability-benchmark-but-hallucination-rates-remain-high/)
- [GitHub Issues - google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli/issues)

### Protocolo de Consulta Inteligente

**Workflow Recomendado com Sequential Thinking + Gemini:**

```
1. Claude inicia Sequential Thinking
   |
2. Durante analise, Claude identifica necessidade de segunda opiniao
   |
3. Claude formula pergunta ESPECIFICA e CONTEXTUALIZADA para Gemini
   |
4. Gemini retorna analise/sugestao
   |
5. Claude AVALIA criticamente a resposta considerando limitacoes
   |
6. Claude DECIDE (aceita, rejeita ou adapta sugestao)
   |
7. Claude IMPLEMENTA a decisao final
   |
8. Claude valida com Zero Tolerance (tsc, build, lint)
```

### Como Formular Consultas ao Gemini

**Template de Consulta Efetiva:**

```markdown
CONTEXTO:
- Projeto: [descrever brevemente]
- Stack: [tecnologias]
- Arquivos envolvidos: [listar]

SITUACAO:
[Descrever o problema/decisao de forma clara]

CODIGO RELEVANTE:
[Incluir trechos especificos - Gemini tem 1M tokens]

PERGUNTA ESPECIFICA:
[Uma pergunta clara e objetiva]

RESTRICOES:
[Listar restricoes que Gemini deve respeitar]
```

**Exemplo de Consulta Bem Formulada:**

```markdown
CONTEXTO:
- Projeto: B3 AI Analysis Platform
- Stack: NestJS + TypeORM + PostgreSQL
- Arquivo: backend/src/scrapers/scrapers.service.ts

SITUACAO:
Estou implementando cross-validation de dados financeiros.
Preciso decidir entre usar media ou mediana para consolidar valores de 6 fontes.

CODIGO RELEVANTE:
[codigo do metodo atual]

PERGUNTA ESPECIFICA:
Qual abordagem e mais robusta para dados financeiros B3:
1. Media com outlier detection (threshold 10%)
2. Mediana (naturalmente resistente a outliers)

RESTRICOES:
- Deve manter precisao Decimal (nao Float)
- Minimo 3 fontes concordando
- Timezone America/Sao_Paulo
```

### Interpretando Respostas do Gemini

**Claude DEVE aplicar este filtro critico:**

1. **Verificar facticidade:** Gemini afirmou algo? Validar no codigo fonte
2. **Checar consistencia:** Sugestao contradiz regras do projeto? Ignorar
3. **Avaliar completude:** Resposta considera todas restricoes? Complementar se necessario
4. **Testar viabilidade:** Sugestao e implementavel? Simular antes de aplicar
5. **Documentar decisao:** Registrar por que aceitou/rejeitou sugestao

**Padrao de Documentacao:**

```markdown
## Consulta Gemini: [titulo]
**Data:** YYYY-MM-DD
**Contexto:** [breve descricao]

### Pergunta
[pergunta formulada]

### Resposta Gemini
[resumo da resposta]

### Avaliacao Claude
- Pontos aceitos: [lista]
- Pontos rejeitados: [lista com justificativa]
- Adaptacoes: [modificacoes feitas]

### Decisao Final
[o que foi implementado e por que]
```

### Integracao com MCPs Existentes

**Combinacao Recomendada:**

| Fase | MCPs a Usar | Ordem |
|------|-------------|-------|
| Ultra-Thinking | Sequential Thinking + Gemini (se complexo) | 1. ST analisa -> 2. Gemini opina -> 3. ST decide |
| Analise de Contexto | Filesystem + Gemini | 1. FS le arquivos -> 2. Gemini analisa contexto grande |
| Code Review | Gemini + Sequential Thinking | 1. Gemini revisa -> 2. ST avalia criticas |
| Validacao | Shell + Chrome DevTools | SEM Gemini (validacao objetiva) |
| Implementacao | Filesystem + Shell | SEM Gemini (Claude implementa sozinho) |

### Anti-Patterns (NUNCA FAZER)

| Anti-Pattern | Por que e Ruim | O que Fazer |
|--------------|----------------|-------------|
| Delegar decisao ao Gemini | Claude perde controle | Claude sempre decide |
| Aceitar sugestao sem validar | Gemini alucina 88% | Verificar no codigo |
| Consultar para tarefas triviais | Overhead desnecessario | Resolver diretamente |
| Pedir para Gemini implementar | Gemini nao executa | Claude implementa |
| Ignorar limitacoes documentadas | Bugs e inconsistencias | Consultar tabela de limitacoes |
| Consultar sem contexto | Resposta generica inutil | Usar template de consulta |

### Metricas de Uso

**Claude deve registrar internamente:**

- Consultas ao Gemini por sessao
- Taxa de aceitacao de sugestoes
- Sugestoes rejeitadas e motivo
- Tempo economizado vs overhead

**Meta:** Consultar Gemini em ~20-30% das tarefas complexas, com taxa de utilidade >70%

---

## Additional Documentation

### Core Documentation (Raiz do Projeto)

- **README.md** - Overview do projeto, quick start, stack tecnologico, installation guide
- **ARCHITECTURE.md** - Arquitetura completa, fluxos, onde armazenar novos dados
- **DATABASE_SCHEMA.md** - Schema completo, relacionamentos, indexes
- **INSTALL.md** - Instalacao completa (Docker, portas, env vars)
- **TROUBLESHOOTING.md** - 16+ problemas comuns com solucoes
- **ROADMAP.md** - Historico de 60+ fases completas
- **CHANGELOG.md** - Mudancas notaveis versionadas
- **INDEX.md** - Indice mestre de toda documentacao (200+ arquivos)
- **KNOWN-ISSUES.md** - Issues conhecidos (resumo executivo)
- **IMPLEMENTATION_PLAN.md** - Template de planejamento de fases
- **VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md** - Compliance de regras
- **VALIDACAO_DOCUMENTACAO_CLAUDE_CODE.md** - Validacao de acessibilidade de docs pelo Claude Code

### Python Scrapers Documentation

- **backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md** - Template e padrao standardizado (LEITURA OBRIGATORIA)
- **backend/python-scrapers/VALIDACAO_MIGRACAO_PLAYWRIGHT.md** - Relatorio completo de validacao
- **backend/python-scrapers/ERROR_137_ANALYSIS.md** - Analise tecnica Exit Code 137 (resolvido)
- **backend/python-scrapers/MIGRATION_REPORT.md** - Status de migracao de todos scrapers
- **backend/python-scrapers/SELENIUM_TO_PLAYWRIGHT_MIGRATION.md** - Guia de migracao

### Gemini Context Files (Leitura Obrigatoria)

- **.gemini/context/conventions.md** - Convencoes de codigo
- **.gemini/context/financial-rules.md** - Regras de dados financeiros (CRITICO)
- **.gemini/context/known-issues.md** - Analise tecnica de issues

### Process Documentation

- **CHECKLIST_TODO_MASTER.md** - Checklist ultra-robusto antes de cada fase
- **CHECKLIST_CODE_REVIEW_COMPLETO.md** - Code review obrigatorio
- **METODOLOGIA_MCPS_INTEGRADA.md** - Integracao MCPs + Ultra-Thinking + TodoWrite
- **MCPS_USAGE_GUIDE.md** - Guia tecnico dos 8 MCPs
