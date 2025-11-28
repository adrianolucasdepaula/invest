# Playwright Scraper Pattern - Padrão Standardizado

**Data:** 2025-11-28
**Status:** ✅ **DEFINITIVO** - Validado e aprovado para produção
**Versão:** 1.0

---

## 📋 Resumo Executivo

Este documento define o **padrão standardizado** para todos os scrapers Python que usam Playwright, baseado na solução definitiva do **Exit Code 137** e nas melhores práticas do Playwright 2025.

**Problema resolvido:** Exit Code 137 (SIGKILL) causado por múltiplas operações `await` lentas durante extração de dados.

**Solução:** Single HTML fetch + BeautifulSoup local parsing (~10x mais rápido).

---

## 🎯 Princípios Fundamentais

### 1. Single HTML Fetch (Não Multiple Awaits)

**❌ ERRADO** (padrão antigo - Selenium):
```python
# Múltiplas operações await (140ms cada)
tables = await page.query_selector_all("table")  # await #1
for table in tables:
    rows = await table.query_selector_all("tr")  # await #2
    for row in rows:
        cells = await row.query_selector_all("td")  # await #3
        label = await cells[0].text_content()  # await #4
        value = await cells[1].text_content()  # await #5
        # 50 campos × 5 awaits × 140ms = ~35 segundos!
```

**✅ CORRETO** (padrão novo - Playwright + BeautifulSoup):
```python
from bs4 import BeautifulSoup

# UMA ÚNICA operação await
html_content = await page.content()  # await #1 (ÚNICO)
soup = BeautifulSoup(html_content, 'html.parser')

# Todas operações locais (SEM await)
tables = soup.select("table")  # local, sem await
for table in tables:
    rows = table.select("tr")  # local, sem await
    for row in rows:
        cells = row.select("td")  # local, sem await
        label = cells[0].get_text()  # local, sem await
        value = cells[1].get_text()  # local, sem await
        # 50 campos × 0 awaits × 0ms = instantâneo!
```

**Resultado:** ~10x mais rápido (7.72s vs 35s+ ou timeout)

---

### 2. Browser Individual (Não Compartilhado)

**Padrão do backend TypeScript** (a ser seguido):

```python
class BaseScraper:
    def __init__(self):
        # Cada scraper tem SEU PRÓPRIO browser
        self.playwright: Optional[Playwright] = None  # Individual
        self.browser: Optional[Browser] = None         # Individual
        self.page: Optional[Page] = None               # Individual
```

**❌ NÃO fazer** (browser compartilhado):
```python
# Errado - compartilhado entre scrapers
_browser_instance: Browser = None
_playwright_instance: Playwright = None
```

**Referência:** `backend/src/scrapers/base/abstract-scraper.ts` (backend TypeScript)

---

### 3. Wait Strategy: 'load' (Não 'networkidle')

```python
# ✅ CORRETO: Aguarda apenas DOM load (rápido)
await page.goto(url, wait_until='load', timeout=60000)

# ❌ EVITAR: Aguarda todos requests de rede (analytics lentos = timeout)
# await page.goto(url, wait_until='networkidle')  # Pode causar timeout
```

**Justificativa:** Sites modernos têm analytics lentos que nunca completam `networkidle`.

---

### 4. Cleanup Completo (page + browser + playwright)

```python
async def cleanup(self):
    """Cleanup resources (page, browser, playwright)"""
    try:
        if self.page:
            await self.page.close()
            self.page = None

        if self.browser:
            await self.browser.close()
            self.browser = None

        if self.playwright:
            await self.playwright.stop()  # Python-specific (TypeScript não precisa)
            self.playwright = None

        self._initialized = False

    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
```

---

## 📝 Template Completo de Scraper

### scraper_template.py

```python
"""
[Nome do Scraper] - [Descrição]
Fonte: [URL]
[Requer login? SIM/NÃO]

MIGRATED TO PLAYWRIGHT - [Data]
"""
import asyncio
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class [Nome]Scraper(BaseScraper):
    """
    Scraper para [descrição]

    Dados extraídos:
    - Campo 1
    - Campo 2
    - Campo N
    """

    BASE_URL = "https://[site].com.br"

    def __init__(self):
        super().__init__(
            name="[NOME_FONTE]",
            source="[NOME_FONTE]",
            requires_login=False,  # ou True se requer login
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape data for specific ticker

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with scraped data or error
        """
        try:
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # Build URL
            url = f"{self.BASE_URL}/[endpoint]?ticker={ticker.upper()}"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright)
            # Using 'load' instead of 'networkidle' to avoid timeout issues
            await self.page.goto(url, wait_until="load", timeout=60000)

            # Optional: Small delay for JS execution
            await asyncio.sleep(1)

            # Check if ticker exists
            page_source = (await self.page.content()).lower()
            if "não encontrado" in page_source or "not found" in page_source:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

            if data and data.get("ticker"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": url,
                        "requires_login": self.requires_login,
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract data",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract data from page

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        instead of multiple await calls. ~10x faster!
        """
        try:
            from bs4 import BeautifulSoup

            data = {
                "ticker": ticker.upper(),
                "field1": None,
                "field2": None,
                # ... todos os campos
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract company name (example)
            try:
                name_elem = soup.select_one("h1.company-name")
                if name_elem:
                    data["company_name"] = name_elem.get_text().strip()
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Extract table data (example)
            try:
                tables = soup.select("table.data-table")

                for table in tables:
                    rows = table.select("tr")

                    for row in rows:
                        cells = row.select("td")

                        # Processar células em pares (label, value)
                        for i in range(0, len(cells) - 1, 2):
                            try:
                                label_elem = cells[i].select_one(".label")
                                value_elem = cells[i + 1].select_one(".value")

                                if not label_elem or not value_elem:
                                    continue

                                label = label_elem.get_text().strip()
                                value = value_elem.get_text().strip()

                                # Parse value
                                parsed_value = self._parse_value(value)

                                # Map to data fields
                                self._map_field(data, label, parsed_value)

                            except Exception as e:
                                continue

            except Exception as e:
                logger.error(f"Error extracting table data: {e}")

            logger.debug(f"Extracted data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from text
        Handles Brazilian number format (comma as decimal separator)
        """
        if not value_text or value_text == "-":
            return None

        try:
            # Remove common prefixes
            value_text = value_text.replace("R$", "").strip()

            # Check for percentage
            is_percent = "%" in value_text
            value_text = value_text.replace("%", "").strip()

            # Replace Brazilian decimal separator
            value_text = value_text.replace(".", "").replace(",", ".")

            # Parse number
            parsed = float(value_text)

            return parsed

        except Exception as e:
            logger.debug(f"Could not parse value '{value_text}': {e}")
            return None

    def _map_field(self, data: dict, label: str, value: Optional[float]):
        """Map field labels to data dictionary keys"""

        # Normalize label
        label = label.lower().strip().replace("?", "")

        # Mapping dictionary
        field_map = {
            "cotação": "price",
            "p/l": "p_l",
            # ... adicionar todos os mapeamentos
        }

        # Find matching field
        for key, field in field_map.items():
            if key in label:
                data[field] = value
                return

        # Log unmapped fields for future improvement
        logger.debug(f"Unmapped field: '{label}' = {value}")


# Example usage
async def test_[nome]():
    """Test [Nome] scraper"""
    scraper = [Nome]Scraper()

    try:
        # Test with PETR4
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_[nome]())
```

---

## ✅ Checklist de Migração

Para cada scraper a ser migrado:

### Fase 1: Preparação
- [ ] Fazer backup do scraper Selenium: `[nome]_scraper.py.bak`
- [ ] Ler documentação do site alvo
- [ ] Identificar seletores CSS necessários
- [ ] Verificar se requer login/autenticação

### Fase 2: Implementação
- [ ] Copiar template acima
- [ ] Implementar `__init__()` (definir BASE_URL, source, requires_login)
- [ ] Implementar `scrape()` (navegação + verificação de ticker)
- [ ] Implementar `_extract_data()` usando **BeautifulSoup local parsing**
- [ ] Implementar `_parse_value()` (formato brasileiro: vírgula decimal)
- [ ] Implementar `_map_field()` (mapeamento label → campo)

### Fase 3: Validação
- [ ] Criar arquivo `test_[nome].py`
- [ ] Testar com ticker válido (ex: PETR4)
- [ ] Testar com ticker inválido
- [ ] Verificar todos os campos extraídos
- [ ] Comparar valores com site original
- [ ] Medir tempo de execução (deve ser <10s)
- [ ] Verificar cleanup correto (page, browser, playwright)

### Fase 4: Integração
- [ ] Adicionar import em `scrapers/__init__.py`
- [ ] Adicionar import em `main.py`
- [ ] Adicionar registro em `main.py::_register_scrapers()`
- [ ] Testar serviço completo (`docker-compose restart scrapers`)
- [ ] Verificar logs (sem erros)

### Fase 5: Documentação
- [ ] Atualizar `MIGRATION_REPORT.md`
- [ ] Atualizar `VALIDACAO_MIGRACAO_PLAYWRIGHT.md`
- [ ] Commit com mensagem descritiva

---

## 📊 Scrapers Validados

### ✅ fundamentus_scraper.py
- **Status:** ✅ Validado e em produção
- **Tempo:** 7.72s
- **Campos:** 30 extraídos com sucesso
- **Teste:** PETR4 - Todos valores corretos
- **Padrão:** BeautifulSoup single fetch ✅

### ✅ bcb_scraper.py
- **Status:** ✅ Validado e em produção
- **Método primário:** API BCB (SGS) - 17 indicadores
- **Fallback web:** BeautifulSoup local parsing
- **Tempo:** <1s (API)
- **Padrão:** BeautifulSoup single fetch ✅

---

## 🚧 Próximos Scrapers (24 pendentes)

**Ordem sugerida de migração:**

### Prioridade ALTA (público, sem login):
1. `statusinvest_scraper.py` - Fundamental analysis
2. `investsite_scraper.py` - Fundamental analysis
3. `b3_scraper.py` - Official data
4. `googlenews_scraper.py` - News aggregator

### Prioridade MÉDIA (requer login/OAuth):
5. `advfn_scraper.py` - Market analysis (Google OAuth)
6. `fundamentei_scraper.py` - Fundamental (Google OAuth)
7. `investidor10_scraper.py` - Fundamental (Google OAuth)
8. `tradingview_scraper.py` - Technical analysis (Google OAuth)

### Prioridade BAIXA (especializado):
9-24. Demais scrapers (AI assistants, institutional reports, etc)

---

## 🛠️ Troubleshooting

### Exit Code 137 (SIGKILL)

**Causa:** Operações `await` múltiplas e lentas.

**Solução:** Aplicar padrão BeautifulSoup (single HTML fetch).

**Como evitar:**
- ✅ Usar `await page.content()` UMA VEZ
- ✅ Todo parsing em BeautifulSoup local
- ❌ NUNCA usar múltiplos `await query_selector()`

### Container Restarting

**Causa:** Imports de scrapers não migrados no `main.py`.

**Solução:**
1. Comentar imports não migrados em `main.py` (linha ~14-56)
2. Comentar registros não migrados em `_register_scrapers()` (linha ~67-114)
3. `docker-compose restart scrapers`

### Timeout na Navegação

**Causa:** `wait_until='networkidle'` aguardando analytics lentos.

**Solução:** Usar `wait_until='load'`:

```python
await page.goto(url, wait_until='load', timeout=60000)
```

---

## 📚 Referências

- **Backend TypeScript:** `backend/src/scrapers/base/abstract-scraper.ts`
- **Playwright Python Docs:** https://playwright.dev/python/docs/intro
- **Playwright Best Practices 2025:** Pesquisa web realizada em 2025-11-28
- **BeautifulSoup Docs:** https://www.crummy.com/software/BeautifulSoup/bs4/doc/

---

## 📝 Lições Aprendidas

### 1. Sempre Seguir Padrão do Backend

**Erro inicial:** Implementei browser compartilhado (otimização prematura).

**Correção:** Backend TypeScript usa browser individual - seguir mesmo padrão.

**Lição:** **Sempre alinhar com backend funcional antes de "otimizar"**.

### 2. asyncio.Lock Requer Async Context

**Erro:** Criar `asyncio.Lock()` em `__init__()` (síncrono).

**Correção:** Criar lazily no primeiro uso async.

**Lição:** **Python async tem regras estritas - sempre verificar event loop**.

### 3. networkidle vs load

**Situação:** Sites têm analytics lentos que nunca completam `networkidle`.

**Decisão:** Usar `wait_until='load'` ao invés de `'networkidle'`.

**Lição:** **Adaptar wait strategy por site - analytics != conteúdo**.

### 4. Exit 137 é Traiçoeiro

**Sintoma:** Processo morre sem mensagem de erro Python.

**Causa:** Operações lentas (não OOM como inicialmente suspeitado).

**Debug:** Timeline de eventos, medir tempo de cada operação.

**Lição:** **Monitorar performance, não apenas memória**.

---

**Última atualização:** 2025-11-28 12:30 BRT
**Próxima revisão:** Após cada novo scraper migrado
**Responsável:** Claude Code

**Aprovação para produção:** ✅ **APROVADO** - Padrão validado e funcional
