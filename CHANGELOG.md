# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Pendente

- FASE 75: AI Sentiment (Gemini) (Prioridade MEDIA)

### Added

- **FASE 76: Observabilidade e Rastreabilidade - Fase 1 - COMPLETA (2025-12-06)**
  - **Infraestrutura Global:**
    - `GlobalExceptionFilter`: Captura todas exceções não tratadas, gera correlation IDs
    - `LoggingInterceptor`: Intercepta todas requisições HTTP, mede tempo de resposta
    - Sanitização de dados sensíveis em logs
    - Alertas para respostas lentas (>3s) e grandes (>1MB)
  - **Controllers Atualizados (13/13):**
    - Logger adicionado em 8 controllers faltantes
    - 11 console.log anti-patterns substituídos por Logger
    - 0 console.log restantes na pasta api/
  - **Documentação:**
    - CLAUDE.md/GEMINI.md: Princípio #5 "Observabilidade e Rastreabilidade" adicionado
    - PLANO_FASE_76_OBSERVABILIDADE.md: Roadmap completo para Fases 2 e 3
  - **Validação:**
    - TypeScript: 0 erros
    - Score de observabilidade: 49% → 65% (meta final: 90%)

- **FASE 66: OAuth/Login Scrapers Fixes - COMPLETA (2025-12-06)**
  - **7 Scrapers Corrigidos:**
    - B3Scraper: CVM code mapping (`cvm_codes.json` + `_get_cvm_code()`)
    - FundamenteiScraper: Cookie loading BEFORE navigation
    - MaisRetornoScraper: Cookie loading BEFORE navigation
    - ADVFNScraper: Credentials-based login (email/password)
    - DeepSeekScraper: localStorage verification (`_verify_local_storage_injection()`)
    - InvestingScraper: Dual cookie format support (list + dict)
    - ClaudeScraper: Session validation (`_verify_session()`)
  - **Padrões Implementados:**
    - Cookie loading order: BEFORE `page.goto()`
    - Dual cookie format: List `[{...}]` and Dict `{cookies: [...], localStorage: {...}}`
    - Cookie validation: Expiration check via Unix timestamp
    - Playwright conversion: Domain wildcard prefix, sameSite normalization
  - **Arquivos Criados/Modificados:**
    - `backend/python-scrapers/data/cvm_codes.json` - 90+ ticker→CVM mappings
    - `docker-compose.yml` - ADVFN_USERNAME/PASSWORD env vars
    - 7 scraper files with standardized patterns
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - docker-compose.yml: Sintaxe válida

- **FASE 74.5: Data Sources Page - Unified Scrapers View - COMPLETA (2025-12-06)**
  - **Backend Integration (Python + TypeScript scrapers):**
    - Novo método `getPythonScrapersList()` em ScrapersService
    - Novo método `testPythonScraper()` para testes via Python API
    - Método `getAllScrapersStatus()` combina scrapers TypeScript + Python
    - Método `isPythonScraper()` para identificar runtime
    - Integração com Python API (`/api/scrapers/list`, `/api/scrapers/test`)
  - **Frontend Data Sources Page (`/data-sources`):**
    - Exibe todos 29 scrapers (7 TypeScript + 22 Python)
    - 8 filtros por categoria: Todas, Fundamental, News, AI, Market Data, Options, Crypto, Macro
    - Badge de runtime (TypeScript/Python) em cada scraper
    - Botão "Testar" funciona para ambos runtimes
    - Settings Dialog com toggle enable/disable e rate limit
    - Ordenação por nome, status e taxa de sucesso
  - **API Client:**
    - `api.testScraper(scraperId, ticker)` com suporte a body params
    - Interface DataSource expandida com `runtime`, `category`, `description`
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: Success (backend + frontend)
    - 11 containers Docker healthy
    - Console: 0 erros (exceto hydration warning pré-existente)

- **FASE 74: System Infrastructure & Testing - COMPLETA (2025-12-06)**
  - **system-manager.ps1 v2.0:** Script completo para gerenciamento de 11 serviços Docker
    - Core (8): postgres, redis, python-service, backend, frontend, scrapers, api-service, orchestrator
    - Dev (2): pgadmin, redis-commander
    - Production (1): nginx
    - Comandos: start, start-dev, start-prod, stop, status, health, restart-service
  - **Cross-Validation Service:** Serviço de validação cruzada de dados financeiros
    - Detecção de discrepâncias significativas
    - Cálculo de consensus score
    - Integração com pipeline de scraping
  - **React Context MCP:** Configuração para inspeção de componentes React
  - **Backend Unit Tests - 50% Coverage:**
    - 901 testes passando (36 test suites)
    - Coverage: 50.02% Statements, 48.89% Branches, 47.63% Functions
    - Novos arquivos: pdf-generator.service.spec.ts, ai.service.spec.ts, app.controller.spec.ts
    - Jest factory mocking pattern para playwright e fs modules

- **Scrapers Fallback Integration - COMPLETA (2025-12-05)**
  - **FASE 1:** 26 Python scrapers registrados na API
    - Fundamental (5): FUNDAMENTUS, STATUSINVEST, INVESTSITE, INVESTIDOR10, GRIFFIN
    - Official Data (1): BCB
    - Technical (1): TRADINGVIEW
    - Market Data (4): GOOGLEFINANCE, YAHOOFINANCE, OPLAB, KINVO
    - Crypto (1): COINMARKETCAP
    - Options (1): OPCOESNET
    - News (7): BLOOMBERG, GOOGLENEWS, INVESTINGNEWS, VALOR, EXAME, INFOMONEY, ESTADAO
    - AI Analysis (6): CHATGPT, GEMINI, GROK, DEEPSEEK, CLAUDE, PERPLEXITY
  - **FASE 2:** Novo endpoint `/api/scrapers/fundamental/{ticker}` (Python API)
    - Executa scrapers em ordem de prioridade
    - Garante mínimo de fontes especificado
    - Retorna dados consolidados
  - **FASE 3:** Integração NestJS com fallback Python
    - `HttpModule` adicionado ao `ScrapersModule`
    - Método `runPythonFallbackScrapers()` em `scrapers.service.ts`
    - Método `hasSignificantDiscrepancies()` para detectar discrepâncias
    - Fallback ativado por 4 critérios:
      1. Menos de 3 fontes TypeScript
      2. Confidence < 60%
      3. >30% dos campos com discrepância > 20%
      4. 2+ campos críticos com desvio > 15%
  - **FASE 4:** Validação e testes completos
    - TypeScript 0 erros (backend + frontend)
    - Endpoint Python testado com VALE3 (3 fontes em 121s)
    - Conectividade backend→Python verificada via hostname `scrapers:8000`

### Fixed

- **PYTHON_API_URL Hostname Bug (2025-12-05)**
  - Problema: `PYTHON_API_URL=http://api-service:8000` não funcionava
  - Causa raiz: `api-service` usa `network_mode: "service:scrapers"`, compartilhando rede
  - Solução: Alterado para `http://scrapers:8000` em `docker-compose.yml`

- **FASE 65: Git Workflow Automation - COMPLETA (2025-12-04)**
  - Husky v9 instalado para Git Hooks
  - `pre-commit`: Valida TypeScript (0 erros) em backend e frontend
  - `commit-msg`: Valida formato Conventional Commits
  - `pre-push`: Valida build completo antes de push
  - Documentação atualizada em CONTRIBUTING.md
  - Bypass disponível com `--no-verify` para emergências

- **Issue #5: Database Backup/Restore Scripts - RESOLVIDO (2025-12-04)**
  - `scripts/backup-db.ps1` - Script de backup do banco de dados
    - Suporte para backup full, schema-only, data-only
    - Limpeza automática de backups antigos (mantém últimos 7)
    - Validação do container e contagem de tabelas/ativos
  - `scripts/restore-db.ps1` - Script de restore do banco de dados
    - Listagem de backups disponíveis
    - Restore do backup mais recente com `-Latest`
    - Confirmação de segurança antes do restore
  - `backups/` - Diretório para armazenamento de backups
  - Testado com sucesso: 154MB backup com 861 ativos

### Fixed

- **Issue #4: Frontend Cache - Docker Volume - RESOLVIDO (2025-12-04)**
  - Volume `frontend_next` removido do docker-compose.yml
  - Cache `.next` agora é efêmero (rebuilda no start do container)
  - Adicionado `CHOKIDAR_USEPOLLING=true` para melhor detecção de mudanças
  - Adicionado `WATCHPACK_POLLING=true` para hot reload em Docker
  - Hot reload agora funciona corretamente

### Validated

- **Issue #NEW: UI de Opções - RESOLVIDO (2025-12-04)**
  - Coluna "Opções" validada na tabela de ativos
  - Filtro "Com Opções" funcionando corretamente
  - Ativos com opções exibidos: ABCB4, ABEV3, AGRO3, etc.
  - Screenshots de evidência em `docs/screenshots/`
  - Documentação: `VALIDACAO_UI_OPCOES_2025-12-04.md`

---

## [1.7.3] - 2025-12-04

### Added

- **FASE 64 - OAuth/Cookies Scrapers Authentication:**
  - **Padrão "Cookies BEFORE Navigation":**
    - Cookies devem ser carregados ANTES de navegar para o site
    - Crítico para Google OAuth funcionar corretamente
    - Aplicado em: GeminiScraper, ChatGPTScraper, KinvoScraper
  - **Novo Scraper - KinvoScraper:**
    - Login via email/password (credential-based)
    - Arquivo de credenciais: `/app/data/credentials/kinvo.json`
    - Scraping de portfolio, assets, performance, history
    - Persistência de sessão com cookies
  - **OAuth API (porta 8080):**
    - FastAPI para gerenciar sessões OAuth
    - Endpoints para navegação entre sites OAuth
    - Coleta e persistência de cookies
    - Separado do api-service (porta 8000)
  - **Sync Script:**
    - `sync_cookies.ps1` - Workaround para Docker + Dropbox sync

### Fixed

- **Port Conflict:**
  - api-service (porta 8000) conflitava com OAuth API
  - OAuth API movido para porta 8080
- **playwright-stealth Version Mismatch:**
  - Containers tinham versões diferentes (1.0.6 vs 2.0.0)
  - Padronizado para 2.0.0 em todos containers
- **Cookies Not Authenticating:**
  - Cookies eram carregados DEPOIS da navegação (não funcionava)
  - Corrigido: cookies carregados ANTES da navegação

### Improved

- Scrapers OAuth agora funcionam com sessões persistentes
- 6 scrapers configurados com autenticação (Gemini, ChatGPT, Kinvo, Claude, DeepSeek, Perplexity)

### Documented

- Known Issue #9: Docker Volume Sync com Dropbox
- Known Issue #10: Cookies BEFORE vs AFTER Navigation pattern

---

## [1.7.2] - 2025-12-03

### Added

- **FASE 63 - Atualizar Dados Individual por Ativo:**
  - **Backend:**
    - `POST /assets/:ticker/update-fundamentals` - Endpoint para atualização individual
    - `updateSingleAsset()` em AssetsUpdateService - Inicia job de atualização
    - `queueSingleAsset()` em AssetUpdateJobsService - Enfileira job no BullMQ
    - Integração com Python scrapers via fila assíncrona
  - **Frontend:**
    - Botão "Atualizar Dados" no dropdown de ações da tabela de ativos
    - `syncingAsset` prop em AssetTable para estado de loading individual
    - Spinner visual com duração mínima de 2 segundos para feedback
    - Toast notification com Job ID após enfileiramento
    - Refetch automático da lista após 5 segundos
  - **API Client:**
    - `api.updateAssetFundamentals(ticker)` - Método para chamar endpoint

### Improved

- UX: Feedback visual imediato ao clicar em "Atualizar Dados"
- UX: Spinner por ativo específico (não bloqueia interação com outros ativos)
- UX: Mínimo de 2s de exibição do spinner para garantir visibilidade

### Validated

- TypeScript: 0 erros (backend + frontend)
- Build: Sucesso
- MCP Playwright: Validação visual da tabela e dropdown

---

## [1.7.1] - 2025-12-02

### Added

- **FASE 5 - Alertas de Discrepância:**
  - **Backend:**
    - `GET /scrapers/discrepancies` - Endpoint para listar discrepâncias de dados
    - Query params: `limit`, `severity` (all/high/medium/low), `field`
    - `DiscrepancyDto`, `DivergentSourceDto`, `DiscrepanciesResponseDto` - DTOs completos
    - `getDiscrepancies()` em ScrapersService - Cálculo de severidade por desvio
    - Severidade: high (>20%), medium (>10%), low (>5%)
  - **Frontend:**
    - Tab "Alertas" na página `/data-sources` (3 tabs: Status | Qualidade | Alertas)
    - Badge vermelho com contagem de alertas de alta severidade
    - `useScrapersDiscrepancies` hook - React Query para buscar discrepâncias
    - `api.getScrapersDiscrepancies()` - Método API client
    - Cards de resumo: Total, Alta, Média, Baixa severidade
    - Filtros por severidade com contadores dinâmicos
    - Lista de discrepâncias com: ticker, campo, valor de consenso, fontes divergentes
    - Cada fonte divergente mostra valor e % de desvio

### Validated

- TypeScript: 0 erros (backend + frontend)
- Console: 0 erros
- Visual: Tab Alertas funcional com ~2988 discrepâncias detectadas

---

## [1.7.0] - 2025-12-02

### Added

- **FASE 62 - MCP Gemini Advisor Integration:**
  - **MCP Server Configuration:**
    - Pacote: `gemini-mcp-tool-windows-fixed@latest` (versão corrigida para Windows)
    - Wrapper script: `~/.claude-mcp-servers/gemini-wrapper.cmd`
    - Configuração em `.claude.json` (projeto e global)
  - **Ferramentas Disponíveis:**
    - `ask-gemini` - Consultas gerais e análise de código
    - `brainstorm` - Ideação com metodologias criativas (SCAMPER, Design Thinking)
    - `timeout-test` - Teste de resiliência
    - `Help` - Documentação do Gemini CLI
  - **Modelos Configurados:**
    - `gemini-3-pro-preview` (recomendado - mais recente)
    - `gemini-2.5-pro` (alternativa estável)
    - `gemini-2.5-flash` (rápido/econômico)
  - **Documentação Atualizada:**
    - `CLAUDE.md` - Seção completa "Gemini 3 Pro - Protocolo de Segunda Opiniao"
    - `.gemini/GEMINI.md` - Seção "INTEGRACAO COM CLAUDE CODE"

### Validated

- **Validação Massiva (11 testes - 100% PASSOU):**
  - Consulta simples, análise de código TypeScript, brainstorm
  - Análise de arquivo real do projeto, decisão arquitetural
  - Análise de dados financeiros, code review múltiplos arquivos
  - Português vs Inglês, resposta longa, web search, timeout

### Protocol

- **Claude Code = DECISOR** (autoridade final, implementador)
- **Gemini = ADVISOR** (segunda opinião, não implementa)
- Consultar para: análises grandes (>50 arquivos), decisões arquiteturais, dados financeiros
- Não consultar para: tarefas triviais (<50 linhas), debugging simples

---

## [1.6.3] - 2025-12-02

### Added

- **FASE 4 - Dashboard de Qualidade de Scrapers:**
  - **Backend:**
    - `GET /scrapers/quality-stats` - Endpoint agregado de qualidade por scraper
    - `QualityStatsResponseDto` - DTOs para resposta
    - `getQualityStats()` em ScrapersService - Agregação de field_sources
  - **Frontend:**
    - Tabs na página `/data-sources` (Status | Qualidade)
    - `useScrapersQualityStats` hook - React Query para buscar estatísticas
    - `api.getScrapersQualityStats()` - Método API client
    - Cards de resumo: Consenso Médio, Discrepâncias, Ativos Analisados, Campos Rastreados
    - Cards por scraper: consenso %, discrepâncias, ativos analisados
    - Badges com cores por nível de consenso (verde >=80%, amarelo >=50%, vermelho <50%)
    - Tooltips explicativos em badges de consenso e discrepância

### Validated

- ✅ TypeScript Backend: 0 erros
- ✅ TypeScript Frontend: 0 erros
- ✅ Console do navegador: Sem erros
- ✅ Endpoint retornando dados corretos (6 scrapers, 842 ativos)
- ✅ Tab "Qualidade" exibindo estatísticas corretamente

---

## [1.6.2] - 2025-12-02

### Added

- **FASE 3 - API endpoint e componentes de qualidade de dados:**
  - **Backend:**
    - `GET /assets/:ticker/data-sources` - Endpoint com informações detalhadas de fontes
    - `AssetDataSourcesResponseDto` - DTO documentado com Swagger
    - `getDataSources()` em AssetsService - Query com cálculos de consenso
  - **Frontend:**
    - `DataSourceIndicator` - Badge + Tooltip com detalhes de consenso por campo
    - `DataQualitySummary` - Badges resumidos de qualidade de dados
    - `useAssetDataSources` hook - React Query para buscar dados de fontes
    - Integração na página de detalhes do ativo (`/assets/[ticker]`)
  - **Visual:**
    - Badge verde: >= 80% consenso
    - Badge amarelo: >= 50% consenso
    - Badge vermelho: < 50% consenso
    - Badge de discrepâncias quando houver fontes divergentes

### Validated

- TypeScript Backend: 0 erros
- TypeScript Frontend: 0 erros
- Console do navegador: Sem erros (apenas warnings externos do TradingView)
- Endpoint testado: `curl http://localhost:3101/api/v1/assets/PETR4/data-sources`

---

## [1.6.1] - 2025-12-02

### Changed

- **FASE 2 - Aumentar MIN_SOURCES de 2 para 3:**
  - `.env`: `MIN_DATA_SOURCES=3` (antes era 2)
  - `scrapers.service.ts`: Default alterado de 2 para 3
  - Warnings emitidos quando ativo tem menos de 3 fontes disponíveis
  - Maior confiança na validação por consenso (3 fontes mínimas)

### Validated

- TypeScript Backend: 0 erros
- Container restart: MIN_DATA_SOURCES=3 carregado corretamente
- Logs: Warnings aparecendo para ativos com < 3 fontes

---

## [1.6.0] - 2025-12-02

### Added

- **Sistema de Rastreamento de Origem por Campo (FASE 1 - Evolução Coleta):**
  - **Interfaces de Consenso:**
    - `FieldSourceValue` - Valor de campo com fonte, valor e timestamp
    - `FieldSourceInfo` - Info consolidada com consenso, discrepância e fontes divergentes
    - `SelectionStrategy` - CONSENSUS (validação por múltiplas fontes) e PRIORITY (fallback)
    - `ToleranceConfig` - Tolerâncias configuráveis por tipo de campo
  - **Tolerâncias por Tipo de Dado:**
    - Indicadores de valuation (P/L, P/VP, EV/EBIT): 2%
    - Margens e rentabilidade (ROE, ROA, ROIC): 0.5%
    - Valores absolutos (Receita, Lucro, Patrimônio): 0.1%
  - **Migration:** `AddFieldSourcesToFundamentalData` - Coluna JSONB `field_sources` com índice GIN
  - **Algoritmo de Consenso:**
    - Agrupa valores similares dentro da tolerância
    - Seleciona grupo com maior número de fontes concordando
    - Usa fonte prioritária como fallback (fundamentus > statusinvest > investidor10)
    - Rastreia fontes divergentes com desvio percentual

### Changed

- **scrapers.service.ts:**
  - Removido AVERAGE/MEDIAN (dados financeiros são ABSOLUTOS, não estatísticos)
  - Implementado `selectByConsensus()` - seleção por validação entre múltiplas fontes
  - Implementado `groupSimilarValues()` - clustering de valores por tolerância
  - Adicionado `agreementCount`, `hasDiscrepancy`, `divergentSources` ao resultado
  - Coleta de TODAS as 6 fontes (sem early exit) para máximo rastreamento

- **field-source.interface.ts:**
  - Reescrito para usar CONSENSUS ao invés de AVERAGE/MEDIAN
  - Adicionado `DEFAULT_TOLERANCES` com configuração por campo
  - Adicionado `TRACKABLE_FIELDS` - 35 campos rastreáveis
  - Adicionado `SOURCE_PRIORITY` - ordem de prioridade das fontes

- **fundamental-data.entity.ts:**
  - Adicionado campo `fieldSources: FieldSourcesMap` (JSONB com GIN index)

### Validated

- TypeScript Backend: 0 erros
- TypeScript Frontend: 0 erros
- Migration: Aplicada com sucesso
- Dados: Estrutura `fieldSources` sendo populada corretamente
- Consenso: Funcionando com detecção de discrepâncias (ex: 67% consenso = 2/3 fontes)

### Technical Notes

- **Princípio Fundamental:** Dados financeiros são ABSOLUTOS. Usamos CONSENSO para VALIDAR qual valor está correto, NÃO para calcular média/mediana.
- **Exemplo de Consenso:** Campo `evEbitda` com 3 fontes - `investidor10` (7.3) e `investsite` (7.27) concordam (67% consenso), `fundamentus` (5.03) marcado como divergente com 31.1% de desvio.

---

## [1.5.0] - 2025-11-29

### Added

- **Dependency Management System (FASE 60b):**
  - **scripts/check-updates.ps1** - Script PowerShell para verificar dependências outdated
  - **scripts/update-dependencies.ps1** - Script PowerShell para atualização segura
  - **docs/DEPENDENCY_MANAGEMENT.md** - Documentação completa do sistema

### Changed

- **Backend Dependencies - NestJS 10 → 11:**
  - `@nestjs/*` packages: 10.x → 11.x (core, common, platform-express, jwt, etc.)
  - `@types/node`: 20.x → 24.x
  - `bcrypt`: 5.x → 6.x
  - `date-fns`: 3.x → 4.x
  - `class-validator`: 0.14.x → 0.14.3
  - `typeorm`: 0.3.x → 0.3.x (latest)
  - **Fix:** `auth.module.ts` - JWT signOptions type cast para NestJS 11
  - **Fix:** `common.module.ts` - `IoRedisStore` → `ioRedisStore` (lowercase) para cache-manager 3.6

- **Frontend Dependencies - Next.js 14 → 16, React 18 → 19:**
  - `next`: 14.x → 16.0.5
  - `react` / `react-dom`: 18.x → 19.2.0
  - `tailwindcss`: 3.x → 4.1.17
  - `lightweight-charts`: 4.x → 5.0.9
  - `@types/react` / `@types/react-dom`: 18.x → 19.x
  - **Fix:** `tailwind.config.ts` - darkMode format para v4
  - **Fix:** `postcss.config.js` - `@tailwindcss/postcss` para Tailwind v4
  - **Fix:** `next.config.js` - Turbopack config, removed deprecated swcMinify
  - **Fix:** `globals.css` - Complete rewrite usando `@theme` directive (Tailwind v4)
  - **Fix:** `useWidgetLazyLoad.ts` - RefObject type para React 19 (`| null`)
  - **Fix:** `candlestick-chart.tsx`, `candlestick-chart-with-overlays.tsx`, `macd-chart.tsx`, `rsi-chart.tsx`, `stochastic-chart.tsx` - lightweight-charts v5 API (`addSeries(SeriesType, options)`)

- **Python Dependencies - All containers updated:**
  - **python-scrapers/requirements.txt:**
    - `playwright`: 1.40 → 1.56.0
    - `beautifulsoup4`: 4.12 → 4.14.2
    - `pandas`: 2.1 → 2.3.3
    - `numpy`: 1.26 → 2.3.5
    - `redis`: 5.0 → 7.1.0
    - `pydantic`: 2.5 → 2.12.5
  - **python-service/requirements.txt:**
    - `fastapi`: 0.109 → 0.122.0
    - `uvicorn`: 0.27 → 0.38.0
    - `pandas-ta-classic`: 0.3.37 → 0.3.59
    - `yfinance`: 0.2.50 → 0.2.66
    - `numba`: 0.61 → 0.62.1
    - `pytest`: 7.4 → 9.0.1
  - **api-service/requirements.txt:**
    - `aiohttp`: 3.9 → 3.13.2
    - `aiofiles`: 23.2 → 25.1.0
    - `sqlalchemy`: 2.0.25 → 2.0.44
    - `hiredis`: 2.3 → 3.3.0

### Validated

- ✅ TypeScript Backend: 0 erros
- ✅ TypeScript Frontend: 0 erros
- ✅ Build Backend: webpack compiled successfully
- ✅ Build Frontend: 18 páginas geradas
- ✅ Docker Containers: 8/8 healthy
- ✅ npm outdated: 100% atualizado (apenas deprecated @types stubs)
- ✅ pip list outdated: 100% atualizado (apenas pip/setuptools base image)

### Breaking Changes

- **lightweight-charts v5:** API mudou de `chart.addCandlestickSeries()` para `chart.addSeries(CandlestickSeries, options)`
- **Tailwind v4:** CSS-first config com `@theme` directive, `@tailwindcss/postcss` plugin
- **React 19:** RefObject type requires `| null` generic parameter
- **NestJS 11:** JWT module signOptions type stricter

---

## [1.4.0] - 2025-11-29

### Added

- **Validação Ultra-Completa do Ecossistema (FASE 60):**
  - **RELATORIO_VALIDACAO_FINAL_2025-11-29.md** - Relatório completo de validação
  - **VALIDACAO_PLAYWRIGHT_DEVTOOLS_2025-11-29.md** - Validação Playwright + DevTools
  - **frontend/tests/pages-validation.spec.ts** - 14 testes E2E de páginas
  - **frontend/tests/assets-debug.spec.ts** - Debug de assets
  - **frontend/playwright-local.config.ts** - Config para testes locais
  - 7 relatórios de validação adicionais

### Fixed

- **URL da API incorreta no Frontend** - CRÍTICO
  - Frontend chamava `/api/assets` ao invés de `/api/v1/assets` (404)
  - Hardcoded `NEXT_PUBLIC_API_URL=http://localhost:3101/api/v1` no docker-compose.yml
  - 861 assets agora carregando corretamente

- **Import incorreto no reports/page.tsx**
  - `Module not found: '@/components/reports/multi-source-tooltip'`
  - Corrigido: Import de `multi-source-tooltip` para `MultiSourceTooltip` (PascalCase)

- **API Service Port 8000 não iniciava**
  - Container `invest_api_service` crashava com erros de Selenium
  - `requirements.txt`: Substituído selenium por playwright
  - `Dockerfile`: Adicionadas dependências Playwright + chromium
  - `scraper_test_controller.py`: Apenas scrapers migrados (Fundamentus, BCB)
  - `main.py`: Desabilitado oauth_router temporariamente

### Changed

- **docker-compose.yml** - NEXT_PUBLIC_API_URL hardcoded para garantir /api/v1
- **backend/api-service/** - Migração completa para Playwright
- **ROADMAP.md** - FASE 60 completa adicionada
- **CHANGELOG.md** - Versão 1.4.0 documentada

### Validated

- ✅ 14/14 páginas testadas com Playwright
- ✅ 14/14 screenshots capturados
- ✅ 0 erros críticos de console
- ✅ 8/8 containers Docker healthy
- ✅ 861 assets carregando corretamente
- ✅ API `/api/v1/assets` respondendo 200 OK

---

## [1.3.0] - 2025-11-28

### Added

- **Playwright Migration & Exit Code 137 Resolution (FASE 58):**
  - **PLAYWRIGHT_SCRAPER_PATTERN.md** (849 linhas) - Template standardizado de scrapers
    - Padrão BeautifulSoup Single Fetch (~10x mais rápido)
    - Template completo de scraper Playwright
    - Checklist de migração (5 fases)
    - Troubleshooting (Exit 137, timeouts, container restart)
    - Best practices Playwright 2025
    - Comparação before/after com métricas

  - **VALIDACAO_MIGRACAO_PLAYWRIGHT.md** (643 linhas) - Relatório completo de validação
    - 2 scrapers migrados e validados (fundamentus, bcb)
    - Performance: ~10x mais rápido (7.72s vs timeout)
    - Taxa de sucesso: 0% → 100%
    - Memória estável (376MB/4GB)
    - 13/13 validações concluídas

  - **ERROR_137_ANALYSIS.md** (393 linhas) - Análise técnica Exit Code 137
    - Root cause identificado: operações `await` múltiplas (não OOM)
    - Timeline detalhado do problema
    - 4 soluções propostas com prós/contras
    - Solução definitiva implementada

  - **test_bcb.py** (168 linhas) - Testes automatizados
    - Test suite completo para BCB scraper
    - Validação API + web fallback
    - Coverage 100%

  - **FASE_ATUAL_SUMMARY.md** (351 linhas) - Resumo executivo
    - Métricas de performance before/after
    - Lições aprendidas (5 principais)
    - Próximos passos (24 scrapers pendentes)

### Changed

- **backend/python-scrapers/base_scraper.py** - Arquitetura refatorada (~100 linhas)
  - ✅ Browser individual por scraper (não compartilhado)
  - ✅ Alinhamento 100% com backend TypeScript
  - ✅ asyncio.Lock criado em async context
  - ✅ Cleanup completo: page + browser + playwright

- **backend/python-scrapers/fundamentus_scraper.py** - Otimizado BeautifulSoup (~80 linhas)
  - ✅ Single HTML fetch + parsing local
  - ✅ Performance: 7.72s, 30 campos extraídos
  - ✅ Taxa de sucesso: 100%
  - ✅ Validado com PETR4

- **backend/python-scrapers/bcb_scraper.py** - Web fallback otimizado (~50 linhas)
  - ✅ API BCB primária: 17 indicadores, <1s
  - ✅ Web fallback com BeautifulSoup
  - ✅ Performance: <1s (API), ~3s (web)
  - ✅ Taxa de sucesso: 100%

- **backend/python-scrapers/main.py** - Imports corrigidos (~40 linhas)
  - ✅ Apenas scrapers migrados ativos (2)
  - ✅ 24 scrapers temporariamente desabilitados
  - ✅ Logs informativos

- **CLAUDE.md** - Seção Python Scrapers adicionada (+88 linhas)
  - Arquitetura e padrão standardizado
  - Padrão obrigatório BeautifulSoup Single Fetch
  - 4 regras críticas
  - Arquivos críticos e quando consultar
  - Testing commands

- **GEMINI.md** - Sincronizado com CLAUDE.md (+88 linhas)

- **ROADMAP.md** - FASE 58 completa adicionada
  - Status: ✅ 100% COMPLETO
  - 10 arquivos modificados/criados
  - +2,850 linhas código + documentação
  - Métricas de performance detalhadas

### Fixed

- **Exit Code 137 (SIGKILL)** - Resolvido definitivamente
  - ❌ Antes: Processo morto após ~8s (timeout)
  - ✅ Depois: Execução completa em 7.72s
  - Root cause: Múltiplas operações `await` lentas
  - Solução: BeautifulSoup single HTML fetch

- **Arquitetura Python Scrapers** - Alinhada com backend TypeScript
  - ❌ Antes: Browser compartilhado
  - ✅ Depois: Browser individual por scraper

- **Performance Scrapers** - Melhoria ~10x
  - ❌ Antes: Timeout (>14s)
  - ✅ Depois: 7.72s (fundamentus), <1s (bcb API)

### Performance

- **Inicialização:** 2x mais rápido (1.5s → 0.7s)
- **Navegação:** 1.67x mais rápido (5s → 3s)
- **Extração:** Funcional (timeout → 7.72s)
- **Taxa de sucesso:** ∞ (0% → 100%)
- **Memória:** Estável (376MB max)

### Documentation

- Total adicionado: +2,850 linhas de código + documentação
- 5 novos arquivos de documentação técnica
- Template standardizado para 24 scrapers restantes
- Guia completo de migração Selenium → Playwright

---

- **Fundamentus Scraper - Validação 100% (FASE 59):**
  - **VALIDACAO_FUNDAMENTUS_SCRAPER.md** (343 linhas) - Relatório completo de validação
    - 100% aprovação em 5 tickers válidos + 2 inválidos
    - Coverage: 90% (Industrial), 43.3% (Financeiro - esperado)
    - Performance: 3.48s médio (66% faster que meta 10s)
    - 6/6 validation checks PASSED
    - Investigação via Chrome DevTools MCP
    - Lições aprendidas (4 principais)

  - **SECTOR_COVERAGE_EXPECTATIONS.md** (387 linhas) - Documentação setorial completa
    - Expectativas de coverage por setor (Industrial, Financeiro, FII, Holding)
    - Templates de validação adaptáveis
    - Metodologia de investigação (Chrome DevTools)
    - Explicação técnica de diferenças setoriais
    - Exemplos práticos e código de teste

  - **test_fundamentus_complete.py** (122 linhas) - Suite completa de validação
    - 3 tickers industriais (PETR4, VALE3, WEGE3)
    - 2 tickers financeiros (ITUB4, BBAS3)
    - 2 tickers inválidos (INVALID, TESTE99)
    - Validação setorial diferenciada
    - Performance benchmarking

### Changed

- **backend/python-scrapers/scrapers/fundamentus_scraper.py** - Error handling aprimorado
  - ✅ Detecção adicional: "nenhum papel encontrado"
  - ✅ 100% detecção de tickers inválidos
  - ✅ 3 retry attempts com backoff

### Added - Descoberta Crítica

- **Coverage Setorial** - Identificado via Chrome DevTools MCP
  - ✅ Bancos: 43.3% coverage é ESPERADO (não bug!)
  - ✅ Sem campos industriais: P/EBIT, EV/EBITDA, Margens, ROIC
  - ✅ Estrutura contábil diferente (sem EBITDA tradicional)
  - ✅ Documentação completa criada para futuros scrapers

### Performance

- **Coverage:**
  - Industrial: 90.0% (27/30 campos)
  - Financeiro: 43.3% (13/30 campos) - esperado
- **Tempo Médio:** 3.48s (66% faster que meta 10s)
- **Taxa de Sucesso:** 100% (5/5 tickers válidos)
- **Error Handling:** 100% (2/2 tickers inválidos detectados)

### Documentation

- Total adicionado: +852 linhas de código + documentação
- 3 novos arquivos (validação + documentação setorial + test suite)
- Template de validação setorial para 24 scrapers restantes
- Metodologia de investigação com Chrome DevTools MCP

---

## [1.2.0] - 2025-11-27

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

**Mantido por:** Claude Code (Opus 4.5) + Google Gemini AI
**Última Atualização:** 2025-11-29
**Repositório:** invest-claude-web (privado)
