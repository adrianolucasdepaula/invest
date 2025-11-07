"""
Cookie Manager - Automatic verification and management of Google OAuth cookies
"""
import os
import pickle
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pathlib import Path
from loguru import logger
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By


class CookieManager:
    """Manage and verify Google OAuth cookies"""

    COOKIES_FILE = os.getenv("COOKIES_FILE", "/app/browser-profiles/google_cookies.pkl")
    COOKIES_MAX_AGE_DAYS = int(os.getenv("COOKIES_MAX_AGE_DAYS", "7"))

    # Sites that require Google OAuth
    OAUTH_SITES = [
        "fundamentei.com",
        "investidor10.com.br",
        "statusinvest.com.br",
        "br.investing.com",
        "br.advfn.com",
        "google.com/finance",
        "br.tradingview.com",
        "chatgpt.com",
        "gemini.google.com",
        "deepseek.com",
        "claude.ai",
        "grok.com",
        "valor.globo.com",
        "exame.com",
        "infomoney.com.br",
        "einvestidor.estadao.com.br",
        "maisretorno.com",
    ]

    def __init__(self):
        self.cookies_path = Path(self.COOKIES_FILE)
        self.cookies_path.parent.mkdir(parents=True, exist_ok=True)

    async def check_cookies_status(self) -> Dict[str, any]:
        """
        Check status of saved cookies

        Returns:
            Dict with status information
        """
        status = {
            "exists": False,
            "valid": False,
            "age_days": None,
            "expires_in_days": None,
            "needs_renewal": False,
            "sites_covered": [],
            "last_modified": None,
        }

        # Check if file exists
        if not self.cookies_path.exists():
            logger.warning("Cookies file not found")
            return status

        status["exists"] = True

        # Check file age
        file_mtime = self.cookies_path.stat().st_mtime
        file_date = datetime.fromtimestamp(file_mtime)
        age = datetime.now() - file_date
        status["age_days"] = age.days
        status["last_modified"] = file_date.isoformat()

        # Check if needs renewal
        expires_in = self.COOKIES_MAX_AGE_DAYS - age.days
        status["expires_in_days"] = max(0, expires_in)
        status["needs_renewal"] = age.days >= self.COOKIES_MAX_AGE_DAYS

        # Load and analyze cookies
        try:
            with open(self.cookies_path, 'rb') as f:
                cookies = pickle.load(f)

            # Extract domains
            domains = set()
            for cookie in cookies:
                domain = cookie.get('domain', '')
                if domain:
                    domains.add(domain.lstrip('.'))

            status["sites_covered"] = list(domains)
            status["valid"] = len(domains) > 0

            logger.info(f"Cookies status: {len(domains)} domains, age={age.days} days")

        except Exception as e:
            logger.error(f"Error reading cookies: {e}")
            status["valid"] = False

        return status

    async def verify_cookies_work(self, test_sites: Optional[List[str]] = None) -> Dict[str, bool]:
        """
        Verify that cookies actually work by testing login

        Args:
            test_sites: List of sites to test (defaults to all OAuth sites)

        Returns:
            Dict mapping site -> login_success
        """
        if test_sites is None:
            test_sites = self.OAUTH_SITES[:3]  # Test first 3 by default

        results = {}

        for site in test_sites:
            try:
                success = await self._test_site_login(site)
                results[site] = success
                logger.info(f"Cookie test for {site}: {'✓' if success else '✗'}")
            except Exception as e:
                logger.error(f"Error testing {site}: {e}")
                results[site] = False

        return results

    async def _test_site_login(self, site: str) -> bool:
        """Test if cookies work for a specific site"""
        driver = None
        try:
            # Create headless Chrome
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')

            driver = webdriver.Chrome(options=options)

            # Navigate to site
            url = f"https://{site}"
            driver.get(url)
            await asyncio.sleep(2)

            # Load cookies
            with open(self.cookies_path, 'rb') as f:
                cookies = pickle.load(f)

            for cookie in cookies:
                if site in cookie.get('domain', ''):
                    try:
                        driver.add_cookie(cookie)
                    except:
                        pass

            # Refresh to apply cookies
            driver.refresh()
            await asyncio.sleep(3)

            # Check for login indicators
            login_indicators = [
                "//a[contains(text(), 'Sair')]",
                "//button[contains(text(), 'Sair')]",
                "//a[contains(@href, 'logout')]",
                ".user-menu",
                ".user-avatar",
                "[data-testid='user-menu']",
            ]

            for indicator in login_indicators:
                try:
                    if indicator.startswith("//"):
                        elements = driver.find_elements(By.XPATH, indicator)
                    else:
                        elements = driver.find_elements(By.CSS_SELECTOR, indicator)

                    if elements:
                        return True
                except:
                    continue

            return False

        except Exception as e:
            logger.error(f"Error testing site {site}: {e}")
            return False

        finally:
            if driver:
                driver.quit()

    async def get_renewal_instructions(self) -> str:
        """Get instructions for renewing cookies"""
        return """
# Como Renovar Cookies Google OAuth

1. Execute o script de renovação:
   ```bash
   docker exec -it invest_scrapers python scripts/save_google_cookies.py
   ```

2. O navegador Chrome abrirá automaticamente

3. Faça login nos seguintes sites com sua conta Google:
   - Fundamentei (https://fundamentei.com)
   - Investidor10 (https://investidor10.com.br)
   - StatusInvest (https://statusinvest.com.br)
   - Investing.com (https://br.investing.com)
   - ADVFN (https://br.advfn.com)
   - Google Finance (https://www.google.com/finance)
   - TradingView (https://br.tradingview.com)
   - ChatGPT (https://chatgpt.com)
   - Gemini (https://gemini.google.com)
   - DeepSeek (https://www.deepseek.com)
   - Claude (https://claude.ai)
   - Grok (https://grok.com)
   - Valor (https://valor.globo.com)
   - Exame (https://exame.com)
   - InfoMoney (https://www.infomoney.com.br)
   - Estadão (https://einvestidor.estadao.com.br)
   - Mais Retorno (https://maisretorno.com)

4. Pressione ENTER no terminal quando terminar

5. Os cookies serão salvos automaticamente

6. Valide com:
   ```bash
   curl http://localhost:3100/api/cookies/status
   ```
"""

    async def auto_check_and_alert(self) -> Dict[str, any]:
        """
        Automatic check with alerts if renewal needed

        Returns:
            Status dict with alert flag
        """
        status = await self.check_cookies_status()

        if not status["exists"]:
            logger.error("🔴 ALERT: Cookies file not found! OAuth scrapers will fail.")
            status["alert_level"] = "critical"
            status["alert_message"] = "Cookies não encontrados. Execute o script de salvamento."

        elif status["needs_renewal"]:
            logger.warning(f"🟡 ALERT: Cookies need renewal (age: {status['age_days']} days)")
            status["alert_level"] = "warning"
            status["alert_message"] = f"Cookies com {status['age_days']} dias. Renovar em breve."

        elif status["expires_in_days"] <= 2:
            logger.warning(f"🟡 ALERT: Cookies expire in {status['expires_in_days']} days")
            status["alert_level"] = "warning"
            status["alert_message"] = f"Cookies expiram em {status['expires_in_days']} dias."

        else:
            logger.info(f"✅ Cookies OK (expires in {status['expires_in_days']} days)")
            status["alert_level"] = "ok"
            status["alert_message"] = f"Cookies válidos por mais {status['expires_in_days']} dias."

        return status


# Global instance
cookie_manager = CookieManager()
