# Relatório de Investigação - Scrapers Alternativos

**Data:** 2025-11-27
**Executor:** Claude Code
**Objetivo:** Investigar scrapers para ativos sem dados

---

## 🔍 Problema Identificado

**Apenas 2 de 30 scrapers estão ativos**, causando falta de dados para muitos ativos.

### Status Atual dos Scrapers

| Status | Quantidade | Scrapers |
|--------|-----------|----------|
| ✅ **Ativos (migrados)** | 2 | FundamentusScraper, BCBScraper |
| ⚠️ **Migrado mas desabilitado** | 1 | ADVFNScraper |
| ❌ **Pendentes (Selenium)** | 24 | StatusInvest, Investidor10, B3, e outros |
| ✔️ **API-only (OK)** | 4 | ANBIMA, FRED, IPEAData, CoinMarketCap |

---

## 🚨 Scrapers CRÍTICOS Pendentes de Migração

### 1. StatusInvestScraper ⭐⭐⭐
- **Importância:** ALTA - Dados fundamentalistas completos
- **Status:** ❌ Usando Selenium
- **Requer Login:** NÃO (público)
- **Complexidade de Migração:** BAIXA
- **Fonte:** https://statusinvest.com.br/acoes/
- **Dados Fornecidos:**
  - P/L, P/VP, ROE, ROIC
  - Dividend Yield
  - Indicadores fundamentalistas
  - Rankings e comparações

### 2. B3Scraper ⭐⭐⭐
- **Importância:** ALTA - Fonte oficial da bolsa
- **Status:** ❌ Usando Selenium
- **Requer Login:** NÃO (público)
- **Complexidade de Migração:** MÉDIA
- **Fonte:** https://www.b3.com.br/
- **Dados Fornecidos:**
  - Dados oficiais da empresa
  - Informações de listagem
  - Últimos negócios
  - Informações corporativas

### 3. Investidor10Scraper ⭐⭐
- **Importância:** MÉDIA-ALTA - Rankings e análise detalhada
- **Status:** ❌ Usando Selenium
- **Requer Login:** SIM (Google OAuth)
- **Complexidade de Migração:** ALTA (OAuth)
- **Fonte:** https://investidor10.com.br/
- **Dados Fornecidos:**
  - Análise fundamentalista completa
  - Rankings setoriais
  - Scores de qualidade
  - Histórico de dividendos

### 4. ADVFNScraper ⚠️
- **Importância:** MÉDIA - Análise técnica e indicadores
- **Status:** ✅ JÁ MIGRADO mas DESABILITADO
- **Requer Login:** SIM (Google OAuth)
- **Complexidade:** ZERO (apenas habilitar)
- **Fonte:** https://br.advfn.com/
- **Dados Fornecidos:**
  - Cotações em tempo real
  - Análise técnica
  - Indicadores de mercado
  - Razões financeiras

---

## 📊 Análise de Cobertura Atual

### Cobertura de Dados por Tipo

| Tipo de Dado | Scrapers Ativos | Scrapers Disponíveis (migrados) | Scrapers Potenciais (pendentes) |
|--------------|----------------|--------------------------------|--------------------------------|
| **Preço Atual** | 1 (Fundamentus) | 2 (+ADVFN) | 5 (+StatusInvest, B3, Investidor10) |
| **Dados Fundamentalistas** | 1 (Fundamentus) | 2 (+ADVFN) | 3 (+StatusInvest, Investidor10) |
| **Informações Oficiais** | 0 | 0 | 1 (+B3) |
| **Análise Técnica** | 0 | 1 (+ADVFN) | 2 (+TradingView, Investing) |
| **Dividendos** | 1 (Fundamentus) | 1 | 2 (+Investidor10, StatusInvest) |
| **Market Cap/Volume** | 1 (Fundamentus) | 2 (+ADVFN) | 3 (+StatusInvest, B3) |

### Cross-Validation

**Situação Atual:**
- ✅ BCBScraper: Dados macroeconômicos (Selic, IPCA, etc.)
- ✅ FundamentusScraper: Dados fundamentalistas de ações

**Problema:**
- ❌ **Sem cross-validation** - Apenas 1 fonte para cada tipo de dado
- ❌ **Política de 3 fontes NÃO atendida** (`.gemini/context/financial-rules.md`)

**Com scrapers adicionais:**
- ✅ Preço: 3+ fontes (Fundamentus, ADVFN, StatusInvest)
- ✅ Fundamentalistas: 3+ fontes (Fundamentus, ADVFN, StatusInvest)
- ✅ Dados oficiais: 1 fonte autoritativa (B3)

---

## 🎯 Plano de Ação Recomendado

### FASE 1: Ação Imediata (0 esforço) ⚡

**Objetivo:** Ativar scraper já migrado

1. ✅ Habilitar ADVFNScraper em `__init__.py`
2. ✅ Testar scraping com ticker de exemplo (PETR4)
3. ✅ Validar dados retornados
4. ✅ Verificar se Google OAuth cookies estão disponíveis

**Resultado esperado:** +1 fonte de dados (total: 3 scrapers ativos)

---

### FASE 2: Migração Prioritária (baixa complexidade) 🚀

**Objetivo:** Migrar scrapers públicos (sem login)

#### 2.1. StatusInvestScraper
- **Esforço:** 1-2 horas
- **Complexidade:** BAIXA (público, sem login)
- **Impacto:** ALTO (dados fundamentalistas completos)
- **Passos:**
  1. Converter Selenium → Playwright usando guia de migração
  2. Testar com 5+ tickers (PETR4, VALE3, ITUB4, ABEV3, BBDC4)
  3. Validar dados extraídos
  4. Habilitar em `__init__.py`

#### 2.2. B3Scraper
- **Esforço:** 2-3 horas
- **Complexidade:** MÉDIA (site oficial com estrutura complexa)
- **Impacto:** ALTO (dados oficiais autoritativos)
- **Passos:**
  1. Converter Selenium → Playwright
  2. Adaptar lógica de busca por CVM code
  3. Testar com 5+ tickers
  4. Validar dados extraídos
  5. Habilitar em `__init__.py`

**Resultado esperado:** +2 fontes (total: 5 scrapers ativos)

---

### FASE 3: Migração Avançada (alta complexidade) 🔐

**Objetivo:** Migrar scrapers que requerem autenticação

#### 3.1. Investidor10Scraper
- **Esforço:** 3-4 horas
- **Complexidade:** ALTA (Google OAuth + estrutura complexa)
- **Impacto:** MÉDIO-ALTO (dados premium)
- **Pré-requisitos:**
  - Google OAuth cookies válidos em `/app/browser-profiles/google_cookies.pkl`
  - Teste de login funcional
- **Passos:**
  1. Converter Selenium → Playwright
  2. Adaptar lógica de cookies OAuth
  3. Implementar verificação de login
  4. Testar com 5+ tickers
  5. Validar dados extraídos
  6. Habilitar em `__init__.py`

**Resultado esperado:** +1 fonte premium (total: 6 scrapers ativos)

---

### FASE 4: Scrapers Complementares (opcional) 📈

**Objetivo:** Adicionar fontes adicionais para cross-validation

- **FundamenteiScraper** - Dados fundamentalistas alternativos
- **InvestingScraper** - Dados internacionais e análise técnica
- **TradingViewScraper** - Análise técnica avançada
- **GoogleFinanceScraper** - Dados de mercado Google

**Esforço total:** 8-12 horas
**Impacto:** MÉDIO (fontes adicionais para cross-validation)

---

## 🔧 Ferramentas Disponíveis

### Script de Migração Automática
**Arquivo:** `backend/python-scrapers/migrate_selenium_to_playwright.py`

**Capacidades:**
- Conversão automática de imports Selenium → Playwright
- Substituição de `driver` por `page`
- Conversão de seletores (By.CSS_SELECTOR, By.XPATH, etc.)
- Conversão de operações (get, find_element, text, click, etc.)

### Documentação
- **Guia Completo:** `backend/python-scrapers/SELENIUM_TO_PLAYWRIGHT_MIGRATION.md`
- **Relatório de Status:** `backend/python-scrapers/MIGRATION_REPORT.md`
- **Base Scraper:** `backend/python-scrapers/base_scraper.py` (já migrado)

---

## 📋 Checklist de Implementação

### FASE 1: Habilitar ADVFN ✅
- [ ] Descomentar import de ADVFNScraper em `__init__.py`
- [ ] Testar scraping com PETR4
- [ ] Verificar se Google OAuth cookies existem
- [ ] Validar dados retornados
- [ ] Commit com mensagem descritiva

### FASE 2.1: Migrar StatusInvest ⏳
- [ ] Criar backup do arquivo original
- [ ] Executar script de migração ou converter manualmente
- [ ] Remover imports de Selenium
- [ ] Converter `self.driver` → `self.page`
- [ ] Converter `driver.get()` → `await page.goto()`
- [ ] Converter `find_element()` → `await page.query_selector()`
- [ ] Converter `elem.text` → `await elem.text_content()`
- [ ] Adicionar `await` em todas operações I/O
- [ ] Testar com 5+ tickers
- [ ] Validar TypeScript compilação (backend)
- [ ] Habilitar em `__init__.py`
- [ ] Commit

### FASE 2.2: Migrar B3 ⏳
- [ ] Criar backup do arquivo original
- [ ] Executar script de migração ou converter manualmente
- [ ] Remover imports de Selenium
- [ ] Converter operações de driver
- [ ] Adaptar lógica de busca por CVM code
- [ ] Testar com 5+ tickers
- [ ] Validar dados oficiais
- [ ] Habilitar em `__init__.py`
- [ ] Commit

### FASE 3: Migrar Investidor10 ⏳
- [ ] Verificar cookies OAuth disponíveis
- [ ] Criar backup do arquivo original
- [ ] Converter para Playwright
- [ ] Adaptar lógica de cookies
- [ ] Implementar verificação de login
- [ ] Testar autenticação
- [ ] Testar com 5+ tickers
- [ ] Habilitar em `__init__.py`
- [ ] Commit

---

## ⚠️ Riscos e Mitigações

### Risco 1: Scrapers quebrados após migração
**Probabilidade:** MÉDIA
**Impacto:** ALTO
**Mitigação:**
- ✅ Criar backups antes de modificar
- ✅ Testar com múltiplos tickers antes de habilitar
- ✅ Validar dados extraídos comparando com Fundamentus
- ✅ Habilitar um scraper por vez

### Risco 2: Google OAuth cookies inválidos/expirados
**Probabilidade:** ALTA
**Impacto:** ALTO (para scrapers com login)
**Mitigação:**
- ⚠️ Verificar existência de `/app/browser-profiles/google_cookies.pkl`
- ⚠️ Testar login antes de migrar scrapers OAuth
- ⚠️ Implementar fallback gracioso (tentar sem login)
- ⚠️ Documentar processo de obtenção de cookies

### Risco 3: Mudanças na estrutura dos sites
**Probabilidade:** BAIXA-MÉDIA
**Impacto:** MÉDIO
**Mitigação:**
- ✅ Usar múltiplos seletores (fallbacks)
- ✅ Implementar error handling robusto
- ✅ Logging detalhado de falhas
- ✅ Cross-validation com outras fontes

---

## 📈 Benefícios Esperados

### Cobertura de Dados
- **Atual:** 2 scrapers ativos (20-30% cobertura)
- **Fase 1:** 3 scrapers (40-50% cobertura)
- **Fase 2:** 5 scrapers (70-80% cobertura)
- **Fase 3:** 6+ scrapers (85-95% cobertura)

### Cross-Validation
- **Atual:** ❌ Sem cross-validation (1 fonte)
- **Após Fase 2:** ✅ 3+ fontes para preço e fundamentalistas
- **Após Fase 3:** ✅ 4+ fontes premium

### Confiabilidade
- **Atual:** Dados de apenas 1 fonte (risco alto)
- **Após Fases:** Consenso de múltiplas fontes (risco baixo)
- **Detecção de outliers:** Automatizada com 3+ fontes

---

## 🏁 Próximos Passos Imediatos

1. **AGORA:** Habilitar ADVFNScraper (5 minutos)
2. **Hoje:** Migrar StatusInvestScraper (1-2 horas)
3. **Amanhã:** Migrar B3Scraper (2-3 horas)
4. **Esta Semana:** Migrar Investidor10Scraper (3-4 horas)

---

**Desenvolvido com:** Claude Code
**Co-Authored-By:** Claude <noreply@anthropic.com>
