# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Pendente

- Resolução de cache do frontend Docker (Issue #4)
- População de dados no banco após wipe (Issue #5)
- Validação visual final da UI de opções
- FASE 58: Git Workflow Automation (Prioridade 2)
- FASE 59: Dependency Management System (Prioridade 2)
- FASE 60: Architecture Visual Diagrams (Prioridade 2)

---

## [1.3.0] - 2025-11-27

### Added

- **Documentation Compliance & Quality Improvements (FASE 57):**
  - **KNOWN-ISSUES.md** (609 linhas) - Documentação pública de issues conhecidos
    - 3 issues ativos (Frontend Cache, Database Restore, UI Validation)
    - 11 issues resolvidos com soluções documentadas
    - Lições aprendidas (Docker, Scrapers, Frontend, Database)
    - Procedimentos de recuperação (step-by-step)
    - Checklist de prevenção
    - Métricas de problemas (73% resolvidos)

  - **IMPLEMENTATION_PLAN.md** (643 linhas) - Template formal de planejamento de fases
    - Template completo com 10 seções obrigatórias
    - Workflow de planejamento (diagrama Mermaid)
    - Sistema de versionamento de planos (vMAJOR.MINOR)
    - Critérios de aprovação (13 itens)
    - Histórico de 5 planejamentos anteriores

  - **VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md** (393 linhas) - Relatório de compliance
    - Auditoria completa de 60+ regras de desenvolvimento
    - Matriz de compliance detalhada (70% contemplado, 20% parcial, 10% não contemplado)
    - 6 gaps críticos identificados
    - Prioridades de ação (Prioridade 1, 2, 3)
    - Estatísticas finais e recomendações

### Changed

- **CLAUDE.md** - Atualizado com 185 linhas (+59% de conteúdo)
  - **4 Development Principles adicionados:**
    1. Quality > Velocity ("Não Ter Pressa")
    2. KISS Principle (Keep It Simple, Stupid)
    3. Root Cause Analysis Obrigatório
    4. Anti-Workaround Policy

  - **Critical Rules expandidas:**
    - Zero Tolerance Policy (TypeScript, Build, Console, ESLint)
    - Git Workflow (Conventional Commits, commit format)
    - Validação Completa (MCP Triplo obrigatório)
    - Dados Financeiros (Decimal, cross-validation, timezone)
    - Não Duplicar Código (checklist de verificação)

  - **Critical Files Reference:** Nova seção com referências explícitas a:
    - `.gemini/context/conventions.md` (Convenções de código)
    - `.gemini/context/financial-rules.md` (Regras financeiras - LEITURA OBRIGATÓRIA)
    - `.gemini/context/known-issues.md` (Análise técnica de issues)

  - **Documentação Sempre Atualizada:** Tabela de arquivos obrigatórios por fase
  - **Planejamento de Fases:** Template obrigatório com workflow completo
  - **Script de Gerenciamento:** system-manager.ps1 uso obrigatório

- **GEMINI.md** - Sincronizado com CLAUDE.md (100% idêntico, 499 linhas)
  - Todos os 4 Development Principles incluídos
  - Critical Files Reference completa
  - Versionamento sincronizado

- **ROADMAP.md** - Atualizado com FASE 57 + 3 próximas fases planejadas
  - FASE 57: Documentation Compliance (COMPLETA)
  - FASE 58: Git Workflow Automation (PLANEJADA - Prioridade 2)
  - FASE 59: Dependency Management System (PLANEJADA - Prioridade 2)
  - FASE 60: Architecture Visual Diagrams (PLANEJADA - Prioridade 2)
  - Resumo de status: 57 fases completas + 3 planejadas = 60 fases
  - Compliance status: 70% → 85% (projetado após FASES 58-60)

### Documentation

- **Total de arquivos criados/modificados:** 5 arquivos, +2,143 linhas de documentação
- **Compliance:** 42/60 regras (70%) completamente contempladas
- **Gaps críticos endereçados:** 6 de 6 (100%)
- **Sincronização:** CLAUDE.md e GEMINI.md idênticos (499 linhas cada)
- **Versionamento:** Histórico de mudanças documentado em todos arquivos

### Technical Details

- **Arquivos Criados:**
  - `/KNOWN-ISSUES.md` (+609 linhas)
  - `/IMPLEMENTATION_PLAN.md` (+643 linhas)
  - `/VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md` (+393 linhas)

- **Arquivos Modificados:**
  - `/CLAUDE.md` (+185 linhas - 4 princípios + critical files)
  - `/GEMINI.md` (+313 linhas - sincronização completa)
  - `/ROADMAP.md` (+697 linhas - FASE 57 + 3 fases planejadas)

- **Referências:**
  - Regras de desenvolvimento: 60+ regras auditadas
  - Prioridade 1 (CRÍTICO): 100% completa
  - Prioridade 2 (IMPORTANTE): 3 fases planejadas
  - Prioridade 3 (DESEJÁVEL): 2 melhorias identificadas

---

## [1.2.1] - 2025-11-25

### Fixed

- **Critical Bug #1:** Resource leak in Python script `extract_all_b3_tickers.py`
  - Fixed: `await service.client.aclose()` instead of creating new instance
  - Impact: Prevented memory leak in production environment
- **Critical Bug #2:** Crash on invalid date in `all-b3-assets.seed.ts`
  - Fixed: Added validation before `new Date(metadata.first_date)`
  - Impact: Prevented TypeError crash during seed execution
- **Critical Bug #3:** TypeError on null `stock_type` in `all-b3-assets.seed.ts`
  - Fixed: Safe null check `metadata.stock_type ? metadata.stock_type.trim() : ''`
  - Impact: Prevented crash when stock_type is undefined
- **Critical Bug #4:** Silent invalid date in `ticker-changes.seed.ts`
  - Fixed: Added `isNaN(parsedDate.getTime())` validation
  - Impact: Prevented invalid dates from being inserted silently
- **Critical Bug #5:** Broken DTO validation in `sync-bulk.dto.ts`
  - Fixed: Replaced incorrect `@ValidateIf` with custom validator `IsEndYearGreaterThanOrEqualToStartYear`
  - Impact: System now correctly rejects invalid period ranges (e.g., startYear=2025, endYear=1986)
  - Validated with integration tests (HTTP 400 for invalid, HTTP 202 for valid)

### Changed

- **ARCHITECTURE.md** - Updated to version 1.2.0
  - Added TickerChange entity documentation (FASE 55)
  - Documented seed scripts (all-b3-assets: 861 assets 1986-2025, ticker-changes: FASE 55)
  - Added "Custom Validators" section with code examples
  - Updated entity mapping table
  - Updated all timestamps to 2025-11-25

### Documentation

- All 5 critical bugs documented with root cause, fix, and impact
- Comments updated in seed files to reflect 861 useful assets (non-fractional)
- Custom validator pattern documented for future DTO validations

---

## [1.2.0] - 2025-11-24

### Added

- **Options Liquidity Column** - Nova coluna "Opções" na tabela de ativos
  - Indica quais ativos possuem opções líquidas (dados de opcoes.net.br)
  - Filtro "Com Opções" para visualizar apenas ativos com opções
  - Backend: Endpoint `POST /assets/sync-options-liquidity`
  - Scraper com paginação completa (174 assets, 7 páginas)
  - Colunas DB: `has_options` (boolean) e `options_liquidity_metadata` (jsonb)
- **Centralized Known Issues Documentation**
  - Arquivo `.gemini/context/known-issues.md` com 8 issues documentados
  - Root causes, soluções e lições aprendidas para cada problema
  - Procedimentos de recuperação e checklist de prevenção
  - Métricas de problemas e status de resolução
- **Implementation History**
  - Histórico completo no `implementation_plan.md`
  - Logs de execução bem-sucedidos do scraper
  - Troubleshooting detalhado de problemas encontrados

### Changed

- `OpcoesScraper.login()` atualizado com seletores corretos (`#CPF`, `#Password`)
- Paginação do scraper implementada com múltiplas estratégias de detecção
- `AssetsService` integrado com sync de liquidez de opções

### Fixed

- Seletores de login incorretos no `OpcoesScraper` (Issue #1)
- Scraper coletando apenas primeira página (Issue #2) - agora coleta 174 assets
- Erro TypeScript em element click (Issue #3)
- Erros de autenticação JWT após reset de DB (Issue #6)

### Known Issues

- **Frontend Cache**: Mudanças de código não aparecem no browser (Docker volume issue)
- **Database Vazio**: Dados perdidos após `docker-compose down -v` (aguardando re-sync)

### Technical Details

- **Commits**: `40c7654`, `f8548e4`
- **Backend Files**: 6 arquivos (entity, migration, scraper, service, controller, DTO)
- **Frontend Files**: 3 arquivos (api.ts, asset-table.tsx, page.tsx)
- **Tests**: Backend funcionando 100%, frontend código completo

---

## [1.1.1] - 2025-11-24

### Added

- **Ticker History Merge (FASE 55)** - Backend completo
  - Entity `TickerChange` para rastrear mudanças históricas (ex: ELET3 → AXIA3)
  - Service `TickerMergeService` para unificar dados históricos
  - Endpoint `/market-data/:ticker/prices?unified=true`
  - Documentação completa do sistema de merge

### Changed

- Frontend API client (`api.ts`) atualizado para suportar parâmetro `unified`
- Toggle UI na página de detalhes do ativo para ativar histórico unificado
- Chart renderiza dados consolidados quando unified mode ativo

### Fixed

- Type safety e query parameters (commit `af673a5`)
- Bulk sync error - DI de `TickerChangeRepository` no `AssetsModule`

### Technical Details

- **Commits**: `e660599`, `41a8f61`, `af673a5`
- **Phase**: FASE 55 (98.1% do projeto completo)

---

## [1.1.0] - 2025-11-23

### Added

- **Automated Testing Agent (FASE 49)**
  - Unit tests para `FundamentalAnalystAgent`
  - Network resilience tests
  - Playwright test suite completo

### Fixed

- Backend lint errors (FASE 48)
- Unused variables e imports removidos
- TypeScript configuration issues resolvidos

### Technical Details

- **Commits**: `718cbc5`, `4282415`
- **Tests**: 100% pass rate para unit tests do agent

---

## [1.0.0] - 2025-11-21

### Added

- **AI Context Structure** - Sprint 1
  - Estrutura `.gemini/` completa
  - `GEMINI.md` e `CLAUDE.md` sincronizados
  - Contexto modular para Gemini AI
- **Gemini CLI Native Usage Guide** - Sprint 2
  - Documentação completa de uso
  - Best practices para context management

### Changed

- ROADMAP.md atualizado (48 fases completas)
- Sincronização de documentação GEMINI.md

### Technical Details

- **Commits**: `c134330`, `4282415`
- **Structure**: Context files organizados por categoria

---

## [0.9.0] - 2025-11-21

### Added

- **Cache Headers Optimization (FASE 47)**
  - +5.5% LCP improvement
  - +6.6% TTFB improvement
  - Otimização de performance para assets estáticos

### Fixed

- **BRAPI Type String Conversion (FASE 48)**
  - Correção crítica de conversão de tipos
  - WebSocket logs - acúmulo removido
  - Checkmark azul para mensagens SYSTEM

### Technical Details

- **Commits**: `1418681`, `8f81dc5`, `8b2372b`
- **Performance**: +6% overall improvement

---

## [0.8.0] - 2025-11-20

### Added

- **Bulk Sync and Individual Sync (FASE 37)**
  - `BulkSyncButton` com WebSocket
  - Sync individual de assets
  - Modal com progresso em tempo real
  - Documentação completa do sistema de sync

### Fixed

- WebSocket connection handling
- Bulk sync button modal fechando após `sync:started`

### Technical Details

- **Commits**: `3fc5ce7`, `8b2372b`
- **Features**: Real-time progress tracking

---

## [0.7.0] - 2025-11-19

### Added

- **COTAHIST Performance Optimization (FASE 38-40)**
  - 98.8% melhoria no parser COTAHIST
  - 98-99% melhoria com download paralelo
  - Fix crítico em `data.close.toFixed`
  - Docker `/dist` cache resolvido

### Fixed

- COTAHIST parser performance crítica
- Python service download paralelo
- Bug de precisão em dados de fechamento

### Technical Details

- **Commits**: `dbc32e6`, `757a3fc`, `afd4592`, `bdae121`
- **Performance**: 98-99% total improvement

---

## [0.6.0] - 2025-11-18

### Added

- **Economic Indicators Dashboard (FASE 1)**
  - Frontend dashboard completo
  - Monthly + Accumulated 12 months data
  - Sync button integrado
  - Backend API endpoints

### Technical Details

- **Commits**: `9dc8f7c`, `c609f53`
- **Features**: Real-time economic data display

---

## [0.5.0] - 2025-11-15

### Added

- **Multi-browser Testing (FASE 41)**
  - Playwright multi-browser support
  - API testing framework
  - Validação tripla MCP (Playwright + Chrome + React DevTools)

### Fixed

- ESLint warnings em `useSyncWebSocket` hook
- Frontend linting issues resolvidos

### Technical Details

- **Commits**: `ab3455a`, `79f899d`, `1b81e18`
- **Tests**: Cross-browser compatibility verified

---

## Versões Anteriores

### [0.4.x] - Sistema Base

- Arquitetura NestJS + Next.js estabelecida
- Scrapers fundamentalistas (6 sources)
- Python-service para análise técnica
- PostgreSQL + Redis infraestrutura
- Autenticação JWT
- Portfolio management básico

### [0.3.x] - MVP

- CRUD de assets
- Integrações iniciais de scrapers
- Frontend básico com Shadcn/ui
- Docker compose setup

### [0.2.x] - Protótipo

- Backend API skeleton
- Database schema inicial
- Scraper proof-of-concept

### [0.1.x] - Conceito

- Estrutura de diretórios
- Tech stack selecionado
- Documentação inicial

---

## Convenções de Versioning

Este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/):

- **MAJOR** (X.0.0): Mudanças incompatíveis de API
- **MINOR** (0.X.0): Funcionalidades adicionadas de forma retrocompatível
- **PATCH** (0.0.X): Correções de bugs retrocompatíveis

### Categorias de Mudanças

- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas em breve
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de vulnerabilidades de segurança
- **Known Issues**: Problemas conhecidos não resolvidos
- **Technical Details**: Detalhes técnicos (commits, arquivos, métricas)

---

## Próximas Releases (Planejado)

### [1.3.0] - Previsto Q1 2026

- Portfolio optimization engine
- AI-powered recommendations
- Real-time market data streaming
- Advanced charting features

### [1.4.0] - Previsto Q2 2026

- Technical analysis indicators expansion
- Backtesting framework
- Strategy builder UI
- Mobile responsive improvements

### [2.0.0] - Previsto Q3 2026

- API v2 (breaking changes)
- Microservices architecture migration
- GraphQL API
- Multi-tenancy support

---

## Como Gerar Release

```bash
# 1. Atualizar CHANGELOG.md (adicionar nova versão)
# 2. Atualizar package.json com nova versão
# 3. Commit das mudanças
git add CHANGELOG.md package.json
git commit -m "chore: release v1.2.0"

# 4. Criar tag
git tag -a v1.2.0 -m "Release v1.2.0 - Options Liquidity Column"

# 5. Push tag
git push origin v1.2.0

# 6. Criar release no GitHub
# Usar CHANGELOG.md como release notes
```

---

**Mantido por:** Claude Code (Sonnet 4.5) + Google Gemini AI  
**Última Atualização:** 2025-11-24  
**Repositório:** invest-claude-web (privado)
