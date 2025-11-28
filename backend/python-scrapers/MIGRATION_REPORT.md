# Selenium → Playwright Migration Report

**Data:** 2025-11-27
**Executor:** Claude Code
**Fase:** 3 - Mass Migration

---

## 📊 Status Atual

| Métrica | Quantidade |
|---------|------------|
| **Total de scrapers** | 30 |
| **Já migrados** | 2 (bcb_scraper.py, advfn_scraper.py) |
| **Restantes (Selenium)** | 24 |
| **API-only (não precisam)** | 4 (anbima, fred, ipeadata, coinmarketcap) |

---

## ✅ Scrapers Migrados (2/30)

1. ✅ **bcb_scraper.py** - Migrado como piloto (FASE 2)
2. ✅ **advfn_scraper.py** - Migrado (FASE 3 inicial)

---

## 🔄 Scrapers Pendentes (24/30)

### Scraping Web (requer Playwright):

1. ❌ b3_scraper.py
2. ❌ bloomberg_scraper.py
3. ❌ chatgpt_scraper.py
4. ❌ claude_scraper.py
5. ❌ deepseek_scraper.py
6. ❌ estadao_scraper.py
7. ❌ exame_scraper.py
8. ❌ fundamentei_scraper.py
9. ❌ fundamentus_scraper.py
10. ❌ gemini_scraper.py
11. ❌ googlefinance_scraper.py
12. ❌ googlenews_scraper.py
13. ❌ griffin_scraper.py
14. ❌ grok_scraper.py
15. ❌ infomoney_scraper.py
16. ❌ investidor10_scraper.py
17. ❌ investing_news_scraper.py
18. ❌ investing_scraper.py
19. ❌ investsite_scraper.py
20. ❌ maisretorno_scraper.py
21. ❌ opcoes_scraper.py
22. ❌ statusinvest_scraper.py
23. ❌ tradingview_scraper.py
24. ❌ valor_scraper.py

### API-only (não precisam migração):

- ✔️ anbima_scraper.py (usa API)
- ✔️ fred_scraper.py (usa API)
- ✔️ ipeadata_scraper.py (usa API)
- ✔️ coinmarketcap_scraper.py (usa API/aiohttp)

---

## 🛠️ Ferramentas Criadas

### Script de Migração Automática

**Arquivo:** `migrate_selenium_to_playwright.py`

**Conversões Implementadas:**

1. **Imports:**
   - Remove `from selenium import webdriver`
   - Remove `from selenium.webdriver.common.by import By`
   - Remove `from selenium.webdriver.support.ui import WebDriverWait`
   - Remove `from selenium.webdriver.support import expected_conditions as EC`

2. **Driver Operations:**
   - `self.driver = self._create_driver()` → comentado (base_scraper cuida)
   - `if not self.driver:` → `if not self.page:`
   - `self.driver.get(url)` → `await self.page.goto(url, wait_until="networkidle")`
   - `self.driver.refresh()` → `await self.page.reload()`
   - `self.driver.page_source` → `await self.page.content()`
   - `self.driver.current_url` → `self.page.url`

3. **Element Finding (CSS):**
   - `self.driver.find_element(By.CSS_SELECTOR, "css")` → `await self.page.query_selector("css")`
   - `self.driver.find_elements(By.CSS_SELECTOR, "css")` → `await self.page.query_selector_all("css")`
   - `elem.find_element(By.CSS_SELECTOR, "css")` → `await elem.query_selector("css")`

4. **Element Finding (XPATH):**
   - `self.driver.find_element(By.XPATH, "xpath")` → `await self.page.query_selector(f"xpath={xpath}")`
   - `elem.find_element(By.XPATH, "xpath")` → `await elem.query_selector(f"xpath={xpath}")`

5. **Element Finding (ID/NAME/TAG):**
   - `By.ID, "id"` → `"#id"`
   - `By.NAME, "name"` → `"[name='name']"`
   - `By.TAG_NAME, "tag"` → `"tag"`

6. **Element Properties:**
   - `elem.text` → `await elem.text_content()`
   - `elem.text.strip()` → `(await elem.text_content()).strip()`
   - `elem.get_attribute(attr)` → `await elem.get_attribute(attr)`
   - `elem.is_displayed()` → `await elem.is_visible()`

7. **Element Actions:**
   - `elem.click()` → `await elem.click()`
   - `elem.send_keys(text)` → `await elem.fill(text)`
   - `elem.clear()` → `await elem.clear()`

8. **Cookies:**
   - `self.driver.add_cookie(cookie)` → `await self.context.add_cookies([cookie])`
   - `self.driver.get_cookies()` → `await self.context.cookies()`

---

## 📝 Mapeamento Completo (SELENIUM_TO_PLAYWRIGHT_MIGRATION.md)

**Arquivo de referência:** `backend/python-scrapers/SELENIUM_TO_PLAYWRIGHT_MIGRATION.md`

Contém todos os mapeamentos detalhados com exemplos.

---

## 🚀 Como Completar a Migração

### Opção 1: Script Automático (Recomendado)

```bash
cd backend/python-scrapers
python migrate_selenium_to_playwright.py
```

**Observação:** Requer Python 3.7+ no PATH do Windows.

### Opção 2: Migração Manual

Para cada scraper pendente:

1. **Adicionar header de migração:**
   ```python
   # MIGRATED TO PLAYWRIGHT - 2025-11-27
   ```

2. **Remover imports de Selenium:**
   ```python
   # Remove:
   from selenium import webdriver
   from selenium.webdriver.common.by import By
   from selenium.webdriver.support.ui import WebDriverWait
   from selenium.webdriver.support import expected_conditions as EC
   ```

3. **Converter operações de driver:**
   ```python
   # Antes:
   self.driver = self._create_driver()
   self.driver.get(url)
   elem = self.driver.find_element(By.CSS_SELECTOR, ".price")
   price = elem.text

   # Depois:
   # self.driver criado no base_scraper
   await self.page.goto(url, wait_until="networkidle")
   elem = await self.page.query_selector(".price")
   price = await elem.text_content()
   ```

4. **Adicionar `await` em todas operações I/O:**
   - `page.goto()` → `await page.goto()`
   - `page.query_selector()` → `await page.query_selector()`
   - `elem.text_content()` → `await elem.text_content()`
   - `elem.click()` → `await elem.click()`
   - `elem.fill()` → `await elem.fill()`

5. **Testar individualmente:**
   ```bash
   cd backend/python-scrapers
   python scrapers/fundamentus_scraper.py
   ```

### Opção 3: Migração com Regex (Bash)

```bash
cd backend/python-scrapers/scrapers

# Para cada arquivo
for file in *_scraper.py; do
    # Adicionar header
    sed -i '1s/^/# MIGRATED TO PLAYWRIGHT - 2025-11-27\n/' "$file"

    # Remover imports
    sed -i '/from selenium/d' "$file"

    # Converter driver.get → page.goto
    sed -i 's/self\.driver\.get(\(.*\))/await self.page.goto(\1, wait_until="networkidle")/g' "$file"

    # ... (adicionar mais conversões conforme necessário)
done
```

---

## ✅ Checklist de Validação

Após migrar TODOS os scrapers:

- [ ] Todos os arquivos têm header `# MIGRATED TO PLAYWRIGHT - 2025-11-27`
- [ ] Nenhum arquivo importa `from selenium`
- [ ] Todos usam `self.page` ao invés de `self.driver`
- [ ] Todos usam `await` nas operações de I/O
- [ ] Todos usam `query_selector` ao invés de `find_element`
- [ ] Testar scrapers principais:
  - [ ] fundamentus_scraper.py
  - [ ] statusinvest_scraper.py
  - [ ] investidor10_scraper.py
  - [ ] fundamentei_scraper.py
  - [ ] investing_scraper.py
- [ ] Executar `grep -r "from selenium" scrapers/` deve retornar 0 resultados

---

## 📊 Benefícios Esperados

### Performance
- ⚡ **~30% mais rápido** que Selenium
- 🚀 Auto-wait automático (sem WebDriverWait explícito)
- 🔄 Async/await nativo (paralelização)

### Confiabilidade
- ✅ Menos timeouts
- ✅ Menos flaky tests
- ✅ Melhor handling de JavaScript

### Developer Experience
- 📝 API mais limpa e intuitiva
- 🐛 Melhor debugging (DevTools integrado)
- 🎯 Network interception nativo

---

## 📚 Referências

1. **Guia de Migração:** `SELENIUM_TO_PLAYWRIGHT_MIGRATION.md`
2. **Base Scraper Migrado:** `base_scraper.py`
3. **Exemplo Piloto:** `bcb_scraper.py`
4. **Documentação Playwright:** https://playwright.dev/python/docs/intro

---

## 🔥 Próximos Passos

1. ✅ **FASE 1:** base_scraper.py migrado
2. ✅ **FASE 2:** bcb_scraper.py como piloto
3. 🔄 **FASE 3:** Migração em massa (EM ANDAMENTO)
   - ✅ Script de migração criado
   - ✅ 2 scrapers migrados
   - ⏳ 24 scrapers pendentes
4. ⏭️ **FASE 4:** Validação e testes
5. ⏭️ **FASE 5:** Remoção de dependências Selenium

---

**Desenvolvido com:** Claude Code
**Co-Authored-By:** Claude <noreply@anthropic.com>
