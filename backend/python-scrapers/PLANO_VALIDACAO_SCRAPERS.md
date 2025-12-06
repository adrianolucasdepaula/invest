# Plano de Validacao Detalhado - Scrapers Playwright

**Data:** 2025-12-04
**Objetivo:** Validar TODOS os 22 scrapers migrados para Playwright
**Metodologia:** Validacao individual, minuciosa, com evidencias

---

## Resumo Executivo

### Scrapers a Validar (22 total)

| Grupo | Scrapers | Prioridade | Complexidade |
|-------|----------|------------|--------------|
| **Fundamental** | Fundamentus, BCB, StatusInvest, Investsite, Investidor10 | ALTA | Media |
| **Mercado** | TradingView, GoogleFinance, Griffin, CoinMarketCap | ALTA | Media |
| **News** | Bloomberg, GoogleNews, Valor, Exame, InfoMoney, Estadao, InvestingNews | MEDIA | Baixa |
| **AI** | ChatGPT, Gemini, DeepSeek, Claude, Grok | MEDIA | Alta (OAuth) |
| **Options** | OpcoesNet | BAIXA | Alta (credenciais) |

---

## Metodologia de Validacao

### Para CADA scraper:

1. **Verificar Import**
   - Confirmar que o scraper importa sem erros
   - Verificar dependencias

2. **Testar Inicializacao**
   - Browser cria com sucesso
   - Page cria com sucesso
   - Login (se necessario) funciona

3. **Testar Scrape**
   - Executar com ticker de teste (PETR4 para acoes, BTC para crypto)
   - Verificar se retorna ScraperResult.success=True

4. **Validar Dados Extraidos**
   - Verificar campos esperados
   - Comparar com fonte original (Chrome DevTools)
   - Identificar campos faltantes

5. **Medir Performance**
   - Tempo de execucao (meta: <15s)
   - Memoria utilizada
   - Erros ou warnings

6. **Cleanup**
   - Verificar que page, browser, playwright sao fechados
   - Sem memory leaks

---

## Grupo 1: Fundamentus (Referencia)

### Scraper: fundamentus_scraper.py

**Status Esperado:** Validado (referencia)

**Ticker de Teste:** PETR4

**Campos Esperados (30):**
```
ticker, company_name, cotacao, p_l, p_vp, p_ebit, psr, p_ativos,
p_cap_giro, p_ativ_circ_liq, div_yield, ev_ebitda, ev_ebit,
cres_rec_5a, lpa, vpa, marg_bruta, marg_ebit, marg_liquida,
ebit_ativo, roic, roe, liquidez_corr, liquidez_2meses,
patrim_liq, div_bruta_patrim, div_liquida_patrim, div_liquida_ebitda,
pl_ativo, passivo_ativo
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK (<5s)
- [ ] Scrape retorna success=True
- [ ] Campos extraidos: __/30
- [ ] Tempo de execucao: __s
- [ ] Valores conferem com site

---

## Grupo 2: Dados Fundamentais

### Scraper: bcb_scraper.py

**Tipo:** API + Web fallback

**Input de Teste:** "selic" ou "all"

**Campos Esperados:**
```
indicator, value, date, series_id
Indicadores: selic, ipca, igpm, pib, cambio_usd, cambio_eur,
reservas, desemprego, cdi, selic_meta, selic_efetiva, ipca_15
```

**Validacao:**
- [ ] Import OK
- [ ] API SGS funciona (primario)
- [ ] Web fallback funciona (secundario)
- [ ] Indicadores extraidos: __/12
- [ ] Tempo de execucao: __s

---

### Scraper: statusinvest_scraper.py

**Ticker de Teste:** PETR4

**Campos Esperados:**
```
ticker, company_name, price, p_l, p_vp, dy, roe, roic,
marg_liquida, div_yield, ev_ebitda, lpa, vpa
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK
- [ ] Scrape retorna success=True
- [ ] Campos extraidos: __/__
- [ ] Tempo de execucao: __s

---

### Scraper: investsite_scraper.py

**Ticker de Teste:** PETR4

**Campos Esperados:**
```
ticker, company_name, price, indicators (40+ campos)
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK
- [ ] Scrape retorna success=True
- [ ] Campos extraidos: __/__
- [ ] Tempo de execucao: __s

---

### Scraper: investidor10_scraper.py

**Requer:** Google OAuth cookies

**Ticker de Teste:** PETR4

**Campos Esperados:**
```
ticker, company_name, price, indicators
```

**Validacao:**
- [ ] Import OK
- [ ] Cookies carregados
- [ ] Login verificado
- [ ] Scrape retorna success=True
- [ ] Campos extraidos: __/__
- [ ] Tempo de execucao: __s

---

## Grupo 3: Dados de Mercado

### Scraper: tradingview_scraper.py

**Requer:** Google OAuth cookies

**Ticker de Teste:** PETR4

**Campos Esperados:**
```
ticker, recommendation, oscillators, moving_averages,
technical_indicators, price
```

**Validacao:**
- [ ] Import OK
- [ ] Cookies carregados
- [ ] Scrape retorna success=True
- [ ] Recommendation extraido
- [ ] Oscillators: __/__
- [ ] Moving Averages: __/__
- [ ] Tempo de execucao: __s

---

### Scraper: googlefinance_scraper.py

**Ticker de Teste:** PETR4

**Campos Esperados:**
```
ticker, price, change, change_percent, market_cap, pe_ratio
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK
- [ ] Scrape retorna success=True
- [ ] Price extraido corretamente
- [ ] Tempo de execucao: __s

---

### Scraper: griffin_scraper.py

**Tipo:** Publico (sem login)

**Ticker de Teste:** PETR4

**Campos Esperados:**
```
ticker, company_name, insider_transactions, summary
(total_transactions, total_buys, total_sells, volumes)
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK (sem login)
- [ ] Scrape retorna success=True
- [ ] Transactions extraidas: __
- [ ] Tempo de execucao: __s

---

### Scraper: coinmarketcap_scraper.py

**Tipo:** API + Web fallback (publico)

**Input de Teste:** "BTC"

**Campos Esperados:**
```
symbol, name, price_usd, market_cap, volume_24h,
change_1h, change_24h, change_7d
```

**Validacao:**
- [ ] Import OK
- [ ] API/aiohttp funciona (primario)
- [ ] Web fallback funciona (secundario)
- [ ] Price extraido corretamente
- [ ] Tempo de execucao: __s

---

## Grupo 4: Noticias

### Scraper: bloomberg_scraper.py

**Input de Teste:** "mercado"

**Campos Esperados:**
```
source, query, articles_count, articles
(title, url, description, published_at)
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK
- [ ] Scrape retorna success=True
- [ ] Articles extraidos: __
- [ ] Tempo de execucao: __s

---

### Scraper: googlenews_scraper.py

**Tipo:** Publico (sem login)

**Input de Teste:** "PETR4"

**Campos Esperados:**
```
source, query, articles_count, articles
(title, url, source_name, published_at)
```

**Validacao:**
- [ ] Import OK
- [ ] Inicializacao OK (sem login)
- [ ] Scrape retorna success=True
- [ ] Articles extraidos: __
- [ ] Tempo de execucao: __s

---

### Scrapers: valor_scraper, exame_scraper, infomoney_scraper, estadao_scraper

**Requer:** Google OAuth cookies

**Input de Teste:** categoria (mercados, acoes, etc)

**Campos Esperados:**
```
source, category, articles_count, articles
(title, url, description, published_at)
```

**Validacao por scraper:**
- [ ] Valor: Import OK / Scrape OK / Articles: __
- [ ] Exame: Import OK / Scrape OK / Articles: __
- [ ] InfoMoney: Import OK / Scrape OK / Articles: __
- [ ] Estadao: Import OK / Scrape OK / Articles: __

---

### Scraper: investing_news_scraper.py

**Requer:** Google OAuth cookies

**Input de Teste:** "latest"

**Campos Esperados:**
```
source, query, articles_count, articles
(title, url, description, published_at)
```

**Validacao:**
- [ ] Import OK
- [ ] Cookies carregados
- [ ] Scrape retorna success=True
- [ ] Articles extraidos: __
- [ ] Tempo de execucao: __s

---

## Grupo 5: AI Scrapers

### Requisitos Comuns

- Google OAuth cookies em `/app/data/cookies/`
- Tempo de espera para resposta: 60-120s
- Deteccao de estabilidade de resposta

### Scraper: chatgpt_scraper.py

**Input de Teste:** "Qual e a capital do Brasil?"

**Campos Esperados:**
```
prompt, response, model
```

**Validacao:**
- [ ] Import OK
- [ ] Cookies carregados
- [ ] Login verificado
- [ ] Prompt enviado
- [ ] Response extraida
- [ ] Tempo de execucao: __s

---

### Scrapers: gemini, deepseek, claude, grok

**Validacao por scraper:**
- [ ] Gemini: Import OK / Login OK / Response OK
- [ ] DeepSeek: Import OK / Login OK / Response OK
- [ ] Claude: Import OK / Login OK / Response OK
- [ ] Grok: Import OK / Login OK / Response OK

---

## Grupo 6: Options

### Scraper: opcoes_scraper.py

**Requer:** Credenciais especificas (OPCOES_USERNAME, OPCOES_PASSWORD)

**Input de Teste:** "PETR" (sem numero)

**Campos Esperados:**
```
ticker, underlying_price, iv_rank, iv_percentile,
options_chain (symbol, type, strike, expiration, bid, ask, volume, greeks)
```

**Validacao:**
- [ ] Import OK
- [ ] Credenciais configuradas
- [ ] Login realizado
- [ ] Scrape retorna success=True
- [ ] Options chain extraida: __
- [ ] Tempo de execucao: __s

---

## Script de Validacao

```python
# validate_scraper.py - Template para validar um scraper
import asyncio
from datetime import datetime

async def validate_scraper(scraper_class, test_input, expected_fields):
    """Validate a single scraper thoroughly"""
    result = {
        "scraper": scraper_class.__name__,
        "input": test_input,
        "timestamp": datetime.now().isoformat(),
        "import_ok": False,
        "init_ok": False,
        "scrape_ok": False,
        "fields_found": [],
        "fields_missing": [],
        "execution_time": 0,
        "error": None,
    }

    scraper = None
    start = datetime.now()

    try:
        # Test import
        result["import_ok"] = True

        # Test initialization
        scraper = scraper_class()
        await scraper.initialize()
        result["init_ok"] = True

        # Test scrape
        scrape_result = await scraper.scrape(test_input)
        result["execution_time"] = (datetime.now() - start).total_seconds()

        if scrape_result.success:
            result["scrape_ok"] = True

            # Validate fields
            if isinstance(scrape_result.data, dict):
                result["fields_found"] = list(scrape_result.data.keys())
                result["fields_missing"] = [
                    f for f in expected_fields
                    if f not in scrape_result.data
                ]
        else:
            result["error"] = scrape_result.error

    except Exception as e:
        result["error"] = str(e)
        result["execution_time"] = (datetime.now() - start).total_seconds()

    finally:
        if scraper:
            await scraper.cleanup()

    return result
```

---

## Criterios de Aprovacao

### Por Scraper:
- Import OK
- Inicializacao < 10s
- Scrape retorna success=True
- >= 80% dos campos esperados extraidos
- Execucao total < 60s (120s para AI)
- Cleanup sem erros

### Geral:
- >= 90% scrapers aprovados (20/22)
- Nenhum scraper com erro critico de import
- Documentacao atualizada

---

## Ordem de Execucao

1. **Fundamentus** (referencia - ja validado)
2. **BCB** (API simples)
3. **StatusInvest, Investsite** (publicos)
4. **GoogleFinance, Griffin, CoinMarketCap** (publicos)
5. **GoogleNews, Bloomberg** (publicos)
6. **TradingView, Investidor10** (OAuth)
7. **Valor, Exame, InfoMoney, Estadao, InvestingNews** (OAuth)
8. **ChatGPT, Gemini, DeepSeek, Claude, Grok** (OAuth + complexo)
9. **OpcoesNet** (credenciais especificas)

---

**Proxima acao:** Executar validacao do Grupo 1 (Fundamentus) como baseline
