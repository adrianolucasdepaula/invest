"""
TradingView Scraper - Análise técnica e gráficos
Fonte: https://br.tradingview.com/
Requer login via Google OAuth

MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
import asyncio
import json
from datetime import datetime
import pytz
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class TradingViewScraper(BaseScraper):
    """
    Scraper for TradingView technical analysis

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing
    instead of multiple Selenium find_element calls. ~10x faster!

    Dados extraídos:
    - Indicadores técnicos
    - Recomendações (buy/sell/neutral)
    - Osciladores
    - Médias móveis
    """

    BASE_URL = "https://br.tradingview.com"
    COOKIES_FILE = "/app/data/cookies/tradingview_session.json"

    def __init__(self):
        super().__init__(
            name="TradingView",
            source="TRADINGVIEW",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # Navigate to site
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            cookies_path = Path(self.COOKIES_FILE)
            if cookies_path.exists():
                try:
                    with open(cookies_path, 'r') as f:
                        session_data = json.load(f)

                    # Handle both formats: list [...] or dict {"cookies": [...]}
                    if isinstance(session_data, list):
                        cookies = session_data
                    else:
                        cookies = session_data.get('cookies', [])

                    if cookies:
                        await self.page.context.add_cookies(cookies)
                        logger.info(f"Loaded {len(cookies)} cookies for TradingView")

                        # Refresh to apply cookies
                        await self.page.reload(wait_until="load")
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load cookies: {e}")
            else:
                logger.warning("TradingView cookies not found. Will attempt without login.")

            # Verify login
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some data may not be accessible")

        except Exception as e:
            logger.error(f"Error initializing TradingView scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        try:
            html = await self.page.content()
            # Check for logout indicators
            logout_indicators = ['sair', 'logout', 'signout', 'profile', 'minha-conta', 'user-menu']
            html_lower = html.lower()
            return any(indicator in html_lower for indicator in logout_indicators)
        except:
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape technical analysis from TradingView

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with technical indicators
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            # Use symbols page for summary data (easier to parse than chart)
            url = f"{self.BASE_URL}/symbols/BMFBOVESPA-{ticker.upper()}/technicals/"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright)
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(4)

            # Extract data
            data = await self._extract_data(ticker)

            if data and data.get("ticker"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": url,
                        "requires_login": True,
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract data from TradingView",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping TradingView for {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract technical analysis data

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "source": "TradingView",
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "recommendation": None,
                "technical_indicators": {},
                "oscillators": {},
                "moving_averages": {},
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract overall recommendation (Buy/Sell/Neutral)
            try:
                rec_selectors = [
                    ".speedometerSignal-pyzN--tL",
                    "[class*='speedometerSignal']",
                    ".recommendation",
                    "[data-testid='recommendation']",
                ]

                for selector in rec_selectors:
                    rec_elem = soup.select_one(selector)
                    if rec_elem:
                        rec_text = rec_elem.get_text().strip().upper()
                        if rec_text in ["COMPRA", "COMPRA FORTE", "BUY", "STRONG BUY"]:
                            data["recommendation"] = "BUY"
                        elif rec_text in ["VENDA", "VENDA FORTE", "SELL", "STRONG SELL"]:
                            data["recommendation"] = "SELL"
                        elif rec_text in ["NEUTRO", "NEUTRAL"]:
                            data["recommendation"] = "NEUTRAL"
                        break

            except Exception as e:
                logger.debug(f"Could not extract recommendation: {e}")

            # Extract technical indicators from tables
            try:
                tables = soup.select("table")

                for table in tables:
                    rows = table.select("tr")

                    for row in rows:
                        cells = row.select("td")

                        if len(cells) >= 2:
                            indicator_name = cells[0].get_text().strip()
                            indicator_value = cells[1].get_text().strip()

                            if indicator_name and indicator_value:
                                # Categorize indicators
                                name_lower = indicator_name.lower()

                                if any(x in name_lower for x in ['rsi', 'stoch', 'cci', 'adx', 'atr', 'macd']):
                                    data["oscillators"][indicator_name] = self._parse_value(indicator_value)
                                elif any(x in name_lower for x in ['ma', 'ema', 'sma', 'média']):
                                    data["moving_averages"][indicator_name] = self._parse_value(indicator_value)
                                else:
                                    data["technical_indicators"][indicator_name] = self._parse_value(indicator_value)

            except Exception as e:
                logger.debug(f"Error extracting table data: {e}")

            # Extract from cards/divs
            try:
                # TradingView uses various card structures
                cards = soup.select("[class*='container'], [class*='indicator'], [class*='cell']")

                for card in cards:
                    try:
                        label_elem = card.select_one("[class*='title'], [class*='label'], span:first-child")
                        value_elem = card.select_one("[class*='value'], strong, span:last-child")

                        if label_elem and value_elem:
                            label = label_elem.get_text().strip()
                            value = value_elem.get_text().strip()

                            if label and value and label != value:
                                data["technical_indicators"][label] = self._parse_value(value)

                    except:
                        continue

            except Exception as e:
                logger.debug(f"Error extracting card data: {e}")

            logger.debug(f"Extracted TradingView data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _parse_value(self, value_text: str) -> Optional[float]:
        """Parse numeric value from text"""
        try:
            if not value_text or value_text in ["-", "N/A", "n/a", "", "—", "–"]:
                return None

            # Remove common characters
            value_text = value_text.replace("%", "").replace("R$", "").strip()

            # Handle Brazilian number format
            value_text = value_text.replace(".", "").replace(",", ".")

            return float(value_text)

        except:
            return value_text  # Return as string if not numeric

    async def health_check(self) -> bool:
        """Check if TradingView is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_tradingview():
    """Test TradingView scraper"""
    scraper = TradingViewScraper()

    try:
        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Recommendation: {result.data.get('recommendation', 'N/A')}")
            print(f"Oscillators: {result.data.get('oscillators', {})}")
            print(f"Moving Averages: {result.data.get('moving_averages', {})}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_tradingview())
