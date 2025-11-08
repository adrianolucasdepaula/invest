# 📊 Status de Scrapers - B3 AI Analysis Platform

**Última atualização:** 2025-11-07
**Total de fontes:** 30+
**Implementados:** 10
**Em produção:** 33%

---

## 🎯 Status Geral

| Categoria | Total | Implementado | % |
|-----------|-------|--------------|---|
| **Análise Fundamentalista** | 6 | 3 | 50% |
| **Análise Geral do Mercado** | 3 | 0 | 0% |
| **Análise Gráfica/Técnica** | 1 | 0 | 0% |
| **Análise de Opções** | 1 | 1 | 100% ✅ |
| **Criptomoedas** | 1 | 1 | 100% ✅ |
| **Insiders** | 1 | 1 | 100% ✅ |
| **Relatórios Institucionais** | 4 | 2 | 50% |
| **Busca Geral / Dados Oficiais** | 7 | 2 | 29% |
| **Notícias** | 6 | 0 | 0% |
| **TOTAL** | **30** | **10** | **33%** |

---

## ✅ Scrapers Implementados (10)

### 1. Fundamentus ✅
- **Arquivo:** `scrapers/fundamentus_scraper.py` (330 linhas)
- **URL:** https://www.fundamentus.com.br/
- **Login:** ❌ Não necessário (público)
- **Indicadores:** 35+
- **Status:** ✅ PRONTO PARA USO

### 2. Investsite ✅
- **Arquivo:** `scrapers/investsite_scraper.py` (380 linhas)
- **URL:** https://www.investsite.com.br/
- **Login:** ❌ Não necessário (público)
- **Indicadores:** 40+
- **Status:** ✅ PRONTO PARA USO

### 3. StatusInvest ✅
- **Arquivo:** `scrapers/statusinvest_scraper.py` (192 linhas)
- **URL:** https://statusinvest.com.br/
- **Login:** ❌ Não necessário (pode melhorar com login)
- **Indicadores:** 10+
- **Status:** ✅ PRONTO PARA USO (básico)

### 4. B3 ✅
- **Arquivo:** `scrapers/b3_scraper.py` (200 linhas)
- **URL:** https://www.b3.com.br/
- **Login:** ❌ Não necessário (público)
- **Dados:** Informações oficiais, CNPJ, setor, governança
- **Status:** ✅ PRONTO PARA USO

### 5. Griffin ✅
- **Arquivo:** `scrapers/griffin_scraper.py` (240 linhas)
- **URL:** https://griffin.app.br/
- **Login:** ❌ Não necessário (público)
- **Dados:** Movimentações de insiders, compras/vendas
- **Status:** ✅ PRONTO PARA USO

### 6. CoinMarketCap ✅
- **Arquivo:** `scrapers/coinmarketcap_scraper.py` (180 linhas)
- **URL:** https://coinmarketcap.com/
- **Login:** ❌ Não necessário (público)
- **Dados:** Preço, market cap, volume 24h, variações
- **Status:** ✅ PRONTO PARA USO

### 7. Opcoes.net.br ✅
- **Arquivo:** `scrapers/opcoes_scraper.py` (360 linhas)
- **URL:** https://opcoes.net.br/
- **Login:** ✅ SIM (credenciais específicas)
- **Credenciais:** Usuario: 312.862.178-06, Senha: Safra998266@#
- **Dados:** Options chain, IV Rank, Greeks, prêmios
- **Status:** ✅ PRONTO PARA USO

### 8. Banco Central do Brasil (BCB) ✅
- **Arquivo:** `scrapers/bcb_scraper.py` (425 linhas)
- **URL:** https://www.bcb.gov.br/
- **Login:** ❌ Não necessário (público)
- **Dados:** Dados macroeconômicos oficiais
- **Indicadores:** 12 (Selic, IPCA, IGP-M, PIB, Câmbio, Reservas, Desemprego, CDI)
- **API:** ✅ SIM - SGS (Sistema Gerenciador de Séries Temporais)
- **Dados Históricos:** ✅ Últimos 12 meses por indicador
- **Status:** ✅ PRONTO PARA USO

### 9. Estadão Investidor ✅
- **Arquivo:** `scrapers/estadao_scraper.py` (353 linhas)
- **URL:** https://einvestidor.estadao.com.br/
- **Login:** ✅ SIM - Google OAuth
- **Dados:** Análises, relatórios institucionais, notícias do mercado
- **Estratégia:** Cookies salvos via Google OAuth
- **Status:** ✅ PRONTO PARA USO

### 10. Mais Retorno ✅
- **Arquivo:** `scrapers/maisretorno_scraper.py` (364 linhas)
- **URL:** https://maisretorno.com/
- **Login:** ✅ SIM - Google OAuth
- **Dados:** Análises, educação financeira, relatórios, notícias
- **Estratégia:** Cookies salvos via Google OAuth
- **Status:** ✅ PRONTO PARA USO

---

## 📋 Scrapers Planejados (20)

### Análise Fundamentalista (3 faltando)

#### Fundamentei ⏳
- **URL:** https://fundamentei.com/
- **Login:** 🔐 Google OAuth
- **Template:** [Google OAuth Template](#template-google-oauth)
- **Estratégia:** Cookies salvos (ver GOOGLE_OAUTH_STRATEGY.md)
- **Prioridade:** 🟡 Média
- **Estimativa:** 2-3 horas

#### Investidor10 ⏳
- **URL:** https://investidor10.com.br/
- **Login:** 🔐 Google OAuth
- **Template:** [Google OAuth Template](#template-google-oauth)
- **Estratégia:** Cookies salvos
- **Prioridade:** 🟡 Média
- **Estimativa:** 2-3 horas

### Análise Geral do Mercado (3)

#### Investing.com ⏳
- **URL:** https://br.investing.com/
- **Login:** 🔐 Google OAuth
- **Template:** [Google OAuth Template](#template-google-oauth)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 3-4 horas

#### ADVFN ⏳
- **URL:** https://br.advfn.com/
- **Login:** 🔐 Google OAuth
- **Template:** [Google OAuth Template](#template-google-oauth)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 3-4 horas

#### Google Finance ⏳
- **URL:** https://www.google.com/finance/
- **Login:** 🔐 Google OAuth
- **Template:** [Google OAuth Template](#template-google-oauth)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 2-3 horas

### Análise Gráfica/Técnica (1)

#### TradingView ⏳
- **URL:** https://br.tradingview.com/
- **Login:** 🔐 Google OAuth
- **Template:** [Google OAuth Template](#template-google-oauth)
- **Dados:** Indicadores técnicos, padrões gráficos
- **Prioridade:** 🟡 Média
- **Estimativa:** 4-5 horas

### Relatórios Institucionais (2 faltando)

#### BTG Pactual ⏳ (SKIPPED)
- **URL:** https://content.btgpactual.com/research/
- **Login:** 🔑 Token no celular (complexo)
- **Template:** N/A (requer 2FA)
- **Prioridade:** 🔴 SKIPPED (2FA complexo)
- **Nota:** Requer autenticação 2FA, considerado não viável no momento

#### XPI ⏳ (SKIPPED)
- **URL:** https://conteudos.xpi.com.br/
- **Login:** 🔑 Token no celular (complexo)
- **Template:** N/A (requer 2FA)
- **Prioridade:** 🔴 SKIPPED (2FA complexo)
- **Nota:** Requer autenticação 2FA, considerado não viável no momento

### IAs via Browser (5)

**NOTA:** Todos requerem scraping via browser (SEM API)

#### ChatGPT ⏳
- **URL:** https://chatgpt.com/
- **Login:** 🔐 Google OAuth
- **Template:** [IA Browser Template](#template-ia-browser)
- **Prioridade:** 🔴 Alta (análises IA)
- **Estimativa:** 3-4 horas

#### DeepSeek ⏳
- **URL:** https://www.deepseek.com/
- **Login:** 🔐 Google OAuth
- **Template:** [IA Browser Template](#template-ia-browser)
- **Prioridade:** 🟡 Média
- **Estimativa:** 3-4 horas

#### Gemini ⏳
- **URL:** https://gemini.google.com/app
- **Login:** 🔐 Google OAuth
- **Template:** [IA Browser Template](#template-ia-browser)
- **Prioridade:** 🟡 Média
- **Estimativa:** 3-4 horas

#### Claude ⏳
- **URL:** https://claude.ai/new
- **Login:** 🔐 Google OAuth
- **Template:** [IA Browser Template](#template-ia-browser)
- **Prioridade:** 🟡 Média
- **Estimativa:** 3-4 horas

#### Grok ⏳
- **URL:** https://grok.com/
- **Login:** 🔐 Google OAuth
- **Template:** [IA Browser Template](#template-ia-browser)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 3-4 horas

### Notícias (6)

#### Google News ⏳
- **URL:** https://news.google.com/
- **Login:** 🔐 Google OAuth
- **Template:** [News Template](#template-news)
- **Prioridade:** 🟡 Média
- **Estimativa:** 2 horas

#### Bloomberg Línea ✅ (Público - implementar)
- **URL:** https://www.bloomberglinea.com.br/
- **Login:** ❌ NÃO (público)
- **Template:** [Public News Template](#template-public-news)
- **Prioridade:** 🔴 Alta (público!)
- **Estimativa:** 1-2 horas

#### Investing News ⏳
- **URL:** https://br.investing.com/news
- **Login:** 🔐 Google OAuth
- **Template:** [News Template](#template-news)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 2 horas

#### Valor Econômico ⏳
- **URL:** https://valor.globo.com/
- **Login:** 🔐 Google OAuth
- **Template:** [News Template](#template-news)
- **Prioridade:** 🟡 Média
- **Estimativa:** 2-3 horas

#### Exame ⏳
- **URL:** https://exame.com/
- **Login:** 🔐 Google OAuth
- **Template:** [News Template](#template-news)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 2 horas

#### InfoMoney ⏳
- **URL:** https://www.infomoney.com.br/
- **Login:** 🔐 Google OAuth
- **Template:** [News Template](#template-news)
- **Prioridade:** 🟢 Baixa
- **Estimativa:** 2 horas

---

## 📄 Templates Reutilizáveis

### Template: Google OAuth

Arquivo: `scrapers/templates/google_oauth_template.py`

Todos os scrapers com Google OAuth seguem este padrão:

```python
"""
[Site Name] Scraper - [Descrição]
Fonte: [URL]
Requer login via Google OAuth
"""
import pickle
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class [SiteName]Scraper(BaseScraper):
    BASE_URL = "[site_url]"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="[SiteName]",
            source="[SOURCE_NAME]",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            # Navigate to site
            self.driver.get(self.BASE_URL)

            # Load cookies
            with open(self.COOKIES_FILE, 'rb') as f:
                cookies = pickle.load(f)

            for cookie in cookies:
                if '[site_domain]' in cookie.get('domain', ''):
                    try:
                        self.driver.add_cookie(cookie)
                    except:
                        pass

            # Refresh
            self.driver.refresh()
            await asyncio.sleep(2)

            # Verify
            if not await self._verify_logged_in():
                raise Exception("Login failed - cookies expired")

            self._initialized = True

        except FileNotFoundError:
            raise Exception("Google cookies not found. Run save_google_cookies.py")

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        # Look for logout button or user menu
        logout_selectors = [
            "//a[contains(text(), 'Sair')]",
            "//button[contains(text(), 'Logout')]",
            ".user-menu",
        ]

        for selector in logout_selectors:
            try:
                if selector.startswith("//"):
                    elements = self.driver.find_elements(By.XPATH, selector)
                else:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                if elements:
                    return True
            except:
                continue

        return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """Scrape data"""
        await self.initialize()

        # Build URL
        url = f"{self.BASE_URL}/[path]/{ticker}"
        self.driver.get(url)
        await asyncio.sleep(3)

        # Extract data
        data = await self._extract_data(ticker)

        if data:
            return ScraperResult(
                success=True,
                data=data,
                source=self.source,
                metadata={"url": url, "requires_login": True},
            )

        return ScraperResult(
            success=False,
            error="Failed to extract data",
            source=self.source,
        )

    async def _extract_data(self, ticker: str):
        """Extract data from page"""
        # Implement site-specific extraction
        pass
```

**Uso:**
1. Copiar template
2. Substituir `[SiteName]`, `[site_url]`, `[site_domain]`
3. Implementar `_extract_data()`
4. Ajustar `_verify_logged_in()` para o site específico

---

### Template: IA Browser

Arquivo: `scrapers/templates/ia_browser_template.py`

Para IAs acessadas via browser (sem API):

```python
"""
[IA Name] Scraper - Análise via IA
Fonte: [URL]
Acesso via browser (SEM API)
"""
import asyncio
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class [IAName]Scraper(BaseScraper):
    BASE_URL = "[ia_url]"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="[IAName]",
            source="[IA_NAME]",
            requires_login=True,
        )

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to IA and get response

        Args:
            prompt: Question/prompt for the IA

        Returns:
            ScraperResult with IA response
        """
        await self.initialize()

        try:
            # Navigate to chat page
            self.driver.get(f"{self.BASE_URL}/chat")
            await asyncio.sleep(3)

            # Find chat input
            input_selectors = [
                "textarea[placeholder*='Message']",
                "textarea[placeholder*='Type']",
                "div[contenteditable='true']",
                "#prompt-textarea",
            ]

            input_field = None
            for selector in input_selectors:
                try:
                    input_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue

            if not input_field:
                return ScraperResult(
                    success=False,
                    error="Could not find chat input",
                    source=self.source,
                )

            # Send prompt
            input_field.clear()
            input_field.send_keys(prompt)
            input_field.send_keys(Keys.RETURN)

            # Wait for response
            await asyncio.sleep(5)

            # Extract response
            response = await self._extract_response()

            if response:
                return ScraperResult(
                    success=True,
                    data={"prompt": prompt, "response": response},
                    source=self.source,
                )

            return ScraperResult(
                success=False,
                error="No response from IA",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting IA response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_response(self) -> str:
        """Extract IA response from page"""
        # Wait for response to be generated
        max_wait = 60  # 60 seconds max
        waited = 0

        while waited < max_wait:
            # Check if response is ready
            # Look for response container
            response_selectors = [
                ".response-text",
                ".message-content",
                "[data-message-author-role='assistant']",
            ]

            for selector in response_selectors:
                try:
                    response_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                    response_text = response_elem.text.strip()

                    if response_text and len(response_text) > 10:
                        return response_text

                except:
                    continue

            await asyncio.sleep(2)
            waited += 2

        return None
```

**Uso:**
1. Adaptar seletores para cada IA
2. Ajustar lógica de detecção de resposta pronta
3. Implementar parsing de respostas longas

---

## 🚀 Próximos Passos Recomendados

### Prioridade ALTA (fazer primeiro)

1. **Bloomberg Línea** (público!) - 1-2 horas
2. **ChatGPT** (IA alta prioridade) - 3-4 horas
3. **Fundamentei** (cookies) - 2-3 horas
4. **Investidor10** (cookies) - 2-3 horas

**Total:** ~10-12 horas para ter 11 scrapers

### Prioridade MÉDIA

5. **TradingView** (análise técnica) - 4-5 horas
6. **Gemini** (IA alternativa) - 3-4 horas
7. **Google News** (notícias) - 2 horas
8. **Valor Econômico** (notícias financeiras) - 2-3 horas

**Total acumulado:** ~21-26 horas para 15 scrapers

### Prioridade BAIXA

- Demais fontes de notícias (4)
- IAs restantes (3)
- Investing.com, ADVFN, Google Finance
- Relatórios institucionais (requerem 2FA)

---

## 📊 Roadmap de Implementação

```
┌──────────────────────────────────────────────────────┐
│ FASE 1: Fontes Públicas (COMPLETA) ✅               │
├──────────────────────────────────────────────────────┤
│ • Fundamentus ✅                                     │
│ • Investsite ✅                                      │
│ • B3 ✅                                              │
│ • Griffin ✅                                         │
│ • CoinMarketCap ✅                                   │
│ • StatusInvest ✅ (básico)                           │
│ • BCB ✅ (dados macroeconômicos)                     │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ FASE 2: Scrapers com Credenciais (COMPLETA) ✅      │
├──────────────────────────────────────────────────────┤
│ • Opcoes.net.br ✅                                   │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ FASE 3: Google OAuth - Alta Prioridade (PRÓXIMA)    │
├──────────────────────────────────────────────────────┤
│ • Bloomberg Línea (público!) ⏳                      │
│ • ChatGPT (IA) ⏳                                    │
│ • Fundamentei ⏳                                      │
│ • Investidor10 ⏳                                     │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ FASE 4: Análises Especializadas                     │
├──────────────────────────────────────────────────────┤
│ • TradingView (gráfica) ⏳                           │
│ • Gemini (IA) ⏳                                      │
│ • Google News ⏳                                      │
│ • Valor Econômico ⏳                                  │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ FASE 5: Fontes Secundárias                          │
├──────────────────────────────────────────────────────┤
│ • Demais notícias (4) ⏳                             │
│ • IAs restantes (3) ⏳                                │
│ • Relatórios institucionais (2FA) ⏳                 │
└──────────────────────────────────────────────────────┘
```

---

## 🧪 Testes

### Testar Scrapers Implementados

```bash
# Todos os scrapers
docker exec -it invest_scrapers python test_scrapers.py all PETR4

# Scraper específico
docker exec -it invest_scrapers python test_scrapers.py fundamentus PETR4
docker exec -it invest_scrapers python test_scrapers.py opcoes PETR
docker exec -it invest_scrapers python test_scrapers.py griffin PETR4

# Testar BCB (dados macroeconômicos)
docker exec -it invest_scrapers python -c "
from scrapers import BCBScraper
import asyncio

async def test():
    scraper = BCBScraper()
    result = await scraper.scrape_with_retry('all')
    print(result.to_dict())

asyncio.run(test())
"
```

### Configurar Opcoes.net.br

Adicionar ao `.env`:
```env
OPCOES_USERNAME=312.862.178-06
OPCOES_PASSWORD=Safra998266@#
```

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
**Próxima revisão:** Após implementar Fase 3
