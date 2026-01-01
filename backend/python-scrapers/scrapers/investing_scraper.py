# MIGRATED TO PLAYWRIGHT - 2025-12-04
# UPDATED: 2025-12-06 - Added dual cookie format support + BEFORE navigation loading
"""
Investing.com Scraper - Market data and analysis
Fonte: https://br.investing.com/
Requer login via Google OAuth (opcional)

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class InvestingScraper(BaseScraper):
    """
    Scraper for Investing.com market data

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing

    Provides:
    - Real-time quotes
    - Price changes
    - Volume data
    - Technical indicators
    - Market analysis
    """

    BASE_URL = "https://br.investing.com"
    COOKIES_FILE = Path("/app/data/cookies/investing_session.json")

    def __init__(self):
        super().__init__(
            name="Investing.com",
            source="INVESTING",
            requires_login=False,  # Works without login for basic data
        )

    async def initialize(self):
        """Initialize Playwright browser and optionally load cookies BEFORE navigation"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # STEP 1: Load cookies BEFORE navigation (critical for OAuth sessions)
            cookies_loaded = await self._load_cookies_to_context()

            if cookies_loaded:
                logger.info("Investing.com cookies loaded BEFORE navigation")
            else:
                logger.debug("Investing.com: No cookies loaded - using without login")

            # STEP 2: Now navigate with cookies already set
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Investing.com scraper: {e}")
            raise

    async def _load_cookies_to_context(self) -> bool:
        """
        Load cookies to browser context BEFORE navigation

        Supports both formats:
        - List format: [{name, value, domain, ...}, ...]
        - Dict format: {cookies: [...], localStorage: {...}}

        Returns:
            True if cookies were loaded successfully
        """
        if not self.COOKIES_FILE.exists():
            return False

        try:
            with open(self.COOKIES_FILE, 'r', encoding='utf-8') as f:
                session_data = json.load(f)

            # Handle both formats (list and dict with cookies key)
            if isinstance(session_data, list):
                cookies = session_data
            else:
                cookies = session_data.get('cookies', [])

            if not cookies:
                return False

            # Filter and validate cookies
            valid_cookies = []
            for cookie in cookies:
                if not isinstance(cookie, dict):
                    continue

                domain = cookie.get('domain', '')
                if 'investing.com' not in domain:
                    continue

                # Check cookie expiration
                if not self._is_cookie_valid(cookie):
                    continue

                converted = self._convert_cookie_for_playwright(cookie)
                if converted:
                    valid_cookies.append(converted)

            if valid_cookies:
                await self.page.context.add_cookies(valid_cookies)
                logger.info(f"Loaded {len(valid_cookies)} valid cookies BEFORE navigation")
                return True

            return False

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Investing.com cookies file: {e}")
            return False
        except Exception as e:
            logger.warning(f"Could not load Investing.com cookies: {e}")
            return False

    def _is_cookie_valid(self, cookie: dict) -> bool:
        """Check if cookie is not expired"""
        expires = cookie.get('expires') or cookie.get('expirationDate')
        if expires and expires > 0:
            # expires is Unix timestamp
            return expires > time.time()
        # No expiration = session cookie = valid
        return True

    def _convert_cookie_for_playwright(self, cookie: dict) -> Optional[dict]:
        """
        Convert cookie to Playwright format

        Playwright requires: name, value, domain (or url)
        Optional: path, expires, httpOnly, secure, sameSite
        """
        try:
            name = cookie.get('name')
            value = cookie.get('value')
            domain = cookie.get('domain', '')

            if not name or value is None:
                return None

            # Ensure domain starts with dot for wildcard matching
            if domain and not domain.startswith('.') and not domain.startswith('http'):
                domain = '.' + domain

            pw_cookie = {
                'name': name,
                'value': str(value),
                'domain': domain,
                'path': cookie.get('path', '/'),
            }

            # Optional fields
            expires = cookie.get('expires') or cookie.get('expirationDate')
            if expires and expires > 0:
                pw_cookie['expires'] = expires

            if 'httpOnly' in cookie:
                pw_cookie['httpOnly'] = cookie['httpOnly']

            if 'secure' in cookie:
                pw_cookie['secure'] = cookie['secure']

            if cookie.get('sameSite'):
                # Playwright expects: "Strict", "Lax", "None"
                same_site = cookie['sameSite']
                if same_site.lower() in ['strict', 'lax', 'none']:
                    pw_cookie['sameSite'] = same_site.capitalize()
                    if same_site.lower() == 'none':
                        pw_cookie['sameSite'] = 'None'

            return pw_cookie

        except Exception as e:
            logger.debug(f"Error converting cookie: {e}")
            return None

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape market data from Investing.com

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with market data
        """
        try:
            if not self.page:
                await self.initialize()

            # Map ticker to Investing.com format
            search_ticker = ticker.upper()

            # Navigate to search results or direct page
            url = f"{self.BASE_URL}/equities/{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally with BeautifulSoup
            html_content = await self.page.content()

            # Check if we got a valid page or need to search
            html_lower = html_content.lower()
            if "página não encontrada" in html_lower or "page not found" in html_lower:
                # Try search
                search_url = f"{self.BASE_URL}/search/?q={search_ticker}"
                await self.page.goto(search_url, wait_until="load", timeout=60000)
                await asyncio.sleep(2)

                # Try to click first result
                try:
                    first_result = await self.page.query_selector(".js-section-searchbar-results a, .searchResults a")
                    if first_result:
                        await first_result.click()
                        await asyncio.sleep(3)
                        html_content = await self.page.content()
                except (TimeoutError, Exception) as e:
                    logger.debug(f"Failed to click search result: {e}")

            # Extract market data using BeautifulSoup
            data = self._extract_data(ticker, html_content)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": self.page.url,
                        "timestamp": datetime.now().isoformat(),
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract market data",
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
        Extract market data from Investing.com page

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
                "prev_close": None,
                "market_cap": None,
            }

            # Current price
            price_selectors = [
                "[data-test='instrument-price-last']",
                ".instrument-price_last__KQzyA",
                "span.last-price-value",
                "[class*='price-last']",
                ".quotelast",
            ]

            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text().strip().replace(",", ".")
                    price_match = re.search(r'[\d.]+', price_text)
                    if price_match:
                        try:
                            data["price"] = float(price_match.group())
                            break
                        except (ValueError, TypeError) as e:
                            logger.debug(f"Failed to parse price: {e}")
                            continue

            # Price change
            change_selectors = [
                "[data-test='instrument-price-change']",
                ".instrument-price_change__yU4F7",
                "span.change-value",
                "[class*='price-change']",
            ]

            for selector in change_selectors:
                change_elem = soup.select_one(selector)
                if change_elem:
                    change_text = change_elem.get_text().strip().replace(",", ".")
                    change_match = re.search(r'[-+]?[\d.]+', change_text)
                    if change_match:
                        try:
                            data["change"] = float(change_match.group())
                            break
                        except (ValueError, TypeError) as e:
                            logger.debug(f"Failed to parse change: {e}")
                            continue

            # Change percent
            percent_selectors = [
                "[data-test='instrument-price-change-percent']",
                ".instrument-price_changePercent__KVO8O",
                "span.change-percent",
                "[class*='changePercent']",
            ]

            for selector in percent_selectors:
                percent_elem = soup.select_one(selector)
                if percent_elem:
                    percent_text = percent_elem.get_text().strip().replace("%", "").replace(",", ".")
                    percent_text = percent_text.replace("(", "").replace(")", "")
                    percent_match = re.search(r'[-+]?[\d.]+', percent_text)
                    if percent_match:
                        try:
                            data["change_percent"] = float(percent_match.group())
                            break
                        except (ValueError, TypeError) as e:
                            logger.debug(f"Failed to parse change_percent: {e}")
                            continue

            # Extract from data table (dt/dd pairs)
            table_mappings = {
                "máxima": "high",
                "max": "high",
                "mínima": "low",
                "min": "low",
                "abertura": "open",
                "open": "open",
                "fech. anterior": "prev_close",
                "prev. close": "prev_close",
                "volume": "volume",
                "cap. mercado": "market_cap",
                "market cap": "market_cap",
            }

            # Find dt elements
            dt_elements = soup.select("dt")
            for dt in dt_elements:
                label = dt.get_text().strip().lower()

                for key, field in table_mappings.items():
                    if key in label:
                        try:
                            dd = dt.find_next_sibling("dd")
                            if dd:
                                value_text = dd.get_text().strip().replace(",", ".")

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
                                elif field == "market_cap":
                                    data[field] = value_text
                                else:
                                    value_match = re.search(r'[\d.]+', value_text)
                                    if value_match:
                                        data[field] = float(value_match.group())
                        except (ValueError, TypeError, AttributeError) as e:
                            logger.debug(f"Failed to parse table field {field}: {e}")

            logger.debug(f"Extracted Investing.com data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Investing.com is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_investing():
    """Test Investing.com scraper"""
    scraper = InvestingScraper()

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
    asyncio.run(test_investing())
