# 🔐 Estratégia para Scrapers com Google OAuth

**Criado:** 2025-11-07
**Status:** Documento de Planejamento

---

## 📋 Fontes que Requerem Google OAuth

Você acessa essas fontes usando autenticação Google:

1. **Fundamentei** - https://fundamentei.com/
2. **Investidor10** - https://investidor10.com.br/
3. **StatusInvest** - https://statusinvest.com.br/

---

## 🎯 Opções de Implementação

### ✅ Opção 1: Selenium com Cookies Salvos (RECOMENDADO)

**Como funciona:**
1. Você faz login manualmente UMA VEZ no seu navegador
2. Exportamos os cookies da sessão autenticada
3. Scrapers carregam esses cookies para manter a sessão ativa
4. Renovação periódica dos cookies (manual ou semi-automática)

**Vantagens:**
- ✅ Simples de implementar
- ✅ Não precisa de credenciais no código
- ✅ Funciona com 2FA (autenticação de dois fatores)
- ✅ Mais seguro (sem senha armazenada)
- ✅ Mesma sessão em todos os sites

**Desvantagens:**
- ⚠️ Cookies expiram (renovação periódica necessária)
- ⚠️ Precisa renovar manualmente (ou semi-automaticamente)

**Implementação:**

```python
import pickle
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

class GoogleAuthScraper(BaseScraper):
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self, name, source):
        super().__init__(name, source, requires_login=True)

    async def initialize(self):
        """Load Google cookies and establish session"""
        if not self.driver:
            self.driver = self._create_driver()

        # Navigate to site first
        self.driver.get(self.BASE_URL)

        # Load saved cookies
        try:
            with open(self.COOKIES_FILE, 'rb') as f:
                cookies = pickle.load(f)

            for cookie in cookies:
                self.driver.add_cookie(cookie)

            # Refresh to apply cookies
            self.driver.refresh()

            # Verify login successful
            if not await self._verify_logged_in():
                raise Exception("Cookies expired or invalid")

            logger.success(f"{self.name} logged in successfully")

        except FileNotFoundError:
            raise Exception(
                f"Cookies file not found. Please run manual login first."
            )

    async def _verify_logged_in(self) -> bool:
        """Check if user is logged in"""
        # Each site has different indicators
        # Override in subclasses
        pass
```

**Script para salvar cookies (executar manualmente):**

```python
# save_google_cookies.py
import pickle
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

def save_google_cookies():
    """
    Script para salvar cookies do Google após login manual

    INSTRUÇÕES:
    1. Execute este script
    2. Uma janela do Chrome abrirá
    3. Faça login no Google manualmente
    4. Acesse fundamentei.com, investidor10.com, statusinvest.com
    5. Pressione ENTER no terminal quando terminar
    6. Cookies serão salvos automaticamente
    """

    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")

    # User data dir para persistir sessão
    options.add_argument("--user-data-dir=/app/browser-profiles/google-session")

    driver = webdriver.Chrome(options=options)

    print("=" * 60)
    print("INSTRUÇÕES PARA SALVAR COOKIES DO GOOGLE")
    print("=" * 60)
    print()
    print("1. Uma janela do Chrome foi aberta")
    print("2. Faça login no Google (se necessário)")
    print("3. Acesse os sites:")
    print("   - https://fundamentei.com/")
    print("   - https://investidor10.com.br/")
    print("   - https://statusinvest.com.br/")
    print("4. Verifique que está logado em todos")
    print("5. Pressione ENTER aqui quando terminar")
    print()

    # Abrir Google primeiro
    driver.get("https://accounts.google.com")

    input("Pressione ENTER após fazer login e acessar todos os sites...")

    # Salvar cookies
    cookies = driver.get_cookies()

    with open('/app/browser-profiles/google_cookies.pkl', 'wb') as f:
        pickle.dump(cookies, f)

    print()
    print("✅ Cookies salvos com sucesso!")
    print(f"📁 Arquivo: /app/browser-profiles/google_cookies.pkl")
    print(f"🔢 Total de cookies: {len(cookies)}")
    print()
    print("Agora os scrapers podem usar esses cookies para login automático.")

    driver.quit()

if __name__ == "__main__":
    save_google_cookies()
```

**Renovação de Cookies:**

```python
# renew_google_cookies.py
"""
Script para renovar cookies do Google periodicamente
Execute a cada 7-14 dias ou quando os scrapers começarem a falhar
"""
import pickle
from datetime import datetime
from pathlib import Path

def check_cookies_age():
    """Verificar idade dos cookies"""
    cookies_file = Path("/app/browser-profiles/google_cookies.pkl")

    if not cookies_file.exists():
        print("❌ Arquivo de cookies não existe")
        return None

    age_days = (datetime.now() - datetime.fromtimestamp(
        cookies_file.stat().st_mtime
    )).days

    print(f"Idade dos cookies: {age_days} dias")

    if age_days > 7:
        print("⚠️  Cookies podem estar expirando em breve")
        print("   Recomendado renovar")

    return age_days

if __name__ == "__main__":
    age = check_cookies_age()

    if age and age > 14:
        print("\n🚨 ATENÇÃO: Cookies muito antigos!")
        print("   Execute save_google_cookies.py para renovar")
```

---

### 🔄 Opção 2: Selenium com Login Automatizado

**Como funciona:**
1. Scrapers fazem login automático usando email/senha
2. Lidam com fluxo OAuth do Google
3. Podem precisar resolver CAPTCHAs

**Vantagens:**
- ✅ Totalmente automático
- ✅ Não precisa renovação manual

**Desvantagens:**
- ❌ Muito complexo com OAuth
- ❌ Google bloqueia automação facilmente
- ❌ Não funciona com 2FA
- ❌ Credenciais no código (risco de segurança)
- ❌ CAPTCHA frequente

**Status:** ❌ NÃO RECOMENDADO para Google OAuth

---

### 🎭 Opção 3: Playwright com Contexto Persistente

**Como funciona:**
1. Similar à Opção 1, mas usa Playwright
2. Contexto do navegador persistente
3. Estado de login mantido entre execuções

**Vantagens:**
- ✅ Mais moderno que Selenium
- ✅ Melhor performance
- ✅ Contexto persistente nativo
- ✅ Menos detecção de bot

**Desvantagens:**
- ⚠️ Requer adicionar Playwright ao projeto
- ⚠️ Aprendizado de nova API

**Implementação:**

```python
from playwright.async_api import async_playwright
import pickle

class PlaywrightGoogleScraper:
    async def initialize(self):
        self.playwright = await async_playwright().start()

        # Usar contexto persistente
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir="/app/browser-profiles/playwright-session",
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ]
        )

        self.page = await self.context.new_page()

    async def scrape(self, ticker):
        await self.page.goto(f"{self.BASE_URL}{ticker}")
        # ... scraping logic
```

---

### 🤖 Opção 4: APIs Oficiais (Quando Disponíveis)

**Verificar se os sites oferecem APIs:**

- **Fundamentei**: ❌ Sem API pública
- **Investidor10**: ❌ Sem API pública
- **StatusInvest**: ❌ Sem API pública (mas tem endpoints internos)

**Status:** ❌ Não disponível atualmente

---

## 🎯 Recomendação Final

### Para PRODUÇÃO: Opção 1 (Selenium + Cookies Salvos)

**Motivos:**
1. ✅ **Simples e confiável**
2. ✅ **Funciona com 2FA**
3. ✅ **Mais seguro** (sem credenciais)
4. ✅ **Já temos Selenium** instalado
5. ✅ **Fácil manutenção**

**Workflow:**

```
┌─────────────────────────────────────────────────────┐
│ 1. Setup Inicial (UMA VEZ)                         │
├─────────────────────────────────────────────────────┤
│ • Executar save_google_cookies.py                   │
│ • Fazer login manual no Chrome que abre            │
│ • Acessar os 3 sites (Fundamentei, Inv10, Status)  │
│ • Pressionar ENTER                                  │
│ • Cookies salvos em google_cookies.pkl             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. Uso Diário (AUTOMÁTICO)                         │
├─────────────────────────────────────────────────────┤
│ • Scrapers carregam cookies automaticamente         │
│ • Fazem scraping como se estivesse logado          │
│ • Sem intervenção humana necessária                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. Manutenção (A CADA 7-14 DIAS)                   │
├─────────────────────────────────────────────────────┤
│ • Executar renew_google_cookies.py                  │
│ • Se idade > 14 dias: renovar cookies               │
│ • Repetir processo do passo 1                       │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de Implementação

### Fase 1: Setup Básico
- [x] Criar base_scraper.py com suporte a login
- [x] Criar scrapers públicos (Fundamentus, Investsite)
- [ ] Criar save_google_cookies.py
- [ ] Criar renew_google_cookies.py
- [ ] Criar diretório /app/browser-profiles

### Fase 2: Scrapers com OAuth
- [ ] Implementar FundamenteiScraper (com cookies)
- [ ] Implementar Investidor10Scraper (com cookies)
- [ ] Atualizar StatusInvestScraper (adicionar suporte a cookies)
- [ ] Testar login e scraping

### Fase 3: Automação
- [ ] Script de verificação de cookies expirados
- [ ] Notificação quando cookies precisam renovação
- [ ] Documentação de uso para equipe

---

## 🔒 Segurança

### Armazenamento de Cookies

**Localização:**
```
/app/browser-profiles/
├── google_cookies.pkl        # Cookies salvos
└── google-session/           # Session data (Playwright)
```

**Proteções:**
- ✅ Volume Docker isolado
- ✅ Não commitar no Git (.gitignore)
- ✅ Permissões restritas (600)
- ✅ Criptografia em repouso (se necessário)

**.gitignore:**
```
browser-profiles/
*.pkl
google-session/
```

**docker-compose.yml:**
```yaml
scrapers:
  volumes:
    - ./browser-profiles:/app/browser-profiles:rw
```

---

## 🧪 Testes

### Testar Cookies

```bash
# 1. Salvar cookies
docker exec -it invest_scrapers python save_google_cookies.py

# 2. Testar scraper
docker exec -it invest_scrapers python -c "
from scrapers import FundamenteiScraper
import asyncio

async def test():
    scraper = FundamenteiScraper()
    result = await scraper.scrape_with_retry('PETR4')
    print(result.to_dict())

asyncio.run(test())
"

# 3. Verificar idade dos cookies
docker exec -it invest_scrapers python renew_google_cookies.py
```

---

## 📊 Comparação de Opções

| Critério | Opção 1 (Cookies) | Opção 2 (Auto Login) | Opção 3 (Playwright) | Opção 4 (API) |
|----------|-------------------|----------------------|----------------------|---------------|
| **Complexidade** | 🟢 Baixa | 🔴 Alta | 🟡 Média | 🟢 Baixa |
| **Confiabilidade** | 🟢 Alta | 🔴 Baixa | 🟢 Alta | 🟢 Alta |
| **Manutenção** | 🟡 Manual | 🟢 Auto | 🟡 Manual | 🟢 Auto |
| **Segurança** | 🟢 Alta | 🔴 Baixa | 🟢 Alta | 🟢 Alta |
| **2FA Support** | 🟢 Sim | 🔴 Não | 🟢 Sim | 🟢 Sim |
| **Disponibilidade** | 🟢 Agora | 🟢 Agora | 🟡 Adicionar lib | 🔴 Não existe |
| **RECOMENDADO** | ✅ SIM | ❌ NÃO | 🟡 Alternativa | ❌ N/A |

---

## 🎓 Exemplo Completo: FundamenteiScraper

```python
# scrapers/fundamentei_scraper.py
import pickle
from pathlib import Path
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult

class FundamenteiScraper(BaseScraper):
    BASE_URL = "https://fundamentei.com/acoes/"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Fundamentei",
            source="FUNDAMENTEI",
            requires_login=True,  # Requer Google OAuth
        )

    async def initialize(self):
        """Initialize with Google OAuth cookies"""
        if self._initialized:
            return

        # Create driver
        if not self.driver:
            self.driver = self._create_driver()

        # Load Google cookies
        try:
            logger.info(f"Loading Google cookies for {self.name}")

            # Navigate to site first (cookies need domain)
            self.driver.get("https://fundamentei.com")

            # Load cookies
            with open(self.COOKIES_FILE, 'rb') as f:
                cookies = pickle.load(f)

            for cookie in cookies:
                # Only add cookies for relevant domains
                if 'fundamentei.com' in cookie.get('domain', '') or \
                   'google.com' in cookie.get('domain', ''):
                    try:
                        self.driver.add_cookie(cookie)
                    except Exception as e:
                        logger.debug(f"Could not add cookie: {e}")

            # Refresh to apply cookies
            self.driver.refresh()
            await asyncio.sleep(2)

            # Verify login
            if not await self._verify_logged_in():
                raise Exception(
                    "Login verification failed. Cookies may be expired. "
                    "Please run save_google_cookies.py"
                )

            logger.success(f"{self.name} logged in successfully via Google OAuth")
            self._initialized = True

        except FileNotFoundError:
            raise Exception(
                f"Google cookies file not found: {self.COOKIES_FILE}\n"
                f"Please run save_google_cookies.py first"
            )
        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Verify that user is logged in"""
        try:
            # Look for logout button or user profile
            # Each site has different indicators
            logout_button = self.driver.find_elements(
                By.XPATH,
                "//a[contains(text(), 'Sair')] | //button[contains(text(), 'Logout')]"
            )

            if logout_button:
                return True

            # Or check for user profile/avatar
            user_profile = self.driver.find_elements(
                By.CSS_SELECTOR,
                ".user-avatar, .user-profile, [data-testid='user-menu']"
            )

            return len(user_profile) > 0

        except Exception as e:
            logger.debug(f"Login verification error: {e}")
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """Scrape data from Fundamentei"""
        try:
            # Ensure logged in
            await self.initialize()

            # Navigate to ticker page
            url = f"{self.BASE_URL}{ticker.upper()}"
            logger.info(f"Navigating to {url}")
            self.driver.get(url)

            await asyncio.sleep(2)

            # Check if behind paywall
            if "premium" in self.driver.page_source.lower() or \
               "assine" in self.driver.page_source.lower():
                return ScraperResult(
                    success=False,
                    error="Content behind paywall",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": url, "requires_login": True},
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

    async def _extract_data(self, ticker: str):
        """Extract data from Fundamentei page"""
        # ... implementation specific to Fundamentei's HTML structure
        pass
```

---

## ✅ Conclusão

**IMPLEMENTAR AGORA:**
1. ✅ Scrapers públicos (Fundamentus, Investsite) - PRONTOS
2. 🔄 Script save_google_cookies.py - A CRIAR
3. 🔄 Scrapers com OAuth (Fundamentei, Investidor10) - A CRIAR

**STATUS:**
- Fundamentus: ✅ Implementado (sem login)
- Investsite: ✅ Implementado (sem login)
- StatusInvest: 🟡 Básico implementado (pode melhorar com cookies)
- Fundamentei: ⏳ Aguardando cookies
- Investidor10: ⏳ Aguardando cookies

---

**Última atualização:** 2025-11-07
**Próxima revisão:** Após testes com cookies
