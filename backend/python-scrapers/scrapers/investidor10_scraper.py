"""
Investidor10 Scraper - Análise fundamentalista e rankings
Fonte: https://investidor10.com.br/
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


class Investidor10Scraper(BaseScraper):
    """
    Scraper for Investidor10 fundamental analysis

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing
    instead of multiple Selenium find_element calls. ~10x faster!

    Dados extraídos:
    - Indicadores de valuation (P/L, P/VP, EV/EBITDA, etc.)
    - Indicadores de rentabilidade (ROE, ROIC, Margens, etc.)
    - Indicadores de endividamento
    - Scores e rankings do Investidor10
    """

    BASE_URL = "https://investidor10.com.br"
    COOKIES_FILE = "/app/data/cookies/investidor10_session.json"

    def __init__(self):
        super().__init__(
            name="Investidor10",
            source="INVESTIDOR10",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # Navigate to base URL first
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
                        logger.info(f"Loaded {len(cookies)} cookies for Investidor10")

                        # Refresh to apply cookies
                        await self.page.reload(wait_until="load")
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load cookies: {e}")
            else:
                logger.warning("Investidor10 cookies not found. Will attempt without login.")

            # Verify login status
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some data may not be accessible")

        except Exception as e:
            logger.error(f"Error initializing Investidor10 scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        try:
            html = await self.page.content()
            # Check for logout indicators
            logout_indicators = ['sair', 'logout', 'minha-conta', 'profile']
            html_lower = html.lower()
            return any(indicator in html_lower for indicator in logout_indicators)
        except:
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Investidor10

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with fundamental data
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            url = f"{self.BASE_URL}/acoes/{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright)
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Check if ticker exists (more specific check to avoid false positives)
            page_source = await self.page.content()
            page_lower = page_source.lower()
            # Check for actual "not found" page indicators
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
            logger.error(f"Error scraping Investidor10 for {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract fundamental data

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "source": "Investidor10",
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "company_name": None,
                "price": None,
                "indicators": {},
                "scores": {},
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Company name
            try:
                name_elem = soup.select_one("h1, .company-name, ._card-header h2")
                if name_elem:
                    data["company_name"] = name_elem.get_text().strip()
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Current price
            try:
                price_elem = soup.select_one("._card-body .value, .cotacao, [data-testid='price'], .price-value")
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    data["price"] = self._parse_number(price_text)
            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            # Investidor10 score
            try:
                score_elem = soup.select_one(".nota, .score, [data-testid='score']")
                if score_elem:
                    score_text = score_elem.get_text().strip()
                    data["scores"]["nota_investidor10"] = self._parse_number(score_text)
            except Exception as e:
                logger.debug(f"Could not extract score: {e}")

            # Extract indicators
            indicators = self._extract_indicators(soup)
            if indicators:
                data["indicators"] = indicators

            # Extract scores/rankings
            scores = self._extract_scores(soup)
            if scores:
                data["scores"].update(scores)

            return data if (data.get("indicators") or data.get("price")) else None

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    def _extract_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract financial indicators using BeautifulSoup"""
        indicators = {}

        indicator_map = {
            "p/l": "p_l",
            "p/vp": "p_vp",
            "psr": "psr",
            "dividend yield": "dy",
            "dy": "dy",
            "p/ativo": "p_ativos",
            "p/cap.giro": "p_cap_giro",
            "p/cap. giro": "p_cap_giro",
            "p/ebit": "p_ebit",
            "p/ativ circ.liq": "p_ativ_circ_liq",
            "ev/ebit": "ev_ebit",
            "ev/ebitda": "ev_ebitda",
            "marg. bruta": "margem_bruta",
            "margem bruta": "margem_bruta",
            "marg. ebit": "margem_ebit",
            "margem ebit": "margem_ebit",
            "marg. líquida": "margem_liquida",
            "margem líquida": "margem_liquida",
            "ebit/ativo": "ebit_ativo",
            "roic": "roic",
            "roe": "roe",
            "roa": "roa",
            "liquidez corr": "liquidez_corrente",
            "liquidez corrente": "liquidez_corrente",
            "div br/patrim": "div_bruta_patrim",
            "dív. bruta/patrim": "div_bruta_patrim",
            "giro ativos": "giro_ativos",
            "cresc. rec 5a": "crescimento_receita_5a",
            "crescimento receita 5a": "crescimento_receita_5a",
            "lpa": "lpa",
            "vpa": "vpa",
            "payout": "payout",
            "dív. líquida/ebitda": "div_liquida_ebitda",
            "div. líquida/ebitda": "div_liquida_ebitda",
        }

        try:
            # Find all table rows
            rows = soup.select("tr")

            for row in rows:
                try:
                    cells = row.select("td, th")

                    if len(cells) >= 2:
                        label = cells[0].get_text().strip().lower()
                        value_text = cells[1].get_text().strip()

                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in label:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

            # Also try divs with _card-body class (common in Investidor10)
            cards = soup.select("._card-body, .indicator-card, .cell")

            for card in cards:
                try:
                    label_elem = card.select_one(".title, .label, ._card-title, span:first-child")
                    value_elem = card.select_one(".value, ._card-value, span:last-child")

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

    def _extract_scores(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract ranking scores using BeautifulSoup"""
        scores = {}

        try:
            # Investidor10 has various scoring systems
            score_selectors = [
                ".score-value",
                ".ranking-value",
                "[data-score]",
            ]

            for selector in score_selectors:
                try:
                    elements = soup.select(selector)

                    for elem in elements:
                        score_name = elem.get("data-score") or elem.get("title")
                        score_value = elem.get_text().strip()

                        if score_name and score_value:
                            scores[score_name] = self._parse_number(score_value)

                except Exception:
                    continue

        except Exception as e:
            logger.debug(f"Error extracting scores: {e}")

        return scores

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from text (consolidated parser)
        Handles Brazilian number format (comma as decimal separator)
        Handles percentages
        Handles billions/millions/thousands notation (B, BI, M, MI, K, T)
        Returns None for non-numeric values

        Examples:
        - "1.234.567,89" → 1234567.89
        - "1,5 Bi" → 1500000000
        - "500 Mi" → 500000000
        - "10,5 K" → 10500
        - "15,75%" → 15.75
        - "R$ 123,45" → 123.45
        """
        import re

        # Handle empty/invalid values
        if not value_text or value_text in ["-", "N/A", "n/a", "", "—", "–", "n/d"]:
            return None

        try:
            # Normalize: lowercase and strip whitespace
            text = value_text.lower().strip()

            # Remove common prefixes
            text = text.replace("r$", "").strip()

            # Check for percentage (preserve info but remove symbol)
            text = text.replace("%", "").strip()

            # Remove extra spaces
            text = text.replace(" ", "")

            # Detect and handle magnitude suffixes BEFORE removing letters
            multiplier = 1

            # Trillion (T, Tri)
            if "tri" in text or text.endswith("t"):
                multiplier = 1_000_000_000_000
                text = re.sub(r'tri?', '', text)
            # Billion (B, BI, Bi)
            elif "bi" in text or text.endswith("b"):
                multiplier = 1_000_000_000
                text = re.sub(r'bi?', '', text)
            # Million (M, MI, Mi)
            elif "mi" in text or text.endswith("m"):
                multiplier = 1_000_000
                text = re.sub(r'mi?', '', text)
            # Thousand (K, Mil)
            elif "mil" in text or text.endswith("k"):
                multiplier = 1_000
                text = re.sub(r'mil|k', '', text)

            # After handling suffixes, reject if there are still letters
            if any(c.isalpha() for c in text):
                return None

            # Replace Brazilian decimal separator
            # Thousands: 1.234.567 → 1234567
            # Decimal: 123,45 → 123.45
            text = text.replace(".", "").replace(",", ".")

            # Handle negative values (various Unicode minus signs)
            text = text.replace("−", "-").replace("–", "-")

            # Parse number and apply multiplier
            parsed = float(text) * multiplier

            return parsed

        except Exception:
            return None

    def _parse_indicator_value(self, value_text: str) -> Optional[float]:
        """Parse indicator value - delegates to _parse_value()"""
        return self._parse_value(value_text)

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text - delegates to _parse_value()"""
        return self._parse_value(text)

    async def health_check(self) -> bool:
        """Check if Investidor10 is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_investidor10():
    """Test Investidor10 scraper"""
    scraper = Investidor10Scraper()

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
    asyncio.run(test_investidor10())
