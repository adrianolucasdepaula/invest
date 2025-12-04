"""
Fundamentei Scraper - Análise fundamentalista de ações
Fonte: https://fundamentei.com/
Requer login via Google OAuth

MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class FundamenteiScraper(BaseScraper):
    """
    Scraper for Fundamentei fundamental analysis

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing
    instead of multiple Selenium find_element calls. ~10x faster!

    Dados extraídos:
    - Indicadores de valuation (P/L, P/VP, EV/EBITDA, etc.)
    - Indicadores de rentabilidade (ROE, ROIC, Margens, etc.)
    - Indicadores de crescimento (CAGR, etc.)
    - Indicadores de dividendos
    """

    BASE_URL = "https://fundamentei.com"
    COOKIES_FILE = "/app/data/cookies/fundamentei_session.json"

    def __init__(self):
        super().__init__(
            name="Fundamentei",
            source="FUNDAMENTEI",
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

            # Load cookies
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
                        logger.info(f"Loaded {len(cookies)} cookies for Fundamentei")

                        # Refresh page to apply cookies
                        await self.page.reload(wait_until="load")
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load cookies: {e}")
            else:
                logger.warning("Fundamentei cookies not found. Will attempt without login.")

            # Verify login
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some data may not be accessible")

        except Exception as e:
            logger.error(f"Error initializing Fundamentei scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in via Google"""
        try:
            html = await self.page.content()
            # Check for logout indicators
            logout_indicators = ['sair', 'logout', 'minha-conta', 'profile', 'avatar', 'user-menu']
            html_lower = html.lower()
            return any(indicator in html_lower for indicator in logout_indicators)
        except:
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Fundamentei

        Args:
            ticker: Stock ticker (e.g., "PETR4")

        Returns:
            ScraperResult with fundamental indicators
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            # Build URL
            url = f"{self.BASE_URL}/acoes/{ticker.upper()}"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright)
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Check if page loaded correctly (more specific check to avoid false positives)
            page_source = await self.page.content()
            page_lower = page_source.lower()
            not_found_indicators = [
                "página não encontrada",
                "ação não encontrada",
                "ativo não encontrado",
                "error 404",
                "<title>404</title>",
                "não foi possível encontrar",
            ]
            if any(indicator in page_lower for indicator in not_found_indicators):
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

            if data and (data.get("indicators") or data.get("price")):
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
        """
        Extract fundamental data from page

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "source": "Fundamentei",
                "scraped_at": datetime.now().isoformat(),
                "company_name": None,
                "price": None,
                "sector": None,
                "indicators": {},
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract company name
            try:
                name_elem = soup.select_one("h1, .company-name, [data-testid='company-name']")
                if name_elem:
                    data["company_name"] = name_elem.get_text().strip()
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Extract price
            try:
                price_elem = soup.select_one(".price, .stock-price, [data-testid='price']")
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    data["price"] = self._parse_number(price_text)
            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            # Extract indicators
            indicators = self._extract_indicators(soup)
            if indicators:
                data["indicators"] = indicators

            # Extract sector/segment
            try:
                sector_elem = soup.select_one(".sector, .segment, [data-testid='sector']")
                if sector_elem:
                    data["sector"] = sector_elem.get_text().strip()
            except Exception as e:
                logger.debug(f"Could not extract sector: {e}")

            return data if (data.get("indicators") or data.get("price")) else None

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    def _extract_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract financial indicators using BeautifulSoup"""
        indicators = {}

        # Common indicator labels and their keys
        indicator_map = {
            # Valuation
            "p/l": "p_l",
            "p/vp": "p_vp",
            "ev/ebit": "ev_ebit",
            "ev/ebitda": "ev_ebitda",
            "psr": "psr",
            "p/ativo": "p_ativos",
            "p/cap.giro": "p_cap_giro",
            "p/cap. giro": "p_cap_giro",
            "p/ebit": "p_ebit",

            # Profitability
            "marg. bruta": "margem_bruta",
            "margem bruta": "margem_bruta",
            "marg. ebit": "margem_ebit",
            "margem ebit": "margem_ebit",
            "marg. ebitda": "margem_ebitda",
            "margem ebitda": "margem_ebitda",
            "marg. líquida": "margem_liquida",
            "margem líquida": "margem_liquida",
            "roe": "roe",
            "roa": "roa",
            "roic": "roic",

            # Growth
            "cresc. receita 5a": "crescimento_receita_5a",
            "cagr receita": "cagr_receita",
            "cagr lucro": "cagr_lucro",

            # Dividend
            "dividend yield": "dy",
            "dy": "dy",
            "payout": "payout",

            # Debt
            "dív.líq/patrim": "div_liquida_patrim",
            "dív. líquida/patrimônio": "div_liquida_patrim",
            "dív.líq/ebit": "div_liquida_ebit",
            "dív.líq/ebitda": "div_liquida_ebitda",
            "pl/ativos": "pl_ativos",

            # Liquidity
            "liquidez corr": "liquidez_corrente",
            "liquidez corrente": "liquidez_corrente",
            "liquidez 2 meses": "liquidez_2meses",
            "vol. médio": "volume_medio",
            "volume médio": "volume_medio",

            # Per share
            "lpa": "lpa",
            "vpa": "vpa",
        }

        try:
            # Strategy 1: Find table rows with indicator labels
            rows = soup.select("tr, .indicator-row, .metric-row")

            for row in rows:
                try:
                    cells = row.select("td, th, .label, .value, span")

                    if len(cells) >= 2:
                        label = cells[0].get_text().strip().lower()
                        value_text = cells[1].get_text().strip()

                        # Check if label matches known indicator
                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in label:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

            # Strategy 2: Find divs/spans with data attributes
            elements = soup.select("[data-indicator], [data-metric], [data-value]")

            for elem in elements:
                try:
                    indicator_name = elem.get("data-indicator") or elem.get("data-metric")
                    value_text = elem.get("data-value") or elem.get_text().strip()

                    if indicator_name and value_text:
                        indicator_name_lower = indicator_name.lower()
                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in indicator_name_lower:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

            # Strategy 3: Look for common Fundamentei card patterns
            cards = soup.select(".card, .indicator-card, .metric-card, .info-card")

            for card in cards:
                try:
                    label_elem = card.select_one(".title, .label, .card-title, span:first-child")
                    value_elem = card.select_one(".value, .card-value, span:last-child, strong")

                    if label_elem and value_elem:
                        label = label_elem.get_text().strip().lower()
                        value_text = value_elem.get_text().strip()

                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in label:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

        except Exception as e:
            logger.error(f"Error extracting indicators: {e}")

        return indicators

    def _parse_indicator_value(self, value_text: str) -> Optional[float]:
        """Parse indicator value from text"""
        try:
            if not value_text or value_text in ["-", "N/A", "n/a", "", "—", "–"]:
                return None

            # Remove common characters
            value_text = value_text.replace("%", "").replace("R$", "").strip()

            # Handle Brazilian number format
            value_text = value_text.replace(".", "").replace(",", ".")

            return float(value_text)

        except Exception:
            return None

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            if not text:
                return None

            # Remove spaces and common characters
            text = text.replace("R$", "").replace("%", "").strip()
            text = text.replace(" ", "").replace(".", "").replace(",", ".")
            return float(text)
        except Exception:
            return None

    async def health_check(self) -> bool:
        """Check if Fundamentei is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_fundamentei():
    """Test Fundamentei scraper"""
    scraper = FundamenteiScraper()

    try:
        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_fundamentei())
