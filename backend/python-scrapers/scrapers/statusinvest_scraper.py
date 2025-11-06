"""
StatusInvest Scraper - Fundamental data
"""
import asyncio
from typing import Dict, Any
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class StatusInvestScraper(BaseScraper):
    """
    Scraper for StatusInvest fundamental data
    """

    BASE_URL = "https://statusinvest.com.br/acoes/"

    def __init__(self):
        super().__init__(
            name="StatusInvest",
            source="STATUSINVEST",
            requires_login=False,
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from StatusInvest

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with fundamental data
        """
        try:
            # Create driver if not exists
            if not self.driver:
                self.driver = self._create_driver()

            # Build URL
            url = f"{self.BASE_URL}{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            # Navigate
            self.driver.get(url)

            # Wait for page to load
            await asyncio.sleep(2)

            # Check if ticker exists
            if "não encontrado" in self.driver.page_source.lower():
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
                    metadata={"url": url},
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract data",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False, error=str(e), source=self.source
            )

    async def _extract_data(self, ticker: str) -> Dict[str, Any]:
        """Extract fundamental data from page"""
        try:
            data = {
                "ticker": ticker.upper(),
                "company_name": None,
                "price": None,
                "dy": None,  # Dividend Yield
                "p_l": None,  # P/L
                "p_vp": None,  # P/VP
                "roe": None,
                "roic": None,
                "liquidity": None,
                "market_cap": None,
            }

            # Company name
            try:
                name_element = self.driver.find_element(
                    By.CSS_SELECTOR, "h1.lh-4, h4.company-name"
                )
                data["company_name"] = name_element.text.strip()
            except:
                pass

            # Current price
            try:
                price_element = self.driver.find_element(
                    By.CSS_SELECTOR, "[title='Valor atual do ativo'], .value"
                )
                price_text = price_element.text.strip().replace("R$", "").replace(",", ".")
                data["price"] = float(price_text)
            except:
                pass

            # Dividend Yield
            try:
                dy_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'DY')]/..//strong[@class='value']"
                )
                dy_text = dy_element.text.strip().replace("%", "").replace(",", ".")
                data["dy"] = float(dy_text)
            except:
                pass

            # P/L (Price/Earnings)
            try:
                pl_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'P/L')]/..//strong[@class='value']"
                )
                pl_text = pl_element.text.strip().replace(",", ".")
                data["p_l"] = float(pl_text)
            except:
                pass

            # P/VP (Price/Book Value)
            try:
                pvp_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'P/VP')]/..//strong[@class='value']"
                )
                pvp_text = pvp_element.text.strip().replace(",", ".")
                data["p_vp"] = float(pvp_text)
            except:
                pass

            # ROE
            try:
                roe_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'ROE')]/..//strong[@class='value']"
                )
                roe_text = roe_element.text.strip().replace("%", "").replace(",", ".")
                data["roe"] = float(roe_text)
            except:
                pass

            # ROIC
            try:
                roic_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'ROIC')]/..//strong[@class='value']"
                )
                roic_text = roic_element.text.strip().replace("%", "").replace(",", ".")
                data["roic"] = float(roic_text)
            except:
                pass

            # Liquidity
            try:
                liq_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'Liquidez')]/..//strong[@class='value']"
                )
                data["liquidity"] = liq_element.text.strip()
            except:
                pass

            # Market Cap
            try:
                cap_element = self.driver.find_element(
                    By.XPATH, "//strong[contains(text(), 'Valor de mercado')]/..//strong[@class='value']"
                )
                data["market_cap"] = cap_element.text.strip()
            except:
                pass

            logger.debug(f"Extracted data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None
