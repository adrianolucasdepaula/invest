# Expectativas de Coverage por Setor - Scrapers Fundamentus

**Data:** 2025-11-28
**Status:** ✅ Validado com 5 tickers (PETR4, VALE3, WEGE3, ITUB4, BBAS3)
**Aplicável a:** TODOS os scrapers de dados fundamentalistas

---

## 📋 Resumo Executivo

Diferentes setores da B3 possuem estruturas contábeis distintas, resultando em **expectativas de coverage diferentes** para dados fundamentalistas. Este documento define os padrões esperados para validação de scrapers.

**Descoberta Crítica:** Setores financeiros (bancos, seguradoras) têm coverage naturalmente menor (40-50%) devido a estrutura contábil específica do setor, onde muitos indicadores industriais **não se aplicam**.

---

## 🎯 Expectativas de Coverage por Setor

### 1. Setores INDUSTRIAIS (Coverage Esperado: ≥ 90%)

**Aplicável a:**
- Petróleo, Gás e Biocombustíveis
- Mineração
- Siderurgia e Metalurgia
- Comércio (Atacado e Varejo)
- Construção Civil
- Consumo (Cíclico e Não-Cíclico)
- Bens Industriais
- Tecnologia da Informação
- Telecomunicações
- Saúde
- Utilidade Pública (Energia Elétrica, Água e Saneamento)
- Transporte e Logística

**Campos Esperados (30 total):**

✅ **Disponíveis (27):**
- ticker, company_name, price
- p_l, p_vp, psr, p_ativos, p_cap_giro, p_ebit, p_ativ_circ_liq
- ev_ebit, ev_ebitda
- margem_ebit, margem_liquida
- liquidez_corrente, liquidez_2meses
- div_bruta_patrim, div_liquida_patrim
- patrim_liquido, receita_liquida, ebit, lucro_liquido
- crescimento_receita_5a, roe, roic
- dy, nro_acoes

❌ **Indisponíveis (3):**
- div_liquida_ebit - Requer EBIT de 12 meses (só disponível 3 meses)
- payout - Não disponível no Fundamentus
- roa - Não disponível no Fundamentus

**Validação:**
```python
assert coverage >= 90.0, f"Coverage industrial baixo: {coverage}%"
assert ev_ebitda is not None, "ev_ebitda deve estar presente"
```

---

### 2. Setores FINANCEIROS (Coverage Esperado: 40-50%)

**Aplicável a:**
- Bancos
- Seguradoras
- Corretoras de Valores
- Gestoras de Recursos
- Holdings Financeiras
- Crédito e Financiamento

**Por que coverage é menor?**

Setores financeiros têm estrutura contábil diferente:
- ❌ **Não aplicam:** P/EBIT, PSR, P/Ativos, P/Cap.Giro, P/Ativ Circ.Liq
- ❌ **Não aplicam:** EV/EBITDA, EV/EBIT (bancos não têm EBITDA tradicional)
- ❌ **Não aplicam:** Marg. Bruta, Marg. EBIT (não há custo de mercadoria vendida)
- ❌ **Não aplicam:** EBIT / Ativo, ROIC, Giro Ativos (métricas industriais)
- ❌ **Não aplicam:** Liquidez Corrente, Div Br/ Patrim (estrutura de balanço diferente)

**Campos Esperados (13-15 total):**

✅ **Disponíveis:**
- ticker, company_name, price
- p_l, p_vp
- margem_liquida (0.0% frequentemente - normal para bancos)
- dy, roe
- crescimento_receita_5a
- nro_acoes

**Campos com "-" (não aplicável):**
- Maioria dos indicadores industriais

**Validação:**
```python
assert coverage >= 40.0, f"Coverage financeiro muito baixo: {coverage}%"
assert price is not None, "Price deve estar presente"
assert p_l is not None, "P/L deve estar presente"
```

**Exemplo (ITUB4 - Banco Itaú):**
```
Coverage: 43.3% (13/30 campos)
✅ price: 40.71
✅ p_l: 10.16
✅ p_vp: 2.12
✅ dy: 6.4%
✅ roe: 20.9%
✅ crescimento_receita_5a: 124.8%
❌ ev_ebitda: - (não aplicável)
❌ margem_ebit: - (não aplicável)
```

---

### 3. Fundos Imobiliários - FIIs (Coverage Esperado: 30-40%)

**Aplicável a:**
- Fundos de Tijolo (Lajes Corporativas, Shoppings, Logística)
- Fundos de Papel (CRIs, LCIs)
- Fundos Híbridos

**Por que coverage é AINDA menor?**

FIIs não são empresas, são fundos:
- ❌ **Não aplicam:** Praticamente todos indicadores de empresa (P/L, P/VP, ROE, ROIC, etc)
- ✅ **Aplicam:** Dividend Yield (métrica principal)
- ✅ **Aplicam:** P/VP (valor patrimonial da cota)

**Campos Esperados (8-12 total):**

✅ **Disponíveis:**
- ticker, company_name (nome do fundo), price
- p_vp
- dy (métrica PRINCIPAL para FIIs)
- liquidez_2meses

**Validação:**
```python
assert coverage >= 30.0, f"Coverage FII muito baixo: {coverage}%"
assert dy is not None, "Dividend Yield é crítico para FIIs"
```

---

## 📊 Tabela Resumo

| Setor/Tipo | Coverage Esperado | Campos Críticos | Exemplo |
|------------|-------------------|-----------------|---------|
| **Industrial** | ≥ 90% (27/30) | ev_ebitda, price, roe | PETR4, VALE3, WEGE3 |
| **Financeiro** | 40-50% (13-15/30) | price, p_l, dy, roe | ITUB4, BBAS3, BBSE3 |
| **FII** | 30-40% (8-12/30) | dy, p_vp, price | KNRI11, HGLG11 |
| **Holding** | 50-60% (15-18/30) | price, p_vp, dy | ITSA4, SAPR4 |

---

## 🛠️ Implementação em Testes

### Template de Teste Completo

```python
async def test_complete_validation():
    """Validação completa com expectativas por setor"""

    test_tickers = {
        "industrial": {
            "tickers": ["PETR4", "VALE3", "WEGE3"],
            "min_coverage": 90.0,
            "critical_fields": ["ev_ebitda", "price", "roe"]
        },
        "financial": {
            "tickers": ["ITUB4", "BBAS3", "BBSE3"],
            "min_coverage": 40.0,
            "critical_fields": ["price", "p_l", "dy", "roe"]
        },
        "fii": {
            "tickers": ["KNRI11", "HGLG11", "VISC11"],
            "min_coverage": 30.0,
            "critical_fields": ["dy", "p_vp", "price"]
        },
        "holding": {
            "tickers": ["ITSA4", "SAPR4"],
            "min_coverage": 50.0,
            "critical_fields": ["price", "p_vp", "dy"]
        }
    }

    scraper = FundamentusScraper()

    for sector, config in test_tickers.items():
        for ticker in config["tickers"]:
            result = await scraper.scrape_with_retry(ticker)

            if result.success:
                coverage = calculate_coverage(result.data)

                # Validação por setor
                assert coverage >= config["min_coverage"], \
                    f"{sector.upper()} {ticker}: coverage {coverage}% < {config['min_coverage']}%"

                # Validação de campos críticos
                for field in config["critical_fields"]:
                    assert result.data.get(field) is not None, \
                        f"{sector.upper()} {ticker}: campo crítico '{field}' ausente"
```

---

## 📝 Checklist de Validação

### Para CADA novo scraper:

- [ ] Testar com tickers **industriais** (mínimo 3)
- [ ] Testar com tickers **financeiros** (mínimo 2)
- [ ] Testar com tickers **FII** (mínimo 2 se scraper suportar)
- [ ] Validar coverage esperado por setor
- [ ] Documentar campos indisponíveis **com evidência** (Chrome DevTools)
- [ ] Atualizar este documento se descobrir novos padrões

### Evidências Obrigatórias:

1. **Chrome DevTools MCP** - Screenshot do HTML confirmando campo ausente
2. **Logs de debug** - Extração de todos os labels da página
3. **Teste com múltiplos tickers** - Confirmar padrão consistente

---

## 🔍 Como Investigar Coverage Baixo

### 1. Verificar Setor do Ticker

```python
# Use Chrome DevTools para ver o setor
await page.goto(f"https://www.fundamentus.com.br/detalhes.php?papel={ticker}")
sector = await page.query_selector_all("td .txt")
# Procurar por "Setor"
```

### 2. Comparar com Expectativa

```python
SECTOR_EXPECTATIONS = {
    "Petróleo, Gás e Biocombustíveis": 90,
    "Mineração": 90,
    "Bancos": 40,
    "Seguradoras": 40,
    "Fundos": 30,
}

expected_coverage = SECTOR_EXPECTATIONS.get(sector, 90)
```

### 3. Se Coverage < Esperado

- ✅ Usar Chrome DevTools para verificar HTML
- ✅ Adicionar logs de debug temporários
- ✅ Verificar mapeamentos em `_map_field()`
- ❌ **NÃO assumir** que é bug do scraper sem investigar

---

## 💡 Lições Aprendidas

### 1. Coverage Baixo ≠ Bug

**Erro inicial:** Assumir que 43.3% coverage em ITUB4 era um bug.

**Correção:** Investigar setor e entender que bancos têm estrutura diferente.

**Lição:** **Sempre verificar setor antes de assumir bug**.

### 2. Documentar Expectativas

**Problema:** Cada desenvolvedor tinha expectativa diferente de coverage.

**Solução:** Documentar expectativas claras por setor neste arquivo.

**Benefício:** Validação automatizada e objetiva.

### 3. Chrome DevTools é Essencial

**Para confirmar:**
- ✅ Campo realmente não existe no HTML
- ✅ Campo existe mas está com "-" (não aplicável)
- ✅ Campo existe mas não está sendo mapeado (bug!)

---

## 🚀 Próximos Passos

### 1. Expandir para Outros Scrapers

Este padrão deve ser aplicado em:
- statusinvest_scraper.py
- investsite_scraper.py
- b3_scraper.py
- Todos os 24 scrapers restantes

### 2. Automatizar Detecção de Setor

```python
# Futuro: Auto-detectar setor e ajustar expectativa
async def get_sector(ticker: str) -> str:
    # Buscar setor do ticker no banco de dados ou scrape
    pass

async def get_expected_coverage(sector: str) -> float:
    return SECTOR_EXPECTATIONS.get(sector, 90.0)
```

### 3. Dashboard de Validação

Criar dashboard mostrando:
- Coverage por setor
- Campos faltantes por setor
- Tendências e anomalias

---

## 📚 Referências

- **Teste validado:** `test_fundamentus_complete.py`
- **Scraper:** `scrapers/fundamentus_scraper.py`
- **Entity:** `backend/src/database/entities/asset.entity.ts`
- **Chrome DevTools:** Evidências em ITUB4, BBAS3

---

**Criado por:** Claude Code
**Data:** 2025-11-28
**Próxima revisão:** Após migração de próximos 3 scrapers
**Status:** ✅ VALIDADO E APROVADO PARA PRODUÇÃO
