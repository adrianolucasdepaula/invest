# 📚 Índice de Documentação - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-12-13
**Versão:** 1.17.0

---

## 🎯 START HERE (Novos Desenvolvedores)

| Arquivo                                            | Descrição                                 | Essencial   |
| -------------------------------------------------- | ----------------------------------------- | ----------- |
| [README.md](README.md)                             | Overview do projeto                       | ✅ SIM      |
| [INSTALL.md](INSTALL.md)                           | Instalação completa (Docker, portas, env) | ✅ SIM      |
| [GETTING_STARTED.md](GETTING_STARTED.md)           | Primeiros passos                          | ✅ SIM      |
| Arquivo                                            | Descrição                                 | Categoria   |
| -------------------------------------------------- | ---------------------------------         | ----------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Arquitetura completa do sistema           | Estrutural  |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)           | Schema completo do banco de dados         | Estrutural  |
| [DATA_SOURCES.md](DATA_SOURCES.md)                 | Fontes de dados e scrapers                | Integrações |
| [BMAD_METHOD_ANALYSIS.md](BMAD_METHOD_ANALYSIS.md) | Análise do método BMAD                    | Financeiro  |

---

## 📋 DESENVOLVIMENTO & PLANEJAMENTO

### Roadmap & Fases

| Arquivo                                                        | Descrição                                         | Status                   |
| -------------------------------------------------------------- | ------------------------------------------------- | ------------------------ |
| [ROADMAP.md](ROADMAP.md)                                       | **Histórico completo** (60+ fases, 100% completo) | ✅ Atualizado 2025-11-29 |
| [NEXT_STEPS.md](NEXT_STEPS.md)                                 | Próximos passos planejados                        | ⚠️ Consultar ROADMAP     |
| [PROXIMO_PASSO_APOS_FASE_30.md](PROXIMO_PASSO_APOS_FASE_30.md) | Decisões pós-FASE 30                              | 📜 Histórico             |

### Planejamento de Fases

| Arquivo Pattern          | Exemplo                                                                            | Descrição               |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------- |
| `FASE_XX_*.md`           | [FASE_34_GUIA_COMPLETO.md](FASE_34_GUIA_COMPLETO.md)                               | Guias completos de fase |
| `PLANO_FASE_XX_*.md`     | [PLANO_FASE_36_3_TRADINGVIEW_PAGE.md](PLANO_FASE_36_3_TRADINGVIEW_PAGE.md)         | Planejamentos de fase   |
| `CHECKLIST_FASE_XX_*.md` | [CHECKLIST_FASE_33_VALIDACAO_COMPLETA.md](CHECKLIST_FASE_33_VALIDACAO_COMPLETA.md) | Checklists de validação |

---

## 📝 CONVENÇÕES & REGRAS

| Arquivo                                                                      | Descrição                             | Criticidade   |
| ---------------------------------------------------------------------------- | ------------------------------------- | ------------- |
| **[.gemini/context/conventions.md](.gemini/context/conventions.md)**         | **Convenções de código completas**    | 🔥 CRÍTICO    |
| **[.gemini/context/financial-rules.md](.gemini/context/financial-rules.md)** | **Regras dados financeiros**          | 🔥 CRÍTICO    |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                           | Git workflow, decisões técnicas       | ⚠️ IMPORTANTE |
| [CHECKLIST_TODO_MASTER.md](CHECKLIST_TODO_MASTER.md)                         | Checklist ultra-robusto e TODO master | ⚠️ IMPORTANTE |
| [CHECKLIST_CODE_REVIEW_COMPLETO.md](CHECKLIST_CODE_REVIEW_COMPLETO.md)       | Code review antes de cada fase        | ⚠️ IMPORTANTE |

---

## 🔧 TROUBLESHOOTING & BUGFIXES

### Guia Principal

| Arquivo                                  | Descrição                             | Problemas Documentados                                   |
| ---------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | **16+ problemas comuns com soluções** | Backend, Frontend, Scrapers, Database, Docker, WebSocket |

### Bugfixes Documentados

| Arquivo Pattern | Exemplos                                                               |
| --------------- | ---------------------------------------------------------------------- |
| `BUGFIX_*.md`   | [BUGFIX_DEFINITIVO_2025-11-22.md](BUGFIX_DEFINITIVO_2025-11-22.md)     |
| `BUG_*.md`      | [BUG_CRITICO_DOCKER_DIST_CACHE.md](BUG_CRITICO_DOCKER_DIST_CACHE.md)   |
| `CORRECAO_*.md` | [CORRECAO_BUG_ANALISE_DUPLICADA.md](CORRECAO_BUG_ANALISE_DUPLICADA.md) |

---

## 💰 FINANCEIRO (PRECISÃO ABSOLUTA)

| Arquivo                                                                      | Descrição                                    | Criticidade   |
| ---------------------------------------------------------------------------- | -------------------------------------------- | ------------- |
| **[.gemini/context/financial-rules.md](.gemini/context/financial-rules.md)** | **Regras obrigatórias p/ dados financeiros** | 🔥 CRÍTICO    |
| [BMAD_METHOD_ANALYSIS.md](BMAD_METHOD_ANALYSIS.md)                           | Análise do método BMAD                       | ⚠️ IMPORTANTE |
| [ESTRATEGIA_COTAHIST_BRAPI_HIBRIDO.md](ESTRATEGIA_COTAHIST_BRAPI_HIBRIDO.md) | Estratégia de dados históricos               | ⚠️ IMPORTANTE |

**Princípios:**

- ✅ Cross-validation 3+ fontes
- ✅ Decimal (não Float) para valores monetários
- ✅ Timezone: America/Sao_Paulo
- ❌ NUNCA arredondar/manipular dados financeiros

---

## 🎯 WHEEL STRATEGY (FASES 101-108)

| Arquivo                                                                                                | Descrição                                     | Criticidade   |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------- |
| **[docs/WHEEL_ECOSYSTEM_ANALYSIS_2025-12-13.md](docs/WHEEL_ECOSYSTEM_ANALYSIS_2025-12-13.md)**         | **Análise completa do ecossistema WHEEL**     | 🔥 CRÍTICO    |
| [backend/src/api/wheel/](backend/src/api/wheel/)                                                       | Controller + Service + DTOs                   | ⚠️ IMPORTANTE |
| [backend/src/database/entities/wheel-strategy.entity.ts](backend/src/database/entities/wheel-strategy.entity.ts) | Entity WheelStrategy                | ⚠️ IMPORTANTE |
| [backend/src/database/entities/wheel-trade.entity.ts](backend/src/database/entities/wheel-trade.entity.ts) | Entity WheelTrade                        | ⚠️ IMPORTANTE |
| [frontend/src/lib/hooks/use-wheel.ts](frontend/src/lib/hooks/use-wheel.ts)                             | Hooks React Query para WHEEL                  | ⚠️ IMPORTANTE |

**Endpoints (15):**

- `GET /wheel/candidates` - Lista candidatos para WHEEL
- `GET /wheel/strategies` - Lista estratégias do usuário
- `POST /wheel/strategies` - Cria nova estratégia
- `GET /wheel/strategies/:id` - Detalhes de uma estratégia
- `PUT /wheel/strategies/:id` - Atualiza estratégia
- `DELETE /wheel/strategies/:id` - Remove estratégia
- `GET /wheel/strategies/:id/trades` - Lista trades
- `POST /wheel/strategies/:id/trades` - Cria trade
- `PUT /wheel/trades/:id/close` - Fecha trade
- `GET /wheel/strategies/:id/put-recommendations` - Recomendações de PUT
- `GET /wheel/strategies/:id/call-recommendations` - Recomendações de CALL
- `GET /wheel/strategies/:id/weekly-schedule` - Schedule semanal
- `GET /wheel/strategies/:id/analytics` - Analytics
- `GET /wheel/cash-yield` - Cálculo de rendimento do caixa

---

## 📊 VALIDAÇÃO & TESTES

### Framework de Validação

| Arquivo                                                                                | Descrição                                 |
| -------------------------------------------------------------------------------------- | ----------------------------------------- |
| [FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md](FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md) | Framework universal de validação frontend |
| [GUIA_DEFINITIVO_VALIDACAO_FRONTEND.md](GUIA_DEFINITIVO_VALIDACAO_FRONTEND.md)         | Guia definitivo de validação              |

### Validações de Fases

| Arquivo Pattern       | Exemplos                                                                                                 | Total        |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------ |
| `VALIDACAO_FASE_*.md` | [VALIDACAO_FASE_48_NETWORK_SLOW3G_2025-11-23.md](VALIDACAO_FASE_48_NETWORK_SLOW3G_2025-11-23.md)         | 50+ arquivos |
| `VALIDACAO_*.md`      | [VALIDACAO_PRECISAO_DADOS_FINANCEIROS_2025-11-23.md](VALIDACAO_PRECISAO_DADOS_FINANCEIROS_2025-11-23.md) |              |

---

## 🚀 INSTALAÇÃO & DEPLOYMENT

| Arquivo                                      | Descrição                                          | Categoria       |
| -------------------------------------------- | -------------------------------------------------- | --------------- |
| [INSTALL.md](INSTALL.md)                     | **Instalação completa** (Docker, portas, env vars) | Setup           |
| [CLEAN_INSTALL.md](CLEAN_INSTALL.md)         | Clean install (resolver problemas)                 | Troubleshooting |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) | Deploy com Docker                                  | Deployment      |
| [system-manager.ps1](system-manager.ps1)     | Script gerenciamento de ambiente                   | Automação       |

---

## 🎓 MELHORES PRÁTICAS (2024-2025)

| Arquivo                                                                          | Descrição                                           | Data       |
| -------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- |
| [MELHORIAS_CONTEXTO_AI_ULTRA_ROBUSTO.md](MELHORIAS_CONTEXTO_AI_ULTRA_ROBUSTO.md) | **15 melhorias contexto AI (RAG, schemas, memory)** | 2025-11-24 |
| [GAP_ANALYSIS_REGRAS_DESENVOLVIMENTO.md](GAP_ANALYSIS_REGRAS_DESENVOLVIMENTO.md) | Gap analysis de regras vs documentação              | 2025-11-24 |
| [VSCODE_SETUP.md](VSCODE_SETUP.md)                                               | VSCode setup (104 extensões otimizadas)             | 2025-11-14 |

---

## 🧪 MCPs (Model Context Protocols)

| Arquivo                                                        | Descrição                                      |
| -------------------------------------------------------------- | ---------------------------------------------- |
| [MCPS_USAGE_GUIDE.md](MCPS_USAGE_GUIDE.md)                     | Guia técnico completo dos 8 MCPs               |
| [METODOLOGIA_MCPS_INTEGRADA.md](METODOLOGIA_MCPS_INTEGRADA.md) | Integração MCPs com Ultra-Thinking + TodoWrite |

**MCPs Disponíveis:**

1. Playwright (E2E testing)
2. Chrome DevTools
3. Selenium (WebDriver)
4. Context7 (Documentação oficial)
5. Filesystem
6. Sequential Thinking
7. Memory
8. Postgres

---

## 📚 SUB-AGENTS ESPECIALIZADOS

| Arquivo                                                | Descrição                       |
| ------------------------------------------------------ | ------------------------------- |
| [.claude/agents/README.md](.claude/agents/README.md)   | **6 sub-agents especializados** |
| [AGENTES_ESPECIALIZADOS.md](AGENTES_ESPECIALIZADOS.md) | Guia completo de agents         |

**Sub-Agents:**

1. Backend API Expert (NestJS, TypeORM)
2. Frontend Components Expert (Next.js, React)
3. Scraper Development Expert (Playwright, OAuth)
4. Chart Analysis Expert (Recharts, lightweight-charts)
5. TypeScript Validation Expert
6. Queue Management Expert (BullMQ, Redis)
7. PM Expert (Product Manager + QA Lead + DevOps + Tech Lead)

---

## 🤖 AUTOMAÇÃO CLAUDE CODE

### Skills (Workflows Automatizados)

| Arquivo                                                                  | Descrição                                        | Frequência de Uso       |
| ------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------- |
| [.claude/skills/validate-all.md](.claude/skills/validate-all.md)         | Validação completa (TypeScript + Build + Lint)   | 🔥 10-20x/dia           |
| [.claude/skills/context-check.md](.claude/skills/context-check.md)       | Verificação de contexto antes de tarefa          | 🔥 5-10x/dia            |
| [.claude/skills/sync-docs.md](.claude/skills/sync-docs.md)               | Sincronização CLAUDE.md ↔ GEMINI.md (100% sync)  | ⚡ 2-3x/semana          |

### Comandos Slash (Atalhos Rápidos)

| Comando            | Equivalente                     | Arquivo                                                                    |
| ------------------ | ------------------------------- | -------------------------------------------------------------------------- |
| `/validate-all`    | Execute skill validate-all      | [.claude/commands/validate-all.md](.claude/commands/validate-all.md)       |
| `/check-context`   | Execute skill context-check     | [.claude/commands/check-context.md](.claude/commands/check-context.md)     |
| `/sync-docs`       | Execute skill sync-docs         | [.claude/commands/sync-docs.md](.claude/commands/sync-docs.md)             |

### Hooks (Triggers Automáticos)

| Arquivo                                                                    | Trigger                           | Ação Automática                                    |
| -------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------- |
| [.claude/hooks/pre-task.md](.claude/hooks/pre-task.md)                     | Antes de toda tarefa              | Context check automático                           |
| [.claude/hooks/post-file-edit.md](.claude/hooks/post-file-edit.md)         | Após edição de CLAUDE.md          | Sincronização automática com GEMINI.md             |
| [.claude/hooks/pre-commit-msg.md](.claude/hooks/pre-commit-msg.md)         | Antes de criar commit message     | Template de commit detalhado (Conventional Commits)|

**Benefícios:**
- ⬆️ 30-40% mais produtividade
- ✅ Zero Tolerance garantido automaticamente
- ✅ Documentação sempre sincronizada
- ✅ Commits padronizados e detalhados

---

## 📖 REFERÊNCIA RÁPIDA

### Onde Documentar O Quê?

| Tipo              | Local                                | Exemplo                         |
| ----------------- | ------------------------------------ | ------------------------------- |
| Feature Nova      | `ROADMAP.md` + `FASE_XX.md`          | FASE 55: Ticker History Merge   |
| Bugfix Crítico    | `BUGFIX_*.md`                        | BUGFIX_DEFINITIVO_2025-11-22.md |
| Decisão Técnica   | `.gemini/memory/decisions.md`        | Escolha de Decimal vs Float     |
| API Endpoint      | `ARCHITECTURE.md`                    | GET /api/v1/assets/:ticker      |
| Entity Nova       | `DATABASE_SCHEMA.md`                 | TickerChange entity             |
| Processo/Workflow | `.gemini/context/workflows/*.md`     | phase-checklist.md              |
| Convenção Código  | `.gemini/context/conventions.md`     | naming, indentation, etc        |
| Regra Financeira  | `.gemini/context/financial-rules.md` | precision, rounding, timezone   |

---

## 🔍 BUSCA RÁPIDA

### Por Categoria

```bash
# Validações de fase
find . -name "VALIDACAO_FASE_*.md"

# Bugfixes
find . -name "BUGFIX_*.md" -o -name "BUG_*.md"

# Planejamentos
find . -name "PLANO_FASE_*.md"

# Checklists
find . -name "CHECKLIST_*.md"
```

### Por Conteúdo

```bash
# Buscar por palavra-chave
grep -r "cross-validation" *.md

# Buscar em arquivos de validação
grep -r "MCP Triplo" VALIDACAO_*.md
```

---

## 📊 ESTATÍSTICAS (Atualizado 2025-12-13)

- **Total de Arquivos .md:** 230+
- **Fases Concluídas:** 114 (100%)
- **Fase Atual:** 109 (React Query Migration + Race Condition Fix)
- **Validações Documentadas:** 60+
- **Problemas Resolvidos:** 120+
- **MCPs Integrados:** 8
- **Sub-Agents:** 7 (inclui PM Expert)

---

## 🔗 LINKS EXTERNOS

- **NestJS Docs:** https://docs.nestjs.com
- **Next.js Docs:** https://nextjs.org/docs
- **TypeORM Docs:** https://typeorm.io
- **Shadcn/ui:** https://ui.shadcn.com
- **TailwindCSS:** https://tailwindcss.com
- **Playwright:** https://playwright.dev

---

**Mantenedor:** Claude Code (Opus 4.5) + Google Gemini AI
**Última Atualização:** 2025-11-29 12:00
**Próxima Revisão:** A cada fase concluída
