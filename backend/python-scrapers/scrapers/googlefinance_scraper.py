"""
Google Finance Scraper - Real-time quotes and market data
Fonte: https://www.google.com/finance/
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


class GoogleFinanceScraper(BaseScraper):
    """
    Scraper for Google Finance quotes

    Provides:
    - Real-time price data
    - Price changes
    - Volume information
    - Market statistics
    - Company information
    """

    BASE_URL = "https://www.google.com/finance"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="GoogleFinance",
            source="GOOGLE_FINANCE",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            # Navigate to Google first
            self.driver.get("https://www.google.com")
            await asyncio.sleep(2)

            # Load Google OAuth cookies
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                for cookie in cookies:
                    # Google Finance uses google.com domain
                    if 'google.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                # Navigate to Google Finance
                self.driver.get(self.BASE_URL)
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. May have limited access.")

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
        await self.initialize()

        try:
            # Format ticker for Google Finance (BVMF for Brazilian stocks)
            if ":" not in ticker:
                # Add BVMF prefix for Brazilian stocks
                formatted_ticker = f"BVMF:{ticker.upper()}"
            else:
                formatted_ticker = ticker.upper()

            # Navigate to quote page
            url = f"{self.BASE_URL}/quote/{formatted_ticker}"
            logger.info(f"Navigating to {url}")

            self.driver.get(url)
            await asyncio.sleep(3)

            # Check if ticker exists
            page_source = self.driver.page_source.lower()
            if "não encontrado" in page_source or "not found" in page_source or "no results" in page_source:
                # Try without BVMF prefix
                if formatted_ticker.startswith("BVMF:"):
                    ticker_no_prefix = formatted_ticker.replace("BVMF:", "")
                    url = f"{self.BASE_URL}/quote/{ticker_no_prefix}"
                    self.driver.get(url)
                    await asyncio.sleep(3)
                else:
                    return ScraperResult(
                        success=False,
                        error=f"Ticker {ticker} not found on Google Finance",
                        source=self.source,
                    )

            # Extract quote data
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

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract quote data from Google Finance page"""
        try:
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

            # Company name
            try:
                name_selectors = [
                    "div.zzDege",
                    "[class*='company-name']",
                    "h1",
                ]

                for selector in name_selectors:
                    try:
                        name_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if name_elem.text.strip():
                            data["company_name"] = name_elem.text.strip()
                            break
                    except:
                        continue
            except:
                pass

            # Current price
            try:
                price_selectors = [
                    "div.YMlKec.fxKbKc",
                    "[class*='YMlKec']",
                    "div[data-last-price]",
                ]

                for selector in price_selectors:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_elem.text.strip().replace("R$", "").replace(",", "").replace(" ", "")
                        price_match = re.search(r'[\d.]+', price_text)
                        if price_match:
                            data["price"] = float(price_match.group())
                            break
                    except:
                        continue

                # Try data attribute
                if not data["price"]:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-last-price]")
                        price_val = price_elem.get_attribute("data-last-price")
                        if price_val:
                            data["price"] = float(price_val)
                    except:
                        pass
            except:
                pass

            # Price change and change percent
            try:
                change_selectors = [
                    "div.JwB6zf",
                    "[class*='JwB6zf']",
                    "[data-last-change]",
                ]

                for selector in change_selectors:
                    try:
                        change_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        change_text = change_elem.text.strip()

                        # Extract change value
                        change_match = re.search(r'([-+]?[\d.,]+)', change_text)
                        if change_match:
                            change_val = change_match.group(1).replace(",", "")
                            data["change"] = float(change_val)

                        # Extract percent (usually in parentheses)
                        percent_match = re.search(r'\(([-+]?[\d.,]+)%\)', change_text)
                        if percent_match:
                            percent_val = percent_match.group(1).replace(",", "")
                            data["change_percent"] = float(percent_val)

                        if data["change"] or data["change_percent"]:
                            break
                    except:
                        continue
            except:
                pass

            # Volume and other stats from data panel
            try:
                # Google Finance uses divs with specific classes for stats
                stat_sections = self.driver.find_elements(By.CSS_SELECTOR, "div.P6K39c")

                for section in stat_sections:
                    try:
                        label_elem = section.find_element(By.CSS_SELECTOR, "div.mfs7Fc")
                        value_elem = section.find_element(By.CSS_SELECTOR, "div.P6K39c")

                        label = label_elem.text.strip().lower()
                        value = value_elem.text.strip()

                        self._parse_stat(data, label, value)
                    except:
                        continue

            except:
                pass

            # Try alternative stat extraction
            try:
                # Stats might be in table-like structure
                rows = self.driver.find_elements(By.CSS_SELECTOR, "div[class*='stat']")

                for row in rows:
                    try:
                        text = row.text.strip()
                        # Split by newline or colon
                        parts = text.split("\n")
                        if len(parts) >= 2:
                            label = parts[0].lower()
                            value = parts[1]
                            self._parse_stat(data, label, value)
                    except:
                        continue
            except:
                pass

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
                volume_match = re.search(r'([\d.]+)([KMB])?', volume_text)
                if volume_match:
                    val = float(volume_match.group(1))
                    suffix = volume_match.group(2)
                    multiplier = {"K": 1000, "M": 1000000, "B": 1000000000}.get(suffix, 1)
                    data["volume"] = int(val * multiplier)

            # High
            elif "high" in label or "máxima" in label or "alta" in label:
                value_text = value.replace(",", "")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["high"] = float(value_match.group())

            # Low
            elif "low" in label or "mínima" in label or "baixa" in label:
                value_text = value.replace(",", "")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["low"] = float(value_match.group())

            # Open
            elif "open" in label or "abertura" in label:
                value_text = value.replace(",", "")
                value_match = re.search(r'[\d.]+', value_text)
                if value_match:
                    data["open"] = float(value_match.group())

            # Previous close
            elif "prev" in label or "anterior" in label or "close" in label:
                value_text = value.replace(",", "")
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
