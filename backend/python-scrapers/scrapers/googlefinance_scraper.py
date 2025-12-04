# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Google Finance Scraper - Real-time quotes and market data
Fonte: https://www.google.com/finance/
Requer login via Google OAuth (opcional - funciona sem login com dados básicos)

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


class GoogleFinanceScraper(BaseScraper):
    """
    Scraper for Google Finance quotes

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing

    Provides:
    - Real-time price data
    - Price changes
    - Volume information
    - Market statistics
    - Company information
    """

    BASE_URL = "https://www.google.com/finance"
    COOKIES_FILE = Path("/app/data/cookies/google_session.json")

    def __init__(self):
        super().__init__(
            name="GoogleFinance",
            source="GOOGLE_FINANCE",
            requires_login=False,  # Works without login for basic data
        )

    async def initialize(self):
        """Initialize Playwright browser and optionally load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # Navigate to Google first
            await self.page.goto("https://www.google.com", wait_until="load")
            await asyncio.sleep(1)

            # Load Google OAuth cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    # Filter and convert cookies for Playwright
                    google_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and 'google.com' in cookie.get('domain', ''):
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

                            google_cookies.append(pw_cookie)

                    if google_cookies:
                        await self.page.context.add_cookies(google_cookies)
                        logger.info(f"Loaded {len(google_cookies)} cookies for GoogleFinance")

                except Exception as e:
                    logger.warning(f"Could not load Google cookies: {e}")
            else:
                logger.debug("Google cookies not found. Using without login.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Google Finance scraper: {e}")
            raise

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape quotes from Google Finance

        Args:
            ticker: Stock ticker (e.g., 'PETR4' or 'BVMF:PETR4')

        Returns:
            ScraperResult with quote data
        """
        try:
            if not self.page:
                await self.initialize()

            # Format ticker for Google Finance (BVMF for Brazilian stocks)
            if ":" not in ticker:
                formatted_ticker = f"BVMF:{ticker.upper()}"
            else:
                formatted_ticker = ticker.upper()

            # Navigate to quote page
            url = f"{self.BASE_URL}/quote/{formatted_ticker}"
            logger.info(f"Navigating to {url}")

            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # OPTIMIZATION: Get HTML once and parse locally with BeautifulSoup
            html_content = await self.page.content()

            # Check if ticker exists
            html_lower = html_content.lower()
            if "não encontrado" in html_lower or "not found" in html_lower or "we couldn't find" in html_lower:
                # Try without BVMF prefix
                if formatted_ticker.startswith("BVMF:"):
                    ticker_no_prefix = formatted_ticker.replace("BVMF:", "")
                    url = f"{self.BASE_URL}/quote/{ticker_no_prefix}"
                    await self.page.goto(url, wait_until="load", timeout=60000)
                    await asyncio.sleep(2)
                    html_content = await self.page.content()
                else:
                    return ScraperResult(
                        success=False,
                        error=f"Ticker {ticker} not found on Google Finance",
                        source=self.source,
                    )

            # Extract quote data using BeautifulSoup
            data = self._extract_data(ticker, html_content)

            if data and data.get("price"):
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
                    error="Failed to extract quote data from Google Finance",
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
        Extract quote data from Google Finance page

        OPTIMIZED: Uses BeautifulSoup for local parsing (no await operations)
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "ticker": ticker.upper(),
                "company_name": None,
                "price": None,
                "change": None,
                "change_percent": None,
                "volume": None,
                "high": None,
                "low": None,
                "open": None,
                "prev_close": None,
                "market_cap": None,
                "pe_ratio": None,
            }

            # Company name - Google Finance uses div.zzDege
            name_selectors = ["div.zzDege", "h1", "[class*='company']"]
            for selector in name_selectors:
                name_elem = soup.select_one(selector)
                if name_elem and name_elem.get_text().strip():
                    data["company_name"] = name_elem.get_text().strip()
                    break

            # Current price - div.YMlKec.fxKbKc
            price_selectors = ["div.YMlKec.fxKbKc", "div[class*='YMlKec']", "[data-last-price]"]
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    # Remove currency symbols and format
                    price_text = re.sub(r'[R$\s,]', '', price_text).replace('.', '')
                    # Handle Brazilian format (123,45 -> 123.45)
                    if ',' in price_text:
                        price_text = price_text.replace(',', '.')
                    price_match = re.search(r'[\d.]+', price_text)
                    if price_match:
                        data["price"] = float(price_match.group())
                        break

            # Try data attribute for price
            if not data["price"]:
                price_elem = soup.select_one("[data-last-price]")
                if price_elem:
                    price_val = price_elem.get("data-last-price")
                    if price_val:
                        try:
                            data["price"] = float(price_val)
                        except:
                            pass

            # Price change - div.JwB6zf
            change_selectors = ["div.JwB6zf", "[class*='JwB6zf']"]
            for selector in change_selectors:
                change_elem = soup.select_one(selector)
                if change_elem:
                    change_text = change_elem.get_text().strip()

                    # Extract change value
                    change_match = re.search(r'([-+]?[\d.,]+)', change_text)
                    if change_match:
                        change_val = change_match.group(1).replace(',', '.')
                        try:
                            data["change"] = float(change_val)
                        except:
                            pass

                    # Extract percent
                    percent_match = re.search(r'\(([-+]?[\d.,]+)%\)', change_text)
                    if percent_match:
                        percent_val = percent_match.group(1).replace(',', '.')
                        try:
                            data["change_percent"] = float(percent_val)
                        except:
                            pass

                    if data["change"] or data["change_percent"]:
                        break

            # Stats from data panel - Google Finance uses specific div structure
            stat_sections = soup.select("div.P6K39c")
            for section in stat_sections:
                try:
                    label_elem = section.select_one("div.mfs7Fc")
                    value_elem = section.select_one("div.P6K39c")

                    if label_elem and value_elem:
                        label = label_elem.get_text().strip().lower()
                        value = value_elem.get_text().strip()
                        self._parse_stat(data, label, value)
                except:
                    continue

            # Alternative stat extraction from table-like structure
            rows = soup.select("div[class*='gyFHrc']")
            for row in rows:
                try:
                    parts = row.get_text().strip().split("\n")
                    if len(parts) >= 2:
                        label = parts[0].lower()
                        value = parts[1]
                        self._parse_stat(data, label, value)
                except:
                    continue

            logger.debug(f"Extracted Google Finance data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    def _parse_stat(self, data: dict, label: str, value: str):
        """Parse a stat label/value pair"""
        try:
            label = label.lower().strip()

            # Volume
            if "volume" in label or "vol" in label:
                volume_text = value.replace(".", "").replace(",", "")
                volume_match = re.search(r'([\d.]+)([KMB])?', volume_text, re.IGNORECASE)
                if volume_match:
                    val = float(volume_match.group(1))
                    suffix = volume_match.group(2)
                    if suffix:
                        multiplier = {"K": 1000, "M": 1000000, "B": 1000000000}.get(suffix.upper(), 1)
                        data["volume"] = int(val * multiplier)
                    else:
                        data["volume"] = int(val)

            # High
            elif "high" in label or "máxima" in label or "alta" in label:
                value_text = value.replace(",", ".")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["high"] = float(value_match.group())

            # Low
            elif "low" in label or "mínima" in label or "baixa" in label:
                value_text = value.replace(",", ".")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["low"] = float(value_match.group())

            # Open
            elif "open" in label or "abertura" in label:
                value_text = value.replace(",", ".")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["open"] = float(value_match.group())

            # Previous close
            elif "prev" in label or "anterior" in label or "close" in label:
                value_text = value.replace(",", ".")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["prev_close"] = float(value_match.group())

            # Market cap
            elif "market cap" in label or "cap" in label or "capitalização" in label:
                data["market_cap"] = value

            # P/E ratio
            elif "p/e" in label or "pe" in label or "p/l" in label:
                value_match = re.search(r'[\d.]+', value)
                if value_match:
                    data["pe_ratio"] = float(value_match.group())

        except Exception as e:
            logger.debug(f"Error parsing stat {label}: {e}")

    async def health_check(self) -> bool:
        """Check if Google Finance is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_googlefinance():
    """Test Google Finance scraper"""
    scraper = GoogleFinanceScraper()

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
    asyncio.run(test_googlefinance())
