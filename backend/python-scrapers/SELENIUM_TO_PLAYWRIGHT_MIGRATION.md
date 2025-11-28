# Selenium to Playwright Migration Guide

**Data:** 2025-11-27
**Migração:** Python Scrapers - Selenium → Playwright

---

## 📋 Mapeamento de API

### Inicialização

| Selenium | Playwright |
|----------|-----------|
| `from selenium import webdriver` | `from playwright.async_api import async_playwright` |
| `from selenium.webdriver.chrome.options import Options` | N/A (args diretos) |
| `driver = webdriver.Chrome(service=service, options=options)` | `browser = await playwright.chromium.launch(args=[...])` |
| `driver.set_page_load_timeout(30)` | `page.set_default_timeout(30000)` |
| `driver.implicitly_wait(10)` | `page.set_default_timeout(10000)` |

### Navegação

| Selenium | Playwright |
|----------|-----------|
| `driver.get(url)` | `await page.goto(url)` |
| `driver.back()` | `await page.go_back()` |
| `driver.forward()` | `await page.go_forward()` |
| `driver.refresh()` | `await page.reload()` |
| `driver.current_url` | `page.url` |
| `driver.title` | `await page.title()` |

### Seletores

| Selenium | Playwright |
|----------|-----------|
| `driver.find_element(By.ID, "id")` | `await page.query_selector("#id")` ou `page.locator("#id")` |
| `driver.find_element(By.CSS_SELECTOR, "css")` | `await page.query_selector("css")` ou `page.locator("css")` |
| `driver.find_element(By.XPATH, "xpath")` | `await page.query_selector("xpath=xpath")` |
| `driver.find_element(By.NAME, "name")` | `await page.query_selector("[name='name']")` |
| `driver.find_element(By.CLASS_NAME, "class")` | `await page.query_selector(".class")` |
| `driver.find_element(By.TAG_NAME, "tag")` | `await page.query_selector("tag")` |
| `driver.find_elements(...)` | `await page.query_selector_all(...)` ou `page.locator(...).all()` |

### Interações

| Selenium | Playwright |
|----------|-----------|
| `element.click()` | `await element.click()` |
| `element.send_keys("text")` | `await element.fill("text")` ou `await element.type("text")` |
| `element.clear()` | `await element.clear()` ou `await element.fill("")` |
| `element.submit()` | `await element.press("Enter")` |
| `element.text` | `await element.text_content()` ou `await element.inner_text()` |
| `element.get_attribute("attr")` | `await element.get_attribute("attr")` |

### Waits (Esperas)

| Selenium | Playwright |
|----------|-----------|
| `WebDriverWait(driver, 10).until(EC.presence_of_element_located(...))` | `await page.wait_for_selector("css", timeout=10000)` |
| `WebDriverWait(driver, 10).until(EC.element_to_be_clickable(...))` | `await page.wait_for_selector("css", state="visible")` |
| `WebDriverWait(driver, 10).until(EC.visibility_of_element_located(...))` | `await page.wait_for_selector("css", state="visible")` |
| `time.sleep(5)` | `await page.wait_for_timeout(5000)` ou `await asyncio.sleep(5)` |
| `EC.url_to_be(url)` | `await page.wait_for_url(url)` |
| `EC.title_contains("text")` | `await page.wait_for_function('() => document.title.includes("text")')` |

### JavaScript Execution

| Selenium | Playwright |
|----------|-----------|
| `driver.execute_script("return document.title")` | `await page.evaluate("() => document.title")` |
| `driver.execute_script("arguments[0].click()", element)` | `await page.evaluate("el => el.click()", element)` |

### Screenshots e PDFs

| Selenium | Playwright |
|----------|-----------|
| `driver.save_screenshot("file.png")` | `await page.screenshot(path="file.png")` |
| `element.screenshot("file.png")` | `await element.screenshot(path="file.png")` |
| N/A | `await page.pdf(path="file.pdf")` |

### Frames

| Selenium | Playwright |
|----------|-----------|
| `driver.switch_to.frame(frame)` | `frame = page.frame_locator("iframe")` ou `await page.frame(name="name")` |
| `driver.switch_to.default_content()` | N/A (frames são isolados) |

### Alerts e Popups

| Selenium | Playwright |
|----------|-----------|
| `alert = driver.switch_to.alert` | `page.on("dialog", lambda dialog: ...)` |
| `alert.accept()` | `await dialog.accept()` |
| `alert.dismiss()` | `await dialog.dismiss()` |
| `alert.send_keys("text")` | `await dialog.accept("text")` |

### Cookies

| Selenium | Playwright |
|----------|-----------|
| `driver.get_cookies()` | `await context.cookies()` |
| `driver.add_cookie({"name": "...", "value": "..."})` | `await context.add_cookies([{"name": "...", "value": "..."}])` |
| `driver.delete_cookie("name")` | `await context.clear_cookies()` |

### Window Management

| Selenium | Playwright |
|----------|-----------|
| `driver.set_window_size(1920, 1080)` | `await page.set_viewport_size({"width": 1920, "height": 1080})` |
| `driver.maximize_window()` | N/A (use set_viewport_size) |
| `driver.switch_to.window(handle)` | `page = await context.new_page()` |

### Network (Request/Response)

| Selenium | Playwright |
|----------|-----------|
| N/A (requer extensões) | `page.on("request", lambda request: ...)` |
| N/A | `page.on("response", lambda response: ...)` |
| N/A | `await page.route("**/*", lambda route: route.abort())` |

### Cleanup

| Selenium | Playwright |
|----------|-----------|
| `driver.quit()` | `await page.close()` e `await browser.close()` |
| `driver.close()` | `await page.close()` |

---

## 🔄 Exemplo de Migração Completo

### **ANTES (Selenium):**

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class ExemploScraper(BaseScraper):
    async def scrape(self, ticker: str) -> ScraperResult:
        try:
            # Criar driver
            self.driver = self._create_driver()

            # Navegar
            url = f"https://example.com/{ticker}"
            self.driver.get(url)

            # Wait e seletor
            wait = WebDriverWait(self.driver, 10)
            element = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".price"))
            )

            # Extrair texto
            price = element.text

            # Click
            button = self.driver.find_element(By.ID, "details-btn")
            button.click()

            return ScraperResult(success=True, data={"price": price})

        finally:
            if self.driver:
                self.driver.quit()
```

### **DEPOIS (Playwright):**

```python
from playwright.async_api import async_playwright

class ExemploScraper(BaseScraper):
    async def scrape(self, ticker: str) -> ScraperResult:
        try:
            # Page já criada no initialize()

            # Navegar
            url = f"https://example.com/{ticker}"
            await self.page.goto(url, wait_until="networkidle")

            # Wait e seletor (auto-wait integrado)
            element = await self.page.wait_for_selector(".price", state="visible")

            # Extrair texto
            price = await element.text_content()

            # Click (auto-wait)
            await self.page.click("#details-btn")

            return ScraperResult(success=True, data={"price": price})

        except Exception as e:
            return ScraperResult(success=False, error=str(e))
```

---

## ✅ Vantagens do Playwright

1. **Auto-wait automático** - Não precisa de WebDriverWait explícito
2. **Async/await nativo** - Código mais limpo e performático
3. **Network interception** - Controle total de requests/responses
4. **Browser context** - Melhor isolamento entre testes
5. **API moderna** - Mais intuitiva e consistente
6. **Performance** - ~30% mais rápido que Selenium
7. **Debugging** - DevTools integrado + trace viewer

---

## 📝 Checklist de Migração

Para cada scraper:

- [ ] Substituir `from selenium` por `from playwright.async_api`
- [ ] Converter `driver.find_element` para `page.query_selector` ou `page.locator`
- [ ] Converter `driver.get(url)` para `await page.goto(url)`
- [ ] Converter `element.text` para `await element.text_content()`
- [ ] Converter `element.click()` para `await element.click()`
- [ ] Converter `element.send_keys()` para `await element.fill()` ou `await element.type()`
- [ ] Remover `WebDriverWait` (Playwright tem auto-wait)
- [ ] Adicionar `await` em todas operações de I/O
- [ ] Converter `time.sleep()` para `await asyncio.sleep()`
- [ ] Remover `driver.quit()` do código (BaseScraper cuida disso)
- [ ] Testar individualmente
- [ ] Validar resultado com dados de produção

---

## 🚀 Template de Scraper Migrado

```python
"""
Nome do Scraper - Migrated to Playwright
"""
from base_scraper import BaseScraper, ScraperResult
from loguru import logger
import asyncio


class NomeScraper(BaseScraper):
    def __init__(self):
        super().__init__(
            name="NomeScraper",
            source="nome_fonte",
            requires_login=False  # ou True se precisar de login
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape data from fonte

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with data or error
        """
        try:
            # URL
            url = f"https://exemplo.com/{ticker.lower()}"

            # Navigate
            await self.page.goto(url, wait_until="networkidle")

            # Extract data (auto-wait)
            price = await self.page.text_content(".price")
            name = await self.page.text_content(".company-name")

            # Validate
            if not price:
                return ScraperResult(
                    success=False,
                    error="Price not found",
                    source=self.source
                )

            # Return
            return ScraperResult(
                success=True,
                data={
                    "price": price,
                    "name": name,
                },
                source=self.source
            )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source
            )
```

---

**Desenvolvido com:** Claude Code
**Co-Authored-By:** Claude <noreply@anthropic.com>
