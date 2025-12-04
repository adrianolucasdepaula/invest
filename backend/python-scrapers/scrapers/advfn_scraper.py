# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
ADVFN Scraper - Market analysis and technical indicators
Fonte: https://br.advfn.com/
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


class ADVFNScraper(BaseScraper):
    """
    Scraper for ADVFN market analysis

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing

    Provides:
    - Real-time quotes
    - Price and volume data
    - Technical analysis
    - Market indicators
    - Financial ratios
    """

    BASE_URL = "https://br.advfn.com"
    COOKIES_FILE = Path("/app/data/cookies/advfn_session.json")

    def __init__(self):
        super().__init__(
            name="ADVFN",
            source="ADVFN",
            requires_login=False,  # Works without login for basic data
        )

    async def initialize(self):
        """Initialize Playwright browser and optionally load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # Navigate to base URL
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    advfn_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and 'advfn.com' in cookie.get('domain', ''):
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

                            advfn_cookies.append(pw_cookie)

                    if advfn_cookies:
                        await self.page.context.add_cookies(advfn_cookies)
                        logger.info(f"Loaded {len(advfn_cookies)} cookies for ADVFN")
                        await self.page.reload()
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load ADVFN cookies: {e}")
            else:
                logger.debug("ADVFN cookies not found. Using without login.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing ADVFN scraper: {e}")
            raise

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
