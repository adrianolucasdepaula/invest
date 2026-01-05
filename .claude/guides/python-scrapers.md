# Python Scrapers Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Padrões e arquitetura para scrapers Python com Playwright

---

## Overview

Os scrapers Python são responsáveis por coletar dados financeiros de múltiplas fontes externas.

**Framework:** Playwright (migrado de Selenium em 2025-11-28)
**Localização:** `backend/python-scrapers/`
**Status:** 2 scrapers ativos, 24 aguardando migração

---

## Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão |
|------------|-----------|--------|
| Automation | Playwright | Latest |
| Parsing | BeautifulSoup4 | 4.x |
| HTTP Client | httpx | Latest |
| Logging | Loguru | Latest |
| Orchestration | Docker Compose | 3.8 |

### Scrapers Ativos (Migrados)

1. **fundamentus_scraper.py** - Fundamentus.com.br
2. **bcb_scraper.py** - Banco Central do Brasil

### Scrapers Aguardando Migração

24 scrapers Selenium legacy aguardando conversão para Playwright pattern.

---

## Padrão Obrigatório: BeautifulSoup Single Fetch

### Problema do Padrão Antigo (Selenium)

```python
# ❌ NUNCA FAZER: Múltiplos await operations
tables = await page.query_selector_all("table")  # await #1
for table in tables:
    rows = await table.query_selector_all("tr")  # await #2, #3, #4...
    for row in rows:
        cells = await row.query_selector_all("td")  # await #5, #6, #7...
        # ... N awaits = MUITO LENTO
```

**Problemas:**

- ⚠️ Lento (~10x mais lento que single fetch)
- ⚠️ Consome muita memória (cada await aloca)
- ⚠️ Pode causar **Exit Code 137** (OOM kill)
- ⚠️ Timeout em páginas grandes

### Solução: Single HTML Fetch + BeautifulSoup

```python
from bs4 import BeautifulSoup

# ✅ SEMPRE FAZER: Single fetch + parsing local
html_content = await page.content()  # await #1 (ÚNICO)
soup = BeautifulSoup(html_content, 'html.parser')

# Todas operações locais (instantâneas)
tables = soup.select("table")  # local
for table in tables:
    rows = table.select("tr")  # local
    for row in rows:
        cells = row.select("td")  # local
        text = cell.get_text(strip=True)  # local
```

**Benefícios:**

- ✅ ~10x mais rápido
- ✅ Memória constante (single HTML string)
- ✅ Sem risco de Exit 137
- ✅ Mais simples de debugar

---

## Regras Críticas

### 1. Browser Individual (Não Compartilhado)

**Cada scraper DEVE ter:**

```python
class MyScraper:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None

    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
```

**Por quê?**

- ❌ Browsers compartilhados causam race conditions
- ❌ Cleanup incompleto vaza memória
- ✅ Context manager garante cleanup automático

### 2. Wait Strategy

**Usar `wait_until='load'` (padrão):**

```python
# ✅ CORRETO: Esperar DOM load (rápido)
await page.goto(url, wait_until='load')

# ❌ EVITAR: Esperar network idle (lento)
await page.goto(url, wait_until='networkidle')  # Analytics lentos = timeout
```

**Por quê?**

- `networkidle` espera TODAS requests terminarem
- Analytics (Google, Facebook) podem demorar 30s+
- `load` espera apenas HTML + CSS + JS inicial (suficiente)

### 3. Cleanup Completo

**Ordem obrigatória:**

```python
try:
    # ... scraping
finally:
    if self.page:
        await self.page.close()  # 1º: Page
    if self.browser:
        await self.browser.close()  # 2º: Browser
    if self.playwright:
        await self.playwright.stop()  # 3º: Playwright
```

**NUNCA esquecer `finally`** - garante cleanup mesmo com exceções.

### 4. Performance Target

**Meta:** < 10s por scrape

**Benchmark:**

| Scraper | Target | Atual |
|---------|--------|-------|
| fundamentus | < 10s | ~5s ✅ |
| bcb | < 10s | ~7s ✅ |

**Se scraper > 10s:**

1. Verificar múltiplos `await` (usar BeautifulSoup pattern)
2. Verificar `wait_until='networkidle'` (mudar para `'load'`)
3. Profiling com `time.time()`:

```python
import time

start = time.time()
html = await page.content()
logger.info(f"Fetch took {time.time() - start:.2f}s")

start = time.time()
soup = BeautifulSoup(html, 'html.parser')
data = self.parse(soup)
logger.info(f"Parse took {time.time() - start:.2f}s")
```

---

## Template de Scraper (Padrão Obrigatório)

```python
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from loguru import logger
from typing import List, Dict
import asyncio

class MyScraperV2:
    """
    Scraper para [FONTE]

    Pattern: Playwright + BeautifulSoup Single Fetch
    Migrado de: Selenium (2025-12-21)
    """

    BASE_URL = "https://example.com"

    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None

    async def __aenter__(self):
        """Context manager: setup"""
        logger.info("Initializing Playwright...")
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        self.page = await self.browser.new_page()
        logger.info("Playwright ready")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager: cleanup"""
        logger.info("Cleaning up resources...")
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Cleanup complete")

    async def scrape(self, ticker: str) -> Dict:
        """
        Scrape data for ticker

        Args:
            ticker: Asset ticker (ex: PETR4)

        Returns:
            Dict with scraped data

        Raises:
            ScraperException: If scraping fails
        """
        logger.info(f"Scraping {ticker}...")

        try:
            # 1. Navigate
            url = f"{self.BASE_URL}/detalhes.php?papel={ticker}"
            await self.page.goto(url, wait_until='load')

            # 2. Single HTML fetch (CRÍTICO)
            html_content = await self.page.content()

            # 3. Parse com BeautifulSoup (local)
            soup = BeautifulSoup(html_content, 'html.parser')

            # 4. Extract data
            data = self._parse_data(soup, ticker)

            logger.info(f"✅ Scraped {ticker} successfully")
            return data

        except Exception as e:
            logger.error(f"❌ Failed to scrape {ticker}: {str(e)}")
            raise ScraperException(f"Scraping failed: {str(e)}") from e

    def _parse_data(self, soup: BeautifulSoup, ticker: str) -> Dict:
        """Parse data from soup (local, no await)"""
        data = {'ticker': ticker}

        # Exemplo: extrair tabela de fundamentos
        tables = soup.select('table.w728')
        if not tables:
            raise ValueError("Tabela de fundamentos não encontrada")

        for table in tables:
            rows = table.select('tr')
            for row in rows:
                cells = row.select('td')
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    data[key] = value

        return data


async def main():
    """Test scraper"""
    async with MyScraperV2() as scraper:
        result = await scraper.scrape('PETR4')
        logger.info(f"Result: {result}")


if __name__ == '__main__':
    asyncio.run(main())
```

---

## Arquivos Críticos de Referência

### 1. PLAYWRIGHT_SCRAPER_PATTERN.md

**Localização:** `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md`

**Conteúdo:**

- Template completo de scraper
- Padrão BeautifulSoup Single Fetch
- Best practices
- Anti-patterns

**LEITURA OBRIGATÓRIA** antes de criar ou migrar scraper.

### 2. VALIDACAO_MIGRACAO_PLAYWRIGHT.md

**Localização:** `backend/python-scrapers/VALIDACAO_MIGRACAO_PLAYWRIGHT.md`

**Conteúdo:**

- Relatório de validação da migração Selenium → Playwright
- Performance benchmarks
- Evidências de sucesso
- Lições aprendidas

### 3. ERROR_137_ANALYSIS.md

**Localização:** `backend/python-scrapers/ERROR_137_ANALYSIS.md`

**Conteúdo:**

- Análise técnica do Exit Code 137 (OOM kill)
- Root cause: múltiplos `await` operations
- Solução: BeautifulSoup Single Fetch
- Prevenção

### 4. base_scraper.py

**Localização:** `backend/python-scrapers/base_scraper.py`

**Conteúdo:**

- Classe base abstrata para scrapers
- Context manager implementation
- Logging estruturado
- Error handling

---

## Quando Consultar Cada Arquivo

| Situação | Arquivo |
|----------|---------|
| Criar novo scraper | PLAYWRIGHT_SCRAPER_PATTERN.md |
| Migrar scraper Selenium | PLAYWRIGHT_SCRAPER_PATTERN.md |
| Erro Exit 137 | ERROR_137_ANALYSIS.md |
| Scraper lento (>10s) | VALIDACAO_MIGRACAO_PLAYWRIGHT.md |
| Container restarting | ERROR_137_ANALYSIS.md |
| Herdar de base class | base_scraper.py |

---

## Testing

### Test Individual Scraper

```bash
# Dentro do container
docker exec invest_scrapers python test_fundamentus.py
docker exec invest_scrapers python test_bcb.py

# Com log detalhado
docker exec invest_scrapers python -m pytest scrapers/test_fundamentus.py -v
```

### Check Container Status

```bash
# Logs em tempo real
docker logs invest_scrapers --tail 50 -f

# Status do container
docker ps | grep scrapers

# Restart se necessário
docker-compose restart scrapers
```

### Integration Test

```bash
# Testar scraping end-to-end
curl http://localhost:8000/api/scrape/PETR4?source=fundamentus
```

---

## Logging Estruturado

### Usar Loguru (Obrigatório)

```python
from loguru import logger

# ✅ CORRETO: Loguru estruturado
logger.info(f"Scraping {ticker} from {source}")
logger.warning(f"Slow response: {elapsed}ms")
logger.error(f"Failed to scrape {ticker}: {str(e)}")

# ❌ ERRADO: print() em produção
print(f"Scraping {ticker}")  # NÃO FAZER
```

### Log Levels

| Level | Uso |
|-------|-----|
| `debug` | Detalhes de parsing, HTML snippets |
| `info` | Scraping started/completed, duração |
| `warning` | Dados faltantes, slow response, outliers |
| `error` | Exceções, timeouts, falhas |

### Exemplo Completo

```python
logger.info(f"Scraping started: {ticker}")

try:
    start = time.time()
    data = await self.scrape(ticker)
    elapsed = (time.time() - start) * 1000

    logger.info(f"Scraping completed: {ticker} in {elapsed:.0f}ms")

    if elapsed > 10000:
        logger.warning(f"Slow scrape: {ticker} took {elapsed:.0f}ms")

    return data

except Exception as e:
    logger.error(f"Scraping failed: {ticker} - {str(e)}")
    raise
```

---

## Error Handling

### Custom Exception

```python
class ScraperException(Exception):
    """Base exception for scrapers"""
    def __init__(self, message: str, source: str = None, ticker: str = None):
        super().__init__(message)
        self.source = source
        self.ticker = ticker
```

### Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

class MyScraperV2:
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def scrape(self, ticker: str) -> Dict:
        # ... scraping logic
```

---

## Docker Integration

### Dockerfile

```dockerfile
# backend/python-scrapers/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Playwright browsers
RUN pip install playwright && \
    playwright install chromium && \
    playwright install-deps

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy source
COPY . .

CMD ["python", "main.py"]
```

### docker-compose.yml

```yaml
services:
  scrapers:
    build: ./backend/python-scrapers
    container_name: invest_scrapers
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend/python-scrapers:/app
    restart: unless-stopped
```

---

## Migration Checklist

Ao migrar scraper Selenium → Playwright:

- [ ] Ler PLAYWRIGHT_SCRAPER_PATTERN.md
- [ ] Copiar template de base_scraper.py
- [ ] Implementar context manager (`__aenter__`, `__aexit__`)
- [ ] Mudar para BeautifulSoup Single Fetch
- [ ] Usar `wait_until='load'` (não networkidle)
- [ ] Adicionar logging estruturado (Loguru)
- [ ] Testar performance (< 10s)
- [ ] Validar cleanup completo (sem memory leaks)
- [ ] Criar test file (test_*.py)
- [ ] Atualizar main.py imports
- [ ] Documentar em VALIDACAO_MIGRACAO_PLAYWRIGHT.md

---

## Best Practices

### ✅ DO

1. **Sempre usar BeautifulSoup Single Fetch**
2. **Cleanup completo com finally**
3. **Logging estruturado com Loguru**
4. **Target < 10s por scrape**
5. **Context manager para resource management**
6. **Retry logic para falhas transitórias**

### ❌ DON'T

1. **Múltiplos await operations em loop**
2. **wait_until='networkidle'**
3. **print() em produção**
4. **Compartilhar browser entre scrapers**
5. **Esquecer cleanup (memory leaks)**
6. **Hardcoded timeouts sem retry**

---

## Fontes

- `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md`
- `backend/python-scrapers/VALIDACAO_MIGRACAO_PLAYWRIGHT.md`
- `backend/python-scrapers/ERROR_137_ANALYSIS.md`
- [Playwright for Python](https://playwright.dev/python/)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
