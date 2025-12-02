# MAPEAMENTO COMPLETO DE FONTES DE DADOS

**Data:** 2025-12-02
**Objetivo:** Mapear todos os scrapers existentes, campos implementados, e identificar oportunidades de expansão.

---

## 📊 RESUMO EXECUTIVO

### Scrapers Implementados
| Categoria | TypeScript (Backend) | Python (Scrapers) | Total |
|-----------|---------------------|-------------------|-------|
| Fundamentalistas | 6 | 5 | 11 |
| Macroeconômicos | 0 | 3 | 3 |
| Notícias | 2 | 4 | 6 |
| Opções | 1 | 1 | 2 |
| Market Data | 0 | 5 | 5 |
| AI Analysis | 0 | 5 | 5 |
| **TOTAL** | 9 | 23 | **32** |

### Status de Fontes
| Fonte | Implementado | Login Necessário | API Oficial |
|-------|--------------|------------------|-------------|
| BRAPI | ✅ Funcional | ❌ (API Key) | ✅ |
| Fundamentus | ✅ Funcional | ❌ | ❌ |
| StatusInvest | ✅ Funcional | ❌ | ❌ |
| Investidor10 | ✅ Funcional | ❌ | ❌ |
| Fundamentei | ✅ Funcional | ✅ OAuth | ❌ |
| Investsite | ✅ Funcional | ❌ | ❌ |
| BCB | ✅ Funcional | ❌ | ✅ SGS |
| IPEADATA | ✅ Funcional | ❌ | ✅ |
| B3 | ⚠️ Parcial | ❌ | ⚠️ Limitada |
| Investing.com | ⚠️ Parcial | ✅ OAuth | ❌ |
| ADVFN | ⚠️ Parcial | ✅ OAuth | ❌ |
| Google Finance | ⚠️ Parcial | ✅ OAuth | ❌ |
| TradingView | ⚠️ Mínimo | ✅ OAuth | ❌ |
| Opcoes.net.br | ⚠️ Parcial | ✅ Credenciais | ❌ |
| Estadão | ⚠️ Notícias | ✅ OAuth | ❌ |
| Mais Retorno | ⚠️ Notícias | ✅ OAuth | ❌ |

---

## 🔷 SCRAPERS FUNDAMENTALISTAS

### 1. BRAPI (TypeScript) - `brapi.scraper.ts`
**Status:** ✅ FUNCIONAL
**Login:** API Key
**Tipo:** API REST Oficial

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código do ativo |
| `name` | string | Nome da empresa |
| `logoUrl` | string | URL do logo |
| `sector` | string | Setor |
| `currency` | string | Moeda |
| `marketCap` | number | Valor de mercado |
| `price` | number | Cotação atual |
| `change` | number | Variação absoluta |
| `changePercent` | number | Variação percentual |
| `open` | number | Abertura |
| `high` | number | Máxima do dia |
| `low` | number | Mínima do dia |
| `volume` | number | Volume |
| `previousClose` | number | Fechamento anterior |
| `eps` | number | Lucro por ação (TTM) |
| `pe` | number | P/L |
| `dividendYield` | number | Dividend Yield |
| `week52High` | number | Máxima 52 semanas |
| `week52Low` | number | Mínima 52 semanas |
| `historicalPrices` | array | Histórico OHLCV |

**Observações:**
- Plano free suporta apenas range: '1d', '5d', '1mo', '3mo' (NÃO '1y')
- Mutex implementado com 12s entre requisições
- Usa native `fetch` para bypass Cloudflare

---

### 2. Fundamentus (TypeScript) - `fundamentus.scraper.ts`
**Status:** ✅ FUNCIONAL
**Login:** Não necessário
**Tipo:** Web Scraping

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código do ativo |
| `cotacao` | number | Cotação atual |
| `pl` | number | P/L |
| `pvp` | number | P/VP |
| `psr` | number | PSR |
| `dividendYield` | number | Dividend Yield |
| `pAtivo` | number | P/Ativos |
| `pCapitalGiro` | number | P/Capital de Giro |
| `pEbit` | number | P/EBIT |
| `pAtivoCirculante` | number | P/Ativo Circ. Líq. |
| `evEbit` | number | EV/EBIT |
| `evEbitda` | number | EV/EBITDA |
| `margemEbit` | number | Margem EBIT |
| `margemLiquida` | number | Margem Líquida |
| `liquidezCorrente` | number | Liquidez Corrente |
| `roic` | number | ROIC |
| `roe` | number | ROE |
| `liquidez2Meses` | number | Vol. Méd. 2 meses |
| `patrimonioLiquido` | number | Patrimônio Líquido |
| `dividaBruta` | number | Dívida Bruta |
| `disponibilidades` | number | Disponibilidades |
| `ativoTotal` | number | Ativo Total |
| `receitaLiquida` | number | Receita Líquida |
| `ebit` | number | EBIT |
| `lucroLiquido` | number | Lucro Líquido |

**FII Support:** ✅ `fii_detalhes.php` vs `detalhes.php`

---

### 3. Fundamentus (Python) - `fundamentus_scraper.py`
**Status:** ✅ FUNCIONAL (Playwright)
**Login:** Não necessário

#### Campos ADICIONAIS ao TypeScript:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tipo` | string | Tipo (PN, ON, UNT) |
| `setor` | string | Setor |
| `subsetor` | string | Subsetor |
| `p_ativos` | number | P/Ativos |
| `p_cap_giro` | number | P/Cap. Giro |
| `div_bruta_patrim` | number | Dív.Bruta/Patrim |
| `div_liquida_patrim` | number | Dív.Líq./Patrim |
| `div_liquida_ebit` | number | Dív.Líq./EBIT |
| `crescimento_receita_5a` | number | CAGR Receita 5a |
| `roa` | number | ROA |
| `payout` | number | Payout |
| `nro_acoes` | number | Número de Ações |

---

### 4. StatusInvest (TypeScript) - `statusinvest.scraper.ts`
**Status:** ✅ FUNCIONAL
**Login:** Não necessário

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `companyName` | string | Nome |
| `price` | number | Cotação |
| `dy` | number | Dividend Yield |
| `pl` | number | P/L |
| `pvp` | number | P/VP |
| `psr` | number | PSR |
| `pAtivos` | number | P/Ativos |
| `pCapGiro` | number | P/Cap. Giro |
| `pEbit` | number | P/EBIT |
| `pAtivCircLiq` | number | P/Ativ Circ Líq |
| `evEbit` | number | EV/EBIT |
| `evEbitda` | number | EV/EBITDA |
| `margemEbit` | number | Margem EBIT |
| `margemLiquida` | number | Margem Líquida |
| `liquidezCorr` | number | Liquidez Corrente |
| `roic` | number | ROIC |
| `roe` | number | ROE |
| `liquidez2meses` | number | Liquidez 2 meses |
| `patrimonioLiq` | number | Patrimônio Líquido |
| `dividaBruta` | number | Dívida Bruta |
| `disponibilidades` | number | Disponibilidades |
| `ativoTotal` | number | Ativo Total |
| `receitaLiquida` | number | Receita Líquida |
| `ebit` | number | EBIT |
| `lucroLiquido` | number | Lucro Líquido |
| `valorMercado` | number | Valor de Mercado |
| `valorFirma` | number | Enterprise Value |
| `numeroAcoes` | number | Número de Ações |

**FII Support:** ✅ `fundos-imobiliarios` vs `acoes`

---

### 5. Investidor10 (TypeScript) - `investidor10.scraper.ts`
**Status:** ✅ FUNCIONAL
**Login:** Não necessário

#### Campos ÚNICOS (não disponíveis em outras fontes):
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `minPrice52w` | number | Mínima 52 semanas |
| `maxPrice52w` | number | Máxima 52 semanas |
| `pegRatio` | number | PEG Ratio |
| `margemBruta` | number | Margem Bruta |
| `roa` | number | ROA |
| `giroAtivos` | number | Giro de Ativos |
| `dividaLiquidaPL` | number | Dív. Líq./PL |
| `dividaLiquidaEbit` | number | Dív. Líq./EBIT |
| `plSobreAtivos` | number | PL/Ativos |
| `passivosAtivos` | number | Passivos/Ativos |
| `cagr5anos` | number | CAGR Receitas 5a |
| `payout` | number | Payout |

**FII Support:** ✅ `fiis` vs `acoes`

---

### 6. Fundamentei (TypeScript) - `fundamentei.scraper.ts`
**Status:** ✅ FUNCIONAL
**Login:** ✅ Google OAuth

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `companyName` | string | Nome |
| `price` | number | Cotação |
| `pl` | number | P/L |
| `pvp` | number | P/VP |
| `roe` | number | ROE |
| `dy` | number | Dividend Yield |
| `dividaLiquidaEbitda` | number | Dív. Líq./EBITDA |
| `margemLiquida` | number | Margem Líquida |
| `valorMercado` | number | Valor de Mercado |
| `receitaLiquida` | number | Receita Líquida |
| `lucroLiquido` | number | Lucro Líquido |

**FII Support:** ✅ `fiis` vs `acoes`

---

### 7. Investsite (TypeScript) - `investsite.scraper.ts`
**Status:** ✅ FUNCIONAL
**Login:** Não necessário

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `companyName` | string | Nome |
| `price` | number | Cotação |
| `pl` | number | P/L |
| `pvp` | number | P/VP |
| `roe` | number | ROE |
| `dy` | number | Dividend Yield |
| `evEbitda` | number | EV/EBITDA |
| `liquidezCorrente` | number | Liquidez Corrente |
| `margemLiquida` | number | Margem Líquida |
| `margemBruta` | number | Margem Bruta |
| `margemOperacional` | number | Margem Operacional |
| `receitaLiquida` | number | Receita Líquida |
| `lucroLiquido` | number | Lucro Líquido |
| `patrimonioLiquido` | number | Patrimônio Líquido |

**FII Support:** ✅ `fii_indicadores.php` vs `principais_indicadores.php`

---

## 🔷 SCRAPERS MACROECONÔMICOS

### 8. BCB (Python) - `bcb_scraper.py`
**Status:** ✅ FUNCIONAL (Playwright + API SGS)
**Login:** Não necessário
**Tipo:** API REST Oficial

#### Séries Implementadas (17 total):
| Série | Código SGS | Descrição |
|-------|------------|-----------|
| `selic_meta` | 432 | Taxa Selic Meta (% a.a.) |
| `selic_efetiva` | 4189 | Taxa Selic Efetiva (% a.a.) |
| `cdi` | 4391 | CDI (% a.m.) |
| `ipca` | 433 | IPCA mensal |
| `ipca_acum_12m` | 13522 | IPCA acumulado 12m |
| `ipca_15` | 7478 | IPCA-15 (prévia) |
| `igpm` | 189 | IGP-M mensal |
| `igpm_acum_12m` | 28763 | IGP-M acumulado 12m |
| `pib` | 4380 | PIB mensal |
| `desemprego` | 24369 | Taxa de desemprego |
| `cambio_usd` | 10813 | USD/BRL Ptax |
| `cambio_eur` | 21619 | EUR/BRL Ptax |
| `idp_ingressos` | 22886 | IDP - Ingressos |
| `ide_saidas` | 22867 | IDE - Saídas |
| `idp_liquido` | 22888 | IDP Líquido |
| `reservas` | 13621 | Reservas Internacionais |
| `reservas_ouro` | 23044 | Ouro Monetário |

---

### 9. IPEADATA (Python) - `ipeadata_scraper.py`
**Status:** ✅ FUNCIONAL
**Login:** Não necessário
**Tipo:** API REST Oficial

#### Commodities Implementadas:
| Commodity | Código | Descrição |
|-----------|--------|-----------|
| `brent` | 1650971490 | Petróleo Brent (US$/barril) |
| `iron_ore_dalian` | 1650972160 | Minério de Ferro - Dalian |
| `iron_ore_singapore` | 1650972161 | Minério de Ferro - Singapore |

---

### 10. FRED (Python) - `fred_scraper.py`
**Status:** 🔧 Implementado
**Login:** Não necessário
**Tipo:** API REST Oficial (Federal Reserve)

#### Séries Disponíveis:
- Treasury Yields (2Y, 5Y, 10Y, 30Y)
- S&P 500, NASDAQ
- Fed Funds Rate
- CPI (US)
- Unemployment Rate (US)

---

## 🔷 SCRAPERS DE MARKET DATA

### 11. Investing.com (Python) - `investing_scraper.py`
**Status:** ⚠️ PARCIAL
**Login:** ✅ Google OAuth

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `price` | number | Cotação |
| `change` | number | Variação |
| `change_percent` | number | Variação % |
| `volume` | number | Volume |
| `high` | number | Máxima |
| `low` | number | Mínima |
| `open` | number | Abertura |
| `prev_close` | number | Fech. Anterior |
| `market_cap` | number | Valor de Mercado |

#### 🆕 CAMPOS NÃO IMPLEMENTADOS (disponíveis no site):
- **Análise Técnica:** RSI, MACD, SMA, EMA, Bollinger Bands
- **Consenso de Analistas:** Buy/Hold/Sell ratings
- **Preço-alvo:** Target price médio
- **Notícias:** Feed de notícias do ativo
- **Eventos:** Dividendos, Splits, Earnings
- **Informações Corporativas:** Setor, Indústria, Funcionários
- **Histórico de Dividendos:** Todos pagamentos

---

### 12. ADVFN (Python) - `advfn_scraper.py`
**Status:** ⚠️ PARCIAL (migrado Playwright)
**Login:** ✅ Google OAuth

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `price` | number | Cotação |
| `change` | number | Variação |
| `change_percent` | number | Variação % |
| `volume` | number | Volume |
| `high` | number | Máxima |
| `low` | number | Mínima |
| `open` | number | Abertura |
| `bid` | number | Bid |
| `ask` | number | Ask |
| `avg_volume` | number | Volume médio |

#### 🆕 CAMPOS NÃO IMPLEMENTADOS (disponíveis no site):
- **Book de Ofertas:** Bid/Ask levels
- **Análise Técnica:** Indicadores completos
- **Gráficos:** Múltiplos timeframes
- **Setor/Indústria:** Classificação setorial
- **Comparações:** Peers analysis
- **Notícias Corporativas:** News feed

---

### 13. Google Finance (Python) - `googlefinance_scraper.py`
**Status:** ⚠️ PARCIAL
**Login:** ✅ Google OAuth

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `company_name` | string | Nome |
| `price` | number | Cotação |
| `change` | number | Variação |
| `change_percent` | number | Variação % |
| `volume` | number | Volume |
| `high` | number | Máxima |
| `low` | number | Mínima |
| `open` | number | Abertura |
| `prev_close` | number | Fech. Anterior |
| `market_cap` | string | Valor de Mercado |
| `pe_ratio` | number | P/L |

#### 🆕 CAMPOS NÃO IMPLEMENTADOS (disponíveis no site):
- **Dividend Yield**
- **52-week Range**
- **Avg Volume**
- **About Company:** Descrição, CEO, Sede
- **News Feed:** Notícias relacionadas
- **Financials Tab:** Demonstrações financeiras completas
- **Similar Stocks:** Ativos relacionados

---

### 14. TradingView (Python) - `tradingview_scraper.py`
**Status:** ⚠️ MÍNIMO
**Login:** ✅ Google OAuth

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `source` | string | Fonte |
| `scraped_at` | datetime | Timestamp |
| `technical_indicators` | object | (vazio) |

#### 🆕 CAMPOS NÃO IMPLEMENTADOS (ENORME potencial):
- **Análise Técnica Completa:**
  - RSI, MACD, Stochastic
  - SMA, EMA, WMA (múltiplos períodos)
  - Bollinger Bands
  - ATR, ADX
  - Ichimoku Cloud
  - Pivot Points
  - Fibonacci Levels
- **Rating Técnico:** Buy/Sell/Neutral
- **Screener Data:** Todos indicadores do screener
- **Ideas & Analysis:** Análises da comunidade
- **Financials:** Dados fundamentalistas completos

---

### 15. B3 (Python) - `b3_scraper.py`
**Status:** ⚠️ PARCIAL
**Login:** Não necessário

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código |
| `company_name` | string | Nome |
| `official_name` | string | Razão Social |
| `cnpj` | string | CNPJ |
| `sector` | string | Setor |
| `segment` | string | Segmento |
| `listing_date` | string | Data de Listagem |
| `market_segment` | string | Seg. de Listagem |
| `governance_level` | string | Governança |
| `shares_outstanding` | number | Ações em Circulação |
| `free_float` | number | Free Float |
| `tag_along` | number | Tag Along |
| `website` | string | Site |

#### 🆕 CAMPOS NÃO IMPLEMENTADOS (APIs B3):
- **Market Data API:** Cotações em tempo real
- **COTAHIST:** Histórico completo (já implementado via arquivo)
- **Corporate Events:** Dividendos, Splits, Bonificações
- **Financial Statements:** Demonstrações trimestrais
- **Ownership Structure:** Composição acionária
- **Options Data:** Série de opções listadas
- **Index Composition:** Ativos do Ibovespa, IFIX, etc.

---

## 🔷 SCRAPERS DE OPÇÕES

### 16. Opcoes.net.br (Python) - `opcoes_scraper.py`
**Status:** ⚠️ PARCIAL
**Login:** ✅ Credenciais específicas

#### Campos Implementados:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ticker` | string | Código do subjacente |
| `underlying_price` | number | Preço do ativo |
| `iv_rank` | number | IV Rank |
| `iv_percentile` | number | IV Percentile |
| `options_chain` | array | Cadeia de opções |

**Options Chain:**
- `symbol`: Código da opção
- `type`: CALL/PUT
- `strike`: Strike price
- `expiration`: Vencimento
- `bid`: Bid
- `ask`: Ask
- `last`: Último
- `volume`: Volume
- `open_interest`: OI
- `iv`: Volatilidade Implícita
- `delta`, `gamma`, `theta`, `vega`: Greeks

#### 🆕 CAMPOS NÃO IMPLEMENTADOS:
- **Histórico de IV:** IV histórica do ativo
- **IV Surface:** Superfície de volatilidade
- **Skew:** Volatility skew
- **Term Structure:** Estrutura a termo
- **Probabilidades:** ITM/OTM probabilities
- **Expected Move:** Movimento esperado

---

## 🔷 SCRAPERS DE NOTÍCIAS

### 17. Estadão Investidor (Python) - `estadao_scraper.py`
**Status:** ⚠️ NOTÍCIAS
**Login:** ✅ Google OAuth

#### Campos Implementados:
- Articles list with: title, url, description, published_at, category, author

---

### 18. Mais Retorno (Python) - `maisretorno_scraper.py`
**Status:** ⚠️ NOTÍCIAS
**Login:** ✅ Google OAuth

#### Campos Implementados:
- Articles list with: title, url, description, published_at, category, author

#### 🆕 CAMPOS NÃO IMPLEMENTADOS:
- **Comparador de Ativos:** Ferramenta de comparação
- **Calculadora de Investimentos**
- **Ranking de FIIs**
- **Análises de Carteira**

---

## 📈 CAMPOS MAIS IMPORTANTES NÃO MAPEADOS

### 1. ANÁLISE TÉCNICA (Alta Prioridade)
| Indicador | Fontes Potenciais | Prioridade |
|-----------|-------------------|------------|
| RSI | TradingView, Investing | 🔴 ALTA |
| MACD | TradingView, Investing | 🔴 ALTA |
| SMA/EMA | TradingView, Investing | 🔴 ALTA |
| Bollinger Bands | TradingView, Investing | 🟡 MÉDIA |
| ATR | TradingView | 🟡 MÉDIA |
| Volume Profile | TradingView | 🟢 BAIXA |

### 2. CONSENSO DE MERCADO (Alta Prioridade)
| Campo | Fontes Potenciais | Prioridade |
|-------|-------------------|------------|
| Target Price | Investing, Yahoo | 🔴 ALTA |
| Buy/Hold/Sell | Investing, Yahoo | 🔴 ALTA |
| Analyst Count | Investing, Yahoo | 🟡 MÉDIA |

### 3. EVENTOS CORPORATIVOS (Média Prioridade)
| Evento | Fontes Potenciais | Prioridade |
|--------|-------------------|------------|
| Dividendos | B3, Investing | 🔴 ALTA |
| Splits | B3 | 🟡 MÉDIA |
| Earnings | Investing, Yahoo | 🟡 MÉDIA |
| AGMs/EGMs | B3 | 🟢 BAIXA |

### 4. OPÇÕES AVANÇADAS (Média Prioridade)
| Campo | Fontes Potenciais | Prioridade |
|-------|-------------------|------------|
| IV Surface | Opcoes.net | 🟡 MÉDIA |
| Put/Call Ratio | Opcoes.net | 🟡 MÉDIA |
| Max Pain | Opcoes.net | 🟢 BAIXA |

### 5. MACRO ADICIONAL (Baixa Prioridade)
| Indicador | Fonte | Prioridade |
|-----------|-------|------------|
| Curva de Juros | Anbima | 🟡 MÉDIA |
| CDS Brasil | Bloomberg | 🟢 BAIXA |
| Risco País | BCB | 🟡 MÉDIA |

---

## 🎯 RECOMENDAÇÕES DE EVOLUÇÃO

### Fase 1: Completar TradingView (ALTA PRIORIDADE)
**Esforço:** Alto
**Impacto:** Muito Alto

Implementar extração completa de indicadores técnicos do TradingView:
- RSI, MACD, SMA, EMA
- Rating Técnico (Buy/Sell/Neutral)
- Dados do Screener

### Fase 2: Expandir Investing.com
**Esforço:** Médio
**Impacto:** Alto

Adicionar:
- Consenso de Analistas
- Target Price
- Eventos (Dividendos, Earnings)
- Notícias por ativo

### Fase 3: Integrar APIs Oficiais B3
**Esforço:** Médio
**Impacto:** Alto

Utilizar APIs oficiais da B3 para:
- Dados de Market Data (cotações)
- Corporate Events
- Composição de Índices

### Fase 4: Novos Scrapers
**Esforço:** Variável
**Impacto:** Médio

Considerar novas fontes:
- **Yahoo Finance Brasil:** Rico em dados
- **Bloomberg:** Consenso de analistas
- **Refinitiv:** Dados institucionais
- **ANBIMA:** Curva de juros, fundos

---

## 📊 MATRIZ DE CROSS-VALIDATION

### Campos com 3+ Fontes (Alta Confiança)
| Campo | Fontes |
|-------|--------|
| P/L | BRAPI, Fundamentus, StatusInvest, Investidor10, Fundamentei, Investsite |
| P/VP | BRAPI, Fundamentus, StatusInvest, Investidor10, Fundamentei, Investsite |
| DY | BRAPI, Fundamentus, StatusInvest, Investidor10, Fundamentei, Investsite |
| ROE | Fundamentus, StatusInvest, Investidor10, Fundamentei, Investsite |
| Margem Líquida | Fundamentus, StatusInvest, Investidor10, Investsite |
| EV/EBITDA | Fundamentus, StatusInvest, Investidor10, Investsite |

### Campos com 1-2 Fontes (Verificar)
| Campo | Fontes |
|-------|--------|
| PEG Ratio | Investidor10 |
| CAGR 5a | Fundamentus (Python), Investidor10 |
| Giro Ativos | Investidor10 |

---

## 📝 NOTAS TÉCNICAS

### Rate Limiting por Fonte
| Fonte | Limite | Implementação |
|-------|--------|---------------|
| BRAPI | 5 req/min (free) | Mutex 12s |
| Fundamentus | ~20 req/min | Rate limiter |
| StatusInvest | ~30 req/min | Rate limiter |
| BCB API | Sem limite | - |
| Investing | ~10 req/min | OAuth + delay |

### Autenticação
| Método | Fontes |
|--------|--------|
| API Key | BRAPI |
| Google OAuth | Fundamentei, Investing, ADVFN, Google Finance, TradingView, Estadão, Mais Retorno |
| Credenciais | Opcoes.net.br |
| Sem Auth | Fundamentus, StatusInvest, Investidor10, Investsite, B3, BCB, IPEADATA |

---

*Documento gerado automaticamente em 2025-12-02*
