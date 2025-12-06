# MIGRATED TO PLAYWRIGHT - 2025-12-04
# UPDATED: 2025-12-06 - Added credentials-based login (NOT OAuth)
"""
ADVFN Scraper - Market analysis and technical indicators
Fonte: https://br.advfn.com/
Requer login via credenciais (email/password) - NÃO usa OAuth

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class ADVFNScraper(BaseScraper):
    """
    Scraper for ADVFN market analysis

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing
    UPDATED: 2025-12-06 - Uses credentials-based login (NOT OAuth)

    Provides:
    - Real-time quotes
    - Price and volume data
    - Technical analysis
    - Market indicators
    - Financial ratios
    """

    BASE_URL = "https://br.advfn.com"
    LOGIN_URL = "https://br.advfn.com/common/account/login"
    COOKIES_FILE = Path("/app/data/cookies/advfn_session.json")

    def __init__(self):
        super().__init__(
            name="ADVFN",
            source="ADVFN",
            requires_login=False,  # Works without login for basic data
        )
        # Credentials from environment variables
        self.username = os.getenv("ADVFN_USERNAME", "")
        self.password = os.getenv("ADVFN_PASSWORD", "")

    async def initialize(self):
        """Initialize Playwright browser, load cookies, and optionally login with credentials"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # STEP 1: Load cookies BEFORE navigation (if available)
            cookies_loaded = await self._load_cookies_to_context()

            # STEP 2: Navigate to site with cookies already set
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # STEP 3: Check if we're logged in
            is_logged_in = await self._verify_logged_in()

            if is_logged_in:
                logger.info("ADVFN: Session active from cookies")
            elif self.username and self.password:
                # STEP 4: Try credentials-based login if cookies didn't work
                logger.info("ADVFN: Attempting credentials-based login")
                login_success = await self._perform_login()
                if login_success:
                    logger.success("ADVFN: Login successful with credentials")
                    # Save session for future use
                    await self._save_session_cookies()
                else:
                    logger.warning("ADVFN: Login failed - continuing without authentication")
            else:
                logger.debug("ADVFN: No credentials configured - using without login")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing ADVFN scraper: {e}")
            raise

    async def _load_cookies_to_context(self) -> bool:
        """
        Load cookies to browser context BEFORE navigation

        Returns:
            True if cookies were loaded successfully
        """
        if not self.COOKIES_FILE.exists():
            logger.debug(f"ADVFN cookies file not found: {self.COOKIES_FILE}")
            return False

        try:
            with open(self.COOKIES_FILE, 'r', encoding='utf-8') as f:
                session_data = json.load(f)

            # Handle both formats
            if isinstance(session_data, list):
                cookies = session_data
            else:
                cookies = session_data.get('cookies', [])

            if not cookies:
                return False

            # Filter and validate cookies
            valid_cookies = []
            for cookie in cookies:
                domain = cookie.get('domain', '')
                if 'advfn.com' in domain:
                    # Check expiration
                    expires = cookie.get('expires') or cookie.get('expirationDate')
                    if expires and expires > 0 and expires < time.time():
                        continue  # Skip expired cookies

                    pw_cookie = {
                        'name': cookie.get('name'),
                        'value': str(cookie.get('value', '')),
                        'domain': domain if domain.startswith('.') else '.' + domain,
                        'path': cookie.get('path', '/'),
                    }

                    if expires and expires > 0:
                        pw_cookie['expires'] = expires
                    if 'httpOnly' in cookie:
                        pw_cookie['httpOnly'] = cookie['httpOnly']
                    if 'secure' in cookie:
                        pw_cookie['secure'] = cookie['secure']

                    valid_cookies.append(pw_cookie)

            if valid_cookies:
                await self.page.context.add_cookies(valid_cookies)
                logger.info(f"ADVFN: Loaded {len(valid_cookies)} cookies BEFORE navigation")
                return True

            return False

        except Exception as e:
            logger.warning(f"ADVFN: Could not load cookies: {e}")
            return False

    async def _verify_logged_in(self) -> bool:
        """Check if logged in to ADVFN"""
        try:
            html = await self.page.content()
            html_lower = html.lower()

            # Logged-in indicators
            logged_in_indicators = ['logout', 'sair', 'minha conta', 'my account', 'user-menu', 'profile']
            if any(indicator in html_lower for indicator in logged_in_indicators):
                return True

            # Not logged-in indicators
            not_logged_indicators = ['entrar', 'login', 'sign in', 'cadastrar']
            # Check if login button is prominently visible
            soup = BeautifulSoup(html, 'html.parser')
            login_links = soup.select('a[href*="login"], a[href*="entrar"]')
            if login_links:
                return False

            return False

        except Exception:
            return False

    async def _perform_login(self) -> bool:
        """
        Perform credentials-based login to ADVFN

        Returns:
            True if login was successful
        """
        if not self.username or not self.password:
            logger.warning("ADVFN credentials not configured")
            return False

        try:
            # Navigate to login page
            await self.page.goto(self.LOGIN_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Find and fill username/email field
            email_selectors = [
                'input[name="username"]',
                'input[name="email"]',
                'input[type="email"]',
                'input[id*="user"]',
                'input[id*="email"]',
                '#login_username',
            ]

            email_filled = False
            for selector in email_selectors:
                try:
                    email_input = await self.page.query_selector(selector)
                    if email_input:
                        await email_input.fill(self.username)
                        email_filled = True
                        logger.debug(f"ADVFN: Filled email using selector: {selector}")
                        break
                except Exception:
                    continue

            if not email_filled:
                logger.error("ADVFN: Could not find email/username field")
                return False

            # Find and fill password field
            password_selectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[id*="password"]',
                '#login_password',
            ]

            password_filled = False
            for selector in password_selectors:
                try:
                    password_input = await self.page.query_selector(selector)
                    if password_input:
                        await password_input.fill(self.password)
                        password_filled = True
                        logger.debug(f"ADVFN: Filled password using selector: {selector}")
                        break
                except Exception:
                    continue

            if not password_filled:
                logger.error("ADVFN: Could not find password field")
                return False

            # Find and click submit button
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button[id*="login"]',
                '.login-button',
                '#login_submit',
            ]

            submit_clicked = False
            for selector in submit_selectors:
                try:
                    submit_btn = await self.page.query_selector(selector)
                    if submit_btn:
                        await submit_btn.click()
                        submit_clicked = True
                        logger.debug(f"ADVFN: Clicked submit using selector: {selector}")
                        break
                except Exception:
                    continue

            if not submit_clicked:
                # Try pressing Enter on password field
                try:
                    await self.page.keyboard.press("Enter")
                    submit_clicked = True
                except Exception:
                    logger.error("ADVFN: Could not submit login form")
                    return False

            # Wait for navigation/response
            await asyncio.sleep(5)

            # Verify login success
            return await self._verify_logged_in()

        except Exception as e:
            logger.error(f"ADVFN: Login error: {e}")
            return False

    async def _save_session_cookies(self) -> bool:
        """Save session cookies for future use"""
        try:
            cookies = await self.page.context.cookies()

            # Filter ADVFN cookies
            advfn_cookies = [c for c in cookies if 'advfn.com' in c.get('domain', '')]

            if advfn_cookies:
                # Ensure directory exists
                self.COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)

                session_data = {
                    'cookies': advfn_cookies,
                    'saved_at': datetime.now().isoformat(),
                }

                with open(self.COOKIES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(session_data, f, indent=2)

                logger.info(f"ADVFN: Saved {len(advfn_cookies)} session cookies")
                return True

            return False

        except Exception as e:
            logger.error(f"ADVFN: Error saving session cookies: {e}")
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape market analysis from ADVFN

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with market analysis data
        """
        try:
            if not self.page:
                await self.initialize()

            # Navigate to stock page (BOVESPA format)
            ticker_clean = ticker.upper().replace(".SA", "")
            url = f"{self.BASE_URL}/bolsa-de-valores/bovespa/{ticker_clean}/cotacao"
            logger.info(f"Navigating to {url}")

            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # OPTIMIZATION: Get HTML once and parse locally with BeautifulSoup
            html_content = await self.page.content()

            # Check if ticker exists
            html_lower = html_content.lower()
            if "não encontrado" in html_lower or "not found" in html_lower:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on ADVFN",
                    source=self.source,
                )

            # Extract market data using BeautifulSoup
            data = self._extract_data(ticker_clean, html_content)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": url,
                        "timestamp": datetime.now().isoformat(),
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract market data from ADVFN",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_data(self, ticker: str, html_content: str) -> Optional[Dict[str, Any]]:
        """
        Extract market analysis data from ADVFN page

        OPTIMIZED: Uses BeautifulSoup for local parsing (no await operations)
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "ticker": ticker.upper(),
                "price": None,
                "change": None,
                "change_percent": None,
                "volume": None,
                "high": None,
                "low": None,
                "open": None,
                "bid": None,
                "ask": None,
                "avg_volume": None,
            }

            # Current price - multiple strategies
            price_selectors = [
                "span.lastprice",
                ".quote-price",
                "#quote-price",
                "[class*='price']",
                ".cotacao",
            ]

            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    price_text = price_text.replace("R$", "").replace(",", ".").strip()
                    price_match = re.search(r'[\d.]+', price_text)
                    if price_match:
                        try:
                            data["price"] = float(price_match.group())
                            break
                        except:
                            continue

            # Change and change percent
            change_selectors = [
                "span.pricechange",
                ".quote-change",
                "[class*='change']",
                ".variacao",
            ]

            for selector in change_selectors:
                change_elem = soup.select_one(selector)
                if change_elem:
                    change_text = change_elem.get_text().strip()

                    # Extract change value
                    change_match = re.search(r'([-+]?[\d.,]+)', change_text)
                    if change_match:
                        change_val = change_match.group(1).replace(",", ".")
                        try:
                            data["change"] = float(change_val)
                        except:
                            pass

                    # Extract percent
                    percent_match = re.search(r'([-+]?[\d.,]+)%', change_text)
                    if percent_match:
                        percent_val = percent_match.group(1).replace(",", ".")
                        try:
                            data["change_percent"] = float(percent_val)
                        except:
                            pass

                    if data["change"] or data["change_percent"]:
                        break

            # Extract from tables
            field_mappings = {
                "máxima": "high",
                "max": "high",
                "alta": "high",
                "mínima": "low",
                "min": "low",
                "baixa": "low",
                "abertura": "open",
                "open": "open",
                "compra": "bid",
                "bid": "bid",
                "venda": "ask",
                "ask": "ask",
                "volume": "volume",
            }

            # Find all table rows
            rows = soup.select("tr")
            for row in rows:
                cells = row.select("td")
                if len(cells) >= 2:
                    label = cells[0].get_text().strip().lower()
                    value_text = cells[1].get_text().strip()

                    for key, field in field_mappings.items():
                        if key in label:
                            value_text_clean = value_text.replace("R$", "").replace(",", ".")
                            value_match = re.search(r'[\d.]+', value_text_clean)
                            if value_match:
                                try:
                                    if field == "volume":
                                        # Handle volume with K, M, B suffixes
                                        vol_text = value_text.replace(".", "").replace(",", "")
                                        vol_match = re.search(r'([\d.]+)([KMB])?', vol_text, re.IGNORECASE)
                                        if vol_match:
                                            val = float(vol_match.group(1))
                                            suffix = vol_match.group(2)
                                            if suffix:
                                                multiplier = {"K": 1000, "M": 1000000, "B": 1000000000}.get(suffix.upper(), 1)
                                                data[field] = int(val * multiplier)
                                            else:
                                                data[field] = int(val)
                                    else:
                                        data[field] = float(value_match.group())
                                except:
                                    pass

            logger.debug(f"Extracted ADVFN data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if ADVFN is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_advfn():
    """Test ADVFN scraper"""
    scraper = ADVFNScraper()

    try:
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_advfn())
