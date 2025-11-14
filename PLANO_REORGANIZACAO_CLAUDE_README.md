# Plano de Reorganização - claude.md e README.md

**Data:** 2025-11-14
**Responsável:** Claude Code (Sonnet 4.5)
**Objetivo:** Reorganizar arquivos seguindo melhores práticas oficiais

---

## 📊 ANÁLISE DA SITUAÇÃO ATUAL

### claude.md - Situação Atual
- **Tamanho:** 2001 linhas (80KB)
- **Seções:** 108 seções principais
- **Problema:** ❌ **MUITO LONGO** - Excede 10x a recomendação oficial (100-200 linhas)

### README.md - Situação Atual
- **Tamanho:** 799 linhas (28KB)
- **Seções:** 50+ seções
- **Problema:** ❌ Conteúdo misturado (público + interno)

---

## 🎯 MELHORES PRÁTICAS PESQUISADAS

### 📘 CLAUDE.md (Fonte: Anthropic Official)

**Tamanho Recomendado:**
- ✅ **100-200 linhas máximo** (sweet spot)
- ❌ Evitar arquivos extensos sem iteração

**O que INCLUIR:**
- Comandos bash comuns
- Estilo de código
- Workflow de desenvolvimento
- Convenções do repositório (branches, merge)
- Setup de ambiente (pyenv, compiladores)
- Comportamentos inesperados/avisos específicos do projeto

**O que EVITAR:**
- Informações que não impactam decisões de código do Claude
- Redundância com outras documentações
- Excesso de conteúdo sem validação

**Estrutura Recomendada:**
```markdown
# Project Name

## Tech Stack
(frameworks, languages, tools)

## Project Structure
(directory purposes)

## Commands
(build, test, deploy)

## Code Style
(formatting conventions)

## Workflow
(development process)

## Do Not
(restrictions and boundaries)
```

**Refinamento:**
- Usar marcadores de ênfase: "IMPORTANT", "YOU MUST"
- Tratar como prompt frequente (refinar continuamente)
- Mover detalhes para arquivos por pasta se necessário

---

### 📗 README.md (Fonte: GitHub Community Best Practices)

**Seções Essenciais:**
1. **Name** - Título auto-explicativo
2. **Description** - O que o projeto faz + diferencial
3. **Installation** - Passo-a-passo de setup
4. **Usage** - Exemplos com output esperado
5. **Contributing** - Guidelines de colaboração
6. **License** - Licença open source

**Seções Adicionais Valiosas:**
- Badges (status, versão, etc.)
- Visuals (screenshots, GIFs, vídeos)
- Support (onde buscar ajuda)
- Roadmap (planos futuros)
- Authors/Acknowledgment
- Project Status

**Princípios:**
- ✅ "Too long is better than too short" - priorizar completude
- ✅ Abundância de exemplos com output esperado
- ✅ Separar CONTRIBUTING.md se extenso
- ✅ Usar Markdown padrão
- ✅ Primeira impressão do projeto

---

## 🚨 PROBLEMAS IDENTIFICADOS

### claude.md (2001 linhas - 10x acima do recomendado)

**Problemas Críticos:**
1. ❌ **Excesso de Detalhes Técnicos** (linhas 319-424)
   - Entidades de banco completas (Assets, AssetPrices, Analyses, etc.)
   - Indexes SQL
   - **Solução:** Mover para `DATABASE_SCHEMA.md` separado

2. ❌ **Documentação Extensa de Scrapers** (linhas 425-503)
   - 31 fontes listadas com detalhes
   - Estatísticas completas
   - **Solução:** Mover para `DOCUMENTACAO_SCRAPERS_COMPLETA.md` (já existe)

3. ❌ **Fluxos Principais Detalhados** (linhas 563-625)
   - 3 fluxos com código completo
   - **Solução:** Mover para `ARCHITECTURE.md` ou `TECHNICAL_GUIDE.md`

4. ❌ **Roadmap Completo** (linhas 802-1000+)
   - Histórico de 24 fases
   - **Solução:** Manter resumo, detalhes em `ROADMAP.md` separado

5. ❌ **Troubleshooting Extenso** (linhas 1400-1550+)
   - 6+ problemas detalhados
   - **Solução:** Mover para `TROUBLESHOOTING.md`

6. ❌ **Metodologia Completa** (linhas 630-800)
   - 10 seções detalhadas
   - **Solução:** Já existe `METODOLOGIA_MCPS_INTEGRADA.md` - apenas referenciar

**Conteúdo Duplicado:**
- MCPs documentados em 3 lugares (claude.md + MCPS_USAGE_GUIDE.md + METODOLOGIA_MCPS_INTEGRADA.md)
- Arquitetura duplicada (claude.md + README.md)

### README.md (799 linhas - OK mas com melhorias)

**Problemas Menores:**
1. ⚠️ **Seção de Metodologia Muito Técnica** (linhas 515-713)
   - Detalhes de workflow interno (Ultra-Thinking + TodoWrite)
   - **Solução:** Resumir ou mover para doc interno

2. ⚠️ **Falta de Badges** no topo
   - **Solução:** Adicionar badges (build status, license, version)

3. ⚠️ **Falta de Screenshots/Visuals**
   - **Solução:** Adicionar na seção "Características"

4. ⚠️ **Getting Started muito longo** (linhas 171-282)
   - **Solução:** Simplificar, mover detalhes para INSTALL.md

---

## ✅ PLANO DE REORGANIZAÇÃO

### FASE 1: Reorganizar claude.md (2001 → 150-200 linhas)

**Estrutura Nova (Baseada em Best Practices):**

```markdown
# Claude.md - B3 AI Analysis Platform

**Versão:** 1.0.0
**Última Atualização:** 2025-11-14

---

## 📑 QUICK REFERENCE

### Tech Stack
- Backend: NestJS 10 + TypeScript 5 + TypeORM
- Frontend: Next.js 14 (App Router) + TypeScript 5 + Shadcn/ui
- Database: PostgreSQL 16 + Redis 7
- Scrapers: Python 3.11 + Playwright
- MCPs: 8 servers (Sequential Thinking, Filesystem, Shell, A11y, Context7, Playwright, Chrome DevTools, Selenium)

### Project Structure
- `backend/` - NestJS API + Services
- `frontend/` - Next.js App Router
- `api-service/` - Python FastAPI scrapers
- `METODOLOGIA_MCPS_INTEGRADA.md` - Complete workflow methodology
- `MCPS_USAGE_GUIDE.md` - Technical MCP guide

### Ports
- Frontend: 3100
- Backend: 3101
- PostgreSQL: 5532
- Redis: 6479
- PgAdmin: 5150

---

## 🚀 QUICK COMMANDS

### Development
```bash
# Start all services
docker-compose up -d

# Backend dev
cd backend && npm run start:dev

# Frontend dev
cd frontend && npm run dev

# Run migrations
cd backend && npm run migration:run
```

### Testing & Validation
```bash
# TypeScript validation (MANDATORY before commit)
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build validation (MANDATORY before commit)
cd backend && npm run build
cd frontend && npm run build

# Tests
cd backend && npm run test
cd frontend && npx playwright test
```

---

## 📐 CODE STYLE & CONVENTIONS

### Naming Conventions
- **Classes:** `PascalCase` (ex: `AssetService`)
- **Files:** `kebab-case` (ex: `asset.service.ts`)
- **Variables/Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Imports:** Absolute paths usando `@` aliases

### Git Workflow
- **Branches:** `main`, `develop`, `feature/nome`, `fix/nome`
- **Commits:** Conventional Commits + co-autoria Claude
- **Format:** `<tipo>: <descrição>\n\n<corpo>\n\nCo-Authored-By: Claude <noreply@anthropic.com>`
- **Tipos:** feat, fix, docs, refactor, test, chore, perf

---

## 🤖 METODOLOGIA OBRIGATÓRIA

**IMPORTANT:** Este projeto segue metodologia rigorosa Ultra-Thinking + TodoWrite + MCPs.

### Ultra-Thinking (Análise Profunda)
✅ **SEMPRE** ler arquivos relacionados ANTES de modificar
✅ **SEMPRE** analisar impacto (arquivos afetados)
✅ **SEMPRE** planejar (documento se > 100 linhas)
❌ **NUNCA** implementar sem planejar (exceto < 5 linhas triviais)

### TodoWrite (Organização)
✅ **SEMPRE** usar para tarefas não-triviais (≥ 3 etapas)
✅ **SEMPRE** ter apenas 1 todo `in_progress` por vez
✅ **SEMPRE** marcar `completed` imediatamente após concluir
❌ **NUNCA** acumular etapas antes de marcar completed

### Validação OBRIGATÓRIA (ZERO TOLERANCE)
```bash
# MUST pass BEFORE commit:
cd backend && npx tsc --noEmit    # 0 errors
cd frontend && npx tsc --noEmit   # 0 errors
cd backend && npm run build       # Success
cd frontend && npm run build      # Success (17 pages)
```

### MCPs - 8 Novas Regras (18-25)
- **Regra 18:** ✅ Sequential Thinking para análise complexa (> 5 decisões)
- **Regra 19:** ✅ Filesystem MCP para operações multi-arquivo (> 3 arquivos)
- **Regra 20:** ✅ Shell MCP para validações obrigatórias (tsc, build)
- **Regra 21:** ✅ A11y MCP para validar acessibilidade de novas páginas
- **Regra 22:** ✅ Context7 para documentação de frameworks
- **Regra 23:** ✅ Playwright/Chrome DevTools para validação frontend
- **Regra 24:** ✅ Combinar Sequential Thinking + Filesystem em refatorações
- **Regra 25:** ❌ **NUNCA** substituir Ultra-Thinking/TodoWrite com MCPs (apenas APOIAR)

**Princípio Fundamental:**
```
MCPs são ferramentas de APOIO, não de SUBSTITUIÇÃO.
Ultra-Thinking + TodoWrite continuam OBRIGATÓRIOS.
```

---

## 📚 DOCUMENTAÇÃO DETALHADA

Para informações detalhadas, consulte:

- **`METODOLOGIA_MCPS_INTEGRADA.md`** (1128 linhas) - Metodologia completa + workflows
- **`MCPS_USAGE_GUIDE.md`** (855 linhas) - Guia técnico de MCPs
- **`DATABASE_SCHEMA.md`** - Schema completo do banco de dados
- **`ARCHITECTURE.md`** - Arquitetura detalhada e fluxos
- **`ROADMAP.md`** - Histórico completo de fases
- **`TROUBLESHOOTING.md`** - Problemas comuns e soluções
- **`README.md`** - Documentação pública do projeto

**IMPORTANTE:** Arquivos grandes (> 20KB) aparecerão como "too large to include". Use `Read` tool com offset/limit quando necessário.

---

## ⚠️ DO NOT / RESTRICTIONS

### Security
❌ **NEVER** commit .env files
❌ **NEVER** hardcode credentials
❌ **NEVER** use force push to main/master

### Code Quality
❌ **NEVER** commit with TypeScript errors
❌ **NEVER** commit with build failures
❌ **NEVER** skip validations (checklist obrigatório)

### MCPs
❌ **NEVER** use MCPs to replace Ultra-Thinking/TodoWrite
❌ **NEVER** implement without planning (except trivial < 5 lines)

---

## 🔍 CURRENT PROJECT STATUS

**Fase Atual:** FASE 23 - Sistema de Métricas de Scrapers ✅ 100% COMPLETO
**Frontend:** 7 páginas validadas (Dashboard, Assets, Analysis, Portfolio, Reports, Data Sources, Settings)
**Backend:** 6 scrapers funcionais (Fundamentus, BRAPI, Status Invest, Investidor10, Fundamentei, Investsite)
**MCPs:** 8 servidores instalados e integrados (100% Connected)
**Validação:** MCP Triplo completa - 100% aprovado

Ver `ROADMAP.md` para histórico completo.

---

**Mantido por:** Claude Code (Sonnet 4.5)
**Última Validação:** 2025-11-14
```

**Arquivos a CRIAR (separar conteúdo):**
1. `DATABASE_SCHEMA.md` - Schema completo (entidades, indexes, migrations)
2. `ARCHITECTURE.md` - Arquitetura detalhada + fluxos principais
3. `ROADMAP.md` - Histórico completo de 24 fases
4. `TROUBLESHOOTING.md` - Problemas comuns e soluções

**Linhas Reduzidas:** 2001 → ~200 linhas (90% de redução) ✅

---

### FASE 2: Reorganizar README.md (799 → 600-700 linhas)

**Melhorias:**

1. **Adicionar Badges** (topo)
```markdown
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-Private-red)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)]()
[![Next.js](https://img.shields.io/badge/next.js-14.x-black)]()
[![NestJS](https://img.shields.io/badge/nestjs-10.x-red)]()
```

2. **Adicionar Screenshots** (após Características)
```markdown
## 📸 Screenshots

![Dashboard](./docs/screenshots/dashboard.png)
*Dashboard principal com análises em tempo real*

![Portfolio](./docs/screenshots/portfolio.png)
*Gerenciamento de portfólio consolidado*
```

3. **Simplificar Getting Started**
- Manter apenas "Quick Start" (Docker)
- Mover instalação detalhada para `INSTALL.md`

4. **Remover/Resumir Metodologia Interna**
- Mover detalhes para `CONTRIBUTING.md`
- Manter apenas: "Este projeto utiliza metodologia Claude Code + MCPs"

5. **Estrutura Final:**
```markdown
# B3 AI Analysis Platform

[Badges]

## 📖 Descrição
(O que é, diferencial, objetivo)

## ✨ Características
(Features principais + screenshots)

## 🚀 Quick Start
(Docker comando único)

## 📚 Documentação
(Links organizados)

## 🛠️ Tecnologias
(Stack resumido)

## 📊 Status do Projeto
(Métricas atuais)

## 🤝 Contribuindo
(Ver CONTRIBUTING.md)

## 📝 Licença
(Privado)

## 📞 Suporte
(Como conseguir ajuda)
```

**Linhas Reduzidas:** 799 → ~600 linhas (25% de redução)

---

## 📦 NOVOS ARQUIVOS A CRIAR

### 1. DATABASE_SCHEMA.md
**Conteúdo:**
- Entidades completas (Assets, AssetPrices, Analyses, etc.)
- Relacionamentos
- Indexes
- Migrations
- Seeds

**Fonte:** claude.md linhas 319-424

### 2. ARCHITECTURE.md
**Conteúdo:**
- Arquitetura geral
- Camadas da aplicação
- Fluxos principais (3 fluxos detalhados)
- Integrações

**Fonte:** claude.md linhas 42-92, 563-625

### 3. ROADMAP.md
**Conteúdo:**
- Histórico completo de 24 fases
- Status atual
- Próximos passos
- Métricas de progresso

**Fonte:** claude.md linhas 802-1400

### 4. TROUBLESHOOTING.md
**Conteúdo:**
- Problemas comuns (6+ casos)
- Sintomas
- Soluções passo-a-passo
- Comandos de debug

**Fonte:** claude.md linhas 1400-1550

### 5. CONTRIBUTING.md
**Conteúdo:**
- Metodologia de desenvolvimento
- Code review process
- Como contribuir
- Pull request guidelines

**Fonte:** README.md linhas 515-713

### 6. INSTALL.md
**Conteúdo:**
- Instalação detalhada (Docker + Local)
- Requisitos
- Troubleshooting de instalação
- Configuração de ambiente

**Fonte:** README.md linhas 171-282

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: claude.md
- [ ] Criar DATABASE_SCHEMA.md (extrair linhas 319-424)
- [ ] Criar ARCHITECTURE.md (extrair linhas 42-92, 563-625)
- [ ] Criar ROADMAP.md (extrair linhas 802-1400)
- [ ] Criar TROUBLESHOOTING.md (extrair linhas 1400-1550)
- [ ] Reescrever claude.md (150-200 linhas, estrutura nova)
- [ ] Validar TypeScript (0 erros)
- [ ] Commit: "refactor: Reorganizar claude.md seguindo best practices Anthropic"

### FASE 2: README.md
- [ ] Criar CONTRIBUTING.md (extrair linhas 515-713)
- [ ] Criar INSTALL.md (extrair linhas 171-282)
- [ ] Adicionar badges no topo
- [ ] Adicionar screenshots (criar pasta docs/screenshots)
- [ ] Simplificar Getting Started
- [ ] Resumir Metodologia
- [ ] Validar TypeScript (0 erros)
- [ ] Commit: "docs: Reorganizar README.md seguindo best practices GitHub"

### FASE 3: Validação Final
- [ ] Testar leitura de claude.md pelo Claude Code
- [ ] Verificar que documentação separada está acessível
- [ ] Validar links entre documentos
- [ ] Atualizar ÍNDICE em claude.md e README.md
- [ ] Commit: "docs: Finalizar reorganização de documentação"

---

## 📊 COMPARAÇÃO ANTES/DEPOIS

| Arquivo | ANTES | DEPOIS | Redução |
|---------|-------|--------|---------|
| **claude.md** | 2001 linhas | ~200 linhas | **90%** ✅ |
| **README.md** | 799 linhas | ~600 linhas | **25%** |
| **TOTAL** | 2800 linhas | 800 linhas | **71%** |

**Novos Arquivos:** 6 (DATABASE_SCHEMA.md, ARCHITECTURE.md, ROADMAP.md, TROUBLESHOOTING.md, CONTRIBUTING.md, INSTALL.md)

**Benefícios:**
- ✅ claude.md dentro do tamanho recomendado (100-200 linhas)
- ✅ Informações organizadas por contexto
- ✅ Fácil navegação e manutenção
- ✅ Redução de consumo de tokens
- ✅ README.md mais focado para público externo
- ✅ Separação clara entre docs públicas e internas

---

**Próximo Passo:** Implementar FASE 1 (reorganização claude.md)
