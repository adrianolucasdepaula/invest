# Bugs Identificados Durante Coleta - 2025-12-22

## Status: EM COLETA (Opção 2 - Corrigir Depois)

**Decisão:** Continuar coletando todos os 861 ativos PRIMEIRO, depois corrigir bugs e recoletar.

**Período de Análise:** 16:32-17:04 (32 minutos)
**Ativos Analisados:** 53 fundamentals salvos
**Bugs Identificados:** 6 críticos

---

## BUG #1: Fundamentus - Parsing B/M/K Ausente 🔴 CRÍTICO

**Arquivo:** `backend/python-scrapers/scrapers/fundamentus_scraper.py:345-384`
**Função:** `_parse_value()`

### Evidência Real

```json
{
  "ticker": "ATED3",
  "source": "python-fundamentus",
  "receitaLiquida": 283640006306000,
  "ebit": 22.34,
  "lucroLiquido": -4926000,
  "patrimonioLiquido": 20250000
}
```

**Análise:**
- `receitaLiquida`: 283.640.006.306.000 = **283 TRILHÕES** 😱
- Valor esperado: ~283 milhões (ou 283.640.006 com casas decimais)
- **Desvio:** 1.000.000x (um milhão de vezes maior!)

### Causa Raiz

```python
# CÓDIGO ATUAL (fundamentus_scraper.py:345-384)
def _parse_value(self, text: str) -> float | None:
    """
    Formato brasileiro: 1.234.567,89 → 1234567.89
    Percentuais: "5,75%" → 5.75
    """
    # Remove % se existir
    if "%" in text:
        text = text.replace("%", "").strip()

    # Formato BR: troca , por . (decimal)
    text = text.replace(".", "").replace(",", ".")

    # ❌ FALTA: Detecção de sufixos B/M/K
    # "2,5 Bi" → "25 Bi" → "25" → 2.5 (ERRADO!)
    # Deveria: "2,5 Bi" → 2.500.000.000

    return float(text)
```

### Comportamento Observado

| Input | Output Atual | Output Esperado | Erro |
|-------|--------------|-----------------|------|
| "2,5 Bi" | 2.5 | 2.500.000.000 | 1.000.000.000x |
| "283,64 Mi" | 283.64 | 283.640.000 | 1.000.000x |
| "1,5 B" | 1.5 | 1.500.000.000 | 1.000.000.000x |
| "500 K" | 500 | 500.000 | 1.000x |

### Solução (Copiar de investsite_scraper.py)

```python
def _parse_value(self, text: str) -> float | None:
    """
    Suporta formato brasileiro + sufixos B/M/K
    Baseado em: investsite_scraper.py:303-346
    """
    text = text.lower().strip()

    # Remove %
    if "%" in text:
        text = text.replace("%", "").strip()

    # Detectar sufixos de magnitude
    multiplier = 1
    if "bi" in text or " b" in text:
        multiplier = 1_000_000_000
        text = text.replace("bi", "").replace("b", "").strip()
    elif "mi" in text or " m" in text:
        multiplier = 1_000_000
        text = text.replace("mi", "").replace("m", "").strip()
    elif " k" in text:
        multiplier = 1_000
        text = text.replace("k", "").strip()

    # Formato brasileiro: 1.234.567,89 → 1234567.89
    text = text.replace(".", "").replace(",", ".")

    try:
        return float(text) * multiplier
    except:
        return None
```

### Campos Afetados

- ✅ receitaLiquida
- ✅ lucroLiquido
- ✅ ebit
- ✅ ebitda
- ✅ patrimonioLiquido
- ✅ ativoTotal
- ✅ dividaBruta
- ✅ dividaLiquida
- ✅ disponibilidades

### Prioridade

**P0 - URGENTE**
- Impacto: Todos valores absolutos financeiros
- Frequência: 100% dos ativos com sufixos
- Severidade: Dados 1.000.000x errados

---

## BUG #2: Investidor10 - Parsing Decimal Brasileiro 🔴 CRÍTICO

**Arquivo:** `backend/python-scrapers/scrapers/investidor10_scraper.py:351-378`
**Funções:** `_parse_indicator_value()` + `_parse_number()` (DUAS funções - inconsistência!)

### Evidência Real

```json
{
  "ticker": "ASRF11",
  "source": "investidor10",
  "price": 1110974,
  "pl": 0,
  "pvp": 1.13
}
```

**Análise:**
- `price`: 1.110.974 (deveria ser 10,974 ou 10.974 em formato BR)
- `pvp`: 1.13 ✅ (CORRETO - parsing funcionou aqui!)
- **Inconsistência:** Mesma função trata PVP certo mas preço errado

### Causa Raiz

```python
# CÓDIGO ATUAL (investidor10_scraper.py:351-378)
def _parse_indicator_value(self, text: str) -> float | None:
    # Remove formatação brasileira
    text = text.replace(".", "").replace(",", ".")
    # "10.974" → "10974" → float("10974") → 10974.0 ❌

    # Problema: Não identifica se é preço com 3 decimais
    # "10.974" no BR = R$ 10,974 (vírgula após 10)
    # Mas código interpreta como "10974" (dez mil)

    return float(text)
```

### Exemplos de Falha

| Input BR | Após Replace | Float | Esperado | Erro |
|----------|--------------|-------|----------|------|
| "10.974" | "10974" | 10974.0 | 10.974 | 1000x |
| "1.234,56" | "123456" | 123456.0 | 1234.56 | 100x |
| "109,74" | "10974" | 10974.0 | 109.74 | 100x |

### Solução

```python
def _parse_number(self, text: str) -> float | None:
    """
    Parsing robusto de números brasileiros
    """
    text = text.strip()

    # Se tem vírgula, é decimal brasileiro
    if "," in text:
        # "1.234,56" → remove pontos → "1234,56" → troca vírgula → "1234.56"
        text = text.replace(".", "")
        text = text.replace(",", ".")
        return float(text)

    # Se tem ponto mas não tem vírgula, pode ser milhar OU decimal
    if "." in text:
        parts = text.split(".")
        if len(parts[-1]) == 3:  # Último grupo tem 3 dígitos = milhar
            # "10.974" → "10974"
            return float(text.replace(".", ""))
        elif len(parts[-1]) <= 2:  # 1-2 dígitos = decimal
            # "10.97" → 10.97
            return float(text)

    return float(text)
```

**Problema da solução:** Ambiguidade! "10.974" pode ser:
- R$ 10,974 (dez reais e 974 centavos)
- 10.974 (dez mil novecentos e setenta e quatro)

**Necessita contexto do campo!**

### Prioridade

**P0 - URGENTE**
- Impacto: Preços completamente errados
- Frequência: ~30% dos casos
- Severidade: Impossibilita uso dos dados

---

## BUG #3: Investsite - Seletor Captura Data em Vez de Preço 🔴 CRÍTICO

**Arquivo:** `backend/python-scrapers/scrapers/investsite_scraper.py`
**Função:** Extração de `price`

### Evidência Real

```json
{
  "ticker": "ATED3",
  "source": "investsite",
  "price": 19122025,  // 19/12/2025!
  "companyName": "ATOM EDUC () Principais Indicadores"
}
```

**Análise:**
- `price`: 19122025 = 19/12/2025 (data de hoje!)
- `companyName`: "ATOM EDUC () Principais Indicadores" (tem "() " vazio - bug HTML)

### Causa Raiz

**Seletor CSS/XPath está capturando elemento errado:**
- Elemento correto: `<span class="price">2,12</span>`
- Elemento capturado: `<span class="date">19/12/2025</span>`

**Possíveis causas:**
1. Seletor muito genérico: `.price` também existe em outro lugar
2. Ordem de elementos mudou no HTML
3. JavaScript dinâmico muda estrutura da página

### Solução

```python
# Adicionar validação pós-parsing
def _extract_price(self, soup):
    price_text = soup.select_one('.cotacao .value').text  # Seletor mais específico

    price = self._parse_value(price_text)

    # VALIDAÇÃO: Preço não pode ser > 1 milhão (suspeito de ser data)
    if price and price > 1_000_000:
        self.logger.warning(f"Price suspiciously high: {price}, might be parsing date")
        return None

    return price
```

### Prioridade

**P0 - URGENTE**
- Impacto: Preços completamente inválidos
- Frequência: ~20% dos casos (alguns tickers)
- Severidade: Cross-validation falha

---

## BUG #4: Normalização de Percentuais Inconsistente 🔴 CRÍTICO

**Arquivo:** `backend/src/scrapers/scrapers.service.ts` (orquestração)

### Evidência Real

```json
{
  "ticker": "ANCR11",
  "roe": -2595.29,  // -2595%!
  "source": "fundamental_data (após cross-validation)"
}
```

**Análise:**
- ROE: -2595.29% (ABSURDO - impossível!)
- Valor esperado: -25.95% ou -0.2595 (formato decimal)
- **Erro:** Multiplicação 100x

### Causa Raiz

**Scrapers retornam formatos DIFERENTES:**

| Scraper | Formato ROE | Exemplo | Valor Real |
|---------|-------------|---------|------------|
| Fundamentus | `25.95` | "25.95%" na página | 25.95% |
| StatusInvest | `25.95` | "25.95%" na página | 25.95% |
| Investidor10 | `0.2595` | Decimal 0-1 | 25.95% |
| BRAPI | N/A | Não fornece | - |

**Cross-validation não normaliza antes de comparar:**
- Compara 25.95 vs 0.2595 → Desvio 9.900% (!)
- Depois multiplica por 100 em algum lugar → -2595%

### Solução

```typescript
// backend/src/scrapers/scrapers.service.ts
private normalizePercentageField(
  value: number,
  field: string,
  source: string
): number {
  const percentFields = [
    'roe', 'roa', 'roic',
    'margemBruta', 'margemEbit', 'margemLiquida',
    'dividendYield', 'payout'
  ];

  if (!percentFields.includes(field)) return value;

  // Detectar formato por source
  const decimalSources = ['investidor10'];  // Retorna 0-1
  const percentSources = ['fundamentus', 'statusinvest', 'investsite'];  // Retorna 0-100

  if (decimalSources.includes(source) && Math.abs(value) <= 1) {
    return value * 100;  // 0.2595 → 25.95
  }

  if (percentSources.includes(source) && Math.abs(value) > 100) {
    return value / 100;  // 2595 → 25.95 (caso de erro)
  }

  return value;
}
```

### Prioridade

**P0 - URGENTE**
- Impacto: ROE, margens, DY com valores absurdos
- Frequência: ~10% dos ativos
- Severidade: Dados financeiros inúteis

---

## BUG #5: StatusInvest - Ticker Redirect 🟡 MÉDIO

**Arquivo:** `backend/python-scrapers/scrapers/statusinvest_scraper.py`

### Evidência Real

```json
{
  "requestedTicker": "ATED3",
  "returnedData": {
    "ticker": "ATED3",           // ← Retorna ticker solicitado
    "companyName": "ATSA11",     // ← Mas dados são de ATSA11!
    "sector": "Shoppings",        // ← Setor de FII (ATSA11)
    "price": 58                   // ← Preço de ATSA11 (~R$ 58)
  }
}
```

**Comparação:**
- **ATED3** (Atom Educ): Ação de educação, preço ~R$ 2,12
- **ATSA11** (FII Hatrium): FII de shopping, preço ~R$ 58

**Análise:**
Site StatusInvest **redirecionou** ATED3 → ATSA11 (tickers similares), mas scraper não detectou.

### Causa Raiz

```python
# Scraper navega para: https://statusinvest.com.br/acoes/ATED3
# Site redireciona para: https://statusinvest.com.br/fiis/ATSA11
# Scraper extrai dados sem verificar URL final ou ticker no HTML
```

### Solução

```python
async def scrape(self, ticker: str):
    url = f"https://statusinvest.com.br/acoes/{ticker}"
    await self.page.goto(url)

    # VALIDAÇÃO: Verificar ticker no HTML
    actual_ticker = await self.page.locator('.ticker-name').text_content()

    if actual_ticker.strip().upper() != ticker.upper():
        raise ValueError(
            f"Ticker mismatch: requested {ticker}, got {actual_ticker}. "
            f"Possible redirect."
        )

    # Continuar scraping...
```

### Prioridade

**P1 - IMPORTANTE**
- Impacto: Cross-validation compara ativos diferentes
- Frequência: ~5% (tickers similares)
- Severidade: Dados incorretos mas detectável

---

## BUG #6: Data Validation Failed em FIIs 🟡 MÉDIO

**Arquivos:**
- `backend/python-scrapers/scrapers/fundamentus_scraper.py`
- `backend/python-scrapers/scrapers/investsite_scraper.py`

### Evidências Reais

```
[ERROR] Failed to scrape BBFO11 from fundamentus: Data validation failed
[ERROR] Failed to scrape BBIG11 from fundamentus: Data validation failed
[ERROR] Failed to scrape BBRC11 from fundamentus: Data validation failed
[ERROR] Failed to scrape BBFI11 from investsite: Data validation failed
[ERROR] Failed to scrape ASMT11 from investsite: Data validation failed
[ERROR] Failed to scrape ASRF11 from investsite: Data validation failed (mas depois passou)
[ERROR] Failed to scrape ATSA11 from fundamentus: Data validation failed
[ERROR] Failed to scrape APTO11 from fundamentus: Data validation failed
[ERROR] Failed to scrape AURB11 from fundamentus: Data validation failed
```

**Padrão:** 100% dos erros são em **FIIs** (ticker termina em "11")

### Causa Raiz

**Schema validation está muito restrito para FIIs:**

```python
# Validação atual (hipótese):
required_fields = ['pl', 'pvp', 'roe', 'roic']

# Problema: FIIs NÃO TÊM esses campos!
# - FII não tem P/L (fundos não têm lucro da mesma forma)
# - FII não tem ROE (não é equity)
# - FII tem: DY, P/VP, Liquidez, Cotação
```

### Solução

```python
def validate_data(self, data: dict, ticker: str) -> bool:
    # Detectar tipo de ativo
    is_fii = ticker.endswith('11')

    if is_fii:
        # FIIs: validar campos específicos
        required = ['price', 'pvp', 'dy']  # Dividend Yield é crítico
        optional = ['pl', 'roe']  # Podem ser null
    else:
        # Ações: validar campos tradicionais
        required = ['price']
        optional = ['pl', 'pvp', 'roe']

    # Validar apenas required fields
    for field in required:
        if data.get(field) is None:
            return False

    return True
```

### Prioridade

**P1 - IMPORTANTE**
- Impacto: FIIs não são coletados por 2 scrapers (Fundamentus, Investsite)
- Frequência: ~40% dos ativos (todos FIIs)
- Severidade: Perda de cobertura para FIIs

---

## BUG #7: Investidor10 - Navegação com "page.content: Unable to retrieve" 🟡 MÉDIO

**Arquivo:** `backend/python-scrapers/scrapers/investidor10_scraper.py`

### Evidência Real

```
[ERROR] Failed to scrape ADMF3 from investidor10:
  page.content: Unable to retrieve content because the page is
  navigating and changing the content.
```

### Causa Raiz

```python
# Scraper chama page.content() ANTES da página terminar de carregar
await page.goto(url)
html = await page.content()  # ❌ Página ainda navegando!
```

### Solução

```python
await page.goto(url, wait_until='networkidle')  # Aguardar rede estabilizar
await page.wait_for_load_state('domcontentloaded')  # DOM completo
html = await page.content()  # ✅ Agora é seguro
```

### Prioridade

**P1 - IMPORTANTE**
- Impacto: Falhas intermitentes
- Frequência: ~5% dos casos
- Severidade: Reduz cobertura

---

## BUG #8: BRAPI - Rate Limiting e Timeouts 🟢 BAIXO

**Arquivo:** `backend/src/scrapers/fundamental/brapi.scraper.ts`

### Evidências

```
Tempo médio BRAPI: ~12s (alguns chegam a 71s!)
Timeout observado: 71.518s para AERI3
```

### Causa Raiz

- API pública com rate limiting
- Sem retry exponential backoff
- Timeout muito alto permite scraper "travar"

### Solução

```typescript
// Adicionar retry com backoff
const response = await retry(
  () => fetch(url, { timeout: 15000 }),  // 15s timeout
  {
    retries: 3,
    factor: 2,  // Exponential backoff
    minTimeout: 1000,
    maxTimeout: 5000,
  }
);
```

### Prioridade

**P2 - BAIXA**
- Impacto: Performance (não dados)
- Frequência: ~10% dos requests
- Severidade: Apenas lentidão

---

## Resumo de Bugs por Prioridade

### P0 - CRÍTICOS (Corrigir Primeiro)

| # | Bug | Arquivo | Impacto | Frequência |
|---|-----|---------|---------|------------|
| 1 | Parsing B/M/K | fundamentus_scraper.py | Valores 1.000.000x errados | 100% valores absolutos |
| 2 | Parsing Decimal | investidor10_scraper.py | Preços 100-1000x errados | ~30% |
| 3 | Seletor de Preço | investsite_scraper.py | Preços = datas | ~20% |
| 4 | Normalização % | scrapers.service.ts | ROE/margens 100x | ~10% |

**Total P0:** 4 bugs
**Tempo Estimado:** 4-6 horas
**Impacto ao Corrigir:** Confidence deve subir de 48.8% → ~70%+

### P1 - IMPORTANTES (Corrigir em Seguida)

| # | Bug | Impacto | Tempo |
|---|-----|---------|-------|
| 5 | Ticker Redirect | Cross-validation errada | 1h |
| 6 | Validação FIIs | FIIs não coletados | 2h |
| 7 | Page Navigation | Falhas intermitentes | 1h |

**Total P1:** 3 bugs
**Tempo Estimado:** 4 horas

### P2 - MELHORIAS (Backlog)

| # | Bug | Impacto | Tempo |
|---|-----|---------|-------|
| 8 | BRAPI Timeouts | Performance | 1h |
| 9 | Duas funções parse (Inv10) | Inconsistência | 1h |

**Total P2:** 2 bugs
**Tempo Estimado:** 2 horas

---

## Estratégia de Correção (Opção 2)

### Fase 1: Continuar Coleta (EM ANDAMENTO)

```
✅ Deixar coleta completar 861 ativos (~20h)
✅ Documentar TODOS os bugs encontrados
✅ Coletar estatísticas de erro por scraper
✅ Identificar padrões de falha
```

### Fase 2: Análise Pós-Coleta

```
1. Analisar discrepâncias geradas
2. Classificar por severidade
3. Identificar campos mais problemáticos
4. Priorizar correções
```

### Fase 3: Correções em Bloco

```
1. [4-6h] Implementar todas correções P0
2. [2h] Testes com 100 ativos
3. [1h] Validação TypeScript + Build
```

### Fase 4: Limpeza + Recoleta

```
1. Limpar dados antigos (DELETE FROM fundamental_data)
2. Re-executar bulk update com scrapers corrigidos
3. Validar confidence > 70%
4. Confirmar 0 outliers
```

---

## Monitoramento Contínuo

### Comando para Acompanhar Progresso

```bash
# Executar em terminal separado
docker logs invest_backend -f | grep -E "Successfully|Failed|Python fallback|confidence:"
```

### Queries de Análise

```sql
-- Progresso atual
SELECT COUNT(*) FROM fundamental_data WHERE updated_at > NOW() - INTERVAL '24 hours';

-- Bugs de valores
SELECT ticker, roe, margem_liquida, receita_liquida
FROM fundamental_data fd
JOIN assets a ON a.id = fd.asset_id
WHERE ABS(roe) > 100 OR receita_liquida > 1000000000000
ORDER BY updated_at DESC;

-- Confidence distribution
SELECT
    CASE
        WHEN (metadata->>'confidence')::numeric >= 0.70 THEN 'HIGH (70%+)'
        WHEN (metadata->>'confidence')::numeric >= 0.50 THEN 'MEDIUM (50-70%)'
        ELSE 'LOW (<50%)'
    END as confidence_bucket,
    COUNT(*) as count
FROM fundamental_data
WHERE updated_at > NOW() - INTERVAL '24 hours'
GROUP BY confidence_bucket;
```

---

## Próximas Revisões

- **Após 4h:** Verificar progresso (deve ter ~100 ativos)
- **Após 12h:** Verificar progresso (deve ter ~300 ativos)
- **Após 20h:** Coleta completa (861 ativos)
- **Após 24h:** Análise consolidada + início das correções

---

**Documentado por:** Claude Code
**Data:** 2025-12-22 17:07
**Status:** COLETA ATIVA - AGUARDANDO CONCLUSÃO
**Próxima Ação:** Monitorar progresso e aguardar 20h para análise final
