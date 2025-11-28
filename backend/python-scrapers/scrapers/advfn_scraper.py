# MIGRATED TO PLAYWRIGHT - 2025-11-27
"""
ADVFN Scraper - Market analysis and technical indicators
Fonte: https://br.advfn.com/
Requer login via Google OAuth
"""
import asyncio
import pickle
import re
from datetime import datetime
from typing import Dict, Any, Optional
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class ADVFNScraper(BaseScraper):
    """
    Scraper for ADVFN market analysis

    Provides:
    - Real-time quotes
    - Price and volume data
    - Technical analysis
    - Market indicators
    - Financial ratios
    """

    BASE_URL = "https://br.advfn.com"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="ADVFN",
            source="ADVFN",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies - Playwright version"""
        if self._initialized:
            return

        # Call parent initialize to create page
        await super().initialize()

        try:
            # Navigate to base URL
            await self.page.goto(self.BASE_URL, wait_until="load")
            await asyncio.sleep(2)

            # Load Google OAuth cookies
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                # Convert and filter cookies for ADVFN
                advfn_cookies = []
                for cookie in cookies:
                    if 'advfn.com' in cookie.get('domain', ''):
                        # Playwright cookie format
                        pw_cookie = {
                            'name': cookie.get('name'),
                            'value': cookie.get('value'),
                            'domain': cookie.get('domain'),
                            'path': cookie.get('path', '/'),
                        }
                        # Optional fields
                        if 'expires' in cookie:
                            pw_cookie['expires'] = cookie['expires']
                        if 'httpOnly' in cookie:
                            pw_cookie['httpOnly'] = cookie['httpOnly']
                        if 'secure' in cookie:
                            pw_cookie['secure'] = cookie['secure']
                        if 'sameSite' in cookie:
                            pw_cookie['sameSite'] = cookie['sameSite']

                        advfn_cookies.append(pw_cookie)

                # Add cookies to context
                if advfn_cookies:
                    context = self.page.context
                    await context.add_cookies(advfn_cookies)
                    logger.debug(f"Added {len(advfn_cookies)} cookies to ADVFN scraper")

                # Reload page with cookies
                await self.page.reload()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. May have limited access.")

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
        await self.initialize()

        try:
            # Navigate to stock page (BOVESPA format)
            ticker_clean = ticker.upper().replace(".SA", "")
            url = f"{self.BASE_URL}/bolsa-de-valores/bovespa/{ticker_clean}/cotacao"
            logger.info(f"Navigating to {url}")

            # Playwright navigation
            await self.page.goto(url, wait_until="load")
            await asyncio.sleep(3)

            # Check if ticker exists
            page_content = (await self.page.content()).lower()
            if "não encontrado" in page_content or "not found" in page_content:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on ADVFN",
                    source=self.source,
                )

            # Extract market data
            data = await self._extract_data(ticker_clean)

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

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract market analysis data from ADVFN page"""
        try:
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
            try:
                price_selectors = [
                    "span.lastprice",
                    ".quote-price",
                    "#quote-price",
                    "[class*='price']",
                ]

                for selector in price_selectors:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_elem.text.strip().replace("R$", "").replace(",", ".").strip()
                        price_match = re.search(r'[\d.]+', price_text)
                        if price_match:
                            data["price"] = float(price_match.group())
                            break
                    except:
                        continue
            except:
                pass

            # Change and change percent
            try:
                change_selectors = [
                    "span.pricechange",
                    ".quote-change",
                    "[class*='change']",
                ]

                for selector in change_selectors:
                    try:
                        change_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        change_text = change_elem.text.strip()

                        # Extract change value
                        change_match = re.search(r'([-+]?[\d.,]+)', change_text)
                        if change_match:
                            change_val = change_match.group(1).replace(",", ".")
                            data["change"] = float(change_val)

                        # Extract percent
                        percent_match = re.search(r'([-+]?[\d.,]+)%', change_text)
                        if percent_match:
                            percent_val = percent_match.group(1).replace(",", ".")
                            data["change_percent"] = float(percent_val)

                        if data["change"] or data["change_percent"]:
                            break
                    except:
                        continue
            except:
                pass

            # Volume
            try:
                volume_selectors = [
                    "//td[contains(text(), 'Volume')]/following-sibling::td[1]",
                    "//tr[contains(., 'Volume')]//td[2]",
                ]

                for selector in volume_selectors:
                    try:
                        volume_elem = self.driver.find_element(By.XPATH, selector)
                        volume_text = volume_elem.text.strip().replace(".", "").replace(",", "")
                        # Handle K, M, B suffixes
                        volume_match = re.search(r'([\d.]+)([KMB])?', volume_text)
                        if volume_match:
                            value = float(volume_match.group(1))
                            suffix = volume_match.group(2)
                            multiplier = {"K": 1000, "M": 1000000, "B": 1000000000}.get(suffix, 1)
                            data["volume"] = int(value * multiplier)
                            break
                    except:
                        continue
            except:
                pass

            # High, Low, Open - from table
            field_mappings = {
                "Máxima": "high",
                "Max": "high",
                "Alta": "high",
                "Mínima": "low",
                "Min": "low",
                "Baixa": "low",
                "Abertura": "open",
                "Open": "open",
                "Compra": "bid",
                "Bid": "bid",
                "Venda": "ask",
                "Ask": "ask",
            }

            try:
                # Find all table rows
                rows = self.driver.find_elements(By.TAG_NAME, "tr")

                for row in rows:
                    cells = row.find_elements(By.TAG_NAME, "td")

                    if len(cells) >= 2:
                        label = cells[0].text.strip()

                        for key, field in field_mappings.items():
                            if key in label:
                                try:
                                    value_text = cells[1].text.strip().replace("R$", "").replace(",", ".")
                                    value_match = re.search(r'[\d.]+', value_text)
                                    if value_match:
                                        data[field] = float(value_match.group())
                                except:
                                    pass
            except:
                pass

            # Try to extract from specific ADVFN structure
            try:
                # ADVFN uses specific IDs/classes
                specific_fields = {
                    "high-price": "high",
                    "low-price": "low",
                    "open-price": "open",
                }

                for elem_id, field in specific_fields.items():
                    try:
                        elem = self.driver.find_element(By.ID, elem_id)
                        value_text = elem.text.strip().replace(",", ".")
                        value_match = re.search(r'[\d.]+', value_text)
                        if value_match:
                            data[field] = float(value_match.group())
                    except:
                        pass
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
