# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Opcoes.net.br Scraper - Análise de opções
Fonte: https://opcoes.net.br/
Requer login com credenciais específicas

OPTIMIZED: Uses Playwright for browser automation + BeautifulSoup for parsing
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult
from config import settings


class OpcoesNetScraper(BaseScraper):
    """
    Scraper para análise de opções do Opcoes.net.br

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation

    REQUER LOGIN com credenciais específicas

    Dados extraídos:
    - Preços de opções
    - Volatilidade implícita
    - IV Rank
    - Vencimentos
    - Greeks (Delta, Gamma, Theta, Vega)
    - Prêmios
    """

    BASE_URL = "https://opcoes.net.br"
    LOGIN_URL = "https://opcoes.net.br/login"
    COOKIES_FILE = Path("/app/data/cookies/opcoes_session.json")

    def __init__(self):
        super().__init__(
            name="OpcoesNet",
            source="OPCOES_NET",
            requires_login=True,  # REQUER LOGIN!
        )

    async def initialize(self):
        """Initialize Playwright browser and perform login"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            logger.info(f"Logging into {self.name}...")

            # Navigate to login page
            await self.page.goto(self.LOGIN_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    opcoes_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and 'opcoes.net.br' in cookie.get('domain', ''):
                            pw_cookie = {
                                'name': cookie.get('name'),
                                'value': cookie.get('value'),
                                'domain': cookie.get('domain'),
                                'path': cookie.get('path', '/'),
                            }
                            if 'expires' in cookie and cookie['expires']:
                                pw_cookie['expires'] = cookie['expires']
                            if 'httpOnly' in cookie:
                                pw_cookie['httpOnly'] = cookie['httpOnly']
                            if 'secure' in cookie:
                                pw_cookie['secure'] = cookie['secure']

                            opcoes_cookies.append(pw_cookie)

                    if opcoes_cookies:
                        await self.page.context.add_cookies(opcoes_cookies)
                        logger.info(f"Loaded {len(opcoes_cookies)} cookies for OpcoesNet")
                        await self.page.reload()
                        await asyncio.sleep(3)

                        # Check if already logged in
                        if await self._verify_logged_in():
                            logger.success(f"{self.name} logged in via cookies")
                            self._initialized = True
                            return

                except Exception as e:
                    logger.warning(f"Could not load OpcoesNet cookies: {e}")

            # Get credentials from settings
            username = getattr(settings, 'OPCOES_USERNAME', None)
            password = getattr(settings, 'OPCOES_PASSWORD', None)

            if not username or not password:
                logger.warning(
                    "Opcoes.net.br credentials not configured. "
                    "Please set OPCOES_USERNAME and OPCOES_PASSWORD in .env"
                )
                self._initialized = True  # Initialize anyway, will fail on scrape
                return

            # Perform login
            await self._perform_login(username, password)

            # Verify login successful
            await asyncio.sleep(3)

            if not await self._verify_logged_in():
                logger.warning("Login failed - please check credentials or manual login required")

            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            raise

    async def _perform_login(self, username: str, password: str):
        """Perform login using Playwright"""
        try:
            # Try multiple selectors for username/CPF field
            username_selectors = [
                "input[name='username']",
                "input[name='cpf']",
                "input[name='email']",
                "input[type='text']",
                "#username",
                "#cpf",
            ]

            username_filled = False
            for selector in username_selectors:
                try:
                    username_field = await self.page.query_selector(selector)
                    if username_field and await username_field.is_visible():
                        await username_field.fill(username)
                        username_filled = True
                        logger.debug(f"Username filled with selector: {selector}")
                        break
                except:
                    continue

            if not username_filled:
                logger.warning("Could not find username/CPF field")
                return

            # Password field
            password_selectors = [
                "input[name='password']",
                "input[name='senha']",
                "input[type='password']",
                "#password",
                "#senha",
            ]

            password_filled = False
            for selector in password_selectors:
                try:
                    password_field = await self.page.query_selector(selector)
                    if password_field and await password_field.is_visible():
                        await password_field.fill(password)
                        password_filled = True
                        logger.debug(f"Password filled with selector: {selector}")
                        break
                except:
                    continue

            if not password_filled:
                logger.warning("Could not find password field")
                return

            # Submit form
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button.btn-login",
                "button.login-button",
                ".btn-primary",
            ]

            submitted = False
            for selector in submit_selectors:
                try:
                    submit_button = await self.page.query_selector(selector)
                    if submit_button and await submit_button.is_visible():
                        await submit_button.click()
                        submitted = True
                        logger.debug(f"Form submitted with selector: {selector}")
                        break
                except:
                    continue

            if not submitted:
                # Try pressing Enter as fallback
                await self.page.keyboard.press("Enter")
                logger.debug("Form submitted via Enter key")

        except Exception as e:
            logger.error(f"Error performing login: {e}")

    async def _verify_logged_in(self) -> bool:
        """Verify that user is logged in"""
        try:
            html_content = await self.page.content()

            # Check for logout/sair indicators
            logout_keywords = ["sair", "logout", "minha conta", "meu perfil"]
            for keyword in logout_keywords:
                if keyword in html_content.lower():
                    logger.debug(f"Found logged-in indicator: {keyword}")
                    return True

            # Check if still on login page (indicates failure)
            current_url = self.page.url
            if "login" in current_url.lower():
                return False

            # Check for error messages
            error_keywords = ["inválid", "incorret", "erro", "falha"]
            for keyword in error_keywords:
                if keyword in html_content.lower():
                    logger.warning(f"Found error indicator: {keyword}")
                    return False

            return "login" not in current_url.lower()

        except Exception as e:
            logger.debug(f"Login verification error: {e}")
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape options data

        Args:
            ticker: Stock ticker without number (e.g., 'PETR' for PETR4)

        Returns:
            ScraperResult with options data
        """
        try:
            if not self.page:
                await self.initialize()

            # Navigate to ticker options page
            ticker_clean = re.sub(r'\d+$', '', ticker.upper())  # Remove trailing numbers
            url = f"{self.BASE_URL}/opcoes/{ticker_clean}"

            logger.info(f"Navigating to {url}")
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally
            html_content = await self.page.content()

            # Check if ticker exists
            if "não encontrado" in html_content.lower():
                return ScraperResult(
                    success=False,
                    error=f"Options for {ticker} not found",
                    source=self.source,
                )

            # Extract data using BeautifulSoup
            data = self._extract_data(html_content, ticker_clean)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": url,
                        "requires_login": True,
                    },
                )

            return ScraperResult(
                success=False,
                error="Failed to extract options data",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_data(self, html_content: str, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract options data from page

        OPTIMIZED: Uses BeautifulSoup for local parsing
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "ticker": ticker.upper(),
                "underlying_price": None,
                "iv_rank": None,  # Implied Volatility Rank
                "iv_percentile": None,
                "options_chain": [],
                "scraped_at": datetime.now().isoformat(),
            }

            # Underlying price
            price_selectors = [
                ".underlying-price",
                ".stock-price",
                "[data-field='price']",
            ]

            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text().strip().replace("R$", "").replace(",", ".")
                    try:
                        data["underlying_price"] = float(price_text)
                        break
                    except:
                        continue

            # IV Rank
            iv_selectors = [
                ".iv-rank",
                "[data-field='iv-rank']",
            ]

            for selector in iv_selectors:
                iv_elem = soup.select_one(selector)
                if iv_elem:
                    iv_text = iv_elem.get_text().strip().replace("%", "")
                    try:
                        data["iv_rank"] = float(iv_text)
                        break
                    except:
                        continue

            # Options chain (calls and puts)
            tables = soup.select("table")

            for table in tables:
                headers = table.select("th")
                header_text = " ".join([h.get_text().lower() for h in headers])

                if "strike" in header_text or "vencimento" in header_text or "prêmio" in header_text:
                    options = self._parse_options_table(table)
                    data["options_chain"].extend(options)

            logger.debug(f"Extracted Opcoes.net data for {ticker}: {len(data['options_chain'])} options")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _parse_options_table(self, table) -> List[Dict[str, Any]]:
        """Parse options chain table using BeautifulSoup"""
        options = []

        try:
            rows = table.select("tr")

            for row in rows[1:]:  # Skip header
                cells = row.select("td")

                if len(cells) >= 3:
                    try:
                        option = {
                            "symbol": None,
                            "type": None,  # CALL or PUT
                            "strike": None,
                            "expiration": None,
                            "bid": None,
                            "ask": None,
                            "last": None,
                            "volume": None,
                            "open_interest": None,
                            "iv": None,  # Implied Volatility
                            "delta": None,
                            "gamma": None,
                            "theta": None,
                            "vega": None,
                        }

                        cell_texts = [cell.get_text().strip() for cell in cells]

                        # Try to identify and parse each field
                        for i, text in enumerate(cell_texts):
                            if not text or text == "-":
                                continue

                            # Symbol
                            if i == 0 and len(text) >= 4:
                                option["symbol"] = text
                                # Determine type from symbol
                                if re.search(r'[A-Z]\d+$', text):
                                    option["type"] = "CALL" if text[-3].isalpha() and text[-3] < 'N' else "PUT"

                            # Numeric values
                            num = self._parse_number(text)
                            if num is not None:
                                if option["strike"] is None:
                                    option["strike"] = num
                                elif option["last"] is None:
                                    option["last"] = num
                                elif option["bid"] is None:
                                    option["bid"] = num
                                elif option["ask"] is None:
                                    option["ask"] = num

                        # Only add if has minimum data
                        if option["symbol"] and option["strike"]:
                            options.append(option)

                    except Exception as e:
                        logger.debug(f"Error parsing option row: {e}")
                        continue

        except Exception as e:
            logger.debug(f"Error parsing options table: {e}")

        return options

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            text = text.replace("R$", "").replace(".", "").replace(",", ".").strip()
            return float(text)
        except:
            return None

    async def health_check(self) -> bool:
        """Check if Opcoes.net.br is accessible"""
        try:
            await self.initialize()
            return await self._verify_logged_in()
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_opcoes():
    """Test Opcoes.net.br scraper"""
    scraper = OpcoesNetScraper()

    try:
        result = await scraper.scrape("PETR")

        if result.success:
            print("✅ Success!")
            print(f"Underlying price: R$ {result.data.get('underlying_price')}")
            print(f"IV Rank: {result.data.get('iv_rank')}%")
            print(f"Options found: {len(result.data['options_chain'])}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_opcoes())
