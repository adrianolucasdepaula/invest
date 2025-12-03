# MASTER ROADMAP v2.0: B3 AI Analysis Platform

**Versao:** 2.0 (Recalibrado 2025-12-03)
**Baseline:** v1.7.2 (63 fases completas)
**Objetivo:** Plataforma financeira de nivel institucional (comparavel a Bloomberg/Status Invest)
**Stack:** 100% Gratuito/Open Source

---

## 0. Metodologia & Regras Zero Tolerance (OBRIGATORIO)

**NAO AVANCAR DE FASE SEM CUMPRIR 100% DESTES ITENS:**

### 0.1. Protocolo de Qualidade

- **Zero Bugs/Warnings:** Nao avancar se houver 1 unico erro de TypeScript, Lint ou Build.
- **Code Review Obrigatorio:** Revisar cada etapa com as melhores praticas antes de seguir.
- **Triple Check Validation:** Validar Frontend usando **3 camadas** (MCPs em paralelo):
  1. **Playwright:** Testes automatizados E2E.
  2. **Chrome DevTools:** Inspecao de Network/Console.
  3. **React DevTools:** Inspecao de Componentes e Estado.
- **System Manager:** Usar sempre `.\system-manager.ps1` para gerenciar o ambiente.

### 0.2. Integridade de Dados

- **Precisao Absoluta:** Jamais arredondar ou manipular dados financeiros. Usar `Decimal`.
- **Cross-Validation:** Revalidar dados em multiplas fontes (min 3) para garantir confianca.
- **Dados Reais:** Nunca usar mocks. Usar dados coletados dos scrapers.

### 0.3. Documentacao Sincronizada

- **Sync Total:** Manter atualizados em TEMPO REAL: `CLAUDE.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `KNOWN-ISSUES.md`.
- **Contexto:** Verificar sempre `MAPEAMENTO_FONTES_DADOS_COMPLETO.md` antes de criar novos dados.

---

## 1. Estado Atual do Projeto (Baseline v1.7.2)

### 1.1. Marcos Concluidos (63 Fases)

| Area | Status | Detalhes |
|------|--------|----------|
| **Backend Core** | COMPLETO | NestJS 11, TypeORM, PostgreSQL 16, BullMQ + Redis |
| **Frontend Core** | COMPLETO | Next.js 16, React 19, Tailwind CSS 4, Shadcn/ui |
| **Charts** | COMPLETO | Lightweight Charts v5.0.9 (migrado de Recharts) |
| **Autenticacao** | COMPLETO | JWT + Google OAuth |
| **Real-time** | COMPLETO | WebSocket para progresso de sync |
| **Consenso de Dados** | COMPLETO | Cross-validation 3+ fontes (FASE 61) |
| **Discrepancias** | COMPLETO | 2988 detectadas com severidade (backend) |
| **Indicadores Macro** | COMPLETO | 27 indicadores BCB |
| **COTAHIST** | COMPLETO | Dados historicos 1986-2025 |
| **Ticker Merge** | COMPLETO | ELET3 -> AXIA3 tracking |

### 1.2. Debito Tecnico Pendente

| Item | Impacto | Prioridade |
|------|---------|------------|
| **Migracao Playwright** | 24/30 scrapers ainda em Selenium | CRITICO |
| **FundamentalGrid** | API existe, frontend e placeholder | ALTO |
| **Dashboard Discrepancias** | Backend tem dados, frontend nao exibe | ALTO |
| **TimescaleDB** | Necessario para dados intraday | MEDIO |

### 1.3. Metricas Atuais

- **Ativos B3:** 861 tickers
- **Precos Historicos:** ~1M+ registros
- **Scrapers Ativos:** 6 (fundamentus, statusinvest, investidor10, fundamentei, investsite, BCB)
- **Scrapers Migrados Playwright:** 3/30 (10%)
- **Usuarios de Teste:** 7
- **Portfolios:** 4

---

## 2. Arquitetura de Referencia (The "Free" Ultimate Stack)

### Frontend (A Experiencia)

| Componente | Tecnologia | Status |
|------------|------------|--------|
| Framework | Next.js 16 (App Router) | JA IMPLEMENTADO |
| Renderizacao | React 19 (Server Components) | JA IMPLEMENTADO |
| Estado | TanStack Query (React Query) | JA IMPLEMENTADO |
| Visual | Shadcn/ui + Tailwind CSS 4 | JA IMPLEMENTADO |
| Charts | Lightweight Charts v5.0.9 | JA IMPLEMENTADO |
| Icons | Lucide React (555 icons) | JA IMPLEMENTADO |
| Temas | next-themes (dark/light) | JA IMPLEMENTADO |

### Backend (A Inteligencia)

| Componente | Tecnologia | Status |
|------------|------------|--------|
| API Gateway | NestJS 11 | JA IMPLEMENTADO |
| Data Factory | Python (30 Scrapers) | 3 MIGRADOS, 27 PENDENTES |
| Fila | BullMQ + Redis | JA IMPLEMENTADO |
| Real-time | Socket.io | JA IMPLEMENTADO |
| AI Advisor | Gemini MCP | JA IMPLEMENTADO |

### Infraestrutura de Dados (O Coracao)

| Componente | Tecnologia | Status |
|------------|------------|--------|
| Relacional | PostgreSQL 16 | JA IMPLEMENTADO |
| Series Temporais | **TimescaleDB** | PENDENTE (FASE 65) |
| Busca | **Meilisearch** | PENDENTE (FASE 69) |
| Data Lake | **MinIO** | PENDENTE (FASE 69) |

---

## 3. Plano de Execucao Detalhado (6 Fases)

### FASE 64: Migracao Playwright Completa

**Objetivo:** Migrar todos os 24 scrapers pendentes de Selenium para Playwright
**Prioridade:** CRITICA (desbloqueia diversidade de dados)
**Estimativa:** 40-60h total (2-3h por scraper complexo)

**Scrapers a Migrar (Ordem do SCRAPER_STATUS.md):**

| # | Scraper | Categoria | Complexidade |
|---|---------|-----------|--------------|
| 1 | statusinvest_scraper.py | Fundamentalista | Media |
| 2 | fundamentei_scraper.py | Fundamentalista | Alta |
| 3 | investidor10_scraper.py | Fundamentalista | Media |
| 4 | investsite_scraper.py | Fundamentalista | Media |
| 5 | tradingview_scraper.py | Tecnico | Alta |
| 6 | investing_scraper.py | Tecnico | Media |
| 7 | google_finance_scraper.py | Tecnico | Media |
| 8 | google_news_scraper.py | Noticias | Media |
| 9 | valor_scraper.py | Noticias | Alta |
| 10 | infomoney_scraper.py | Noticias | Media |
| 11 | exame_scraper.py | Noticias | Media |
| 12 | bloomberg_scraper.py | Noticias | Alta |
| 13 | investing_news_scraper.py | Noticias | Media |
| 14 | b3_scraper.py | Oficial | Alta |
| 15 | griffin_scraper.py | Insiders | Alta |
| 16 | opcoes_scraper.py | Opcoes | Alta |
| 17 | chatgpt_scraper.py | AI Browser | Alta |
| 18 | gemini_scraper.py | AI Browser | Media |
| 19 | deepseek_scraper.py | AI Browser | Media |
| 20 | claude_scraper.py | AI Browser | Media |
| 21 | grok_scraper.py | AI Browser | Media |
| 22 | estadao_scraper.py | Reports | Media |
| 23 | mais_retorno_scraper.py | Reports | Media |
| 24 | coinmarketcap_scraper.py | Crypto | Baixa (API) |

**Padrao Obrigatorio:**
```python
# Single HTML fetch + BeautifulSoup local parsing
html_content = await page.content()  # await UNICO
soup = BeautifulSoup(html_content, 'html.parser')
tables = soup.select("table")  # local, sem await
```

**Documentacao:** `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md`

**Entregaveis:**
- [ ] Todos 24 scrapers migrados
- [ ] Testes unitarios por scraper
- [ ] main.py atualizado com todos scrapers habilitados
- [ ] SCRAPER_STATUS.md atualizado

---

### FASE 65: TimescaleDB + Dados Intraday

**Objetivo:** Suportar dados de alta frequencia (1h, 15min, 5min)
**Prioridade:** ALTA (usuario confirmou necessidade de intraday)
**Estimativa:** 15-20h

**Tarefas:**

- [ ] **65.1. Setup Docker:**
  - Adicionar `timescaledb` ao `docker-compose.yml`
  - Configurar extensao no PostgreSQL

- [ ] **65.2. Migracao de Schema:**
  - Converter `asset_prices` em **Hypertable**
  - Criar indices otimizados para time-series

- [ ] **65.3. Continuous Aggregates:**
  - Criar velas de 1h (intraday trading)
  - Criar velas de 1d (atual - otimizado)
  - Criar velas de 1sem (analise longo prazo)

- [ ] **65.4. API de Intraday:**
  - Endpoint `/market-data/{ticker}/intraday`
  - Parametros: interval (1h, 15m, 5m), period

- [ ] **65.5. Frontend Intraday:**
  - Adicionar opcoes de timeframe no picker
  - Integrar com Lightweight Charts

**Entregaveis:**
- [ ] TimescaleDB rodando em Docker
- [ ] Hypertable para asset_prices
- [ ] 3 Continuous Aggregates (1h, 1d, 1sem)
- [ ] API endpoint intraday funcional
- [ ] Frontend com opcoes de timeframe

---

### FASE 66: FundamentalGrid Frontend

**Objetivo:** Conectar API de fundamentals ao frontend (atualmente placeholder)
**Prioridade:** ALTA (API existe, frontend nao exibe)
**Estimativa:** 6-8h

**Tarefas:**

- [ ] **66.1. Componente FundamentalGrid:**
  - Grid responsivo (4 colunas desktop, 2 mobile)
  - Cards para cada indicador

- [ ] **66.2. Indicadores a Exibir:**

  | Grupo | Indicadores |
  |-------|-------------|
  | Valuation | P/L, P/VP, P/SR, EV/EBITDA, PEG |
  | Rentabilidade | ROE, ROA, ROIC, Margem Liquida |
  | Divida | Div. Liq./PL, Div. Liq./EBITDA |
  | Dividendos | Dividend Yield, Payout |
  | Crescimento | CAGR Receitas 5a, CAGR Lucros 5a |

- [ ] **66.3. Tooltips Educativos:**
  - Definicao de cada indicador
  - Referencia: valores tipicos por setor
  - Fonte do dado (consensus badge)

- [ ] **66.4. Source Badges:**
  - Mostrar de qual scraper veio cada valor
  - Indicar nivel de consenso (verde/amarelo/vermelho)
  - Tooltip com todas as fontes

**Entregaveis:**
- [ ] Componente `FundamentalGrid` criado
- [ ] Integrado na pagina `/assets/[ticker]`
- [ ] Tooltips funcionais
- [ ] Source badges com consenso

---

### FASE 67: Dashboard de Discrepancias

**Objetivo:** Visualizar as 2988 discrepancias detectadas pelo backend
**Prioridade:** ALTA (dados existem, frontend nao exibe)
**Estimativa:** 8-10h

**Tarefas:**

- [ ] **67.1. Nova Pagina `/discrepancies`:**
  - Rota no App Router
  - Layout com filtros e tabela

- [ ] **67.2. Filtros:**
  - Por severidade (high/medium/low)
  - Por ativo (ticker)
  - Por campo (P/L, ROE, etc)
  - Por data range

- [ ] **67.3. Tabela de Discrepancias:**
  - Colunas: Ticker, Campo, Fonte A, Fonte B, Delta %, Severidade
  - Ordenacao por severidade (mais criticas primeiro)
  - Paginacao

- [ ] **67.4. Drill-down:**
  - Clicar em ativo -> ir para pagina do ativo
  - Ver todas fontes lado a lado
  - Historico de discrepancias

- [ ] **67.5. Metricas Agregadas:**
  - Total por severidade
  - Top 10 ativos com mais discrepancias
  - Top 10 campos mais inconsistentes

**Entregaveis:**
- [ ] Pagina `/discrepancies` funcional
- [ ] Filtros e ordenacao
- [ ] Drill-down para ativos
- [ ] Dashboard com metricas agregadas

---

### FASE 68: AI Sentiment (Gemini)

**Objetivo:** Analise automatica de noticias com sentimento
**Prioridade:** MEDIA (Gemini MCP ja integrado)
**Estimativa:** 12-15h

**Tarefas:**

- [ ] **68.1. Entidade News:**
  ```typescript
  @Entity()
  export class News {
    id: string;
    title: string;
    source: string;
    url: string;
    publishedAt: Date;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number; // -1 a +1
    relatedTickers: string[];
    analyzedAt: Date;
  }
  ```

- [ ] **68.2. Pipeline de Coleta:**
  - Scraper Google News (FASE 64)
  - Armazenar em tabela News
  - Relacionar com tickers mencionados

- [ ] **68.3. Analise Gemini:**
  - Prompt estruturado para sentiment
  - Batch processing (nao real-time)
  - Rate limiting para API gratuita

- [ ] **68.4. Termometro do Mercado:**
  - Widget no Dashboard
  - Agregacao de sentimento por setor
  - Tendencia ultimas 24h/7d

- [ ] **68.5. Noticias por Ativo:**
  - Secao na pagina `/assets/[ticker]`
  - Ultimas 10 noticias com sentimento
  - Link para fonte original

**Entregaveis:**
- [ ] Entidade News no banco
- [ ] Scraper coletando noticias
- [ ] Gemini analisando sentimento
- [ ] Widget "Termometro do Mercado"
- [ ] Noticias na pagina do ativo

---

### FASE 69+: Infraestrutura Avancada (Opcional)

**Prioridade:** BAIXA (implementar apenas se necessario)

#### 69.1. Meilisearch (Busca Textual)
- Indexar ativos por nome/ticker
- Indexar noticias por conteudo
- Busca fuzzy e autocomplete

#### 69.2. MinIO (Data Lake)
- Backup de HTML bruto dos scrapers
- Auditoria de dados coletados
- Reproducibilidade de parsing

#### 69.3. Sistema de Alertas
- Entidades Alert + AlertHistory
- Alertas de preco (acima/abaixo de X)
- Alertas de indicador (P/L < Y)
- Notificacoes via WebSocket

#### 69.4. Opcoes (Options Data)
- Entidade OptionPrice
- Scraper opcoes.net.br (FASE 64)
- Visualizacao de cadeia de opcoes
- Greeks basicos (Delta, Gamma, Theta)

---

## 4. Cronograma Sugerido

| Fase | Descricao | Estimativa | Dependencias |
|------|-----------|------------|--------------|
| 64 | Migracao Playwright | 40-60h | Nenhuma |
| 65 | TimescaleDB + Intraday | 15-20h | Nenhuma |
| 66 | FundamentalGrid | 6-8h | Scrapers fundamentalistas (64) |
| 67 | Dashboard Discrepancias | 8-10h | Nenhuma |
| 68 | AI Sentiment | 12-15h | Scraper noticias (64) |
| 69+ | Avancado | Variavel | Fases 64-68 |

**Total Estimado:** 80-115h para fases 64-68

---

## 5. Proximos Passos Imediatos

1. **Iniciar FASE 64** - Migracao Playwright (maior bloqueador)
2. **Em paralelo:** Preparar docker-compose para TimescaleDB
3. **Apos primeiros 5 scrapers:** Iniciar FundamentalGrid

**Status:** PRONTO PARA EXECUCAO

---

*Documento recalibrado a partir de validacao critica do MASTER_ROADMAP v1.0*
*Claude Code + Exploracao completa do Codebase + Confirmacao do Usuario*
*Data: 2025-12-03*
