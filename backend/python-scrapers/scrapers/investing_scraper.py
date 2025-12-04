# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Investing.com Scraper - Market data and analysis
Fonte: https://br.investing.com/
Requer login via Google OAuth (opcional)

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
import json
import re
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
        """Initialize Playwright browser and optionally load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    investing_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and 'investing.com' in cookie.get('domain', ''):
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

                            investing_cookies.append(pw_cookie)

                    if investing_cookies:
                        await self.page.context.add_cookies(investing_cookies)
                        logger.info(f"Loaded {len(investing_cookies)} cookies for Investing.com")
                        await self.page.reload()
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load Investing.com cookies: {e}")
            else:
                logger.debug("Investing.com cookies not found. Using without login.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Investing.com scraper: {e}")
            raise

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
                except:
                    pass

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
                        except:
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
                        except:
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
                        except:
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
                        except:
                            pass

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
