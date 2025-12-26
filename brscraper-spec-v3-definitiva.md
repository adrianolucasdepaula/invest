# BRScraper v3: Especificação Técnica Definitiva

## 📋 Documento de Controle

| Campo | Valor |
|-------|-------|
| **Versão** | 3.0.0 (Definitiva) |
| **Data** | 2025-01-XX |
| **Autor** | Claude + Adriano |
| **Status** | Pronto para Implementação |

---

## 🎯 Visão Geral do Projeto

### Objetivo Principal
Sistema completo de coleta, consolidação e análise de dados financeiros brasileiros para suporte a decisões de trading em múltiplos horizontes temporais.

### Pipeline de Dados
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ COLETA  │───▶│ PROCESS │───▶│ CONSOL. │───▶│ ANÁLISE │───▶│RELATÓRIO│  │
│  │ (Scrape)│    │ (Parse) │    │ (Merge) │    │ (LLMs)  │    │ (Output)│  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│   raw/*.html    processed/    consolidated/   analysis/     reports/      │
│   raw/*.json      *.md         {TICKER}.md    {TICKER}/     daily.md      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Especificações Técnicas

| Parâmetro | Valor |
|-----------|-------|
| Volume diário | ~50 páginas |
| Frequência | 1x/dia às 09:00 BRT |
| Custo | R$ 0 (100% self-hosted) |
| Runtime | Python 3.11+ |
| Container | Docker + docker-compose |
| Storage | SQLite + JSON/Markdown |

---

## 📊 Inventário Completo de Sites

### Legenda de Tipos de Acesso

| Código | Descrição | Fetcher |
|--------|-----------|---------|
| 🟢 API | API REST direta | `APIFetcher` |
| 🔵 OPEN | Acesso direto sem login | `SimpleFetcher` ou `BrowserFetcher` |
| 🟡 GOOGLE | Login via Google OAuth | `GoogleAuthFetcher` |
| 🟠 CREDS | Login com credenciais | `CredentialsFetcher` |
| 🔴 2FA | Requer 2FA (sessão manual) | `Session2FAFetcher` |
| 🟣 LLM | Interface de LLM | `LLMInterfaceFetcher` |
| ⚫ SKIP | Ignorar/Não implementar | - |

---

### 1. ANÁLISE DE FUNDAMENTOS (7 sites)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 1 | BRAPI | 🟢 API | brapi.dev | `/api/quote/{ticker}` | `brapi` | 1s | Token em .env |
| 2 | Fundamentus | 🔵 OPEN | fundamentus.com.br | `/detalhes.php?papel={ticker}`, `/resultado.php` | `fundamentus` | 5s | HTML estático |
| 3 | InvestSite | 🔵 OPEN | investsite.com.br | `/principais_indicadores.php?cod_ativo={ticker}` | `investsite` | 10s | JS leve |
| 4 | Oceans14 | 🔵 OPEN | oceans14.com.br | `/acoes/{ticker}` | `oceans14` | 10s | JS leve |
| 5 | Fundamentei | 🟡 GOOGLE | fundamentei.com | `/acao/{ticker}` | `fundamentei` | 15s | Login Google |
| 6 | Investidor10 | 🟡 GOOGLE | investidor10.com.br | `/acoes/{ticker}` | `investidor10` | 15s | Login Google |
| 7 | StatusInvest | 🟡 GOOGLE | statusinvest.com.br | `/acoes/{ticker}` | `statusinvest` | 30s | Cloudflare + Login |

---

### 2. ANÁLISE GERAL DO MERCADO (4 sites)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 8 | Investing.com BR | 🟡 GOOGLE | br.investing.com | `/equities/{ticker}`, `/indices/ibovespa` | `investing` | 30s | Heavy protection |
| 9 | ADVFN | 🟡 GOOGLE | br.advfn.com | `/bolsa-de-valores/bovespa/{ticker}/cotacao` | `advfn` | 20s | Login Google |
| 10 | Google Finance | 🟡 GOOGLE | google.com/finance | `/quote/{ticker}:BVMF` | `google_finance` | 15s | Login Google |
| 11 | Yahoo Finance | 🟡 GOOGLE | finance.yahoo.com | `/quote/{ticker}.SA` | `yahoo_finance` | 20s | Login Google |

---

### 3. ANÁLISE GRÁFICA/TÉCNICA (1 site)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 12 | TradingView | 🟡 GOOGLE | br.tradingview.com | `/symbols/BMFBOVESPA-{ticker}/technicals/` | `tradingview` | 60s | Heavy protection |

---

### 4. ANÁLISE DE OPÇÕES (2 sites)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 13 | Opções.net.br | 🟠 CREDS | opcoes.net.br | `/acoes/{ticker}` | `opcoes_net` | 15s | Login CPF/senha |
| 14 | OpLab | 🔵 OPEN | opcoes.oplab.com.br | `/mercado-de-opcoes` | `oplab` | 15s | Acesso direto |

---

### 5. ANÁLISE DE CRIPTOMOEDAS (2 fontes)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 15 | CoinGecko | 🟢 API | api.coingecko.com | `/api/v3/coins/{id}` | `coingecko` | 2s | Preferível ao CMC |
| 16 | CoinMarketCap | 🔵 OPEN | coinmarketcap.com | `/currencies/{coin}/` | `coinmarketcap` | 20s | Fallback apenas |

---

### 6. ANÁLISE DE INSIDERS (1 site)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 17 | Griffin | 🟡 GOOGLE | griffin.app.br | `/empresa/{ticker}` | `griffin` | 20s | Dados de insiders |

---

### 7. RELATÓRIOS INSTITUCIONAIS (4 sites)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 18 | BTG Research | 🔴 2FA | content.btgpactual.com | `/research/` | `btg` | 30s | 2FA celular - sessão manual |
| 19 | XP Conteúdos | 🔴 2FA | conteudos.xpi.com.br | `/` | `xp` | 30s | 2FA celular - sessão manual |
| 20 | E-Investidor | 🟡 GOOGLE | einvestidor.estadao.com.br | `/` | `einvestidor` | 15s | Login Google |
| 21 | Mais Retorno | 🟡 GOOGLE | maisretorno.com | `/` | `maisretorno` | 15s | Login Google |

---

### 8. DADOS OFICIAIS (3 sites)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 22 | B3 | 🟡 GOOGLE | b3.com.br | `/pt_br/produtos-e-servicos/negociacao/` | `b3` | 15s | Login Google |
| 23 | BCB | 🟢 API | api.bcb.gov.br | SGS series | `bcb` | 1s | API oficial |
| 24 | IBGE | 🟢 API | api.sidra.ibge.gov.br | SIDRA tables | `ibge` | 1s | API oficial |

---

### 9. NOTÍCIAS FINANCEIRAS (6 sites)

| # | Site | Tipo | URL Base | Páginas a Scrapar | Parser | Delay | Notas |
|---|------|------|----------|-------------------|--------|-------|-------|
| 25 | Google News | 🟡 GOOGLE | news.google.com | `/search?q={ticker}+ação` | `google_news` | 10s | Login Google |
| 26 | Bloomberg Línea | 🔵 OPEN | bloomberglinea.com.br | `/mercados/` | `bloomberg` | 10s | Sem login |
| 27 | Investing News | 🟡 GOOGLE | br.investing.com/news | `/` | `investing_news` | 20s | Login Google |
| 28 | Valor Econômico | 🟡 GOOGLE | valor.globo.com | `/` | `valor` | 20s | Pode ter paywall |
| 29 | Exame | 🟡 GOOGLE | exame.com | `/invest/` | `exame` | 20s | Login Google |
| 30 | InfoMoney | 🟡 GOOGLE | infomoney.com.br | `/` | `infomoney` | 20s | Login Google |

---

### 10. LLMs PARA ANÁLISE (6 interfaces)

| # | Site | Tipo | URL Base | Função | Seletores | Delay | Notas |
|---|------|------|----------|--------|-----------|-------|-------|
| 31 | ChatGPT | 🟣 LLM | chatgpt.com | Análise primária | Ver tabela seletores | 30s | Login Google |
| 32 | Claude | 🟣 LLM | claude.ai/new | Análise secundária | Ver tabela seletores | 30s | Login Google |
| 33 | Gemini | 🟣 LLM | gemini.google.com/app | Pesquisa + análise | Ver tabela seletores | 30s | Login Google |
| 34 | Perplexity | 🟣 LLM | perplexity.ai | Pesquisa web | Ver tabela seletores | 30s | Login Google |
| 35 | Grok | 🟣 LLM | grok.com | Análise alternativa | Ver tabela seletores | 30s | Login Google |
| 36 | DeepSeek | 🟣 LLM | deepseek.com | Análise técnica | Ver tabela seletores | 30s | Login Google |

---

### 11. BUSCADORES GERAIS (ignorar como fonte de dados)

| # | Site | Tipo | Motivo |
|---|------|------|--------|
| 37 | Google Search | ⚫ SKIP | Usar Google News ou APIs específicas |

---

## 📊 Resumo de Cobertura

| Categoria | Total | API | Open | Google | Creds | 2FA | LLM |
|-----------|-------|-----|------|--------|-------|-----|-----|
| Fundamentos | 7 | 1 | 3 | 3 | 0 | 0 | 0 |
| Mercado | 4 | 0 | 0 | 4 | 0 | 0 | 0 |
| Técnica | 1 | 0 | 0 | 1 | 0 | 0 | 0 |
| Opções | 2 | 0 | 1 | 0 | 1 | 0 | 0 |
| Crypto | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| Insiders | 1 | 0 | 0 | 1 | 0 | 0 | 0 |
| Research | 4 | 0 | 0 | 2 | 0 | 2 | 0 |
| Oficiais | 3 | 2 | 0 | 1 | 0 | 0 | 0 |
| Notícias | 6 | 0 | 1 | 5 | 0 | 0 | 0 |
| LLMs | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| **TOTAL** | **36** | **4** | **6** | **17** | **1** | **2** | **6** |

---

## 🏗️ Arquitetura Detalhada

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BRScraper v3                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         CAMADA DE INTERFACE                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │  FastAPI    │  │  Scheduler  │  │    CLI      │  │  Dashboard  │      │ │
│  │  │  REST API   │  │ APScheduler │  │   Typer     │  │   (Rich)    │      │ │
│  │  │  :8000      │  │  09:00 BRT  │  │             │  │             │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│  ┌───────────────────────────────────▼───────────────────────────────────────┐ │
│  │                         CAMADA DE ORQUESTRAÇÃO                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   Redis     │  │  Job Queue  │  │   Session   │  │   Error     │      │ │
│  │  │   Cache     │  │    (RQ)     │  │   Manager   │  │   Handler   │      │ │
│  │  │  :6379      │  │             │  │  (Cookies)  │  │  (Retry)    │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│  ┌───────────────────────────────────▼───────────────────────────────────────┐ │
│  │                         CAMADA DE FETCHERS                                │ │
│  │                                                                           │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │    API    │ │  Simple   │ │  Google   │ │   Creds   │ │    LLM    │  │ │
│  │  │  Fetcher  │ │  Fetcher  │ │   Auth    │ │  Fetcher  │ │ Interface │  │ │
│  │  │           │ │           │ │  Fetcher  │ │           │ │  Fetcher  │  │ │
│  │  │  BRAPI    │ │Fundamentus│ │ Invest10  │ │opcoes.net │ │  ChatGPT  │  │ │
│  │  │  BCB      │ │ OpLab     │ │ StatusInv │ │           │ │  Claude   │  │ │
│  │  │  IBGE     │ │ Bloomberg │ │ TradingV  │ │           │ │  Gemini   │  │ │
│  │  │ CoinGecko │ │           │ │  +15 more │ │           │ │  +3 more  │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  │                                                                           │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │ │
│  │  │                     Session 2FA (Manual)                          │   │ │
│  │  │  BTG Research, XP Conteúdos - Requer login manual prévio          │   │ │
│  │  └───────────────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│  ┌───────────────────────────────────▼───────────────────────────────────────┐ │
│  │                         CAMADA DE PROCESSAMENTO                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   Parsers   │  │  HTML→MD    │  │    Data     │  │  Validator  │      │ │
│  │  │ (30+ sites) │  │  Converter  │  │ Normalizer  │  │  (Schema)   │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│  ┌───────────────────────────────────▼───────────────────────────────────────┐ │
│  │                         CAMADA DE ANÁLISE                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │    Data     │  │   Prompt    │  │     LLM     │  │   Report    │      │ │
│  │  │Consolidator │  │  Builder    │  │  Analyzer   │  │  Generator  │      │ │
│  │  │             │  │ (templates) │  │             │  │             │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│  ┌───────────────────────────────────▼───────────────────────────────────────┐ │
│  │                         CAMADA DE STORAGE                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   SQLite    │  │    JSON     │  │  Markdown   │  │   Reports   │      │ │
│  │  │  (metadata) │  │   (raw)     │  │ (processed) │  │  (output)   │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios Definitiva

```
brscraper/
│
├── 📄 docker-compose.yml          # Orquestração de containers
├── 📄 Dockerfile                  # Build da imagem
├── 📄 Dockerfile.worker           # Build do worker
├── 📄 requirements.txt            # Dependências Python
├── 📄 requirements-dev.txt        # Dependências de desenvolvimento
├── 📄 .env.example                # Template de variáveis de ambiente
├── 📄 .env                        # ⚠️ NÃO COMMITAR - credenciais
├── 📄 .gitignore                  # Arquivos ignorados
├── 📄 README.md                   # Documentação principal
├── 📄 CHANGELOG.md                # Histórico de mudanças
├── 📄 LICENSE                     # Licença MIT
│
├── 📁 src/                        # Código fonte
│   ├── 📄 __init__.py
│   ├── 📄 main.py                 # FastAPI entry point
│   ├── 📄 cli.py                  # CLI com Typer
│   ├── 📄 config.py               # Configurações Pydantic
│   ├── 📄 constants.py            # Constantes do sistema
│   │
│   ├── 📁 api/                    # API REST
│   │   ├── 📄 __init__.py
│   │   ├── 📄 routes/
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 scrape.py       # /scrape endpoints
│   │   │   ├── 📄 analyze.py      # /analyze endpoints
│   │   │   ├── 📄 reports.py      # /reports endpoints
│   │   │   └── 📄 health.py       # /health endpoints
│   │   ├── 📄 schemas.py          # Pydantic models
│   │   ├── 📄 dependencies.py     # FastAPI dependencies
│   │   └── 📄 middleware.py       # Middlewares
│   │
│   ├── 📁 core/                   # Componentes centrais
│   │   ├── 📄 __init__.py
│   │   ├── 📄 scheduler.py        # APScheduler
│   │   ├── 📄 queue.py            # Redis Queue
│   │   ├── 📄 worker.py           # RQ Worker
│   │   ├── 📄 session_manager.py  # Gerenciador de sessões/cookies
│   │   ├── 📄 storage.py          # SQLite + File storage
│   │   ├── 📄 cache.py            # Redis cache
│   │   └── 📄 error_handler.py    # Tratamento centralizado de erros
│   │
│   ├── 📁 fetchers/               # Coletores de dados
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py             # BaseFetcher abstrato
│   │   ├── 📄 api_fetcher.py      # Para APIs REST
│   │   ├── 📄 simple_fetcher.py   # requests + BeautifulSoup
│   │   ├── 📄 browser_fetcher.py  # nodriver base
│   │   ├── 📄 google_auth_fetcher.py    # nodriver + cookies Google
│   │   ├── 📄 credentials_fetcher.py    # nodriver + user/pass
│   │   ├── 📄 session_2fa_fetcher.py    # Para sites com 2FA
│   │   └── 📄 llm_interface_fetcher.py  # Automação de LLMs
│   │
│   ├── 📁 parsers/                # Processadores de conteúdo
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py             # BaseParser abstrato
│   │   ├── 📄 html_to_markdown.py # Conversor HTML→MD
│   │   ├── 📄 data_extractor.py   # Extração estruturada
│   │   │
│   │   ├── 📁 fundamentos/        # Parsers de fundamentos
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 brapi.py
│   │   │   ├── 📄 fundamentus.py
│   │   │   ├── 📄 investidor10.py
│   │   │   ├── 📄 statusinvest.py
│   │   │   ├── 📄 fundamentei.py
│   │   │   ├── 📄 investsite.py
│   │   │   └── 📄 oceans14.py
│   │   │
│   │   ├── 📁 mercado/            # Parsers de mercado
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 investing.py
│   │   │   ├── 📄 advfn.py
│   │   │   ├── 📄 google_finance.py
│   │   │   └── 📄 yahoo_finance.py
│   │   │
│   │   ├── 📁 tecnica/            # Parsers de análise técnica
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 tradingview.py
│   │   │
│   │   ├── 📁 opcoes/             # Parsers de opções
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 opcoes_net.py
│   │   │   └── 📄 oplab.py
│   │   │
│   │   ├── 📁 crypto/             # Parsers de crypto
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 coingecko.py
│   │   │   └── 📄 coinmarketcap.py
│   │   │
│   │   ├── 📁 insiders/           # Parsers de insiders
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 griffin.py
│   │   │
│   │   ├── 📁 research/           # Parsers de research
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 btg.py
│   │   │   ├── 📄 xp.py
│   │   │   ├── 📄 einvestidor.py
│   │   │   └── 📄 maisretorno.py
│   │   │
│   │   ├── 📁 oficiais/           # Parsers oficiais
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 bcb.py
│   │   │   ├── 📄 ibge.py
│   │   │   └── 📄 b3.py
│   │   │
│   │   └── 📁 noticias/           # Parsers de notícias
│   │       ├── 📄 __init__.py
│   │       ├── 📄 google_news.py
│   │       ├── 📄 bloomberg.py
│   │       ├── 📄 investing_news.py
│   │       ├── 📄 valor.py
│   │       ├── 📄 exame.py
│   │       └── 📄 infomoney.py
│   │
│   ├── 📁 analyzers/              # Analisadores
│   │   ├── 📄 __init__.py
│   │   ├── 📄 consolidator.py     # Consolida dados de múltiplas fontes
│   │   ├── 📄 llm_analyzer.py     # Envia para LLMs
│   │   ├── 📄 report_generator.py # Gera relatórios
│   │   └── 📄 scoring.py          # Sistema de scoring
│   │
│   ├── 📁 prompts/                # Templates de prompts
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py             # PromptBuilder base
│   │   ├── 📄 daytrade.py         # Prompts day trade
│   │   ├── 📄 swingtrade.py       # Prompts swing trade
│   │   ├── 📄 position.py         # Prompts position
│   │   ├── 📄 market_overview.py  # Visão geral do mercado
│   │   └── 📄 sector_analysis.py  # Análise setorial
│   │
│   ├── 📁 sites/                  # Configuração de sites
│   │   ├── 📄 __init__.py
│   │   ├── 📄 registry.py         # Registro central de sites
│   │   ├── 📄 selectors.py        # Seletores CSS/XPath
│   │   └── 📄 llm_selectors.py    # Seletores específicos de LLMs
│   │
│   ├── 📁 models/                 # Modelos de dados
│   │   ├── 📄 __init__.py
│   │   ├── 📄 database.py         # SQLAlchemy models
│   │   ├── 📄 ticker.py           # TickerData model
│   │   ├── 📄 analysis.py         # Analysis model
│   │   └── 📄 report.py           # Report model
│   │
│   └── 📁 utils/                  # Utilitários
│       ├── 📄 __init__.py
│       ├── 📄 user_agents.py      # Rotação de UA
│       ├── 📄 delays.py           # Delays humanizados
│       ├── 📄 retry.py            # Retry com backoff
│       ├── 📄 crypto.py           # Criptografia
│       ├── 📄 validators.py       # Validadores
│       ├── 📄 formatters.py       # Formatadores
│       └── 📄 logger.py           # Logging estruturado
│
├── 📁 data/                       # Dados (gitignored)
│   ├── 📁 raw/                    # Dados brutos
│   │   └── 📁 YYYY-MM-DD/         # Por data
│   │       ├── 📄 brapi.json
│   │       ├── 📄 fundamentus.html
│   │       └── 📄 ...
│   │
│   ├── 📁 processed/              # Dados processados
│   │   └── 📁 YYYY-MM-DD/
│   │       ├── 📄 brapi.md
│   │       ├── 📄 fundamentus.md
│   │       └── 📄 ...
│   │
│   ├── 📁 consolidated/           # Dados consolidados por ticker
│   │   └── 📁 YYYY-MM-DD/
│   │       ├── 📄 PETR4.json
│   │       ├── 📄 PETR4.md
│   │       └── 📄 ...
│   │
│   ├── 📁 analysis/               # Análises dos LLMs
│   │   └── 📁 YYYY-MM-DD/
│   │       └── 📁 PETR4/
│   │           ├── 📄 daytrade.md
│   │           ├── 📄 swingtrade.md
│   │           └── 📄 position.md
│   │
│   ├── 📁 reports/                # Relatórios finais
│   │   └── 📁 YYYY-MM-DD/
│   │       ├── 📄 daily_report.md
│   │       ├── 📄 market_overview.md
│   │       └── 📄 alerts.md
│   │
│   ├── 📁 cookies/                # Cookies do sistema externo
│   │   └── 📄 google_session.json
│   │
│   ├── 📁 cache/                  # Cache de requisições
│   │
│   ├── 📁 logs/                   # Logs do sistema
│   │   └── 📄 brscraper.log
│   │
│   └── 📄 brscraper.db            # SQLite database
│
├── 📁 tests/                      # Testes
│   ├── 📄 __init__.py
│   ├── 📄 conftest.py             # Fixtures pytest
│   │
│   ├── 📁 unit/                   # Testes unitários
│   │   ├── 📄 test_fetchers.py
│   │   ├── 📄 test_parsers.py
│   │   ├── 📄 test_analyzers.py
│   │   └── 📄 test_utils.py
│   │
│   ├── 📁 integration/            # Testes de integração
│   │   ├── 📄 test_api.py
│   │   ├── 📄 test_workflow.py
│   │   └── 📄 test_llm.py
│   │
│   └── 📁 e2e/                    # Testes end-to-end
│       ├── 📄 test_full_pipeline.py
│       └── 📄 test_sites.py
│
├── 📁 scripts/                    # Scripts utilitários
│   ├── 📄 run_once.py             # Executar scraping manualmente
│   ├── 📄 test_site.py            # Testar site específico
│   ├── 📄 analyze_ticker.py       # Analisar ticker específico
│   ├── 📄 export_data.py          # Exportar dados
│   ├── 📄 validate_cookies.py     # Validar cookies
│   ├── 📄 refresh_session.py      # Atualizar sessão 2FA
│   └── 📄 cleanup_old_data.py     # Limpar dados antigos
│
├── 📁 docs/                       # Documentação
│   ├── 📄 SETUP.md                # Guia de instalação
│   ├── 📄 USAGE.md                # Guia de uso
│   ├── 📄 API.md                  # Documentação da API
│   ├── 📄 COOKIES.md              # Guia de configuração de cookies
│   ├── 📄 TROUBLESHOOTING.md      # Solução de problemas
│   └── 📄 CONTRIBUTING.md         # Guia de contribuição
│
└── 📁 config/                     # Configurações adicionais
    ├── 📄 tickers.json            # Lista de tickers a monitorar
    ├── 📄 schedule.json           # Configuração de agendamento
    └── 📄 alerts.json             # Configuração de alertas
```

---

## 🔐 Configuração de Ambiente

### .env.example (COMPLETO)

```env
# =============================================================================
# BRScraper v3 - Configuração de Ambiente
# =============================================================================
# IMPORTANTE: Copie este arquivo para .env e preencha os valores
# NUNCA commite o arquivo .env no git!
# =============================================================================

# -----------------------------------------------------------------------------
# APLICAÇÃO
# -----------------------------------------------------------------------------
APP_NAME=BRScraper
APP_VERSION=3.0.0
DEBUG=false
LOG_LEVEL=INFO
# Opções: DEBUG, INFO, WARNING, ERROR, CRITICAL

# -----------------------------------------------------------------------------
# SERVIDOR
# -----------------------------------------------------------------------------
API_HOST=0.0.0.0
API_PORT=8000
WORKERS=1

# -----------------------------------------------------------------------------
# REDIS
# -----------------------------------------------------------------------------
REDIS_URL=redis://localhost:6379
REDIS_DB=0
REDIS_MAX_CONNECTIONS=10

# -----------------------------------------------------------------------------
# DATABASE
# -----------------------------------------------------------------------------
DATABASE_URL=sqlite:///./data/brscraper.db
# Para PostgreSQL (produção):
# DATABASE_URL=postgresql://user:pass@localhost:5432/brscraper

# -----------------------------------------------------------------------------
# STORAGE
# -----------------------------------------------------------------------------
DATA_DIR=./data
RAW_DATA_DIR=./data/raw
PROCESSED_DATA_DIR=./data/processed
CONSOLIDATED_DATA_DIR=./data/consolidated
ANALYSIS_DATA_DIR=./data/analysis
REPORTS_DATA_DIR=./data/reports
COOKIES_DIR=./data/cookies
CACHE_DIR=./data/cache
LOGS_DIR=./data/logs

# -----------------------------------------------------------------------------
# SCHEDULER
# -----------------------------------------------------------------------------
SCHEDULER_ENABLED=true
DAILY_RUN_HOUR=9
DAILY_RUN_MINUTE=0
TIMEZONE=America/Sao_Paulo

# -----------------------------------------------------------------------------
# SCRAPING - CONFIGURAÇÕES GERAIS
# -----------------------------------------------------------------------------
DEFAULT_DELAY_SECONDS=10
MAX_RETRIES=3
REQUEST_TIMEOUT_SECONDS=30
MAX_CONCURRENT_REQUESTS=3

# Headless mode (false = abre janela do browser, melhor para debug)
BROWSER_HEADLESS=true

# -----------------------------------------------------------------------------
# APIs EXTERNAS
# -----------------------------------------------------------------------------

# BRAPI - Dados B3
# Obter em: https://brapi.dev/
BRAPI_TOKEN=

# CoinGecko (opcional, aumenta rate limit)
# COINGECKO_API_KEY=

# -----------------------------------------------------------------------------
# CREDENCIAIS DE SITES
# -----------------------------------------------------------------------------

# Opções.net.br
# ATENÇÃO: Use seu CPF e senha reais
OPCOES_NET_USER=
OPCOES_NET_PASS=

# -----------------------------------------------------------------------------
# SISTEMA DE COOKIES (Integração com sistema externo)
# -----------------------------------------------------------------------------

# OPÇÃO 1: Arquivo JSON exportado do seu sistema
COOKIES_SOURCE=file
COOKIES_FILE_PATH=./data/cookies/google_session.json

# OPÇÃO 2: API do seu sistema de cookies
# COOKIES_SOURCE=api
# COOKIES_API_URL=http://localhost:5000/api/cookies
# COOKIES_API_KEY=

# OPÇÃO 3: Perfil do Chrome (usa perfil existente)
# COOKIES_SOURCE=chrome_profile
# CHROME_USER_DATA_DIR=/home/adriano/.config/google-chrome
# CHROME_PROFILE=Default

# -----------------------------------------------------------------------------
# CONFIGURAÇÃO DOS LLMs
# -----------------------------------------------------------------------------

# LLM primário para análise
PRIMARY_LLM=chatgpt
# Opções: chatgpt, claude, gemini, perplexity, grok, deepseek

# LLMs de backup (em ordem de preferência, separados por vírgula)
BACKUP_LLMS=perplexity,claude,gemini

# Timeout para resposta do LLM (segundos)
LLM_RESPONSE_TIMEOUT=120

# Tamanho máximo do prompt (caracteres)
LLM_MAX_PROMPT_SIZE=50000

# -----------------------------------------------------------------------------
# TICKERS MONITORADOS
# -----------------------------------------------------------------------------
# Lista de tickers padrão (separados por vírgula)
# Pode ser sobrescrito via config/tickers.json
DEFAULT_TICKERS=PETR4,VALE3,ITUB4,BBDC4,WEGE3,RENT3,MGLU3,ABEV3,B3SA3,LREN3

# -----------------------------------------------------------------------------
# ALERTAS E NOTIFICAÇÕES
# -----------------------------------------------------------------------------
# ALERTS_ENABLED=false
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
# EMAIL_SMTP_HOST=
# EMAIL_SMTP_PORT=
# EMAIL_USER=
# EMAIL_PASS=
# EMAIL_TO=

# -----------------------------------------------------------------------------
# MONITORAMENTO
# -----------------------------------------------------------------------------
# SENTRY_DSN=
# PROMETHEUS_ENABLED=false
# PROMETHEUS_PORT=9090

# -----------------------------------------------------------------------------
# DESENVOLVIMENTO
# -----------------------------------------------------------------------------
# Modo de desenvolvimento (mais logs, recarrega automaticamente)
DEV_MODE=false

# Salvar screenshots de debug
SAVE_DEBUG_SCREENSHOTS=false
DEBUG_SCREENSHOTS_DIR=./data/debug/screenshots
```

---

## 📦 Dependências Completas

### requirements.txt

```txt
# =============================================================================
# BRScraper v3 - Dependências de Produção
# =============================================================================

# -----------------------------------------------------------------------------
# Core Framework
# -----------------------------------------------------------------------------
fastapi==0.109.2
uvicorn[standard]==0.27.1
pydantic==2.6.1
pydantic-settings==2.2.1
python-dotenv==1.0.1
typer[all]==0.9.0

# -----------------------------------------------------------------------------
# Browser Automation
# -----------------------------------------------------------------------------
nodriver==0.38
playwright==1.41.2
# crawl4ai>=0.3.0  # Opcional, adicionar se necessário

# -----------------------------------------------------------------------------
# HTTP Clients
# -----------------------------------------------------------------------------
httpx==0.27.0
aiohttp==3.9.3
curl_cffi==0.6.2
requests==2.31.0

# -----------------------------------------------------------------------------
# HTML Parsing
# -----------------------------------------------------------------------------
selectolax==0.3.21
beautifulsoup4==4.12.3
lxml==5.1.0
html5lib==1.1

# -----------------------------------------------------------------------------
# Markdown
# -----------------------------------------------------------------------------
markdownify==0.11.6
trafilatura==1.8.1

# -----------------------------------------------------------------------------
# APIs Brasileiras
# -----------------------------------------------------------------------------
python-bcb==0.2.0
sidrapy==0.1.5
yfinance==0.2.36

# -----------------------------------------------------------------------------
# Crypto APIs
# -----------------------------------------------------------------------------
pycoingecko==3.1.0

# -----------------------------------------------------------------------------
# Queue & Background Tasks
# -----------------------------------------------------------------------------
redis==5.0.1
rq==1.16.0
apscheduler==3.10.4
celery==5.3.6  # Alternativa ao RQ se precisar de mais recursos

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
sqlalchemy==2.0.25
aiosqlite==0.19.0
alembic==1.13.1  # Migrações de banco

# -----------------------------------------------------------------------------
# Async
# -----------------------------------------------------------------------------
asyncio==3.4.3
aiofiles==23.2.1

# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------
fake-useragent==1.4.0
tenacity==8.2.3
python-dateutil==2.8.2
pytz==2024.1
orjson==3.9.14  # JSON rápido

# -----------------------------------------------------------------------------
# Logging & Monitoring
# -----------------------------------------------------------------------------
structlog==24.1.0
rich==13.7.0
loguru==0.7.2

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
cryptography==42.0.2
python-jose[cryptography]==3.3.0

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------
email-validator==2.1.0.post1

# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------
click==8.1.7
questionary==2.0.1  # Para prompts interativos
```

### requirements-dev.txt

```txt
# =============================================================================
# BRScraper v3 - Dependências de Desenvolvimento
# =============================================================================

-r requirements.txt

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------
pytest==8.0.0
pytest-asyncio==0.23.4
pytest-cov==4.1.0
pytest-mock==3.12.0
pytest-xdist==3.5.0  # Testes paralelos
httpx-mock==0.0.12
respx==0.20.2

# -----------------------------------------------------------------------------
# Code Quality
# -----------------------------------------------------------------------------
black==24.1.1
ruff==0.2.0
mypy==1.8.0
isort==5.13.2
pre-commit==3.6.0

# -----------------------------------------------------------------------------
# Documentation
# -----------------------------------------------------------------------------
mkdocs==1.5.3
mkdocs-material==9.5.6
mkdocstrings[python]==0.24.0

# -----------------------------------------------------------------------------
# Debugging
# -----------------------------------------------------------------------------
ipython==8.21.0
ipdb==0.13.13
debugpy==1.8.0

# -----------------------------------------------------------------------------
# Type Stubs
# -----------------------------------------------------------------------------
types-requests==2.31.0.20240125
types-redis==4.6.0.20240106
types-python-dateutil==2.8.19.20240106
```

---

## 🔧 Implementação dos Componentes Principais

### 1. config.py (Configuração Robusta)

```python
"""
Configuração centralizada do BRScraper usando Pydantic Settings.
"""

from functools import lru_cache
from pathlib import Path
from typing import List, Optional, Literal
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações do BRScraper carregadas de variáveis de ambiente."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # -------------------------------------------------------------------------
    # Aplicação
    # -------------------------------------------------------------------------
    app_name: str = "BRScraper"
    app_version: str = "3.0.0"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    
    # -------------------------------------------------------------------------
    # Servidor
    # -------------------------------------------------------------------------
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    workers: int = 1
    
    # -------------------------------------------------------------------------
    # Redis
    # -------------------------------------------------------------------------
    redis_url: str = "redis://localhost:6379"
    redis_db: int = 0
    redis_max_connections: int = 10
    
    # -------------------------------------------------------------------------
    # Database
    # -------------------------------------------------------------------------
    database_url: str = "sqlite:///./data/brscraper.db"
    
    # -------------------------------------------------------------------------
    # Storage
    # -------------------------------------------------------------------------
    data_dir: Path = Path("./data")
    raw_data_dir: Optional[Path] = None
    processed_data_dir: Optional[Path] = None
    consolidated_data_dir: Optional[Path] = None
    analysis_data_dir: Optional[Path] = None
    reports_data_dir: Optional[Path] = None
    cookies_dir: Optional[Path] = None
    cache_dir: Optional[Path] = None
    logs_dir: Optional[Path] = None
    
    # -------------------------------------------------------------------------
    # Scheduler
    # -------------------------------------------------------------------------
    scheduler_enabled: bool = True
    daily_run_hour: int = Field(default=9, ge=0, le=23)
    daily_run_minute: int = Field(default=0, ge=0, le=59)
    timezone: str = "America/Sao_Paulo"
    
    # -------------------------------------------------------------------------
    # Scraping
    # -------------------------------------------------------------------------
    default_delay_seconds: int = Field(default=10, ge=1, le=300)
    max_retries: int = Field(default=3, ge=1, le=10)
    request_timeout_seconds: int = Field(default=30, ge=5, le=120)
    max_concurrent_requests: int = Field(default=3, ge=1, le=10)
    browser_headless: bool = True
    
    # -------------------------------------------------------------------------
    # APIs
    # -------------------------------------------------------------------------
    brapi_token: Optional[str] = None
    coingecko_api_key: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # Credenciais de Sites
    # -------------------------------------------------------------------------
    opcoes_net_user: Optional[str] = None
    opcoes_net_pass: Optional[str] = None
    
    # -------------------------------------------------------------------------
    # Sistema de Cookies
    # -------------------------------------------------------------------------
    cookies_source: Literal["file", "api", "chrome_profile"] = "file"
    cookies_file_path: Optional[Path] = None
    cookies_api_url: Optional[str] = None
    cookies_api_key: Optional[str] = None
    chrome_user_data_dir: Optional[str] = None
    chrome_profile: str = "Default"
    
    # -------------------------------------------------------------------------
    # LLMs
    # -------------------------------------------------------------------------
    primary_llm: Literal["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek"] = "chatgpt"
    backup_llms: str = "perplexity,claude,gemini"
    llm_response_timeout: int = Field(default=120, ge=30, le=300)
    llm_max_prompt_size: int = Field(default=50000, ge=1000, le=100000)
    
    # -------------------------------------------------------------------------
    # Tickers
    # -------------------------------------------------------------------------
    default_tickers: str = "PETR4,VALE3,ITUB4,BBDC4,WEGE3"
    
    # -------------------------------------------------------------------------
    # Desenvolvimento
    # -------------------------------------------------------------------------
    dev_mode: bool = False
    save_debug_screenshots: bool = False
    debug_screenshots_dir: Optional[Path] = None
    
    # -------------------------------------------------------------------------
    # Validators
    # -------------------------------------------------------------------------
    
    @model_validator(mode="after")
    def set_default_paths(self) -> "Settings":
        """Define paths padrão baseados em data_dir."""
        if self.raw_data_dir is None:
            self.raw_data_dir = self.data_dir / "raw"
        if self.processed_data_dir is None:
            self.processed_data_dir = self.data_dir / "processed"
        if self.consolidated_data_dir is None:
            self.consolidated_data_dir = self.data_dir / "consolidated"
        if self.analysis_data_dir is None:
            self.analysis_data_dir = self.data_dir / "analysis"
        if self.reports_data_dir is None:
            self.reports_data_dir = self.data_dir / "reports"
        if self.cookies_dir is None:
            self.cookies_dir = self.data_dir / "cookies"
        if self.cache_dir is None:
            self.cache_dir = self.data_dir / "cache"
        if self.logs_dir is None:
            self.logs_dir = self.data_dir / "logs"
        if self.cookies_file_path is None:
            self.cookies_file_path = self.cookies_dir / "google_session.json"
        if self.debug_screenshots_dir is None:
            self.debug_screenshots_dir = self.data_dir / "debug" / "screenshots"
        return self
    
    @field_validator("backup_llms", mode="before")
    @classmethod
    def parse_backup_llms(cls, v: str) -> str:
        """Valida lista de LLMs de backup."""
        if isinstance(v, str):
            valid_llms = {"chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek"}
            llms = [l.strip().lower() for l in v.split(",")]
            for llm in llms:
                if llm and llm not in valid_llms:
                    raise ValueError(f"LLM inválido: {llm}")
        return v
    
    @field_validator("default_tickers", mode="before")
    @classmethod
    def parse_tickers(cls, v: str) -> str:
        """Valida e normaliza lista de tickers."""
        if isinstance(v, str):
            tickers = [t.strip().upper() for t in v.split(",")]
            return ",".join(tickers)
        return v
    
    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------
    
    @property
    def backup_llms_list(self) -> List[str]:
        """Retorna lista de LLMs de backup."""
        return [l.strip() for l in self.backup_llms.split(",") if l.strip()]
    
    @property
    def default_tickers_list(self) -> List[str]:
        """Retorna lista de tickers padrão."""
        return [t.strip() for t in self.default_tickers.split(",") if t.strip()]
    
    def ensure_directories(self) -> None:
        """Cria todos os diretórios necessários."""
        dirs = [
            self.data_dir,
            self.raw_data_dir,
            self.processed_data_dir,
            self.consolidated_data_dir,
            self.analysis_data_dir,
            self.reports_data_dir,
            self.cookies_dir,
            self.cache_dir,
            self.logs_dir,
        ]
        for d in dirs:
            if d:
                d.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    """Retorna instância singleton das configurações."""
    settings = Settings()
    settings.ensure_directories()
    return settings


# Alias para acesso rápido
settings = get_settings()
```

---

### 2. Session Manager (Integração Robusta com Cookies)

```python
"""
Gerenciador de sessões com suporte a múltiplas fontes de cookies.
"""

import json
import sqlite3
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import httpx
import structlog

from ..config import settings

logger = structlog.get_logger()


@dataclass
class Cookie:
    """Representa um cookie HTTP."""
    name: str
    value: str
    domain: str
    path: str = "/"
    expires: Optional[float] = None
    http_only: bool = False
    secure: bool = False
    same_site: str = "Lax"
    
    def is_expired(self) -> bool:
        """Verifica se o cookie expirou."""
        if self.expires is None:
            return False  # Session cookie
        return datetime.now().timestamp() > self.expires
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "name": self.name,
            "value": self.value,
            "domain": self.domain,
            "path": self.path,
            "expires": self.expires,
            "httpOnly": self.http_only,
            "secure": self.secure,
            "sameSite": self.same_site,
        }


class CookieSource(ABC):
    """Interface abstrata para fonte de cookies."""
    
    @abstractmethod
    async def load_cookies(self, domain: str) -> List[Cookie]:
        """Carrega cookies para um domínio."""
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Verifica se a fonte está disponível."""
        pass


class FileCookieSource(CookieSource):
    """Carrega cookies de arquivo JSON."""
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._cache: Dict[str, List[Cookie]] = {}
        self._last_load: Optional[datetime] = None
    
    async def is_available(self) -> bool:
        return self.file_path.exists()
    
    async def load_cookies(self, domain: str) -> List[Cookie]:
        # Recarregar se arquivo foi modificado
        if self._should_reload():
            await self._load_file()
        
        return self._cache.get(domain, [])
    
    def _should_reload(self) -> bool:
        if self._last_load is None:
            return True
        if not self.file_path.exists():
            return False
        mtime = datetime.fromtimestamp(self.file_path.stat().st_mtime)
        return mtime > self._last_load
    
    async def _load_file(self) -> None:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Suporta múltiplos formatos de arquivo
            cookies_list = self._normalize_format(data)
            
            # Indexar por domínio
            self._cache.clear()
            for cookie_data in cookies_list:
                cookie = self._parse_cookie(cookie_data)
                if cookie and not cookie.is_expired():
                    domain = cookie.domain.lstrip(".")
                    if domain not in self._cache:
                        self._cache[domain] = []
                    self._cache[domain].append(cookie)
                    
                    # Também indexar por domínio pai
                    # Ex: .google.com → google.com
                    parts = domain.split(".")
                    if len(parts) >= 2:
                        parent = ".".join(parts[-2:])
                        if parent not in self._cache:
                            self._cache[parent] = []
                        self._cache[parent].append(cookie)
            
            self._last_load = datetime.now()
            logger.info("cookies_loaded_from_file", 
                       file=str(self.file_path),
                       domains=list(self._cache.keys()))
            
        except Exception as e:
            logger.error("cookies_file_load_error", error=str(e))
    
    def _normalize_format(self, data: Any) -> List[Dict]:
        """Normaliza diferentes formatos de arquivo de cookies."""
        # Formato 1: Lista direta
        if isinstance(data, list):
            return data
        
        # Formato 2: {"cookies": [...]}
        if isinstance(data, dict) and "cookies" in data:
            return data["cookies"]
        
        # Formato 3: {"domain": [...], ...}
        if isinstance(data, dict):
            result = []
            for domain, cookies in data.items():
                if isinstance(cookies, list):
                    result.extend(cookies)
            return result
        
        return []
    
    def _parse_cookie(self, data: Dict) -> Optional[Cookie]:
        """Parse de dicionário para Cookie."""
        try:
            return Cookie(
                name=data.get("name", ""),
                value=data.get("value", ""),
                domain=data.get("domain", data.get("host", "")),
                path=data.get("path", "/"),
                expires=data.get("expires") or data.get("expirationDate"),
                http_only=data.get("httpOnly", data.get("http_only", False)),
                secure=data.get("secure", False),
                same_site=data.get("sameSite", data.get("same_site", "Lax")),
            )
        except Exception as e:
            logger.debug("cookie_parse_error", error=str(e), data=data)
            return None


class APICookieSource(CookieSource):
    """Carrega cookies de API externa."""
    
    def __init__(self, api_url: str, api_key: Optional[str] = None):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
    
    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.api_url}/health")
                return response.status_code == 200
        except:
            return False
    
    async def load_cookies(self, domain: str) -> List[Cookie]:
        try:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.api_url}/cookies",
                    params={"domain": domain},
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    cookies = []
                    for c in data.get("cookies", []):
                        cookie = Cookie(
                            name=c["name"],
                            value=c["value"],
                            domain=c.get("domain", domain),
                            path=c.get("path", "/"),
                            expires=c.get("expires"),
                            http_only=c.get("httpOnly", False),
                            secure=c.get("secure", False),
                        )
                        if not cookie.is_expired():
                            cookies.append(cookie)
                    return cookies
                    
        except Exception as e:
            logger.error("cookies_api_error", error=str(e))
        
        return []


class ChromeProfileCookieSource(CookieSource):
    """Carrega cookies do perfil do Chrome (SQLite)."""
    
    def __init__(self, user_data_dir: str, profile: str = "Default"):
        self.user_data_dir = Path(user_data_dir)
        self.profile = profile
        self.cookies_db = self.user_data_dir / profile / "Cookies"
    
    async def is_available(self) -> bool:
        return self.cookies_db.exists()
    
    async def load_cookies(self, domain: str) -> List[Cookie]:
        # NOTA: Chrome precisa estar fechado para ler o arquivo
        # Em produção, é melhor usar a opção de arquivo JSON
        logger.warning("chrome_profile_not_recommended",
                      message="Usar perfil do Chrome diretamente não é recomendado. "
                              "Considere exportar cookies para JSON.")
        return []


class SessionManager:
    """
    Gerenciador de sessões que unifica múltiplas fontes de cookies.
    
    Suporta:
    - Arquivo JSON (recomendado)
    - API externa
    - Perfil do Chrome (experimental)
    """
    
    def __init__(self):
        self._sources: List[CookieSource] = []
        self._cache: Dict[str, List[Cookie]] = {}
        self._setup_sources()
    
    def _setup_sources(self) -> None:
        """Configura fontes de cookies baseado nas settings."""
        
        if settings.cookies_source == "file":
            if settings.cookies_file_path and settings.cookies_file_path.exists():
                self._sources.append(
                    FileCookieSource(settings.cookies_file_path)
                )
                logger.info("cookie_source_configured", 
                           type="file", 
                           path=str(settings.cookies_file_path))
        
        elif settings.cookies_source == "api":
            if settings.cookies_api_url:
                self._sources.append(
                    APICookieSource(
                        settings.cookies_api_url,
                        settings.cookies_api_key
                    )
                )
                logger.info("cookie_source_configured", 
                           type="api", 
                           url=settings.cookies_api_url)
        
        elif settings.cookies_source == "chrome_profile":
            if settings.chrome_user_data_dir:
                self._sources.append(
                    ChromeProfileCookieSource(
                        settings.chrome_user_data_dir,
                        settings.chrome_profile
                    )
                )
                logger.info("cookie_source_configured", 
                           type="chrome_profile")
        
        if not self._sources:
            logger.warning("no_cookie_source_configured")
    
    async def get_cookies(self, domain: str) -> List[Cookie]:
        """
        Obtém cookies para um domínio.
        
        Args:
            domain: Domínio alvo (ex: "google.com", "investidor10.com.br")
            
        Returns:
            Lista de cookies válidos para o domínio
        """
        # Normalizar domínio
        domain = domain.lower().lstrip(".")
        
        # Buscar em todas as fontes
        all_cookies: List[Cookie] = []
        
        for source in self._sources:
            if await source.is_available():
                cookies = await source.load_cookies(domain)
                all_cookies.extend(cookies)
        
        # Deduplificar por nome
        unique: Dict[str, Cookie] = {}
        for cookie in all_cookies:
            key = f"{cookie.domain}:{cookie.name}"
            if key not in unique or (cookie.expires and 
                                     unique[key].expires and 
                                     cookie.expires > unique[key].expires):
                unique[key] = cookie
        
        result = list(unique.values())
        logger.debug("cookies_retrieved", domain=domain, count=len(result))
        return result
    
    async def get_google_cookies(self) -> List[Cookie]:
        """Obtém cookies do Google (para OAuth)."""
        google_domains = ["google.com", "accounts.google.com", "google.com.br"]
        all_cookies: List[Cookie] = []
        
        for domain in google_domains:
            cookies = await self.get_cookies(domain)
            all_cookies.extend(cookies)
        
        return all_cookies
    
    async def inject_cookies(self, browser, domain: str) -> int:
        """
        Injeta cookies em uma instância de browser (nodriver).
        
        Args:
            browser: Instância do nodriver browser
            domain: Domínio para carregar cookies
            
        Returns:
            Número de cookies injetados
        """
        cookies = await self.get_cookies(domain)
        
        # Se é um site que usa Google OAuth, injetar cookies do Google também
        google_auth_domains = [
            "fundamentei.com", "investidor10.com.br", "statusinvest.com.br",
            "br.investing.com", "br.advfn.com", "br.tradingview.com",
            "chatgpt.com", "claude.ai", "gemini.google.com"
        ]
        
        if any(d in domain for d in google_auth_domains):
            google_cookies = await self.get_google_cookies()
            cookies.extend(google_cookies)
        
        injected = 0
        for cookie in cookies:
            try:
                await browser.cookies.set(
                    name=cookie.name,
                    value=cookie.value,
                    domain=cookie.domain,
                    path=cookie.path,
                    secure=cookie.secure,
                    httpOnly=cookie.http_only
                )
                injected += 1
            except Exception as e:
                logger.debug("cookie_inject_failed", 
                           name=cookie.name, 
                           error=str(e))
        
        logger.info("cookies_injected", domain=domain, count=injected)
        return injected
    
    def get_nodriver_args(self) -> List[str]:
        """Retorna argumentos extras para nodriver se usando perfil Chrome."""
        args = []
        
        if settings.cookies_source == "chrome_profile":
            if settings.chrome_user_data_dir:
                args.append(f"--user-data-dir={settings.chrome_user_data_dir}")
            if settings.chrome_profile:
                args.append(f"--profile-directory={settings.chrome_profile}")
        
        return args


# Singleton
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Retorna instância singleton do SessionManager."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
```

---

### 3. Site Registry Completo

```python
"""
Registro completo de todos os sites com configurações detalhadas.
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional, Any


class FetcherType(Enum):
    """Tipos de fetchers disponíveis."""
    API = auto()                    # API REST direta
    SIMPLE = auto()                 # requests + BeautifulSoup
    BROWSER_NO_LOGIN = auto()       # nodriver sem autenticação
    BROWSER_GOOGLE = auto()         # nodriver com cookies Google
    BROWSER_CREDENTIALS = auto()    # nodriver com user/pass
    BROWSER_2FA = auto()            # Requer login manual com 2FA
    LLM_INTERFACE = auto()          # Automação de interface LLM
    SKIP = auto()                   # Ignorar


class Category(Enum):
    """Categorias de sites."""
    FUNDAMENTOS = "fundamentos"
    MERCADO = "mercado"
    ANALISE_TECNICA = "analise_tecnica"
    OPCOES = "opcoes"
    CRYPTO = "crypto"
    INSIDERS = "insiders"
    RESEARCH = "research"
    OFICIAIS = "oficiais"
    NOTICIAS = "noticias"
    LLM = "llm"


@dataclass
class SiteConfig:
    """Configuração completa de um site."""
    
    # Identificação
    key: str
    name: str
    url: str
    
    # Comportamento
    fetcher_type: FetcherType
    category: Category
    delay_seconds: int = 10
    enabled: bool = True
    priority: int = 5  # 1-10, menor = maior prioridade
    
    # Autenticação
    requires_cookies: bool = False
    requires_login: bool = False
    login_url: Optional[str] = None
    credentials_env_user: Optional[str] = None
    credentials_env_pass: Optional[str] = None
    
    # Scraping
    pages: List[str] = field(default_factory=list)  # Páginas específicas a scrapar
    parser: Optional[str] = None
    wait_for_selector: Optional[str] = None  # Aguardar este elemento
    scroll_page: bool = True  # Fazer scroll para lazy loading
    
    # API
    api_endpoint: Optional[str] = None
    api_params: Dict[str, Any] = field(default_factory=dict)
    
    # LLM
    llm_input_selector: Optional[str] = None
    llm_submit_selector: Optional[str] = None
    llm_response_selector: Optional[str] = None
    
    # Metadados
    notes: str = ""
    fallback_to: Optional[str] = None  # Site alternativo se falhar
    
    def get_pages_for_ticker(self, ticker: str) -> List[str]:
        """Retorna URLs das páginas para um ticker específico."""
        return [
            page.format(ticker=ticker, TICKER=ticker.upper())
            for page in self.pages
        ]


# =============================================================================
# REGISTRO COMPLETO DE SITES
# =============================================================================

SITES: Dict[str, SiteConfig] = {
    
    # =========================================================================
    # FUNDAMENTOS (7 sites)
    # =========================================================================
    
    "brapi": SiteConfig(
        key="brapi",
        name="BRAPI",
        url="https://brapi.dev",
        fetcher_type=FetcherType.API,
        category=Category.FUNDAMENTOS,
        delay_seconds=1,
        priority=1,
        api_endpoint="https://brapi.dev/api/quote/{ticker}",
        api_params={"fundamental": True, "dividends": True},
        parser="brapi",
        notes="API principal para cotações B3"
    ),
    
    "fundamentus": SiteConfig(
        key="fundamentus",
        name="Fundamentus",
        url="https://www.fundamentus.com.br",
        fetcher_type=FetcherType.SIMPLE,
        category=Category.FUNDAMENTOS,
        delay_seconds=5,
        priority=2,
        pages=[
            "/detalhes.php?papel={ticker}",
            "/resultado.php"
        ],
        parser="fundamentus",
        notes="HTML estático, sem proteção"
    ),
    
    "investsite": SiteConfig(
        key="investsite",
        name="InvestSite",
        url="https://www.investsite.com.br",
        fetcher_type=FetcherType.BROWSER_NO_LOGIN,
        category=Category.FUNDAMENTOS,
        delay_seconds=10,
        priority=4,
        pages=["/principais_indicadores.php?cod_ativo={ticker}"],
        parser="investsite",
        notes="Sem login, JS leve"
    ),
    
    "oceans14": SiteConfig(
        key="oceans14",
        name="Oceans14",
        url="https://www.oceans14.com.br",
        fetcher_type=FetcherType.BROWSER_NO_LOGIN,
        category=Category.FUNDAMENTOS,
        delay_seconds=10,
        priority=4,
        pages=["/acoes/{ticker}"],
        parser="oceans14",
        notes="Sem login"
    ),
    
    "fundamentei": SiteConfig(
        key="fundamentei",
        name="Fundamentei",
        url="https://fundamentei.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.FUNDAMENTOS,
        delay_seconds=15,
        priority=3,
        requires_cookies=True,
        pages=["/acao/{ticker}"],
        parser="fundamentei",
        wait_for_selector="[data-ticker]",
        notes="Login Google"
    ),
    
    "investidor10": SiteConfig(
        key="investidor10",
        name="Investidor10",
        url="https://investidor10.com.br",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.FUNDAMENTOS,
        delay_seconds=15,
        priority=2,
        requires_cookies=True,
        pages=["/acoes/{ticker}"],
        parser="investidor10",
        wait_for_selector=".stock-info",
        notes="Login Google"
    ),
    
    "statusinvest": SiteConfig(
        key="statusinvest",
        name="StatusInvest",
        url="https://statusinvest.com.br",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.FUNDAMENTOS,
        delay_seconds=30,
        priority=3,
        requires_cookies=True,
        pages=["/acoes/{ticker}"],
        parser="statusinvest",
        wait_for_selector="#main-header",
        notes="Cloudflare + Login Google",
        fallback_to="investidor10"
    ),
    
    # =========================================================================
    # MERCADO GERAL (4 sites)
    # =========================================================================
    
    "investing": SiteConfig(
        key="investing",
        name="Investing.com BR",
        url="https://br.investing.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.MERCADO,
        delay_seconds=30,
        priority=3,
        requires_cookies=True,
        pages=[
            "/equities/{ticker}",
            "/indices/ibovespa"
        ],
        parser="investing",
        notes="Heavy protection"
    ),
    
    "advfn": SiteConfig(
        key="advfn",
        name="ADVFN",
        url="https://br.advfn.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.MERCADO,
        delay_seconds=20,
        priority=4,
        requires_cookies=True,
        pages=["/bolsa-de-valores/bovespa/{ticker}/cotacao"],
        parser="advfn",
        notes="Login Google"
    ),
    
    "google_finance": SiteConfig(
        key="google_finance",
        name="Google Finance",
        url="https://www.google.com/finance",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.MERCADO,
        delay_seconds=15,
        priority=4,
        requires_cookies=True,
        pages=["/quote/{ticker}:BVMF"],
        parser="google_finance",
        notes="Login Google"
    ),
    
    "yahoo_finance": SiteConfig(
        key="yahoo_finance",
        name="Yahoo Finance",
        url="https://finance.yahoo.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.MERCADO,
        delay_seconds=20,
        priority=4,
        requires_cookies=True,
        pages=["/quote/{ticker}.SA"],
        parser="yahoo_finance",
        notes="Login Google, usar yfinance como alternativa"
    ),
    
    # =========================================================================
    # ANÁLISE TÉCNICA (1 site)
    # =========================================================================
    
    "tradingview": SiteConfig(
        key="tradingview",
        name="TradingView",
        url="https://br.tradingview.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.ANALISE_TECNICA,
        delay_seconds=60,
        priority=2,
        requires_cookies=True,
        pages=["/symbols/BMFBOVESPA-{ticker}/technicals/"],
        parser="tradingview",
        wait_for_selector=".tv-symbol-header",
        notes="Heavy protection, considerar tvdatafeed"
    ),
    
    # =========================================================================
    # OPÇÕES (2 sites)
    # =========================================================================
    
    "opcoes_net": SiteConfig(
        key="opcoes_net",
        name="Opções.net.br",
        url="https://opcoes.net.br",
        fetcher_type=FetcherType.BROWSER_CREDENTIALS,
        category=Category.OPCOES,
        delay_seconds=15,
        priority=2,
        requires_login=True,
        login_url="https://opcoes.net.br/login",
        credentials_env_user="OPCOES_NET_USER",
        credentials_env_pass="OPCOES_NET_PASS",
        pages=["/acoes/{ticker}"],
        parser="opcoes_net",
        notes="Login com CPF/senha"
    ),
    
    "oplab": SiteConfig(
        key="oplab",
        name="OpLab",
        url="https://opcoes.oplab.com.br",
        fetcher_type=FetcherType.BROWSER_NO_LOGIN,
        category=Category.OPCOES,
        delay_seconds=15,
        priority=3,
        pages=["/mercado-de-opcoes"],
        parser="oplab",
        notes="Acesso direto"
    ),
    
    # =========================================================================
    # CRYPTO (2 fontes)
    # =========================================================================
    
    "coingecko": SiteConfig(
        key="coingecko",
        name="CoinGecko",
        url="https://api.coingecko.com",
        fetcher_type=FetcherType.API,
        category=Category.CRYPTO,
        delay_seconds=2,
        priority=1,
        api_endpoint="https://api.coingecko.com/api/v3/coins/{coin}",
        api_params={"localization": False, "tickers": False},
        parser="coingecko",
        notes="API gratuita, preferível ao CoinMarketCap"
    ),
    
    "coinmarketcap": SiteConfig(
        key="coinmarketcap",
        name="CoinMarketCap",
        url="https://coinmarketcap.com",
        fetcher_type=FetcherType.BROWSER_NO_LOGIN,
        category=Category.CRYPTO,
        delay_seconds=20,
        priority=5,
        enabled=False,  # Desabilitado por padrão, usar CoinGecko
        pages=["/currencies/{coin}/"],
        parser="coinmarketcap",
        notes="Fallback apenas"
    ),
    
    # =========================================================================
    # INSIDERS (1 site)
    # =========================================================================
    
    "griffin": SiteConfig(
        key="griffin",
        name="Griffin",
        url="https://griffin.app.br",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.INSIDERS,
        delay_seconds=20,
        priority=3,
        requires_cookies=True,
        pages=["/empresa/{ticker}"],
        parser="griffin",
        notes="Dados de insiders"
    ),
    
    # =========================================================================
    # RESEARCH (4 sites)
    # =========================================================================
    
    "btg_research": SiteConfig(
        key="btg_research",
        name="BTG Research",
        url="https://content.btgpactual.com",
        fetcher_type=FetcherType.BROWSER_2FA,
        category=Category.RESEARCH,
        delay_seconds=30,
        priority=2,
        enabled=True,
        pages=["/research/"],
        parser="btg",
        notes="2FA celular - manter sessão ativa manualmente"
    ),
    
    "xpi_conteudos": SiteConfig(
        key="xpi_conteudos",
        name="XP Conteúdos",
        url="https://conteudos.xpi.com.br",
        fetcher_type=FetcherType.BROWSER_2FA,
        category=Category.RESEARCH,
        delay_seconds=30,
        priority=2,
        enabled=True,
        pages=["/"],
        parser="xp",
        notes="2FA celular - manter sessão ativa manualmente"
    ),
    
    "einvestidor": SiteConfig(
        key="einvestidor",
        name="E-Investidor",
        url="https://einvestidor.estadao.com.br",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.RESEARCH,
        delay_seconds=15,
        priority=3,
        requires_cookies=True,
        pages=["/"],
        parser="einvestidor",
        notes="Login Google"
    ),
    
    "maisretorno": SiteConfig(
        key="maisretorno",
        name="Mais Retorno",
        url="https://maisretorno.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.RESEARCH,
        delay_seconds=15,
        priority=3,
        requires_cookies=True,
        pages=["/"],
        parser="maisretorno",
        notes="Login Google"
    ),
    
    # =========================================================================
    # OFICIAIS (3 sites)
    # =========================================================================
    
    "bcb": SiteConfig(
        key="bcb",
        name="Banco Central",
        url="https://www.bcb.gov.br",
        fetcher_type=FetcherType.API,
        category=Category.OFICIAIS,
        delay_seconds=1,
        priority=1,
        api_endpoint="https://api.bcb.gov.br/dados/serie",
        parser="bcb",
        notes="API oficial - Selic, IPCA, PTAX"
    ),
    
    "ibge": SiteConfig(
        key="ibge",
        name="IBGE",
        url="https://www.ibge.gov.br",
        fetcher_type=FetcherType.API,
        category=Category.OFICIAIS,
        delay_seconds=1,
        priority=1,
        api_endpoint="https://api.sidra.ibge.gov.br",
        parser="ibge",
        notes="API oficial - PIB, estatísticas"
    ),
    
    "b3": SiteConfig(
        key="b3",
        name="B3",
        url="https://www.b3.com.br",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.OFICIAIS,
        delay_seconds=15,
        priority=3,
        requires_cookies=True,
        pages=["/pt_br/produtos-e-servicos/negociacao/"],
        parser="b3",
        notes="Login Google"
    ),
    
    # =========================================================================
    # NOTÍCIAS (6 sites)
    # =========================================================================
    
    "google_news": SiteConfig(
        key="google_news",
        name="Google News",
        url="https://news.google.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.NOTICIAS,
        delay_seconds=10,
        priority=2,
        requires_cookies=True,
        pages=["/search?q={ticker}+ação+bovespa"],
        parser="google_news",
        notes="Login Google"
    ),
    
    "bloomberglinea": SiteConfig(
        key="bloomberglinea",
        name="Bloomberg Línea",
        url="https://www.bloomberglinea.com.br",
        fetcher_type=FetcherType.BROWSER_NO_LOGIN,
        category=Category.NOTICIAS,
        delay_seconds=10,
        priority=3,
        pages=["/mercados/"],
        parser="bloomberg",
        notes="Sem login"
    ),
    
    "investing_news": SiteConfig(
        key="investing_news",
        name="Investing.com News",
        url="https://br.investing.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.NOTICIAS,
        delay_seconds=20,
        priority=4,
        requires_cookies=True,
        pages=["/news/"],
        parser="investing_news",
        notes="Login Google"
    ),
    
    "valor": SiteConfig(
        key="valor",
        name="Valor Econômico",
        url="https://valor.globo.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.NOTICIAS,
        delay_seconds=20,
        priority=4,
        requires_cookies=True,
        pages=["/"],
        parser="valor",
        notes="Login Google - pode ter paywall"
    ),
    
    "exame": SiteConfig(
        key="exame",
        name="Exame",
        url="https://exame.com",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.NOTICIAS,
        delay_seconds=20,
        priority=4,
        requires_cookies=True,
        pages=["/invest/"],
        parser="exame",
        notes="Login Google"
    ),
    
    "infomoney": SiteConfig(
        key="infomoney",
        name="InfoMoney",
        url="https://www.infomoney.com.br",
        fetcher_type=FetcherType.BROWSER_GOOGLE,
        category=Category.NOTICIAS,
        delay_seconds=20,
        priority=3,
        requires_cookies=True,
        pages=["/"],
        parser="infomoney",
        notes="Login Google"
    ),
    
    # =========================================================================
    # LLMs (6 interfaces)
    # =========================================================================
    
    "chatgpt": SiteConfig(
        key="chatgpt",
        name="ChatGPT",
        url="https://chatgpt.com",
        fetcher_type=FetcherType.LLM_INTERFACE,
        category=Category.LLM,
        delay_seconds=30,
        priority=1,
        requires_cookies=True,
        llm_input_selector="textarea[data-id='root'], #prompt-textarea",
        llm_submit_selector="button[data-testid='send-button']",
        llm_response_selector="[data-message-author-role='assistant']",
        notes="LLM primário para análise"
    ),
    
    "claude": SiteConfig(
        key="claude",
        name="Claude",
        url="https://claude.ai/new",
        fetcher_type=FetcherType.LLM_INTERFACE,
        category=Category.LLM,
        delay_seconds=30,
        priority=2,
        requires_cookies=True,
        llm_input_selector="[contenteditable='true'], div.ProseMirror",
        llm_submit_selector="button[aria-label='Send message']",
        llm_response_selector="[data-testid='assistant-message']",
        notes="LLM backup"
    ),
    
    "gemini": SiteConfig(
        key="gemini",
        name="Gemini",
        url="https://gemini.google.com/app",
        fetcher_type=FetcherType.LLM_INTERFACE,
        category=Category.LLM,
        delay_seconds=30,
        priority=3,
        requires_cookies=True,
        llm_input_selector="rich-textarea, .ql-editor",
        llm_submit_selector="button[aria-label='Send message']",
        llm_response_selector=".model-response-text",
        notes="Pesquisa + análise"
    ),
    
    "perplexity": SiteConfig(
        key="perplexity",
        name="Perplexity",
        url="https://www.perplexity.ai",
        fetcher_type=FetcherType.LLM_INTERFACE,
        category=Category.LLM,
        delay_seconds=30,
        priority=2,
        requires_cookies=True,
        llm_input_selector="textarea[placeholder*='Ask']",
        llm_submit_selector="button[aria-label='Submit']",
        llm_response_selector=".prose",
        notes="Melhor para pesquisa com fontes"
    ),
    
    "grok": SiteConfig(
        key="grok",
        name="Grok",
        url="https://grok.com",
        fetcher_type=FetcherType.LLM_INTERFACE,
        category=Category.LLM,
        delay_seconds=30,
        priority=4,
        requires_cookies=True,
        llm_input_selector="textarea",
        llm_submit_selector="button[type='submit']",
        llm_response_selector=".message-content",
        notes="Análise alternativa"
    ),
    
    "deepseek": SiteConfig(
        key="deepseek",
        name="DeepSeek",
        url="https://www.deepseek.com",
        fetcher_type=FetcherType.LLM_INTERFACE,
        category=Category.LLM,
        delay_seconds=30,
        priority=4,
        requires_cookies=True,
        llm_input_selector="textarea",
        llm_submit_selector="button[type='submit']",
        llm_response_selector=".markdown-body",
        notes="Análise técnica"
    ),
}


# =============================================================================
# FUNÇÕES DE ACESSO
# =============================================================================

def get_all_sites() -> Dict[str, SiteConfig]:
    """Retorna todos os sites."""
    return SITES


def get_site(key: str) -> Optional[SiteConfig]:
    """Retorna configuração de um site."""
    return SITES.get(key)


def get_enabled_sites() -> List[SiteConfig]:
    """Retorna sites habilitados."""
    return [s for s in SITES.values() if s.enabled]


def get_sites_by_category(category: Category) -> List[SiteConfig]:
    """Retorna sites de uma categoria."""
    return [s for s in SITES.values() if s.category == category and s.enabled]


def get_sites_by_fetcher(fetcher_type: FetcherType) -> List[SiteConfig]:
    """Retorna sites por tipo de fetcher."""
    return [s for s in SITES.values() if s.fetcher_type == fetcher_type and s.enabled]


def get_api_sites() -> List[SiteConfig]:
    """Retorna sites com API."""
    return get_sites_by_fetcher(FetcherType.API)


def get_browser_sites() -> List[SiteConfig]:
    """Retorna sites que precisam de browser."""
    browser_types = [
        FetcherType.SIMPLE,
        FetcherType.BROWSER_NO_LOGIN,
        FetcherType.BROWSER_GOOGLE,
        FetcherType.BROWSER_CREDENTIALS,
        FetcherType.BROWSER_2FA,
    ]
    return [s for s in SITES.values() if s.fetcher_type in browser_types and s.enabled]


def get_llm_sites() -> List[SiteConfig]:
    """Retorna interfaces de LLM."""
    return get_sites_by_fetcher(FetcherType.LLM_INTERFACE)


def get_sites_requiring_cookies() -> List[SiteConfig]:
    """Retorna sites que precisam de cookies."""
    return [s for s in SITES.values() if s.requires_cookies and s.enabled]
```

---

## 📝 Prompts de Análise Completos

### src/prompts/daytrade.py

```python
"""
Templates de prompts para análise de Day Trade.
"""

DAYTRADE_ANALYSIS_PROMPT = """
# 📊 ANÁLISE PARA DAY TRADE

**Ativo:** {ticker}
**Data:** {date}
**Horário da análise:** {time}

---

## 📈 DADOS DO MERCADO

{market_data}

---

## 📊 INDICADORES FUNDAMENTALISTAS

{fundamentals}

---

## 📉 ANÁLISE TÉCNICA

{technicals}

---

## 📰 NOTÍCIAS RECENTES

{news}

---

## 🎯 OPÇÕES (se disponível)

{options}

---

# INSTRUÇÕES PARA ANÁLISE

Você é um trader profissional especializado em **day trade** no mercado brasileiro (B3).

Com base nos dados acima, forneça uma análise **objetiva e acionável** seguindo EXATAMENTE este formato:

---

## 1. VIÉS DO DIA

**[ ] COMPRA** | **[ ] VENDA** | **[ ] NEUTRO/AGUARDAR**

**Justificativa:** (máximo 3 frases)

---

## 2. NÍVEIS OPERACIONAIS

| Nível | Preço (R$) | Observação |
|-------|------------|------------|
| Resistência 2 | | |
| Resistência 1 | | |
| **Preço Atual** | | |
| Suporte 1 | | |
| Suporte 2 | | |

---

## 3. SETUP DE ENTRADA

**Tipo de entrada:** (rompimento / pullback / reversão)

**Gatilho:** (condição específica para entrar)

**Preço de entrada ideal:** R$ ____

**Confirmação necessária:** (volume / candle / indicador)

---

## 4. GESTÃO DE RISCO

| Parâmetro | Valor |
|-----------|-------|
| Stop Loss | R$ ____ (____%) |
| Take Profit 1 (parcial) | R$ ____ (____%) |
| Take Profit 2 (final) | R$ ____ (____%) |
| Relação Risco/Retorno | 1:____ |

---

## 5. RISCOS DO DIA

- **Evento 1:** ____
- **Evento 2:** ____
- **Horários de atenção:** ____

---

## 6. SCORE DE CONFIANÇA

**[____/10]**

Justificativa: (1 frase)

---

## 7. RECOMENDAÇÃO FINAL

(Máximo 2 frases diretas e acionáveis)

---

**IMPORTANTE:**
- Seja OBJETIVO e DIRETO
- Foque em operações de MINUTOS a HORAS
- Não use linguagem vaga ou inconclusiva
- Se não houver setup claro, diga "AGUARDAR"
"""


DAYTRADE_QUICK_PROMPT = """
Análise rápida para day trade de {ticker}:

Cotação: R$ {price} ({change}%)
Volume: {volume}
Tendência: {trend}

Em NO MÁXIMO 5 linhas, responda:
1. Viés do dia (COMPRA/VENDA/NEUTRO)
2. Preço de entrada
3. Stop loss
4. Alvo
5. Score de confiança (0-10)
"""
```

### src/prompts/swingtrade.py

```python
"""
Templates de prompts para análise de Swing Trade.
"""

SWING_ANALYSIS_PROMPT = """
# 📊 ANÁLISE PARA SWING TRADE

**Ativo:** {ticker}
**Data:** {date}
**Período sugerido:** 3 a 15 dias úteis

---

## 📈 DADOS CONSOLIDADOS

{consolidated_data}

---

# INSTRUÇÕES PARA ANÁLISE

Você é um trader profissional especializado em **swing trade** no mercado brasileiro.

Analise os dados e forneça uma análise completa seguindo EXATAMENTE este formato:

---

## 1. TENDÊNCIA PRINCIPAL

**Diário:** [ ] ALTA | [ ] BAIXA | [ ] LATERAL
**Semanal:** [ ] ALTA | [ ] BAIXA | [ ] LATERAL

**Observação:** (máximo 2 frases)

---

## 2. SETUP IDENTIFICADO

**Padrão gráfico:** ____

**Indicadores de confirmação:**
- RSI: ____ (sobrecomprado/sobrevendido/neutro)
- MACD: ____ (cruzamento alta/baixa)
- Médias: ____ (preço acima/abaixo)

---

## 3. ZONA DE ENTRADA

**Tipo:** (rompimento / pullback / reversão)

**Faixa de entrada:** R$ ____ a R$ ____

**Gatilho:** ____

---

## 4. GESTÃO DE RISCO

| Parâmetro | Preço (R$) | % |
|-----------|------------|---|
| Stop Loss | | |
| Alvo 1 (50%) | | |
| Alvo 2 (50%) | | |

**Relação R/R:** 1:____

---

## 5. HORIZONTE TEMPORAL

**Duração estimada:** ____ dias

**Checkpoints:**
- Dia 3: ____
- Dia 7: ____
- Dia 10: ____

---

## 6. ANÁLISE FUNDAMENTALISTA

**O fundamento suporta a operação?** [ ] SIM | [ ] NÃO | [ ] PARCIALMENTE

**Catalisadores próximos:**
- ____
- ____

**Riscos corporativos:**
- ____

---

## 7. SCORE DE CONFIANÇA

**[____/10]**

| Critério | Peso | Nota |
|----------|------|------|
| Tendência | 25% | /10 |
| Setup técnico | 25% | /10 |
| Volume | 20% | /10 |
| Fundamentos | 15% | /10 |
| Contexto macro | 15% | /10 |

---

## 8. RECOMENDAÇÃO FINAL

**[ ] MONTAR POSIÇÃO** | **[ ] AGUARDAR** | **[ ] EVITAR**

(Máximo 3 frases)

---

**IMPORTANTE:**
- Foque em operações de DIAS a SEMANAS
- Considere o contexto macroeconômico
- Avalie o momento setorial
"""
```

### src/prompts/position.py

```python
"""
Templates de prompts para análise de Position Trade / Investimento.
"""

POSITION_ANALYSIS_PROMPT = """
# 📊 ANÁLISE PARA POSITION TRADE / INVESTIMENTO

**Ativo:** {ticker}
**Setor:** {sector}
**Data:** {date}
**Horizonte:** 1 mês a 1+ ano

---

## 📈 DADOS CONSOLIDADOS

{consolidated_data}

---

# INSTRUÇÕES PARA ANÁLISE

Você é um analista fundamentalista especializado em investimentos de médio/longo prazo no mercado brasileiro.

Forneça uma análise completa seguindo EXATAMENTE este formato:

---

## 1. RECOMENDAÇÃO

**[ ] COMPRAR** | **[ ] MANTER** | **[ ] VENDER** | **[ ] AGUARDAR**

**Preço atual:** R$ ____
**Preço-alvo 12 meses:** R$ ____
**Upside/Downside:** ____%

---

## 2. ANÁLISE FUNDAMENTALISTA

### Indicadores de Valuation

| Indicador | Valor | vs. Setor | Interpretação |
|-----------|-------|-----------|---------------|
| P/L | | | |
| P/VP | | | |
| EV/EBITDA | | | |
| P/Receita | | | |

### Indicadores de Rentabilidade

| Indicador | Valor | Tendência |
|-----------|-------|-----------|
| ROE | | ↑↓→ |
| ROIC | | ↑↓→ |
| Margem Líquida | | ↑↓→ |
| Margem EBITDA | | ↑↓→ |

### Indicadores de Endividamento

| Indicador | Valor | Risco |
|-----------|-------|-------|
| Dív. Líquida/EBITDA | | Alto/Médio/Baixo |
| Dív. Líquida/PL | | Alto/Médio/Baixo |

---

## 3. DIVIDENDOS

**Dividend Yield atual:** ____%
**Payout ratio:** ____%
**Histórico:** (crescente/estável/decrescente)
**Próximo pagamento:** ____

---

## 4. ANÁLISE TÉCNICA DE LONGO PRAZO

**Tendência primária:** [ ] ALTA | [ ] BAIXA | [ ] LATERAL

**Suportes relevantes:** R$ ____, R$ ____
**Resistências relevantes:** R$ ____, R$ ____

**Momento atual no ciclo:** (acumulação / alta / distribuição / baixa)

---

## 5. TESE DE INVESTIMENTO

### Catalisadores de Valorização
1. ____
2. ____
3. ____

### Principais Riscos
1. ____
2. ____
3. ____

### Vantagens Competitivas (Moat)
- ____

---

## 6. VALUATION

**Metodologia:** (DCF / Múltiplos / DDM)

**Premissas principais:**
- Crescimento receita: ___% a.a.
- Margem EBITDA: ___%
- Taxa de desconto: ___%

**Preço justo calculado:** R$ ____

**Margem de segurança:** ____%

---

## 7. ALOCAÇÃO SUGERIDA

**% da carteira recomendado:** ____%

**Estratégia de montagem:**
- ____% à vista
- ____% em quedas de ___%
- ____% em quedas de ___%

---

## 8. COMPARATIVO SETORIAL

| Empresa | P/L | ROE | DY | Recomendação |
|---------|-----|-----|----|----|
| {ticker} | | | | |
| Peer 1 | | | | |
| Peer 2 | | | | |

---

## 9. SCORE DE CONFIANÇA

**[____/10]**

| Critério | Peso | Nota |
|----------|------|------|
| Qualidade do negócio | 25% | /10 |
| Valuation | 25% | /10 |
| Dividendos | 15% | /10 |
| Governança | 15% | /10 |
| Momento setorial | 10% | /10 |
| Técnico LP | 10% | /10 |

---

## 10. RESUMO EXECUTIVO

(Máximo 5 frases resumindo a tese)

---

**IMPORTANTE:**
- Foque em FUNDAMENTOS e perspectivas de LONGO PRAZO
- Considere o contexto macroeconômico brasileiro
- Avalie a qualidade da gestão e governança
- Seja conservador nas premissas de valuation
"""
```

---

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
version: '3.9'

services:
  # ===========================================================================
  # Redis - Cache e Filas
  # ===========================================================================
  redis:
    image: redis:7-alpine
    container_name: brscraper-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - brscraper-net

  # ===========================================================================
  # API - FastAPI Server
  # ===========================================================================
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: brscraper-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=sqlite:///./data/brscraper.db
      - DATA_DIR=/app/data
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./config:/app/config:ro
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - brscraper-net
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 1

  # ===========================================================================
  # Worker - Processamento de Jobs
  # ===========================================================================
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: brscraper-worker
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=sqlite:///./data/brscraper.db
      - DATA_DIR=/app/data
      - BROWSER_HEADLESS=true
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./config:/app/config:ro
      # Compartilhar X11 para browser (se não headless)
      # - /tmp/.X11-unix:/tmp/.X11-unix
    depends_on:
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 4G  # Browser precisa de memória
        reservations:
          memory: 2G
    shm_size: 2gb  # Importante para Chrome
    networks:
      - brscraper-net
    command: rq worker --url redis://redis:6379 --with-scheduler

  # ===========================================================================
  # Scheduler - Agendamento (opcional, pode rodar no API)
  # ===========================================================================
  scheduler:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: brscraper-scheduler
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=sqlite:///./data/brscraper.db
      - DATA_DIR=/app/data
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./config:/app/config:ro
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - brscraper-net
    command: python -m src.core.scheduler

networks:
  brscraper-net:
    driver: bridge

volumes:
  redis_data:
```

### Dockerfile

```dockerfile
# ===========================================================================
# BRScraper - API Dockerfile
# ===========================================================================

FROM python:3.11-slim

# Metadados
LABEL maintainer="Adriano"
LABEL version="3.0.0"
LABEL description="BRScraper API Server"

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY src/ ./src/
COPY config/ ./config/

# Criar diretórios de dados
RUN mkdir -p /app/data/raw /app/data/processed /app/data/consolidated \
    /app/data/analysis /app/data/reports /app/data/cookies \
    /app/data/cache /app/data/logs

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando padrão
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Dockerfile.worker

```dockerfile
# ===========================================================================
# BRScraper - Worker Dockerfile (com Chrome)
# ===========================================================================

FROM python:3.11-slim

# Metadados
LABEL maintainer="Adriano"
LABEL version="3.0.0"
LABEL description="BRScraper Worker with Chrome"

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DISPLAY=:99

# Diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema e Chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    wget \
    xvfb \
    # Dependências do Chrome
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Instalar Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar Playwright browsers (opcional)
RUN playwright install chromium

# Copiar código fonte
COPY src/ ./src/
COPY config/ ./config/

# Criar diretórios
RUN mkdir -p /app/data/raw /app/data/processed /app/data/consolidated \
    /app/data/analysis /app/data/reports /app/data/cookies \
    /app/data/cache /app/data/logs

# Script de inicialização
COPY scripts/start-worker.sh /start-worker.sh
RUN chmod +x /start-worker.sh

# Comando padrão
CMD ["/start-worker.sh"]
```

### scripts/start-worker.sh

```bash
#!/bin/bash

# Iniciar Xvfb para display virtual (se não headless)
if [ "$BROWSER_HEADLESS" != "true" ]; then
    Xvfb :99 -screen 0 1920x1080x24 &
    export DISPLAY=:99
fi

# Iniciar worker
exec rq worker --url "$REDIS_URL" --with-scheduler
```

---

## ✅ Checklist de Implementação Definitivo

### FASE 1: Core (Dia 1-2)
- [ ] 1.1 Criar estrutura de diretórios completa
- [ ] 1.2 Implementar `config.py` com todas as settings
- [ ] 1.3 Criar `.env.example` e `.gitignore`
- [ ] 1.4 Implementar `requirements.txt`
- [ ] 1.5 Implementar logger estruturado

### FASE 2: Fetchers (Dia 3-5)
- [ ] 2.1 Implementar `BaseFetcher` e `FetchResult`
- [ ] 2.2 Implementar `APIFetcher` (BRAPI, BCB, IBGE, CoinGecko)
- [ ] 2.3 Implementar `SimpleFetcher` (requests)
- [ ] 2.4 Implementar `SessionManager` (cookies)
- [ ] 2.5 Implementar `BrowserFetcher` (nodriver base)
- [ ] 2.6 Implementar `GoogleAuthFetcher`
- [ ] 2.7 Implementar `CredentialsFetcher`
- [ ] 2.8 Implementar `LLMInterfaceFetcher`
- [ ] 2.9 Testar cada fetcher individualmente

### FASE 3: Parsers (Dia 6-8)
- [ ] 3.1 Implementar `HTMLToMarkdown` converter
- [ ] 3.2 Implementar parser `brapi`
- [ ] 3.3 Implementar parser `fundamentus`
- [ ] 3.4 Implementar parser `investidor10`
- [ ] 3.5 Implementar parsers restantes (30+)
- [ ] 3.6 Implementar `DataExtractor` genérico

### FASE 4: Storage & Queue (Dia 9-10)
- [ ] 4.1 Implementar SQLite models
- [ ] 4.2 Implementar `Storage` layer
- [ ] 4.3 Implementar Redis `Cache`
- [ ] 4.4 Implementar `Queue` (RQ)
- [ ] 4.5 Implementar `Worker`

### FASE 5: Análise (Dia 11-13)
- [ ] 5.1 Implementar `DataConsolidator`
- [ ] 5.2 Implementar prompts (daytrade, swing, position)
- [ ] 5.3 Implementar `LLMAnalyzer`
- [ ] 5.4 Implementar `ReportGenerator`
- [ ] 5.5 Testar pipeline completo de análise

### FASE 6: Orquestração (Dia 14-15)
- [ ] 6.1 Implementar `Scheduler` (APScheduler)
- [ ] 6.2 Implementar FastAPI `routes`
- [ ] 6.3 Implementar CLI (Typer)
- [ ] 6.4 Testar agendamento

### FASE 7: Docker & Deploy (Dia 16-17)
- [ ] 7.1 Criar `Dockerfile`
- [ ] 7.2 Criar `Dockerfile.worker`
- [ ] 7.3 Criar `docker-compose.yml`
- [ ] 7.4 Testar containers
- [ ] 7.5 Documentar processo de deploy

### FASE 8: Testes & Documentação (Dia 18-20)
- [ ] 8.1 Escrever testes unitários
- [ ] 8.2 Escrever testes de integração
- [ ] 8.3 Escrever documentação (README, SETUP, USAGE)
- [ ] 8.4 Validar com dados reais
- [ ] 8.5 Ajustes finais

---

## 🚀 Prompt para Claude Code

```
Implemente o projeto BRScraper v3 seguindo a especificação em brscraper-spec-v3.md.

CONTEXTO CRÍTICO:
- O usuário já possui sistema de coleta de cookies do Google
- Cookies são fornecidos via arquivo JSON em ./data/cookies/google_session.json
- Objetivo final: análise de trading (daytrade, swing, position)
- 36 sites mapeados com tipos de acesso diferentes
- 6 LLMs para automação de análise (ChatGPT, Claude, etc.)
- Tudo 100% gratuito e self-hosted
- Credenciais sensíveis em .env (nunca hardcoded)

PRIORIDADE DE IMPLEMENTAÇÃO:

1. CORE (primeiro)
   - config.py com pydantic-settings
   - Estrutura de diretórios
   - Logger estruturado

2. FETCHERS (em ordem)
   - APIFetcher (BRAPI, BCB - testar primeiro!)
   - SimpleFetcher (Fundamentus - segundo teste)
   - SessionManager (integrar com arquivo de cookies)
   - BrowserFetcher + GoogleAuthFetcher
   - LLMInterfaceFetcher (ChatGPT)

3. PARSERS
   - HTMLToMarkdown genérico
   - Parsers específicos por site

4. ANÁLISE
   - DataConsolidator
   - Prompts de trading
   - LLMAnalyzer

5. ORQUESTRAÇÃO
   - Scheduler
   - Worker
   - API

TESTES OBRIGATÓRIOS:
1. BRAPI API → deve retornar cotação de PETR4
2. Fundamentus → deve extrair indicadores
3. Investidor10 com cookies → deve acessar sem bloqueio
4. ChatGPT com cookies → deve enviar prompt e receber resposta
```

---

**FIM DA ESPECIFICAÇÃO v3 - PRONTA PARA IMPLEMENTAÇÃO**
