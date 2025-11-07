"""
Fundamentei Scraper - Análise fundamentalista de ações
Fonte: https://fundamentei.com/
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class FundamenteiScraper(BaseScraper):
    """Scraper for Fundamentei fundamental analysis"""

    BASE_URL = "https://fundamentei.com"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Fundamentei",
            source="FUNDAMENTEI",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            # Navigate to site
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Load cookies
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                for cookie in cookies:
                    if 'fundamentei.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                # Refresh page to apply cookies
                self.driver.refresh()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. Will attempt without login.")

            # Verify login
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some data may not be accessible")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Fundamentei scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in via Google"""
        logout_selectors = [
            "//a[contains(text(), 'Sair')]",
            "//button[contains(text(), 'Sair')]",
            "//a[contains(@href, 'logout')]",
            ".user-menu",
            "[data-testid='user-menu']",
            ".avatar",
        ]

        for selector in logout_selectors:
            try:
                if selector.startswith("//"):
                    elements = self.driver.find_elements(By.XPATH, selector)
                else:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                if elements:
                    logger.info("User logged in successfully")
                    return True
            except:
                continue

        return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Fundamentei

        Args:
            ticker: Stock ticker (e.g., "PETR4")

        Returns:
            ScraperResult with fundamental indicators
        """
        await self.initialize()

        try:
            # Build URL
            url = f"{self.BASE_URL}/acoes/{ticker.upper()}"
            logger.info(f"Scraping Fundamentei for {ticker}: {url}")

            self.driver.get(url)
            await asyncio.sleep(4)

            # Check if page loaded correctly
            if "não encontrada" in self.driver.page_source.lower() or "404" in self.driver.page_source:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": url, "requires_login": True},
                )

            return ScraperResult(
                success=False,
                error="Failed to extract data",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Fundamentei for {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract fundamental data from page"""
        data = {
            "ticker": ticker.upper(),
            "source": "Fundamentei",
            "scraped_at": datetime.now().isoformat(),
            "indicators": {},
        }

        try:
            # Extract company name
            try:
                name_elem = self.driver.find_element(By.CSS_SELECTOR, "h1, .company-name, [data-testid='company-name']")
                data["company_name"] = name_elem.text.strip()
            except:
                pass

            # Extract price
            try:
                price_elem = self.driver.find_element(By.CSS_SELECTOR, ".price, .stock-price, [data-testid='price']")
                price_text = price_elem.text.strip().replace("R$", "").replace(",", ".").strip()
                data["price"] = self._parse_number(price_text)
            except:
                pass

            # Extract indicators using multiple strategies
            indicators = await self._extract_indicators()
            if indicators:
                data["indicators"] = indicators

            # Extract sector/segment
            try:
                sector_elem = self.driver.find_element(By.CSS_SELECTOR, ".sector, .segment, [data-testid='sector']")
                data["sector"] = sector_elem.text.strip()
            except:
                pass

            return data if data.get("indicators") else None

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    async def _extract_indicators(self) -> Dict[str, Any]:
        """Extract financial indicators"""
        indicators = {}

        # Common indicator labels and their keys
        indicator_map = {
            # Valuation
            "P/L": "pl",
            "P/VP": "pvp",
            "EV/EBIT": "ev_ebit",
            "EV/EBITDA": "ev_ebitda",
            "PSR": "psr",
            "P/Ativo": "p_ativo",
            "P/Cap.Giro": "p_cap_giro",
            "P/EBIT": "p_ebit",

            # Profitability
            "Marg. Bruta": "margem_bruta",
            "Marg. EBIT": "margem_ebit",
            "Marg. EBITDA": "margem_ebitda",
            "Marg. Líquida": "margem_liquida",
            "ROE": "roe",
            "ROA": "roa",
            "ROIC": "roic",

            # Growth
            "Cresc. Receita 5a": "crescimento_receita_5a",
            "CAGR Receita": "cagr_receita",
            "CAGR Lucro": "cagr_lucro",

            # Dividend
            "Dividend Yield": "dividend_yield",
            "DY": "dividend_yield",
            "Payout": "payout",

            # Debt
            "Dív.Líq/Patrim": "divida_liquida_patrimonio",
            "Dív.Líq/EBIT": "divida_liquida_ebit",
            "Dív.Líq/EBITDA": "divida_liquida_ebitda",
            "PL/Ativos": "pl_ativos",

            # Liquidity
            "Liquidez Corr": "liquidez_corrente",
            "Liquidez 2 meses": "liquidez_2_meses",
            "Vol. Médio": "volume_medio",
        }

        try:
            # Strategy 1: Find table rows with indicator labels
            rows = self.driver.find_elements(By.CSS_SELECTOR, "tr, .indicator-row, .metric-row")

            for row in rows:
                try:
                    # Get label and value from row
                    cells = row.find_elements(By.CSS_SELECTOR, "td, th, .label, .value, span")

                    if len(cells) >= 2:
                        label = cells[0].text.strip()
                        value_text = cells[1].text.strip()

                        # Check if label matches known indicator
                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label.lower() in label.lower():
                                value = self._parse_indicator_value(value_text)
                                if value is not None:
                                    indicators[indicator_key] = value
                                break

                except:
                    continue

            # Strategy 2: Find divs/spans with data attributes
            elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-indicator], [data-metric], [data-value]")

            for elem in elements:
                try:
                    indicator_name = elem.get_attribute("data-indicator") or elem.get_attribute("data-metric")
                    value_text = elem.get_attribute("data-value") or elem.text.strip()

                    if indicator_name and value_text:
                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label.lower() in indicator_name.lower():
                                value = self._parse_indicator_value(value_text)
                                if value is not None:
                                    indicators[indicator_key] = value
                                break

                except:
                    continue

        except Exception as e:
            logger.error(f"Error extracting indicators: {e}")

        return indicators

    def _parse_indicator_value(self, value_text: str) -> Optional[float]:
        """Parse indicator value from text"""
        try:
            # Remove common characters
            value_text = value_text.replace("%", "").replace("R$", "").replace(".", "").replace(",", ".").strip()

            # Handle special cases
            if value_text in ["-", "N/A", "n/a", "", "—"]:
                return None

            # Parse number
            return float(value_text)

        except:
            return None

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            # Remove spaces and common characters
            text = text.replace(" ", "").replace(".", "").replace(",", ".").strip()
            return float(text)
        except:
            return None

    async def health_check(self) -> bool:
        """Check if Fundamentei is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
