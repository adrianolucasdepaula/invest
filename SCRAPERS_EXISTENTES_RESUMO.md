# Resumo: Scrapers Existentes - Análise para Indicadores Econômicos
**Data:** 2025-11-22
**Objetivo:** Mapear scrapers existentes e suas capacidades para coleta de indicadores econômicos

---

## 📊 Visão Geral

**Total de Scrapers:** 28 implementados
**Categorias:**
1. Dados Econômicos Oficiais (BC Brasil, B3)
2. Agregadores Financeiros (Investing.com, TradingView, Bloomberg)
3. Análise Fundamentalista (Fundamentus, Investidor10, Status Invest)
4. Notícias (Valor, Estadão, Exame, InfoMoney)
5. IA/LLMs (ChatGPT, Claude, Gemini, Grok, DeepSeek, Griffin)
6. Outros (CoinMarketCap, Google Finance/News, ADVFN, Opções)

---

## 🔍 Scrapers Relevantes para Indicadores Econômicos

### 1. BC Brasil (bcb_scraper.py) ✅ PRINCIPAL
**Status:** ✅ IMPLEMENTADO E FUNCIONANDO
**Tipo:** API Oficial (pública, sem login)
**URL:** https://api.bcb.gov.br/dados/serie/bcdata.sgs.{CODIGO}/dados

**Indicadores Disponíveis (17 séries):**

| Categoria | Indicador | Código SGS | Status |
|-----------|-----------|------------|--------|
| **Juros** | Selic Meta | 432 | ✅ |
| **Juros** | Selic Efetiva | 4189 | ✅ |
| **Juros** | CDI | 4391 | ✅ |
| **Inflação** | IPCA Mensal | 433 | ✅ |
| **Inflação** | IPCA Acum 12m | 13522 | ✅ |
| **Inflação** | IPCA-15 Mensal | 7478 | ✅ NOVO |
| **Inflação** | IGP-M Mensal | 189 | ✅ |
| **Inflação** | IGP-M Acum 12m | 28763 | ✅ |
| **Atividade** | PIB Mensal | 4380 | ✅ |
| **Atividade** | Taxa Desemprego | 24369 | ✅ |
| **Câmbio** | USD/BRL (Ptax) | 10813 | ✅ |
| **Câmbio** | EUR/BRL (Ptax) | 21619 | ✅ |
| **Capital** | IDP Ingressos | 22886 | ✅ NOVO |
| **Capital** | IDE Saídas | 22867 | ✅ NOVO |
| **Capital** | IDP Líquido | 22888 | ✅ NOVO |
| **Reservas** | Reservas USD | 13621 | ✅ |
| **Reservas** | Ouro Monetário | 23044 | ✅ NOVO |

**Validação:** ✅ Testado em 2025-11-22 - 100% funcionando

---

### 2. Investing.com (investing_scraper.py) ⚠️ COM LIMITAÇÕES
**Status:** ⚠️ IMPLEMENTADO (requer Google OAuth)
**Tipo:** Web Scraping com Selenium + OAuth
**URL:** https://br.investing.com/

**Dados Potencialmente Disponíveis:**
- Petróleo Brent (futuros e histórico)
- Minério de Ferro (futuros Dalian/Singapura)
- Dólar USD/BRL (spot e histórico)
- Payroll (EUA) - calendário econômico
- Outros indicadores internacionais

**Limitações:**
- ❌ Requer login via Google OAuth
- ❌ Cookies salvos em `/app/browser-profiles/google_cookies.pkl`
- ❌ Dependente de estrutura HTML (pode quebrar)
- ⚠️ Cloudflare pode bloquear scraping automatizado

**Recomendação:** Usar apenas como fallback/complemento de APIs oficiais

---

### 3. TradingView (tradingview_scraper.py) ⚠️ VERIFICAR
**Status:** ⚠️ IMPLEMENTADO (detalhes desconhecidos)
**Tipo:** Web Scraping (provavelmente)
**URL:** https://br.tradingview.com/

**Dados Potencialmente Disponíveis:**
- Petróleo Brent (símbolo: UKOIL)
- Minério de Ferro (futuros)
- Índices de Commodities
- Gráficos e indicadores técnicos

**Limitações:**
- ❌ Estrutura desconhecida (precisa ler código)
- ⚠️ Pode ter bloqueios anti-scraping

---

### 4. B3 (b3_scraper.py) ✅ POTENCIAL
**Status:** ✅ IMPLEMENTADO (verificar dados disponíveis)
**Tipo:** Web Scraping ou API
**URL:** http://www.b3.com.br/

**Dados Potencialmente Disponíveis:**
- Dados de ações brasileiras
- Índices (IBOV, IFIX, etc)
- Possivelmente curva de juros (NTN-B)

**Recomendação:** Verificar se já coleta dados de Tesouro Direto

---

### 5. Bloomberg (bloomberg_scraper.py) ⚠️ LIMITADO
**Status:** ⚠️ IMPLEMENTADO (provavelmente notícias)
**Tipo:** Web Scraping
**URL:** https://www.bloomberg.com/

**Dados Potencialmente Disponíveis:**
- Notícias financeiras
- Possivelmente commodities (Brent, minério)

**Limitações:**
- ❌ Paywall forte
- ❌ Provavelmente só notícias, não dados numéricos

---

## 🆕 Scrapers que PRECISAM ser Criados

### 1. ANBIMA Scraper (anbima_scraper.py) 🚧 EM PROGRESSO
**Objetivo:** Curva de Juros NTN-B / Tesouro IPCA+
**Prioridade:** 🔥 ALTA

**Fontes Disponíveis:**
1. ✅ **Gabriel Gaspar API** (RECOMENDADO - público, sem auth)
   - URL: `https://tesouro.gabrielgaspar.com.br/bonds`
   - Status: ✅ TESTADO E FUNCIONANDO (2025-11-22)
   - Dados: 57 títulos (Tesouro IPCA+, Selic, Prefixado, Renda+, Educa+)
   - Atualização: Diária (updated_at: 2025-11-21T18:49:35-03:00)

2. ❌ **Tesouro Direto Official** (DESCONTINUADO)
   - URL antiga: `https://www.tesourodireto.com.br/json/.../treasurybondsinfo.json`
   - Status: ❌ HTTP 410 Gone (bloqueado por Cloudflare desde Ago/2024)

3. ⚠️ **B3 Developers API** (requer cadastro)
   - URL: https://developers.b3.com.br/apis/tesouro-direto
   - Status: ⚠️ Requer autenticação Bearer

4. ⚠️ **ANBIMA API** (requer token)
   - URL: https://api.anbima.com.br/feed/precos-indices/v1/titulos-publicos/curvas-juros
   - Status: ⚠️ Requer Bearer token ANBIMA

**Decisão:** Usar Gabriel Gaspar API como fonte primária

**Vértices da Curva a Extrair:**
- 1 ano, 2 anos, 3 anos, 5 anos, 10 anos, 15 anos, 20 anos, 30 anos
- Calcular média de yields para cada vértice
- Filtrar apenas Tesouro IPCA+ (NTN-B)

---

### 2. IPEADATA Scraper (ipeadata_scraper.py) ⏸️ PENDENTE
**Objetivo:** Commodities (Petróleo Brent, Minério de Ferro)
**Prioridade:** 🟡 MÉDIA

**API Disponível:**
- URL: `http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{CODIGO}')`
- **Petróleo Brent:** Código 1650971490
- **Minério de Ferro:** Código 1650972160 (Dalian) ou 1650972161 (Singapore)

**Vantagens:**
- ✅ API pública (sem autenticação)
- ✅ Dados históricos confiáveis
- ✅ Fonte oficial brasileira (IPEA)

**Alternativas:**
- Investing.com (já implementado, requer OAuth)
- TradingView (já implementado, verificar)
- FRED API (para Brent - série DCOILBRENTEU)

---

### 3. FRED Scraper (fred_scraper.py) ⏸️ PENDENTE
**Objetivo:** Payroll EUA (Non-Farm Payroll) + Commodities
**Prioridade:** 🟡 MÉDIA

**API Disponível:**
- URL: `https://api.stlouisfed.org/fred/series/observations`
- **Payroll (Non-Farm):** Série PAYEMS
- **Petróleo Brent:** Série DCOILBRENTEU
- **Taxa Fed Funds:** Série DFF
- **CPI (EUA):** Série CPIAUCSL

**Requisitos:**
- ⚠️ API Key necessária (gratuita)
- Registro em: https://fredaccount.stlouisfed.org/apikeys

**Vantagens:**
- ✅ Fonte oficial (Federal Reserve)
- ✅ API robusta e bem documentada
- ✅ Dados históricos completos

---

## 📋 Análise de Cobertura Atual vs Necessária

### ✅ JÁ TEMOS (BC Brasil)
- [x] Selic (meta e efetiva)
- [x] IPCA (mensal e acumulado 12m)
- [x] IPCA-15 (mensal)
- [x] IGP-M (mensal e acumulado 12m)
- [x] PIB (mensal)
- [x] Dólar (USD/BRL Ptax)
- [x] CDI
- [x] Taxa de Desemprego
- [x] Fluxo de Capital Estrangeiro (IDP/IDE)
- [x] Reservas Internacionais (USD + Ouro)

### ⚠️ PRECISAMOS CRIAR
- [ ] **Curva de Juros NTN-B** (ANBIMA/Tesouro) - 🚧 EM PROGRESSO
- [ ] **Petróleo Brent** (IPEADATA ou FRED) - ⏸️ PENDENTE
- [ ] **Minério de Ferro** (IPEADATA) - ⏸️ PENDENTE
- [ ] **Payroll (EUA)** (FRED) - ⏸️ PENDENTE

### ✅ OPCIONAL (melhorias futuras)
- [ ] Decisões do COPOM (histórico completo - BC Brasil)
- [ ] Commodities Agrícolas (soja, milho, café - IPEADATA)
- [ ] Taxa Fed Funds (FRED)
- [ ] CPI (EUA - FRED)

---

## 🎯 Recomendações de Implementação

### ETAPA 2: ANBIMA Scraper (ATUAL)
**Ação:** ✅ Usar Gabriel Gaspar API
**Código:** Já criado em `anbima_scraper.py`
**Próximo Passo:** Atualizar código para usar Gabriel Gaspar API em vez de Tesouro Direto oficial

### ETAPA 3: IPEADATA Scraper
**Ação:** Criar novo scraper `ipeadata_scraper.py`
**API:** `http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{CODIGO}')`
**Séries:**
- 1650971490: Petróleo Brent
- 1650972160: Minério de Ferro (Dalian)

### ETAPA 4: FRED Scraper
**Ação:** Criar novo scraper `fred_scraper.py`
**API:** `https://api.stlouisfed.org/fred/series/observations`
**Séries:**
- PAYEMS: Non-Farm Payroll
- DCOILBRENTEU: Petróleo Brent (validação cruzada)

### Validação Cruzada (Multi-Source)
**Objetivo:** Comparar dados de múltiplas fontes para garantir precisão

| Indicador | Fonte 1 (Principal) | Fonte 2 (Validação) | Fonte 3 (Fallback) |
|-----------|---------------------|---------------------|-------------------|
| **Petróleo Brent** | IPEADATA (1650971490) | FRED (DCOILBRENTEU) | Investing.com |
| **Curva Juros** | Gabriel Gaspar API | B3 Developers | ANBIMA API |
| **Payroll (EUA)** | FRED (PAYEMS) | Investing.com (calendário) | - |

**Critério de Validação:**
- ✅ Se diferença < 5%: Aceitar fonte principal
- ⚠️ Se diferença 5-10%: Log warning + flag validação
- ❌ Se diferença > 10%: Rejeitar + investigar

---

## 📊 Resumo Estatístico

**Scrapers Totais:** 28
**Scrapers para Indicadores Econômicos:**
- BC Brasil: 1 (17 séries)
- Investing.com: 1 (limitado, requer OAuth)
- TradingView: 1 (a verificar)
- B3: 1 (a verificar)
- Bloomberg: 1 (limitado)
- **Total Efetivo:** 2-3 scrapers confiáveis

**Cobertura Atual:**
- ✅ Indicadores BC Brasil: 17/17 (100%)
- ⚠️ Commodities: 0/2 (0%) - PRECISA CRIAR
- ⚠️ Internacionais (Payroll): 0/1 (0%) - PRECISA CRIAR
- ⚠️ Curva de Juros: 0/1 (0%) - 🚧 EM PROGRESSO

**Meta FASE 1.4:**
- Total de indicadores: 28+ (17 BC + 3 ANBIMA + 2 IPEADATA + 1 FRED + 5 futuros)

---

## ✅ Conclusão

**Análise Concluída:** ✅ 2025-11-22

**Próximas Ações:**
1. ✅ ETAPA 1: Expandir BC Brasil (COMPLETO - 17 séries)
2. 🚧 ETAPA 2: Finalizar ANBIMA scraper (usar Gabriel Gaspar API)
3. ⏸️ ETAPA 3: Criar IPEADATA scraper (commodities)
4. ⏸️ ETAPA 4: Criar FRED scraper (Payroll EUA)
5. ⏸️ ETAPA 5: Backend NestJS (entidades + services)
6. ⏸️ ETAPA 6: Frontend (dashboard com 28+ cards)

**Recomendação:** Continuar com ETAPA 2 (ANBIMA) usando Gabriel Gaspar API, que já foi testada e está funcionando perfeitamente.

---

**Analisado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-22

Co-Authored-By: Claude <noreply@anthropic.com>
