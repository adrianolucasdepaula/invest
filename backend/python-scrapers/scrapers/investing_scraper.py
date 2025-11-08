"""
Investing.com Scraper - Market data and analysis
Fonte: https://br.investing.com/
Requer login via Google OAuth
"""
import asyncio
import pickle
import re
from datetime import datetime
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class InvestingScraper(BaseScraper):
    """
    Scraper for Investing.com market data

    Provides:
    - Real-time quotes
    - Price changes
    - Volume data
    - Technical indicators
    - Market analysis
    """

    BASE_URL = "https://br.investing.com"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Investing.com",
            source="INVESTING",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Load Google OAuth cookies
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                for cookie in cookies:
                    if 'investing.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                self.driver.refresh()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. May have limited access.")

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
        await self.initialize()

        try:
            # Map ticker to Investing.com format
            search_ticker = ticker.upper()

            # Navigate to search results or direct page
            url = f"{self.BASE_URL}/search/?q={search_ticker}"
            logger.info(f"Navigating to {url}")

            self.driver.get(url)
            await asyncio.sleep(3)

            # Try to find and click first result
            try:
                first_result = self.driver.find_element(
                    By.CSS_SELECTOR,
                    ".js-section-searchbar-results a, .searchResults a"
                )
                first_result.click()
                await asyncio.sleep(3)
            except:
                # Direct navigation to equities page
                url = f"{self.BASE_URL}/equities/{ticker.lower()}"
                self.driver.get(url)
                await asyncio.sleep(3)

            # Extract market data
            data = await self._extract_data(ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": self.driver.current_url,
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

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract market data from Investing.com page"""
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
                "prev_close": None,
                "market_cap": None,
            }

            # Current price
            try:
                price_selectors = [
                    "[data-test='instrument-price-last']",
                    ".instrument-price_last__KQzyA",
                    "span.last-price-value",
                    "[class*='price-last']",
                ]

                for selector in price_selectors:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_elem.text.strip().replace(",", ".")
                        # Extract numeric value
                        price_match = re.search(r'[\d.]+', price_text)
                        if price_match:
                            data["price"] = float(price_match.group())
                            break
                    except:
                        continue
            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            # Price change
            try:
                change_selectors = [
                    "[data-test='instrument-price-change']",
                    ".instrument-price_change__yU4F7",
                    "span.change-value",
                ]

                for selector in change_selectors:
                    try:
                        change_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        change_text = change_elem.text.strip().replace(",", ".")
                        change_match = re.search(r'[-+]?[\d.]+', change_text)
                        if change_match:
                            data["change"] = float(change_match.group())
                            break
                    except:
                        continue
            except:
                pass

            # Change percent
            try:
                percent_selectors = [
                    "[data-test='instrument-price-change-percent']",
                    ".instrument-price_changePercent__KVO8O",
                    "span.change-percent",
                ]

                for selector in percent_selectors:
                    try:
                        percent_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        percent_text = percent_elem.text.strip().replace("%", "").replace(",", ".")
                        percent_match = re.search(r'[-+]?[\d.]+', percent_text)
                        if percent_match:
                            data["change_percent"] = float(percent_match.group())
                            break
                    except:
                        continue
            except:
                pass

            # Volume
            try:
                volume_elem = self.driver.find_element(
                    By.XPATH,
                    "//dt[contains(text(), 'Volume') or contains(text(), 'Vol')]/following-sibling::dd[1]"
                )
                volume_text = volume_elem.text.strip().replace(".", "").replace(",", "")
                # Handle K, M, B suffixes
                volume_match = re.search(r'([\d.]+)([KMB])?', volume_text)
                if volume_match:
                    value = float(volume_match.group(1))
                    suffix = volume_match.group(2)
                    multiplier = {"K": 1000, "M": 1000000, "B": 1000000000}.get(suffix, 1)
                    data["volume"] = int(value * multiplier)
            except:
                pass

            # High/Low/Open/Previous Close - from data table
            table_mappings = {
                "Máxima": "high",
                "Max": "high",
                "Mínima": "low",
                "Min": "low",
                "Abertura": "open",
                "Open": "open",
                "Fech. Anterior": "prev_close",
                "Prev. Close": "prev_close",
            }

            try:
                # Find all dt/dd pairs
                dt_elements = self.driver.find_elements(By.TAG_NAME, "dt")

                for dt in dt_elements:
                    label = dt.text.strip()

                    for key, field in table_mappings.items():
                        if key in label:
                            try:
                                dd = dt.find_element(By.XPATH, "./following-sibling::dd[1]")
                                value_text = dd.text.strip().replace(",", ".")
                                value_match = re.search(r'[\d.]+', value_text)
                                if value_match:
                                    data[field] = float(value_match.group())
                            except:
                                pass
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
